import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight, X, Check, Trash2, TrendingUp, TrendingDown, Search, RefreshCw, Smartphone, Clock, Building2, Download, Edit3, Moon, Sun, CreditCard, Calendar, BarChart3 } from 'lucide-react';

// Storage helper functions (localStorage for web, AsyncStorage for native)
const Storage = {
  getItem: async (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.error('Storage getItem error:', e);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage setItem error:', e);
      return false;
    }
  },
  removeItem: async (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage removeItem error:', e);
      return false;
    }
  }
};

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
  { id: 'subscription', name: 'Subscriptions', icon: 'movie', type: 'expense' },
  { id: 'personal', name: 'Personal Care', icon: 'salon', type: 'expense' },
  { id: 'education', name: 'Education', icon: 'book', type: 'expense' },
  { id: 'gifts', name: 'Gifts', icon: 'gift', type: 'expense' },
  { id: 'other', name: 'Other', icon: 'other', type: 'expense' },
  { id: 'salary', name: 'Salary', icon: 'salary', type: 'income' },
  { id: 'bonus', name: 'Bonus', icon: 'bonus', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: 'freelance', type: 'income' },
  { id: 'refund', name: 'Refund', icon: 'refund', type: 'income' },
  { id: 'interest', name: 'Interest', icon: 'interest', type: 'income' },
  { id: 'dividend', name: 'Dividend', icon: 'invest', type: 'income' },
];

// Helper function to export transactions to CSV
const exportToCSV = (transactions, categories) => {
  const headers = ['Date', 'Type', 'Category', 'Note', 'Amount', 'Payment Mode', 'Source'];
  const rows = transactions.map(t => {
    const cat = categories.find(c => c.id === t.category);
    return [
      t.date,
      t.type,
      cat?.name || t.category,
      `"${t.note.replace(/"/g, '""')}"`,
      t.amount,
      t.paymentMode,
      t.source || 'manual'
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `money-plus-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// Format date for input
const formatDateForInput = (date) => {
  if (!date) return new Date().toISOString().split('T')[0];
  return date;
};

// Format currency
const formatCurrency = (amount) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(amount));
const getMonthName = (month) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month];

// Sample transactions with SMS source
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
    <div style={{ position: 'relative', width: size, height: size, margin: '20px auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#F5F5F5" strokeWidth={strokeWidth} />
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.total / total) * 100 : 0;
          const strokeDasharray = circumference;
          const strokeDashoffset = circumference - (percentage / 100) * circumference;
          const rotation = (cumulativePercent / 100) * 360;
          cumulativePercent += percentage;
          return (
            <circle
              key={item.id}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={colors[index % colors.length]}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              style={{ transform: `rotate(${rotation}deg)`, transformOrigin: 'center' }}
            />
          );
        })}
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        background: '#fff',
        borderRadius: '50%',
        width: size - strokeWidth * 2 - 10,
        height: size - strokeWidth * 2 - 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: '11px', color: '#B8B8D0' }}>Total Expenses</div>
        <div style={{ fontSize: '20px', fontWeight: '800', color: '#5A5A7A' }}>{formatCurrency(total)}</div>
      </div>
    </div>
  );
};

export default function MoneyPlusTracker() {
  const [transactions, setTransactions] = useState(sampleTransactions);
  const [categories, setCategories] = useState(defaultCategories);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [transactionType, setTransactionType] = useState('expense');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [newTransaction, setNewTransaction] = useState({ amount: '', note: '', category: 'food', paymentMode: 'upi', date: new Date().toISOString().split('T')[0] });
  const [budget, setBudget] = useState(50000);
  const [chartView, setChartView] = useState('category');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailView, setDetailView] = useState(null);
  const [smsLoading, setSmsLoading] = useState(false);
  const [selectedSMS, setSelectedSMS] = useState({});
  const [lastSyncDate, setLastSyncDate] = useState('17 Jan 2025');
  const [darkMode, setDarkMode] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showCardMappingModal, setShowCardMappingModal] = useState(false);
  const [cardMappings, setCardMappings] = useState([]);
  const [newCardMapping, setNewCardMapping] = useState({ last4: '', type: 'debit' });
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedTransactions = await Storage.getItem('transactions');
        const savedBudget = await Storage.getItem('budget');
        const savedCardMappings = await Storage.getItem('cardMappings');
        const savedDarkMode = await Storage.getItem('darkMode');
        const savedLastSync = await Storage.getItem('lastSyncDate');
        const savedCategories = await Storage.getItem('categories');

        if (savedTransactions && savedTransactions.length > 0) {
          setTransactions(savedTransactions);
        }
        if (savedBudget) setBudget(savedBudget);
        if (savedCardMappings) setCardMappings(savedCardMappings);
        if (savedDarkMode !== null) setDarkMode(savedDarkMode);
        if (savedLastSync) setLastSyncDate(savedLastSync);
        if (savedCategories && savedCategories.length > 0) setCategories(savedCategories);

        setDataLoaded(true);
      } catch (e) {
        console.error('Error loading data:', e);
        setDataLoaded(true);
      }
    };
    loadData();
  }, []);

  // Save data to storage whenever it changes
  useEffect(() => {
    if (dataLoaded) {
      Storage.setItem('transactions', transactions);
    }
  }, [transactions, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      Storage.setItem('budget', budget);
    }
  }, [budget, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      Storage.setItem('cardMappings', cardMappings);
    }
  }, [cardMappings, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      Storage.setItem('darkMode', darkMode);
    }
  }, [darkMode, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      Storage.setItem('categories', categories);
    }
  }, [categories, dataLoaded]);

  const colors = ['#FF6B8A', '#9B6BFF', '#6BAFFF', '#FFB86B', '#6BFF9B', '#FF6BDF'];

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
    if (!amount || amount <= 0) return alert('Enter valid amount');
    const cat = categories.find(c => c.id === newTransaction.category);
    setTransactions(prev => [{
      id: Date.now(),
      amount,
      note: newTransaction.note || cat?.name || 'Transaction',
      category: newTransaction.category,
      paymentMode: newTransaction.paymentMode,
      date: newTransaction.date || new Date().toISOString().split('T')[0],
      type: transactionType,
      source: 'manual',
    }, ...prev]);
    setNewTransaction({ amount: '', note: '', category: transactionType === 'income' ? 'salary' : 'food', paymentMode: 'upi', date: new Date().toISOString().split('T')[0] });
    setShowAddModal(false);
  };

  // Card mapping functions
  const addCardMapping = () => {
    if (!newCardMapping.last4 || newCardMapping.last4.length !== 4) {
      return alert('Enter valid 4-digit card number');
    }
    if (cardMappings.some(c => c.last4 === newCardMapping.last4)) {
      return alert('Card already mapped');
    }
    setCardMappings(prev => [...prev, { ...newCardMapping, id: Date.now() }]);
    setNewCardMapping({ last4: '', type: 'debit' });
  };

  const deleteCardMapping = (id) => {
    setCardMappings(prev => prev.filter(c => c.id !== id));
  };

  // Get payment mode from card last 4 digits
  const getPaymentModeFromCard = (cardLast4) => {
    if (!cardLast4) return null;
    const mapping = cardMappings.find(c => c.last4 === cardLast4);
    return mapping ? mapping.type : null;
  };

  // Calculate insights
  const getInsights = () => {
    const thisMonthTxns = monthTransactions.filter(t => t.type === 'expense');
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthTxns = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear && t.type === 'expense';
    });

    const thisMonthTotal = thisMonthTxns.reduce((s, t) => s + t.amount, 0);
    const lastMonthTotal = lastMonthTxns.reduce((s, t) => s + t.amount, 0);
    const dailyAverage = thisMonthTotal / (new Date().getDate());

    // Top spending category
    const catSpending = {};
    thisMonthTxns.forEach(t => {
      catSpending[t.category] = (catSpending[t.category] || 0) + t.amount;
    });
    const topCategory = Object.entries(catSpending).sort((a, b) => b[1] - a[1])[0];

    // Spending trend
    const trend = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1) : 0;

    return {
      thisMonthTotal,
      lastMonthTotal,
      dailyAverage,
      topCategory: topCategory ? { id: topCategory[0], amount: topCategory[1] } : null,
      trend,
      transactionCount: thisMonthTxns.length,
      budgetUsed: ((thisMonthTotal / budget) * 100).toFixed(1)
    };
  };

  const deleteTransaction = (id) => {
    if (confirm('Delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const openEditModal = (t) => {
    setEditTransaction({ ...t, amount: t.amount.toString() });
    setShowEditModal(true);
  };

  const saveEditedTransaction = () => {
    if (!editTransaction) return;
    const amount = parseFloat(editTransaction.amount);
    if (!amount || amount <= 0) return alert('Enter valid amount');
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
    if (selected.length === 0) return alert('Select at least one transaction');
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
    alert(`${selected.length} transactions imported!`);
  };

  const getDetailTransactions = () => {
    if (!detailView) return [];
    if (detailView.type === 'category') {
      return monthTransactions.filter(t => t.category === detailView.id && t.type === 'expense');
    }
    return monthTransactions.filter(t => t.paymentMode === detailView.id && t.type === 'expense');
  };

  const theme = darkMode ? {
    bg: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
    card: '#1e1e3f',
    text: '#e0e0e0',
    textMuted: '#888',
    border: '#333'
  } : {
    bg: 'linear-gradient(180deg, #FFF9FC 0%, #FFF5F8 50%, #FFEEF4 100%)',
    card: '#fff',
    text: '#5A5A7A',
    textMuted: '#B8B8D0',
    border: '#f5f5f5'
  };

  return (
    <div style={{ ...styles.container, background: theme.bg }}>
      {/* Background decorations */}
      <div style={styles.bgDecor1} />
      <div style={styles.bgDecor2} />

      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.appTitle}>💰 Money+</h1>
        <div style={styles.monthSelector}>
          <button style={styles.monthBtn} onClick={prevMonth}><ChevronLeft size={18} /></button>
          <span style={styles.monthText}>{getMonthName(currentMonth).slice(0, 3)} {currentYear}</span>
          <button style={styles.monthBtn} onClick={nextMonth}><ChevronRight size={18} /></button>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <>
            {/* Balance Card */}
            <div style={styles.balanceCard}>
              <div style={styles.balanceLabel}>Total Balance</div>
              <div style={styles.balanceAmount}>{formatCurrency(balance)}</div>
              <div style={styles.balanceRow}>
                <div style={styles.incomeBox}>
                  <TrendingUp size={16} color="#4CAF50" />
                  <div>
                    <div style={styles.miniLabel}>Income</div>
                    <div style={styles.incomeAmount}>{formatCurrency(totalIncome)}</div>
                  </div>
                </div>
                <div style={styles.expenseBox}>
                  <TrendingDown size={16} color="#FF6B8A" />
                  <div>
                    <div style={styles.miniLabel}>Expense</div>
                    <div style={styles.expenseAmount}>{formatCurrency(totalExpense)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* SMS Sync Button */}
            <button style={styles.syncButton} onClick={syncSMS} disabled={smsLoading}>
              {smsLoading ? (
                <RefreshCw size={18} color="#FF9BB3" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Smartphone size={18} color="#FF9BB3" />
              )}
              <span style={styles.syncButtonText}>
                {smsLoading ? 'Scanning SMS...' : 'Sync Bank SMS'}
              </span>
              <span style={styles.syncDate}>Last: {lastSyncDate}</span>
            </button>

            {/* Budget Progress */}
            <div style={styles.budgetSection}>
              <div style={styles.budgetHeader}>
                <span style={styles.budgetTitle}>Monthly Budget</span>
                <span style={styles.budgetValue}>{formatCurrency(totalExpense)} / {formatCurrency(budget)}</span>
              </div>
              <div style={styles.budgetTrack}>
                <div style={{
                  ...styles.budgetFill,
                  width: `${Math.min((totalExpense / budget) * 100, 100)}%`,
                  background: totalExpense > budget ? '#FF6B6B' : totalExpense > budget * 0.8 ? '#FFB347' : '#4CAF50'
                }} />
              </div>
              <div style={styles.budgetRemaining}>
                {totalExpense > budget
                  ? <span style={{ color: '#FF6B6B' }}>⚠️ Over budget by {formatCurrency(totalExpense - budget)}</span>
                  : <span style={{ color: '#4CAF50' }}>✓ {formatCurrency(budget - totalExpense)} remaining</span>
                }
              </div>
            </div>

            {/* Payment Mode Summary */}
            <div style={styles.paymentSummary}>
              {paymentModes.slice(0, 4).map(mode => {
                const modeTotal = monthTransactions.filter(t => t.paymentMode === mode.id && t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                return (
                  <div key={mode.id} style={styles.paymentModeCard}>
                    <span style={{ fontSize: '20px' }}>{mode.emoji}</span>
                    <span style={styles.paymentModeName}>{mode.name.split(' ')[0]}</span>
                    <span style={styles.paymentModeAmount}>{formatCurrency(modeTotal)}</span>
                  </div>
                );
              })}
            </div>

            {/* Search */}
            <div style={styles.searchBox}>
              <Search size={18} color="#B8B8D0" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            {/* Transactions */}
            <div style={styles.sectionTitle}>Recent Transactions</div>
            {filteredTransactions.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyEmoji}>📝</div>
                <p style={styles.emptyText}>No transactions yet!</p>
                <p style={styles.emptySubtext}>Tap + or sync SMS to add</p>
              </div>
            ) : (
              groupByDate(filteredTransactions).map((group) => (
                <div key={group.date} style={styles.dateGroup}>
                  <div style={styles.dateHeader}>
                    <span style={styles.dateHeaderText}>{formatDateHeader(group.date)}</span>
                    <span style={styles.dateHeaderAmount}>
                      {group.totalExpense > 0 && <span style={{ color: '#FF6B8A' }}>-{formatCurrency(group.totalExpense)}</span>}
                      {group.totalExpense > 0 && group.totalIncome > 0 && ' / '}
                      {group.totalIncome > 0 && <span style={{ color: '#4CAF50' }}>+{formatCurrency(group.totalIncome)}</span>}
                    </span>
                  </div>
                  {group.transactions.map((t) => {
                    const cat = categories.find(c => c.id === t.category) || categories[0];
                    const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                    const payMode = paymentModes.find(p => p.id === t.paymentMode) || paymentModes[0];
                    return (
                      <div key={t.id} style={{ ...styles.transactionItem, cursor: 'pointer' }} onClick={() => openEditModal(t)}>
                        <div style={{ ...styles.transactionIcon, background: iconData.bg }}>
                          <span style={{ fontSize: '22px' }}>{iconData.emoji}</span>
                        </div>
                        <div style={styles.transactionInfo}>
                          <span style={styles.transactionNote}>{t.note}</span>
                          <div style={styles.transactionMeta}>
                            <span style={{ ...styles.paymentBadge, background: payMode.bg, color: payMode.color }}>
                              {payMode.emoji} {payMode.name.split(' ')[0]}
                            </span>
                            {t.source === 'sms' && (
                              <span style={styles.smsBadge}>📱 Auto</span>
                            )}
                            <span style={styles.categoryLabel}>{cat.name}</span>
                          </div>
                        </div>
                        <div style={styles.transactionRight}>
                          <span style={{ ...styles.transactionAmount, color: t.type === 'income' ? '#4CAF50' : '#FF6B8A' }}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </span>
                          <button style={{ ...styles.deleteBtn, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); deleteTransaction(t.id); }}>
                            <Trash2 size={14} color="#FF6B8A" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </>
        )}

        {/* CHARTS TAB */}
        {activeTab === 'charts' && (
          <>
            {detailView ? (
              <div>
                <div style={styles.detailHeader}>
                  <button style={styles.backBtn} onClick={() => setDetailView(null)}>
                    <ChevronLeft size={24} color="#5A5A7A" />
                  </button>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: detailView.type === 'category'
                      ? (iconLibrary[detailView.icon]?.bg || '#f5f5f5')
                      : (detailView.bg || '#f5f5f5'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '22px' }}>
                      {detailView.type === 'category'
                        ? (iconLibrary[detailView.icon]?.emoji || '📦')
                        : (detailView.emoji || '💳')}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#5A5A7A' }}>{detailView.name}</div>
                    <div style={{ fontSize: '12px', color: '#B8B8D0' }}>
                      {detailView.type === 'category' ? 'Category' : 'Payment Mode'} Details
                    </div>
                  </div>
                </div>

                <div style={{
                  background: detailView.type === 'category'
                    ? (iconLibrary[detailView.icon]?.bg || '#f5f5f5')
                    : (detailView.bg || '#f5f5f5'),
                  borderRadius: '20px', padding: '24px', marginBottom: '24px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '13px', color: '#888', marginBottom: '6px' }}>Total Spent</div>
                  <div style={{ fontSize: '36px', fontWeight: '800', color: '#5A5A7A' }}>
                    {formatCurrency(getDetailTransactions().reduce((s, t) => s + t.amount, 0))}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>
                    {getDetailTransactions().length} transactions this month
                  </div>
                </div>

                <div style={styles.sectionTitle}>All Transactions</div>
                {getDetailTransactions().length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyEmoji}>📭</div>
                    <p style={styles.emptyText}>No transactions</p>
                  </div>
                ) : (
                  groupByDate(getDetailTransactions()).map((group) => (
                    <div key={group.date} style={styles.dateGroup}>
                      <div style={styles.dateHeader}>
                        <span style={styles.dateHeaderText}>{formatDateHeader(group.date)}</span>
                        <span style={{ ...styles.dateHeaderAmount, color: '#FF6B8A' }}>-{formatCurrency(group.totalExpense)}</span>
                      </div>
                      {group.transactions.map(t => {
                        const cat = categories.find(c => c.id === t.category) || categories[0];
                        const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                        const payMode = paymentModes.find(p => p.id === t.paymentMode) || paymentModes[0];
                        return (
                          <div key={t.id} style={{ ...styles.transactionItem, cursor: 'pointer' }} onClick={() => openEditModal(t)}>
                            <div style={{ ...styles.transactionIcon, background: iconData.bg }}>
                              <span style={{ fontSize: '22px' }}>{iconData.emoji}</span>
                            </div>
                            <div style={styles.transactionInfo}>
                              <span style={styles.transactionNote}>{t.note}</span>
                              <div style={styles.transactionMeta}>
                                <span style={{ ...styles.paymentBadge, background: payMode.bg, color: payMode.color }}>
                                  {payMode.emoji} {payMode.name.split(' ')[0]}
                                </span>
                              </div>
                            </div>
                            <span style={{ ...styles.transactionAmount, color: '#FF6B8A' }}>-{formatCurrency(t.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                <div style={styles.chartToggle}>
                  <button
                    style={{ ...styles.chartToggleBtn, background: chartView === 'category' ? '#FF9BB3' : '#f5f5f5', color: chartView === 'category' ? '#fff' : '#666' }}
                    onClick={() => setChartView('category')}
                  >
                    📁 By Category
                  </button>
                  <button
                    style={{ ...styles.chartToggleBtn, background: chartView === 'payment' ? '#FF9BB3' : '#f5f5f5', color: chartView === 'payment' ? '#fff' : '#666' }}
                    onClick={() => setChartView('payment')}
                  >
                    💳 By Payment
                  </button>
                </div>

                {chartView === 'category' ? (
                  categoryStats.length > 0 ? (
                    <>
                      <DonutChart data={categoryStats} total={totalExpense} />
                      {categoryStats.map((cat, index) => {
                        const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                        const percentage = totalExpense > 0 ? ((cat.total / totalExpense) * 100).toFixed(0) : 0;
                        return (
                          <div
                            key={cat.id}
                            style={styles.statsItem}
                            onClick={() => setDetailView({ type: 'category', id: cat.id, name: cat.name, icon: cat.icon })}
                          >
                            <div style={{ ...styles.statsIcon, background: iconData.bg }}>
                              <span style={{ fontSize: '20px' }}>{iconData.emoji}</span>
                            </div>
                            <div style={styles.statsInfo}>
                              <span style={styles.statsName}>{cat.name}</span>
                              <div style={styles.statsBar}>
                                <div style={{ ...styles.statsBarFill, width: `${percentage}%`, background: colors[index % colors.length] }} />
                              </div>
                            </div>
                            <div style={styles.statsRight}>
                              <span style={{ ...styles.statsPercent, color: colors[index % colors.length] }}>{percentage}%</span>
                              <span style={styles.statsAmount}>{formatCurrency(cat.total)}</span>
                            </div>
                            <ChevronRight size={16} color="#ccc" />
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyEmoji}>📊</div>
                      <p style={styles.emptyText}>No expense data</p>
                    </div>
                  )
                ) : (
                  paymentStats.length > 0 ? (
                    <>
                      <div style={styles.paymentChartHeader}>
                        <span>Payment Mode Analysis</span>
                        <span style={{ fontSize: '12px', color: '#888' }}>Total: {formatCurrency(totalExpense)}</span>
                      </div>
                      {paymentStats.map((mode, index) => {
                        const percentage = totalExpense > 0 ? ((mode.total / totalExpense) * 100).toFixed(0) : 0;
                        return (
                          <div
                            key={mode.id}
                            style={styles.statsItem}
                            onClick={() => setDetailView({ type: 'payment', id: mode.id, name: mode.name, emoji: mode.emoji, color: mode.color, bg: mode.bg })}
                          >
                            <div style={{ ...styles.statsIcon, background: mode.bg }}>
                              <span style={{ fontSize: '24px' }}>{mode.emoji}</span>
                            </div>
                            <div style={styles.statsInfo}>
                              <span style={styles.statsName}>{mode.name}</span>
                              <div style={styles.statsBar}>
                                <div style={{ ...styles.statsBarFill, width: `${percentage}%`, background: mode.color }} />
                              </div>
                            </div>
                            <div style={styles.statsRight}>
                              <span style={{ ...styles.statsPercent, color: mode.color }}>{percentage}%</span>
                              <span style={styles.statsAmount}>{formatCurrency(mode.total)}</span>
                            </div>
                            <ChevronRight size={16} color="#ccc" />
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyEmoji}>💳</div>
                      <p style={styles.emptyText}>No payment data</p>
                    </div>
                  )
                )}
              </>
            )}
          </>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <>
            {/* Appearance Section */}
            <div style={{ ...styles.settingsSection, background: theme.card }}>
              <div style={{ ...styles.settingsSectionTitle, color: theme.text }}>🎨 Appearance</div>
              <div style={styles.settingsItem} onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <Moon size={24} color="#9B6BFF" /> : <Sun size={24} color="#FFB86B" />}
                <div style={styles.settingsItemInfo}>
                  <div style={{ ...styles.settingsItemTitle, color: theme.text }}>Dark Mode</div>
                  <div style={{ ...styles.settingsItemDesc, color: theme.textMuted }}>{darkMode ? 'Enabled' : 'Disabled'}</div>
                </div>
                <div style={{
                  width: '50px', height: '28px', borderRadius: '14px',
                  background: darkMode ? '#9B6BFF' : '#ddd',
                  position: 'relative', transition: 'all 0.3s'
                }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: '#fff', position: 'absolute', top: '2px',
                    left: darkMode ? '24px' : '2px', transition: 'all 0.3s'
                  }} />
                </div>
              </div>
            </div>

            {/* SMS Section */}
            <div style={{ ...styles.settingsSection, background: theme.card }}>
              <div style={{ ...styles.settingsSectionTitle, color: theme.text }}>📱 SMS Auto-Sync</div>
              <div style={styles.settingsItem} onClick={syncSMS}>
                <RefreshCw size={24} color="#FF9BB3" />
                <div style={styles.settingsItemInfo}>
                  <div style={{ ...styles.settingsItemTitle, color: theme.text }}>Sync Bank SMS</div>
                  <div style={{ ...styles.settingsItemDesc, color: theme.textMuted }}>Import transactions from bank messages</div>
                </div>
                <ChevronRight size={20} color="#ccc" />
              </div>
              <div style={styles.settingsItem}>
                <Clock size={24} color="#9B6BFF" />
                <div style={styles.settingsItemInfo}>
                  <div style={{ ...styles.settingsItemTitle, color: theme.text }}>Last Synced</div>
                  <div style={{ ...styles.settingsItemDesc, color: theme.textMuted }}>{lastSyncDate}, 10:30 AM</div>
                </div>
              </div>
            </div>

            {/* Budget Section */}
            <div style={{ ...styles.settingsSection, background: theme.card }}>
              <div style={{ ...styles.settingsSectionTitle, color: theme.text }}>🎯 Budget Settings</div>
              <div style={styles.settingsItem} onClick={() => setShowBudgetModal(true)}>
                <BarChart3 size={24} color="#4CAF50" />
                <div style={styles.settingsItemInfo}>
                  <div style={{ ...styles.settingsItemTitle, color: theme.text }}>Monthly Budget</div>
                  <div style={{ ...styles.settingsItemDesc, color: theme.textMuted }}>{formatCurrency(budget)}</div>
                </div>
                <Edit3 size={20} color="#ccc" />
              </div>
              <div style={styles.settingsItem} onClick={() => setShowInsightsModal(true)}>
                <TrendingUp size={24} color="#FF9BB3" />
                <div style={styles.settingsItemInfo}>
                  <div style={{ ...styles.settingsItemTitle, color: theme.text }}>Monthly Insights</div>
                  <div style={{ ...styles.settingsItemDesc, color: theme.textMuted }}>View spending analytics</div>
                </div>
                <ChevronRight size={20} color="#ccc" />
              </div>
            </div>

            {/* Card Mapping Section */}
            <div style={{ ...styles.settingsSection, background: theme.card }}>
              <div style={{ ...styles.settingsSectionTitle, color: theme.text }}>💳 Card Mapping</div>
              <div style={styles.settingsItem} onClick={() => setShowCardMappingModal(true)}>
                <CreditCard size={24} color="#2196F3" />
                <div style={styles.settingsItemInfo}>
                  <div style={{ ...styles.settingsItemTitle, color: theme.text }}>Manage Cards</div>
                  <div style={{ ...styles.settingsItemDesc, color: theme.textMuted }}>{cardMappings.length} cards mapped</div>
                </div>
                <ChevronRight size={20} color="#ccc" />
              </div>
            </div>

            {/* Export Section */}
            <div style={{ ...styles.settingsSection, background: theme.card }}>
              <div style={{ ...styles.settingsSectionTitle, color: theme.text }}>📤 Data Export</div>
              <div style={styles.settingsItem} onClick={() => exportToCSV(transactions, categories)}>
                <Download size={24} color="#6BAFFF" />
                <div style={styles.settingsItemInfo}>
                  <div style={{ ...styles.settingsItemTitle, color: theme.text }}>Export to CSV</div>
                  <div style={{ ...styles.settingsItemDesc, color: theme.textMuted }}>Download all transactions</div>
                </div>
                <ChevronRight size={20} color="#ccc" />
              </div>
            </div>

            {/* Categories Section */}
            <div style={{ ...styles.settingsSection, background: theme.card }}>
              <div style={styles.catHeader}>
                <div style={{ ...styles.settingsSectionTitle, color: theme.text }}>📁 Categories</div>
              </div>
              <div style={styles.catGrid}>
                {categories.filter(c => c.type === 'expense').slice(0, 8).map(cat => {
                  const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                  return (
                    <div key={cat.id} style={styles.catItem}>
                      <div style={{ ...styles.catIcon, background: iconData.bg }}>
                        <span style={{ fontSize: '24px' }}>{iconData.emoji}</span>
                      </div>
                      <span style={{ ...styles.catName, color: theme.text }}>{cat.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Supported Banks */}
            <div style={{ ...styles.settingsSection, background: theme.card }}>
              <div style={{ ...styles.settingsSectionTitle, color: theme.text }}>🏦 Supported Banks</div>
              <p style={{ ...styles.supportedBanks, color: theme.textMuted }}>
                HDFC • ICICI • SBI • Axis • Kotak • IDFC • Yes Bank • PNB • BOB • Google Pay • PhonePe • Paytm • Amazon Pay • CRED
              </p>
            </div>
          </>
        )}
      </main>

      {/* Add Button */}
      <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
        <Plus size={28} color="#fff" />
      </button>

      {/* Bottom Navigation */}
      <nav style={styles.bottomNav}>
        {[
          { id: 'home', icon: '🏠', label: 'Home' },
          { id: 'charts', icon: '📊', label: 'Charts' },
          { id: 'settings', icon: '⚙️', label: 'Settings' },
        ].map(item => (
          <button
            key={item.id}
            style={styles.navItem}
            onClick={() => { setActiveTab(item.id); setDetailView(null); }}
          >
            <span style={{ fontSize: '22px' }}>{item.icon}</span>
            <span style={{ ...styles.navLabel, color: activeTab === item.id ? '#FF9BB3' : '#B8B8D0' }}>{item.label}</span>
            {activeTab === item.id && <div style={styles.navDot} />}
          </button>
        ))}
      </nav>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add Transaction</h2>
              <button style={styles.closeBtn} onClick={() => setShowAddModal(false)}>
                <X size={24} color="#B8B8D0" />
              </button>
            </div>

            <div style={styles.typeToggle}>
              <button
                style={{ ...styles.typeBtn, background: transactionType === 'expense' ? '#FFE5E5' : '#f5f5f5', color: transactionType === 'expense' ? '#FF6B8A' : '#999' }}
                onClick={() => { setTransactionType('expense'); setNewTransaction(p => ({ ...p, category: 'food' })); }}
              >
                💸 Expense
              </button>
              <button
                style={{ ...styles.typeBtn, background: transactionType === 'income' ? '#E8F5E9' : '#f5f5f5', color: transactionType === 'income' ? '#4CAF50' : '#999' }}
                onClick={() => { setTransactionType('income'); setNewTransaction(p => ({ ...p, category: 'salary' })); }}
              >
                💰 Income
              </button>
            </div>

            <div style={styles.amountSection}>
              <span style={styles.currencySign}>₹</span>
              <input
                type="number"
                placeholder="0"
                style={styles.amountInput}
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction(p => ({ ...p, amount: e.target.value }))}
              />
            </div>

            <input
              type="text"
              placeholder="Add note..."
              style={styles.noteInput}
              value={newTransaction.note}
              onChange={(e) => setNewTransaction(p => ({ ...p, note: e.target.value }))}
            />

            <p style={styles.sectionLabel}>📅 Date</p>
            <input
              type="date"
              style={{ ...styles.noteInput, marginBottom: '16px' }}
              value={newTransaction.date}
              onChange={(e) => setNewTransaction(p => ({ ...p, date: e.target.value }))}
            />

            {transactionType === 'expense' && (
              <>
                <p style={styles.sectionLabel}>💳 Payment Mode</p>
                <div style={styles.paymentGrid}>
                  {paymentModes.map(mode => (
                    <button
                      key={mode.id}
                      style={{
                        ...styles.paymentOption,
                        background: newTransaction.paymentMode === mode.id ? mode.bg : '#f9f9f9',
                        border: newTransaction.paymentMode === mode.id ? `2px solid ${mode.color}` : '2px solid transparent'
                      }}
                      onClick={() => setNewTransaction(p => ({ ...p, paymentMode: mode.id }))}
                    >
                      <span style={{ fontSize: '20px' }}>{mode.emoji}</span>
                      <span style={{ ...styles.paymentOptLabel, color: newTransaction.paymentMode === mode.id ? mode.color : '#888' }}>{mode.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <p style={styles.sectionLabel}>📁 Category</p>
            <div style={styles.categoryGrid}>
              {categories.filter(c => c.type === transactionType).map(cat => {
                const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                const isSelected = newTransaction.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    style={{
                      ...styles.categoryOption,
                      background: isSelected ? iconData.bg : '#f9f9f9',
                      border: isSelected ? '2px solid #FF9BB3' : '2px solid transparent'
                    }}
                    onClick={() => setNewTransaction(p => ({ ...p, category: cat.id }))}
                  >
                    <span style={{ fontSize: '22px' }}>{iconData.emoji}</span>
                    <span style={{ ...styles.categoryOptLabel, color: isSelected ? '#5A5A7A' : '#B8B8D0' }}>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            <button style={styles.saveBtn} onClick={addTransaction}>
              <Check size={22} color="#fff" />
              <span>Save Transaction</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditModal && editTransaction && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>✏️ Edit Transaction</h2>
              <button style={styles.closeBtn} onClick={() => { setShowEditModal(false); setEditTransaction(null); }}>
                <X size={24} color="#B8B8D0" />
              </button>
            </div>

            <div style={styles.amountSection}>
              <span style={styles.currencySign}>₹</span>
              <input
                type="number"
                placeholder="0"
                style={styles.amountInput}
                value={editTransaction.amount}
                onChange={(e) => setEditTransaction(p => ({ ...p, amount: e.target.value }))}
              />
            </div>

            <input
              type="text"
              placeholder="Add note..."
              style={styles.noteInput}
              value={editTransaction.note}
              onChange={(e) => setEditTransaction(p => ({ ...p, note: e.target.value }))}
            />

            {editTransaction.type === 'expense' && (
              <>
                <p style={styles.sectionLabel}>💳 Payment Mode</p>
                <div style={styles.paymentGrid}>
                  {paymentModes.map(mode => (
                    <button
                      key={mode.id}
                      style={{
                        ...styles.paymentOption,
                        background: editTransaction.paymentMode === mode.id ? mode.bg : '#f9f9f9',
                        border: editTransaction.paymentMode === mode.id ? `2px solid ${mode.color}` : '2px solid transparent'
                      }}
                      onClick={() => setEditTransaction(p => ({ ...p, paymentMode: mode.id }))}
                    >
                      <span style={{ fontSize: '20px' }}>{mode.emoji}</span>
                      <span style={{ ...styles.paymentOptLabel, color: editTransaction.paymentMode === mode.id ? mode.color : '#888' }}>{mode.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            <p style={styles.sectionLabel}>📁 Category</p>
            <div style={styles.categoryGrid}>
              {categories.filter(c => c.type === editTransaction.type).map(cat => {
                const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                const isSelected = editTransaction.category === cat.id;
                return (
                  <button
                    key={cat.id}
                    style={{
                      ...styles.categoryOption,
                      background: isSelected ? iconData.bg : '#f9f9f9',
                      border: isSelected ? '2px solid #FF9BB3' : '2px solid transparent'
                    }}
                    onClick={() => setEditTransaction(p => ({ ...p, category: cat.id }))}
                  >
                    <span style={{ fontSize: '22px' }}>{iconData.emoji}</span>
                    <span style={{ ...styles.categoryOptLabel, color: isSelected ? '#5A5A7A' : '#B8B8D0' }}>{cat.name}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px', padding: '0 20px 20px' }}>
              <button style={{ ...styles.saveBtn, flex: 1, background: '#FF6B6B' }} onClick={() => { deleteTransaction(editTransaction.id); setShowEditModal(false); setEditTransaction(null); }}>
                <Trash2 size={20} color="#fff" />
                <span>Delete</span>
              </button>
              <button style={{ ...styles.saveBtn, flex: 2 }} onClick={saveEditedTransaction}>
                <Check size={22} color="#fff" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SMS Import Modal */}
      {showSMSModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📱 Import Transactions</h2>
              <button style={styles.closeBtn} onClick={() => { setShowSMSModal(false); setSelectedSMS({}); }}>
                <X size={24} color="#B8B8D0" />
              </button>
            </div>

            <div style={styles.selectAllRow} onClick={selectAllSMS}>
              <input type="checkbox" checked={sampleSMSToImport.every(sms => selectedSMS[sms.id])} readOnly style={{ width: 20, height: 20, accentColor: '#FF9BB3' }} />
              <span style={styles.selectAllText}>
                Select All ({Object.keys(selectedSMS).filter(k => selectedSMS[k]).length}/{sampleSMSToImport.length})
              </span>
            </div>

            <div style={styles.smsListContainer}>
              {sampleSMSToImport.map(sms => {
                const cat = categories.find(c => c.id === sms.category) || categories[0];
                const iconData = iconLibrary[cat.icon] || iconLibrary.other;
                const payMode = paymentModes.find(p => p.id === sms.paymentMode) || paymentModes[0];
                const isSelected = selectedSMS[sms.id];
                return (
                  <div
                    key={sms.id}
                    style={{ ...styles.smsItem, background: isSelected ? '#FFF5F8' : '#fff' }}
                    onClick={() => toggleSMSSelection(sms.id)}
                  >
                    <input type="checkbox" checked={isSelected || false} readOnly style={{ width: 20, height: 20, accentColor: '#FF9BB3' }} />
                    <div style={{ ...styles.smsIcon, background: iconData.bg }}>
                      <span style={{ fontSize: '18px' }}>{iconData.emoji}</span>
                    </div>
                    <div style={styles.smsInfo}>
                      <div style={styles.smsMerchant}>{sms.merchant}</div>
                      <div style={styles.smsMetaRow}>
                        <span style={{ ...styles.smsType, color: sms.type === 'income' ? '#4CAF50' : '#FF6B8A' }}>
                          {sms.type === 'income' ? '↓ Income' : '↑ Expense'}
                        </span>
                        <span style={styles.smsDateText}>{sms.date}</span>
                      </div>
                      <span style={{ ...styles.paymentBadge, background: payMode.bg, color: payMode.color, marginTop: '4px', display: 'inline-block' }}>
                        {payMode.emoji} {payMode.name}
                      </span>
                    </div>
                    <span style={{ ...styles.smsAmount, color: sms.type === 'income' ? '#4CAF50' : '#FF6B8A' }}>
                      {sms.type === 'income' ? '+' : '-'}{formatCurrency(sms.amount)}
                    </span>
                  </div>
                );
              })}
            </div>

            <button style={{ ...styles.saveBtn, margin: '16px 20px 20px' }} onClick={importSelectedSMS}>
              <span>Import {Object.keys(selectedSMS).filter(k => selectedSMS[k]).length} Transactions</span>
            </button>
          </div>
        </div>
      )}

      {/* Budget Edit Modal */}
      {showBudgetModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxHeight: '50vh' }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>🎯 Set Monthly Budget</h2>
              <button style={styles.closeBtn} onClick={() => setShowBudgetModal(false)}>
                <X size={24} color="#B8B8D0" />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={styles.amountSection}>
                <span style={styles.currencySign}>₹</span>
                <input
                  type="number"
                  placeholder="50000"
                  style={styles.amountInput}
                  value={budget}
                  onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                />
              </div>
              <p style={{ fontSize: '12px', color: '#888', textAlign: 'center', marginBottom: '20px' }}>
                Set your monthly spending limit to track your budget
              </p>
              <button style={styles.saveBtn} onClick={() => setShowBudgetModal(false)}>
                <Check size={22} color="#fff" />
                <span>Save Budget</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Mapping Modal */}
      {showCardMappingModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxHeight: '80vh' }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>💳 Card Mapping</h2>
              <button style={styles.closeBtn} onClick={() => setShowCardMappingModal(false)}>
                <X size={24} color="#B8B8D0" />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                Map your card last 4 digits to automatically detect payment mode from SMS
              </p>

              {/* Add new card mapping */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Last 4 digits"
                  maxLength={4}
                  style={{ ...styles.noteInput, flex: 1, marginBottom: 0 }}
                  value={newCardMapping.last4}
                  onChange={(e) => setNewCardMapping(p => ({ ...p, last4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                />
                <select
                  style={{ ...styles.noteInput, flex: 1, marginBottom: 0 }}
                  value={newCardMapping.type}
                  onChange={(e) => setNewCardMapping(p => ({ ...p, type: e.target.value }))}
                >
                  <option value="debit">Debit Card</option>
                  <option value="credit">Credit Card</option>
                  <option value="upi">UPI</option>
                </select>
                <button
                  style={{ ...styles.saveBtn, width: 'auto', margin: 0, padding: '12px 16px' }}
                  onClick={addCardMapping}
                >
                  <Plus size={20} color="#fff" />
                </button>
              </div>

              {/* Existing mappings */}
              <div style={{ maxHeight: '300px', overflow: 'auto' }}>
                {cardMappings.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                    No cards mapped yet. Add your first card above.
                  </p>
                ) : (
                  cardMappings.map(card => (
                    <div key={card.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px', background: '#f9f9f9', borderRadius: '12px', marginBottom: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '24px' }}>
                          {card.type === 'credit' ? '💳' : card.type === 'upi' ? '📱' : '🏧'}
                        </span>
                        <div>
                          <div style={{ fontWeight: '600', color: '#5A5A7A' }}>••••{card.last4}</div>
                          <div style={{ fontSize: '12px', color: '#888', textTransform: 'capitalize' }}>{card.type} Card</div>
                        </div>
                      </div>
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() => deleteCardMapping(card.id)}
                      >
                        <Trash2 size={18} color="#FF6B8A" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights Modal */}
      {showInsightsModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modal, maxHeight: '85vh' }}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>📊 Monthly Insights</h2>
              <button style={styles.closeBtn} onClick={() => setShowInsightsModal(false)}>
                <X size={24} color="#B8B8D0" />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              {(() => {
                const insights = getInsights();
                const topCat = insights.topCategory ? categories.find(c => c.id === insights.topCategory.id) : null;
                return (
                  <>
                    <div style={{
                      background: 'linear-gradient(135deg, #FFB6C1 0%, #FF9BB3 100%)',
                      borderRadius: '20px', padding: '24px', marginBottom: '16px', color: '#fff'
                    }}>
                      <div style={{ fontSize: '13px', opacity: 0.9 }}>Total Spent This Month</div>
                      <div style={{ fontSize: '36px', fontWeight: '800' }}>{formatCurrency(insights.thisMonthTotal)}</div>
                      <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.9 }}>
                        {insights.budgetUsed}% of budget used
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                      <div style={{ background: '#E8F5E9', borderRadius: '16px', padding: '16px' }}>
                        <div style={{ fontSize: '11px', color: '#4CAF50' }}>Daily Average</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#2E7D32' }}>
                          {formatCurrency(insights.dailyAverage)}
                        </div>
                      </div>
                      <div style={{ background: '#E3F2FD', borderRadius: '16px', padding: '16px' }}>
                        <div style={{ fontSize: '11px', color: '#2196F3' }}>Transactions</div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1565C0' }}>
                          {insights.transactionCount}
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#FFF3E0', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
                      <div style={{ fontSize: '11px', color: '#FF9800' }}>vs Last Month</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: insights.trend >= 0 ? '#FF6B6B' : '#4CAF50' }}>
                          {insights.trend >= 0 ? '↑' : '↓'} {Math.abs(insights.trend)}%
                        </div>
                        <span style={{ fontSize: '12px', color: '#888' }}>
                          ({formatCurrency(insights.lastMonthTotal)} last month)
                        </span>
                      </div>
                    </div>

                    {topCat && (
                      <div style={{ background: '#F3E5F5', borderRadius: '16px', padding: '16px' }}>
                        <div style={{ fontSize: '11px', color: '#9C27B0' }}>Top Spending Category</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                          <span style={{ fontSize: '28px' }}>{iconLibrary[topCat.icon]?.emoji || '📦'}</span>
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#7B1FA2' }}>{topCat.name}</div>
                            <div style={{ fontSize: '14px', color: '#9C27B0' }}>{formatCurrency(insights.topCategory.amount)}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #B8B8D0; }
      `}</style>
    </div>
  );
}

const styles = {
  container: { fontFamily: "'Nunito', -apple-system, BlinkMacSystemFont, sans-serif", background: 'linear-gradient(180deg, #FFF9FC 0%, #FFF5F8 50%, #FFEEF4 100%)', minHeight: '100vh', maxWidth: '430px', margin: '0 auto', position: 'relative', paddingBottom: '90px', overflow: 'hidden' },
  bgDecor1: { position: 'absolute', top: '-100px', right: '-100px', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,155,179,0.15) 0%, rgba(255,155,179,0) 70%)', pointerEvents: 'none' },
  bgDecor2: { position: 'absolute', bottom: '100px', left: '-80px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(155,107,255,0.1) 0%, rgba(155,107,255,0) 70%)', pointerEvents: 'none' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '50px 20px 16px' },
  appTitle: { fontSize: '22px', fontWeight: '800', color: '#FF9BB3', margin: 0 },
  monthSelector: { display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', padding: '8px 12px', borderRadius: '20px', boxShadow: '0 2px 12px rgba(255,155,179,0.15)' },
  monthBtn: { background: 'none', border: 'none', color: '#FF9BB3', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center' },
  monthText: { fontSize: '13px', fontWeight: '600', color: '#5A5A7A', minWidth: '75px', textAlign: 'center' },
  main: { padding: '0 16px' },
  balanceCard: { background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '12px', boxShadow: '0 4px 20px rgba(255,155,179,0.12)' },
  balanceLabel: { fontSize: '12px', color: '#B8B8D0', marginBottom: '4px' },
  balanceAmount: { fontSize: '32px', fontWeight: '800', color: '#5A5A7A', marginBottom: '16px' },
  balanceRow: { display: 'flex', gap: '12px' },
  incomeBox: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#E8F5E9', padding: '12px', borderRadius: '14px' },
  expenseBox: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#FFE5E5', padding: '12px', borderRadius: '14px' },
  miniLabel: { fontSize: '10px', color: '#888' },
  incomeAmount: { fontSize: '14px', fontWeight: '700', color: '#4CAF50' },
  expenseAmount: { fontSize: '14px', fontWeight: '700', color: '#FF6B8A' },
  syncButton: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#fff', padding: '14px', borderRadius: '14px', border: '1px solid #FFE5E5', marginBottom: '12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  syncButtonText: { fontSize: '14px', fontWeight: '600', color: '#FF9BB3' },
  syncDate: { fontSize: '11px', color: '#B8B8D0', marginLeft: '8px' },
  budgetSection: { background: '#fff', borderRadius: '16px', padding: '14px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  budgetHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  budgetTitle: { fontSize: '12px', fontWeight: '600', color: '#5A5A7A' },
  budgetValue: { fontSize: '11px', color: '#B8B8D0' },
  budgetTrack: { height: '8px', background: '#F5F5F5', borderRadius: '8px', overflow: 'hidden' },
  budgetFill: { height: '100%', borderRadius: '8px', transition: 'width 0.4s ease' },
  budgetRemaining: { fontSize: '11px', textAlign: 'center', marginTop: '8px' },
  paymentSummary: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' },
  paymentModeCard: { background: '#fff', borderRadius: '12px', padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  paymentModeName: { fontSize: '9px', color: '#888' },
  paymentModeAmount: { fontSize: '11px', fontWeight: '700', color: '#5A5A7A' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '10px', background: '#fff', padding: '12px 16px', borderRadius: '14px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
  searchInput: { flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#5A5A7A', background: 'transparent' },
  sectionTitle: { fontSize: '15px', fontWeight: '700', color: '#5A5A7A', marginBottom: '12px' },
  dateGroup: { marginBottom: '16px' },
  dateHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px', marginBottom: '8px', borderBottom: '1px solid #f0f0f0' },
  dateHeaderText: { fontSize: '13px', fontWeight: '700', color: '#FF9BB3' },
  dateHeaderAmount: { fontSize: '12px', fontWeight: '600' },
  transactionItem: { display: 'flex', alignItems: 'center', gap: '12px', background: '#fff', padding: '12px', borderRadius: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', marginBottom: '8px', transition: 'all 0.2s ease', cursor: 'pointer' },
  transactionIcon: { width: '46px', height: '46px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  transactionInfo: { flex: 1, minWidth: 0 },
  transactionNote: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#5A5A7A', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  transactionMeta: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  paymentBadge: { fontSize: '9px', fontWeight: '600', padding: '3px 8px', borderRadius: '10px' },
  smsBadge: { fontSize: '8px', fontWeight: '600', padding: '2px 6px', borderRadius: '8px', background: '#E3F2FD', color: '#2196F3' },
  categoryLabel: { fontSize: '10px', color: '#B8B8D0' },
  transactionRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' },
  transactionAmount: { fontSize: '14px', fontWeight: '700' },
  deleteBtn: { background: 'none', border: 'none', padding: '2px', cursor: 'pointer' },
  emptyState: { textAlign: 'center', padding: '40px 20px' },
  emptyEmoji: { fontSize: '48px', marginBottom: '12px' },
  emptyText: { fontSize: '16px', fontWeight: '600', color: '#5A5A7A', margin: '0 0 4px' },
  emptySubtext: { fontSize: '13px', color: '#B8B8D0', margin: 0 },
  chartToggle: { display: 'flex', gap: '10px', marginBottom: '16px' },
  chartToggleBtn: { flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  paymentChartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '12px', background: '#fff', borderRadius: '12px', fontSize: '14px', fontWeight: '600' },
  statsItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#fff', borderRadius: '14px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' },
  statsIcon: { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statsInfo: { flex: 1, minWidth: 0 },
  statsName: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#5A5A7A', marginBottom: '6px' },
  statsBar: { height: '6px', background: '#F5F5F5', borderRadius: '6px', overflow: 'hidden' },
  statsBarFill: { height: '100%', borderRadius: '6px', transition: 'width 0.3s' },
  statsRight: { textAlign: 'right', minWidth: '70px' },
  statsPercent: { display: 'block', fontSize: '13px', fontWeight: '700' },
  statsAmount: { fontSize: '12px', color: '#888' },
  detailHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', padding: '4px 0' },
  backBtn: { background: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  settingsSection: { background: '#fff', borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' },
  settingsSectionTitle: { fontSize: '15px', fontWeight: '700', color: '#5A5A7A', marginBottom: '12px' },
  settingsItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' },
  settingsItemInfo: { flex: 1 },
  settingsItemTitle: { fontSize: '14px', fontWeight: '600', color: '#5A5A7A' },
  settingsItemDesc: { fontSize: '12px', color: '#B8B8D0', marginTop: '2px' },
  budgetSetting: { marginTop: '8px' },
  settingLabel: { fontSize: '13px', fontWeight: '600', color: '#5A5A7A', marginBottom: '8px' },
  budgetInputRow: { display: 'flex', alignItems: 'center' },
  rupeeSign: { fontSize: '24px', color: '#B8B8D0' },
  budgetInputField: { flex: 1, border: 'none', fontSize: '28px', fontWeight: '700', color: '#5A5A7A', marginLeft: '8px', background: 'transparent', outline: 'none' },
  catHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  addCatBtn: { width: '32px', height: '32px', borderRadius: '50%', background: '#FFF0F5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  catGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' },
  catItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' },
  catIcon: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: '10px', fontWeight: '600', color: '#5A5A7A', textAlign: 'center', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  supportedBanks: { fontSize: '12px', color: '#888', lineHeight: '20px' },
  addBtn: { position: 'fixed', bottom: '95px', left: '50%', transform: 'translateX(-50%)', width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #FFB6C1 0%, #FF9BB3 100%)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 6px 20px rgba(255,155,179,0.4)', zIndex: 100 },
  bottomNav: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '430px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,0,0,0.04)', display: 'flex', justifyContent: 'space-around', padding: '10px 0 26px', zIndex: 99 },
  navItem: { background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer', padding: '6px 20px', position: 'relative' },
  navLabel: { fontSize: '10px', fontWeight: '600' },
  navDot: { position: 'absolute', bottom: '0px', width: '4px', height: '4px', borderRadius: '50%', background: '#FF9BB3' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(90,90,122,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(4px)' },
  modal: { background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: '430px', maxHeight: '92vh', overflow: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #f5f5f5' },
  modalTitle: { fontSize: '18px', fontWeight: '700', color: '#5A5A7A', margin: 0 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  typeToggle: { display: 'flex', gap: '10px', padding: '14px 20px' },
  typeBtn: { flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  amountSection: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '16px', padding: '16px', background: '#FAFAFA', borderRadius: '16px', margin: '0 20px 16px' },
  currencySign: { fontSize: '28px', color: '#B8B8D0', fontWeight: '600' },
  amountInput: { background: 'transparent', border: 'none', fontSize: '36px', fontWeight: '800', color: '#5A5A7A', width: '160px', textAlign: 'center', outline: 'none' },
  noteInput: { width: 'calc(100% - 40px)', margin: '0 20px 16px', padding: '14px', background: '#FAFAFA', border: 'none', borderRadius: '12px', fontSize: '14px', color: '#5A5A7A', outline: 'none' },
  sectionLabel: { fontSize: '13px', fontWeight: '600', color: '#888', margin: '0 20px 10px' },
  paymentGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '0 20px', marginBottom: '16px' },
  paymentOption: { padding: '12px 8px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', border: '2px solid transparent' },
  paymentOptLabel: { fontSize: '10px', fontWeight: '600', textAlign: 'center' },
  categoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '0 20px', maxHeight: '200px', overflow: 'auto', marginBottom: '20px' },
  categoryOption: { padding: '10px 4px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', border: '2px solid transparent' },
  categoryOptLabel: { fontSize: '9px', fontWeight: '600', textAlign: 'center', maxWidth: '55px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  saveBtn: { width: 'calc(100% - 40px)', margin: '0 20px 20px', padding: '16px', background: 'linear-gradient(135deg, #FFB6C1 0%, #FF9BB3 100%)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 6px 20px rgba(255,155,179,0.3)' },
  selectAllRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' },
  selectAllText: { fontSize: '14px', fontWeight: '600', color: '#5A5A7A' },
  smsListContainer: { maxHeight: '350px', overflow: 'auto' },
  smsItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 20px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer' },
  smsIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  smsInfo: { flex: 1 },
  smsMerchant: { fontSize: '13px', fontWeight: '600', color: '#5A5A7A' },
  smsMetaRow: { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' },
  smsType: { fontSize: '11px', fontWeight: '600' },
  smsDateText: { fontSize: '11px', color: '#B8B8D0' },
  smsAmount: { fontSize: '14px', fontWeight: '700' },
};
