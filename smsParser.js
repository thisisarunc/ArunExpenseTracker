/**

- SMS Parser for Indian Bank Transactions
- Supports: HDFC, ICICI, SBI, Axis, Kotak, IDFC, Yes Bank, PNB, BOB,
- Google Pay, PhonePe, Paytm, Amazon Pay, etc.
  */

// Common Indian bank sender IDs
export const BANK_SENDERS = [
// Banks
'HDFCBK', 'ICICIB', 'SBIINB', 'AXISBK', 'KOTAKB', 'IDFCFB', 'YESBK', 'PNBSMS', 'BOIIND', 'CANBNK',
'UNIONB', 'ABORIG', 'INDUSB', 'FEDBK', 'IABORIG', 'RABORIG', 'SCBORG', 'CITIBK', 'HABORIG',
// UPI & Wallets
'GPAY', 'PHONPE', 'PAYTMB', 'AMAZONP', 'MOBIKW', 'AIRTEL', 'JIOMNY', 'BHARPE', 'CRED',
// Credit Cards
'HDFCCC', 'ICICCC', 'SBICARD', 'AXISCC', 'AMEXIN', 'CITIBK',
// Generic
'ATMSMS', 'UPISMS', 'NEFTRT', 'IMSGSBI', 'CBSSBI', 'SBIPSG', 'QLOCKER',
];

// Regex patterns for parsing SMS
const AMOUNT_PATTERNS = [
/(?:RS.?|INR.?|₹)\s*([\d,]+(?:.\d{1,2})?)/i,
/(?:amount|amt|for)\s*(?:of\s*)?(?:RS.?|INR.?|₹)?\s*([\d,]+(?:.\d{1,2})?)/i,
/([\d,]+(?:.\d{1,2})?)\s*(?:RS.?|INR|₹|debited|credited)/i,
];

const DEBIT_KEYWORDS = [
'debited', 'debit', 'spent', 'paid', 'payment', 'purchase', 'withdrawn', 'withdrawal',
'txn', 'transaction', 'transferred', 'sent', 'deducted', 'used at', 'pos', 'atm',
'upi-', 'neft', 'imps', 'rtgs', 'bill payment', 'autopay', 'emi', 'mandate',
];

const CREDIT_KEYWORDS = [
'credited', 'credit', 'received', 'deposited', 'refund', 'cashback', 'reversed',
'added', 'loaded', 'salary', 'interest', 'dividend', 'bonus', 'reward',
];

const UPI_PATTERN = /(?:upi[:-/]|vpa[:-])\s*([a-zA-Z0-9.*-]+@[a-zA-Z]+)/i;
const CARD_PATTERN = /(?:card|ac|a/c|acct)[\s.]*(?:no.?|ending|xx+)?\s*[xX*]*(\d{4})/i;
const MERCHANT_PATTERNS = [
/(?:at|to|from|@|paid to|received from|trf to|trf from)\s+([A-Za-z0-9\s&.'*-]{2,30}?)(?:\s+on|\s+ref|\s+upi|.|,|$)/i,
/(?:info[:-])\s*([A-Za-z0-9\s&.'_-]{2,30})/i,
];
const DATE_PATTERN = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/;
const BALANCE_PATTERN = /(?:bal|balance|avl.?\s*bal|available)[:\s]*(?:RS.?|INR.?|₹)?\s*([\d,]+(?:.\d{1,2})?)/i;

/**

- Parse a single SMS message
- Added null safety checks for all inputs
  */
  export function parseSMS(message, sender = '', date = null) {
  // NULL SAFETY: Handle null/undefined message
  if (!message || typeof message !== 'string') {
  console.log('Invalid message:', message);
  return {
  isTransaction: false,
  type: null,
  amount: null,
  merchant: null,
  category: null,
  paymentMode: null,
  cardLast4: null,
  upiId: null,
  balance: null,
  date: date || new Date().toISOString().split('T')[0],
  originalMessage: message || '',
  sender: sender || '',
  confidence: 0,
  };
  }

// NULL SAFETY: Ensure message is a string before toUpperCase
const text = String(message).toUpperCase();

const result = {
isTransaction: false,
type: null, // 'expense' or 'income'
amount: null,
merchant: null,
category: null,
paymentMode: null,
cardLast4: null,
upiId: null,
balance: null,
date: date || new Date().toISOString().split('T')[0],
originalMessage: message,
sender: sender || '',
confidence: 0,
};

// Check if it's a transaction SMS
const hasAmount = AMOUNT_PATTERNS.some(p => p.test(message));
const hasDebitKeyword = DEBIT_KEYWORDS.some(k => text.includes(k.toUpperCase()));
const hasCreditKeyword = CREDIT_KEYWORDS.some(k => text.includes(k.toUpperCase()));

if (!hasAmount || (!hasDebitKeyword && !hasCreditKeyword)) {
return result;
}

result.isTransaction = true;
result.confidence = 0.5;

// Determine transaction type
if (hasDebitKeyword && !hasCreditKeyword) {
result.type = 'expense';
result.confidence += 0.2;
} else if (hasCreditKeyword && !hasDebitKeyword) {
result.type = 'income';
result.confidence += 0.2;
} else {
// Both keywords present - check which comes first or is more prominent
const debitIndex = Math.min(…DEBIT_KEYWORDS.map(k => {
const idx = text.indexOf(k.toUpperCase());
return idx === -1 ? Infinity : idx;
}));
const creditIndex = Math.min(…CREDIT_KEYWORDS.map(k => {
const idx = text.indexOf(k.toUpperCase());
return idx === -1 ? Infinity : idx;
}));
result.type = debitIndex < creditIndex ? 'expense' : 'income';
}

// Extract amount
for (const pattern of AMOUNT_PATTERNS) {
const match = message.match(pattern);
if (match) {
result.amount = parseFloat(match[1].replace(/,/g, ''));
result.confidence += 0.15;
break;
}
}

// Extract card last 4 digits
const cardMatch = message.match(CARD_PATTERN);
if (cardMatch) {
result.cardLast4 = cardMatch[1];
result.confidence += 0.05;
}

// Extract UPI ID
const upiMatch = message.match(UPI_PATTERN);
if (upiMatch) {
result.upiId = upiMatch[1].toLowerCase();
result.paymentMode = 'upi';
result.confidence += 0.1;
}

// Determine payment mode
if (!result.paymentMode) {
if (text.includes('UPI') || text.includes('GPAY') || text.includes('PHONEPE') || text.includes('PAYTM')) {
result.paymentMode = 'upi';
} else if (text.includes('ATM') || text.includes('CASH')) {
result.paymentMode = 'cash';
} else if (text.includes('CREDIT CARD') || text.includes('CC ')) {
result.paymentMode = 'credit';
} else if (text.includes('DEBIT CARD') || text.includes('DC ') || text.includes('POS')) {
result.paymentMode = 'debit';
} else if (text.includes('NEFT') || text.includes('IMPS') || text.includes('RTGS') || text.includes('NET BANKING')) {
result.paymentMode = 'netbanking';
} else {
result.paymentMode = 'debit'; // Default for bank transactions
}
}

// Extract merchant/description
for (const pattern of MERCHANT_PATTERNS) {
const match = message.match(pattern);
if (match) {
result.merchant = match[1].trim().substring(0, 30);
result.confidence += 0.1;
break;
}
}

// If no merchant found, try to extract from UPI ID
if (!result.merchant && result.upiId) {
result.merchant = result.upiId.split('@')[0].replace(/[._-]/g, ' ').substring(0, 30);
}

// Extract balance
const balanceMatch = message.match(BALANCE_PATTERN);
if (balanceMatch) {
result.balance = parseFloat(balanceMatch[1].replace(/,/g, ''));
}

// Extract date from SMS if available
const dateMatch = message.match(DATE_PATTERN);
if (dateMatch) {
try {
const parts = dateMatch[1].split(/[/-]/);
if (parts.length === 3) {
let day, month, year;
if (parts[2].length === 4) {
[day, month, year] = parts;
} else if (parts[0].length === 4) {
[year, month, day] = parts;
} else {
[day, month, year] = parts;
year = year.length === 2 ? '20' + year : year;
}
result.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
} catch (e) {
// Keep default date
}
}

// Auto-categorize based on merchant/keywords
result.category = guessCategory(message, result.merchant);

return result;
}

/**

- Guess category based on message content
- Added null safety for merchant parameter
  */
  function guessCategory(message, merchant = '') {
  // NULL SAFETY: Ensure message and merchant are strings
  const safeMessage = message ? String(message) : '';
  const safeMerchant = merchant ? String(merchant) : '';
  const text = (safeMessage + ' ' + safeMerchant).toUpperCase();

const categoryKeywords = {
food: ['SWIGGY', 'ZOMATO', 'FOOD', 'RESTAURANT', 'CAFE', 'DOMINOS', 'PIZZA', 'BURGER', 'KFC', 'MCDONALDS', 'STARBUCKS', 'BIRYANI', 'HOTEL', 'DINE', 'EAT'],
groceries: ['BIGBASKET', 'GROFERS', 'BLINKIT', 'ZEPTO', 'DMART', 'RELIANCE', 'GROCERY', 'SUPERMARKET', 'VEGETABLES', 'FRUITS', 'KIRANA', 'INSTAMART', 'JIOMART'],
shopping: ['AMAZON', 'FLIPKART', 'MYNTRA', 'AJIO', 'NYKAA', 'MEESHO', 'MALL', 'SHOP', 'STORE', 'RETAIL', 'FASHION', 'CLOTH'],
transport: ['UBER', 'OLA', 'RAPIDO', 'AUTO', 'TAXI', 'CAB', 'METRO', 'RAILWAY', 'IRCTC', 'BUS', 'REDBUS', 'TRAVEL'],
fuel: ['PETROL', 'DIESEL', 'FUEL', 'BPCL', 'HPCL', 'IOCL', 'INDIAN OIL', 'BHARAT', 'SHELL', 'RELIANCE PETRO', 'PUMP'],
entertainment: ['NETFLIX', 'PRIME', 'HOTSTAR', 'SPOTIFY', 'YOUTUBE', 'MOVIE', 'PVR', 'INOX', 'CINEMA', 'BOOKMYSHOW', 'GAME'],
electricity: ['ELECTRICITY', 'POWER', 'BESCOM', 'TATA POWER', 'ADANI', 'DISCOM', 'ELECTRIC', 'MSEDCL', 'CESC'],
mobile: ['RECHARGE', 'AIRTEL', 'JIO', 'VI ', 'VODAFONE', 'IDEA', 'BSNL', 'MOBILE', 'PREPAID', 'POSTPAID'],
wifi: ['BROADBAND', 'INTERNET', 'WIFI', 'FIBER', 'ACT ', 'HATHWAY', 'TIKONA', 'SPECTRA'],
medicine: ['PHARMACY', 'MEDICAL', 'MEDICINE', 'APOLLO', 'NETMEDS', 'PHARMEASY', '1MG', 'MEDPLUS', 'HOSPITAL'],
education: ['SCHOOL', 'COLLEGE', 'UNIVERSITY', 'COURSE', 'UDEMY', 'COURSERA', 'EDUCATION', 'TUITION', 'COACHING', 'BYJU'],
emi: ['EMI', 'LOAN', 'MANDATE', 'AUTO DEBIT', 'AUTOPAY'],
rent: ['RENT', 'HOUSE RENT', 'PG ', 'HOSTEL', 'LANDLORD'],
insurance: ['INSURANCE', 'LIC', 'POLICY', 'PREMIUM', 'HDFC LIFE', 'ICICI PRU', 'MAX LIFE'],
investment: ['MUTUAL FUND', 'MF ', 'SIP', 'ZERODHA', 'GROWW', 'UPSTOX', 'KUVERA', 'COIN', 'INVESTMENT'],
salary: ['SALARY', 'PAYROLL', 'WAGES'],
refund: ['REFUND', 'REVERSAL', 'CASHBACK', 'REWARD'],
};

for (const [category, keywords] of Object.entries(categoryKeywords)) {
if (keywords.some(k => text.includes(k))) {
return category;
}
}

return 'other';
}

/**

- Filter SMS list to get only transaction messages
- Added null safety for SMS list items
  */
  export function filterTransactionSMS(smsList) {
  if (!Array.isArray(smsList)) {
  console.log('Invalid SMS list:', smsList);
  return [];
  }

return smsList
.filter(sms => sms && sms.body) // NULL SAFETY: Filter out null/invalid SMS
.map(sms => ({
…sms,
parsed: parseSMS(sms.body, sms.address, sms.date),
}))
.filter(sms => sms.parsed.isTransaction && sms.parsed.amount > 0)
.sort((a, b) => new Date(b.parsed.date) - new Date(a.parsed.date));
}

/**

- Check if sender is likely a bank/financial institution
- Added null safety for sender parameter
  */
  export function isBankSender(sender) {
  // NULL SAFETY: Handle null/undefined sender
  if (!sender || typeof sender !== 'string') {
  return false;
  }

const upperSender = String(sender).toUpperCase().replace(/[^A-Z0-9]/g, '');
return BANK_SENDERS.some(bs => upperSender.includes(bs)) ||
/BANK|HDFC|ICICI|SBI|AXIS|KOTAK|UPI|PAY|WALLET/i.test(sender);
}

export default {
parseSMS,
filterTransactionSMS,
isBankSender,
BANK_SENDERS,
};
