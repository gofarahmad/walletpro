import { Transaction, BudgetCategory, Account, Category, DebtItem, CreditItem, Notification, UserProfile } from '../types';
import { DEFAULT_CATEGORIES } from '../mockData';

// Helper to map MySQL snake_case to camelCase
export const mapUser = (u: any): UserProfile => ({
    id: u.id,
    name: u.name,
    phoneNumber: u.phone_number,
    pin: u.pin || '1234',
    photoUrl: u.photo_url,
    isSaved: u.is_saved
});

export const mapTransaction = (t: any): Transaction => ({
    id: t.id,
    amount: parseFloat(t.amount),
    type: t.type,
    category: t.category,
    date: t.date,
    note: t.note
});

export const mapAccount = (a: any): Account => ({
    id: a.id,
    name: a.name,
    balance: parseFloat(a.balance),
    icon: a.icon,
    type: a.type || 'Bank',
    accountNumber: a.account_number,
    phoneNumber: a.phone_number,
    accountHolder: a.account_holder
});

export const mapCategory = (c: any): Category => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    type: c.type
});

export const mapBudget = (b: any): BudgetCategory => ({
    id: b.id,
    name: b.category,
    limit: parseFloat(b.limit_amount),
    spent: parseFloat(b.spent || 0),
    icon: b.icon,
    color: b.color || 'bg-blue-500'
});

export const mapDebt = (d: any): DebtItem => ({
    id: d.id,
    type: d.type || 'Hutang',
    contactName: d.name,
    phoneNumber: d.phone_number,
    amount: parseFloat(d.amount),
    remainingAmount: parseFloat(d.amount) - parseFloat(d.paid || 0),
    paid: parseFloat(d.paid || 0),
    dueDate: d.due_date,
    interestRate: parseFloat(d.interest_rate || 0),
    interestType: d.interest_type,
    startDate: d.start_date,
    durationMonths: d.duration_months,
    holdAmount: parseFloat(d.hold_amount || 0),
    adminFee: parseFloat(d.admin_fee || 0),
    lastPaymentDate: d.last_payment_date,
    history: d.history ? d.history.map((h: any) => ({
        id: h.id,
        amount: parseFloat(h.amount),
        date: h.date,
        note: h.note
    })) : []
});

export const mapCredit = (c: any): CreditItem => {
    const totalTenor = c.duration_months || 0;
    // Default to DB value or Total Tenor if not present
    let remainingTenor = c.remaining_tenor !== undefined ? c.remaining_tenor : (totalTenor || 0);

    // Dynamic calculation based on time passed to ensure 'Sisa Tenor' is accurate to the calendar
    if (c.start_date && totalTenor > 0) {
        const start = new Date(c.start_date);
        const now = new Date();
        // Calculate full months passed
        const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

        // Only subtract if positive. 
        // If future date, monthsPassed is negative, so we stick to totalTenor.
        if (monthsPassed > 0) {
            remainingTenor = Math.max(0, totalTenor - monthsPassed);
        }
    }

    return {
        id: c.id,
        name: c.name,
        monthlyPayment: parseFloat(c.amount),
        dueDate: c.due_date,
        isPaidThisMonth: c.is_paid_this_month,
        type: c.type || 'Bank',
        icon: c.icon || (c.type === 'KPR' ? 'home' : (c.type === 'Subscription' ? 'subscriptions' : (c.type === 'Bank' ? 'account_balance' : 'payments'))),
        color: c.color || (c.type === 'KPR' ? '#136dec' : (c.type === 'Subscription' ? '#ef4444' : (c.type === 'Bank' ? '#8b5cf6' : '#10b981'))),
        // Banking Fields
        totalAmount: parseFloat(c.total_loan_amount || 0),
        interestRate: parseFloat(c.interest_rate || 0),
        interestType: c.interest_type || 'Annual',
        totalTenor: totalTenor,
        startDate: c.start_date,
        holdAmount: parseFloat(c.hold_amount || 0),
        adminFee: parseFloat(c.admin_fee || 0),
        remainingTenor: remainingTenor
    };
};

export const mapNotification = (n: any): Notification => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: n.is_read,
    date: n.date
});
