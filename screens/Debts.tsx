import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { DebtItem, DebtType, Account } from '../types';

interface DebtsProps {
  debts: DebtItem[];
  accounts: Account[];
  onAddDebt: (debt: Omit<DebtItem, 'id'>) => void;
  onPayDebt: (id: string, amount: number, accountId: string) => void;
  onDeleteDebt: (id: string) => void;
}

const Debts: React.FC<DebtsProps> = ({ debts, accounts, onAddDebt, onPayDebt, onDeleteDebt }) => {
  const [activeTab, setActiveTab] = useState<DebtType>('Hutang');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtItem | null>(null);

  // Form
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [note, setNote] = useState('');

  // Delete State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Payment
  const [payAmount, setPayAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  /* History State */
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyDebt, setHistoryDebt] = useState<DebtItem | null>(null);

  // Success Modal State
  const [isPaymentSuccessOpen, setIsPaymentSuccessOpen] = useState(false);
  const [lastTransactionDetails, setLastTransactionDetails] = useState<{
    originalDebt: DebtItem;
    amountPaid: number;
    newRemaining: number;
    messageType: 'payment_confirmation' | 'payment_received';
    date: string;
  } | null>(null);

  // Favorites
  const favorites = useLiveQuery(() => db.contacts.where('isFavorite').equals(1).toArray());

  // Contact Picker
  const handlePickContact = async () => {
    try {
      if ('contacts' in navigator && 'ContactsManager' in window) {
        const props = ['name', 'tel'];
        const opts = { multiple: false };

        // TypeScript workaround for experimental API
        const contacts = await (navigator as any).contacts.select(props, opts);

        if (contacts.length) {
          const contact = contacts[0];
          if (contact.name && contact.name.length) setName(contact.name[0]);
          if (contact.tel && contact.tel.length) {
            // Clean phone number
            let tel = contact.tel[0].replace(/\D/g, '');
            if (tel.startsWith('62')) tel = '0' + tel.substring(2);
            setPhoneNumber(tel);
          }
        }
      } else {
        alert('Fitur Pilih Kontak tidak didukung di perangkat ini.');
      }
    } catch (e) {
      console.error(e);
      // alert('Gagal mengambil kontak'); // Silent fail or user cancelled
    }
  };

  const toggleFavorite = async (contactName: string, contactPhone: string) => {
    if (!contactName) return;

    try {
      const existing = await db.contacts.where({ name: contactName, phoneNumber: contactPhone }).first();
      if (existing) {
        await db.contacts.delete(existing.id);
      } else {
        await db.contacts.add({
          id: Math.random().toString(36).substr(2, 9),
          userId: 'local', // Or current user ID if available in context, but using local is fine for offline-first personal device logic if we don't strict sync favorites yet. 
          // Ideally we use currentUser.id but DebtsProps doesn't have it explicitly passed. 
          // We can just rely on 'local' or pass user. 
          // For now let's use a placeholder compatible with SyncService if we ever sync it.
          name: contactName,
          phoneNumber: contactPhone,
          isFavorite: true
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleSave = () => {
    if (!name || !amount) return;
    onAddDebt({
      contactName: name,
      amount: parseFloat(amount),
      remainingAmount: parseFloat(amount),
      paid: 0,
      type: activeTab,
      dueDate: dueDate,
      startDate: dueDate, // reuse for simplicity
      note,
      phoneNumber
    });
    setIsModalOpen(false);
    resetForm();
  };

  const handlePay = () => {
    if (!selectedDebt || !selectedAccount) return;
    const val = parseFloat(payAmount);
    if (!val || isNaN(val)) return;

    // 1. Execute DB Update
    onPayDebt(selectedDebt.id, val, selectedAccount);

    // 2. Prepare Success Modal Data
    const messageType = activeTab === 'Hutang' ? 'payment_confirmation' : 'payment_received';
    const startRem = selectedDebt.remainingAmount || 0;
    const newRem = Math.max(0, startRem - val);

    setLastTransactionDetails({
      originalDebt: selectedDebt,
      amountPaid: val,
      newRemaining: newRem,
      messageType,
      date: new Date().toISOString()
    });

    // 3. Switch Modals
    setIsPaymentModalOpen(false);
    setIsPaymentSuccessOpen(true);
    setSelectedDebt(null);
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDeleteDebt(itemToDelete);
      setIsDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const resetForm = () => {
    setName(''); setAmount(''); setNote(''); setPhoneNumber('');
  };

  const sendWhatsApp = (debt: DebtItem, type: 'reminder' | 'payment_confirmation' | 'payment_received', amountPaid?: number, specificDate?: string) => {
    if (!debt.phoneNumber) {
      alert('Nomor telepon tidak tersedia untuk kontak ini.');
      return;
    }

    let message = '';
    const date = new Date(debt.dueDate).toLocaleDateString();

    if (type === 'reminder') {
      // Nagih Piutang (Receivable)
      message = `Halo ${debt.contactName}, sekadar mengingatkan mengenai pinjaman sebesar ${formatCurrency(debt.remainingAmount)} yang jatuh tempo pada tanggal ${date}. Mohon segera dikonfirmasi ya. Terima kasih.`;
    } else if (type === 'payment_confirmation') {
      // Konfirmasi Bayar Hutang (Payable)
      const transferAmount = amountPaid || 0;
      const remaining = Math.max(0, (debt.remainingAmount || 0) - transferAmount); // Approximation if sending from history

      const dateStr = specificDate ? ` pada tanggal ${formatDate(specificDate)}` : '';

      // If from history, we don't know the exact remaining at that point without more logic, 
      // but usually we just want to say "I paid X". 
      // User said: "jumlah bayar sesuai dengan nominal yang di inputkan dan sisa hutang."
      // If sharing from history, 'remainingAmount' current state is the best valid "Sisa Hutang Saat Ini".

      message = `Halo ${debt.contactName}, saya telah mentransfer pembayaran cicilan/hutang sebesar ${formatCurrency(transferAmount)}${dateStr}. Sisa hutang saya saat ini adalah ${formatCurrency(debt.remainingAmount)}. Mohon dicek ya. Terima kasih.`;

    } else if (type === 'payment_received') {
      // Konfirmasi Terima Piutang (Receivable)
      const receivedAmount = amountPaid || 0;
      const dateStr = specificDate ? ` pada tanggal ${formatDate(specificDate)}` : '';
      message = `Halo ${debt.contactName}, pembayaran cicilan/hutang sebesar ${formatCurrency(receivedAmount)}${dateStr} telah saya terima. Sisa hutang Anda saat ini adalah ${formatCurrency(debt.remainingAmount)}. Terima kasih.`;
    }

    const url = `https://wa.me/${debt.phoneNumber.replace(/^0/, '62').replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const totalOutstanding = useMemo(() =>
    debts.filter(d => d.type === activeTab).reduce((sum, d) => sum + (d.remainingAmount || 0), 0),
    [debts, activeTab]
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display relative">
      <header className="p-4 bg-white dark:bg-slate-900 sticky top-0 z-20 border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <h2 className="text-lg font-bold">Hutang & Piutang</h2>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6 pb-32">
        {/* SUMMARY */}
        <div className={`rounded-[32px] p-8 shadow-2xl relative overflow-hidden text-white border border-white/5 transition-colors duration-500 ${activeTab === 'Hutang' ? 'bg-rose-900/90' : 'bg-emerald-900/90'}`}>
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[140px]">{activeTab === 'Hutang' ? 'money_off' : 'attach_money'}</span>
          </div>
          <div className="relative z-10">
            <p className="text-white/60 text-xs font-medium mb-1">Total {activeTab}</p>
            <h1 className="text-2xl font-bold tracking-tight mb-6">{formatCurrency(totalOutstanding)}</h1>
            <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">{debts.filter(d => d.type === activeTab).length} Item Aktif</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-200 dark:bg-slate-800/50 p-1 rounded-2xl">
          <button onClick={() => setActiveTab('Hutang')} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${activeTab === 'Hutang' ? 'bg-white dark:bg-slate-700 text-rose-500 shadow-sm' : 'text-slate-500'}`}>Hutang Saya</button>
          <button onClick={() => setActiveTab('Piutang')} className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${activeTab === 'Piutang' ? 'bg-white dark:bg-slate-700 text-emerald-500 shadow-sm' : 'text-slate-500'}`}>Piutang</button>
        </div>

        {/* LIST */}
        <div className="space-y-4">
          {debts.filter(d => d.type === activeTab).map(debt => (
            <div key={debt.id} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm relative group">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-sm dark:text-white flex items-center gap-2">
                    {debt.contactName}
                    {debt.phoneNumber && <span className="material-symbols-outlined text-[10px] text-green-500">check_circle</span>}
                  </h3>
                </div>
                <div className="text-right">
                  {debt.remainingAmount <= 0 ? (
                    <p className="text-sm font-bold text-blue-500">LUNAS</p>
                  ) : (
                    <p className={`text-sm font-bold ${activeTab === 'Hutang' ? 'text-rose-500' : 'text-emerald-500'}`}>{formatCurrency(debt.remainingAmount)}</p>
                  )}
                  <p className="text-[10px] text-slate-400">Total {formatCurrency(debt.amount)}</p>
                </div>
              </div>

              {/* Progress Bar Removed */}

              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedDebt(debt); setPayAmount(debt.remainingAmount.toString()); setSelectedAccount(accounts[0]?.id || ''); setIsPaymentModalOpen(true); }}
                  disabled={debt.remainingAmount <= 0}
                  className={`flex-1 py-2 rounded-xl text-white text-xs font-bold shadow-lg transition-all ${debt.remainingAmount <= 0 ? 'bg-slate-300 dark:bg-slate-700 shadow-none cursor-not-allowed' : 'bg-slate-900 dark:bg-slate-800 shadow-slate-900/20 active:scale-[0.98]'}`}
                >
                  {debt.remainingAmount <= 0 ? 'Lunas' : (activeTab === 'Hutang' ? 'Bayar Hutang' : 'Konfirmasi Pelunasan')}
                </button>

                {/* HISTORY BUTTON */}
                <button
                  onClick={() => { setHistoryDebt(debt); setIsHistoryModalOpen(true); }}
                  className="size-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 transition-colors"
                  title="Riwayat Pembayaran"
                >
                  <span className="material-symbols-outlined text-lg">history</span>
                </button>

                {/* WHATSAPP REMINDER (Only for Piutang / Receivables) - Nagih */}
                {activeTab === 'Piutang' && (
                  <button
                    onClick={() => sendWhatsApp(debt, 'reminder')}
                    className="size-9 flex items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:hover:bg-green-500/20 transition-colors"
                    title="Kirim Tagihan WA"
                  >
                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={() => handleDeleteClick(debt.id)}
                  className="size-9 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HISTORY MODAL */}
      {isHistoryModalOpen && historyDebt && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 pb-28">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Riwayat Pembayaran</h3>
              <button onClick={() => setIsHistoryModalOpen(false)} className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
              {!historyDebt.history || historyDebt.history.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <span className="material-symbols-outlined text-3xl mb-2 opacity-50">receipt_long</span>
                  <p className="text-xs">Belum ada riwayat pembayaran</p>
                </div>
              ) : (
                historyDebt.history.map(h => (
                  <div key={h.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{formatCurrency(h.amount)}</p>
                      <p className="text-[10px] text-slate-400">{formatDate(h.date)}</p>
                    </div>

                    {/* Share History Item to WA */}
                    {historyDebt.phoneNumber && (
                      <button
                        onClick={() => sendWhatsApp(
                          historyDebt,
                          historyDebt.type === 'Hutang' ? 'payment_confirmation' : 'payment_received',
                          h.amount,
                          h.date
                        )}
                        className="size-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 active:scale-95 transition-all"
                      >
                        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <h3 className="text-lg font-bold mb-4">Tambah {activeTab}</h3>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar pr-1">
              {/* Contact Input Section */}
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Nama Kontak</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nama Kontak" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold" />
                  </div>
                  <button
                    onClick={handlePickContact}
                    className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center active:scale-95 transition-all"
                    title="Pilih Kontak dari HP"
                  >
                    <span className="material-symbols-outlined">contacts</span>
                  </button>
                </div>

                {/* Favorites List */}
                {favorites && favorites.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {favorites.map(fav => (
                      <button
                        key={fav.id}
                        onClick={() => { setName(fav.name); setPhoneNumber(fav.phoneNumber); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 hover:border-primary transition-colors text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap"
                      >
                        <span className="material-symbols-outlined text-[14px]">star</span>
                        {fav.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Nomor HP (WA)</label>
                <div className="relative">
                  <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="08xxx (Wajib untuk fitur WA)" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold" />
                  {/* Save Favorite Toggle */}
                  {name && phoneNumber && (
                    <button
                      onClick={() => toggleFavorite(name, phoneNumber)}
                      className={`absolute right-3 top-3 text-slate-300 hover:text-amber-400 transition-colors ${favorites?.some(f => f.name === name && f.phoneNumber === phoneNumber) ? 'text-amber-400' : ''}`}
                      title="Simpan ke Favorit"
                    >
                      <span className={`material-symbols-outlined ${favorites?.some(f => f.name === name && f.phoneNumber === phoneNumber) ? 'filled' : ''}`}>
                        {favorites?.some(f => f.name === name && f.phoneNumber === phoneNumber) ? 'star' : 'star_border'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Jumlah (Rp)" className="w-full h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 text-sm font-bold" />
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Catatan" className="w-full h-20 bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold resize-none" />

              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs text-slate-500">Batal</button>
                <button onClick={handleSave} className="flex-1 h-12 bg-primary rounded-xl font-bold text-xs text-white">Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isPaymentModalOpen && selectedDebt && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 pb-28">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-1">
              {activeTab === 'Hutang' ? 'Bayar Hutang' : 'Konfirmasi Pelunasan'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {selectedDebt.contactName} - Sisa {formatCurrency(selectedDebt.remainingAmount)}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Nominal Pembayaran</label>
                <div className="relative">
                  <input
                    type="number"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    className="w-full h-14 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-xl font-bold text-primary"
                    placeholder="0"
                  />
                  <button
                    onClick={() => setPayAmount(selectedDebt.remainingAmount.toString())}
                    className="absolute right-2 top-2 bottom-2 px-3 bg-white dark:bg-slate-700/50 rounded-xl text-[10px] font-bold text-primary shadow-sm hover:bg-slate-50"
                  >
                    Lunas
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">
                  {activeTab === 'Hutang' ? 'Sumber Dana' : 'Masuk ke Akun'}
                </label>
                <div className="space-y-3 max-h-[200px] overflow-y-auto no-scrollbar">
                  {accounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => setSelectedAccount(acc.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${selectedAccount === acc.id
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
                      {selectedAccount === acc.id && <span className="material-symbols-outlined text-base">check_circle</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setIsPaymentModalOpen(false)} className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-sm">Batal</button>
                <button onClick={handlePay} className="flex-1 h-14 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20">Bayar & Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {isPaymentSuccessOpen && lastTransactionDetails && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-6 pb-28">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center relative overflow-hidden">
            {/* Decor */}
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>

            <div className="size-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>

            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Pembayaran Berhasil!</h3>
            <p className="text-xs text-slate-400 mb-6 px-4">
              Transaksi sebesar <strong className="text-emerald-500">{formatCurrency(lastTransactionDetails.amountPaid)}</strong> berhasil disimpan.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-8 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sisa {activeTab}</p>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                {formatCurrency(lastTransactionDetails.newRemaining)}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {lastTransactionDetails.originalDebt.phoneNumber && (
                <button
                  onClick={() => {
                    // Construct updated debt object for the message generator
                    const updatedDebt = {
                      ...lastTransactionDetails.originalDebt,
                      remainingAmount: lastTransactionDetails.newRemaining
                    };
                    sendWhatsApp(
                      updatedDebt,
                      lastTransactionDetails.messageType,
                      lastTransactionDetails.amountPaid,
                      lastTransactionDetails.date
                    );
                    setIsPaymentSuccessOpen(false);
                  }}
                  className="w-full h-14 rounded-2xl bg-green-500 text-white font-bold text-sm shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
                >
                  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WA" className="w-5 h-5 brightness-0 invert" />
                  Kirim Bukti WA
                </button>
              )}
              <button
                onClick={() => setIsPaymentSuccessOpen(false)}
                className="w-full h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )
      }

      {/* Delete Confirmation Modal */}
      {
        isDeleteConfirmOpen && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-6 pb-28">
            <div className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
              <div className="size-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Hapus Item ini?</h3>
              <p className="text-xs text-slate-400 mb-8 px-2">Data yang sudah dihapus tidak dapat dikembalikan. Pastikan transaksi ini sudah selesai.</p>

              <div className="flex flex-col gap-3">
                <button onClick={confirmDelete} className="w-full h-14 rounded-2xl bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-500/20">Ya, Hapus Sekarang</button>
                <button onClick={() => setIsDeleteConfirmOpen(false)} className="w-full h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-sm">Kembali</button>
              </div>
            </div>
          </div>
        )
      }

      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-24 right-6 size-14 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-40">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </div >
  );
};
export default Debts;
