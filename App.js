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
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorMessage}>
              {this.state.error?.message || 'An unexpected error occurred'}
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => this.setState({ hasError: false, error: null })}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// Safe SMS parser import with fallback
let parseSMS = null;
let isBankSender = null;
try {
  const smsParserModule = require('./smsParser');
  parseSMS = smsParserModule.parseSMS;
  isBankSender = smsParserModule.isBankSender;
} catch (e) {
  console.log('SMS parser not available:', e);
  parseSMS = (text) => null;
  isBankSender = (sender) => false;
}

// Try to import SMS module (Android only) with better error handling
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
  { id: 'food', name: 'Food & Dining', icon: 'food', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping', type: 'expense' },
  { id: 'transport', name: 'Transport', icon: 'transport', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: 'entertainment', type: 'expense' },
  { id: 'bills', name: 'Bills & Utilities', icon: 'bill', type: 'expense' },
  { id: 'health', name: 'Healthcare', icon: 'hospital', type: 'expense' },
  { id: 'groceries', name: 'Groceries', icon: 'groceries', type: 'expense' },
  { id: 'education', name: 'Education', icon: 'education', type: 'expense' },
  { id: 'salary', name: 'Salary', icon: 'salary', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: 'freelance', type: 'income' },
  { id: 'investment', name: 'Investment', icon: 'invest', type: 'income' },
];

function AppContent() {
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

  // Load data with error handling
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
      Alert.alert('Error', 'Failed to load data. Using defaults.');
    } finally {
      setLoading(false);
    }
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

    if (!SmsAndroid) {
      Alert.alert('Not Available', 'SMS module is not available in this build.');
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
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setSmsPermission(true);
        return true;
      } else {
        Alert.alert('Permission Denied', 'SMS permission is required to read bank messages.');
        return false;
      }
    } catch (err) {
      console.warn(err);
      Alert.alert('Error', 'Failed to request SMS permission.');
      return false;
    }
  };

  // Read SMS messages
  const readSMSMessages = async () => {
    if (!SmsAndroid) {
      Alert.alert('Not Available', 'SMS reading is not available in this build.');
      return;
    }

    setSmsLoading(true);
    try {
      const hasPermission = smsPermission || await requestSMSPermission();
      if (!hasPermission) {
        setSmsLoading(false);
        return;
      }

      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      const filter = {
        box: 'inbox',
        minDate: thirtyDaysAgo,
        maxCount: 100,
      };

      SmsAndroid.list(
        JSON.stringify(filter),
        (fail) => {
          console.log('Failed to list SMS:', fail);
          Alert.alert('Error', 'Failed to read SMS messages.');
          setSmsLoading(false);
        },
        (count, smsList) => {
          const messages = JSON.parse(smsList);
          const bankMessages = messages.filter(msg => 
            isBankSender && isBankSender(msg.address)
          );

          const parsed = bankMessages
            .map(msg => {
              const transaction = parseSMS ? parseSMS(msg.body) : null;
              if (transaction) {
                return {
                  ...transaction,
                  smsId: msg._id,
                  date: new Date(parseInt(msg.date)),
                  sender: msg.address,
                };
              }
              return null;
            })
            .filter(Boolean)
            .sort((a, b) => b.date - a.date);

          setParsedSMS(parsed);
          setLastSyncDate(new Date());
          setShowSMSModal(true);
          setSmsLoading(false);
        }
      );
    } catch (error) {
      console.log('Error reading SMS:', error);
      Alert.alert('Error', 'Failed to read SMS messages.');
      setSmsLoading(false);
    }
  };

  // Helper functions
  const formatCurrency = (amount) => {
    return `₹${Math.abs(amount).toLocaleString('en-IN')}`;
  };

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    const today = new Date();
    if (currentMonth === today.getMonth() && currentYear === today.getFullYear()) return;
    
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Category statistics
  const getCategoryStats = () => {
    const stats = {};
    filteredTransactions
      .filter(t => t.type === transactionType)
      .forEach(t => {
        if (!stats[t.category]) {
          stats[t.category] = { amount: 0, count: 0 };
        }
        stats[t.category].amount += t.amount;
        stats[t.category].count += 1;
      });
    
    return Object.entries(stats)
      .map(([cat, data]) => ({ category: cat, ...data }))
      .sort((a, b) => b.amount - a.amount);
  };

  const categoryStats = getCategoryStats();
  const totalAmount = categoryStats.reduce((sum, s) => sum + s.amount, 0);

  // Add transaction
  const addTransaction = () => {
    if (!newTransaction.amount || isNaN(parseFloat(newTransaction.amount))) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    const transaction = {
      id: Date.now().toString(),
      type: transactionType,
      amount: parseFloat(newTransaction.amount),
      note: newTransaction.note || 'No note',
      category: newTransaction.category,
      paymentMode: newTransaction.paymentMode,
      date: new Date().toISOString(),
    };

    setTransactions([transaction, ...transactions]);
    setNewTransaction({ amount: '', note: '', category: 'food', paymentMode: 'cash' });
    setShowAddModal(false);
  };

  // Add SMS transactions
  const addSMSTransactions = () => {
    const selected = Object.keys(selectedSMS).filter(id => selectedSMS[id]);
    if (selected.length === 0) {
      Alert.alert('No Selection', 'Please select at least one transaction to add.');
      return;
    }

    const newTrans = selected.map(id => {
      const sms = parsedSMS.find(s => s.smsId === id);
      return {
        id: Date.now().toString() + Math.random(),
        type: sms.type,
        amount: sms.amount,
        note: sms.merchant || 'SMS Transaction',
        category: sms.type === 'expense' ? 'food' : 'salary',
        paymentMode: 'upi',
        date: sms.date.toISOString(),
      };
    });

    setTransactions([...newTrans, ...transactions]);
    setSelectedSMS({});
    setShowSMSModal(false);
    Alert.alert('Success', `Added ${newTrans.length} transaction(s) from SMS.`);
  };

  // Add category
  const addCategory = () => {
    if (!newCategory.name.trim()) {
      Alert.alert('Invalid Name', 'Please enter a category name.');
      return;
    }

    const category = {
      id: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
      name: newCategory.name,
      icon: newCategory.icon,
      type: newCategory.type,
    };

    setCategories([...categories, category]);
    setNewCategory({ name: '', icon: 'other', type: 'expense' });
    setShowCategoryModal(false);
  };

  // Delete transaction
  const deleteTransaction = (id) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setTransactions(transactions.filter(t => t.id !== id));
        }}
      ]
    );
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

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => { setTransactionType('expense'); setShowAddModal(true); }}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#FFEBEF' }]}>
                  <Ionicons name="remove" size={24} color="#FF6B8A" />
                </View>
                <Text style={styles.actionText}>Add Expense</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => { setTransactionType('income'); setShowAddModal(true); }}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="add" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.actionText}>Add Income</Text>
              </TouchableOpacity>
              
              {Platform.OS === 'android' && SmsAndroid && (
                <TouchableOpacity 
                  style={styles.actionBtn}
                  onPress={readSMSMessages}
                  disabled={smsLoading}
                >
                  <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
                    {smsLoading ? (
                      <ActivityIndicator size="small" color="#9C27B0" />
                    ) : (
                      <Ionicons name="mail" size={24} color="#9C27B0" />
                    )}
                  </View>
                  <Text style={styles.actionText}>Sync SMS</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Recent Transactions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              {filteredTransactions.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>📝</Text>
                  <Text style={styles.emptyText}>No transactions yet</Text>
                  <Text style={styles.emptyHint}>Add your first transaction to get started</Text>
                </View>
              ) : (
                filteredTransactions.slice(0, 10).map(transaction => {
                  const cat = categories.find(c => c.id === transaction.category);
                  const icon = iconLibrary[cat?.icon || 'other'];
                  
                  return (
                    <TouchableOpacity
                      key={transaction.id}
                      style={styles.transactionItem}
                      onLongPress={() => deleteTransaction(transaction.id)}
                    >
                      <View style={[styles.transIcon, { backgroundColor: icon.bg }]}>
                        <Text style={styles.transEmoji}>{icon.emoji}</Text>
                      </View>
                      <View style={styles.transInfo}>
                        <Text style={styles.transTitle}>{cat?.name || 'Other'}</Text>
                        <Text style={styles.transNote}>{transaction.note}</Text>
                        <Text style={styles.transDate}>
                          {new Date(transaction.date).toLocaleDateString('en-IN', { 
                            day: 'numeric', month: 'short' 
                          })}
                        </Text>
                      </View>
                      <Text style={[
                        styles.transAmount,
                        transaction.type === 'income' ? styles.incomeText : styles.expenseText
                      ]}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <>
            <View style={styles.tabSelector}>
              <TouchableOpacity
                style={[styles.tabBtn, transactionType === 'expense' && styles.tabBtnActive]}
                onPress={() => setTransactionType('expense')}
              >
                <Text style={[styles.tabBtnText, transactionType === 'expense' && styles.tabBtnTextActive]}>
                  Expenses
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, transactionType === 'income' && styles.tabBtnActive]}
                onPress={() => setTransactionType('income')}
              >
                <Text style={[styles.tabBtnText, transactionType === 'income' && styles.tabBtnTextActive]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            {/* Donut Chart */}
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>
                {transactionType === 'expense' ? 'Expense' : 'Income'} by Category
              </Text>
              
              {categoryStats.length === 0 ? (
                <View style={styles.emptyChart}>
                  <Text style={styles.emptyIcon}>📊</Text>
                  <Text style={styles.emptyText}>No data available</Text>
                </View>
              ) : (
                <>
                  <View style={styles.donutContainer}>
                    <Svg width={200} height={200}>
                      {categoryStats.map((stat, index) => {
                        const percentage = (stat.amount / totalAmount) * 100;
                        const angle = (percentage / 100) * 360;
                        const prevAngles = categoryStats
                          .slice(0, index)
                          .reduce((sum, s) => sum + ((s.amount / totalAmount) * 360), 0);
                        
                        const startAngle = prevAngles - 90;
                        const endAngle = startAngle + angle;
                        
                        const radius = 80;
                        const innerRadius = 50;
                        
                        const startX = 100 + radius * Math.cos((startAngle * Math.PI) / 180);
                        const startY = 100 + radius * Math.sin((startAngle * Math.PI) / 180);
                        const endX = 100 + radius * Math.cos((endAngle * Math.PI) / 180);
                        const endY = 100 + radius * Math.sin((endAngle * Math.PI) / 180);
                        
                        const largeArc = angle > 180 ? 1 : 0;
                        
                        const innerStartX = 100 + innerRadius * Math.cos((startAngle * Math.PI) / 180);
                        const innerStartY = 100 + innerRadius * Math.sin((startAngle * Math.PI) / 180);
                        const innerEndX = 100 + innerRadius * Math.cos((endAngle * Math.PI) / 180);
                        const innerEndY = 100 + innerRadius * Math.sin((endAngle * Math.PI) / 180);
                        
                        const pathData = [
                          `M ${startX} ${startY}`,
                          `A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`,
                          `L ${innerEndX} ${innerEndY}`,
                          `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStartX} ${innerStartY}`,
                          'Z'
                        ].join(' ');
                        
                        return (
                          <path
                            key={stat.category}
                            d={pathData}
                            fill={colors[index % colors.length]}
                          />
                        );
                      })}
                    </Svg>
                    <View style={styles.donutCenter}>
                      <Text style={styles.donutTotal}>{formatCurrency(totalAmount)}</Text>
                      <Text style={styles.donutLabel}>Total</Text>
                    </View>
                  </View>

                  <View style={styles.legend}>
                    {categoryStats.map((stat, index) => {
                      const cat = categories.find(c => c.id === stat.category);
                      const percentage = ((stat.amount / totalAmount) * 100).toFixed(1);
                      
                      return (
                        <View key={stat.category} style={styles.legendItem}>
                          <View style={[styles.legendDot, { backgroundColor: colors[index % colors.length] }]} />
                          <Text style={styles.legendText}>{cat?.name || 'Other'}</Text>
                          <Text style={styles.legendPercent}>{percentage}%</Text>
                          <Text style={styles.legendAmount}>{formatCurrency(stat.amount)}</Text>
                        </View>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          </>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <>
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>Monthly Budget</Text>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetAmount}>{formatCurrency(budget)}</Text>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => {
                    Alert.prompt(
                      'Set Budget',
                      'Enter your monthly budget:',
                      (text) => {
                        const amount = parseFloat(text);
                        if (!isNaN(amount) && amount > 0) {
                          setBudget(amount);
                        }
                      },
                      'plain-text',
                      budget.toString()
                    );
                  }}
                >
                  <Ionicons name="pencil" size={18} color="#FF9BB3" />
                </TouchableOpacity>
              </View>
              <View style={styles.budgetBar}>
                <View 
                  style={[
                    styles.budgetProgress,
                    { 
                      width: `${Math.min((totalExpense / budget) * 100, 100)}%`,
                      backgroundColor: (totalExpense / budget) > 0.9 ? '#FF6B8A' : '#4CAF50'
                    }
                  ]}
                />
              </View>
              <Text style={styles.budgetText}>
                Spent {formatCurrency(totalExpense)} of {formatCurrency(budget)} 
                ({Math.round((totalExpense / budget) * 100)}%)
              </Text>
            </View>

            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>Categories</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {categories.map(cat => {
                  const icon = iconLibrary[cat.icon] || iconLibrary.other;
                  return (
                    <View key={cat.id} style={styles.categoryChip}>
                      <View style={[styles.categoryChipIcon, { backgroundColor: icon.bg }]}>
                        <Text style={styles.categoryEmoji}>{icon.emoji}</Text>
                      </View>
                      <Text style={styles.categoryChipText}>{cat.name}</Text>
                    </View>
                  );
                })}
              </ScrollView>
              <TouchableOpacity
                style={styles.addCategoryBtn}
                onPress={() => setShowCategoryModal(true)}
              >
                <Ionicons name="add-circle" size={20} color="#FF9BB3" />
                <Text style={styles.addCategoryText}>Add Category</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>Data Management</Text>
              <TouchableOpacity
                style={styles.settingBtn}
                onPress={() => {
                  Alert.alert(
                    'Clear All Data',
                    'This will delete all transactions and categories. Are you sure?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Clear', style: 'destructive', onPress: async () => {
                        setTransactions([]);
                        setCategories(defaultCategories);
                        setBudget(50000);
                        await AsyncStorage.removeItem('moneyplus-data-v2');
                        Alert.alert('Success', 'All data has been cleared.');
                      }}
                    ]
                  );
                }}
              >
                <Ionicons name="trash" size={20} color="#FF6B8A" />
                <Text style={[styles.settingBtnText, { color: '#FF6B8A' }]}>Clear All Data</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.appInfo}>
              <Text style={styles.appInfoText}>Money+ v1.0.0</Text>
              <Text style={styles.appInfoText}>Expense Tracker</Text>
              {lastSyncDate && (
                <Text style={styles.appInfoText}>
                  Last SMS sync: {new Date(lastSyncDate).toLocaleString('en-IN')}
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('home')}
        >
          <Ionicons 
            name={activeTab === 'home' ? 'home' : 'home-outline'} 
            size={24} 
            color={activeTab === 'home' ? '#FF9BB3' : '#B8B8D0'} 
          />
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('analytics')}
        >
          <Ionicons 
            name={activeTab === 'analytics' ? 'pie-chart' : 'pie-chart-outline'} 
            size={24} 
            color={activeTab === 'analytics' ? '#FF9BB3' : '#B8B8D0'} 
          />
          <Text style={[styles.navText, activeTab === 'analytics' && styles.navTextActive]}>Analytics</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons 
            name={activeTab === 'settings' ? 'settings' : 'settings-outline'} 
            size={24} 
            color={activeTab === 'settings' ? '#FF9BB3' : '#B8B8D0'} 
          />
          <Text style={[styles.navText, activeTab === 'settings' && styles.navTextActive]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Add Transaction Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add {transactionType === 'expense' ? 'Expense' : 'Income'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#5A5A7A" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Amount"
              keyboardType="numeric"
              value={newTransaction.amount}
              onChangeText={(text) => setNewTransaction({ ...newTransaction, amount: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Note (optional)"
              value={newTransaction.note}
              onChangeText={(text) => setNewTransaction({ ...newTransaction, note: text })}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryPicker}>
              {categories
                .filter(cat => cat.type === transactionType)
                .map(cat => {
                  const icon = iconLibrary[cat.icon] || iconLibrary.other;
                  const isSelected = newTransaction.category === cat.id;
                  
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryOption, isSelected && styles.categoryOptionSelected]}
                      onPress={() => setNewTransaction({ ...newTransaction, category: cat.id })}
                    >
                      <View style={[styles.categoryOptionIcon, { backgroundColor: icon.bg }]}>
                        <Text style={styles.categoryEmoji}>{icon.emoji}</Text>
                      </View>
                      <Text style={styles.categoryOptionText}>{cat.name}</Text>
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>

            <Text style={styles.inputLabel}>Payment Mode</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paymentPicker}>
              {paymentModes.map(mode => {
                const isSelected = newTransaction.paymentMode === mode.id;
                
                return (
                  <TouchableOpacity
                    key={mode.id}
                    style={[styles.paymentOption, isSelected && { backgroundColor: mode.bg }]}
                    onPress={() => setNewTransaction({ ...newTransaction, paymentMode: mode.id })}
                  >
                    <Text style={styles.paymentEmoji}>{mode.emoji}</Text>
                    <Text style={[styles.paymentText, isSelected && { color: mode.color }]}>
                      {mode.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.addBtn} onPress={addTransaction}>
              <Text style={styles.addBtnText}>Add Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#5A5A7A" />
              </TouchableOpacity>
            </View>

            <View style={styles.iconPreview}>
              <View style={[styles.previewIcon, { backgroundColor: iconLibrary[newCategory.icon].bg }]}>
                <Text style={{ fontSize: 32 }}>{iconLibrary[newCategory.icon].emoji}</Text>
              </View>
              <TextInput
                style={styles.categoryNameInput}
                placeholder="Category name"
                value={newCategory.name}
                onChangeText={(text) => setNewCategory({ ...newCategory, name: text })}
              />
            </View>

            <View style={styles.tabSelector}>
              <TouchableOpacity
                style={[styles.tabBtn, newCategory.type === 'expense' && styles.tabBtnActive]}
                onPress={() => setNewCategory({ ...newCategory, type: 'expense' })}
              >
                <Text style={[styles.tabBtnText, newCategory.type === 'expense' && styles.tabBtnTextActive]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, newCategory.type === 'income' && styles.tabBtnActive]}
                onPress={() => setNewCategory({ ...newCategory, type: 'income' })}
              >
                <Text style={[styles.tabBtnText, newCategory.type === 'income' && styles.tabBtnTextActive]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.iconGridTitle}>Choose Icon</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              <View style={styles.iconGrid}>
                {Object.keys(iconLibrary).map(key => {
                  const icon = iconLibrary[key];
                  const isSelected = newCategory.icon === key;
                  
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.iconOption, { backgroundColor: icon.bg }, isSelected && styles.iconOptionSelected]}
                      onPress={() => setNewCategory({ ...newCategory, icon: key })}
                    >
                      <Text style={{ fontSize: 28 }}>{icon.emoji}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.addBtn} onPress={addCategory}>
              <Text style={styles.addBtnText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SMS Modal */}
      <Modal
        visible={showSMSModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSMSModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bank Transactions</Text>
              <TouchableOpacity onPress={() => setShowSMSModal(false)}>
                <Ionicons name="close" size={24} color="#5A5A7A" />
              </TouchableOpacity>
            </View>

            <Text style={styles.smsHint}>
              Found {parsedSMS.length} bank transactions. Select the ones you want to add:
            </Text>

            <ScrollView style={styles.smsListContainer}>
              {parsedSMS.map(sms => {
                const isSelected = selectedSMS[sms.smsId];
                
                return (
                  <TouchableOpacity
                    key={sms.smsId}
                    style={[styles.smsItem, isSelected && styles.smsItemSelected]}
                    onPress={() => setSelectedSMS({
                      ...selectedSMS,
                      [sms.smsId]: !isSelected
                    })}
                  >
                    <View style={[
                      styles.smsIcon,
                      { backgroundColor: sms.type === 'expense' ? '#FFEBEF' : '#E8F5E9' }
                    ]}>
                      <Ionicons 
                        name={sms.type === 'expense' ? 'trending-down' : 'trending-up'} 
                        size={20} 
                        color={sms.type === 'expense' ? '#FF6B8A' : '#4CAF50'} 
                      />
                    </View>
                    <View style={styles.smsInfo}>
                      <Text style={styles.smsMerchant}>{sms.merchant || 'Transaction'}</Text>
                      <View style={styles.smsMetaRow}>
                        <Text style={[
                          styles.smsType,
                          { color: sms.type === 'expense' ? '#FF6B8A' : '#4CAF50' }
                        ]}>
                          {sms.type.toUpperCase()}
                        </Text>
                        <Text style={styles.smsDate}>
                          {sms.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </Text>
                      </View>
                    </View>
                    <Text style={[
                      styles.smsAmount,
                      { color: sms.type === 'expense' ? '#FF6B8A' : '#4CAF50' }
                    ]}>
                      {sms.type === 'income' ? '+' : '-'}{formatCurrency(sms.amount)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={addSMSTransactions}
              >
                <Text style={styles.addBtnText}>
                  Add Selected ({Object.values(selectedSMS).filter(Boolean).length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9FC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF9FC' },
  loadingIcon: { fontSize: 48, marginBottom: 16 },
  loadingText: { fontSize: 16, color: '#B8B8D0', fontWeight: '600' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorIcon: { fontSize: 64, marginBottom: 20 },
  errorTitle: { fontSize: 20, fontWeight: '700', color: '#FF6B8A', marginBottom: 10, textAlign: 'center' },
  errorMessage: { fontSize: 14, color: '#888', marginBottom: 24, textAlign: 'center' },
  retryButton: { backgroundColor: '#FF9BB3', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF9FC', borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  appTitle: { fontSize: 24, fontWeight: '700', color: '#5A5A7A' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  monthBtn: { padding: 4 },
  monthText: { fontSize: 14, fontWeight: '600', color: '#5A5A7A', minWidth: 70, textAlign: 'center' },
  main: { flex: 1 },
  balanceCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 20, padding: 24, borderRadius: 20, shadowColor: '#FF9BB3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  balanceLabel: { fontSize: 13, color: '#B8B8D0', fontWeight: '600', marginBottom: 8 },
  balanceAmount: { fontSize: 36, fontWeight: '700', color: '#5A5A7A', marginBottom: 20 },
  balanceRow: { flexDirection: 'row', gap: 12 },
  incomeBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E8F5E9', padding: 12, borderRadius: 12 },
  expenseBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFEBEF', padding: 12, borderRadius: 12 },
  miniLabel: { fontSize: 11, color: '#888', fontWeight: '600' },
  incomeAmount: { fontSize: 16, fontWeight: '700', color: '#4CAF50', marginTop: 2 },
  expenseAmount: { fontSize: 16, fontWeight: '700', color: '#FF6B8A', marginTop: 2 },
  quickActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 20 },
  actionBtn: { flex: 1, alignItems: 'center', gap: 8 },
  actionIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  actionText: { fontSize: 12, color: '#5A5A7A', fontWeight: '600' },
  section: { marginTop: 24, paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#5A5A7A', marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#B8B8D0', marginBottom: 4 },
  emptyHint: { fontSize: 13, color: '#D0D0E0' },
  transactionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  transIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  transEmoji: { fontSize: 24 },
  transInfo: { flex: 1 },
  transTitle: { fontSize: 15, fontWeight: '600', color: '#5A5A7A', marginBottom: 2 },
  transNote: { fontSize: 12, color: '#B8B8D0', marginBottom: 2 },
  transDate: { fontSize: 11, color: '#D0D0E0' },
  transAmount: { fontSize: 16, fontWeight: '700' },
  incomeText: { color: '#4CAF50' },
  expenseText: { color: '#FF6B8A' },
  tabSelector: { flexDirection: 'row', backgroundColor: '#F8F8FA', marginHorizontal: 20, marginTop: 20, padding: 4, borderRadius: 12, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#FF9BB3', shadowColor: '#FF9BB3', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: '#B8B8D0' },
  tabBtnTextActive: { color: '#fff' },
  chartContainer: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 20, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, marginBottom: 20 },
  chartTitle: { fontSize: 16, fontWeight: '700', color: '#5A5A7A', marginBottom: 20, textAlign: 'center' },
  emptyChart: { alignItems: 'center', paddingVertical: 60 },
  donutContainer: { alignItems: 'center', marginBottom: 24, position: 'relative' },
  donutCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  donutTotal: { fontSize: 20, fontWeight: '700', color: '#5A5A7A' },
  donutLabel: { fontSize: 12, color: '#B8B8D0', marginTop: 2 },
  legend: { gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { flex: 1, fontSize: 13, color: '#5A5A7A', fontWeight: '600' },
  legendPercent: { fontSize: 13, color: '#B8B8D0', fontWeight: '600', width: 50, textAlign: 'right' },
  legendAmount: { fontSize: 13, color: '#5A5A7A', fontWeight: '600', width: 90, textAlign: 'right' },
  settingCard: { backgroundColor: '#fff', marginHorizontal: 20, marginTop: 20, padding: 20, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  settingLabel: { fontSize: 16, fontWeight: '700', color: '#5A5A7A', marginBottom: 16 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  budgetAmount: { fontSize: 28, fontWeight: '700', color: '#5A5A7A' },
  editBtn: { padding: 8, backgroundColor: '#FFF0F5', borderRadius: 10 },
  budgetBar: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, marginBottom: 12, overflow: 'hidden' },
  budgetProgress: { height: '100%', borderRadius: 4 },
  budgetText: { fontSize: 13, color: '#B8B8D0' },
  categoryScroll: { marginBottom: 16 },
  categoryChip: { marginRight: 12, alignItems: 'center' },
  categoryChipIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  categoryEmoji: { fontSize: 24 },
  categoryChipText: { fontSize: 11, color: '#5A5A7A', fontWeight: '600', textAlign: 'center' },
  addCategoryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, backgroundColor: '#FFF0F5', borderRadius: 12 },
  addCategoryText: { fontSize: 14, fontWeight: '600', color: '#FF9BB3' },
  settingBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  settingBtnText: { fontSize: 15, fontWeight: '600', color: '#5A5A7A' },
  appInfo: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  appInfoText: { fontSize: 12, color: '#D0D0E0' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, paddingBottom: 16, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navText: { fontSize: 11, color: '#B8B8D0', fontWeight: '600' },
  navTextActive: { color: '#FF9BB3' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#5A5A7A' },
  modalFooter: { paddingHorizontal: 20, paddingBottom: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  input: { marginHorizontal: 20, marginTop: 16, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#F8F8FA', borderRadius: 12, fontSize: 15, color: '#5A5A7A' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginLeft: 20, marginTop: 20, marginBottom: 12 },
  categoryPicker: { paddingHorizontal: 20, maxHeight: 140 },
  categoryOption: { alignItems: 'center', marginRight: 12, padding: 8, borderRadius: 12, minWidth: 80 },
  categoryOptionSelected: { backgroundColor: '#FFF0F5' },
  categoryOptionIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  categoryOptionText: { fontSize: 11, color: '#5A5A7A', fontWeight: '600', textAlign: 'center' },
  paymentPicker: { paddingHorizontal: 20 },
  paymentOption: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginRight: 12, backgroundColor: '#F8F8FA' },
  paymentEmoji: { fontSize: 20 },
  paymentText: { fontSize: 13, fontWeight: '600', color: '#5A5A7A' },
  addBtn: { marginHorizontal: 20, marginTop: 24, marginBottom: 20, backgroundColor: '#FF9BB3', paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#FF9BB3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  smsHint: { fontSize: 13, color: '#888', marginHorizontal: 20, marginTop: 16, marginBottom: 12 },
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
});
