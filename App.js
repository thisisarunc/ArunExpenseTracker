
/**
 * Full-featured Expense Tracker App - Expo SDK 50 Compatible
 * All UI/features as specified in instruction.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Pressable,
  Platform,
  Appearance,
  Switch,
  Dimensions,
  Share,
  Alert,
  KeyboardAvoidingView,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as SMS from 'expo-sms';
import { Ionicons, MaterialIcons, Feather, AntDesign } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { v4 as uuid } from "uuid";

const SCREEN_WIDTH = Dimensions.get("window").width;

// ---------- CONSTANTS & HELPERS ----------

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Food', color: '#fa8231', budget: 350 },
  { id: '2', name: 'Transport', color: '#20bf6b', budget: 150 },
  { id: '3', name: 'Shopping', color: '#3867d6', budget: 250 },
  { id: '4', name: 'Bills', color: '#8854d0', budget: 400 },
  { id: '5', name: 'Others', color: '#bababa', budget: 100 }
];

const COLORS_LIGHT = {
  bg: '#fff',
  text: '#171717',
  card: '#ececec',
  subtext: '#555',
  input: '#f7f7f7',
  border: '#dadada',
  fab: '#292929',
};
const COLORS_DARK = {
  bg: '#191b1c',
  text: '#eaeaea',
  card: '#292d32',
  subtext: '#aaa',
  input: '#222528',
  border: '#393939',
  fab: '#fafafa',
};

function getColorScheme(isDark) {
  return isDark ? COLORS_DARK : COLORS_LIGHT;
}

function formatAmount(amt) {
  return amt.toLocaleString(undefined, {maximumFractionDigits:2});
}
function getIconName(category) {
  switch(category) {
    case 'Food': return 'fast-food';
    case 'Transport': return 'car';
    case 'Shopping': return 'pricetag';
    case 'Bills': return 'card';
    case 'Others': return 'help-buoy';
    default: return 'wallet';
  }
}
function getPieChartData(categories, transactions) {
  return categories.map(cat => ({
    name:cat.name,
    amount:transactions
        .filter(t=>t.categoryId===cat.id)
        .reduce((sum, t)=>sum + t.amount, 0),
    color:cat.color,
    legendFontColor:'#666',
    legendFontSize:13
  })).filter(item=>item.amount>0);
}
function groupTransactions(transactions, categories) {
  // Sort & group by date (YYYY-MM-DD)
  const data = {};
  transactions.forEach(tx => {
    const d = new Date(tx.date);
    const dateStr = d.toLocaleDateString();
    if (!data[dateStr]) data[dateStr] = [];
    data[dateStr].push({...tx, category: categories.find(c=>c.id===tx.categoryId)});
  });
  // Newest date first
  return Object.entries(data).sort((a,b) => (new Date(b[0]) - new Date(a[0])))
    .map(([date, txs])=>({ title:date, data: txs.sort((a,b)=>b.date.localeCompare(a.date)) }));
}

// ---------- MAIN APP ----------

const App = () => {

  // --- Appearance ---
  const initialDark =
    Appearance?.getColorScheme() === 'dark';
  const [darkMode, setDarkMode] = useState(initialDark);
  const colors = getColorScheme(darkMode);
  useEffect(()=>{
    const sub = Appearance.addChangeListener(({colorScheme}) => setDarkMode(colorScheme==='dark'));
    return ()=>sub.remove();
  },[]);

  // --- Data State ---
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState([]);

  // --- Budgets ---
  function getUsed(catId) {
    return transactions.filter(t=>t.categoryId===catId).reduce((s,t)=>s+t.amount,0);
  }

  // --- Header/Filters ---
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);

  // --- Modals ---
  const [showAddTx, setShowAddTx] = useState(false);
  const [showEditTx, setShowEditTx] = useState(false);
  const [showSMSImport, setShowSMSImport] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // --- Editing State ---
  const [editTx, setEditTx] = useState(null);

  // --- FAB ---
  const [fabOpen, setFabOpen] = useState(false);

  // ---------- Derived Values ----------
  const filteredTx = transactions
    .filter(t=> (!search || t.note.toLowerCase().includes(search.toLowerCase()))
      && (!filterCat || t.categoryId===filterCat.id));
  const txSections = groupTransactions(filteredTx, categories);

  // ---------- Add/Edit Transaction ----------
  function addTransaction(tx) {
    setTransactions(txs=>[...txs, tx]);
  }
  function updateTransaction(newTx) {
    setTransactions(txs=>txs.map(tx => tx.id===newTx.id ? newTx : tx));
  }
  function deleteTransaction(id) {
    setTransactions(txs=>txs.filter(tx=>tx.id!==id));
  }

  // ---------- Add/Edit Category ----------
  function addCategory(cat) {
    setCategories(cats=>[...cats, cat]);
  }

  // ---------- SMS Import: Mocked ----------
  async function importFromSMS() {
    // Simulate importing two records
    setTimeout(()=>{
      addTransaction({
        id: uuid(),
        amount: 34.90,
        date: new Date().toISOString(),
        note: "Pizza Delivery (SMS)",
        categoryId: categories[0].id
      });
      addTransaction({
        id: uuid(),
        amount: 52.20,
        date: new Date().toISOString(),
        note: "Taxi Ride (SMS)",
        categoryId: categories[1].id
      });
    }, 1200);
  }

  // ---------- CSV Export ----------
  async function exportCSV() {
    let csv = "Id,Category,Amount,Date,Note\n";
    transactions.forEach(t => {
      csv += `${t.id},"${categories.find(c=>c.id===t.categoryId)?.name ?? ''}",${t.amount},"${t.date}","${t.note.replace(/"/g,"'")}"\n`;
    });
    const fileUri = FileSystem.cacheDirectory+'expenses.csv';
    await FileSystem.writeAsStringAsync(fileUri, csv);
    await Sharing.shareAsync(fileUri);
  }

  // ---------- UI ----------

  return (
    <SafeAreaView style={[styles.container, {backgroundColor:colors.bg}]}>
      <StatusBar style={darkMode?'light':'dark'} />
      {/* HEADER */}
      <View style={[styles.header, {backgroundColor:colors.card, borderColor: colors.border}]}>
        <Text style={[styles.headerTitle,{color:colors.text}]}>Expense Tracker</Text>
        <View style={{flexDirection:'row',alignItems:'center'}}>
          <Feather name="moon" size={18} color={darkMode ? "#f7d679" : "#888"} />
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            thumbColor={darkMode ? "#ffc107":"#fafafa"}
            trackColor={{true:"#555",false:"#bbb"}}
            style={{marginHorizontal:8}}
            accessibilityLabel="Toggle dark mode"
          />
        </View>
      </View>

      {/* STAT CARDS */}
      <View style={styles.statCards}>
        <View style={[styles.statCard,{backgroundColor:'#a5b4fc'}]}>
          <Ionicons name="ios-wallet" size={24} color="#222" />
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={styles.statValue}>
            ₹ {formatAmount(transactions.reduce((s,t)=>s + t.amount,0))}
          </Text>
        </View>
        <View style={[styles.statCard,{backgroundColor:'#ffd6a5'}]}>
          <Ionicons name="stats-chart" size={24} color="#222" />
          <Text style={styles.statLabel}>Categories</Text>
          <Text style={styles.statValue}>{categories.length}</Text>
        </View>
        <View style={[styles.statCard,{backgroundColor:'#fdffb6'}]}>
          <Feather name="user" size={24} color="#222" />
          <Text style={styles.statLabel}>Transactions</Text>
          <Text style={styles.statValue}>{transactions.length}</Text>
        </View>
      </View>

      {/* SEARCH & FILTERS */}
      <View style={styles.searchRow}>
        <LinearGradient
          colors={[colors.input, colors.bg]}
          style={[styles.searchWrap,{borderColor:colors.border}]}
        >
          <Feather name="search" size={17} color={colors.subtext} />
          <TextInput
            placeholder="Search"
            placeholderTextColor={colors.subtext}
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput,{color:colors.text, backgroundColor:'transparent'}]}
            returnKeyType="search"
          />
          {search.length > 0 &&
            <TouchableOpacity onPress={()=>setSearch('')}>
              <Feather name="x" size={16} color={colors.subtext} />
            </TouchableOpacity>}
        </LinearGradient>
        <TouchableOpacity
          style={[styles.filterBtn,filterCat?{backgroundColor:'#ffe066'}:null]}
          onPress={()=>setShowFilter(true)}
        >
          <Feather name="filter" size={20} color="#373737" />
        </TouchableOpacity>
      </View>

      {/* CATEGORY BUDGETS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{maxHeight:60,paddingVertical:3,paddingLeft:4}}
        >
        {categories.map(cat => {
          const used = getUsed(cat.id);
          return (
            <View key={cat.id} style={[styles.catBudgetWrap,{backgroundColor:colors.card}]}>
              <View style={styles.catRow}>
                <Ionicons name={getIconName(cat.name)} size={16} color={cat.color}/>
                <Text style={[styles.catName,{color:colors.text,marginHorizontal:4}]}>{cat.name}</Text>
              </View>
              <View style={styles.progressOuter}>
                <View style={[styles.progressInner,{width:`${Math.min(1,used/cat.budget)*100}%`,backgroundColor:cat.color}]} />
              </View>
              <Text style={[styles.budgetText,{color:colors.subtext}]}>
                {formatAmount(used)}/{formatAmount(cat.budget)}
              </Text>
            </View>
          );
        })}
        <TouchableOpacity
          style={[styles.catAddBtn,{backgroundColor:colors.input}]}
          onPress={()=>setShowAddCategory(true)}>
          <AntDesign name="plus" size={18} color={colors.text}/>
        </TouchableOpacity>
      </ScrollView>

      {/* PIE CHART */}
      {filteredTx.length>0 &&
        <PieChart
          data={getPieChartData(categories,filteredTx)}
          width={SCREEN_WIDTH-30}
          height={170}
          accessor="amount"
          backgroundColor="transparent"
          chartConfig={{
            backgroundGradientFrom: colors.bg,
            backgroundGradientTo: colors.bg,
            color: (o,idx)=>filteredTx[idx]?.category?.color ?? "#fff",
            labelColor:()=>colors.text
          }}
          style={{marginVertical:0,alignSelf:'center'}}
          hasLegend={true}
          center={[0,0]}
        />
      }

      {/* TRANSACTION LIST */}
      <SectionList
        sections={txSections}
        keyExtractor={(item) => item.id}
        renderItem={({item}) => (
          <Swipeable
            renderRightActions={() => (
              <TouchableOpacity
                style={[styles.deleteBtn,{backgroundColor:'#FF5C5C'}]}
                onPress={()=>deleteTransaction(item.id)}
              >
                <Feather name="trash-2" size={20} color="#fff"/>
              </TouchableOpacity>
            )}>
            <View style={[styles.txRow,{backgroundColor:colors.card}]}>
              <Ionicons name={getIconName(item.category?.name)} size={21} color={item.category?.color}/>
              <View style={{flex:1,marginHorizontal:10}}>
                <Text style={[styles.txNote,{color:colors.text}]}>{item.note}</Text>
                <Text style={[styles.txDate,{color:colors.subtext}]}>{new Date(item.date).toLocaleTimeString()}</Text>
              </View>
              <Text style={[styles.txAmt,{color:item.amount > 0 ? "#ee5253" : "#222"}]}>
                -₹{formatAmount(item.amount)}
              </Text>
              <TouchableOpacity
                onPress={()=>{setEditTx(item);setShowEditTx(true);}}
                style={{marginLeft:7,padding:3}}>
                <Feather name="edit" size={17} color={colors.subtext}/>
              </TouchableOpacity>
            </View>
          </Swipeable>
        )}
        renderSectionHeader={({section: {title}}) => (
          <Text style={[styles.sectionHeader,{color:colors.subtext}]}>{title}</Text>
        )}
        ListEmptyComponent={
          <View style={{alignItems:'center',margin:30}}>
            <Feather name="inbox" size={56} color={colors.border}/>
            <Text style={{color:colors.subtext,padding:10}}>No transactions. Add one!</Text>
          </View>
        }
        style={{flex:1,marginTop:6,marginBottom:65}}
        contentContainerStyle={{paddingBottom:90}}
        stickySectionHeadersEnabled={false}
      />

      {/* FAB BUTTONS */}
      <TouchableOpacity
        style={[styles.fabBtn,{backgroundColor:colors.fab}]}
        onPress={()=>setFabOpen(!fabOpen)}
      >
        <Feather name={fabOpen?'x':'plus-circle'} size={32} color={darkMode ? "#212121":"#ffab00"}/>
      </TouchableOpacity>
      {fabOpen &&
        <>
          <TouchableOpacity
            style={[styles.fabMini,{bottom:110, backgroundColor:'#aafdeb'}]}
            onPress={()=>{setShowAddTx(true);setFabOpen(false);}}
          >
            <Ionicons name="add" size={21} color="#222" />
            <Text style={styles.fabMiniLabel}>Add Tx</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fabMini,{bottom:60, backgroundColor:'#ffe082'}]}
            onPress={()=>{setShowSMSImport(true);setFabOpen(false);}}
          >
            <MaterialIcons name="sms" size={21} color="#222" />
            <Text style={styles.fabMiniLabel}>Import SMS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fabMini,{bottom:160, backgroundColor:'#bdb2ff'}]}
            onPress={()=>{setShowExport(true);setFabOpen(false);}}
          >
            <Feather name="download" size={21} color="#222" />
            <Text style={styles.fabMiniLabel}>Export</Text>
          </TouchableOpacity>
        </>
      }

      {/* ADD TRANSACTION MODAL */}
      {showAddTx &&
        <TxModal
          visible={showAddTx}
          onClose={()=>setShowAddTx(false)}
          onSave={(tx)=>{ addTransaction({...tx, id:uuid(), date: new Date().toISOString()}); setShowAddTx(false);}}
          categories={categories}
          colors={colors}
        />
      }
      {/* EDIT TRANSACTION MODAL */}
      {showEditTx &&
        <TxModal
          visible={showEditTx}
          onClose={()=>{setShowEditTx(false); setEditTx(null);}}
          onSave={(newTx)=>{ updateTransaction(newTx); setShowEditTx(false); setEditTx(null);}}
          edit={editTx}
          categories={categories}
          colors={colors}
        />
      }

      {/* ADD CATEGORY MODAL */}
      {showAddCategory &&
        <CategoryModal
          visible={showAddCategory}
          onClose={()=>setShowAddCategory(false)}
          onSave={(cat)=>{ addCategory({...cat, id: uuid()}); setShowAddCategory(false);}}
          colors={colors}
        />
      }

      {/* FILTER MODAL */}
      {showFilter &&
        <Modal
          visible={showFilter}
          transparent
          animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={()=>setShowFilter(false)}
          >
            <View style={[styles.filterModal,{backgroundColor:colors.bg}]}>
              <Text style={[styles.filterModalTitle,{color:colors.text}]}>Filter Category</Text>
              <ScrollView style={{maxHeight:190}}>
                {categories.map(cat =>
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.filterCatBtn, filterCat?.id===cat.id?{backgroundColor:cat.color+'66'}:null]}
                    onPress={()=>{ setFilterCat(filterCat?.id===cat.id?null:cat); setShowFilter(false);}}
                  >
                    <Ionicons name={getIconName(cat.name)} size={17} color={cat.color}/>
                    <Text style={[styles.filterCatLabel,{color:colors.text}]}>{cat.name}</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
              <TouchableOpacity
                onPress={()=>{ setFilterCat(null); setShowFilter(false); }}
                style={[styles.clearFilter,{backgroundColor:'#f3e3f3'}]}>
                <Text style={{color:'#333'}}>Clear Filter</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      }

      {/* EXPORT MODAL */}
      {showExport &&
        <Modal transparent visible>
          <Pressable style={styles.modalOverlay} onPress={()=>setShowExport(false)}>
            <View style={[styles.exportModal,{backgroundColor:colors.bg}]}>
              <Text style={[styles.exportTitle,{color:colors.text}]}>Export to CSV</Text>
              <Text style={{color:colors.subtext,paddingVertical:10}}>Share CSV file with your expenses.</Text>
              <TouchableOpacity
                style={[styles.exportBtn,{backgroundColor:'#a0f1c8'}]}
                onPress={()=>{ exportCSV(); setShowExport(false); }}
              >
                <Feather name="download" size={18} color="#333" />
                <Text style={[styles.exportBtnLabel,{color:'#222'}]}>Export</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={()=>setShowExport(false)}
              >
                <Feather name="x" size={16} color={colors.text}/>
                <Text style={[styles.exportBtnLabel,{color:colors.text}]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      }

      {/* SMS IMPORT MODAL */}
      {showSMSImport &&
        <Modal transparent visible animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.smsModal,{backgroundColor:colors.bg}]}>
              <Text style={[styles.smsTitle,{color:colors.text}]}>Import from SMS</Text>
              <Text style={{color:colors.subtext,paddingVertical:13}}>Simulated: Imports 2 sample records.</Text>
              <TouchableOpacity
                style={[styles.smsBtn,{backgroundColor:'#bbf1fc'}]}
                onPress={()=>{ importFromSMS(); setShowSMSImport(false);}}
              >
                <MaterialIcons name="sms" size={19} color="#0288d1" />
                <Text style={[styles.smsBtnLabel,{color:'#17668a'}]}>Import Now</Text>
              </TouchableOpacity>
              <Pressable
                style={[styles.smsBtn,{backgroundColor:colors.input}]}
                onPress={()=>setShowSMSImport(false)}
              >
                <Feather name="x" size={16} color={colors.text}/>
                <Text style={[styles.smsBtnLabel,{color:colors.text}]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      }
    </SafeAreaView>
  );
};

// ---------- Transaction Modal ----------
const TxModal = ({visible, onClose, onSave, edit, categories, colors}) => {
  const [amount, setAmount] = useState(edit?edit.amount:'');
  const [note, setNote] = useState(edit?edit.note:'');
  const [categoryId, setCategoryId] = useState(edit?edit.categoryId:categories[0]?.id);
  useEffect(()=>{
    if (edit) {
      setAmount(edit.amount);
      setNote(edit.note);
      setCategoryId(edit.categoryId);
    }
  },[edit]);
  return (
    <Modal transparent visible={visible} animationType="slide">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <KeyboardAvoidingView
          style={[styles.txModal,{backgroundColor:colors.bg}]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Text style={[styles.txModalTitle,{color:colors.text}]}>
            {edit ? 'Edit' : 'Add'} Transaction
          </Text>
          <TextInput
            placeholder="Amount"
            keyboardType="numeric"
            value={amount.toString()}
            onChangeText={setAmount}
            style={[styles.txInput,{color:colors.text,backgroundColor:colors.input}]}
            placeholderTextColor={colors.subtext}
          />
          <TextInput
            placeholder="Note (e.g. Grocery)"
            value={note}
            onChangeText={setNote}
            style={[styles.txInput,{color:colors.text,backgroundColor:colors.input}]}
            placeholderTextColor={colors.subtext}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{paddingVertical:5}}>
            {categories.map(cat =>
              <TouchableOpacity
                key={cat.id}
                style={[styles.txCategoryBtn,
                  {borderColor:cat.id===categoryId?cat.color:colors.border,backgroundColor:cat.id===categoryId?cat.color+'22':'#0000'}]}
                onPress={()=>setCategoryId(cat.id)}
              >
                <Ionicons name={getIconName(cat.name)} size={17} color={cat.color}/>
                <Text style={[styles.txCategoryLabel,{color:colors.text}]}>{cat.name}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
          <TouchableOpacity
            style={[styles.txSaveBtn,{backgroundColor:'#aafcc8'}]}
            onPress={()=>{
              if (!parseFloat(amount) || !categoryId) return;
              onSave({ ...(edit??{}), amount:parseFloat(amount), note, categoryId,
                date: (edit??{}).date??(new Date()).toISOString()
              });
            }}
          >
            <Feather name="check" size={18} color="#167944"/>
            <Text style={[styles.txSaveLabel,{color:'#106630'}]}>
              {edit?'Save':'Add'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.txSaveBtn,{backgroundColor:colors.input,marginTop:7}]}
            onPress={onClose}
          >
            <Feather name="x" size={16} color={colors.text}/>
            <Text style={[styles.txSaveLabel,{color:colors.text}]}>Cancel</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

// ---------- Category Modal ----------
const CategoryModal = ({visible, onClose, onSave, colors}) => {
  const [name,setName] = useState('');
  const [color,setColor] = useState('#bababa');
  const [budget,setBudget] = useState('');
  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={[styles.catModal, {backgroundColor:colors.bg}]}>
          <Text style={[styles.catModalTitle,{color:colors.text}]}>Add Category</Text>
          <TextInput
            placeholder="Name"
            value={name}
            onChangeText={setName}
            style={[styles.catInput,{backgroundColor:colors.input, color:colors.text}]}
            placeholderTextColor={colors.subtext}
          />
          <View style={styles.catColorRow}>
            {['#fa8231','#20bf6b','#3867d6','#8854d0','#bababa','#ffe066','#fdffb6','#a5b4fc'].map(c=>
              <TouchableOpacity
                key={c}
                onPress={()=>setColor(c)}
                style={[styles.catColorSwatch,{backgroundColor:c,borderWidth:color===c?2:0.5,borderColor:'#222'}]}
              />
            )}
          </View>
          <TextInput
            placeholder="Budget"
            value={budget}
            keyboardType="numeric"
            onChangeText={setBudget}
            style={[styles.catInput,{backgroundColor:colors.input, color:colors.text}]}
            placeholderTextColor={colors.subtext}
          />
          <TouchableOpacity
            style={[styles.catSaveBtn,{backgroundColor:'#cfff90'}]}
            onPress={()=>{
              if (!name || !parseFloat(budget)) return;
              onSave({ name, color, budget:parseFloat(budget) });
            }}
          >
            <Feather name="plus" size={17} color="#568203"/>
            <Text style={{color:'#222',fontWeight:'bold',marginLeft:4}}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.catSaveBtn,{backgroundColor:colors.input,marginTop:6}]}
            onPress={onClose}
          >
            <Feather name="x" size={15} color={colors.text}/>
            <Text style={[{color:colors.text,marginLeft:4}]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: {flex:1,backgroundColor:'#fff'},
  header: {flexDirection:'row',padding:10,justifyContent:'space-between',alignItems:'center',
    borderBottomWidth:0.5, minHeight:56},
  headerTitle: {fontSize:22,fontWeight:'bold',letterSpacing:0.5},
  statCards: {flexDirection:'row',justifyContent:'space-between',padding: 13},
  statCard: {borderRadius:20,padding:13,alignItems:'center',minWidth:90,flex:1,marginHorizontal:4},
  statLabel: {fontSize:13,color:'#1b242e',marginTop:3},
  statValue: {fontWeight:'bold',fontSize:16,marginTop:2,color:'#393'},
  searchRow:{flexDirection:'row',paddingHorizontal:6,paddingTop:5,alignItems:'center'},
  searchWrap:{flex:1,flexDirection:'row',alignItems:'center',borderRadius:16,
    borderWidth:1,paddingHorizontal:10,backgroundColor:'#f7f7f7',marginRight:7},
  searchInput:{flex:1,height:37,marginLeft:7,fontSize:16},
  filterBtn:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center'},
  catBudgetWrap:{marginHorizontal:3,borderRadius:12,padding:9, minWidth:125, borderWidth:0.5,borderColor:'#aaa',marginVertical:5},
  catRow:{flexDirection:'row',alignItems:'center',marginBottom:2},
  catName:{fontSize:14,fontWeight:'bold'},
  progressOuter:{backgroundColor:'#dee',height:6,borderRadius:3,width:'100%',marginTop:4},
  progressInner:{height:6,borderRadius:3},
  budgetText:{fontSize:11,marginTop:2,fontWeight:'bold'},
  catAddBtn:{width:40,alignItems:'center',justifyContent:'center',borderRadius:10,height:40,margin:7},
  sectionHeader:{paddingHorizontal:15,paddingVertical:5,fontSize:16,fontWeight:'bold',marginTop:15,backgroundColor:'transparent'},
  txRow:{flexDirection:'row',alignItems:'center',padding:13,borderBottomWidth:0.5,borderColor:'#dedede',marginHorizontal:7,borderRadius:10,marginBottom:6},
  txNote:{fontSize:15,fontWeight:'bold',marginBottom:1},
  txDate:{fontSize:11},
  txAmt:{fontWeight:'bold',fontSize:17},
  deleteBtn:{height:'100%',justifyContent:'center',alignItems:'center',paddingHorizontal:24,margin:7,marginBottom:6,borderRadius:10},
  fabBtn:{position:'absolute',bottom:22,right:22,width:60,height:60,borderRadius:30,alignItems:'center',justifyContent:'center',
    elevation:4,zIndex:23},
  fabMini:{position:'absolute',right:32,width:100,padding:10,borderRadius:40,flexDirection:'row',alignItems:'center',
    elevation:2,zIndex:24},
  fabMiniLabel:{marginLeft:8,fontWeight:'bold',color:'#2c2c2c',fontSize:15},
  modalOverlay:{flex:1,backgroundColor:'#0009',alignItems:'center',justifyContent:'center'},
  txModal:{alignSelf:'center',width:'92%',borderRadius:15,padding:17,justifyContent:'center',shadowOpacity:0.15,shadowRadius:8},
  txModalTitle:{fontWeight:'bold',fontSize:17,marginBottom:7},
  txInput:{borderRadius:8,padding:10,marginTop:7,fontSize:17,marginBottom:6,backgroundColor:'#fff',borderWidth:0.5},
  txCategoryBtn:{borderRadius:20,marginHorizontal:5,padding:7,paddingHorizontal:13, flexDirection:'row',alignItems:'center',borderWidth:1},
  txCategoryLabel:{marginLeft:5,fontSize:13},
  txSaveBtn:{borderRadius:8,alignItems:'center',flexDirection:'row',justifyContent:'center',minHeight:41,marginTop:16,padding:8},
  txSaveLabel:{marginLeft:6,fontWeight:'bold',fontSize:15},
  filterModal:{alignSelf:'center',marginTop:120,padding:26,minWidth:260,borderRadius:14,shadowOpacity:0.14,shadowRadius:7},
  filterModalTitle:{fontWeight:'bold',fontSize:16,marginBottom:15},
  filterCatBtn:{padding:7,borderRadius:10,flexDirection:'row',alignItems:'center',marginBottom:5},
  filterCatLabel:{marginLeft:10,fontSize:15},
  clearFilter:{borderRadius:8,marginTop:14,alignItems:'center',justifyContent:'center',padding:8},
  exportModal:{alignSelf:'center',marginTop:130,padding:33,minWidth:260,borderRadius:14,shadowOpacity:0.14,shadowRadius:7,alignItems:'center'},
  exportTitle:{fontWeight:'bold',fontSize:16},
  exportBtn:{flexDirection:'row',alignItems:'center',padding:11,borderRadius:8,minWidth:90,marginTop:11},
  exportBtnLabel:{marginLeft:7,fontWeight:'bold',fontSize:15},
  smsModal:{alignSelf:'center',marginTop:160,padding:26,minWidth:260,borderRadius:14,shadowOpacity:0.14,shadowRadius:7,alignItems:'center'},
  smsTitle:{fontWeight:'bold',fontSize:16},
  smsBtn:{padding:11,borderRadius:9,flexDirection:'row',alignItems:'center',marginTop:10,width:'100%',justifyContent:'center'},
  smsBtnLabel:{marginLeft:7,fontWeight:'bold',fontSize:15},
  catModal:{alignSelf:'center',marginTop:90,padding:23,minWidth:260,borderRadius:14,shadowOpacity:0.13,shadowRadius:7,alignItems:'center'},
  catModalTitle:{fontWeight:'bold',fontSize:16,marginBottom:8},
  catInput:{borderRadius:9,padding:10,marginTop:7,fontSize:16,marginBottom:5,width:'100%',backgroundColor:'#fff',borderWidth:0.5},
  catColorRow:{flexDirection:'row',justifyContent:'center',marginVertical:7},
  catColorSwatch:{width:28,height:28,borderRadius:14,marginHorizontal:5,borderWidth:1,borderColor:'#555'},
  catSaveBtn:{flexDirection:'row',alignItems:'center',borderRadius:8,padding:11,marginTop:14,width:'80%',justifyContent:'center',alignSelf:'center'},
});

export default App;
