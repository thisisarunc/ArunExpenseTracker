import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';

// Payment modes
const paymentModes = [
  { id: 'cash', name: 'Cash', emoji: '💵', color: '#4CAF50', bg: '#E8F5E9' },
  { id: 'credit', name: 'Credit Card', emoji: '💳', color: '#E91E63', bg: '#FCE4EC' },
  { id: 'debit', name: 'Debit Card', emoji: '💳', color: '#2196F3', bg: '#E3F2FD' },
  { id: 'upi', name: 'UPI', emoji: '📱', color: '#9C27B0', bg: '#F3E5F5' },
  { id: 'netbanking', name: 'Net Banking', emoji: '🏦', color: '#FF9800', bg: '#FFF3E0' },
];

// Cute icon library
const iconLibrary = {
  burger: { emoji: '🍔', bg: '#FFF3E5' },
  biryani: { emoji: '🍛', bg: '#FFF8DC' },
  coffee: { emoji: '☕', bg: '#F5F5DC' },
  pizza: { emoji: '🍕', bg: '#FFF3E0' },
  cake: { emoji: '🍰', bg: '#FFF0F5' },
  shopping: { emoji: '🛍️', bg: '#FFE4E1' },
  bag: { emoji: '👜', bg: '#FFEFD5' },
  gift: { emoji: '🎁', bg: '#FFE4E1' },
  car: { emoji: '🚗', bg: '#E6E6FA' },
  auto: { emoji: '🛺', bg: '#FFFACD' },
  metro: { emoji: '🚇', bg: '#E6E6FA' },
  fuel: { emoji: '⛽', bg: '#FFE4E1' },
  plane: { emoji: '✈️', bg: '#E6F3FF' },
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
  { id: 'emi', name: 'EMI', icon: 'emi', type: 'expense' },
  { id: 'insurance', name: 'Insurance', icon: 'insurance', type: 'expense' },
  { id: 'other', name: 'Other', icon: 'other', type: 'expense' },
  { id: 'salary', name: 'Salary', icon: 'salary', type: 'income' },
  { id: 'bonus', name: 'Bonus', icon: 'bonus', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: 'freelance', type: 'income' },
  { id: 'refund', name: 'Refund', icon: 'refund', type: 'income' },
];

// Format currency
const formatCurrency = (amount) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(amount));
const getMonthName = (month) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month];

// Sample transactions
const sampleTransactions = [
  { id: 1, amount: 350, note: 'Swiggy - Biryani Paradise', category: 'food', paymentMode: 'upi', date: '2025-01-17', type: 'expense', source: 'sms' },
  { id: 2, amount: 2500, note: 'HP Petrol Pump', category: 'fuel', paymentMode: 'debit', date: '2025-01-17', type: 'expense', source: 'sms' },
  { id: 3, amount: 1299, note: 'Amazon - Headphones', category: 'shopping', paymentMode: 'credit', date: '2025-01-16', type: 'expense', source: 'sms' },
  { id: 4, amount: 85000, note: 'January Salary - TCS', category: 'salary', paymentMode: 'netbanking', date: '2025-01-15', type: 'income', source: 'sms' },
  { id: 5, amount: 499, note: 'Netflix Subscription', category: 'entertainment', paymentMode: 'credit', date: '2025-01-15', type: 'expense', source: 'sms' },
  { id: 6, amount: 3500, note: 'BigBasket Groceries', category: 'groceries', paymentMode: 'upi', date: '2025-01-14', type: 'expense', source: 'manual' },
  { id: 7, amount: 150, note: 'Auto Rickshaw', category: 'transport', paymentMode: 'cash', date: '2025-01-14', type: 'expense', source: 'manual' },
  { id: 8, amount: 1800, note: 'Electricity Bill - TNEB', category: 'electricity', paymentMode: 'netbanking', date: '2025-01-13', type: 'expense', source: 'sms' },
  { id: 9, amount: 599, note: 'Jio Recharge', category: 'mobile', paymentMode: 'upi', date: '2025-01-12', type: 'expense', source: 'sms' },
  { id: 10, amount: 15000, note: 'EMI - HDFC Home Loan', category: 'emi', paymentMode: 'netbanking', date: '2025-01-10', type: 'expense', source: 'sms' },
];

// Sample SMS for import demo
const sampleSMSToImport = [
  { id: 101, merchant: 'Zomato - Dominos', amount: 599, type: 'expense', category: 'food', paymentMode: 'upi', date: '2025-01-17' },
  { id: 102, merchant: 'PhonePe - Electricity', amount: 2100, type: 'expense', category: 'electricity', paymentMode: 'upi', date: '2025-01-17' },
  { id: 103, merchant: 'IRCTC Refund', amount: 1250, type: 'income', category: 'refund', paymentMode: 'netbanking', date: '2025-01-16' },
];

// Donut Chart Component
const DonutChart = ({ data, total }) => {
  const size = 200;
  const strokeWidth = 28;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const colors = ['#FF6B8A', '#9B6BFF', '#6BAFFF', '#FFB86B', '#6BFF9B', '#FF6BDF', '#6BFFF0', '#FFE86B'];

  let cumulativePercent = 0;

  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <View style={{ position: 'relative', width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={center} cy={center} r={radius} fill="none" stroke="#F5F5F5" strokeWidth={strokeWidth} />
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.total / total) * 100 : 0;
            const strokeDasharray = circumference;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;
            const rotation = (cumulativePercent / 100) * 360;
            cumulativePercent += percentage;
            return (
              <Circle
                key={item.id}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={colors[index % colors.length]}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                rotation={rotation}
                origin={`${center}, ${center}`}
              />
            );
          })}
        </Svg>
        <View style={styles.donutCenter}>
          <Text style={styles.donutLabel}>Total Expenses</Text>
          <Text style={styles.donutAmount}>{formatCurrency(total)}</Text>
        </View>
      </View>
    </View>
  );
};

export default function MoneyPlusTracker() {
  const [transactions, setTransactions] = useState(sampleTransactions);
  const [categories] = useState(defaultCategories);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [transactionType, setTransactionType] = useState('expense');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [newTransaction, setNewTransaction] = useState({ amount: '', note: '', category: 'food', paymentMode: 'upi' });
  const [budget, setBudget] = useState(50000);
  const [chartView, setChartView] = useState('category');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailView, setDetailView] = useState(null);
  const [smsLoading, setSmsLoading] = useState(false);
  const [selectedSMS, setSelectedSMS] = useState({});
  const [lastSyncDate, setLastSyncDate] = useState('17 Jan 2025');
  const [dataLoaded, setDataLoaded] = useState(false);

  const colors = ['#FF6B8A', '#9B6BFF', '#6BAFFF', '#FFB86B', '#6BFF9B', '#FF6BDF'];

  // Load data from AsyncStorage
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedTransactions = await AsyncStorage.getItem('transactions');
        const savedBudget = await AsyncStorage.getItem('budget');
        if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
        if (savedBudget) setBudget(JSON.parse(savedBudget));
        setDataLoaded(true);
      } catch (e) {
        console.error('Error loading data:', e);
        setDataLoaded(true);
      }
    };
    loadData();
  }, []);

  // Save transactions
  useEffect(() => {
    if (dataLoaded) {
      AsyncStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }, [transactions, dataLoaded]);

  // Save budget
  useEffect(() => {
    if (dataLoaded) {
      AsyncStorage.setItem('budget', JSON.stringify(budget));
    }
  }, [budget, dataLoaded]);

  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const filteredTransactions = searchQuery
    ? monthTransactions.filter(t => t.note.toLowerCase().includes(searchQuery.toLowerCase()))
    : monthTransactions;

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

  const paymentStats = paymentModes.map(mode => ({
    ...mode,
    total: monthTransactions.filter(t => t.paymentMode === mode.id && t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  })).filter(p => p.total > 0);

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
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const addTransaction = () => {
    const amount = parseFloat(newTransaction.amount);
    if (!amount || amount <= 0) return Alert.alert('Error', 'Enter valid amount');
    const cat = categories.find(c => c.id === newTransaction.category);
    setTransactions(prev => [{
      id: Date.now(),
      amount,
      note: newTransaction.note || cat?.name || 'Transaction',
      category: newTransaction.category,
      paymentMode: newTransaction.paymentMode,
      date: new Date().toISOString().split('T')[0],
      type: transactionType,
      source: 'manual',
    }, ...prev]);
    setNewTransaction({ amount: '', note: '', category: transactionType === 'income' ? 'salary' : 'food', paymentMode: 'upi' });
    setShowAddModal(false);
  };

  const deleteTransaction = (id) => {
    Alert.alert('Delete', 'Delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setTransactions(prev => prev.filter(t => t.id !== id)) }
    ]);
  };

  const openEditModal = (t) => {
    setEditTransaction({ ...t, amount: t.amount.toString() });
    setShowEditModal(true);
  };

  const saveEditedTransaction = () => {
    if (!editTransaction) return;
    const amount = parseFloat(editTransaction.amount);
    if (!amount || amount <= 0) return Alert.alert('Error', 'Enter valid amount');
    setTransactions(prev => prev.map(t =>
      t.id === editTransaction.id
        ? { ...t, amount, note: editTransaction.note, category: editTransaction.category, paymentMode: editTransaction.paymentMode }
        : t
    ));
    setShowEditModal(false);
    setEditTransaction(null);
  };

  const syncSMS = () => {
    setSmsLoading(true);
    setTimeout(() => {
      setSmsLoading(false);
      setShowSMSModal(true);
    }, 1500);
  };

  const toggleSMSSelection = (id) => {
    setSelectedSMS(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectAllSMS = () => {
    const allSelected = sampleSMSToImport.every(sms => selectedSMS[sms.id]);
    if (allSelected) {
      setSelectedSMS({});
    } else {
      const newSelected = {};
      sampleSMSToImport.forEach(sms => { newSelected[sms.id] = true; });
      setSelectedSMS(newSelected);
    }
  };

  const importSelectedSMS = () => {
    const selected = sampleSMSToImport.filter(sms => selectedSMS[sms.id]);
    if (selected.length === 0) return Alert.alert('Error', 'Select at least one transaction');
    const newTxns = selected.map(sms => ({
      id: Date.now() + Math.random(),
      amount: sms.amount,
      note: sms.merchant,
      category: sms.category,
      paymentMode: sms.paymentMode,
      date: sms.date,
      type: sms.type,
      source: 'sms',
    }));
    setTransactions(prev => [...newTxns, ...prev]);
    setShowSMSModal(false);
    setSelectedSMS({});
    Alert.alert('Success', `${selected.length} transactions imported!`);
  };

  const getDetailTransactions = () => {
    if (!detailView) return [];
    if (detailView.type === 'category') {
      return monthTransactions.filter(t => t.category === detailView.id && t.type === 'expense');
    }
    return monthTransactions.filter(t => t.paymentMode === detailView.id && t.type === 'expense');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF9FC" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>💰 Money+</Text>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={prevMonth} style={styles.monthBtn}>
            <Feather name="chevron-left" size={18} color="#FF9BB3" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{getMonthName(currentMonth).slice(0, 3)} {currentYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.monthBtn}>
            <Feather name="chevron-right" size={18} color="#FF9BB3" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.main} showsVerticalScrollIndicator={false}>
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
              <View style={styles.balanceRow}>
                <View style={styles.incomeBox}>
                  <Feather name="trending-up" size={16} color="#4CAF50" />
                  <View>
                    <Text style={styles.miniLabel}>Income</Text>
                    <Text style={styles.incomeAmount}>{formatCurrency(totalIncome)}</Text>
                  </View>
                </View>
                <View style={styles.expenseBox}>
                  <Feather name="trending-down" size={16} color="#FF6B8A" />
                  <View>
                    <Text style={styles.miniLabel}>Expense</Text>
                    <Text style={styles.expenseAmount}>{formatCurrency(totalExpense)}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* SMS Sync Button */}
            <TouchableOpacity style={styles.syncButton} onPress={syncSMS} disabled={smsLoading}>
              <Feather name={smsLoading ? "refresh-cw" : "smartphone"} size={18} color="#FF9BB3" />
              <Text style={styles.syncButtonText}>
                {smsLoading ? 'Scanning SMS...' : 'Sync Bank SMS'}
              </Text>
              <Text style={styles.syncDate}>Last: {lastSyncDate}</Text>
            </TouchableOpacity>

            {/* Budget Progress */}
            <View style={styles.budgetSection}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetTitle}>Monthly Budget</Text>
                <Text style={styles.budgetValue}>{formatCurrency(totalExpense)} / {formatCurrency(budget)}</Text>
              </View>
              <View style={styles.budgetTrack}>
                <View style={[styles.budgetFill, {
                  width: `${Math.min((totalExpense / budget) * 100, 100)}%`,
                  backgroundColor: totalExpense > budget ? '#FF6B6B' : totalExpense > budget * 0.8 ? '#FFB347' : '#4CAF50'
                }]} />
              </View>
              <Text style={[styles.budgetRemaining, { color: totalExpense > budget ? '#FF6B6B' : '#4CAF50' }]}>
                {totalExpense > budget
                  ? `⚠️ Over budget by ${formatCurrency(totalExpense - budget)}`
                  : `✓ ${formatCurrency(budget - totalExpense)} remaining`
                }
              </Text>
            </View>

            {/* Payment Mode Summary */}
            <View style={styles.paymentSummary}>
              {paymentModes.slice(0, 4).map(mode => {
                const modeTotal = monthTransactions.filter(t => t.paymentMode === mode.id && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                return (
                  <View key={mode.id} style={styles.paymentModeCard}>
                    <Text style={{ fontSize: 20 }}>{mode.emoji}</Text>
                    <Text style={styles.paymentModeName}>{mode.name.split(' ')[0]}</Text>
                    <Text style={styles.paymentModeAmount}>{formatCurrency(modeTotal)}</Text>
                  </View>
                );
              })}
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
              <Feather name="search" size={18} color="#B8B8D0" />
              <TextInput
                placeholder="Search transactions..."
                placeholderTextColor="#B8B8D0"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>

            {/* Transactions */}
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {filteredTransactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📝</Text>
                <Text style={styles.emptyText}>No transactions yet!</Text>
                <Text style={styles.emptySubtext}>Tap + or sync SMS to add</Text>
              </View>
            ) : (
              groupByDate(filteredTransactions).map((group) => (
                <View key={group.date} style={styles.dateGroup}>
                  <View style={styles.dateHeader}>
                    <Text style={styles.dateHeaderText}>{formatDateHeader(group.date)}</Text>
                    <View style={{ flexDirection: 'row' }}>
                      {group.totalExpense > 0 && <Text style={{ color: '#FF6B8A', fontSize: 12 }}>-{formatCurrency(group.totalExpense)}</Text>}
                      {group.totalExpense > 0 && group.totalIncome > 0 && <Text style={{ fontSize: 12 }}> / </Text>}
                      {group.totalIncome > 0 && <Text style={{ color: '#4CAF50', fontSize: 12 }}>+{formatCurrency(group.totalIncome)}</Text>}
                    </View>
                  </View>
                  {group.transactions.map((t) => {
                    const cat = categories.find(c => c.id === t.category) || categories[0];
                    const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                    const payMode = paymentModes.find(p => p.id === t.paymentMode) || paymentModes[0];
                    return (
                      <TouchableOpacity key={t.id} style={styles.transactionItem} onPress={() => openEditModal(t)}>
                        <View style={[styles.transactionIcon, { backgroundColor: iconData.bg }]}>
                          <Text style={{ fontSize: 22 }}>{iconData.emoji}</Text>
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionNote} numberOfLines={1}>{t.note}</Text>
                          <View style={styles.transactionMeta}>
                            <View style={[styles.paymentBadge, { backgroundColor: payMode.bg }]}>
                              <Text style={[styles.paymentBadgeText, { color: payMode.color }]}>{payMode.emoji} {payMode.name.split(' ')[0]}</Text>
                            </View>
                            {t.source === 'sms' && (
                              <View style={styles.smsBadge}>
                                <Text style={styles.smsBadgeText}>📱 Auto</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.transactionRight}>
                          <Text style={[styles.transactionAmount, { color: t.type === 'income' ? '#4CAF50' : '#FF6B8A' }]}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </Text>
                          <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteTransaction(t.id)}>
                            <Feather name="trash-2" size={14} color="#FF6B8A" />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))
            )}
          </>
        )}

        {/* CHARTS TAB */}
        {activeTab === 'charts' && (
          <>
            {detailView ? (
              <View>
                <View style={styles.detailHeader}>
                  <TouchableOpacity style={styles.backBtn} onPress={() => setDetailView(null)}>
                    <Feather name="chevron-left" size={24} color="#5A5A7A" />
                  </TouchableOpacity>
                  <View style={[styles.detailIcon, {
                    backgroundColor: detailView.type === 'category'
                      ? (iconLibrary[detailView.icon]?.bg || '#f5f5f5')
                      : (detailView.bg || '#f5f5f5')
                  }]}>
                    <Text style={{ fontSize: 22 }}>
                      {detailView.type === 'category'
                        ? (iconLibrary[detailView.icon]?.emoji || '📦')
                        : (detailView.emoji || '💳')}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailTitle}>{detailView.name}</Text>
                    <Text style={styles.detailSubtitle}>
                      {detailView.type === 'category' ? 'Category' : 'Payment Mode'} Details
                    </Text>
                  </View>
                </View>

                <View style={[styles.detailSummary, {
                  backgroundColor: detailView.type === 'category'
                    ? (iconLibrary[detailView.icon]?.bg || '#f5f5f5')
                    : (detailView.bg || '#f5f5f5')
                }]}>
                  <Text style={styles.detailSummaryLabel}>Total Spent</Text>
                  <Text style={styles.detailSummaryAmount}>
                    {formatCurrency(getDetailTransactions().reduce((s, t) => s + t.amount, 0))}
                  </Text>
                  <Text style={styles.detailSummaryCount}>
                    {getDetailTransactions().length} transactions this month
                  </Text>
                </View>

                <Text style={styles.sectionTitle}>All Transactions</Text>
                {getDetailTransactions().length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyEmoji}>📭</Text>
                    <Text style={styles.emptyText}>No transactions</Text>
                  </View>
                ) : (
                  groupByDate(getDetailTransactions()).map((group) => (
                    <View key={group.date} style={styles.dateGroup}>
                      <View style={styles.dateHeader}>
                        <Text style={styles.dateHeaderText}>{formatDateHeader(group.date)}</Text>
                        <Text style={{ color: '#FF6B8A', fontSize: 12 }}>-{formatCurrency(group.totalExpense)}</Text>
                      </View>
                      {group.transactions.map(t => {
                        const cat = categories.find(c => c.id === t.category) || categories[0];
                        const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                        const payMode = paymentModes.find(p => p.id === t.paymentMode) || paymentModes[0];
                        return (
                          <TouchableOpacity key={t.id} style={styles.transactionItem} onPress={() => openEditModal(t)}>
                            <View style={[styles.transactionIcon, { backgroundColor: iconData.bg }]}>
                              <Text style={{ fontSize: 22 }}>{iconData.emoji}</Text>
                            </View>
                            <View style={styles.transactionInfo}>
                              <Text style={styles.transactionNote} numberOfLines={1}>{t.note}</Text>
                              <View style={[styles.paymentBadge, { backgroundColor: payMode.bg }]}>
                                <Text style={[styles.paymentBadgeText, { color: payMode.color }]}>{payMode.emoji} {payMode.name.split(' ')[0]}</Text>
                              </View>
                            </View>
                            <Text style={[styles.transactionAmount, { color: '#FF6B8A' }]}>-{formatCurrency(t.amount)}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))
                )}
              </View>
            ) : (
              <>
                <View style={styles.chartToggle}>
                  <TouchableOpacity
                    style={[styles.chartToggleBtn, { backgroundColor: chartView === 'category' ? '#FF9BB3' : '#f5f5f5' }]}
                    onPress={() => setChartView('category')}
                  >
                    <Text style={{ color: chartView === 'category' ? '#fff' : '#666', fontWeight: '600' }}>📁 By Category</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chartToggleBtn, { backgroundColor: chartView === 'payment' ? '#FF9BB3' : '#f5f5f5' }]}
                    onPress={() => setChartView('payment')}
                  >
                    <Text style={{ color: chartView === 'payment' ? '#fff' : '#666', fontWeight: '600' }}>💳 By Payment</Text>
                  </TouchableOpacity>
                </View>

                {chartView === 'category' ? (
                  categoryStats.length > 0 ? (
                    <>
                      <DonutChart data={categoryStats} total={totalExpense} />
                      {categoryStats.map((cat, index) => {
                        const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                        const percentage = totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(0) : 0;
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            style={styles.statsItem}
                            onPress={() => setDetailView({ type: 'category', id: cat.id, name: cat.name, icon: cat.icon })}
                          >
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
                            <Feather name="chevron-right" size={16} color="#ccc" />
                          </TouchableOpacity>
                        );
                      })}
                    </>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyEmoji}>📊</Text>
                      <Text style={styles.emptyText}>No expense data</Text>
                    </View>
                  )
                ) : (
                  paymentStats.length > 0 ? (
                    <>
                      <View style={styles.paymentChartHeader}>
                        <Text style={{ fontWeight: '600' }}>Payment Mode Analysis</Text>
                        <Text style={{ fontSize: 12, color: '#888' }}>Total: {formatCurrency(totalExpense)}</Text>
                      </View>
                      {paymentStats.map((mode) => {
                        const percentage = totalExpense > 0 ? ((mode.total / totalExpense) * 100).toFixed(0) : 0;
                        return (
                          <TouchableOpacity
                            key={mode.id}
                            style={styles.statsItem}
                            onPress={() => setDetailView({ type: 'payment', id: mode.id, name: mode.name, emoji: mode.emoji, color: mode.color, bg: mode.bg })}
                          >
                            <View style={[styles.statsIcon, { backgroundColor: mode.bg }]}>
                              <Text style={{ fontSize: 24 }}>{mode.emoji}</Text>
                            </View>
                            <View style={styles.statsInfo}>
                              <Text style={styles.statsName}>{mode.name}</Text>
                              <View style={styles.statsBar}>
                                <View style={[styles.statsBarFill, { width: `${percentage}%`, backgroundColor: mode.color }]} />
                              </View>
                            </View>
                            <View style={styles.statsRight}>
                              <Text style={[styles.statsPercent, { color: mode.color }]}>{percentage}%</Text>
                              <Text style={styles.statsAmount}>{formatCurrency(mode.total)}</Text>
                            </View>
                            <Feather name="chevron-right" size={16} color="#ccc" />
                          </TouchableOpacity>
                        );
                      })}
                    </>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyEmoji}>💳</Text>
                      <Text style={styles.emptyText}>No payment data</Text>
                    </View>
                  )
                )}
              </>
            )}
          </>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <>
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>📱 SMS Auto-Sync</Text>
              <TouchableOpacity style={styles.settingsItem} onPress={syncSMS}>
                <Feather name="refresh-cw" size={24} color="#FF9BB3" />
                <View style={styles.settingsItemInfo}>
                  <Text style={styles.settingsItemTitle}>Sync Bank SMS</Text>
                  <Text style={styles.settingsItemDesc}>Import transactions from bank messages</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#ccc" />
              </TouchableOpacity>
              <View style={styles.settingsItem}>
                <Feather name="clock" size={24} color="#9B6BFF" />
                <View style={styles.settingsItemInfo}>
                  <Text style={styles.settingsItemTitle}>Last Synced</Text>
                  <Text style={styles.settingsItemDesc}>{lastSyncDate}, 10:30 AM</Text>
                </View>
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>🎯 Budget Settings</Text>
              <View style={styles.budgetSetting}>
                <Text style={styles.settingLabel}>Monthly Budget</Text>
                <View style={styles.budgetInputRow}>
                  <Text style={styles.rupeeSign}>₹</Text>
                  <TextInput
                    style={styles.budgetInputField}
                    value={budget.toString()}
                    onChangeText={(text) => setBudget(parseInt(text) || 0)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>📁 Categories</Text>
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
        <Feather name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { id: 'home', icon: 'home', label: 'Home' },
          { id: 'charts', icon: 'pie-chart', label: 'Charts' },
          { id: 'settings', icon: 'settings', label: 'Settings' },
        ].map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.navItem}
            onPress={() => { setActiveTab(item.id); setDetailView(null); }}
          >
            <Feather name={item.icon} size={22} color={activeTab === item.id ? '#FF9BB3' : '#B8B8D0'} />
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
                <Feather name="x" size={24} color="#B8B8D0" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.typeToggle}>
                <TouchableOpacity
                  style={[styles.typeBtn, { backgroundColor: transactionType === 'expense' ? '#FFE5E5' : '#f5f5f5' }]}
                  onPress={() => { setTransactionType('expense'); setNewTransaction(p => ({ ...p, category: 'food' })); }}
                >
                  <Text style={{ color: transactionType === 'expense' ? '#FF6B8A' : '#999', fontWeight: '700' }}>💸 Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeBtn, { backgroundColor: transactionType === 'income' ? '#E8F5E9' : '#f5f5f5' }]}
                  onPress={() => { setTransactionType('income'); setNewTransaction(p => ({ ...p, category: 'salary' })); }}
                >
                  <Text style={{ color: transactionType === 'income' ? '#4CAF50' : '#999', fontWeight: '700' }}>💰 Income</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.amountSection}>
                <Text style={styles.currencySign}>₹</Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor="#B8B8D0"
                  style={styles.amountInput}
                  keyboardType="numeric"
                  value={newTransaction.amount}
                  onChangeText={(text) => setNewTransaction(p => ({ ...p, amount: text }))}
                />
              </View>

              <TextInput
                placeholder="Add note..."
                placeholderTextColor="#B8B8D0"
                style={styles.noteInput}
                value={newTransaction.note}
                onChangeText={(text) => setNewTransaction(p => ({ ...p, note: text }))}
              />

              {transactionType === 'expense' && (
                <>
                  <Text style={styles.sectionLabel}>💳 Payment Mode</Text>
                  <View style={styles.paymentGrid}>
                    {paymentModes.map(mode => (
                      <TouchableOpacity
                        key={mode.id}
                        style={[styles.paymentOption, {
                          backgroundColor: newTransaction.paymentMode === mode.id ? mode.bg : '#f9f9f9',
                          borderColor: newTransaction.paymentMode === mode.id ? mode.color : 'transparent',
                          borderWidth: 2
                        }]}
                        onPress={() => setNewTransaction(p => ({ ...p, paymentMode: mode.id }))}
                      >
                        <Text style={{ fontSize: 20 }}>{mode.emoji}</Text>
                        <Text style={[styles.paymentOptLabel, { color: newTransaction.paymentMode === mode.id ? mode.color : '#888' }]}>{mode.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.sectionLabel}>📁 Category</Text>
              <View style={styles.categoryGrid}>
                {categories.filter(c => c.type === transactionType).map(cat => {
                  const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                  const isSelected = newTransaction.category === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryOption, {
                        backgroundColor: isSelected ? iconData.bg : '#f9f9f9',
                        borderColor: isSelected ? '#FF9BB3' : 'transparent',
                        borderWidth: 2
                      }]}
                      onPress={() => setNewTransaction(p => ({ ...p, category: cat.id }))}
                    >
                      <Text style={{ fontSize: 22 }}>{iconData.emoji}</Text>
                      <Text style={[styles.categoryOptLabel, { color: isSelected ? '#5A5A7A' : '#B8B8D0' }]} numberOfLines={1}>{cat.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={addTransaction}>
                <Feather name="check" size={22} color="#fff" />
                <Text style={styles.saveBtnText}>Save Transaction</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Edit Transaction</Text>
              <TouchableOpacity onPress={() => { setShowEditModal(false); setEditTransaction(null); }}>
                <Feather name="x" size={24} color="#B8B8D0" />
              </TouchableOpacity>
            </View>

            {editTransaction && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.amountSection}>
                  <Text style={styles.currencySign}>₹</Text>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor="#B8B8D0"
                    style={styles.amountInput}
                    keyboardType="numeric"
                    value={editTransaction.amount}
                    onChangeText={(text) => setEditTransaction(p => ({ ...p, amount: text }))}
                  />
                </View>

                <TextInput
                  placeholder="Add note..."
                  placeholderTextColor="#B8B8D0"
                  style={styles.noteInput}
                  value={editTransaction.note}
                  onChangeText={(text) => setEditTransaction(p => ({ ...p, note: text }))}
                />

                {editTransaction.type === 'expense' && (
                  <>
                    <Text style={styles.sectionLabel}>💳 Payment Mode</Text>
                    <View style={styles.paymentGrid}>
                      {paymentModes.map(mode => (
                        <TouchableOpacity
                          key={mode.id}
                          style={[styles.paymentOption, {
                            backgroundColor: editTransaction.paymentMode === mode.id ? mode.bg : '#f9f9f9',
                            borderColor: editTransaction.paymentMode === mode.id ? mode.color : 'transparent',
                            borderWidth: 2
                          }]}
                          onPress={() => setEditTransaction(p => ({ ...p, paymentMode: mode.id }))}
                        >
                          <Text style={{ fontSize: 20 }}>{mode.emoji}</Text>
                          <Text style={[styles.paymentOptLabel, { color: editTransaction.paymentMode === mode.id ? mode.color : '#888' }]}>{mode.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <Text style={styles.sectionLabel}>📁 Category</Text>
                <View style={styles.categoryGrid}>
                  {categories.filter(c => c.type === editTransaction.type).map(cat => {
                    const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                    const isSelected = editTransaction.category === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryOption, {
                          backgroundColor: isSelected ? iconData.bg : '#f9f9f9',
                          borderColor: isSelected ? '#FF9BB3' : 'transparent',
                          borderWidth: 2
                        }]}
                        onPress={() => setEditTransaction(p => ({ ...p, category: cat.id }))}
                      >
                        <Text style={{ fontSize: 22 }}>{iconData.emoji}</Text>
                        <Text style={[styles.categoryOptLabel, { color: isSelected ? '#5A5A7A' : '#B8B8D0' }]} numberOfLines={1}>{cat.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.editBtnRow}>
                  <TouchableOpacity style={[styles.saveBtn, styles.deleteEditBtn]} onPress={() => { deleteTransaction(editTransaction.id); setShowEditModal(false); setEditTransaction(null); }}>
                    <Feather name="trash-2" size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveBtn, { flex: 2 }]} onPress={saveEditedTransaction}>
                    <Feather name="check" size={22} color="#fff" />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* SMS Import Modal */}
      <Modal visible={showSMSModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📱 Import Transactions</Text>
              <TouchableOpacity onPress={() => { setShowSMSModal(false); setSelectedSMS({}); }}>
                <Feather name="x" size={24} color="#B8B8D0" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.selectAllRow} onPress={selectAllSMS}>
              <View style={[styles.checkbox, sampleSMSToImport.every(sms => selectedSMS[sms.id]) && styles.checkboxChecked]}>
                {sampleSMSToImport.every(sms => selectedSMS[sms.id]) && <Feather name="check" size={14} color="#fff" />}
              </View>
              <Text style={styles.selectAllText}>
                Select All ({Object.keys(selectedSMS).filter(k => selectedSMS[k]).length}/{sampleSMSToImport.length})
              </Text>
            </TouchableOpacity>

            <ScrollView style={styles.smsListContainer}>
              {sampleSMSToImport.map(sms => {
                const cat = categories.find(c => c.id === sms.category) || categories[0];
                const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                const payMode = paymentModes.find(p => p.id === sms.paymentMode) || paymentModes[0];
                const isSelected = selectedSMS[sms.id];
                return (
                  <TouchableOpacity
                    key={sms.id}
                    style={[styles.smsItem, { backgroundColor: isSelected ? '#FFF5F8' : '#fff' }]}
                    onPress={() => toggleSMSSelection(sms.id)}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      {isSelected && <Feather name="check" size={14} color="#fff" />}
                    </View>
                    <View style={[styles.smsIcon, { backgroundColor: iconData.bg }]}>
                      <Text style={{ fontSize: 18 }}>{iconData.emoji}</Text>
                    </View>
                    <View style={styles.smsInfo}>
                      <Text style={styles.smsMerchant}>{sms.merchant}</Text>
                      <View style={styles.smsMetaRow}>
                        <Text style={[styles.smsType, { color: sms.type === 'income' ? '#4CAF50' : '#FF6B8A' }]}>
                          {sms.type === 'income' ? '↓ Income' : '↑ Expense'}
                        </Text>
                        <Text style={styles.smsDateText}>{sms.date}</Text>
                      </View>
                      <View style={[styles.paymentBadge, { backgroundColor: payMode.bg, marginTop: 4 }]}>
                        <Text style={[styles.paymentBadgeText, { color: payMode.color }]}>{payMode.emoji} {payMode.name}</Text>
                      </View>
                    </View>
                    <Text style={[styles.smsAmount, { color: sms.type === 'income' ? '#4CAF50' : '#FF6B8A' }]}>
                      {sms.type === 'income' ? '+' : '-'}{formatCurrency(sms.amount)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={[styles.saveBtn, { margin: 16 }]} onPress={importSelectedSMS}>
              <Text style={styles.saveBtnText}>Import {Object.keys(selectedSMS).filter(k => selectedSMS[k]).length} Transactions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF9FC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 50 : 40, paddingHorizontal: 20, paddingBottom: 16 },
  appTitle: { fontSize: 22, fontWeight: '800', color: '#FF9BB3' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, elevation: 3 },
  monthBtn: { padding: 2 },
  monthText: { fontSize: 13, fontWeight: '600', color: '#5A5A7A', minWidth: 75, textAlign: 'center' },
  main: { flex: 1, paddingHorizontal: 16 },
  balanceCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 12, elevation: 4 },
  balanceLabel: { fontSize: 12, color: '#B8B8D0', marginBottom: 4 },
  balanceAmount: { fontSize: 32, fontWeight: '800', color: '#5A5A7A', marginBottom: 16 },
  balanceRow: { flexDirection: 'row', gap: 12 },
  incomeBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E8F5E9', padding: 12, borderRadius: 14 },
  expenseBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFE5E5', padding: 12, borderRadius: 14 },
  miniLabel: { fontSize: 10, color: '#888' },
  incomeAmount: { fontSize: 14, fontWeight: '700', color: '#4CAF50' },
  expenseAmount: { fontSize: 14, fontWeight: '700', color: '#FF6B8A' },
  syncButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#FFE5E5', marginBottom: 12 },
  syncButtonText: { fontSize: 14, fontWeight: '600', color: '#FF9BB3' },
  syncDate: { fontSize: 11, color: '#B8B8D0', marginLeft: 8 },
  budgetSection: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, elevation: 2 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  budgetTitle: { fontSize: 12, fontWeight: '600', color: '#5A5A7A' },
  budgetValue: { fontSize: 11, color: '#B8B8D0' },
  budgetTrack: { height: 8, backgroundColor: '#F5F5F5', borderRadius: 8, overflow: 'hidden' },
  budgetFill: { height: '100%', borderRadius: 8 },
  budgetRemaining: { fontSize: 11, textAlign: 'center', marginTop: 8 },
  paymentSummary: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  paymentModeCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center', gap: 4, elevation: 2 },
  paymentModeName: { fontSize: 9, color: '#888' },
  paymentModeAmount: { fontSize: 11, fontWeight: '700', color: '#5A5A7A' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, marginBottom: 16, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: '#5A5A7A' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#5A5A7A', marginBottom: 12 },
  dateGroup: { marginBottom: 16 },
  dateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dateHeaderText: { fontSize: 13, fontWeight: '700', color: '#FF9BB3' },
  transactionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 12, borderRadius: 14, elevation: 2, marginBottom: 8 },
  transactionIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  transactionInfo: { flex: 1 },
  transactionNote: { fontSize: 13, fontWeight: '600', color: '#5A5A7A', marginBottom: 4 },
  transactionMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  paymentBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 10 },
  paymentBadgeText: { fontSize: 9, fontWeight: '600' },
  smsBadge: { backgroundColor: '#E3F2FD', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 8 },
  smsBadgeText: { fontSize: 8, fontWeight: '600', color: '#2196F3' },
  transactionRight: { alignItems: 'flex-end', gap: 4 },
  transactionAmount: { fontSize: 14, fontWeight: '700' },
  deleteBtn: { padding: 2 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#5A5A7A', marginBottom: 4 },
  emptySubtext: { fontSize: 13, color: '#B8B8D0' },
  chartToggle: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  chartToggleBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  paymentChartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 12 },
  statsItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, elevation: 2 },
  statsIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statsInfo: { flex: 1 },
  statsName: { fontSize: 13, fontWeight: '600', color: '#5A5A7A', marginBottom: 6 },
  statsBar: { height: 6, backgroundColor: '#F5F5F5', borderRadius: 6, overflow: 'hidden' },
  statsBarFill: { height: '100%', borderRadius: 6 },
  statsRight: { alignItems: 'flex-end', minWidth: 70 },
  statsPercent: { fontSize: 13, fontWeight: '700' },
  statsAmount: { fontSize: 12, color: '#888' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20, paddingVertical: 4 },
  backBtn: { backgroundColor: '#fff', width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  detailIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { fontSize: 18, fontWeight: '700', color: '#5A5A7A' },
  detailSubtitle: { fontSize: 12, color: '#B8B8D0' },
  detailSummary: { borderRadius: 20, padding: 24, marginBottom: 24, alignItems: 'center' },
  detailSummaryLabel: { fontSize: 13, color: '#888', marginBottom: 6 },
  detailSummaryAmount: { fontSize: 36, fontWeight: '800', color: '#5A5A7A' },
  detailSummaryCount: { fontSize: 12, color: '#888', marginTop: 6 },
  settingsSection: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2 },
  settingsSectionTitle: { fontSize: 15, fontWeight: '700', color: '#5A5A7A', marginBottom: 12 },
  settingsItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  settingsItemInfo: { flex: 1 },
  settingsItemTitle: { fontSize: 14, fontWeight: '600', color: '#5A5A7A' },
  settingsItemDesc: { fontSize: 12, color: '#B8B8D0', marginTop: 2 },
  budgetSetting: { marginTop: 8 },
  settingLabel: { fontSize: 13, fontWeight: '600', color: '#5A5A7A', marginBottom: 8 },
  budgetInputRow: { flexDirection: 'row', alignItems: 'center' },
  rupeeSign: { fontSize: 24, color: '#B8B8D0' },
  budgetInputField: { flex: 1, fontSize: 28, fontWeight: '700', color: '#5A5A7A', marginLeft: 8 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catItem: { width: '22%', alignItems: 'center', gap: 6 },
  catIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 10, fontWeight: '600', color: '#5A5A7A', textAlign: 'center' },
  supportedBanks: { fontSize: 12, color: '#888', lineHeight: 20 },
  addBtn: { position: 'absolute', bottom: 95, alignSelf: 'center', width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF9BB3', alignItems: 'center', justifyContent: 'center', elevation: 8 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.95)', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.04)', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 26 : 16 },
  navItem: { alignItems: 'center', gap: 3, paddingHorizontal: 20, paddingVertical: 6 },
  navLabel: { fontSize: 10, fontWeight: '600' },
  navDot: { position: 'absolute', bottom: 0, width: 4, height: 4, borderRadius: 2, backgroundColor: '#FF9BB3' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(90,90,122,0.4)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#5A5A7A' },
  typeToggle: { flexDirection: 'row', gap: 10, padding: 14, paddingHorizontal: 20 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  amountSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 16, padding: 16, backgroundColor: '#FAFAFA', borderRadius: 16, marginHorizontal: 20 },
  currencySign: { fontSize: 28, color: '#B8B8D0', fontWeight: '600' },
  amountInput: { fontSize: 36, fontWeight: '800', color: '#5A5A7A', minWidth: 100, textAlign: 'center' },
  noteInput: { marginHorizontal: 20, marginBottom: 16, padding: 14, backgroundColor: '#FAFAFA', borderRadius: 12, fontSize: 14, color: '#5A5A7A' },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginHorizontal: 20, marginBottom: 10 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  paymentOption: { width: '31%', padding: 12, borderRadius: 12, alignItems: 'center', gap: 4 },
  paymentOptLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, marginBottom: 20 },
  categoryOption: { width: '23%', padding: 10, borderRadius: 12, alignItems: 'center', gap: 4 },
  categoryOptLabel: { fontSize: 9, fontWeight: '600', textAlign: 'center' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, marginBottom: 20, padding: 16, backgroundColor: '#FF9BB3', borderRadius: 14, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  editBtnRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },
  deleteEditBtn: { flex: 1, backgroundColor: '#FF6B6B' },
  selectAllRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  selectAllText: { fontSize: 14, fontWeight: '600', color: '#5A5A7A' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#FF9BB3', borderColor: '#FF9BB3' },
  smsListContainer: { maxHeight: 350 },
  smsItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  smsIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  smsInfo: { flex: 1 },
  smsMerchant: { fontSize: 13, fontWeight: '600', color: '#5A5A7A' },
  smsMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  smsType: { fontSize: 11, fontWeight: '600' },
  smsDateText: { fontSize: 11, color: '#B8B8D0' },
  smsAmount: { fontSize: 14, fontWeight: '700' },
  donutCenter: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -60 }, { translateY: -25 }], width: 120, alignItems: 'center' },
  donutLabel: { fontSize: 11, color: '#B8B8D0' },
  donutAmount: { fontSize: 20, fontWeight: '800', color: '#5A5A7A' },
});
