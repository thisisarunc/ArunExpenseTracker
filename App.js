import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  Platform,
  PermissionsAndroid,
  NativeModules,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { parseSMS, isBankSender } from './smsParser';

const { width } = Dimensions.get('window');

// Try to import SMS module (Android only)
let SmsAndroid = null;
if (Platform.OS === 'android') {
  try {
    const SmsModule = require('react-native-get-sms-android');
    SmsAndroid = SmsModule.default || SmsModule;
  } catch (e) {
    console.log('SMS module not available:', e);
  }
}


// Payment modes
const paymentModes = [
  { id: 'cash', name: 'Cash', emoji: '💵', color: '#4CAF50', bg: '#E8F5E9' },
  { id: 'credit', name: 'Credit Card', emoji: '💳', color: '#E91E63', bg: '#FCE4EC' },
  { id: 'debit', name: 'Debit Card', emoji: '💳', color: '#2196F3', bg: '#E3F2FD' },
  { id: 'upi', name: 'UPI', emoji: '📱', color: '#9C27B0', bg: '#F3E5F5' },
  { id: 'netbanking', name: 'Net Banking', emoji: '🏦', color: '#FF9800', bg: '#FFF3E0' },
];

// Icon library
const iconLibrary = {
  burger: { emoji: '🍔', bg: '#FFF3E5' },
  biryani: { emoji: '🍛', bg: '#FFF8DC' },
  coffee: { emoji: '☕', bg: '#F5F5DC' },
  pizza: { emoji: '🍕', bg: '#FFF3E0' },
  cake: { emoji: '🍰', bg: '#FFF0F5' },
  shopping: { emoji: '🛍️', bg: '#FFE4E1' },
  dress: { emoji: '👗', bg: '#FFF0F5' },
  bag: { emoji: '👜', bg: '#FFEFD5' },
  car: { emoji: '🚗', bg: '#E6E6FA' },
  auto: { emoji: '🛺', bg: '#FFFACD' },
  metro: { emoji: '🚇', bg: '#E6E6FA' },
  fuel: { emoji: '⛽', bg: '#FFE4E1' },
  plane: { emoji: '✈️', bg: '#E6F3FF' },
  house: { emoji: '🏠', bg: '#FFEFD5' },
  rent: { emoji: '🏢', bg: '#F0F0F0' },
  electricity: { emoji: '💡', bg: '#FFFACD' },
  water: { emoji: '💧', bg: '#E6F3FF' },
  gas: { emoji: '🔥', bg: '#FFE4E1' },
  wifi: { emoji: '📶', bg: '#E6E6FA' },
  phone: { emoji: '📱', bg: '#F0F0F0' },
  movie: { emoji: '🎬', bg: '#FFE4E1' },
  game: { emoji: '🎮', bg: '#F3E5FF' },
  party: { emoji: '🎉', bg: '#FFE4E1' },
  hospital: { emoji: '🏥', bg: '#FFE4E1' },
  medicine: { emoji: '💊', bg: '#FFF0F5' },
  gym: { emoji: '🏋️', bg: '#E6E6FA' },
  book: { emoji: '📚', bg: '#FFEFD5' },
  laptop: { emoji: '💻', bg: '#F0F0F0' },
  bill: { emoji: '📄', bg: '#F0F0F0' },
  tax: { emoji: '🧾', bg: '#F0F0F0' },
  insurance: { emoji: '🛡️', bg: '#E6F3FF' },
  invest: { emoji: '📈', bg: '#E5FFF5' },
  emi: { emoji: '🏦', bg: '#FFF3E0' },
  salon: { emoji: '💇', bg: '#FFF0F5' },
  family: { emoji: '👨‍👩‍👧', bg: '#FFE4E1' },
  donation: { emoji: '🙏', bg: '#FFF0F5' },
  salary: { emoji: '💰', bg: '#E5FFF5' },
  bonus: { emoji: '🎊', bg: '#FFFACD' },
  freelance: { emoji: '💼', bg: '#E6E6FA' },
  refund: { emoji: '💸', bg: '#E5FFF5' },
  interest: { emoji: '🏦', bg: '#FFF3E0' },
  groceries: { emoji: '🛒', bg: '#E8F5E9' },
  transport: { emoji: '🚌', bg: '#E3F2FD' },
  entertainment: { emoji: '🎭', bg: '#FCE4EC' },
  mobile: { emoji: '📱', bg: '#F3E5F5' },
  education: { emoji: '🎓', bg: '#E6E6FA' },
  food: { emoji: '🍽️', bg: '#FFF3E0' },
  other: { emoji: '📦', bg: '#F5F5F5' },
};

// Default categories
const defaultCategories = [
  { id: 'food', name: 'Food & Dining', icon: 'biryani', type: 'expense' },
  { id: 'groceries', name: 'Groceries', icon: 'groceries', type: 'expense' },
  { id: 'transport', name: 'Transport', icon: 'auto', type: 'expense' },
  { id: 'fuel', name: 'Fuel', icon: 'fuel', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: 'bag', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: 'movie', type: 'expense' },
  { id: 'rent', name: 'Rent', icon: 'rent', type: 'expense' },
  { id: 'electricity', name: 'Electricity', icon: 'electricity', type: 'expense' },
  { id: 'mobile', name: 'Mobile', icon: 'phone', type: 'expense' },
  { id: 'wifi', name: 'Internet', icon: 'wifi', type: 'expense' },
  { id: 'health', name: 'Health', icon: 'hospital', type: 'expense' },
  { id: 'medicine', name: 'Medicine', icon: 'medicine', type: 'expense' },
  { id: 'education', name: 'Education', icon: 'book', type: 'expense' },
  { id: 'emi', name: 'EMI', icon: 'emi', type: 'expense' },
  { id: 'insurance', name: 'Insurance', icon: 'insurance', type: 'expense' },
  { id: 'investment', name: 'Investment', icon: 'invest', type: 'expense' },
  { id: 'other', name: 'Other', icon: 'other', type: 'expense' },
  { id: 'salary', name: 'Salary', icon: 'salary', type: 'income' },
  { id: 'bonus', name: 'Bonus', icon: 'bonus', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: 'freelance', type: 'income' },
  { id: 'interest', name: 'Interest', icon: 'interest', type: 'income' },
  { id: 'refund', name: 'Refund', icon: 'refund', type: 'income' },
];

// Format currency
const formatCurrency = (amount) => {
  return '₹' + new Intl.NumberFormat('en-IN').format(Math.round(amount));
};

// Get month name
const getMonthName = (month) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month];
};

// Donut Chart Component
const DonutChart = ({ data, total }) => {
  const size = 200;
  const strokeWidth = 30;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const colors = ['#FF6B8A', '#9B6BFF', '#6BAFFF', '#FFB86B', '#6BFF9B', '#FF6BDF', '#6BFFF0', '#FFE86B'];
  let cumulativePercent = 0;

  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} fill="none" stroke="#F5F5F5" strokeWidth={strokeWidth} />
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.total / total) * 100 : 0;
          const strokeDasharray = circumference;
          const strokeDashoffset = circumference - (percentage / 100) * circumference;
          const rotation = (cumulativePercent / 100) * 360 - 90;
          cumulativePercent += percentage;
          return (
            <Circle key={item.id} cx={center} cy={center} r={radius} fill="none" stroke={colors[index % colors.length]} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} rotation={rotation} origin={`${center}, ${center}`} />
          );
        })}
      </Svg>
      <View style={styles.chartCenter}>
        <Text style={styles.chartLabel}>Total Expenses</Text>
        <Text style={styles.chartAmount}>{formatCurrency(total)}</Text>
      </View>
    </View>
  );
};

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [transactionType, setTransactionType] = useState('expense');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [newTransaction, setNewTransaction] = useState({
    amount: '',
    note: '',
    category: 'food',
    paymentMode: 'cash',
  });
  const [newCategory, setNewCategory] = useState({ name: '', icon: 'other', type: 'expense' });
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState(50000);
  const [chartView, setChartView] = useState('category');
  
  // SMS related states
  const [smsPermission, setSmsPermission] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [parsedSMS, setParsedSMS] = useState([]);
  const [selectedSMS, setSelectedSMS] = useState({});
  const [lastSyncDate, setLastSyncDate] = useState(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // Save data
  useEffect(() => {
    if (!loading) {
      saveData();
    }
  }, [transactions, categories, budget, lastSyncDate]);

  const loadData = async () => {
    try {
      const data = await AsyncStorage.getItem('moneyplus-data-v2');
      if (data) {
        const parsed = JSON.parse(data);
        setTransactions(parsed.transactions || []);
        setBudget(parsed.budget || 50000);
        setLastSyncDate(parsed.lastSyncDate || null);
        if (parsed.categories?.length > 0) {
          setCategories(parsed.categories);
        }
      }
    } catch (e) {
      console.log('Error loading data:', e);
    }
    setLoading(false);
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('moneyplus-data-v2', JSON.stringify({ 
        transactions, categories, budget, lastSyncDate 
      }));
    } catch (e) {
      console.log('Error saving data:', e);
    }
  };

  // Request SMS permission
  const requestSMSPermission = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'SMS reading is only available on Android devices.');
      return false;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS Permission',
          message: 'Money+ needs access to read your SMS to auto-detect bank transactions.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      setSmsPermission(isGranted);
      return isGranted;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  // Read SMS messages
  const readSMSMessages = async () => {
    if (!SmsAndroid) {
      Alert.alert(
        'SMS Feature',
        'SMS reading requires a native Android build. Use "eas build" to create an APK with this feature.\n\nFor now, you can manually add transactions.',
        [{ text: 'OK' }]
      );
      return;
    }

    const hasPermission = smsPermission || await requestSMSPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'SMS permission is required to read bank messages.');
      return;
    }

    setSmsLoading(true);
    
    try {
      // Read SMS from last 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      const filter = {
        box: 'inbox',
        minDate: thirtyDaysAgo,
        maxCount: 500,
      };

      SmsAndroid.list(
        JSON.stringify(filter),
        (fail) => {
          console.log('Failed to read SMS:', fail);
          setSmsLoading(false);
          Alert.alert('Error', 'Failed to read SMS messages.');
        },
        (count, smsList) => {
          const messages = JSON.parse(smsList);
          
          // Filter and parse bank SMS
          const bankMessages = messages
            .filter(sms => isBankSender(sms.address))
            .map(sms => {
              const parsed = parseSMS(
                sms.body, 
                sms.address, 
                new Date(parseInt(sms.date)).toISOString().split('T')[0]
              );
              return { ...sms, parsed };
            })
            .filter(sms => sms.parsed.isTransaction && sms.parsed.amount > 0)
            .sort((a, b) => parseInt(b.date) - parseInt(a.date));

          // Filter out already added transactions
          const existingIds = new Set(transactions.map(t => t.smsId));
          const newMessages = bankMessages.filter(sms => !existingIds.has(sms._id));

          setParsedSMS(newMessages);
          setSmsLoading(false);
          
          if (newMessages.length === 0) {
            Alert.alert('No New Transactions', 'No new bank transactions found in your SMS.');
          } else {
            setShowSMSModal(true);
          }
        }
      );
    } catch (error) {
      console.error('Error reading SMS:', error);
      setSmsLoading(false);
      Alert.alert('Error', 'Failed to read SMS messages.');
    }
  };

  // Toggle SMS selection
  const toggleSMSSelection = (smsId) => {
    setSelectedSMS(prev => ({
      ...prev,
      [smsId]: !prev[smsId]
    }));
  };

  // Select all SMS
  const selectAllSMS = () => {
    const allSelected = parsedSMS.every(sms => selectedSMS[sms._id]);
    if (allSelected) {
      setSelectedSMS({});
    } else {
      const newSelected = {};
      parsedSMS.forEach(sms => {
        newSelected[sms._id] = true;
      });
      setSelectedSMS(newSelected);
    }
  };

  // Import selected SMS as transactions
  const importSelectedSMS = () => {
    const selectedMessages = parsedSMS.filter(sms => selectedSMS[sms._id]);
    
    if (selectedMessages.length === 0) {
      Alert.alert('No Selection', 'Please select at least one transaction to import.');
      return;
    }

    const newTransactions = selectedMessages.map(sms => {
      const category = categories.find(c => c.id === sms.parsed.category) || 
                      categories.find(c => c.id === 'other');
      
      return {
        id: Date.now() + Math.random(),
        smsId: sms._id,
        amount: sms.parsed.amount,
        note: sms.parsed.merchant || category.name,
        category: sms.parsed.category || 'other',
        paymentMode: sms.parsed.paymentMode || 'debit',
        date: sms.parsed.date,
        type: sms.parsed.type,
        source: 'sms',
      };
    });

    setTransactions(prev => [...newTransactions, ...prev]);
    setLastSyncDate(new Date().toISOString());
    setShowSMSModal(false);
    setSelectedSMS({});
    setParsedSMS([]);
    
    Alert.alert('Success', `${newTransactions.length} transactions imported successfully!`);
  };

  const addTransaction = () => {
    const amount = parseFloat(newTransaction.amount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const cat = categories.find(c => c.id === newTransaction.category);
    const transaction = {
      id: Date.now(),
      amount,
      note: newTransaction.note || cat?.name || 'Transaction',
      category: newTransaction.category,
      paymentMode: newTransaction.paymentMode,
      date: new Date().toISOString().split('T')[0],
      type: transactionType,
      source: 'manual',
    };

    setTransactions(prev => [transaction, ...prev]);
    setNewTransaction({
      amount: '',
      note: '',
      category: transactionType === 'income' ? 'salary' : 'food',
      paymentMode: 'cash',
    });
    setShowAddModal(false);
  };

  const addCategory = () => {
    if (!newCategory.name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    const category = {
      id: `custom_${Date.now()}`,
      name: newCategory.name,
      icon: newCategory.icon,
      type: newCategory.type,
    };

    setCategories(prev => [...prev, category]);
    setNewCategory({ name: '', icon: 'other', type: 'expense' });
    setShowCategoryModal(false);
  };

  const deleteTransaction = (id) => {
    Alert.alert('Delete', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setTransactions(prev => prev.filter(t => t.id !== id)) },
    ]);
  };

  // Group transactions by date
  const groupByDate = (txns) => {
    const groups = {};
    txns.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(date => ({
        date,
        transactions: groups[date],
        totalExpense: groups[date].filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
        totalIncome: groups[date].filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      }));
  };

  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const categoryStats = categories
    .filter(c => c.type === 'expense')
    .map(cat => ({
      ...cat,
      total: monthTransactions.filter(t => t.category === cat.id && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  // Calculate payment mode statistics
  const paymentStats = paymentModes
    .map(mode => ({
      ...mode,
      total: monthTransactions.filter(t => t.paymentMode === mode.id && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    }))
    .filter(p => p.total > 0)
    .sort((a, b) => b.total - a.total);


  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const colors = ['#FF6B8A', '#9B6BFF', '#6BAFFF', '#FFB86B', '#6BFF9B', '#FF6BDF'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingIcon}>🌸</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9FC" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>💰 Money+</Text>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
            <Ionicons name="chevron-back" size={20} color="#FF9BB3" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{getMonthName(currentMonth).slice(0, 3)} {currentYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
            <Ionicons name="chevron-forward" size={20} color="#FF9BB3" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        {/* Home Tab */}
        {activeTab === 'home' && (
          <>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
              <View style={styles.balanceRow}>
                <View style={styles.incomeBox}>
                  <Ionicons name="trending-up" size={18} color="#4CAF50" />
                  <View>
                    <Text style={styles.miniLabel}>Income</Text>
                    <Text style={styles.incomeAmount}>{formatCurrency(totalIncome)}</Text>
                  </View>
                </View>
                <View style={styles.expenseBox}>
                  <Ionicons name="trending-down" size={18} color="#FF6B8A" />
                  <View>
                    <Text style={styles.miniLabel}>Expense</Text>
                    <Text style={styles.expenseAmount}>{formatCurrency(totalExpense)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* SMS Sync Button */}
            <TouchableOpacity 
              style={styles.syncButton} 
              onPress={readSMSMessages}
              disabled={smsLoading}
            >
              {smsLoading ? (
                <ActivityIndicator color="#FF9BB3" size="small" />
              ) : (
                <Ionicons name="sync" size={20} color="#FF9BB3" />
              )}
              <Text style={styles.syncButtonText}>
                {smsLoading ? 'Scanning SMS...' : 'Sync Bank SMS'}
              </Text>
              {lastSyncDate && (
                <Text style={styles.syncDate}>
                  Last: {new Date(lastSyncDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
              )}
            </TouchableOpacity>

            {/* Budget Progress */}
            <View style={styles.budgetSection}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetTitle}>Monthly Budget</Text>
                <Text style={styles.budgetValue}>{formatCurrency(totalExpense)} / {formatCurrency(budget)}</Text>
              </View>
              <View style={styles.budgetTrack}>
                <View style={[
                  styles.budgetFill, 
                  { 
                    width: `${Math.min((totalExpense / budget) * 100, 100)}%`,
                    backgroundColor: totalExpense > budget ? '#FF6B6B' : totalExpense > budget * 0.8 ? '#FFB347' : '#4CAF50'
                  }
                ]} />
              </View>
            </View>

            {/* Transactions */}
            <Text style={styles.sectionTitle}>Transactions</Text>
            {monthTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📝</Text>
                <Text style={styles.emptyText}>No transactions yet!</Text>
                <Text style={styles.emptySubtext}>Tap + or sync SMS to add</Text>
              </View>
            ) : (
              groupByDate(monthTransactions).map((group) => (
                <View key={group.date} style={styles.dateGroup}>
                  <View style={styles.dateHeader}>
                    <Text style={styles.dateHeaderText}>{formatDateHeader(group.date)}</Text>
                    <Text style={styles.dateHeaderAmount}>
                      {group.totalExpense > 0 && <Text style={{ color: '#FF6B8A' }}>-{formatCurrency(group.totalExpense)}</Text>}
                    </Text>
                  </View>
                  {group.transactions.map(t => {
                    const cat = categories.find(c => c.id === t.category) || categories[0];
                    const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                    const payMode = paymentModes.find(p => p.id === t.paymentMode) || paymentModes[0];
                    return (
                      <TouchableOpacity key={t.id} style={styles.transactionItem} onLongPress={() => deleteTransaction(t.id)}>
                        <View style={[styles.transactionIcon, { backgroundColor: iconData.bg }]}>
                          <Text style={{ fontSize: 22 }}>{iconData.emoji}</Text>
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionNote} numberOfLines={1}>{t.note}</Text>
                          <View style={styles.transactionMeta}>
                            <View style={[styles.paymentBadge, { backgroundColor: payMode.bg }]}>
                              <Text style={[styles.paymentBadgeText, { color: payMode.color }]}>
                                {payMode.emoji} {payMode.name.split(' ')[0]}
                              </Text>
                            </View>
                            {t.source === 'sms' && (
                              <View style={styles.smsBadge}>
                                <Text style={styles.smsBadgeText}>📱 Auto</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Text style={[styles.transactionAmount, { color: t.type === 'income' ? '#4CAF50' : '#FF6B8A' }]}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))
            )}
          </>
        )}

        {/* Charts Tab */}
        {activeTab === 'charts' && (
          <>
            {/* Chart View Toggle */}
            <View style={styles.chartToggle}>
              <TouchableOpacity 
                style={[styles.toggleBtn, chartView === 'category' && styles.toggleBtnActive]}
                onPress={() => setChartView('category')}
              >
                <Text style={[styles.toggleText, chartView === 'category' && styles.toggleTextActive]}>
                  🏷️ By Category
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleBtn, chartView === 'payment' && styles.toggleBtnActive]}
                onPress={() => setChartView('payment')}
              >
                <Text style={[styles.toggleText, chartView === 'payment' && styles.toggleTextActive]}>
                  💳 By Payment
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category View */}
            {chartView === 'category' && categoryStats.length > 0 ? (
              <>
                <DonutChart data={categoryStats} total={totalExpense} />
                {categoryStats.map((cat, index) => {
                  const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                  const percentage = totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(0) : 0;
                  return (
                    <View key={cat.id} style={styles.statsItem}>
                      <View style={[styles.statsIcon, { backgroundColor: iconData.bg }]}>
                        <Text style={{ fontSize: 20 }}>{iconData.emoji}</Text>
                      </View>
                      <View style={styles.statsInfo}>
                        <Text style={styles.statsName}>{cat.name}</Text>
                        <View style={styles.statsBar}>
                          <View style={[styles.statsBarFill, { width: `${percentage}%`, backgroundColor: colors[index % colors.length] }]} />
                        </View>
                      </View>
                      <View style={styles.statsRight}>
                        <Text style={[styles.statsPercent, { color: colors[index % colors.length] }]}>{percentage}%</Text>
                        <Text style={styles.statsAmount}>{formatCurrency(cat.total)}</Text>
                      </View>
                    </View>
                  );
                })}
              </>
            ) : chartView === 'category' && categoryStats.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📊</Text>
                <Text style={styles.emptyText}>No expense data</Text>
              </View>
            ) : null}

            {/* Payment View */}
            {chartView === 'payment' && paymentStats.length > 0 ? (
              <>
                <DonutChart data={paymentStats} total={totalExpense} />
                {paymentStats.map((payment, index) => {
                  const percentage = totalExpense > 0 ? ((payment.total / totalExpense) * 100).toFixed(0) : 0;
                  return (
                    <View key={payment.id} style={styles.statsItem}>
                      <View style={[styles.statsIcon, { backgroundColor: payment.bg }]}>
                        <Text style={{ fontSize: 20 }}>{payment.emoji}</Text>
                      </View>
                      <View style={styles.statsInfo}>
                        <Text style={styles.statsName}>{payment.name}</Text>
                        <View style={styles.statsBar}>
                          <View style={[styles.statsBarFill, { width: `${percentage}%`, backgroundColor: colors[index % colors.length] }]} />
                        </View>
                      </View>
                      <View style={styles.statsRight}>
                        <Text style={[styles.statsPercent, { color: colors[index % colors.length] }]}>{percentage}%</Text>
                        <Text style={styles.statsAmount}>{formatCurrency(payment.total)}</Text>
                      </View>
                    </View>
                  );
                })}
              </>
            ) : chartView === 'payment' && paymentStats.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📊</Text>
                <Text style={styles.emptyText}>No expense data</Text>
              </View>
            ) : null}
          </>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <>
            {/* SMS Sync Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>📱 SMS Auto-Sync</Text>
              <TouchableOpacity style={styles.settingsItem} onPress={readSMSMessages}>
                <Ionicons name="sync-circle" size={24} color="#FF9BB3" />
                <View style={styles.settingsItemInfo}>
                  <Text style={styles.settingsItemTitle}>Sync Bank SMS</Text>
                  <Text style={styles.settingsItemDesc}>Import transactions from bank messages</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
              
              <View style={styles.settingsItem}>
                <Ionicons name="time" size={24} color="#9B6BFF" />
                <View style={styles.settingsItemInfo}>
                  <Text style={styles.settingsItemTitle}>Last Synced</Text>
                  <Text style={styles.settingsItemDesc}>
                    {lastSyncDate 
                      ? new Date(lastSyncDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'Never synced'
                    }
                  </Text>
                </View>
              </View>
            </View>

            {/* Budget Section */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>🎯 Budget</Text>
              <View style={styles.budgetSetting}>
                <Text style={styles.settingLabel}>Monthly Budget</Text>
                <View style={styles.budgetInputRow}>
                  <Text style={styles.rupeeSign}>₹</Text>
                  <TextInput
                    style={styles.budgetInput}
                    value={budget.toString()}
                    onChangeText={(text) => setBudget(parseFloat(text) || 0)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Categories Section */}
            <View style={styles.settingsSection}>
              <View style={styles.catHeader}>
                <Text style={styles.settingsSectionTitle}>📁 Categories</Text>
                <TouchableOpacity style={styles.addCatBtn} onPress={() => setShowCategoryModal(true)}>
                  <Ionicons name="add" size={20} color="#FF9BB3" />
                </TouchableOpacity>
              </View>
              <View style={styles.catGrid}>
                {categories.filter(c => c.type === 'expense').slice(0, 8).map(cat => {
                  const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                  return (
                    <View key={cat.id} style={styles.catItem}>
                      <View style={[styles.catIcon, { backgroundColor: iconData.bg }]}>
                        <Text style={{ fontSize: 24 }}>{iconData.emoji}</Text>
                      </View>
                      <Text style={styles.catName} numberOfLines={1}>{cat.name}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Supported Banks */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>🏦 Supported Banks</Text>
              <Text style={styles.supportedBanks}>
                HDFC • ICICI • SBI • Axis • Kotak • IDFC • Yes Bank • PNB • BOB • Google Pay • PhonePe • Paytm • Amazon Pay • CRED
              </Text>
            </View>
          </>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Button */}
      <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { id: 'home', icon: 'home', label: 'Home' },
          { id: 'charts', icon: 'pie-chart', label: 'Charts' },
          { id: 'settings', icon: 'settings', label: 'Settings' },
        ].map(item => (
          <TouchableOpacity key={item.id} style={styles.navItem} onPress={() => setActiveTab(item.id)}>
            <Ionicons name={item.icon} size={24} color={activeTab === item.id ? '#FF9BB3' : '#B8B8D0'} />
            <Text style={[styles.navLabel, { color: activeTab === item.id ? '#FF9BB3' : '#B8B8D0' }]}>{item.label}</Text>
            {activeTab === item.id && <View style={styles.navDot} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Transaction Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Transaction</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#B8B8D0" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Type Toggle */}
              <View style={styles.typeToggle}>
                <TouchableOpacity
                  style={[styles.typeBtn, transactionType === 'expense' && styles.typeBtnActiveExpense]}
                  onPress={() => { setTransactionType('expense'); setNewTransaction(prev => ({ ...prev, category: 'food' })); }}
                >
                  <Text style={[styles.typeBtnText, transactionType === 'expense' && styles.typeBtnTextActiveExpense]}>💸 Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, transactionType === 'income' && styles.typeBtnActiveIncome]}
                  onPress={() => { setTransactionType('income'); setNewTransaction(prev => ({ ...prev, category: 'salary' })); }}
                >
                  <Text style={[styles.typeBtnText, transactionType === 'income' && styles.typeBtnTextActiveIncome]}>💰 Income</Text>
                </TouchableOpacity>
              </View>

              {/* Amount */}
              <View style={styles.amountSection}>
                <Text style={styles.currencySign}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0"
                  placeholderTextColor="#B8B8D0"
                  value={newTransaction.amount}
                  onChangeText={(text) => setNewTransaction(prev => ({ ...prev, amount: text }))}
                  keyboardType="numeric"
                />
              </View>

              {/* Note */}
              <TextInput
                style={styles.noteInput}
                placeholder="Add note..."
                placeholderTextColor="#B8B8D0"
                value={newTransaction.note}
                onChangeText={(text) => setNewTransaction(prev => ({ ...prev, note: text }))}
              />

              {/* Payment Mode */}
              {transactionType === 'expense' && (
                <>
                  <Text style={styles.sectionLabel}>💳 Payment Mode</Text>
                  <View style={styles.paymentGrid}>
                    {paymentModes.map(mode => {
                      const isSelected = newTransaction.paymentMode === mode.id;
                      return (
                        <TouchableOpacity
                          key={mode.id}
                          style={[styles.paymentOption, isSelected && { backgroundColor: mode.bg, borderColor: mode.color, borderWidth: 2 }]}
                          onPress={() => setNewTransaction(prev => ({ ...prev, paymentMode: mode.id }))}
                        >
                          <Text style={{ fontSize: 20 }}>{mode.emoji}</Text>
                          <Text style={[styles.paymentOptLabel, isSelected && { color: mode.color }]}>{mode.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Category */}
              <Text style={styles.sectionLabel}>📁 Category</Text>
              <View style={styles.categoryGrid}>
                {categories.filter(c => c.type === transactionType).map(cat => {
                  const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                  const isSelected = newTransaction.category === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryOption, isSelected && { backgroundColor: iconData.bg, borderColor: '#FF9BB3', borderWidth: 2 }]}
                      onPress={() => setNewTransaction(prev => ({ ...prev, category: cat.id }))}
                    >
                      <Text style={{ fontSize: 22 }}>{iconData.emoji}</Text>
                      <Text style={[styles.categoryOptLabel, isSelected && { color: '#5A5A7A' }]} numberOfLines={1}>{cat.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={addTransaction}>
                <Ionicons name="checkmark" size={22} color="#fff" />
                <Text style={styles.saveBtnText}>Save Transaction</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SMS Import Modal */}
      <Modal visible={showSMSModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📱 Import Transactions</Text>
              <TouchableOpacity onPress={() => { setShowSMSModal(false); setSelectedSMS({}); }}>
                <Ionicons name="close" size={24} color="#B8B8D0" />
              </TouchableOpacity>
            </View>

            {/* Select All */}
            <TouchableOpacity style={styles.selectAllRow} onPress={selectAllSMS}>
              <Ionicons 
                name={parsedSMS.every(sms => selectedSMS[sms._id]) ? "checkbox" : "square-outline"} 
                size={24} 
                color="#FF9BB3" 
              />
              <Text style={styles.selectAllText}>
                Select All ({Object.keys(selectedSMS).filter(k => selectedSMS[k]).length}/{parsedSMS.length})
              </Text>
            </TouchableOpacity>

            <ScrollView style={styles.smsListContainer}>
              {parsedSMS.map(sms => {
                const cat = categories.find(c => c.id === sms.parsed.category) || categories.find(c => c.id === 'other');
                const iconData = iconLibrary[cat?.icon] || iconLibrary.other;
                const payMode = paymentModes.find(p => p.id === sms.parsed.paymentMode) || paymentModes[0];
                const isSelected = selectedSMS[sms._id];
                
                return (
                  <TouchableOpacity 
                    key={sms._id} 
                    style={[styles.smsItem, isSelected && styles.smsItemSelected]}
                    onPress={() => toggleSMSSelection(sms._id)}
                  >
                    <Ionicons 
                      name={isSelected ? "checkbox" : "square-outline"} 
                      size={22} 
                      color={isSelected ? "#FF9BB3" : "#ccc"} 
                    />
                    <View style={[styles.smsIcon, { backgroundColor: iconData.bg }]}>
                      <Text style={{ fontSize: 18 }}>{iconData.emoji}</Text>
                    </View>
                    <View style={styles.smsInfo}>
                      <Text style={styles.smsMerchant} numberOfLines={1}>
                        {sms.parsed.merchant || cat?.name || 'Transaction'}
                      </Text>
                      <View style={styles.smsMetaRow}>
                        <Text style={[styles.smsType, { color: sms.parsed.type === 'income' ? '#4CAF50' : '#FF6B8A' }]}>
                          {sms.parsed.type === 'income' ? '↓ Income' : '↑ Expense'}
                        </Text>
                        <Text style={styles.smsDate}>{sms.parsed.date}</Text>
                      </View>
                      <View style={[styles.paymentBadge, { backgroundColor: payMode.bg, alignSelf: 'flex-start', marginTop: 4 }]}>
                        <Text style={[styles.paymentBadgeText, { color: payMode.color }]}>
                          {payMode.emoji} {payMode.name}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.smsAmount, { color: sms.parsed.type === 'income' ? '#4CAF50' : '#FF6B8A' }]}>
                      {sms.parsed.type === 'income' ? '+' : '-'}{formatCurrency(sms.parsed.amount)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity 
              style={[styles.saveBtn, { margin: 16 }]} 
              onPress={importSelectedSMS}
            >
              <Ionicons name="download" size={22} color="#fff" />
              <Text style={styles.saveBtnText}>
                Import {Object.keys(selectedSMS).filter(k => selectedSMS[k]).length} Transactions
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#B8B8D0" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.iconPreview}>
                <View style={[styles.previewIcon, { backgroundColor: (iconLibrary[newCategory.icon] || iconLibrary.other).bg }]}>
                  <Text style={{ fontSize: 32 }}>{(iconLibrary[newCategory.icon] || iconLibrary.other).emoji}</Text>
                </View>
                <TextInput
                  style={styles.categoryNameInput}
                  placeholder="Category name"
                  placeholderTextColor="#B8B8D0"
                  value={newCategory.name}
                  onChangeText={(text) => setNewCategory(prev => ({ ...prev, name: text }))}
                />
              </View>

              <View style={styles.typeToggle}>
                <TouchableOpacity
                  style={[styles.typeBtn, newCategory.type === 'expense' && styles.typeBtnActiveExpense]}
                  onPress={() => setNewCategory(prev => ({ ...prev, type: 'expense' }))}
                >
                  <Text style={[styles.typeBtnText, newCategory.type === 'expense' && styles.typeBtnTextActiveExpense]}>💸 Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, newCategory.type === 'income' && styles.typeBtnActiveIncome]}
                  onPress={() => setNewCategory(prev => ({ ...prev, type: 'income' }))}
                >
                  <Text style={[styles.typeBtnText, newCategory.type === 'income' && styles.typeBtnTextActiveIncome]}>💰 Income</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.iconGridTitle}>Choose Icon</Text>
              <View style={styles.iconGrid}>
                {Object.entries(iconLibrary).map(([key, data]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.iconOption, newCategory.icon === key && styles.iconOptionSelected, { backgroundColor: data.bg }]}
                    onPress={() => setNewCategory(prev => ({ ...prev, icon: key }))}
                  >
                    <Text style={{ fontSize: 22 }}>{data.emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={addCategory}>
                <Ionicons name="checkmark" size={22} color="#fff" />
                <Text style={styles.saveBtnText}>Create Category</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9FC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9FC' },
  loadingIcon: { fontSize: 48 },
  loadingText: { marginTop: 16, color: '#B8B8D0', fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  appTitle: { fontSize: 22, fontWeight: '800', color: '#FF9BB3' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, shadowColor: '#FF9BB3', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  monthBtn: { padding: 4 },
  monthText: { fontSize: 13, fontWeight: '600', color: '#5A5A7A', marginHorizontal: 8 },
  main: { flex: 1, paddingHorizontal: 16 },
  balanceCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 12, shadowColor: '#FF9BB3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  balanceLabel: { fontSize: 12, color: '#B8B8D0', marginBottom: 4 },
  balanceAmount: { fontSize: 32, fontWeight: '800', color: '#5A5A7A', marginBottom: 16 },
  balanceRow: { flexDirection: 'row', gap: 12 },
  incomeBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E8F5E9', padding: 12, borderRadius: 14 },
  expenseBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFE5E5', padding: 12, borderRadius: 14 },
  miniLabel: { fontSize: 10, color: '#888' },
  incomeAmount: { fontSize: 14, fontWeight: '700', color: '#4CAF50' },
  expenseAmount: { fontSize: 14, fontWeight: '700', color: '#FF6B8A' },
  syncButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 14, marginBottom: 12, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#FFE5E5' },
  syncButtonText: { fontSize: 14, fontWeight: '600', color: '#FF9BB3' },
  syncDate: { fontSize: 11, color: '#B8B8D0', marginLeft: 8 },
  budgetSection: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  budgetTitle: { fontSize: 12, fontWeight: '600', color: '#5A5A7A' },
  budgetValue: { fontSize: 11, color: '#B8B8D0' },
  budgetTrack: { height: 8, backgroundColor: '#F5F5F5', borderRadius: 8, overflow: 'hidden' },
  budgetFill: { height: '100%', borderRadius: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#5A5A7A', marginBottom: 12 },
  dateGroup: { marginBottom: 16 },
  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', marginBottom: 8 },
  dateHeaderText: { fontSize: 13, fontWeight: '700', color: '#FF9BB3' },
  dateHeaderAmount: { fontSize: 12, fontWeight: '600' },
  transactionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  transactionIcon: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  transactionInfo: { flex: 1, marginLeft: 12 },
  transactionNote: { fontSize: 13, fontWeight: '600', color: '#5A5A7A', marginBottom: 4 },
  transactionMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  paymentBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  paymentBadgeText: { fontSize: 9, fontWeight: '600' },
  smsBadge: { backgroundColor: '#E3F2FD', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  smsBadgeText: { fontSize: 8, color: '#2196F3', fontWeight: '600' },
  transactionAmount: { fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#5A5A7A' },
  emptySubtext: { fontSize: 13, color: '#B8B8D0', marginTop: 4 },
  chartCenter: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -50 }, { translateY: -20 }], alignItems: 'center' },
  chartLabel: { fontSize: 11, color: '#B8B8D0' },
  chartAmount: { fontSize: 18, fontWeight: '800', color: '#5A5A7A' },
  statsItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statsIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  statsInfo: { flex: 1, marginLeft: 12 },
  statsName: { fontSize: 13, fontWeight: '600', color: '#5A5A7A', marginBottom: 6 },
  statsBar: { height: 6, backgroundColor: '#F5F5F5', borderRadius: 6, overflow: 'hidden' },
  statsBarFill: { height: '100%', borderRadius: 6 },
  statsRight: { alignItems: 'flex-end', marginLeft: 12 },
  statsPercent: { fontSize: 13, fontWeight: '700' },
  statsAmount: { fontSize: 12, color: '#888', marginTop: 2 },
  settingsSection: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  settingsSectionTitle: { fontSize: 15, fontWeight: '700', color: '#5A5A7A', marginBottom: 12 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  settingsItemInfo: { flex: 1, marginLeft: 12 },
  settingsItemTitle: { fontSize: 14, fontWeight: '600', color: '#5A5A7A' },
  settingsItemDesc: { fontSize: 12, color: '#B8B8D0', marginTop: 2 },
  supportedBanks: { fontSize: 12, color: '#888', lineHeight: 20 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  addCatBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF0F5', justifyContent: 'center', alignItems: 'center' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catItem: { width: (width - 32 - 64) / 4, alignItems: 'center' },
  catIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  catName: { fontSize: 10, fontWeight: '600', color: '#5A5A7A', textAlign: 'center', marginTop: 4 },
  budgetSetting: { marginTop: 8 },
  settingLabel: { fontSize: 13, fontWeight: '600', color: '#5A5A7A', marginBottom: 8 },
  budgetInputRow: { flexDirection: 'row', alignItems: 'center' },
  rupeeSign: { fontSize: 24, color: '#B8B8D0' },
  budgetInput: { flex: 1, fontSize: 28, fontWeight: '700', color: '#5A5A7A', marginLeft: 8 },
  addBtn: { position: 'absolute', bottom: 90, alignSelf: 'center', width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF9BB3', justifyContent: 'center', alignItems: 'center', shadowColor: '#FF9BB3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, paddingBottom: 25, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  navItem: { alignItems: 'center', paddingHorizontal: 20 },
  navLabel: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FF9BB3', marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', paddingBottom: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#5A5A7A' },
  typeToggle: { flexDirection: 'row', gap: 10, padding: 14, paddingHorizontal: 20 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center' },
  typeBtnActiveExpense: { backgroundColor: '#FFE5E5' },
  typeBtnActiveIncome: { backgroundColor: '#E8F5E9' },
  typeBtnText: { fontSize: 13, fontWeight: '700', color: '#999' },
  typeBtnTextActiveExpense: { color: '#FF6B8A' },
  typeBtnTextActiveIncome: { color: '#4CAF50' },
  amountSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA', marginHorizontal: 20, padding: 16, borderRadius: 16, marginBottom: 16 },
  currencySign: { fontSize: 28, color: '#B8B8D0', fontWeight: '600' },
  amountInput: { fontSize: 36, fontWeight: '800', color: '#5A5A7A', marginLeft: 8, minWidth: 120, textAlign: 'center' },
  noteInput: { backgroundColor: '#FAFAFA', marginHorizontal: 20, padding: 14, borderRadius: 12, fontSize: 14, color: '#5A5A7A', marginBottom: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginLeft: 20, marginBottom: 10 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  paymentOption: { width: (width - 40 - 16) / 3, padding: 12, borderRadius: 12, backgroundColor: '#f9f9f9', alignItems: 'center' },
  paymentOptLabel: { fontSize: 10, fontWeight: '600', color: '#888', textAlign: 'center', marginTop: 4 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
  categoryOption: { width: (width - 40 - 24) / 4, padding: 10, borderRadius: 12, backgroundColor: '#f9f9f9', alignItems: 'center' },
  categoryOptLabel: { fontSize: 9, fontWeight: '600', color: '#B8B8D0', textAlign: 'center', marginTop: 4 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF9BB3', marginHorizontal: 20, padding: 16, borderRadius: 14, gap: 8, shadowColor: '#FF9BB3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  selectAllRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', gap: 10 },
  selectAllText: { fontSize: 14, fontWeight: '600', color: '#5A5A7A' },
  smsListContainer: { maxHeight: 400 },
  smsItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', gap: 10 },
  smsItemSelected: { backgroundColor: '#FFF5F8' },
  smsIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  smsInfo: { flex: 1 },
  smsMerchant: { fontSize: 13, fontWeight: '600', color: '#5A5A7A' },
  smsMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  smsType: { fontSize: 11, fontWeight: '600' },
  smsDate: { fontSize: 11, color: '#B8B8D0' },
  smsAmount: { fontSize: 14, fontWeight: '700' },
  iconPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', marginHorizontal: 20, padding: 14, borderRadius: 14, marginBottom: 16, marginTop: 10 },
  previewIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  categoryNameInput: { flex: 1, fontSize: 16, fontWeight: '600', color: '#5A5A7A', marginLeft: 14 },
  iconGridTitle: { fontSize: 12, fontWeight: '600', color: '#888', marginLeft: 20, marginBottom: 10 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
  iconOption: { width: (width - 40 - 32) / 5, aspectRatio: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  iconOptionSelected: { borderWidth: 3, borderColor: '#FF9BB3' },
  chartToggle: { flexDirection: 'row', backgroundColor: '#F8F8FA', padding: 4, borderRadius: 12, marginBottom: 20 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#FF9BB3', shadowColor: '#FF9BB3', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#B8B8D0' },
  toggleTextActive: { color: '#fff' },
});
