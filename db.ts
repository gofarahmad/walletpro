import Dexie, { Table } from 'dexie';
import { Transaction, BudgetCategory, Account, Category, DebtItem, CreditItem, Notification, UserProfile, SavedContact } from './types';

export interface SyncQueueItem {
    id?: number;
    type: 'POST' | 'PUT' | 'DELETE';
    endpoint: string;
    body: any;
    timestamp: number;
}

export class FinanceDB extends Dexie {
    transactions!: Table<Transaction>;
    budgets!: Table<BudgetCategory>;
    accounts!: Table<Account>;
    categories!: Table<Category>;
    debts!: Table<DebtItem>;
    credits!: Table<CreditItem>;
    notifications!: Table<Notification>;
    users!: Table<UserProfile>;
    contacts!: Table<SavedContact>;
    syncQueue!: Table<SyncQueueItem>;

    constructor() {
        super('FinanceDB');
        this.version(1).stores({
            transactions: 'id, userId, date, type, category',
            budgets: 'id, userId',
            accounts: 'id, userId',
            categories: 'id, userId, type',
            debts: 'id, userId, type, dueDate',
            credits: 'id, userId, type, dueDate',
            notifications: 'id, userId, isRead',
            users: 'id, isSaved',
            contacts: 'id, userId, isFavorite',
            syncQueue: '++id, timestamp'
        });
    }
}

export const db = new FinanceDB();

// Expose for E2E testing
if (typeof window !== 'undefined') {
    (window as any).Dexie = Dexie;
    (window as any).db = db;
}
