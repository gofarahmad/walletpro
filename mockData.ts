
import { Transaction, BudgetCategory, Account, DebtItem, CreditItem, UserProfile, UserData, Category } from './types';

// Categories Default
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'Food', name: 'Makanan', icon: 'restaurant', type: 'Expense' },
  { id: 'Transport', name: 'Transport', icon: 'directions_car', type: 'Expense' },
  { id: 'Shopping', name: 'Belanja', icon: 'shopping_bag', type: 'Expense' },
  { id: 'Rent', name: 'Sewa', icon: 'home', type: 'Expense' },
  { id: 'Health', name: 'Kesehatan', icon: 'medical_services', type: 'Expense' },
  { id: 'Bills', name: 'Tagihan', icon: 'payments', type: 'Expense' },
  { id: 'Entertainment', name: 'Hiburan', icon: 'movie', type: 'Expense' },
  { id: 'Other_Exp', name: 'Lainnya', icon: 'more_horiz', type: 'Expense' },
  { id: 'Salary', name: 'Gaji', icon: 'work', type: 'Income' },
  { id: 'Bonus', name: 'Bonus', icon: 'celebration', type: 'Income' },
  { id: 'Investment', name: 'Investasi', icon: 'trending_up', type: 'Income' },
  { id: 'Gift', name: 'Hadiah', icon: 'redeem', type: 'Income' },
  { id: 'Other_Inc', name: 'Lainnya', icon: 'add_circle', type: 'Income' },
];

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'u1',
    name: 'Alex Rivera',
    phoneNumber: '081234567890',
    photoUrl: 'https://picsum.photos/seed/user123/100',
    pin: '1234',
    isSaved: true
  },
  {
    id: 'u2',
    name: 'Sarah Chen',
    phoneNumber: '085678901234',
    photoUrl: 'https://picsum.photos/seed/sarah/100',
    pin: '0000',
    isSaved: true
  }
];

// Data Transaksi Awal (Alex)
export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', amount: 55000, category: 'Food', type: 'Expense', date: new Date().toISOString(), note: 'Kopi Starbucks' },
  { id: '2', amount: 1500000, category: 'Shopping', type: 'Expense', date: new Date(Date.now() - 86400000).toISOString(), note: 'Beli Keyboard Mechanical' },
  { id: '3', amount: 15000000, category: 'Salary', type: 'Income', date: new Date(Date.now() - 864000000).toISOString(), note: 'Gaji Bulanan Utama' },
  { id: '4', amount: 450000, category: 'Food', type: 'Expense', date: new Date(Date.now() - 172800000).toISOString(), note: 'Makan Malam Keluarga' },
  { id: '5', amount: 320000, category: 'Shopping', type: 'Expense', date: new Date(Date.now() - 259200000).toISOString(), note: 'Baju Baru' },
  { id: '6', amount: 200000, category: 'Transport', type: 'Expense', date: new Date().toISOString(), note: 'Isi Bensin' },
];

export const INITIAL_BUDGETS: BudgetCategory[] = [
  { id: 'b1', name: 'Makanan', limit: 3000000, spent: 0, icon: 'restaurant', color: '#f59e0b' },
  { id: 'b2', name: 'Hiburan', limit: 1000000, spent: 0, icon: 'movie', color: '#8b5cf6' },
  { id: 'b3', name: 'Sewa', limit: 4000000, spent: 0, icon: 'home', color: '#136dec' },
  { id: 'b4', name: 'Transport', limit: 1500000, spent: 0, icon: 'directions_car', color: '#10b981' },
  { id: 'b5', name: 'Belanja', limit: 2000000, spent: 0, icon: 'shopping_bag', color: '#ec4899' },
];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'a1',
    name: 'BCA Utama',
    balance: 15000000,
    type: 'Bank',
    accountNumber: '8830123456',
    accountHolder: 'Alex Rivera',
    icon: 'account_balance'
  },
  {
    id: 'a2',
    name: 'GoPay',
    balance: 1250000,
    type: 'Wallet',
    phoneNumber: '0812-3456-7890',
    accountHolder: 'Alex Rivera',
    icon: 'contactless'
  },
  {
    id: 'a3',
    name: 'Tunai',
    balance: 500000,
    type: 'Cash',
    icon: 'payments'
  },
];

export const INITIAL_DEBTS: DebtItem[] = [
  { id: 'd1', contactName: 'Budi Santoso', phoneNumber: '081234567890', amount: 1000000, remainingAmount: 500000, type: 'Hutang', dueDate: new Date().toISOString(), note: 'Sisa pinjam servis motor' },
  { id: 'd2', contactName: 'Siska Amelia', phoneNumber: '085788990011', amount: 200000, remainingAmount: 200000, type: 'Piutang', dueDate: new Date().toISOString(), note: 'Bayar makan siang' },
];

export const INITIAL_CREDITS: CreditItem[] = [
  {
    id: 'c1', name: 'KPR Griya Indah', type: 'KPR', totalAmount: 450000000,
    monthlyPayment: 3200000, remainingTenor: 144, totalTenor: 180,
    dueDate: 5, startDate: '2020-01-05', note: 'Rumah tinggal utama', icon: 'home', color: '#136dec'
  },
  {
    id: 'c2', name: 'Netflix Premium', type: 'Subscription',
    monthlyPayment: 186000, dueDate: 1, note: 'Sharing 4 orang', icon: 'subscriptions', color: '#ef4444'
  },
  {
    id: 'c3', name: 'Indihome 50Mbps', type: 'Bills',
    monthlyPayment: 425000, dueDate: 20, icon: 'wifi', color: '#10b981'
  }
];

export const INITIAL_USER_DATA: Record<string, UserData> = {
  'u1': {
    transactions: INITIAL_TRANSACTIONS,
    budgets: INITIAL_BUDGETS,
    accounts: INITIAL_ACCOUNTS,
    debts: INITIAL_DEBTS,
    credits: INITIAL_CREDITS,
    notifications: [],
    categories: DEFAULT_CATEGORIES
  },
  'u2': {
    transactions: [],
    budgets: [],
    accounts: [],
    debts: [],
    credits: [],
    notifications: [],
    categories: DEFAULT_CATEGORIES
  }
};
