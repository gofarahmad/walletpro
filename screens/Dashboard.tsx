
import React, { useState } from 'react';
import { Transaction, UserProfile, Category, BudgetCategory } from '../types';

interface DashboardProps {
  user: UserProfile;
  totalBalance: number;
  income: number;
  expenses: number;
  transactions: Transaction[];
  categories: Category[];
  budgets: BudgetCategory[];
  unreadNotifCount: number;
  onAdd: () => void;
  onEdit: (tx: Transaction) => void;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onSeeAll: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  user,
  totalBalance,
  income,
  expenses,
  transactions,
  categories = [],
  budgets = [],
  unreadNotifCount,
  onAdd,
  onEdit,
  onOpenNotifications,
  onOpenSettings,
  onSeeAll
}) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const getCategoryDetails = (id: string, type: string) => {
    // Check standard categories
    const cat = categories.find(c => c.id === id);
    if (cat) return { name: cat.name, icon: cat.icon, color: cat.color };

    // Check budgets
    const budget = budgets.find(b => b.id === id);
    if (budget) return { name: budget.name, icon: budget.icon, color: budget.color };

    // Fallback
    return { name: id, icon: type === 'Income' ? 'payments' : 'shopping_bag', color: undefined };
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark font-display relative">
      <header className="flex items-center bg-white dark:bg-slate-900 p-4 sticky top-0 z-20 border-b border-slate-100 dark:border-slate-800 shadow-sm text-slate-900 dark:text-slate-100">
        <button
          onClick={onOpenSettings}
          className="flex size-10 shrink-0 items-center active:scale-95 transition-transform"
        >
          <img
            src={user.photoUrl}
            className="rounded-xl size-10 border-2 border-primary/20 object-cover"
            alt="User"
          />
        </button>
        <div className="flex flex-col flex-1 px-3">
          <p className="text-xs text-slate-500 font-medium leading-none mb-1">Selamat datang,</p>
          <h2 className="text-base font-bold leading-tight truncate">{user.name}</h2>
        </div>
        <button
          onClick={onOpenNotifications}
          className="relative size-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-xl">notifications</span>
          {unreadNotifCount > 0 && (
            <span className="absolute top-2 right-2 size-2.5 bg-rose-500 border-2 border-white dark:border-slate-800 rounded-full animate-pulse"></span>
          )}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6 pb-32">
        {/* Balance Card */}
        <div className="bg-slate-900 rounded-[32px] p-7 shadow-2xl relative overflow-hidden text-white border border-white/5">
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[140px]">account_balance_wallet</span>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-slate-400 text-xs font-medium">Total Saldo Tersedia</p>
              <button
                onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                className="flex items-center text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isBalanceVisible ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-8">
              {isBalanceVisible ? formatCurrency(totalBalance) : 'Rp ••••••••'}
            </h1>

            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
              <div>
                <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1">Pemasukan</p>
                <p className="text-base font-bold">
                  {formatCurrency(income)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-rose-400 text-[10px] font-bold uppercase tracking-wider mb-1">Pengeluaran</p>
                <p className="text-base font-bold">
                  {formatCurrency(expenses)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold">Transaksi Terakhir</h3>
            <button onClick={onSeeAll} className="text-primary text-sm font-bold">Lihat Semua</button>
          </div>

          <div className="space-y-3">
            {transactions.slice(0, 10).map((tx) => (
              <div
                key={tx.id}
                onClick={() => onEdit(tx)}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-all"
              >
                {(() => {
                  const { name, icon, color } = getCategoryDetails(tx.category, tx.type);
                  return (
                    <>
                      <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'Income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`} style={color ? { backgroundColor: `${color}20`, color: color } : {}}>
                        <span className="material-symbols-outlined text-xl">{icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900 dark:text-white font-bold text-sm truncate">{tx.note || name}</p>
                        <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">{name}</p>
                      </div>
                    </>
                  );
                })()}
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.type === 'Income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                    {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount).replace('Rp', '')}
                  </p>
                  <p className="text-slate-400 text-[9px] font-medium uppercase">
                    {new Date(tx.date).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onAdd}
        className="fixed bottom-24 right-6 size-14 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-40"
      >
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </div>
  );
};

export default Dashboard;
