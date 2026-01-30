
export type TransactionType = 'Income' | 'Expense' | 'Transfer';

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType;
  color?: string;
  userId?: string;
}

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  type: TransactionType;
  date: string;
  note: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'Info' | 'Warning' | 'Success';
  isRead: boolean;
  readAt?: string; // Timestamp when notification was read
  userId?: string; // For offline sync support
}

export interface BudgetCategory {
  id: string;
  name: string;
  limit: number;
  spent: number;
  icon: string;
  color: string;
}

export interface Account {
  id: string;
  name: string;
  accountHolder?: string;
  balance: number;
  type: 'Bank' | 'Wallet' | 'Cash';
  accountNumber?: string;
  phoneNumber?: string;
  icon: string;
}

export type DebtType = 'Hutang' | 'Piutang';

export interface DebtItem {
  id: string;
  contactName: string;
  phoneNumber?: string;
  amount: number;
  remainingAmount: number; // For manual compatibility, though we calculate it now
  paid: number;
  type: DebtType;
  dueDate: string;
  note?: string;
  // Banking Fields
  interestRate?: number;
  interestType?: 'Annual' | 'Monthly';
  startDate?: string;
  durationMonths?: number; // Tenor
  holdAmount?: number;
  adminFee?: number;
  lastPaymentDate?: string;
  history?: {
    id: string;
    amount: number;
    date: string;
    note?: string;
  }[];
}

export type CreditType = 'KPR' | 'Bank' | 'Paylater' | 'Subscription' | 'Bills';

export interface CreditItem {
  id: string;
  name: string;
  type: CreditType;
  totalAmount?: number;
  monthlyPayment: number;
  remainingTenor?: number; // In months
  totalTenor?: number;
  dueDate: number; // Day of month (1-31)
  startDate?: string; // Date of disbursement
  note?: string;
  icon: string;
  color: string;
  isPaidThisMonth?: boolean;
  // Banking Fields
  interestRate?: number;
  interestType?: 'Annual' | 'Monthly';
  holdAmount?: number;
  adminFee?: number;
}

export interface UserProfile {
  id: string; // Unique ID for the user
  name: string;
  phoneNumber: string;
  photoUrl: string;
  pin: string;
  isSaved: boolean; // Whether the user is saved for quick login
  email?: string; // Google Email for Sync
}

export interface SavedContact {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  isFavorite: boolean;
}

export interface UserData {
  transactions: Transaction[];
  budgets: BudgetCategory[];
  accounts: Account[];
  debts: DebtItem[];
  credits: CreditItem[];
  notifications: Notification[];
  categories: Category[];
}

export type Screen = 'Login' | 'Home' | 'Stats' | 'Budget' | 'Wallet' | 'Debts' | 'Credits' | 'AddTransaction' | 'Notifications' | 'Settings';
