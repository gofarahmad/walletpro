import React, { useState, useMemo } from 'react';
import { CreditItem, CreditType, Account } from '../types';

interface CreditsProps {
  credits: CreditItem[];
  accounts: Account[];
  onPayCredit: (creditId: string, accountId: string) => void;
  onAddCredit: (credit: Omit<CreditItem, 'id' | 'isPaidThisMonth'>) => void;
  onDeleteCredit: (creditId: string) => void;
}

type StatusFilter = 'All' | 'Paid' | 'Unpaid';

const Credits: React.FC<CreditsProps> = ({ credits, accounts, onPayCredit, onAddCredit, onDeleteCredit }) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Loans' | 'Recurring'>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<CreditItem | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');

  // New Credit Form State
  const [name, setName] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState(''); // Only used for non-bank types or result
  const [totalAmount, setTotalAmount] = useState(''); // Plafond
  const [type, setType] = useState<CreditType>('Bank');
  const [dueDay, setDueDay] = useState('1');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('12');
  const [note, setNote] = useState('');

  // Banking Specific State
  const [interestRate, setInterestRate] = useState('');
  const [interestType, setInterestType] = useState<'Annual' | 'Monthly'>('Annual');
  const [holdType, setHoldType] = useState<'Nominal' | 'Multiplier'>('Multiplier');
  const [holdValue, setHoldValue] = useState('');
  const [adminFee, setAdminFee] = useState('');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  // --- Calculations ---

  // Flat Rate Calculation
  // Monthly Pmt = (Principal / Months) + (Principal * Rate / 12)
  const calculateBankMonthlyPayment = (principal: number, rate: number, months: number, intType: 'Annual' | 'Monthly') => {
    if (months === 0) return 0;
    const principalPerMonth = principal / months;
    let interestPerMonth = 0;
    if (intType === 'Annual') {
      interestPerMonth = (principal * (rate / 100)) / 12;
    } else {
      interestPerMonth = principal * (rate / 100);
    }
    return principalPerMonth + interestPerMonth;
  };

  const estimatedMonthlyPayment = useMemo(() => {
    const isBanking = ['KPR', 'Bank'].includes(type);
    if (!isBanking) {
      return parseFloat(monthlyPayment) || 0;
    }
    const p = parseFloat(totalAmount) || 0;
    const r = parseFloat(interestRate) || 0;
    const m = parseInt(duration) || 1;
    return calculateBankMonthlyPayment(p, r, m, interestType);
  }, [type, monthlyPayment, totalAmount, interestRate, duration, interestType]);

  const calculatedHoldAmount = useMemo(() => {
    const val = parseFloat(holdValue) || 0;
    if (holdType === 'Nominal') return val;
    return estimatedMonthlyPayment * val;
  }, [holdType, holdValue, estimatedMonthlyPayment]);

  const receivedAmount = useMemo(() => {
    const p = parseFloat(totalAmount) || 0;
    const admin = parseFloat(adminFee) || 0;
    return p - calculatedHoldAmount - admin;
  }, [totalAmount, calculatedHoldAmount, adminFee]);


  const filteredCredits = useMemo(() => {
    let list = credits;

    // Type Filter
    if (activeTab === 'Loans') {
      list = list.filter(c => ['KPR', 'Bank', 'Paylater'].includes(c.type));
    } else if (activeTab === 'Recurring') {
      list = list.filter(c => ['Subscription', 'Bills'].includes(c.type));
    }

    // Status Filter
    if (statusFilter === 'Paid') {
      list = list.filter(c => c.isPaidThisMonth);
    } else if (statusFilter === 'Unpaid') {
      list = list.filter(c => !c.isPaidThisMonth);
    }

    return list;
  }, [credits, activeTab, statusFilter]);

  const totalMonthly = useMemo(() =>
    credits.reduce((sum, c) => sum + c.monthlyPayment, 0),
    [credits]
  );

  const remainingMonthly = useMemo(() =>
    credits
      .filter(c => !c.isPaidThisMonth)
      .reduce((sum, c) => sum + c.monthlyPayment, 0),
    [credits]
  );

  const paidAmount = totalMonthly - remainingMonthly;

  const handleSave = () => {
    const isBanking = ['KPR', 'Bank'].includes(type);

    // Validate
    if (!name) return;

    let finalMonthlyPayment = 0;
    let finalTotalAmount = parseFloat(totalAmount) || 0;
    let finalDuration = parseInt(duration) || 1;

    if (isBanking) {
      finalMonthlyPayment = estimatedMonthlyPayment;
    } else {
      finalMonthlyPayment = parseFloat(monthlyPayment) || 0;
      // For Paylater/Bills/Subscription, Total Amount might be same as Monthly or user defined
      if (finalTotalAmount === 0 && finalDuration > 0) {
        finalTotalAmount = finalMonthlyPayment * finalDuration;
      }
    }

    if (finalMonthlyPayment <= 0) return;

    // Calculate elapsed months for progress
    const start = new Date(startDate);
    const now = new Date();
    const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    // Ensure we don't start with negative remaining
    const remainingTenorInitial = Math.max(0, finalDuration - Math.max(0, monthsPassed));

    onAddCredit({
      name,
      monthlyPayment: finalMonthlyPayment,
      totalAmount: finalTotalAmount,
      type,
      dueDate: parseInt(dueDay),
      startDate,
      totalTenor: finalDuration,
      remainingTenor: remainingTenorInitial,
      note,
      icon: type === 'KPR' ? 'home' : (type === 'Subscription' ? 'subscriptions' : (type === 'Bank' ? 'account_balance' : 'payments')),
      color: type === 'KPR' ? '#136dec' : (type === 'Subscription' ? '#ef4444' : (type === 'Bank' ? '#8b5cf6' : '#10b981')),
      // Banking fields to store
      interestRate: isBanking ? (parseFloat(interestRate) || 0) : 0,
      interestType: isBanking ? interestType : 'Annual',
      holdAmount: isBanking ? calculatedHoldAmount : 0,
      adminFee: isBanking ? (parseFloat(adminFee) || 0) : 0,
    });

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setMonthlyPayment('');
    setTotalAmount('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDuration('12');
    setNote('');
    setInterestRate('');
    setHoldValue('');
    setAdminFee('');
  };

  const handleOpenPayModal = (item: CreditItem) => {
    setSelectedCredit(item);
    setIsPayModalOpen(true);
  };

  const confirmPayment = () => {
    if (selectedCredit && selectedAccountId) {
      onPayCredit(selectedCredit.id, selectedAccountId);
      setIsPayModalOpen(false);
      setSelectedCredit(null);
    }
  };

  const handleOpenDeleteConfirm = (item: CreditItem) => {
    setSelectedCredit(item);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (selectedCredit) {
      onDeleteCredit(selectedCredit.id);
      setIsDeleteConfirmOpen(false);
      setSelectedCredit(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display relative">
      <header className="p-4 bg-white dark:bg-slate-900 sticky top-0 z-20 flex items-center border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold">Kredit & Tagihan</h2>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6 pb-32">
        {/* Summary Card */}
        <div className="bg-slate-900 rounded-[32px] p-7 shadow-2xl relative overflow-hidden text-white border border-white/5">
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[140px]">payments</span>
          </div>
          <div className="relative z-10">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <p className="text-slate-400 text-xs font-medium mb-1">Total Pagu Bulanan</p>
                <h1 className="text-base font-bold tracking-tight">{formatCurrency(totalMonthly)}</h1>
              </div>
              <div className="text-right">
                <p className="text-emerald-400/80 text-xs font-medium mb-1">Terbayar</p>
                <h1 className="text-base font-bold text-emerald-400">{formatCurrency(paidAmount)}</h1>
              </div>
            </div>
            <div className="flex justify-between items-end border-t border-white/10 pt-6">
              <div>
                <p className="text-rose-400 text-xs font-medium mb-1">Sisa Tagihan Bulan Ini</p>
                <h1 className="text-2xl font-bold tracking-tight leading-none">{formatCurrency(remainingMonthly)}</h1>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-primary">event_repeat</span>
                <span className="text-xs font-bold">{credits.filter(c => !c.isPaidThisMonth).length} Item</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['All', 'Loans', 'Recurring'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${activeTab === tab ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800'}`}>
                {tab === 'All' ? 'Semua' : (tab === 'Loans' ? 'Cicilan' : 'Langganan')}
              </button>
            ))}
          </div>

          <div className="flex gap-4 px-2">
            {(['All', 'Paid', 'Unpaid'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${statusFilter === status ? 'text-primary' : 'text-slate-400'}`}
              >
                <div className={`size-1.5 rounded-full ${statusFilter === status ? 'bg-primary animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                {status === 'All' ? 'Semua' : (status === 'Paid' ? 'Lunas' : 'Belum Bayar')}
              </button>
            ))}
          </div>
        </div>

        {/* Credit List */}
        <div className="space-y-4">
          {filteredCredits.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <span className="material-symbols-outlined text-4xl text-slate-200 dark:text-slate-800">search_off</span>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Tidak ada item ditemukan</p>
            </div>
          ) : (
            filteredCredits.map(item => {
              const isLoan = ['KPR', 'Bank', 'Paylater'].includes(item.type);

              // Recalculate Time Progress dynamically
              // Start Date vs Now
              const start = new Date(item.startDate || new Date().toISOString());
              const now = new Date();
              let monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
              monthsPassed = Math.max(0, monthsPassed);

              // If paid this month, we effectively advanced one more month in progress
              const effectiveMonthsPassed = monthsPassed + (item.isPaidThisMonth ? 1 : 0);

              const totalTenor = item.totalTenor || 1;
              const progressBytes = Math.min((effectiveMonthsPassed / totalTenor) * 100, 100);

              const remainingDebt = isLoan && item.remainingTenor ? item.monthlyPayment * item.remainingTenor : 0;

              // If remainingTenor stored in DB is decremented on pay, utilize it.
              // But for UI visual of "Time Passed", we use the calculated monthsPassed.

              return (
                <div key={item.id} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm relative group overflow-hidden">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="size-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                      <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-0.5">{item.type} • Tgl {item.dueDate}</p>
                          <h3 className="font-bold text-sm dark:text-white leading-tight truncate">{item.name}</h3>
                        </div>
                        <button
                          onClick={() => handleOpenDeleteConfirm(item)}
                          className="size-8 rounded-lg bg-rose-500/5 text-slate-300 hover:text-rose-500 flex items-center justify-center transition-all active:scale-90"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>

                      {item.note && (
                        <p className="text-[11px] text-slate-400 mt-1 italic line-clamp-2">"{item.note}"</p>
                      )}

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100/50 dark:border-slate-800">
                          <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Cicilan / Bln</p>
                          <p className="text-primary text-sm font-bold leading-none">{formatCurrency(item.monthlyPayment)}</p>
                        </div>
                        {isLoan && (
                          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100/50 dark:border-slate-800">
                            <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5">Sisa Tenor</p>
                            <p className="text-slate-700 dark:text-slate-300 text-sm font-bold leading-none">
                              {/* Show Calculated Remaining Tenor based on TIME if start date exists, otherwise DB value */}
                              {Math.max(0, (item.totalTenor || 0) - effectiveMonthsPassed)} <span className="text-[10px] font-normal">Bulan</span>
                            </p>
                          </div>
                        )}
                      </div>

                      {isLoan && item.totalTenor && (
                        <div className="mt-5 space-y-2">
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Waktu Berjalan</p>
                              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                                Bulan ke-{Math.min(Math.max(1, effectiveMonthsPassed + (item.isPaidThisMonth ? 0 : 1)), item.totalTenor)} dari {item.totalTenor}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-primary">{Math.min(Math.max(0, progressBytes), 100).toFixed(0)}%</p>
                            </div>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                            <div
                              className="h-full transition-all duration-1000 ease-out rounded-full"
                              style={{
                                width: `${Math.min(Math.max(0, progressBytes), 100)}%`,
                                backgroundColor: item.color,
                                boxShadow: `0 0 10px ${item.color}40`
                              }}
                            ></div>
                          </div>

                          {/* Sisa Cicilan Uang (Estimated Remaining Balance) */}
                          <div className="flex justify-between mt-1 pt-2 border-t border-slate-100 dark:border-slate-800/50 border-dashed">
                            <span className="text-[10px] text-slate-400 font-medium">Sisa Pokok + Bunga (Est)</span>
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              {formatCurrency(Math.max(0, (item.totalTenor - effectiveMonthsPassed) * item.monthlyPayment))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => progressBytes >= 100 ? handleOpenDeleteConfirm(item) : handleOpenPayModal(item)}
                    className={`w-full py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all mt-2 ${progressBytes >= 100
                      ? 'bg-slate-800 text-slate-200 shadow-lg active:scale-[0.98]'
                      : (item.isPaidThisMonth
                        ? 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                        : 'bg-primary text-white shadow-lg shadow-primary/20 active:scale-[0.98]')
                      }`}
                    disabled={!progressBytes >= 100 && item.isPaidThisMonth}
                  >
                    {progressBytes >= 100 ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-base">archive</span>
                        Arsipkan
                      </div>
                    ) : (
                      item.isPaidThisMonth ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-base">check_circle</span>
                          Lunas Bulan Ini
                        </div>
                      ) : 'Bayar Sekarang'
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Payment Selection Modal */}
      {isPayModalOpen && selectedCredit && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 pb-28">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-1">Pilih Sumber Dana</h3>
            <p className="text-xs text-slate-400 mb-6">Bayar {selectedCredit.name} - {formatCurrency(selectedCredit.monthlyPayment)}</p>

            <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedAccountId === acc.id
                    ? 'bg-primary/5 border-primary text-primary'
                    : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-xl">{acc.icon}</span>
                    <div className="text-left">
                      <p className="text-xs font-bold">{acc.name}</p>
                      <p className="text-[10px] opacity-70">{formatCurrency(acc.balance)}</p>
                    </div>
                  </div>
                  {selectedAccountId === acc.id && <span className="material-symbols-outlined text-base">check_circle</span>}
                </button>
              ))}
            </div>

            <div className="flex gap-3 pt-6">
              <button onClick={() => setIsPayModalOpen(false)} className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-sm">Batal</button>
              <button onClick={confirmPayment} className="flex-1 h-14 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20">Konfirmasi</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && selectedCredit && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 pb-28">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="size-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Hapus Item ini?</h3>
            <p className="text-xs text-slate-400 mb-8 px-2">Pastikan cicilan sudah lunas atau Anda sudah berhenti berlangganan "{selectedCredit.name}". Tindakan ini tidak dapat dibatalkan.</p>

            <div className="flex flex-col gap-3">
              <button onClick={confirmDelete} className="w-full h-14 rounded-2xl bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-500/20">Ya, Hapus Sekarang</button>
              <button onClick={() => setIsDeleteConfirmOpen(false)} className="w-full h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-sm">Kembali</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 pb-28">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-6">Tambah Tagihan / Cicilan</h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Nama Tagihan</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Misal: Netflix / KPR Bank" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Tipe</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-[10px] font-bold">
                  <option value="Subscription">Langganan</option>
                  <option value="Bills">Tagihan Bulanan</option>
                  <option value="KPR">KPR</option>
                  <option value="Bank">Bank (Personal Loan)</option>
                  <option value="Paylater">Paylater</option>
                </select>
              </div>

              {/* Conditional Form Fields */}
              {['KPR', 'Bank'].includes(type) ? (
                <>
                  {/* BANKING FORM */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Total Pinjaman</label>
                      <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="0" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Tenor (Bulan)</label>
                      <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="12" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Bunga (%)</label>
                      <div className="flex gap-1">
                        <input type="number" value={interestRate} onChange={e => setInterestRate(e.target.value)} className="w-16 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 text-sm font-bold" placeholder="0" />
                        <select value={interestType} onChange={e => setInterestType(e.target.value as any)} className="flex-1 h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-2 text-[10px] font-bold">
                          <option value="Annual">Year</option>
                          <option value="Monthly">Month</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Admin Fee</label>
                      <input type="number" value={adminFee} onChange={e => setAdminFee(e.target.value)} className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold" placeholder="0" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400 block">Dana Ditahan</label>
                      <button
                        onClick={() => setHoldType(prev => prev === 'Nominal' ? 'Multiplier' : 'Nominal')}
                        className="text-[10px] font-bold text-primary underline"
                      >
                        {holdType === 'Nominal' ? 'Switch to Multiplier (x)' : 'Switch to Nominal (Rp)'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={holdValue}
                        onChange={e => setHoldValue(e.target.value)}
                        className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold pl-12"
                        placeholder="0"
                      />
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                        {holdType === 'Nominal' ? 'Rp' : 'x'}
                      </div>
                      {holdType === 'Multiplier' && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">
                          = {formatCurrency(calculatedHoldAmount)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Tanggal Pencairan / Mulai</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold" />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl space-y-2 border border-blue-100 dark:border-blue-800">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Estimasi Cicilan/Bulan</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(estimatedMonthlyPayment)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Dana Diterima Bersih</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(receivedAmount)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* SIMPLE FORM (Bills, Subscriptions, Paylater) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">{type === 'Paylater' ? 'Cicilan/Bulan' : 'Tagihan/Bulan'}</label>
                      <input type="number" value={monthlyPayment} onChange={e => setMonthlyPayment(e.target.value)} placeholder="0" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Jatuh Tempo (Tgl)</label>
                      <input type="number" value={dueDay} onChange={e => setDueDay(e.target.value)} placeholder="1" min="1" max="31" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold" />
                    </div>
                  </div>
                  {/* Paylater Specifics */}
                  {type === 'Paylater' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Total Limit/Pinjaman</label>
                        <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="Opsional" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Tenor (Bulan)</label>
                        <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="12" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold" />
                      </div>
                    </div>
                  )}
                  {/* Start Date also useful for progress */}
                  {type === 'Paylater' && (
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Tanggal Transaksi</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold" />
                    </div>
                  )}
                </>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Catatan (Opsional)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Keterangan tambahan..."
                  className="w-full h-20 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-900 py-2">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-sm">Batal</button>
                <button onClick={handleSave} className="flex-1 h-14 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => setIsModalOpen(true)} className="absolute bottom-24 right-6 size-14 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-40">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </div>
  );
};

export default Credits;
