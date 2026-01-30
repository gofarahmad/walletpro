
import React, { useState } from 'react';
import { BudgetCategory } from '../types';

interface BudgetProps {
  budgets: BudgetCategory[];
  totalSpent: number;
  totalBudget: number;
  onAddBudget: (budget: Omit<BudgetCategory, 'id' | 'spent'>) => void;
  onUpdateBudget: (budget: BudgetCategory) => void;
  onDeleteBudget: (id: string) => void;
  onAddTransaction: (budget: BudgetCategory) => void;
}

const ICON_PICKER_OPTIONS = [
  'restaurant', 'directions_car', 'shopping_bag', 'home', 'medical_services',
  'payments', 'movie', 'more_horiz', 'fitness_center', 'work', 'school', 'pets',
  'flight', 'spa', 'brush', 'bolt', 'local_gas_station', 'celebration'
];

const COLOR_PICKER_OPTIONS = [
  { name: 'Blue', hex: '#136dec' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Slate', hex: '#64748b' },
];

const Budget: React.FC<BudgetProps> = ({ budgets, totalSpent, totalBudget, onAddBudget, onUpdateBudget, onDeleteBudget, onAddTransaction }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetCategory | null>(null);

  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('account_balance_wallet');
  const [selectedColor, setSelectedColor] = useState('#136dec');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const handleOpenAdd = () => {
    setEditBudget(null);
    setName('');
    setLimit('');
    setSelectedIcon('account_balance_wallet');
    setSelectedColor('#136dec');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (budget: BudgetCategory) => {
    setEditBudget(budget);
    setName(budget.name);
    setLimit(budget.limit.toString());
    setSelectedIcon(budget.icon);
    setSelectedColor(budget.color || '#136dec');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const numLimit = parseFloat(limit);
    if (!name || isNaN(numLimit)) return;

    if (editBudget) {
      onUpdateBudget({
        ...editBudget,
        name,
        limit: numLimit,
        icon: selectedIcon,
        color: selectedColor
      });
    } else {
      onAddBudget({
        name,
        limit: numLimit,
        icon: selectedIcon,
        color: selectedColor
      });
    }

    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 relative">
      <header className="p-4 bg-white dark:bg-slate-900 z-20 flex items-center border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold">Manajemen Pagu</h2>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6 pb-32">
        <div className="bg-slate-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden text-white border border-white/5">
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[140px]">pie_chart</span>
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-medium mb-1">Total Terpakai</p>
            <h1 className="text-2xl font-bold tracking-tight mb-2">{formatCurrency(totalSpent)}</h1>
            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-8">dari pagu {formatCurrency(totalBudget)}</p>

            <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>Pemakaian</span>
                <span className={percentUsed > 100 ? 'text-rose-400' : 'text-primary'}>{percentUsed.toFixed(0)}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className={`h-full transition-all duration-1000 ${percentUsed > 100 ? 'bg-rose-500' : 'bg-primary'}`} style={{ width: `${Math.min(percentUsed, 100)}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold px-2">Kategori Pagu</h3>
          <div className="space-y-3">
            {budgets.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleOpenEdit(cat)}
                className="w-full text-left bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden active:scale-[0.98] transition-all"
              >
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-slate-300 text-sm">edit</span>
                </div>
                <div className="flex items-start gap-4 mb-5">
                  <div className="size-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                    <span className="material-symbols-outlined text-2xl">{cat.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">Limit: {formatCurrency(cat.limit)}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(cat); }}
                        className="material-symbols-outlined text-slate-300 text-lg hover:text-primary transition-colors"
                      >
                        edit_square
                      </button>
                    </div>
                    <h3 className="font-bold text-sm dark:text-white leading-tight mb-1 truncate">{cat.name}</h3>
                    <div className="flex justify-between items-end">
                      <p className="text-base font-bold tracking-tight">{formatCurrency(cat.spent)}</p>
                    </div>
                  </div>
                </div>
                <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, (cat.spent / cat.limit) * 100)}%`, backgroundColor: cat.color }}></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 pb-28 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 my-auto">
            <h3 className="text-lg font-bold mb-6">{editBudget ? 'Ubah Kategori' : 'Kategori Baru'}</h3>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar pr-1">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Nama Kategori</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Misal: Belanja Bulanan" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold focus:ring-primary" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Batas Pengeluaran</label>
                <input type="number" value={limit} onChange={e => setLimit(e.target.value)} placeholder="0" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold focus:ring-primary" />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">Warna Kategori</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PICKER_OPTIONS.map(color => (
                    <button
                      key={color.hex}
                      onClick={() => setSelectedColor(color.hex)}
                      className={`size-8 rounded-full transition-all ${selectedColor === color.hex ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'opacity-60'}`}
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">Pilih Ikon</label>
                <div className="grid grid-cols-4 gap-2">
                  {ICON_PICKER_OPTIONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={`size-12 rounded-xl flex items-center justify-center transition-all ${selectedIcon === icon
                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                        }`}
                    >
                      <span className="material-symbols-outlined text-xl">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-900 py-2 mt-2">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-sm">Batal</button>
                <button onClick={handleSave} className="flex-1 h-14 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20">Simpan</button>
              </div>

              {editBudget && (
                <button
                  onClick={() => {
                    onDeleteBudget(editBudget.id);
                    setIsModalOpen(false);
                  }}
                  className="w-full h-14 mt-3 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 active:scale-95 transition-all"
                >
                  Hapus Pagu
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <button onClick={handleOpenAdd} className="absolute bottom-24 right-6 size-14 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-40">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </div>
  );
};

export default Budget;
