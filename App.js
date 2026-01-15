// App.js

import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Animated,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-root-toast";
import { Swipeable } from "react-native-gesture-handler";
import { Picker } from "@react-native-picker/picker";
import { PieChart } from "react-native-chart-kit";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

// ========== Default categories, payment modes, currencies ==========
const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Other",
];
const PAYMENT_MODES = ["Cash", "Card", "UPI", "Other"];
const CURRENCIES = [
  { symbol: "₹", code: "INR" },
  { symbol: "$", code: "USD" },
  { symbol: "€", code: "EUR" },
  { symbol: "£", code: "GBP" },
];

// ========== Demo Recurring Transactions ==========
const RECUR_OPTIONS = [
  { label: "None", value: null },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const defaultBudgets = {
  Food: 5000,
  Transport: 3000,
  Shopping: 4000,
  Bills: 6000,
  Entertainment: 2000,
  Health: 1500,
  Education: 2500,
  Other: 1000,
};

const pieColors = [
  "#64b5f6",
  "#ffa726",
  "#81c784",
  "#ba68c8",
  "#f06292",
  "#ffd54f",
  "#4db6ac",
  "#e57373",
];

// ========== Toast helper ==========
function showToast(msg) {
  Toast.show(msg, {
    duration: Toast.durations.SHORT,
    position: Toast.positions.BOTTOM,
    shadow: true,
    backgroundColor: "#323232",
  });
}

// ========== Helper to format currency ==========
function formatCurrency(amount, currency) {
  let symbol = CURRENCIES.find((c) => c.code === currency)?.symbol || "₹";
  return `${symbol}${parseFloat(amount).toFixed(2)}`;
}

// ========== Main App ==========
export default function App() {
  const [dark, setDark] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    paymentMode: "",
    currency: "INR",
    from: null,
    to: null,
  });
  const [budgets, setBudgets] = useState(defaultBudgets);
  const [budgetModal, setBudgetModal] = useState(false);
  const [newBudget, setNewBudget] = useState({});
  const [showDatePicker, setShowDatePicker] = useState({ show: false, field: null });
  const [toast, setToast] = useState("");
  const [form, setForm] = useState({
    amount: "",
    category: "Food",
    note: "",
    date: new Date(),
    paymentMode: "Cash",
    currency: "INR",
    recur: null,
  });
  const [errors, setErrors] = useState({});
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const scrollY = useRef(new Animated.Value(0)).current;

  // ========== Theme ==========
  const theme = dark ? stylesDark : stylesLight;

  // ========== Handle Pull to Refresh ==========
  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  // ========== Inline Validation ==========
  const validateForm = () => {
    let errs = {};
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) errs.amount = "Invalid amount.";
    if (!form.category) errs.category = "Select a category";
    if (!form.paymentMode) errs.paymentMode = "Select payment mode";
    if (!form.currency) errs.currency = "Select currency";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ========== Add/Edit Transaction Logic ==========
  function handleSaveTransaction() {
    if (!validateForm()) {
      showToast("Please correct highlighted fields.");
      return;
    }

    const txn = {
      id: editing?.id || Date.now() + Math.random().toString(36).substring(2),
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
      note: form.note,
      paymentMode: form.paymentMode,
      currency: form.currency,
      recur: form.recur,
    };

    if (editing) {
      setTransactions((ts) =>
        ts.map((t) => (t.id === editing.id ? txn : t))
      );
      showToast("Transaction updated!");
    } else {
      setTransactions((ts) => [txn, ...ts]);
      showToast("Transaction added!");
    }

    // Add to recurring list if applicable
    if (form.recur && !editing) {
      setRecurringTransactions((txns) => [txn, ...txns]);
    }
    setEditing(null);
    setModalVisible(false);
    setForm({
      amount: "",
      category: "Food",
      note: "",
      date: new Date(),
      paymentMode: "Cash",
      currency: filters.currency,
      recur: null,
    });
    setErrors({});
  }

  // ========== Edit Transaction ==========
  function handleEditTransaction(txn) {
    setEditing(txn);
    setForm({ ...txn });
    setModalVisible(true);
  }

  // ========== Swipe-to-delete ==========
  const handleDeleteTransaction = (txn) => {
    Alert.alert("Delete?", "Are you sure you want to delete?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setTransactions((ts) => ts.filter((t) => t.id !== txn.id));
          setRecurringTransactions((txns) => txns.filter((t) => t.id !== txn.id));
          showToast("Transaction deleted");
        },
      },
    ]);
  };

  // ========== Filter/Search/Sort ==========
  const filteredTransactions = useMemo(() => {
    let list = [...transactions];
    if (filters.category) list = list.filter((t) => t.category === filters.category);
    if (filters.paymentMode) list = list.filter((t) => t.paymentMode === filters.paymentMode);
    if (filters.currency) list = list.filter((t) => t.currency === filters.currency);
    if (filters.from) list = list.filter((t) => new Date(t.date) >= filters.from);
    if (filters.to) list = list.filter((t) => new Date(t.date) <= filters.to);
    if (search)
      list = list.filter(
        (t) =>
          t.note?.toLowerCase().includes(search.toLowerCase()) ||
          t.category?.toLowerCase().includes(search.toLowerCase())
      );
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filters, search]);

  // ========== Pie Chart Data ==========
  const pieChartData = useMemo(() => {
    let data = {};
    filteredTransactions.forEach((t) => {
      data[t.category] = (data[t.category] || 0) + t.amount;
    });
    return Object.entries(data).map(([cat, val], idx) => ({
      name: cat,
      amount: val,
      color: pieColors[idx % pieColors.length],
      legendFontColor: theme.text.color,
      legendFontSize: 12,
    }));
  }, [filteredTransactions, theme]);

  // ========== Calculate spent per category ==========
  function spentByCategory(cat) {
    return filteredTransactions
      .filter((t) => t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  // ========== Export CSV ==========
  async function handleExportCSV() {
    try {
      let csv = "Date,Category,Amount,Note,Mode,Currency\n";
      for (let t of filteredTransactions) {
        csv += `${new Date(t.date).toLocaleDateString()},${t.category},${t.amount},"${(t.note || "")
          .replace(/"/g, '""')}",${t.paymentMode},${t.currency}\n`;
      }
      const fileUri = FileSystem.cacheDirectory + "expenses.csv";
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(fileUri, {
        mimeType: "text/csv",
        dialogTitle: "Export CSV",
      });
      showToast("CSV Exported");
    } catch (err) {
      alert("CSV Export failed: " + err.message);
    }
  }

  // ========== SMS Import ==========
  // Placeholder: use a real library in production, e.g. react-native-sms-listener
  function handleImportSMS() {
    Alert.alert(
      "Import from SMS",
      "This feature requires permission to read SMS on device. In production, link a SMS reading library and implement your own parsing logic.",
      [{ text: "OK" }]
    );
  }

  // ========== Recurring Transaction Logic ==========
  useEffect(() => {
    // For demo: Add recurring transactions if not present for "today"
    const today = new Date();
    let added = false;
    recurringTransactions.forEach((t) => {
      let last = transactions.find(
        (tx) => tx.recur === t.recur && tx.category === t.category && tx.amount === t.amount
      );
      let lastDate = last ? new Date(last.date) : null;
      let shouldAdd = false;
      if (t.recur === "daily") {
        shouldAdd = !lastDate || lastDate.toDateString() !== today.toDateString();
      }
      if (t.recur === "weekly") {
        let thisWeek = getWeek(today),
          lastWeek = lastDate ? getWeek(lastDate) : null;
        shouldAdd = !lastDate || thisWeek !== lastWeek;
      }
      if (t.recur === "monthly") {
        shouldAdd =
          !lastDate ||
          today.getFullYear() !== lastDate.getFullYear() ||
          today.getMonth() !== lastDate.getMonth();
      }
      // Add a recurring transaction if missing
      if (shouldAdd) {
        const txn = {
          ...t,
          id: Date.now() + Math.random().toString(),
          date: today,
        };
        setTransactions((ts) => [txn, ...ts]);
        added = true;
      }
    });
    if (added) showToast("Recurring transactions have been updated!");
    // eslint-disable-next-line
  }, [recurringTransactions]);

  // ========== Week Helper ==========
  function getWeek(dt) {
    let onejan = new Date(dt.getFullYear(), 0, 1);
    return Math.ceil(((dt - onejan) / 86400000 + onejan.getDay() + 1) / 7);
  }

  // ========== Budget Modal Logic ==========
  function handleBudgetSave() {
    setBudgets((b) => ({ ...b, ...newBudget }));
    setBudgetModal(false);
    showToast("Budgets updated!");
  }

  // ========== Date Range Picker ==========
  const showDatepicker = (field) =>
    setShowDatePicker({ show: true, field });

  // ========== Render Transaction ==========
  const renderItem = useCallback(
    ({ item, index }) => (
      <Swipeable
        renderRightActions={() => (
          <TouchableOpacity
            style={theme.deleteBtn}
            onPress={() => handleDeleteTransaction(item)}
          >
            <Feather name="trash-2" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      >
        <Animated.View style={[theme.txnCard, { shadowOpacity: 0.2 }]}>
          <TouchableOpacity onPress={() => handleEditTransaction(item)} activeOpacity={0.8}>
            <LinearGradient
              colors={["#8ec5fc", "#e0c3fc"]}
              style={theme.txnCardGradient}
              start={[0, 0]}
              end={[1, 1]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={theme.txnCategory}><Ionicons name="pricetag" size={14} /> {item.category}</Text>
                <Text style={theme.txnAmount}>
                  {formatCurrency(item.amount, item.currency)}
                </Text>
              </View>
              <View style={{ flexDirection: "row", marginTop: 6, alignItems: 'center' }}>
                <Text style={theme.txnDate}>
                  <Ionicons name="calendar" size={12} />{" "}
                  {new Date(item.date).toLocaleDateString()}
                </Text>
                <Text style={theme.txnNote} numberOfLines={1} ellipsizeMode="tail">
                  {item.note ? ` | ${item.note}` : ""}
                </Text>
              </View>
              <View style={{ flexDirection: "row", marginTop: 4 }}>
                <Text style={theme.txnSmall}>{item.paymentMode || "Cash"}</Text>
                {item.recur && <Text style={theme.txnRecurTag}>⟳ {item.recur}</Text>}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    ),
    [theme]
  );

  // ========== TOTAL ==========
  const totalSpent = useMemo(
    () => filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0),
    [filteredTransactions]
  );

  // ========== Render ==========
  return (
    <LinearGradient
      colors={
        dark
          ? ["#232526", "#414345"]
          : ["#dbe6e4", "#fff1eb"]
      }
      style={theme.flex}
      start={[0.2, 0.1]}
      end={[1, 0.8]}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={theme.header}>
            <Text style={theme.heading}>
              Expense Tracker&nbsp;
            </Text>
            <TouchableOpacity onPress={() => setDark((d) => !d)}>
              <Feather
                name={dark ? "sun" : "moon"}
                size={24}
                color={theme.text.color}
              />
            </TouchableOpacity>
          </View>

          {/* ------ Search, Filter, Add, Export/SMS ------ */}
          <View style={theme.row}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
              <Feather name="search" size={18} color={theme.text.color} />
              <TextInput
                placeholder="Search note/category"
                style={theme.inputMinimal}
                placeholderTextColor={theme.input.color}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <TouchableOpacity onPress={() => setModalVisible(true)} style={theme.iconBtn}>
              <Feather name="plus" size={22} color={theme.text.color} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleExportCSV} style={theme.iconBtn}>
              <Feather name="download" size={22} color={theme.text.color} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleImportSMS} style={theme.iconBtn}>
              <MaterialCommunityIcons name="message-processing-outline" size={20} color={theme.text.color} />
            </TouchableOpacity>
          </View>
          {/* FILTERS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={theme.filterRow}>
              <Picker
                selectedValue={filters.category}
                style={theme.filterPicker}
                dropdownIconColor={theme.text.color}
                onValueChange={(v) => setFilters((f) => ({ ...f, category: v }))}
              >
                <Picker.Item label="Category" value="" />
                {CATEGORIES.map((c) => (
                  <Picker.Item key={c} label={c} value={c} />
                ))}
              </Picker>
              <Picker
                selectedValue={filters.paymentMode}
                style={theme.filterPicker}
                dropdownIconColor={theme.text.color}
                onValueChange={(v) => setFilters((f) => ({ ...f, paymentMode: v }))}
              >
                <Picker.Item label="Mode" value="" />
                {PAYMENT_MODES.map((m) => (
                  <Picker.Item key={m} label={m} value={m} />
                ))}
              </Picker>
              <Picker
                selectedValue={filters.currency}
                style={theme.filterPicker}
                dropdownIconColor={theme.text.color}
                onValueChange={(v) => setFilters((f) => ({ ...f, currency: v }))}
              >
                {CURRENCIES.map((c) => (
                  <Picker.Item key={c.code} label={c.code} value={c.code} />
                ))}
              </Picker>
              {/* Date range */}
              <TouchableOpacity
                onPress={() => showDatepicker("from")}
                style={theme.dateBtn}
              >
                <Feather name="calendar" size={14} color={theme.text.color} />
                <Text style={theme.dateBtnText}>
                  {filters.from
                    ? new Date(filters.from).toLocaleDateString()
                    : "From"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => showDatepicker("to")}
                style={theme.dateBtn}
              >
                <Feather name="calendar" size={14} color={theme.text.color} />
                <Text style={theme.dateBtnText}>
                  {filters.to
                    ? new Date(filters.to).toLocaleDateString()
                    : "To"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          {/* Date picker */}
          {showDatePicker.show && (
            <DateTimePicker
              value={filters[showDatePicker.field] || new Date()}
              mode="date"
              maximumDate={new Date()}
              onChange={(_e, date) => {
                setShowDatePicker({ show: false, field: null });
                if (date)
                  setFilters((f) => ({
                    ...f,
                    [showDatePicker.field]: date,
                  }));
              }}
            />
          )}

          {/* Budget tracker bar */}
          <TouchableOpacity onPress={() => setBudgetModal(true)}>
            <ScrollView horizontal>
              <View style={theme.budgetsBar}>
                {CATEGORIES.map((cat, idx) => {
                  const spent = spentByCategory(cat);
                  const percent = (spent * 100) / (budgets[cat] || 1);
                  return (
                    <View key={cat} style={theme.budgetBox}>
                      <Text style={theme.budgetCat}>{cat}</Text>
                      <View style={theme.budgetTrack}>
                        <View
                          style={[
                            theme.budgetFill,
                            {
                              width: Math.min(100, percent),
                              backgroundColor: pieColors[idx % pieColors.length],
                            },
                          ]}
                        />
                        <Text style={theme.budgetSpent}>
                          {formatCurrency(spent, filters.currency)}/
                          {formatCurrency(budgets[cat] || 0, filters.currency)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </TouchableOpacity>

          {/* Pie chart */}
          {pieChartData.length > 0 && (
            <ScrollView horizontal style={{ marginHorizontal: 8 }}>
              <PieChart
                style={{ alignSelf: "center" }}
                data={pieChartData.map((d) => ({
                  name: d.name,
                  population: d.amount,
                  color: d.color,
                  legendFontColor: d.legendFontColor,
                  legendFontSize: d.legendFontSize,
                }))}
                width={Dimensions.get("window").width * 0.93}
                height={150}
                chartConfig={{
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  color: (opacity = 1) => `rgba(70,70,70,${opacity})`,
                  propsForLabels: {
                    fontSize: 12,
                    fontWeight: "bold",
                  },
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="18"
                absolute
              />
            </ScrollView>
          )}

          {/* Total */}
          <View style={theme.totalBar}>
            <Text style={theme.totalText}>
              Total Spent: {formatCurrency(totalSpent, filters.currency)}
            </Text>
          </View>

          {/* Transaction List */}
          <Animated.FlatList
            data={filteredTransactions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 30 }}
            ListEmptyComponent={
              <View style={theme.emptyBox}>
                <Text style={theme.emptyText}>
                  No transactions found.
                </Text>
              </View>
            }
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            initialNumToRender={10}
            removeClippedSubviews
            maxToRenderPerBatch={20}
            windowSize={11}
          />

          {/* -------- Transaction Add/Edit Modal -------- */}
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={theme.modalOverlay}>
              <View style={theme.modalBox}>
                <Text style={theme.modaltitle}>
                  {editing ? "Edit" : "Add"} Transaction
                </Text>
                {/* Inline form */}
                <View style={theme.row}>
                  <TextInput
                    placeholder="Amount"
                    style={theme.input}
                    keyboardType="multiline"
                    value={form.amount ? String(form.amount) : ""}
                    onChangeText={(txt) => setForm((f) => ({ ...f, amount: txt.replace(/[^0-9.]/g, "") }))}
                    placeholderTextColor={theme.input.color}
                  />
                  <Picker
                    selectedValue={form.currency}
                    style={theme.inputPicker}
                    dropdownIconColor={theme.text.color}
                    onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}
                  >
                    {CURRENCIES.map((c) => (
                      <Picker.Item key={c.code} label={c.code} value={c.code} />
                    ))}
                  </Picker>
                </View>
                {errors.amount && <Text style={theme.errText}>{errors.amount}</Text>}

                <Picker
                  selectedValue={form.category}
                  style={theme.inputPicker}
                  dropdownIconColor={theme.text.color}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  {CATEGORIES.map((c) => (
                    <Picker.Item key={c} label={c} value={c} />
                  ))}
                </Picker>
                {errors.category && <Text style={theme.errText}>{errors.category}</Text>}

                <Picker
                  selectedValue={form.paymentMode}
                  style={theme.inputPicker}
                  dropdownIconColor={theme.text.color}
                  onValueChange={(v) => setForm((f) => ({ ...f, paymentMode: v }))}
                >
                  {PAYMENT_MODES.map((c) => (
                    <Picker.Item key={c} label={c} value={c} />
                  ))}
                </Picker>
                {errors.paymentMode && <Text style={theme.errText}>{errors.paymentMode}</Text>}

                <View style={theme.inlineRow}>
                  <TouchableOpacity
                    style={theme.dateBtn}
                    onPress={() => setShowDatePicker({ show: true, field: "modalDate" })}
                  >
                    <Feather name="calendar" size={14} color={theme.text.color} />
                    <Text style={theme.dateBtnText}>
                      {form.date
                        ? new Date(form.date).toLocaleDateString()
                        : "Pick date"}
                    </Text>
                  </TouchableOpacity>
                  <Picker
                    selectedValue={form.recur}
                    style={[theme.inputPicker, { flex: 1 }]}
                    dropdownIconColor={theme.text.color}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, recur: v }))
                    }
                  >
                    {RECUR_OPTIONS.map((o) => (
                      <Picker.Item key={o.value} label={o.label} value={o.value} />
                    ))}
                  </Picker>
                </View>
                <TextInput
                  placeholder="Note (optional)"
                  style={[theme.input, { height: 36 }]}
                  value={form.note}
                  onChangeText={(txt) => setForm((f) => ({ ...f, note: txt }))}
                  placeholderTextColor={theme.input.color}
                />
                {/* recurring */}
                {showDatePicker.show &&
                  showDatePicker.field === "modalDate" && (
                    <DateTimePicker
                      value={new Date(form.date)}
                      mode="date"
                      maximumDate={new Date()}
                      onChange={(_e, date) => {
                        setShowDatePicker({ show: false, field: null });
                        if (date)
                          setForm((f) => ({ ...f, date }));
                      }}
                    />
                  )}
                <View style={theme.modalBtns}>
                  <TouchableOpacity
                    style={theme.cancelBtn}
                    onPress={() => {
                      setModalVisible(false);
                      setEditing(null);
                      setErrors({});
                    }}
                  >
                    <Text style={theme.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={theme.saveBtn}
                    onPress={handleSaveTransaction}
                  >
                    <Text style={theme.saveBtnText}>
                      {editing ? "Save" : "Add"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* --------- Budget Modal --------- */}
          <Modal
            visible={budgetModal}
            animationType="fade"
            transparent
            onRequestClose={() => setBudgetModal(false)}
          >
            <View style={theme.modalOverlay}>
              <View style={theme.budgetModalBox}>
                <Text style={theme.modaltitle}>Set Budgets Per Category</Text>
                <ScrollView>
                  {CATEGORIES.map((cat) => (
                    <View
                      key={cat}
                      style={{ flexDirection: "row", alignItems: "center", marginVertical: 4 }}
                    >
                      <Text style={[theme.txnCategory, { flex: 1 }]}>{cat}</Text>
                      <TextInput
                        keyboardType="numeric"
                        style={[theme.input, { flex: 1, marginVertical: 2, height: 30 }]}
                        value={
                          newBudget[cat] !== undefined
                            ? String(newBudget[cat])
                            : String(budgets[cat] || 0)
                        }
                        onChangeText={(txt) =>
                          setNewBudget((b) => ({
                            ...b,
                            [cat]: parseInt(txt.replace(/[^0-9]/g, "") || "0", 10),
                          }))
                        }
                        placeholder={`Set budget`}
                        placeholderTextColor={theme.input.color}
                      />
                    </View>
                  ))}
                  <View style={theme.modalBtns}>
                    <TouchableOpacity
                      style={theme.cancelBtn}
                      onPress={() => setBudgetModal(false)}
                    >
                      <Text style={theme.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={theme.saveBtn}
                      onPress={handleBudgetSave}
                    >
                      <Text style={theme.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ========== LIGHT THEME ==========
const stylesLight = StyleSheet.create({
  flex: { flex: 1 },
  heading: {
    fontSize: 25,
    fontWeight: "700",
    color: "#28313b",
  },
  text: { color: "#222" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 2,
    backgroundColor: "transparent",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 9,
    marginVertical: 6,
  },
  inlineRow: { flexDirection: "row", alignItems: "center" },
  iconBtn: {
    marginLeft: 8,
    backgroundColor: "#f4f4fa",
    padding: 6,
    borderRadius: 9,
    elevation: 1,
    shadowOpacity: 0.09,
  },
  filterRow: { flexDirection: "row", alignItems: "center" },
  filterPicker: {
    width: 108,
    backgroundColor: "rgba(250,250,250,0.7)",
    color: "#2e2e53",
    borderRadius: 10,
    height: 32,
    marginRight: 5,
  },
  inputMinimal: {
    flex: 1,
    marginLeft: 3,
    color: "#293248",
    fontSize: 15,
    padding: 4,
    backgroundColor: "transparent",
  },
  dateBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d5dbeb",
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 4,
    backgroundColor: "#f9f9ff",
  },
  dateBtnText: { color: "#39435e", marginLeft: 5 },
  budgetsBar: { flexDirection: "row", marginVertical: 5 },
  budgetBox: { minWidth: 80, padding: 3, paddingRight: 8 },
  budgetCat: { fontSize: 12, fontWeight: "bold", color: "#3c4251" },
  budgetTrack: {
    height: 11,
    borderRadius: 5,
    backgroundColor: "#e5e9ff",
    overflow: "hidden",
    marginVertical: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  budgetFill: {
    height: 11,
    borderRadius: 5,
    position: "absolute",
    left: 0,
    top: 0,
  },
  budgetSpent: {
    fontSize: 10,
    color: "#222752",
    marginLeft: 56,
    fontWeight: "600",
    position: "absolute",
  },
  totalBar: {
    backgroundColor: "#f6fafd",
    marginHorizontal: 13,
    marginTop: 1,
    borderRadius: 9,
    padding: 10,
    alignItems: "center",
    elevation: 1,
    shadowOpacity: 0.1,
  },
  totalText: { fontWeight: "700", color: "#3e4157", fontSize: 17 },
  emptyBox: { padding: 28, alignItems: "center" },
  emptyText: { color: "#999", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(17,19,31,.17)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "87%",
    backgroundColor: "#fafcff",
    padding: 25,
    borderRadius: 19,
    elevation: 3,
    shadowColor: "#a9b6fd",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 14,
    marginTop: 45,
  },
  budgetModalBox: {
    width: "93%",
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 18,
    elevation: 3,
    marginTop: 30,
  },
  modaltitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3d355a",
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d4deec",
    padding: 7,
    borderRadius: 10,
    marginVertical: 4,
    fontSize: 15,
    backgroundColor: "#f0f5fd",
    color: "#183757",
    flex: 1,
  },
  inputPicker: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#fcfcfa",
    color: "#272752",
    marginVertical: 3,
    minHeight: 36,
    maxHeight: 55,
    marginHorizontal: 6,
  },
  errText: {
    color: "#ff0033",
    fontSize: 13,
    marginBottom: 3,
    marginTop: -5,
  },
  modalBtns: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
  },
  cancelBtn: {
    backgroundColor: "#eaeaea",
    padding: 12,
    borderRadius: 10,
    flex: 1,
    marginRight: 8,
  },
  cancelBtnText: { color: "#423f57", textAlign: "center" },
  saveBtn: {
    backgroundColor: "#4586e6",
    padding: 13,
    borderRadius: 10,
    flex: 1,
    elevation: 1,
    marginLeft: 8,
  },
  saveBtnText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  txnCard: {
    marginHorizontal: 11,
    marginVertical: 6,
    borderRadius: 13,
    elevation: 3,
    backgroundColor: "transparent",
    shadowColor: "#5855ff",
    shadowRadius: 5,
  },
  txnCardGradient: {
    padding: 12,
    borderRadius: 13,
    shadowOpacity: 0.1,
  },
  txnCategory: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#21305d",
  },
  txnAmount: {
    fontWeight: "900",
    color: "#18498b",
    fontSize: 17,
  },
  txnDate: { fontSize: 13, color: "#49508e" },
  txnNote: { fontSize: 13, color: "#504f6f", flex: 1 },
  txnSmall: {
    fontSize: 12,
    color: "#7691c6",
    marginRight: 16,
    fontStyle: "italic",
  },
  txnRecurTag: {
    fontSize: 11,
    color: "#da7f32",
    fontWeight: "bold",
    backgroundColor: "rgba(252,203,144,.17)",
    paddingHorizontal: 4,
    marginLeft: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  deleteBtn: {
    backgroundColor: "#ff4582",
    justifyContent: "center",
    alignItems: "flex-end",
    padding: 22,
    borderRadius: 14,
    marginVertical: 7,
    marginHorizontal: 8,
  },
});

// ========== DARK THEME ==========
const stylesDark = StyleSheet.create({
  ...stylesLight,
  heading: { ...stylesLight.heading, color: "#fafaff" },
  text: { color: "#ececec" },
  header: { ...stylesLight.header, backgroundColor: "transparent" },
  inputMinimal: { ...stylesLight.inputMinimal, color: "#fff" },
  filterPicker: {
    ...stylesLight.filterPicker,
    backgroundColor: "#323344",
    color: "#f3f3f3",
    borderColor: "#1e243e",
    borderWidth: 1,
  },
  dateBtn: {
    ...stylesLight.dateBtn,
    backgroundColor: "#1a1f31",
    borderColor: "#2c2f42",
  },
  dateBtnText: { ...stylesLight.dateBtnText, color: "#d0e2f1" },
  budgetsBar: { ...stylesLight.budgetsBar },
  budgetBox: { ...stylesLight.budgetBox },
  budgetCat: { ...stylesLight.budgetCat, color: "#f0e7ff" },
  budgetTrack: { ...stylesLight.budgetTrack, backgroundColor: "#222241" },
  budgetSpent: { ...stylesLight.budgetSpent, color: "#cbe2fc" },
  totalBar: {
    ...stylesLight.totalBar,
    backgroundColor: "#212241",
    elevation: 2,
  },
  totalText: { ...stylesLight.totalText, color: "#b0baff" },
  emptyBox: { ...stylesLight.emptyBox },
  emptyText: { ...stylesLight.emptyText, color: "#555ab7" },
  modalOverlay: { ...stylesLight.modalOverlay, backgroundColor: "rgba(17,19,31,0.73)" },
  modalBox: { ...stylesLight.modalBox, backgroundColor: "#232841" },
  budgetModalBox: { ...stylesLight.budgetModalBox, backgroundColor: "#292962" },
  modaltitle: { ...stylesLight.modaltitle, color: "#edeafc" },
  input: { ...stylesLight.input, backgroundColor: "#151c30", color: "#b2c7e5", borderColor: "#232851" },
  inputPicker: {
    ...stylesLight.inputPicker,
    backgroundColor: "#232841",
    color: "#f2c2fd",
    borderColor: "#1c2140",
  },
  errText: { ...stylesLight.errText },
  modalBtns: { ...stylesLight.modalBtns },
  cancelBtn: { ...stylesLight.cancelBtn, backgroundColor: "#2c2d42" },
  saveBtn: { ...stylesLight.saveBtn, backgroundColor: "#7154ff" },
  txnCard: {
    ...stylesLight.txnCard,
    shadowColor: "#6d45f6",
    backgroundColor: "transparent",
  },
  txnCardGradient: { ...stylesLight.txnCardGradient },
  txnCategory: { ...stylesLight.txnCategory, color: "#d7f3ff" },
  txnAmount: { ...stylesLight.txnAmount, color: "#b2ccff" },
  txnDate: { ...stylesLight.txnDate, color: "#9bb6ff" },
  txnNote: { ...stylesLight.txnNote, color: "#cebeff" },
  txnSmall: { ...stylesLight.txnSmall, color: "#a67be7" },
  txnRecurTag: { ...stylesLight.txnRecurTag, color: "#f6c58c" },
  deleteBtn: { ...stylesLight.deleteBtn },
});
