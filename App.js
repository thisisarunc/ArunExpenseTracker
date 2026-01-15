// App.js
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Switch,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Share
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, Entypo, FontAwesome5 } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAll } from 'react-native-get-sms-android';

const SCREEN_WIDTH = Dimensions.get('window').width;

////////////////////////////////////////////////////////////////////////////////
// Constants and Utility
////////////////////////////////////////////////////////////////////////////////

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'INR', symbol: '₹' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'BRL', symbol: 'R$' },
];
const DEFAULT_CURRENCY = CURRENCIES[0];

const PAYMENT_MODES = [
  { value: 'Cash', icon: 'cash' },
  { value: 'Credit Card', icon: 'credit-card' },
  { value: 'Debit Card', icon: 'credit-card' },
  { value: 'Wallet', icon: 'wallet' },
  { value: 'UPI', icon: 'cellphone' },
  { value: 'NetBanking', icon: 'bank' }
];

const CATEGORY_COLORS = [
  '#4e54c8', '#16d9e3', '#f857a6',
  '#ada996', '#43cea2', '#ff9966',
  '#f37335', '#00c6ff', '#11998e'
];

const TRANSACTION_TYPES = ['Income', 'Expense'];

////////////////////////////////////////////////////////////////////////////////
// Storage Keys
////////////////////////////////////////////////////////////////////////////////

const STORAGE_KEYS = {
  transactions: '@transactions_v1',
  categories: '@categories_v1',
  prefs: '@prefs_v1'
};

////////////////////////////////////////////////////////////////////////////////
// Helper functions
////////////////////////////////////////////////////////////////////////////////
function uuidv4() {
  // Random UUID
  return (
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    })
  );
}
function formatDate(iso) {
  if (!iso) return '';
  // "YYYY-MM-DD"
  let d = new Date(iso);
  const pad = n => (n < 10 ? '0' + n : n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatDisplayDate(iso) {
  if (!iso) return '';
  let d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
function currencySymbol(currencyCode) {
  const cur = CURRENCIES.find(c => c.code === currencyCode);
  return cur ? cur.symbol : '$';
}

////////////////////////////////////////////////////////////////////////////////
// Default Data
////////////////////////////////////////////////////////////////////////////////

const DEFAULT_CATEGORIES = [
  { name: "Food", color: CATEGORY_COLORS[0], budget: 300 },
  { name: "Transport", color: CATEGORY_COLORS[1], budget: 150 },
  { name: "Shopping", color: CATEGORY_COLORS[2], budget: 200 },
  { name: "Bills", color: CATEGORY_COLORS[3], budget: 250 },
  { name: "Salary", color: CATEGORY_COLORS[4], budget: null },
  { name: "Other", color: CATEGORY_COLORS[5], budget: 100 }
];

////////////////////////////////////////////////////////////////////////////////
// Main App
////////////////////////////////////////////////////////////////////////////////

export default function App() {
  /////////////////////////////////////////////////////////////////////////////
  // States
  /////////////////////////////////////////////////////////////////////////////
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [prefs, setPrefs] = useState({
    darkMode: false,
    currency: DEFAULT_CURRENCY.code
  });

  // MODALS
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSMSImportModal, setShowSMSImportModal] = useState(false);

  // ADD/EDIT form
  const [formType, setFormType] = useState('Expense');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState(categories[0].name);
  const [formDate, setFormDate] = useState(formatDate(new Date()));
  const [formNote, setFormNote] = useState('');
  const [formCurrency, setFormCurrency] = useState(prefs.currency);
  const [formPaymentMode, setFormPaymentMode] = useState(PAYMENT_MODES[0].value);
  const [editId, setEditId] = useState(null);

  // FILTER, SEARCH
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPayment, setFilterPayment] = useState('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  
  // UI
  const [refreshing, setRefreshing] = useState(false);

  /////////////////////////////////////////////////////////////////////////////
  // Initialization
  /////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    (async () => {
      // Load everything
      let txns = [];
      let cats = DEFAULT_CATEGORIES;
      let pf = { ...prefs };
      try {
        let storedTxns = await AsyncStorage.getItem(STORAGE_KEYS.transactions);
        let storedCats = await AsyncStorage.getItem(STORAGE_KEYS.categories);
        let storedPrefs = await AsyncStorage.getItem(STORAGE_KEYS.prefs);

        if (storedTxns) txns = JSON.parse(storedTxns);
        if (storedCats) cats = JSON.parse(storedCats);
        if (storedPrefs) pf = { ...prefs, ...JSON.parse(storedPrefs) };
      } catch (err) {
        Alert.alert('Error', 'Failed to load storage!');
      }

      setCategories(cats);
      setTransactions(txns);
      setPrefs(pf);
      setFormCurrency(pf.currency);
    })();
  }, []);

  /////////////////////////////////////////////////////////////////////////////
  // Persistence
  /////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions)).catch(() =>
      Alert.alert('Error', 'Saving transactions failed!')
    );
  }, [transactions]);
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories)).catch(() =>
      Alert.alert('Error', 'Saving categories failed!')
    );
  }, [categories]);
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.prefs, JSON.stringify(prefs)).catch(() =>
      Alert.alert('Error', 'Saving preferences failed!')
    );
  }, [prefs]);

  /////////////////////////////////////////////////////////////////////////////
  // Derived data with filter/search
  /////////////////////////////////////////////////////////////////////////////

  const filteredTransactions = useMemo(() => {
    let txns = [...transactions];
    // Search
    if (searchTerm.trim().length > 0) {
      txns = txns.filter(t =>
        t.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Filter by type
    if (filterType !== 'All')
      txns = txns.filter(t => t.type === filterType);
    // Category
    if (filterCategory !== 'All')
      txns = txns.filter(t => t.category === filterCategory);
    // Payment
    if (filterPayment !== 'All')
      txns = txns.filter(t => t.paymentMode === filterPayment);
    // Date range
    if (filterDateFrom)
      txns = txns.filter(t => new Date(t.date) >= new Date(filterDateFrom));
    if (filterDateTo)
      txns = txns.filter(t => new Date(t.date) <= new Date(filterDateTo));

    // Sort by date descending
    txns.sort((a, b) => new Date(b.date) - new Date(a.date));
    return txns;
  }, [
    transactions,
    searchTerm,
    filterType,
    filterCategory,
    filterPayment,
    filterDateFrom,
    filterDateTo
  ]);

  /////////////////////////////////////////////////////////////////////////////
  // Calculated stats
  /////////////////////////////////////////////////////////////////////////////

  const stats = useMemo(() => {
    const totals = { income: 0, expense: 0, byCategory: {}, byPayment: {} };
    for (let t of transactions) {
      if (t.currency !== prefs.currency) continue; // only show selected currency
      if (t.type === 'Income') totals.income += Number(t.amount);
      if (t.type === 'Expense') totals.expense += Number(t.amount);
      // By Category
      const cat = t.category;
      if (!totals.byCategory[cat]) totals.byCategory[cat] = 0;
      totals.byCategory[cat] += t.type === 'Income' ? 0 : Number(t.amount);
      // By Payment
      const pm = t.paymentMode;
      if (!totals.byPayment[pm]) totals.byPayment[pm] = 0;
      totals.byPayment[pm] += Number(t.amount);
    }
    return totals;
  }, [transactions, prefs.currency]);

  /////////////////////////////////////////////////////////////////////////////
  // Pie Chart Data
  /////////////////////////////////////////////////////////////////////////////

  const pieData = useMemo(() => {
    let i = 0;
    let sum = 0;
    const arr = categories
      .filter(cat => cat.name !== 'Salary') // usually only Expense categories
      .map((cat) => {
        let amount = stats.byCategory[cat.name] || 0;
        sum += amount;
        return {
          name: cat.name,
          amount,
          color: cat.color || CATEGORY_COLORS[i++ % CATEGORY_COLORS.length],
          legendFontColor: prefs.darkMode ? '#fff' : '#222',
          legendFontSize: 14
        };
      })
      .filter(d => d.amount > 0);
    if (sum === 0) return [];
    return arr.map(a => ({
      ...a,
      // PieChart expects prop called "population" (or "amount"), value and color
      amount: a.amount
    }));
  }, [categories, stats, prefs.darkMode]);

  /////////////////////////////////////////////////////////////////////////////
  // Actions: Add/Edit/Delete
  /////////////////////////////////////////////////////////////////////////////

  const openAddTransactionModal = (type) => {
    setFormType(type);
    setFormAmount('');
    setFormCategory(type === 'Income' ? 'Salary' : categories[0].name);
    setFormDate(formatDate(new Date()));
    setFormNote('');
    setFormCurrency(prefs.currency);
    setFormPaymentMode(PAYMENT_MODES[0].value);
    setEditId(null);
    setShowExpenseModal(true);
  };
  const openEditTransactionModal = (txn) => {
    setFormType(txn.type);
    setFormAmount(String(txn.amount));
    setFormCategory(txn.category);
    setFormDate(formatDate(txn.date));
    setFormNote(txn.note ?? '');
    setFormCurrency(txn.currency);
    setFormPaymentMode(txn.paymentMode);
    setEditId(txn.id);
    setShowExpenseModal(true);
  };
  const handleSaveTransaction = () => {
    // Validate
    if (
      !formAmount ||
      isNaN(formAmount) ||
      Number(formAmount) <= 0 ||
      !formDate
    ) {
      Alert.alert('Validation', 'Please enter valid amount and date.');
      return;
    }
    if (!formCategory) {
      Alert.alert('Validation', 'Please select a category.');
      return;
    }
    if (!formCurrency) {
      Alert.alert('Validation', 'Please select a currency.');
      return;
    }
    if (!formPaymentMode) {
      Alert.alert('Validation', 'Please select a payment mode.');
      return;
    }
    const txn = {
      id: editId ?? uuidv4(),
      type: formType,
      amount: Number(formAmount),
      category: formCategory,
      date: formDate,
      note: formNote,
      currency: formCurrency,
      paymentMode: formPaymentMode
    };
    setTransactions(txns => {
      let arr = [...txns];
      if (editId) {
        // Edit
        const idx = arr.findIndex(t => t.id === editId);
        if (idx !== -1) arr[idx] = txn;
      } else {
        arr.push(txn);
      }
      return arr;
    });
    setShowExpenseModal(false);
  };
  const handleDeleteTransaction = (id) => {
    Alert.alert('Delete', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: () => {
          setTransactions(txns => txns.filter(t => t.id !== id));
        }
      }
    ]);
  };

  /////////////////////////////////////////////////////////////////////////////
  // Swipe-to-delete custom logic: Animated
  /////////////////////////////////////////////////////////////////////////////
  const renderTransactionRow = ({ item }) => <TransactionRow item={item} />;

  function TransactionRow({ item }) {
    // Swipe: move left to reveal delete
    const translateX = useRef(new Animated.Value(0)).current;
    const swiped = useRef(false);

    // Drag logic
    let startX = 0;

    // Only allow swipe for expense, not for income
    if (item.type === 'Income') {
      return (
        <TouchableOpacity
          style={[styles.transactionCard, { backgroundColor: prefs.darkMode ? '#212337' : '#fff' }]}
          onLongPress={() => openEditTransactionModal(item)}
          activeOpacity={0.8}
        >
          <TransactionCardContent item={item} />
        </TouchableOpacity>
      );
    }

    return (
      <View style={{ marginBottom: 8 }}>
        <Animated.View
          style={{
            transform: [{ translateX }],
            zIndex: 9
          }}
          {...(Platform.OS === 'web'
            ? {} // can't use responder events on web
            : {
                onStartShouldSetResponder: () => true,
                onResponderGrant: e => {
                  startX = e.nativeEvent.pageX;
                  swiped.current = false;
                },
                onResponderMove: e => {
                  let dx = e.nativeEvent.pageX - startX;
                  if (dx < 0 && Math.abs(dx) < 80) {
                    translateX.setValue(dx);
                  }
                },
                onResponderRelease: e => {
                  let dx = e.nativeEvent.pageX - startX;
                  if (dx < -40) {
                    // Show delete
                    Animated.timing(translateX, {
                      toValue: -80,
                      duration: 200,
                      useNativeDriver: true
                    }).start(() => (swiped.current = true));
                  } else {
                    // Snap back
                    Animated.timing(translateX, {
                      toValue: 0,
                      duration: 200,
                      useNativeDriver: true
                    }).start();
                  }
                }
              })}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => openEditTransactionModal(item)}
            style={[styles.transactionCard, { backgroundColor: prefs.darkMode ? '#212337' : '#fff' }]}
          >
            <TransactionCardContent item={item} />
          </TouchableOpacity>
        </Animated.View>
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.swipeDelete,
            { opacity: translateX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0] }) }
          ]}
        >
          <TouchableOpacity
            onPress={() => handleDeleteTransaction(item.id)}
            style={styles.deleteButton}
          >
            <MaterialIcons name="delete" size={28} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  function TransactionCardContent({ item }) {
    const catObj = categories.find(c => c.name === item.category);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <View style={[styles.transactionCategoryIcon, { backgroundColor: catObj?.color || CATEGORY_COLORS[0] }]}>
          <Entypo name={item.type === 'Income' ? "plus" : "minus"} size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[
            styles.transactionTitle,
            { color: prefs.darkMode ? '#fff' : '#222' }
          ]}>
            {item.note || item.category}
          </Text>
          <Text style={{ color: '#666', fontSize: 12 }}>
            {formatDisplayDate(item.date)} · {item.paymentMode}
          </Text>
        </View>
        <Text style={[
          styles.transactionAmount,
          { color: item.type === 'Income' ? '#35d07f' : '#f857a6' }
        ]}>
          {(item.type === 'Income' ? '+' : '-') + currencySymbol(item.currency)}
          {Number(item.amount).toLocaleString('en')}
        </Text>
      </View>
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  // Export CSV
  /////////////////////////////////////////////////////////////////////////////
  const handleExportCSV = async () => {
    if (!filteredTransactions.length) {
      Alert.alert('Export Error', 'No transactions to export.');
      return;
    }
    // CSV header
    const header = [
      'Type',
      'Amount',
      'Category',
      'Date',
      'Note',
      'Currency',
      'PaymentMode'
    ];
    const rows = filteredTransactions.map(t =>
      [
        t.type,
        t.amount,
        t.category,
        t.date,
        `"${t.note ? t.note.replace(/"/g, '""') : ''}"`,
        t.currency,
        t.paymentMode
      ].join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    // Save to file
    try {
      const fileUri = `${FileSystem.cacheDirectory}expenses_${Date.now()}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Expenses'
      });
    } catch (err) {
      Alert.alert('Export Error', err.message || 'Failed to export.');
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // SMS Import (Android only)
  /////////////////////////////////////////////////////////////////////////////
  const parseExpenseFromSMS = message => {
    // Example parse: "Spent Rs.500 at BigBazar"
    // For production, add more patterns/parsers!
    let patterns = [
      /(?:spent|debited|purchase of|withdrawn).*?([₹$€¥])?(\d[\d,\.]*)/i,
      /deposited.*?([₹$€¥])?(\d[\d,\.]*)/i
    ];
    let match;
    for (let pat of patterns) {
      match = message.match(pat);
      if (match) {
        let amount = match[2].replace(/,/g, '');
        return { amount: Number(amount), type: message.match(/credited|deposited/i) ? 'Income' : 'Expense' };
      }
    }
    return null;
  };
  const handleImportSMS = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Sorry', 'SMS import only available on Android');
      return;
    }
    setShowSMSImportModal(true);
    // android permission automatically requested by react-native-get-sms-android
    try {
      getAll(
        {}, // filter
        (smsList) => {
          // smsList: [{body, address, date, ...}]
          let txns = [];
          for (let sms of smsList) {
            let parsed = parseExpenseFromSMS(sms.body);
            if (parsed && parsed.amount > 0) {
              txns.push({
                id: uuidv4(),
                type: parsed.type,
                amount: parsed.amount,
                category: parsed.type === 'Income' ? 'Salary' : 'Other',
                date: formatDate(new Date(Number(sms.date))),
                note: 'Imported via SMS',
                currency: prefs.currency,
                paymentMode: 'Bank'
              });
            }
          }
          if (txns.length === 0) {
            Alert.alert('SMS Import', 'No expense/income messages detected!');
            setShowSMSImportModal(false);
            return;
          }
          Alert.alert(
            'Import SMS',
            `Add ${txns.length} detected transactions?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setShowSMSImportModal(false) },
              {
                text: 'Import',
                onPress: () => {
                  setTransactions(all => [...all, ...txns]);
                  setShowSMSImportModal(false);
                }
              }
            ]
          );
        },
        err => {
          setShowSMSImportModal(false);
          Alert.alert('SMS Import', err?.message ?? 'Failed to import.');
        }
      );
    } catch (err) {
      setShowSMSImportModal(false);
      Alert.alert('SMS Import', 'Error: ' + (err?.message || err));
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // Dark mode toggle
  /////////////////////////////////////////////////////////////////////////////
  const toggleDarkMode = () => {
    setPrefs(p => ({ ...p, darkMode: !p.darkMode }));
  };

  /////////////////////////////////////////////////////////////////////////////
  // Currency change
  /////////////////////////////////////////////////////////////////////////////
  const changeCurrency = (code) => {
    setPrefs(p => ({ ...p, currency: code }));
    setFormCurrency(code);
    setShowCurrencyModal(false);
  };

  /////////////////////////////////////////////////////////////////////////////
  // Budget progress for categories
  /////////////////////////////////////////////////////////////////////////////
  const getCategorySpent = useCallback(
    categoryName => {
      return transactions
        .filter(
          t =>
            t.category === categoryName &&
            t.type === 'Expense' &&
            t.currency === prefs.currency
        )
        .reduce((sum, t) => sum + Number(t.amount), 0);
    },
    [transactions, prefs.currency]
  );

  /////////////////////////////////////////////////////////////////////////////
  // THEME
  /////////////////////////////////////////////////////////////////////////////
  const theme = useMemo(() => {
    return {
      background: prefs.darkMode ? '#101223' : '#fcfcff',
      card: prefs.darkMode ? '#1a1d2d' : '#fff',
      text: prefs.darkMode ? '#e8eaf6' : '#16174a',
      input: prefs.darkMode ? '#222449' : '#f4f4fb',
      border: prefs.darkMode ? '#26294f' : '#eaeaf6',
      gradient: prefs.darkMode
        ? ['#232349', '#232379', '#35358a']
        : ['#cddcfa', '#f9d8e8', '#FDF6E8']
    };
  }, [prefs.darkMode]);

  /////////////////////////////////////////////////////////////////////////////
  // Main return
  /////////////////////////////////////////////////////////////////////////////
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
      }}
    >
      <StatusBar barStyle={prefs.darkMode ? "light-content" : "dark-content"} />
      {/* HEADER */}
      <LinearGradient
        colors={theme.gradient}
        start={[0, 1]}
        end={[1, 0]}
        style={styles.headerGradient}
      >
        <View style={styles.headerLeft}>
          <Text style={[styles.appTitle, { color: theme.text }]}>
            <Ionicons name="wallet-outline" size={24} color={theme.text} />
            {'  '}Expense Tracker
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerRight}
          onPress={toggleDarkMode}
        >
          {prefs.darkMode ? (
            <Ionicons name="moon" size={24} color="#ffe26a" />
          ) : (
            <Ionicons name="sunny" size={24} color="#ffbb00" />
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* STATS AND BAR */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: theme.background }}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        {/* STATS */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, marginTop: 8 }}>
          <StatCard
            title="Income"
            value={currencySymbol(prefs.currency) + stats.income.toLocaleString('en')}
            icon="arrow-down-bold"
            iconColor="#35d07f"
            bgColor={prefs.darkMode ? '#191c3b' : '#eaffe1'}
          />
          <StatCard
            title="Expense"
            value={currencySymbol(prefs.currency) + stats.expense.toLocaleString('en')}
            icon="arrow-up-bold"
            iconColor="#f857a6"
            bgColor={prefs.darkMode ? '#2c2d48' : '#fff0f7'}
          />
          <StatCard
            title="Balance"
            value={currencySymbol(prefs.currency) + (stats.income - stats.expense).toLocaleString('en')}
            icon="wallet"
            iconColor="#44acf5"
            bgColor={prefs.darkMode ? '#1b1d2c' : '#eef6ff'}
          />
        </View>

        {/* Currency selector */}
        <TouchableOpacity onPress={() => setShowCurrencyModal(true)} style={styles.currencySelector}>
          <Text style={{ color: theme.text, fontWeight: '600', fontSize: 15 }}>
            <FontAwesome5 name="money-bill-wave" size={16} /> {prefs.currency}
          </Text>
        </TouchableOpacity>

        {/* PIE CHART */}
        {pieData && pieData.length > 0 && (
          <View style={styles.pieChartCard}>
            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8, color: theme.text }}>
              Expense Breakdown
            </Text>
            <PieChart
              data={pieData}
              width={SCREEN_WIDTH - 40}
              height={160}
              chartConfig={{
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                color: (o, i) => '#fff',
                propsForLabels: { fontSize: 10 }
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              hasLegend={true}
              avoidFalseZero
            />
          </View>
        )}

        {/* CATEGORY BUDGET */}
        <ScrollView
          horizontal
          style={{ marginTop: 10, paddingLeft: 8, paddingBottom: 6 }}
          showsHorizontalScrollIndicator={false}
        >
          {categories
            .filter(cat => cat.budget && cat.name !== 'Salary')
            .map((cat, i) => (
              <View
                key={cat.name}
                style={[styles.budgetCard, { backgroundColor: cat.color + '22', shadowColor: cat.color }]}
              >
                <Text style={{ fontWeight: '700', color: prefs.darkMode ? '#fff' : '#222', fontSize: 14 }}>
                  {cat.name}
                </Text>
                <BudgetProgress
                  value={getCategorySpent(cat.name)}
                  max={cat.budget}
                  color={cat.color}
                />
                <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                  {currencySymbol(prefs.currency) + getCategorySpent(cat.name).toLocaleString('en')} / {currencySymbol(prefs.currency) + cat.budget}
                </Text>
              </View>
            ))}
        </ScrollView>

        {/* FILTER & SEARCH */}
        <View style={styles.filterRow}>
          <View style={{ flex: 1 }}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.input, color: theme.text }]}
              placeholder="Search"
              placeholderTextColor={prefs.darkMode ? '#b6bfd9' : '#8b8ba2'}
              value={searchTerm}
              onChangeText={setSearchTerm}
              clearButtonMode="while-editing"
            />
          </View>
          <CustomModalSelector
            options={['All', 'Income', 'Expense']}
            value={filterType}
            onSelect={setFilterType}
            icon={<MaterialCommunityIcons name="filter" size={18} color="#809fff" />}
          />
          <CustomModalSelector
            options={['All', ...categories.map(c => c.name)]}
            value={filterCategory}
            onSelect={setFilterCategory}
            icon={<MaterialCommunityIcons name="format-list-bulleted" size={18} color="#9E85FF" />}
          />
        </View>
        <View style={styles.filterRow}>
          <CustomModalSelector
            options={['All', ...PAYMENT_MODES.map(p => p.value)]}
            value={filterPayment}
            onSelect={setFilterPayment}
            style={{ flex: 1 }}
            icon={<MaterialCommunityIcons name="credit-card" size={18} color="#74c1ff" />}
          />
          <CustomDateInput
            label="From"
            value={filterDateFrom}
            onChange={setFilterDateFrom}
          />
          <CustomDateInput
            label="To"
            value={filterDateTo}
            onChange={setFilterDateTo}
          />
        </View>

        {/* Export/Import */}
        <View style={{ flexDirection: 'row', marginHorizontal: 10, marginVertical: 6, gap: 10 }}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportCSV}
          >
            <MaterialCommunityIcons name="file-export-outline" size={20} color="#4463c0" />
            <Text style={{ color: '#4463c0', fontWeight: '700' }}>Export CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: '#33aadd17', borderColor: '#33aadd' }]}
            onPress={handleImportSMS}
          >
            <MaterialCommunityIcons name="message-processing" size={19} color="#349fff" />
            <Text style={{ color: '#1a62bb', fontWeight: '700' }}>Import SMS</Text>
          </TouchableOpacity>
        </View>

        {/* TRANSACTIONS */}
        <View>
          <Text style={{ color: theme.text, fontWeight: '700', fontSize: 17, marginLeft: 14, marginTop: 8, marginBottom: 5 }}>
            Transactions
          </Text>
          {filteredTransactions.length === 0 ? (
            <Text style={{ margin: 15, color: '#8b8baa' }}>No transactions found.</Text>
          ) : (
            <FlatList
              data={filteredTransactions}
              keyExtractor={item => item.id}
              renderItem={renderTransactionRow}
              style={{ paddingHorizontal: 12, marginTop: 0 }}
              scrollEnabled={false}
              contentContainerStyle={{ paddingBottom: 95 }}
            />
          )}
        </View>
      </ScrollView>

      {/* ADD FAB */}
      <TouchableOpacity
        style={styles.addFab}
        onPress={() => openAddTransactionModal('Expense')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#44bbef', '#f857a6']}
          style={styles.addFabGradient}
        >
          <Ionicons name="add" size={34} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* ++++++++++++++++++++++ MODALS ++++++++++++++++++++++ */}
      {/* Expense/Income Add/Edit Modal */}
      <Modal
        visible={showExpenseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExpenseModal(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: "center", backgroundColor: "#2227aa44" }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {editId ? "Edit Transaction" : "Add " + formType}
            </Text>
            {/* Type Switch */}
            <View style={{ flexDirection: "row", marginVertical: 10 }}>
              {TRANSACTION_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeSwitch,
                    {
                      backgroundColor: formType === type ? "#44acf555" : "#dedfff22",
                      borderColor: formType === type ? "#44acf5" : "#aaa"
                    }
                  ]}
                  onPress={() => setFormType(type)}
                >
                  <Text style={{
                    fontWeight: "700",
                    color: formType === type ? "#44acf5" : "#888"
                  }}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Amount */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Amount</Text>
              <TextInput
                style={[styles.input, { fontSize: 18 }]}
                value={formAmount}
                onChangeText={setFormAmount}
                placeholder="Amount"
                placeholderTextColor={prefs.darkMode ? "#b6bfd9" : "#888"}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
            {/* Date */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Date</Text>
              <CustomDateInput
                value={formDate}
                onChange={setFormDate}
                style={{ flex: 1 }}
              />
            </View>
            {/* Category */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Category</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryModal(true)}
                style={styles.input}
              >
                <Text style={{ color: prefs.darkMode ? "#fff" : "#222", fontWeight: "600" }}>
                  {formCategory}
                </Text>
              </TouchableOpacity>
            </View>
            {/* Currency */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Currency</Text>
              <TouchableOpacity
                onPress={() => setShowCurrencyModal(true)}
                style={styles.input}
              >
                <Text style={{ color: prefs.darkMode ? "#fff" : "#222", fontWeight: "600" }}>
                  {formCurrency}
                </Text>
              </TouchableOpacity>
            </View>
            {/* Payment Mode */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Payment Mode</Text>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(true)}
                style={styles.input}
              >
                <Text style={{ color: prefs.darkMode ? "#fff" : "#222", fontWeight: "600" }}>
                  {formPaymentMode}
                </Text>
              </TouchableOpacity>
            </View>
            {/* Note */}
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Note (optional)</Text>
              <TextInput
                style={styles.input}
                value={formNote}
                onChangeText={setFormNote}
                placeholder="E.g. Lunch at Cafe"
                placeholderTextColor={prefs.darkMode ? "#b6bfd9" : "#888"}
                maxLength={100}
              />
            </View>
            {/* Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveTransaction}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {editId ? "Update" : "Save"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowExpenseModal(false)}
              >
                <Text style={{ color: "#f857a6", fontWeight: "700" }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Custom Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <CustomModal
          options={categories.map(c => c.name)}
          value={formCategory}
          onSelect={cat => {
            setFormCategory(cat);
            setShowCategoryModal(false);
          }}
          title="Select Category"
        />
      </Modal>
      {/* Custom Currency Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <CustomModal
          options={CURRENCIES.map(c => c.code)}
          value={formCurrency}
          onSelect={code => {
            changeCurrency(code);
            setShowCurrencyModal(false);
          }}
          title="Choose Currency"
        />
      </Modal>
      {/* Custom Payment Mode Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <CustomModal
          options={PAYMENT_MODES.map(p => p.value)}
          value={formPaymentMode}
          onSelect={mode => {
            setFormPaymentMode(mode);
            setShowPaymentModal(false);
          }}
          title="Payment Type"
        />
      </Modal>
      {/* SMS Import status modal */}
      <Modal visible={showSMSImportModal} transparent>
        <View style={{ flex: 1, backgroundColor: "#0a0c1cc9", justifyContent: "center", alignItems: "center" }}>
          <View style={{ padding: 30, backgroundColor: "#fff", borderRadius: 25, alignItems: "center" }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: "#333" }}>Scanning SMS for expenses…</Text>
            <Text style={{ marginTop: 10, color: "#666" }}>This may take a few seconds.</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

////////////////////////////////////////////////////////////////////////////////
// StatCard Component
////////////////////////////////////////////////////////////////////////////////
function StatCard({ title, value, icon, iconColor, bgColor }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
      <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
      <Text style={{ marginTop: 2, fontWeight: '700', fontSize: 16 }}>{value}</Text>
      <Text style={{ fontSize: 13, color: '#85abc4', marginTop: -3 }}>{title}</Text>
    </View>
  );
}

////////////////////////////////////////////////////////////////////////////////
// Custom Modal Selector
////////////////////////////////////////////////////////////////////////////////
function CustomModalSelector({ options, value, onSelect, icon, style }) {
  const [modalVisible, setModalVisible] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={[styles.filterModalBtn, style]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {icon}
        <Text style={{ marginLeft: 6, color: "#424276", fontWeight: "bold" }}>
          {value}
        </Text>
      </TouchableOpacity>
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <CustomModal
          options={options}
          value={value}
          onSelect={v => {
            onSelect(v);
            setModalVisible(false);
          }}
        />
      </Modal>
    </>
  );
}

////////////////////////////////////////////////////////////////////////////////
// Custom Modal Reusable
////////////////////////////////////////////////////////////////////////////////
function CustomModal({ options, value, onSelect, title }) {
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.popupModal}>
        <Text style={styles.modalTitle}>{title || "Choose"}</Text>
        <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.modalOption,
                { backgroundColor: value === opt ? "#44acf526" : undefined }
              ]}
              onPress={() => onSelect(opt)}
            >
              <Text style={{ color: "#191d48", fontWeight: value === opt ? "700" : "400" }}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={{ marginTop: 8, alignSelf: 'flex-end' }}
          onPress={() => onSelect(value)}
        >
          <Text style={{ color: "#44acf5", fontWeight: "700" }}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

////////////////////////////////////////////////////////////////////////////////
// Custom Date Input (No pickers allowed)
////////////////////////////////////////////////////////////////////////////////
function CustomDateInput({ value, onChange, label, style }) {
  // value: YYYY-MM-DD
  return (
    <View style={[{ flex: 1 }, style]}>
      <Text style={{ fontSize: 12, color: '#888', fontWeight: '500', marginBottom: 2 }}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="numbers-and-punctuation"
        placeholder="YYYY-MM-DD"
        placeholderTextColor="#aaa"
        maxLength={10}
        autoCapitalize="none"
      />
    </View>
  );
}

////////////////////////////////////////////////////////////////////////////////
// Category Budget Progress bar
////////////////////////////////////////////////////////////////////////////////
function BudgetProgress({ value, max, color }) {
  let w = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <View style={{
      backgroundColor: '#eae8f9',
      borderRadius: 6,
      height: 9,
      marginVertical: 5,
      overflow: 'hidden'
    }}>
      <View style={{
        width: `${w}%`,
        backgroundColor: color,
        height: 9
      }} />
    </View>
  );
}

////////////////////////////////////////////////////////////////////////////////
// Styles
////////////////////////////////////////////////////////////////////////////////
const styles = StyleSheet.create({
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 8
  },
  appTitle: { fontWeight: '900', fontSize: 22, letterSpacing: 0.4 },
  headerLeft: { flex: 3 },
  headerRight: { flex: 0, marginLeft: 14 },
  statCard: {
    flex: 1,
    marginRight: 10,
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 83,
    elevation: 3,
    shadowColor: "#43436a55",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10
  },
  budgetCard: {
    borderRadius: 17,
    padding: 12,
    minWidth: 108,
    marginRight: 10,
    marginBottom: 4,
    elevation: 2,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.11
  },
  currencySelector: {
    marginHorizontal: 16,
    marginTop: 2,
    alignSelf: 'flex-end',
    backgroundColor: "#d0daf91a",
    padding: 7,
    borderRadius: 7,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#cddcfa80"
  },
  pieChartCard: {
    backgroundColor: "#fff0",
    borderRadius: 18,
    padding: 12,
    margin: 12,
    alignItems: 'center',
    shadowColor: "#b8baf6",
    elevation: 2
  },
  filterRow: {
    flexDirection: "row",
    marginHorizontal: 12,
    marginBottom: 6,
    gap: 10
  },
  filterModalBtn: {
    backgroundColor: "#f6f5ff",
    borderRadius: 9,
    padding: 9,
    borderWidth: 1,
    borderColor: "#e4e9fa",
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 3
  },
  input: {
    backgroundColor: "#f4f4fb",
    padding: 11,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#e4e8fa",
    color: "#24268a",
    fontSize: 16,
    marginVertical: 2
  },
  transactionCard: {
    borderRadius: 17,
    padding: 15,
    marginBottom: 2,
    flexDirection: "row",
    alignItems: 'center',
    elevation: 2,
    shadowColor: "#a8aaf6cc",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13
  },
  transactionCategoryIcon: {
    width: 33,
    height: 33,
    borderRadius: 14,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "700"
  },
  transactionAmount: {
    minWidth: 92,
    textAlign: 'right',
    fontWeight: "900",
    fontSize: 16
  },
  swipeDelete: {
    position: 'absolute',
    right: 9,
    top: 7,
    height: 52,
    width: 70,
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 7
  },
  deleteButton: {
    backgroundColor: "#ff4e65",
    borderRadius: 22,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2
  },
  modalCard: {
    borderRadius: 18,
    margin: 12,
    padding: 19,
    elevation: 12,
    alignItems: 'stretch'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: "#16198c",
    alignSelf: 'center',
    marginBottom: 8
  },
  formRow: {
    marginVertical: 7
  },
  formLabel: {
    fontWeight: "600",
    color: "#222",
    fontSize: 13,
    marginLeft: 2,
    marginBottom: 5
  },
  modalActions: {
    flexDirection: "row",
    marginTop: 18,
    alignSelf: 'center'
  },
  saveBtn: {
    backgroundColor: "#44acf5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 21,
    marginRight: 13,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 21,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#e9c8e5"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#2e3170ab",
    justifyContent: "center",
    alignItems: "center"
  },
  popupModal: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    minWidth: 250
  },
  modalOption: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderColor: "#f3f3fd"
  },
  addFab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    zIndex: 99
  },
  addFabGradient: {
    borderRadius: 44,
    height: 64,
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5
  },
  exportButton: {
    borderWidth: 1.5,
    borderColor: "#44acf5",
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    padding: 7,
    gap: 5,
    backgroundColor: "#44acf509"
  }
});
