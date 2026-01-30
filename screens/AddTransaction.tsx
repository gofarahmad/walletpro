
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Category, Account, BudgetCategory } from '../types';


interface AddTransactionProps {
  onSave: (tx: Omit<Transaction, 'id'>, accountId: string) => void;
  onTransfer?: (fromId: string, toId: string, amount: number) => void;
  onClose: () => void;
  initialData?: Transaction;
  categories: Category[];
  budgets?: BudgetCategory[];
  accounts: Account[];
  onAddCategory: (cat: Category) => void;
  onDeleteCategory: (id: string) => void;
}

const ICON_PICKER_OPTIONS = [
  'restaurant', 'directions_car', 'shopping_bag', 'home', 'medical_services',
  'payments', 'movie', 'more_horiz', 'fitness_center', 'work', 'school', 'pets',
  'flight', 'spa', 'brush', 'bolt', 'local_gas_station', 'celebration', 'trending_up', 'redeem'
];

const AddTransaction: React.FC<AddTransactionProps> = ({
  onSave,
  onTransfer,
  onClose,
  initialData,
  categories,
  budgets = [],
  accounts,
  onAddCategory,
  onDeleteCategory
}) => {
  const [amount, setAmount] = useState(initialData ? initialData.amount.toString() : '0');
  const [type, setType] = useState<TransactionType>(initialData ? initialData.type : 'Expense');

  // Filter categories by type
  const filteredCategories = useMemo(() => {
    const cats = categories.filter(c => c.type === type);
    if (type === 'Expense') {
      // Merge budgets as categories
      const budgetCats = budgets.map(b => ({
        id: b.id,
        name: b.name,
        icon: b.icon,
        type: 'Expense' as TransactionType,
        color: b.color
      }));
      return [...budgetCats, ...cats];
    }
    return cats;
  }, [categories, budgets, type]);

  const [category, setCategory] = useState(initialData ? initialData.category : (filteredCategories[0]?.id || 'Other'));
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || ''); // From Account
  const [recipientAccountId, setRecipientAccountId] = useState(accounts.length > 1 ? accounts[1].id : ''); // To Account
  const [note, setNote] = useState(initialData ? initialData.note : '');

  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('more_horiz');
  const [isManaging, setIsManaging] = useState(false);

  const formatDisplayAmount = (str: string) => {
    const val = parseInt(str) || 0;
    return new Intl.NumberFormat('id-ID').format(val);
  };

  const handleKeyPress = (val: string) => {
    if (val === 'backspace') {
      setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else {
      setAmount(prev => {
        if (prev === '0') {
          if (val === '000' || val === '0') return '0';
          return val;
        }
        return prev + val;
      });
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType !== 'Transfer') {
      // Auto switch category to the first one available in the new type
      const firstOfNewType = categories.find(c => c.type === newType);
      if (firstOfNewType) setCategory(firstOfNewType.id);
    }
  };

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    if (type === 'Transfer' && onTransfer) {
      if (!selectedAccountId || !recipientAccountId || selectedAccountId === recipientAccountId) return;
      onTransfer(selectedAccountId, recipientAccountId, numAmount);
      onClose();
      return;
    }

    onSave({
      amount: numAmount,
      type,
      category,
      note: type === 'Transfer' ? `Transfer: ${note}` : note,
      date: initialData ? initialData.date : new Date().toISOString()
    }, selectedAccountId);
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: newCatName.trim().replace(/\s+/g, '_'),
      name: newCatName.trim(),
      icon: newCatIcon,
      type: type === 'Transfer' ? 'Expense' : type // Default to expense if somehow adding cat in transfer mode
    };
    onAddCategory(newCat);
    setCategory(newCat.id);
    setNewCatName('');
    setIsCreatingCategory(false);
  };
  if (isCreatingCategory) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
        <header className="flex items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-4">
          <button onClick={() => setIsCreatingCategory(false)} className="text-primary flex items-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-lg">Kategori Baru</h2>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Nama Kategori</label>
            <input
              autoFocus
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full h-14 px-4 bg-white dark:bg-slate-800 rounded-xl border-slate-200 dark:border-slate-700 text-lg font-bold focus:ring-primary focus:border-primary"
              placeholder="Misal: Langganan"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase">Pilih Ikon</label>
            <div className="grid grid-cols-6 gap-3">
              {ICON_PICKER_OPTIONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setNewCatIcon(icon)}
                  className={`size-12 rounded-xl flex items-center justify-center transition-all ${newCatIcon === icon
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110'
                    : 'bg-white dark:bg-slate-800 text-slate-400'
                    }`}
                >
                  <span className="material-symbols-outlined">{icon}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleCreateCategory}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg"
          >
            Buat Kategori
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark relative">
      <header className="flex items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-4">
        <button onClick={onClose} className="text-primary flex items-center">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h2 className="flex-1 font-bold text-lg">{initialData ? 'Ubah Transaksi' : 'Tambah Transaksi'}</h2>
        <button onClick={() => setAmount('0')} className="text-primary font-bold text-xs">Reset</button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="pt-8 pb-4 text-center">
          <h1 className={`text-4xl font-bold tracking-tight ${type === 'Income' ? 'text-emerald-500' : (type === 'Transfer' ? 'text-blue-500' : 'text-slate-900 dark:text-white')}`}>
            Rp {formatDisplayAmount(amount)}
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">Masukkan jumlah</p>
        </div>

        <div className="px-4 py-3">
          <div className="flex h-12 bg-slate-200 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => handleTypeChange('Expense')}
              className={`flex-1 rounded-lg text-xs font-bold transition-all ${type === 'Expense' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-500'}`}
            >
              Pengeluaran
            </button>
            <button
              onClick={() => handleTypeChange('Income')}
              className={`flex-1 rounded-lg text-xs font-bold transition-all ${type === 'Income' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-500'}`}
            >
              Pemasukan
            </button>
            <button
              onClick={() => handleTypeChange('Transfer')}
              className={`flex-1 rounded-lg text-xs font-bold transition-all ${type === 'Transfer' ? 'bg-white dark:bg-slate-700 text-blue-500 shadow-sm' : 'text-slate-500'}`}
            >
              Transfer
            </button>
          </div>
        </div>

        {/* Account Selection logic */}
        {type === 'Transfer' ? (
          <div className="px-4 mt-2 space-y-4">
            {/* FROM ACCOUNT */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Dari Akun</label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {accounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border whitespace-nowrap transition-all ${selectedAccountId === acc.id
                      ? 'bg-primary border-primary text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    <span className="material-symbols-outlined text-sm">{acc.icon}</span>
                    <span className="text-[11px] font-bold">{acc.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* TO ACCOUNT */}
            <div>
              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-full p-2 border border-slate-200 dark:border-slate-700">
                  <span className="material-symbols-outlined text-slate-400">arrow_downward</span>
                </div>
              </div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block mt-2">Ke Akun</label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {accounts.filter(acc => acc.id !== selectedAccountId).map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => setRecipientAccountId(acc.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border whitespace-nowrap transition-all ${recipientAccountId === acc.id
                      ? 'bg-blue-500 border-blue-500 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    <span className="material-symbols-outlined text-sm">{acc.icon}</span>
                    <span className="text-[11px] font-bold">{acc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // STANDARD ACCOUNT SELECTOR & CATEGORIES (FOR INCOME/EXPENSE)
          <>
            <div className="px-4 mt-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Pilih Akun Dompet</label>
              <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {accounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border whitespace-nowrap transition-all ${selectedAccountId === acc.id
                      ? 'bg-primary border-primary text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    <span className="material-symbols-outlined text-sm">{acc.icon}</span>
                    <span className="text-[11px] font-bold">{acc.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-4 mt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Kategori {type === 'Income' ? 'Pemasukan' : 'Pengeluaran'}</h3>
                <button
                  onClick={() => setIsManaging(!isManaging)}
                  className="text-primary text-[10px] font-bold"
                >
                  {isManaging ? 'Selesai' : 'Kelola'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filteredCategories.map(cat => (
                  <div key={cat.id} className="relative group">
                    <button
                      onClick={() => !isManaging && setCategory(cat.id)}
                      className={`w-full flex items-center gap-2 p-3 rounded-xl border transition-all duration-200 ${category === cat.id
                        ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
                        : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        } ${isManaging ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                    >
                      <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${category === cat.id ? 'bg-white/20' : 'bg-slate-50 dark:bg-slate-700'}`}>
                        <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                      </div>
                      <span className="text-[11px] font-bold truncate">{cat.name}</span>
                    </button>
                    {isManaging && (
                      <button
                        onClick={() => onDeleteCategory(cat.id)}
                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full size-5 flex items-center justify-center shadow-lg active:scale-90"
                      >
                        <span className="material-symbols-outlined text-[10px]">close</span>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setIsCreatingCategory(true)}
                  className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 hover:text-primary transition-colors"
                >
                  <div className="size-8 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-800 shrink-0">
                    <span className="material-symbols-outlined text-lg">add</span>
                  </div>
                  <span className="text-[11px] font-bold">Kustom {type === 'Income' ? 'Income' : 'Exp'}</span>
                </button>
              </div>
            </div>
          </>
        )}

        <div className="px-4 mt-6 space-y-3 pb-8">
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <span className="material-symbols-outlined text-slate-400 mr-3">calendar_today</span>
            <div className="flex-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Tanggal</p>
              <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
                {new Date(initialData?.date || Date.now()).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700">
            <span className="material-symbols-outlined text-slate-400 mr-3">notes</span>
            <div className="flex-1">
              <p className="text-[10px] text-slate-400 uppercase font-bold">Catatan</p>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-bold placeholder:text-slate-300 text-slate-800 dark:text-slate-200"
                placeholder={type === 'Transfer' ? 'Keterangan transfer...' : 'Untuk apa transaksi ini?'}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-t-3xl border-t border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'backspace'].map(key => (
            <button
              key={key}
              onClick={() => handleKeyPress(key)}
              className="h-14 bg-white dark:bg-slate-800 rounded-xl text-lg font-bold shadow-sm active:bg-slate-200 dark:active:bg-slate-700 transition-colors flex items-center justify-center text-slate-800 dark:text-slate-200"
            >
              {key === 'backspace' ? <span className="material-symbols-outlined">backspace</span> : key}
            </button>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={parseFloat(amount) === 0}
          className={`w-full disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${type === 'Income' ? 'bg-emerald-500 shadow-emerald-500/30' : (type === 'Transfer' ? 'bg-blue-500 shadow-blue-500/30' : 'bg-primary shadow-primary/30')}`}
        >
          <span>{initialData ? 'Perbarui Transaksi' : (type === 'Transfer' ? 'Kirim Transfer' : 'Simpan Transaksi')}</span>
          <span className="material-symbols-outlined">{initialData ? 'edit_square' : 'check_circle'}</span>
        </button>
      </div>
    </div>
  );
};

export default AddTransaction;
