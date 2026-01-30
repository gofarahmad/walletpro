
import React, { useState } from 'react';
import { Account } from '../types';

interface WalletsProps {
  accounts: Account[];
  totalBalance: number;
  onAddAccount: (account: Omit<Account, 'id'>) => void;
  onUpdateAccount: (account: Account) => void;
  onTransfer: (from: string, to: string, amount: number) => Promise<void> | void;
}

const Wallets: React.FC<WalletsProps> = ({ accounts, totalBalance, onAddAccount, onUpdateAccount, onTransfer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Add Account Logic
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState<'Bank' | 'Wallet' | 'Cash'>('Bank');
  const [accNum, setAccNum] = useState('');
  const [holder, setHolder] = useState('');
  const [phone, setPhone] = useState('');

  // Transfer Logic
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setName('');
    setBalance('');
    setType('Bank');
    setAccNum('');
    setHolder('');
    setPhone('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setBalance(acc.balance.toString());
    setType(acc.type);
    setAccNum(acc.accountNumber || '');
    setHolder(acc.accountHolder || '');
    setPhone(acc.phoneNumber || '');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const numBalance = parseFloat(balance);
    if (!name || isNaN(numBalance)) return;

    const accountData = {
      name,
      balance: numBalance,
      type,
      accountNumber: type === 'Bank' ? accNum : undefined,
      accountHolder: type !== 'Cash' ? holder : undefined,
      phoneNumber: type === 'Wallet' ? phone : undefined,
      icon: type === 'Bank' ? 'account_balance' : (type === 'Wallet' ? 'contactless' : 'payments')
    };

    if (editingAccount) {
      onUpdateAccount({ ...accountData, id: editingAccount.id });
    } else {
      onAddAccount(accountData);
    }

    setIsModalOpen(false);
  };

  const handleExecuteTransfer = async () => {
    const amount = parseFloat(transferAmount);
    if (!fromAccount || !toAccount || !amount || fromAccount === toAccount) return;

    // Validate balance
    const sourceAcc = accounts.find(a => a.id === fromAccount);
    if (sourceAcc && sourceAcc.balance < amount) {
      alert('Saldo tidak mencukupi!');
      return;
    }

    try {
      await onTransfer(fromAccount, toAccount, amount);
      setIsTransferModalOpen(false);
      setTransferAmount('');
      setFromAccount('');
      setToAccount('');
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Gagal melakukan transfer. Silakan coba lagi.');
    }
  };

  const copyToClipboard = (acc: Account) => {
    const info = [
      `Bank/E-Wallet: ${acc.name}`,
      acc.accountNumber ? `No. Rek: ${acc.accountNumber}` : null,
      acc.phoneNumber ? `No. HP: ${acc.phoneNumber}` : null,
      acc.accountHolder ? `A/N: ${acc.accountHolder}` : null
    ].filter(Boolean).join('\n');

    if (info) {
      navigator.clipboard.writeText(info);
      alert('Info rekening berhasil disalin!');
    } else {
      alert('Tidak ada info untuk disalin.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 relative">
      <header className="p-4 bg-white dark:bg-slate-900 sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold">Dompet & Rekening</h2>
        <button
          onClick={() => setIsTransferModalOpen(true)}
          className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-slate-900 text-white rounded-lg shadow-lg active:scale-95 transition-all flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">swap_horiz</span>
          Transfer
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6 pb-32">
        <div className="bg-slate-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden text-white border border-white/5">
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
            <span className="material-symbols-outlined text-[140px]">wallet</span>
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 text-xs font-medium mb-1">Total Saldo Tergabung</p>
            <h1 className="text-2xl font-bold tracking-tight mb-8">{formatCurrency(totalBalance)}</h1>
            <div className="bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-xl inline-block">
              <p className="text-white text-[10px] font-bold tracking-wider uppercase">{accounts.length} Akun Aktif</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold px-2 flex justify-between items-center">
            Daftar Rekening
          </h3>
          <div className="space-y-3">
            {accounts.map(acc => (
              <div key={acc.id} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <div className="flex items-start gap-4">
                  <div className="size-11 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-2xl text-slate-400">{acc.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                          {acc.type === 'Bank' ? 'Bank' : (acc.type === 'Wallet' ? 'E-Wallet' : 'Tunai')}
                          {acc.accountNumber ? ` • ${acc.accountNumber}` : (acc.phoneNumber ? ` • ${acc.phoneNumber}` : '')}
                        </p>
                        <h3 className="font-bold text-sm dark:text-white leading-tight truncate">{acc.name}</h3>
                        {acc.accountHolder && (
                          <p className="text-[10px] text-slate-500 font-medium italic mt-0.5">A/N: {acc.accountHolder}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => handleOpenEdit(acc)}
                          className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary active:scale-90 transition-all border border-primary/20"
                          title="Edit Rekening/Saldo"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        {(acc.accountNumber || acc.phoneNumber) && (
                          <button
                            onClick={() => copyToClipboard(acc)}
                            className="size-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-all border border-slate-100 dark:border-slate-700"
                            title="Salin Info Rekening"
                          >
                            <span className="material-symbols-outlined text-lg">content_copy</span>
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-primary text-base font-bold tracking-tight mt-1">{formatCurrency(acc.balance)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 pb-28">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-6">{editingAccount ? 'Edit Rekening' : 'Tambah Rekening'}</h3>
            <div className="space-y-4 overflow-y-auto max-h-[60vh] no-scrollbar px-1">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Nama Akun / Bank</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Misal: BCA Utama" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Saldo Saat Ini</label>
                <input type="number" value={balance} onChange={e => setBalance(e.target.value)} placeholder="0" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold" />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Tipe</label>
                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-xs font-bold">
                  <option value="Bank">Bank</option>
                  <option value="Wallet">E-Wallet</option>
                  <option value="Cash">Tunai</option>
                </select>
              </div>

              {type !== 'Cash' && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
                      {type === 'Bank' ? 'No. Rekening' : 'No. HP / ID Wallet'}
                    </label>
                    <input
                      type="text"
                      value={type === 'Bank' ? accNum : phone}
                      onChange={e => type === 'Bank' ? setAccNum(e.target.value) : setPhone(e.target.value)}
                      placeholder={type === 'Bank' ? '8830123xxx' : '081234xxx'}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Atas Nama (A/N)</label>
                    <input type="text" value={holder} onChange={e => setHolder(e.target.value)} placeholder="Nama Pemilik Akun" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold" />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-900 py-2">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-sm">Batal</button>
                <button onClick={handleSave} className="flex-1 h-14 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {isTransferModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 pb-28">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-900 dark:text-white">swap_horiz</span>
              </div>
              <h3 className="text-lg font-bold">Pindah Saldo</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Dari Akun</label>
                <select
                  value={fromAccount}
                  onChange={e => setFromAccount(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-xs font-bold"
                >
                  <option value="">Pilih Asal</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center -my-2 relative z-10">
                <div className="bg-slate-200 dark:bg-slate-700 rounded-full p-1">
                  <span className="material-symbols-outlined text-slate-500 text-lg">arrow_downward</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Ke Akun</label>
                <select
                  value={toAccount}
                  onChange={e => setToAccount(e.target.value)}
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-xs font-bold"
                >
                  <option value="">Pilih Tujuan</option>
                  {accounts.filter(acc => acc.id !== fromAccount).map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Jumlah Transfer</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={e => setTransferAmount(e.target.value)}
                  placeholder="0"
                  className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsTransferModalOpen(false)}
                  className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleExecuteTransfer}
                  className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-xl"
                >
                  Transfer
                </button>
              </div>
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

export default Wallets;
