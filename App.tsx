import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { SyncService } from './services/sync';
// import { GoogleDriveService } from './services/google'; // Removed
// import { GoogleDriveService } from './services/google'; // Removed
import { Screen, Transaction, BudgetCategory, Account, Category, DebtItem, CreditItem, Notification, UserProfile, UserData } from './types';
import { BackupService } from '@/utils/backup.ts';
import { DEFAULT_CATEGORIES } from './mockData';
import { mapUser, mapTransaction, mapAccount, mapCategory, mapBudget, mapDebt, mapCredit, mapNotification } from './utils/mappers';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import Analysis from './screens/Analysis';
import Budget from './screens/Budget';
import Wallets from './screens/Wallets';
import Debts from './screens/Debts';
import Credits from './screens/Credits';
import AddTransaction from './screens/AddTransaction';
import Notifications from './screens/Notifications';
import Settings from './screens/Settings';
import BottomNav from './components/BottomNav';

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Mappers moved to utils/mappers.ts but we might need them for initial load if we keep fetch? 
// No, we will use SyncService for fetching.
// Removing local mappers to avoid duplication and confusion.


const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Home');
  const [loading, setLoading] = useState(true);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Session Restore
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const session = localStorage.getItem('payfin_session');
        if (session) {
          const { userId, expiry } = JSON.parse(session);
          if (Date.now() < expiry) {
            const user = await db.users.get(userId);
            if (user) {
              setCurrentUser(user);
              setLoading(false); // Enable immediate render
            }
          } else {
            localStorage.removeItem('payfin_session');
          }
        }
      } catch (e) {
        console.error('Session restore error:', e);
      } finally {
        setIsCheckingSession(false);
      }
    };
    restoreSession();
  }, []);

  // User Management State
  const users = useLiveQuery(() => db.users.toArray()) || [];
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Active User Data State - Live from Dexie
  const transactions = useLiveQuery(() =>
    currentUser ? db.transactions.where('userId').equals(currentUser.id).reverse().sortBy('date') : []
    , [currentUser?.id]) || [];

  const budgets = useLiveQuery(() =>
    currentUser ? db.budgets.where('userId').equals(currentUser.id).toArray() : []
    , [currentUser?.id]) || [];

  const accounts = useLiveQuery(() =>
    currentUser ? db.accounts.where('userId').equals(currentUser.id).toArray() : []
    , [currentUser?.id]) || [];

  const categories = useLiveQuery(() =>
    currentUser ? db.categories.where('userId').equals(currentUser.id).toArray() : []
    , [currentUser?.id]) || [];

  const debts = useLiveQuery(() =>
    currentUser ? db.debts.where('userId').equals(currentUser.id).toArray() : []
    , [currentUser?.id]) || [];

  const credits = useLiveQuery(() =>
    currentUser ? db.credits.where('userId').equals(currentUser.id).toArray() : []
    , [currentUser?.id]) || [];

  const notifications = useLiveQuery(() =>
    currentUser ? db.notifications.where('userId').equals(currentUser.id).reverse().sortBy('date') : []
    , [currentUser?.id]) || [];

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Sync Logic
  useEffect(() => {
    // Initial fetch of users from server (if online) to populate local DB
    // Or just rely on what we have. 
    // Ideally, we fetch users once.
    const syncUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/users`);
        if (res.ok) {
          const data = await res.json();
          // We need to map here because we removed local mappers, but we can just import them or inline simpler logic
          // Actually, let's just save them blindly or use a simple map if keys match?
          // The backend returns snake_case.
          const mappedUsers = data.map((u: any) => ({
            id: u.id,
            name: u.name,
            phoneNumber: u.phone_number,
            pin: u.pin || '1234',
            photoUrl: u.photo_url,
            isSaved: u.is_saved
          }));

          // Defensive Sync: Only update users that don't have pending local changes
          const safeUsersToUpdate = [];
          for (const user of mappedUsers) {
            const pendingUpdate = await db.syncQueue
              .where('endpoint')
              .equals(`/auth/users/${user.id}`)
              .count();

            if (pendingUpdate === 0) {
              safeUsersToUpdate.push(user);
            } else {
              console.log(`Skipping overwrite for user ${user.id} due to pending server sync.`);
            }
          }

          if (safeUsersToUpdate.length > 0) {
            await db.users.bulkPut(safeUsersToUpdate);
          }
        }
      } catch (e) {
        console.log('Offline: Using cached users');
      } finally {
        setLoading(false);
      }
    };
    syncUsers();

    // Listen for online status
    const handleOnline = () => {
      // Re-init client if needed or just sync
      if (currentUser) SyncService.sync(currentUser.id);
    };

    // Init Google Client REMOVED
    // GoogleDriveService.initClient().then((isSignedIn) => {
    //   if (isSignedIn && currentUser) {
    //     SyncService.sync(currentUser.id);
    //   }
    // });

    // We can keep SyncService for backend sync (REST), but remove Google part.
    // SyncService.sync(currentUser.id) calls processRestQueue.

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [currentUser]);

  // Sync when currentUser changes
  useEffect(() => {
    if (currentUser) {
      SyncService.sync(currentUser.id);
    }
  }, [currentUser]);

  // Login Handler
  const handleLogin = async (user: UserProfile) => {
    // Save session (30 days)
    localStorage.setItem('payfin_session', JSON.stringify({
      userId: user.id,
      expiry: Date.now() + 30 * 24 * 60 * 60 * 1000
    }));

    setCurrentUser(user);
    if (navigator.onLine) {
      SyncService.pullData(user.id);
    }
    setCurrentScreen('Home');
  };

  const handleRegister = async (newUser: UserProfile) => {
    try {
      // Save locally (Cache)
      await db.users.put(newUser);

      // No need to queue sync for /auth/register because registration is now direct via API in Login.tsx
      // SyncService will eventually pull updates anyway.

      handleLogin(newUser);
      // SyncService.pushChanges(); // No changes to push
    } catch (error) {
      console.error('Error saving new user:', error);
    }
  };

  const handleSaveProfile = async (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (user) {
        const updatedUser = { ...user, isSaved: true };
        await db.users.put(updatedUser);

        // Sync Queue logic removed for 'isSaved' if pure local? 
        // No, we keep server sync for user profile updates generally.
        // But Google Sync references in handleLogin/etc should be removed if any.
        // (Snippet shows handleLogin uses SyncService.pullData(user.id))
        // SyncService still uses GoogleDrive? 
        // We should probably strip Google Drive from SyncService later or just ignore it.
        // For now, let's focus on Backup handlers.

        await db.syncQueue.add({
          type: 'PUT',
          endpoint: `/auth/users/${userId}`,
          body: updatedUser,
          timestamp: Date.now()
        });

        if (currentUser && currentUser.id === userId) {
          setCurrentUser(updatedUser);
        }
        SyncService.pushChanges();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  // --- Backup Handlers ---
  const handleExportData = async () => {
    const success = await BackupService.exportData();
    if (success) {
      alert('Data berhasil diexport!');
      // Or use notification if currentUser is set
      if (currentUser) addNotification('Export Berhasil', 'Data Anda telah disimpan dalam format JSON.', 'Success');
    } else {
      alert('Gagal mengexport data.');
    }
  };

  const handleImportData = () => {
    // Create a hidden file input to trigger upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (window.confirm('Import akan menggabungkan/menimpa data saat ini. Lanjutkan?')) {
          setLoading(true);
          const result = await BackupService.importData(file);
          alert(result.message);

          if (result.success) {
            // Reload to reflect changes
            window.location.reload();
          } else {
            setLoading(false);
          }
        }
      }
    };
    input.click();
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await db.users.delete(userId);
      await db.syncQueue.add({
        type: 'DELETE',
        endpoint: `/auth/users/${userId}`,
        body: {},
        timestamp: Date.now()
      });
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('payfin_session');
    setCurrentUser(null);
    setCurrentScreen('Home');
  };

  // Stats Calculations
  const totalBalance = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);

  const monthIncome = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => t.type === 'Income' && new Date(t.date).getMonth() === now.getMonth())
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const monthExpenses = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => t.type === 'Expense' && new Date(t.date).getMonth() === now.getMonth())
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const unreadNotificationCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const addNotification = async (title: string, message: string, type: 'Info' | 'Warning' | 'Success') => {
    if (!currentUser) return;

    const newNotif: Notification = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      message,
      date: new Date().toISOString(),
      type,
      isRead: false,
      userId: currentUser.id
    };

    try {
      await db.notifications.add(newNotif);
      await db.syncQueue.add({
        type: 'POST',
        endpoint: '/notifications',
        body: newNotif,
        timestamp: Date.now()
      });
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  // Transaction Handlers
  const handleSaveTransaction = async (newTx: Omit<Transaction, 'id'>, accountId: string) => {
    if (!currentUser) return;

    const tx = { ...newTx, id: editingTransaction?.id || Math.random().toString(36).substr(2, 9), userId: currentUser.id };

    try {
      if (editingTransaction) {
        await db.transactions.put(tx);
        await db.syncQueue.add({
          type: 'PUT',
          endpoint: `/transactions/${tx.id}`,
          body: tx,
          timestamp: Date.now()
        });
      } else {
        await db.transactions.add(tx);
        await db.syncQueue.add({
          type: 'POST',
          endpoint: '/transactions',
          body: {
            id: tx.id,
            userId: currentUser.id,
            accountId,
            amount: tx.amount,
            type: tx.type,
            category: tx.category,
            note: tx.note,
            date: tx.date
          },
          timestamp: Date.now()
        });
        addNotification('Transaksi Dicatat', `${tx.type === 'Income' ? 'Pemasukan' : 'Pengeluaran'} sebesar Rp ${tx.amount.toLocaleString('id-ID')} berhasil disimpan ke dompet.`, 'Success');
      }

      // Update Budget Process
      // If the transaction category matches a budget ID, update that budget's spent amount
      const budget = budgets.find(b => b.id === tx.category);
      if (budget && tx.type === 'Expense') {
        const newSpent = (budget.spent || 0) + tx.amount;
        await db.budgets.update(budget.id, { spent: newSpent });

        // Sync Budget Update
        await db.syncQueue.add({
          type: 'PUT',
          endpoint: `/budgets/${budget.id}`,
          body: { ...budget, spent: newSpent },
          timestamp: Date.now()
        });
      }

      // Sync changes
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }

    setEditingTransaction(null);
    setCurrentScreen('Home');
  };



  const handlePayDebt = async (debtId: string, amount: number, accountId: string) => {
    if (!currentUser) return;

    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;

    try {
      // Optimistic Update Local DB
      const updatedPaid = (debt.paid || 0) + amount;
      const updatedRemaining = (debt.remainingAmount || 0) - amount;
      const updatedDebt = {
        ...debt,
        paid: updatedPaid,
        remainingAmount: updatedRemaining < 0 ? 0 : updatedRemaining, // Prevent negative
        lastPaymentDate: new Date().toISOString()
      };

      await db.debts.put(updatedDebt);

      // Add history
      const historyId = Math.random().toString(36).substr(2, 9);
      const newHistoryItem = {
        id: historyId,
        amount: amount,
        date: new Date().toISOString(),
        note: 'Payment'
      };

      // Ensure history array exists
      const currentHistory = debt.history || [];
      updatedDebt.history = [newHistoryItem, ...currentHistory];

      await db.debts.put(updatedDebt);

      // Update Account Balance
      const account = accounts.find(a => a.id === accountId);
      if (account) {
        const newBalance = debt.type === 'Piutang' ? account.balance + amount : account.balance - amount;
        await db.accounts.update(accountId, { balance: newBalance });
      }

      // Queue sync handles the complex backend logic.

      await db.syncQueue.add({
        type: 'POST',
        endpoint: `/debts/${debtId}/pay`,
        body: { amount, accountId },
        timestamp: Date.now()
      });

      SyncService.pushChanges();
      addNotification('Hutang Terupdate', `Berhasil mencatat transaksi sebesar Rp ${amount.toLocaleString('id-ID')}.`, 'Info');
    } catch (error) {
      console.error('Error paying debt:', error);
    }
  };

  const handleUpdateAccount = async (updatedAccount: Account) => {
    if (!currentUser) return;

    try {
      await db.accounts.put(updatedAccount);
      await db.syncQueue.add({
        type: 'PUT',
        endpoint: `/accounts/${updatedAccount.id}`,
        body: updatedAccount,
        timestamp: Date.now()
      });
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error updating account:', error);
    }
  };

  const handleAddAccount = async (newAccount: Omit<Account, 'id'>) => {
    if (!currentUser) return;

    const account = { ...newAccount, id: Math.random().toString(36).substr(2, 9), userId: currentUser.id };

    try {
      await db.accounts.add(account);
      await db.syncQueue.add({
        type: 'POST',
        endpoint: '/accounts',
        body: {
          id: account.id,
          userId: currentUser.id,
          name: account.name,
          balance: account.balance,
          icon: account.icon,
          type: account.type,
          accountNumber: account.accountNumber,
          phoneNumber: account.phoneNumber,
          accountHolder: account.accountHolder
        },
        timestamp: Date.now()
      });
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error adding account:', error);
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    try {
      await db.debts.delete(debtId);
      await db.syncQueue.add({
        type: 'DELETE',
        endpoint: `/debts/${debtId}`,
        body: {},
        timestamp: Date.now()
      });
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error deleting debt:', error);
    }
  };

  const handleAddBudget = async (newBudget: Omit<BudgetCategory, 'id' | 'spent'>) => {
    if (!currentUser) return;

    const budget = { ...newBudget, id: Math.random().toString(36).substr(2, 9), spent: 0, userId: currentUser.id };

    try {
      await db.budgets.add(budget);
      await db.syncQueue.add({
        type: 'POST',
        endpoint: '/budgets',
        body: {
          id: budget.id,
          userId: currentUser.id,
          category: budget.name,
          limitAmount: budget.limit,
          icon: budget.icon,
          color: budget.color
        },
        timestamp: Date.now()
      });
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error adding budget:', error);
    }
  };

  const handleUpdateBudget = async (updatedBudget: BudgetCategory) => {
    if (!currentUser) return;

    try {
      await db.budgets.put(updatedBudget);
      await db.syncQueue.add({
        type: 'PUT',
        endpoint: `/budgets/${updatedBudget.id}`,
        body: {
          category: updatedBudget.name,
          limitAmount: updatedBudget.limit,
          spent: updatedBudget.spent,
          icon: updatedBudget.icon,
          color: updatedBudget.color
        },
        timestamp: Date.now()
      });
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      await db.budgets.delete(budgetId);
      await db.syncQueue.add({
        type: 'DELETE',
        endpoint: `/budgets/${budgetId}`,
        body: {},
        timestamp: Date.now()
      });
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  const handleAddDebt = async (newDebt: Omit<DebtItem, 'id'>) => {
    if (!currentUser) return;

    try {
      const id = Math.random().toString(36).substr(2, 9);
      const debt = {
        id,
        userId: currentUser.id,
        contactName: newDebt.contactName, // mapDebt uses contactName, DB uses name? mappers.ts maps from name to contactName.
        // We need to store in DB what mappers expects or reverse?
        // Dexie stores 'DebtItem' which has 'contactName'.
        // Wait, syncing needs backend format.
        // SyncService pulls and maps to DebtItem.
        // So Dexie stores DebtItem.
        // App should write DebtItem to Dexie.
        ...newDebt,
        paid: 0,
        remainingAmount: newDebt.amount, // Initial logic
        lastPaymentDate: undefined,
        history: []
      };

      await db.debts.add(debt);

      await db.syncQueue.add({
        type: 'POST',
        endpoint: '/debts',
        body: {
          id,
          userId: currentUser.id,
          name: newDebt.contactName,
          amount: newDebt.amount,
          paid: 0,
          due_date: newDebt.dueDate, // Backend expects snake_case for some fields?
          // Let's check backend... debts.js uses camelCase in body destructuring: 'dueDate'
          // debts.js: const { id, userId, name, amount, paid, dueDate... } = req.body;
          // OK, backend accepts camelCase.
          dueDate: newDebt.dueDate,
          phoneNumber: newDebt.phoneNumber,
          type: newDebt.type,
          interestRate: newDebt.interestRate,
          interestType: newDebt.interestType,
          startDate: newDebt.startDate,
          durationMonths: newDebt.durationMonths,
          holdAmount: newDebt.holdAmount,
          note: newDebt.note
        },
        timestamp: Date.now()
      });

      addNotification('Kontrak Baru', `Berhasil menambahkan cicilan baru atas nama ${newDebt.contactName}.`, 'Success');
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error adding debt:', error);
    }
  };

  const handleTransfer = async (fromAccountId: string, toAccountId: string, amount: number) => {
    if (!currentUser) return;

    try {
      // Optimistic Updates
      const fromAcc = accounts.find(a => a.id === fromAccountId);
      const toAcc = accounts.find(a => a.id === toAccountId);

      // Dexie update
      if (fromAcc) await db.accounts.update(fromAccountId, { balance: fromAcc.balance - amount });
      if (toAcc) await db.accounts.update(toAccountId, { balance: toAcc.balance + amount });

      // Transaction Record
      const transactionId = Math.random().toString(36).substr(2, 9);
      // We don't have a direct 'Transfer' type in Transaction interface shown in snippet, but usually it generates one or two transactions?
      // Backend 'transfer' endpoint handles it.
      // We should queue the transfer action.

      await db.syncQueue.add({
        type: 'POST',
        endpoint: '/accounts/transfer',
        body: {
          fromId: fromAccountId,
          toId: toAccountId,
          amount,
          userId: currentUser.id,
          transactionId
        },
        timestamp: Date.now()
      });

      addNotification('Transfer Berhasil', `Berhasil memindahkan saldo sebesar Rp ${amount.toLocaleString('id-ID')}.`, 'Success');
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error during transfer:', error);
      throw error;
    }
  };

  // --- Credits Handlers ---
  const handleAddCredit = async (newCredit: Omit<CreditItem, 'id' | 'isPaidThisMonth'>) => {
    if (!currentUser) return;
    try {
      const id = Math.random().toString(36).substr(2, 9);
      const credit = {
        id,
        userId: currentUser.id,
        ...newCredit,
        isPaidThisMonth: false,
        remainingTenor: newCredit.remainingTenor
      };

      await db.credits.add(credit);
      await db.syncQueue.add({
        type: 'POST',
        endpoint: '/credits',
        body: {
          id,
          userId: currentUser.id,
          name: newCredit.name,
          amount: newCredit.monthlyPayment,
          dueDate: newCredit.dueDate,
          type: newCredit.type,
          totalLoanAmount: newCredit.totalAmount,
          interestRate: newCredit.interestRate,
          interestType: newCredit.interestType,
          durationMonths: newCredit.totalTenor,
          startDate: newCredit.startDate,
          holdAmount: newCredit.holdAmount,
          adminFee: newCredit.adminFee,
          remainingTenor: newCredit.remainingTenor
        },
        timestamp: Date.now()
      });

      addNotification('Tagihan Baru', `Berhasil menambahkan tagihan ${newCredit.name}.`, 'Success');
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error adding credit:', error);
    }
  };

  const handlePayCredit = async (creditId: string, accountId: string) => {
    try {
      // Optimistic update
      const credit = credits.find(c => c.id === creditId);
      if (credit) await db.credits.update(creditId, { isPaidThisMonth: true });

      const account = accounts.find(a => a.id === accountId);
      // Wait, snippet didn't deduct balance locally? Backend does.
      // We should deduct locally.
      if (account && credit) {
        await db.accounts.update(accountId, { balance: account.balance - credit.monthlyPayment });
      }

      await db.syncQueue.add({
        type: 'POST',
        endpoint: `/credits/${creditId}/pay`,
        body: { accountId },
        timestamp: Date.now()
      });

      addNotification('Pembayaran Berhasil', 'Tagihan berhasil dibayar.', 'Success');
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error paying credit:', error);
    }
  };

  const handleDeleteCredit = async (creditId: string) => {
    try {
      await db.credits.delete(creditId);
      await db.syncQueue.add({
        type: 'DELETE',
        endpoint: `/credits/${creditId}`,
        body: {},
        timestamp: Date.now()
      });
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error deleting credit:', error);
    }
  };


  const handleMarkAsRead = async (id: string) => {
    if (!currentUser) return;
    try {
      await db.notifications.update(id, { isRead: true });
      await db.syncQueue.add({
        type: 'PUT',
        endpoint: `/notifications/${id}/read`,
        body: {},
        timestamp: Date.now()
      });
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    try {
      await db.notifications.where('userId').equals(currentUser.id).modify({ isRead: true });
      await db.syncQueue.add({
        type: 'PUT',
        endpoint: `/notifications/read-all/${currentUser.id}`,
        body: {},
        timestamp: Date.now()
      });
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await db.notifications.delete(id);
      await db.syncQueue.add({
        type: 'DELETE',
        endpoint: `/notifications/${id}`,
        body: {},
        timestamp: Date.now()
      });
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAllReadNotifications = async () => {
    if (!currentUser) return;

    const hasRead = notifications.some(n => n.isRead);
    if (!hasRead) {
      alert('Tidak ada notifikasi yang sudah dibaca.');
      return;
    }

    if (window.confirm('Hapus semua notifikasi yang sudah dibaca?')) {
      try {
        await db.notifications.where('userId').equals(currentUser.id).filter(n => n.isRead).delete();
        await db.syncQueue.add({
          type: 'DELETE',
          endpoint: `/notifications/clear-read/${currentUser.id}`,
          body: {},
          timestamp: Date.now()
        });
        SyncService.pushChanges();
      } catch (error) {
        console.error('Error clearing read notifications:', error);
      }
    }
  };

  const handleAddCategory = async (newCategory: Category) => {
    if (!currentUser) return;
    try {
      // Ensure userId is attached
      const categoryWithUser = { ...newCategory, userId: currentUser.id };
      await db.categories.put(categoryWithUser);

      // ideally sync
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await db.categories.delete(categoryId);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleUpdateUser = async (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    try {
      await db.users.put(updatedUser);
      await db.syncQueue.add({
        type: 'PUT',
        endpoint: `/auth/users/${updatedUser.id}`,
        body: updatedUser,
        timestamp: Date.now()
      });
      SyncService.pushChanges();
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleAddTransactionFromBudget = (budget: BudgetCategory) => {
    setEditingTransaction({
      id: '', // New tx
      amount: 0,
      type: 'Expense',
      category: budget.id, // Pre-fill category with Budget ID
      date: new Date().toISOString(),
      note: ''
    });
    setCurrentScreen('AddTransaction');
  };

  // Render Screen
  const renderScreen = () => {
    if (loading || isCheckingSession) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-400">Memuat...</p>
          </div>
        </div>
      );
    }

    if (!currentUser) {
      const savedUsers = users.filter(u => u.isSaved);
      return (
        <Login
          users={savedUsers}
          onLoginSuccess={handleLogin}
          onRegister={handleRegister}
          onDeleteUser={handleDeleteUser}
          onSaveProfile={handleSaveProfile}
          onImport={handleImportData}
        />
      );
    }

    switch (currentScreen) {
      case 'Home':
        return (
          <Dashboard
            user={currentUser}
            totalBalance={totalBalance}
            income={monthIncome}
            expenses={monthExpenses}
            transactions={transactions}
            categories={categories}
            budgets={budgets} // Pass budgets for lookup
            unreadNotifCount={unreadNotificationCount}
            onAdd={() => { setEditingTransaction(null); setCurrentScreen('AddTransaction'); }}
            onEdit={(tx) => { setEditingTransaction(tx); setCurrentScreen('AddTransaction'); }}
            onOpenNotifications={() => setCurrentScreen('Notifications')}
            onOpenSettings={() => setCurrentScreen('Settings')}
            onSeeAll={() => setCurrentScreen('Stats')}
          />
        );
      case 'Stats':
        return (
          <Analysis
            transactions={transactions}
            credits={credits}
            debts={debts}
            categories={categories}
            budgets={budgets}
            onEdit={(tx) => { setEditingTransaction(tx); setCurrentScreen('AddTransaction'); }}
          />
        );
      case 'Budget':
        return <Budget budgets={budgets} totalSpent={monthExpenses} totalBudget={budgets.reduce((s, b) => s + b.limit, 0)} onAddBudget={handleAddBudget} onUpdateBudget={handleUpdateBudget} onDeleteBudget={handleDeleteBudget} onAddTransaction={handleAddTransactionFromBudget} />;
      case 'Wallet':
        return <Wallets accounts={accounts} totalBalance={totalBalance} onAddAccount={handleAddAccount} onUpdateAccount={handleUpdateAccount} onTransfer={handleTransfer} />;
      case 'Debts':
        return <Debts debts={debts} accounts={accounts} onAddDebt={handleAddDebt} onPayDebt={handlePayDebt} onDeleteDebt={handleDeleteDebt} />;
      case 'Credits':
        return <Credits credits={credits} accounts={accounts} onPayCredit={handlePayCredit} onAddCredit={handleAddCredit} onDeleteCredit={handleDeleteCredit} />;
      case 'AddTransaction':
        return <AddTransaction
          onSave={handleSaveTransaction}
          onTransfer={handleTransfer}
          onClose={() => { setEditingTransaction(null); setCurrentScreen('Home'); }}
          initialData={editingTransaction || undefined}
          categories={categories}
          budgets={budgets}
          accounts={accounts}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
        />;
      case 'Notifications':
        return <Notifications
          notifications={notifications}
          onBack={() => setCurrentScreen('Home')}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDelete={handleDeleteNotification}
          onRestore={(n) => {
            // Restore logic? Maybe just add it back.
            db.notifications.add(n);
          }}
          onClearAll={handleClearAllReadNotifications}
        />;
      case 'Settings':
        return <Settings user={currentUser} onBack={() => setCurrentScreen('Home')} onUpdateUser={handleUpdateUser} onLogout={handleLogout} onExport={handleExportData} onImport={handleImportData} />;
      default:
        return <Dashboard user={currentUser} totalBalance={totalBalance} income={monthIncome} expenses={monthExpenses} transactions={transactions} categories={categories} budgets={budgets} unreadNotifCount={unreadNotificationCount} onAdd={() => setCurrentScreen('AddTransaction')} onEdit={(tx) => { setEditingTransaction(tx); setCurrentScreen('AddTransaction'); }} onOpenNotifications={() => setCurrentScreen('Notifications')} onOpenSettings={() => setCurrentScreen('Settings')} onSeeAll={() => setCurrentScreen('Stats')} />;
    }
  };

  return (
    <div className="max-w-[480px] mx-auto bg-white dark:bg-background-dark min-h-screen h-[100dvh] flex flex-col shadow-2xl relative overflow-hidden text-slate-900 dark:text-slate-100">
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {renderScreen()}
      </main>
      {currentUser && currentScreen !== 'AddTransaction' && (
        <BottomNav currentScreen={currentScreen} onNavigate={setCurrentScreen} />
      )}
    </div>
  );
};

export default App;
