
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, CreditItem, DebtItem, Category, BudgetCategory } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface AnalysisProps {
  transactions: Transaction[];
  credits: CreditItem[];
  debts: DebtItem[];
  categories: Category[];
  budgets: BudgetCategory[];
  onEdit: (tx: Transaction) => void;
}

type AnalysisTab = TransactionType | 'Obligations' | 'Recap' | 'History';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const Analysis: React.FC<AnalysisProps> = ({ transactions, credits, debts, categories = [], budgets = [], onEdit }) => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('Expense');

  // Date Range State
  // Default to current month
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<string | null>(null);

  // Recap State
  const [recapView, setRecapView] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [selectedRecapMonth, setSelectedRecapMonth] = useState(new Date().getMonth());
  const [selectedRecapYear, setSelectedRecapYear] = useState(new Date().getFullYear());

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  };

  const filteredTransactions = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Set end date to end of day for inclusive comparison if needed, 
    // but usually string comparison "YYYY-MM-DD" works if transaction date matches format or we parse correctly.
    // Assuming transaction.date is "YYYY-MM-DD" or ISO string. 
    // Let's ensure accurate comparison by resetting times.

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      if (activeTab === 'Obligations') return true;

      const isCorrectType = t.type === activeTab;
      if (!isCorrectType) return false;

      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });
  }, [transactions, activeTab, startDate, endDate]);

  const historyTransactions = useMemo(() => {
    if (activeTab !== 'History') return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, activeTab, startDate, endDate]);

  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    historyTransactions.forEach(t => {
      const dateKey = new Date(t.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      // Logic for "Hari Ini" / "Kemarin"
      const tDate = new Date(t.date).setHours(0, 0, 0, 0);
      const today = new Date().setHours(0, 0, 0, 0);
      const yesterday = new Date(Date.now() - 86400000).setHours(0, 0, 0, 0);

      let label = dateKey;
      if (tDate === today) label = 'Hari Ini';
      if (tDate === yesterday) label = 'Kemarin';

      if (!groups[label]) groups[label] = [];
      groups[label].push(t);
    });
    return groups;
  }, [historyTransactions]);


  // Obligations Stats calculation
  const obligationStats = useMemo(() => {
    const totalHutang = debts?.filter(d => d.type === 'Hutang').reduce((sum, d) => sum + (d.remainingAmount || 0), 0) || 0;
    const totalPiutang = debts?.filter(d => d.type === 'Piutang').reduce((sum, d) => sum + (d.remainingAmount || 0), 0) || 0;

    const unpaidCredits = credits?.filter(c => !c.isPaidThisMonth) || [];
    const totalUnpaidBills = unpaidCredits.reduce((sum, c) => sum + c.monthlyPayment, 0);

    const totalLoans = credits
      .filter(c => ['KPR', 'Bank', 'Paylater'].includes(c.type))
      .reduce((sum, c) => sum + (c.monthlyPayment * (c.remainingTenor || 0)), 0);

    return { totalHutang, totalPiutang, totalUnpaidBills, totalLoans, unpaidCredits };
  }, [credits, debts]);

  const getCategoryDetails = (id: string, type: string) => {
    const cat = categories.find(c => c.id === id);
    if (cat) return { name: cat.name, icon: cat.icon, color: cat.color };

    const budget = budgets.find(b => b.id === id);
    if (budget) return { name: budget.name, icon: budget.icon, color: budget.color };

    return { name: id, icon: type === 'Income' ? 'payments' : 'shopping_bag', color: undefined };
  };

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    const list = activeTab === 'Obligations' ? transactions.filter(t => t.type === 'Expense') :
      activeTab === 'History' ? [] : filteredTransactions;

    list.forEach(t => {
      // Resolve name first to aggregate by Name instead of ID
      const { name } = getCategoryDetails(t.category, t.type);
      totals[name] = (totals[name] || 0) + t.amount;
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions, activeTab, transactions, categories, budgets]);

  const transactionsForSelectedCategory = useMemo(() => {
    if (!selectedCategoryDetail) return [];
    // Filter by resolved name
    return filteredTransactions.filter(t => {
      const { name } = getCategoryDetails(t.category, t.type);
      return name === selectedCategoryDetail;
    });
  }, [filteredTransactions, selectedCategoryDetail, categories, budgets]);

  // Recap Calculations
  const monthlyStats = useMemo(() => {
    const start = new Date(selectedRecapYear, selectedRecapMonth, 1);
    const end = new Date(selectedRecapYear, selectedRecapMonth + 1, 0, 23, 59, 59, 999);

    const monthlyTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });

    const income = monthlyTx.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthlyTx.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);

    return { income, expense, balance: income - expense };
  }, [transactions, selectedRecapMonth, selectedRecapYear]);

  const yearlyStats = useMemo(() => {
    const start = new Date(selectedRecapYear, 0, 1);
    const end = new Date(selectedRecapYear, 11, 31, 23, 59, 59, 999);

    const yearlyTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });

    const income = yearlyTx.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const expense = yearlyTx.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);

    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const monthStart = new Date(selectedRecapYear, i, 1);
      const monthEnd = new Date(selectedRecapYear, i + 1, 0, 23, 59, 59);
      const mTx = yearlyTx.filter(t => {
        const d = new Date(t.date);
        return d >= monthStart && d <= monthEnd;
      });
      return {
        name: MONTHS[i].substring(0, 3),
        income: mTx.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0),
        expense: mTx.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0),
      }
    });

    return { income, expense, balance: income - expense, monthlyData };
  }, [transactions, selectedRecapYear]);

  const COLORS = activeTab === 'Income'
    ? ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0']
    : ['#136dec', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

  const totalValue = categoryTotals.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark font-display overflow-hidden">
      <header className="shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 flex items-center border-b border-slate-100 dark:border-slate-800 z-30">
        <h2 className="text-lg font-bold">Analisis</h2>
      </header>

      {/* Main Tabs Selection */}
      <div className="px-4 pt-4 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('Expense')}
            className={`flex-1 min-w-[80px] py-3 text-[11px] font-bold rounded-xl transition-all ${activeTab === 'Expense' ? 'bg-white dark:bg-slate-700 text-primary shadow-lg shadow-black/5' : 'text-slate-500'}`}
          >
            Pengeluaran
          </button>
          <button
            onClick={() => setActiveTab('Income')}
            className={`flex-1 min-w-[80px] py-3 text-[11px] font-bold rounded-xl transition-all ${activeTab === 'Income' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-lg shadow-black/5' : 'text-slate-500'}`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => setActiveTab('History')}
            className={`flex-1 min-w-[80px] py-3 text-[11px] font-bold rounded-xl transition-all ${activeTab === 'History' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg shadow-black/5' : 'text-slate-500'}`}
          >
            Riwayat
          </button>
          <button
            onClick={() => setActiveTab('Obligations')}
            className={`flex-1 min-w-[80px] py-3 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center ${activeTab === 'Obligations' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500'}`}
          >
            Kewajiban
          </button>
          <button
            onClick={() => setActiveTab('Recap')}
            className={`flex-1 min-w-[80px] py-3 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center ${activeTab === 'Recap' ? 'bg-white dark:bg-slate-700 text-primary shadow-lg' : 'text-slate-500'}`}
          >
            Rekap
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">

        {activeTab === 'History' && (
          <div className="p-4 space-y-4">
            {/* Filter Toggle & Display */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${showDatePicker ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-800'}`}
                >
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                  {showDatePicker ? 'Tutup Filter' : 'Filter Tanggal'}
                </button>
                {!showDatePicker && (
                  <p className="text-[10px] font-bold text-slate-400">
                    {formatDateShort(startDate)} - {formatDateShort(endDate)}
                  </p>
                )}
              </div>

              {/* Date Range Inputs */}
              {showDatePicker && (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Dari</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold p-3 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <span className="material-symbols-outlined text-slate-300 pt-5">arrow_forward</span>
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Sampai</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold p-3 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* History List */}
            {Object.keys(groupedHistory).length > 0 ? (
              Object.entries(groupedHistory).map(([label, txs]) => (
                <div key={label} className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 sticky top-0 bg-slate-50 dark:bg-background-dark py-2 z-10">{label}</h3>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                    {txs.map((tx, idx) => (
                      <div
                        key={tx.id}
                        onClick={() => onEdit(tx)}
                        className={`flex items-center gap-4 p-4 active:bg-slate-50 dark:active:bg-slate-800 transition-colors ${idx !== txs.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
                      >
                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'Income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                          {(() => {
                            const { name, icon } = getCategoryDetails(tx.category, tx.type);
                            return <span className="material-symbols-outlined text-xl">{icon}</span>;
                          })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate text-slate-900 dark:text-white">
                            {(() => {
                              const { name } = getCategoryDetails(tx.category, tx.type);
                              return tx.note || name;
                            })()}
                          </p>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const { name } = getCategoryDetails(tx.category, tx.type);
                              return <span className="text-[10px] font-bold text-slate-500 uppercase">{name}</span>;
                            })()}
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${tx.type === 'Income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                            {tx.type === 'Income' ? '+' : '-'}{formatCurrency(tx.amount).replace('Rp', '')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center space-y-3">
                <span className="material-symbols-outlined text-4xl text-slate-200">history</span>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tidak ada riwayat transaksi</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Recap' ? (
          <div className="p-4 space-y-6">
            {/* View Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setRecapView('Monthly')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${recapView === 'Monthly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
              >
                Bulanan
              </button>
              <button
                onClick={() => setRecapView('Yearly')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${recapView === 'Yearly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}
              >
                Tahunan
              </button>
            </div>

            {/* Date Selector */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
              <button
                onClick={() => recapView === 'Monthly' ? setSelectedRecapMonth(m => m - 1) : setSelectedRecapYear(y => y - 1)}
                className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <span className="font-bold text-lg">
                {recapView === 'Monthly'
                  ? `${MONTHS[new Date(selectedRecapYear, selectedRecapMonth).getMonth()]} ${new Date(selectedRecapYear, selectedRecapMonth).getFullYear()}`
                  : selectedRecapYear
                }
              </span>
              <button
                onClick={() => recapView === 'Monthly' ? setSelectedRecapMonth(m => m + 1) : setSelectedRecapYear(y => y + 1)}
                className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/20">
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Total Pemasukan</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(recapView === 'Monthly' ? monthlyStats.income : yearlyStats.income)}
                </h3>
              </div>
              <div className="bg-rose-500/10 dark:bg-rose-500/5 p-5 rounded-2xl border border-rose-500/20">
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Total Pengeluaran</p>
                <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(recapView === 'Monthly' ? monthlyStats.expense : yearlyStats.expense)}
                </h3>
              </div>
              <div className="bg-blue-500/10 dark:bg-blue-500/5 p-5 rounded-2xl border border-blue-500/20">
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Sisa Saldo</p>
                <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(recapView === 'Monthly' ? monthlyStats.balance : yearlyStats.balance)}
                </h3>
              </div>
            </div>

            {/* Yearly Chart */}
            {recapView === 'Yearly' && (
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 h-80">
                <p className="text-xs font-bold mb-4">Grafik Bulanan</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyStats.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ) : activeTab !== 'Obligations' && activeTab !== 'History' ? (
          <div className="p-4 space-y-4">
            {/* Filter Toggle & Display */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${showDatePicker ? 'bg-slate-900 text-white border-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-800'}`}
                >
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                  {showDatePicker ? 'Tutup Filter' : 'Filter Tanggal'}
                </button>
                {!showDatePicker && (
                  <p className="text-[10px] font-bold text-slate-400">
                    {formatDateShort(startDate)} - {formatDateShort(endDate)}
                  </p>
                )}
              </div>

              {/* Date Range Inputs */}
              {showDatePicker && (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Dari</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold p-3 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <span className="material-symbols-outlined text-slate-300 pt-5">arrow_forward</span>
                    <div className="flex-1 space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">Sampai</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold p-3 focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total Highlight */}
            <div className="text-center py-6 bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <span className="material-symbols-outlined text-4xl">analytics</span>
              </div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                Total {activeTab === 'Expense' ? 'Pengeluaran' : 'Pemasukan'}
              </p>
              <h1 className={`text-3xl font-bold tracking-tight ${activeTab === 'Expense' ? 'text-slate-900 dark:text-white' : 'text-emerald-500'}`}>
                {formatCurrency(totalValue)}
              </h1>
              <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">
                {formatDateShort(startDate)} — {formatDateShort(endDate)}
              </p>
            </div>

            {/* Donut Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative">
              <div className="h-64 flex justify-center items-center">
                {categoryTotals.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryTotals}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        animationDuration={1000}
                        onClick={(data) => setSelectedCategoryDetail(data.name)}
                      >
                        {categoryTotals.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="cursor-pointer" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <span className="material-symbols-outlined text-5xl mb-2">data_usage</span>
                    <p className="text-xs font-bold uppercase tracking-widest">Tidak ada data</p>
                  </div>
                )}
                <div className="absolute flex flex-col items-center pointer-events-none">
                  <span className={`material-symbols-outlined scale-110 mb-1 ${activeTab === 'Expense' ? 'text-primary' : 'text-emerald-500'}`}>
                    {activeTab === 'Expense' ? 'payments' : 'account_balance_wallet'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{activeTab === 'Expense' ? 'Expenses' : 'Income'}</span>
                </div>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-base font-bold">Rincian Per Kategori</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{categoryTotals.length} Item</span>
              </div>
              <div className="space-y-3">
                {categoryTotals.map((cat, idx) => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategoryDetail(cat.name)}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 active:scale-[0.98] transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      {(() => {
                        // Find detail again simply to get icon/color if needed, but we iterate over categoryTotals which is {name, value}
                        // We don't have ID here, only Name.
                        // We might need to find by Name.
                        // Optimization: Aggregation should probably keep icon/color?
                        // OR lookup by name.
                        const findCatByName = categories.find(c => c.name === cat.name) || budgets.find(b => b.name === cat.name);
                        const icon = findCatByName?.icon || (cat.name.toLowerCase().includes('income') ? 'payments' : 'category');

                        return (
                          <div className="size-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLORS[idx % COLORS.length]}20`, color: COLORS[idx % COLORS.length] }}>
                            <span className="material-symbols-outlined text-xl">{icon}</span>
                          </div>
                        );
                      })()}
                      <div>
                        <p className="font-bold text-sm">{cat.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="w-20 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-1000"
                              style={{ width: `${(cat.value / totalValue) * 100}%`, backgroundColor: COLORS[idx % COLORS.length] }}
                            ></div>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold">{((cat.value / totalValue) * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <p className="font-bold text-sm">{formatCurrency(cat.value)}</p>
                      <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Obligations view remains similar but could also benefit from timeframe if needed */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-rose-500/10 dark:bg-rose-500/5 border border-rose-500/20 p-5 rounded-[32px] shadow-sm">
                <span className="material-symbols-outlined text-rose-500 mb-2">trending_down</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Hutang</p>
                <h4 className="text-lg font-bold text-rose-500">{formatCurrency(obligationStats.totalHutang)}</h4>
              </div>
              <div className="bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-[32px] shadow-sm">
                <span className="material-symbols-outlined text-emerald-500 mb-2">trending_up</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Piutang</p>
                <h4 className="text-lg font-bold text-emerald-500">{formatCurrency(obligationStats.totalPiutang)}</h4>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[32px] p-7 shadow-2xl relative overflow-hidden text-white border border-white/5">
              <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
                <span className="material-symbols-outlined text-[120px]">pending_actions</span>
              </div>
              <div className="relative z-10">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Sisa Tagihan Bulan Ini</p>
                <h1 className="text-3xl font-bold tracking-tight mb-6">{formatCurrency(obligationStats.totalUnpaidBills)}</h1>
                <div className="flex items-center gap-2 text-rose-400">
                  <span className="material-symbols-outlined text-base">warning</span>
                  <p className="text-xs font-bold">{obligationStats.unpaidCredits.length} tagihan menunggu pembayaran</p>
                </div>
              </div>
            </div>
            {/* ... other obligation items ... */}

            {/* Debt List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-base font-bold">Daftar Hutang & Piutang</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{debts.length} Item</span>
              </div>
              <div className="space-y-3">
                {debts.map((debt) => (
                  <div key={debt.id} className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className={`size-10 rounded-xl flex items-center justify-center ${debt.type === 'Hutang' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        <span className="material-symbols-outlined text-xl">
                          {debt.type === 'Hutang' ? 'call_received' : 'call_made'}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">{debt.contactName}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${debt.type === 'Hutang' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                            {debt.type}
                          </span>
                          <p className="text-[10px] text-slate-400">Jatuh tempo: {new Date(debt.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${debt.type === 'Hutang' ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {formatCurrency(debt.remainingAmount)}
                      </p>
                      <p className="text-[10px] text-slate-400">dari {formatCurrency(debt.amount)}</p>
                    </div>
                  </div>
                ))}
                {debts.length === 0 && (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tidak ada data hutang/piutang</p>
                  </div>
                )}
              </div>
            </div>

            {/* Credit List */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-base font-bold">Tagihan & Cicilan</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{credits.length} Item</span>
              </div>
              <div className="space-y-3">
                {credits.map((credit) => (
                  <div key={credit.id} className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined text-xl">{credit.icon || 'receipt_long'}</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">{credit.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{credit.type}</p>
                          {credit.remainingTenor && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                              {credit.remainingTenor}x lagi
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">
                        {formatCurrency(credit.monthlyPayment)}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {credit.isPaidThisMonth ? (
                          <span className="text-emerald-500 font-bold">Lunas Bulan Ini</span>
                        ) : (
                          <span className="text-rose-500 font-bold">Belum Dibayar</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                {credits.length === 0 && (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tidak ada tagihan aktif</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drill-down Modal */}
      {selectedCategoryDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end justify-center animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[480px] rounded-t-[40px] shadow-2xl animate-in slide-in-from-bottom-full duration-500 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Kategori</p>
                <h3 className="text-xl font-bold">{selectedCategoryDetail}</h3>
              </div>
              <button
                onClick={() => setSelectedCategoryDetail(null)}
                className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {transactionsForSelectedCategory.length > 0 ? (
                transactionsForSelectedCategory.map(tx => (
                  <div
                    key={tx.id}
                    onClick={() => {
                      onEdit(tx);
                      setSelectedCategoryDetail(null);
                    }}
                    className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 active:scale-[0.98] transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {(() => {
                          const { name } = getCategoryDetails(tx.category, tx.type);
                          return tx.note || name;
                        })()}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-medium">
                        {new Date(tx.date).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${activeTab === 'Income' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                        {activeTab === 'Income' ? '+' : '-'}{formatCurrency(tx.amount).replace('Rp', '')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center space-y-3">
                  <span className="material-symbols-outlined text-4xl text-slate-200">history</span>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tidak ada transaksi ditemukan</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400 uppercase">Total {selectedCategoryDetail}</p>
                <p className="text-lg font-bold text-primary">
                  {formatCurrency(transactionsForSelectedCategory.reduce((sum, t) => sum + t.amount, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analysis;
