
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface LoginProps {
  users: UserProfile[]; // Saved users
  allUsers: UserProfile[]; // All users database
  onLoginSuccess: (user: UserProfile) => void;
  onRegister: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  onSaveProfile: (userId: string) => void;
}

const Login: React.FC<LoginProps> = ({ users, allUsers, onLoginSuccess, onRegister, onDeleteUser, onSaveProfile }) => {
  // Screens: 'QuickLogin' (Saved Profiles) | 'ManualAuth' (Login/Register Form)
  const [view, setView] = useState<'QuickLogin' | 'ManualAuth'>(users.length > 0 ? 'QuickLogin' : 'ManualAuth');

  // Quick Login State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userToBeDeleted, setUserToBeDeleted] = useState<UserProfile | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Manual Auth State
  const [authMode, setAuthMode] = useState<'Login' | 'Register'>('Login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authPin, setAuthPin] = useState('');
  const [fullName, setFullName] = useState('');
  const [saveProfileModalUser, setSaveProfileModalUser] = useState<UserProfile | null>(null);

  // Reset fields when switching views
  useEffect(() => {
    setPin('');
    setError(false);
    setPhoneNumber('');
    setAuthPin('');
    setFullName('');
  }, [view, authMode]);

  // --- QUICK LOGIN LOGIC ---
  const handlePinPress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (selectedUser && pin.length === 4) {
      if (pin === selectedUser.pin) {
        onLoginSuccess(selectedUser);
      } else {
        triggerError();
      }
    }
  }, [pin, selectedUser]);

  const triggerError = () => {
    setIsShaking(true);
    setError(true);
    setTimeout(() => {
      setIsShaking(false);
      setPin('');
    }, 500);
  };

  const confirmDeleteUser = () => {
    if (userToBeDeleted) {
      onDeleteUser(userToBeDeleted.id);
      setUserToBeDeleted(null);
      // If users empty after delete? App.tsx handles re-rendering, 
      // but if users prop becomes empty, we might want to switch view.
    }
  };

  // --- MANUAL AUTH LOGIC ---
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (authMode === 'Login') {
      const user = allUsers.find(u => u.phoneNumber === phoneNumber && u.pin === authPin);
      if (user) {
        // Success! Ask to save profile if not already saved
        if (!user.isSaved) {
          setSaveProfileModalUser(user);
        } else {
          onLoginSuccess(user);
        }
      } else {
        alert('Nomor HP atau PIN salah!');
      }
    } else {
      // Register
      if (fullName && phoneNumber && authPin.length === 4) {
        const exists = allUsers.find(u => u.phoneNumber === phoneNumber);
        if (exists) {
          alert('Nomor HP sudah terdaftar!');
          return;
        }


        const newUser: UserProfile = {
          id: Math.random().toString(36).substr(2, 9),
          name: fullName,
          phoneNumber: phoneNumber,
          pin: authPin,
          photoUrl: `https://picsum.photos/seed/${phoneNumber}/100`,
          isSaved: false // Default false, ask user next
        };
        // REMOVED: onRegister(newUser); -> This caused premature login/unmount
        // Instead, we just set the local state to show the modal.
        // We will call onRegister later when the user confirms or cancels saving.
        setSaveProfileModalUser(newUser);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-background-dark font-display p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute -top-20 -left-20 size-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-1/2 -right-20 size-64 bg-emerald-500/5 rounded-full blur-3xl"></div>

      {/* MODAL: DELETE CONFIRMATION */}
      {userToBeDeleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="size-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4 mx-auto text-rose-500">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h3 className="text-lg font-bold text-center mb-2">Hapus Profil?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Hapus <strong>{userToBeDeleted.name}</strong> dari daftar login cepat? Data akun tetap aman di database.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setUserToBeDeleted(null)}
                className="flex-1 py-3 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteUser}
                className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-2xl shadow-xl shadow-rose-500/20 active:scale-[0.98] transition-all"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SAVE PROFILE CONFIRMATION */}
      {saveProfileModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 mx-auto text-primary">
              <span className="material-symbols-outlined text-2xl">save</span>
            </div>
            <h3 className="text-lg font-bold text-center mb-2">Simpan Profil?</h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              Simpan profil di perangkat ini agar login berikutnya lebih cepat hanya menggunakan PIN.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (saveProfileModalUser) {
                    onRegister(saveProfileModalUser);
                    setSaveProfileModalUser(null);
                  }
                }}
                className="flex-1 py-3 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                Nanti Saja
              </button>
              <button
                onClick={() => {
                  if (saveProfileModalUser) {
                    const userToSave = { ...saveProfileModalUser, isSaved: true };
                    onRegister(userToSave);
                    setSaveProfileModalUser(null);
                  }
                }}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 max-w-sm mx-auto w-full">
        <div className="mb-8 text-center">
          <div className="size-16 bg-slate-900 rounded-[24px] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-primary/20">
            <span className="material-symbols-outlined text-white text-3xl">payments</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight dark:text-white">WealthWise</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Personal Finance</p>
        </div>

        {selectedUser ? (
          // --- PIN ENTRY SCREEN for Quick Login ---
          <div className={`w-full flex flex-col items-center ${isShaking ? 'animate-bounce' : ''}`}>
            <img
              src={selectedUser.photoUrl}
              className="size-20 rounded-[28px] object-cover mb-4 border-2 border-primary/20 p-1 bg-white dark:bg-slate-800"
              alt="Profile"
            />
            <h2 className="text-lg font-bold mb-1">Halo, {selectedUser.name.split(' ')[0]}</h2>
            <p className="text-xs text-slate-400 mb-10">Masukkan PIN profile Anda</p>

            {/* PIN Dots */}
            <div className={`flex gap-4 mb-12 ${error ? 'text-rose-500' : 'text-primary'}`}>
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`size-3.5 rounded-full transition-all duration-200 border-2 ${pin.length > i
                    ? 'bg-current border-current scale-110 shadow-lg'
                    : 'border-slate-200 dark:border-slate-700'
                    }`}
                />
              ))}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button
                  key={n}
                  onClick={() => handlePinPress(n.toString())}
                  className="size-16 rounded-full flex items-center justify-center text-xl font-bold bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
                >
                  {n}
                </button>
              ))}
              <div className="size-16" />
              <button
                onClick={() => handlePinPress('0')}
                className="size-16 rounded-full flex items-center justify-center text-xl font-bold bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="size-16 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all active:scale-90"
              >
                <span className="material-symbols-outlined text-2xl">backspace</span>
              </button>
            </div>

            <div className="mt-12 flex flex-col items-center gap-4">
              <button
                onClick={() => { setSelectedUser(null); setPin(''); }}
                className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600"
              >
                Ganti Profil
              </button>
            </div>
          </div>
        ) : view === 'QuickLogin' ? (
          // --- QUICK LOGIN LIST ---
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <div className="flex items-center justify-between mb-6 px-2">
              <h2 className="text-lg font-bold">Gunakan Profile</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`text-xs font-bold uppercase tracking-widest transition-colors ${isEditing ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {isEditing ? 'Selesai' : 'Kelola'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {users.map(user => (
                <div key={user.id} className="relative group">
                  <button
                    onClick={() => {
                      if (isEditing) return;
                      setSelectedUser(user);
                      setPin('');
                    }}
                    className={`w-full flex flex-col items-center p-4 rounded-3xl transition-all border ${isEditing ? 'bg-slate-50 dark:bg-slate-800 border-dashed border-slate-300 dark:border-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-800 border-transparent hover:border-slate-100 dark:hover:border-slate-700'}`}
                  >
                    <div className="relative">
                      <img
                        src={user.photoUrl}
                        className={`size-20 rounded-[28px] object-cover mb-3 shadow-md transition-all ${isEditing ? 'opacity-80 scale-95 grayscale' : ''}`}
                        alt={user.name}
                      />
                      {isEditing && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserToBeDeleted(user);
                          }}
                          className="absolute -top-2 -right-2 size-8 bg-rose-500 rounded-full flex items-center justify-center shadow-lg text-white cursor-pointer hover:bg-rose-600 active:scale-90 transition-all z-20"
                        >
                          <span className="material-symbols-outlined text-lg">close</span>
                        </div>
                      )}
                    </div>
                    <span className={`font-bold text-sm transition-colors ${isEditing ? 'text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{user.name}</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => setView('ManualAuth')}
                className="text-sm font-bold text-primary hover:text-primary-dark transition-colors"
              >
                Masuk atau Daftar Akun Lain
              </button>
            </div>
          </div>
        ) : (
          // --- MANUAL AUTH VIEW (LOGIN / REGISTER) ---
          <div className="w-full animate-in slide-in-from-bottom-4 duration-500">
            {/* Tab Switcher */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-8">
              <button
                onClick={() => setAuthMode('Login')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${authMode === 'Login' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Masuk
              </button>
              <button
                onClick={() => setAuthMode('Register')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${authMode === 'Register' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Daftar
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              {authMode === 'Register' && (
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1 mb-1 block">Nama Lengkap</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold p-3 focus:ring-2 focus:ring-primary/20"
                    placeholder="Nama Anda"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1 mb-1 block">Nomor HP</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPhoneNumber(val);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold p-3 focus:ring-2 focus:ring-primary/20"
                  placeholder="08123456789"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1 mb-1 block">PIN (4 Digit)</label>
                <input
                  type="password"
                  maxLength={4}
                  value={authPin}
                  onChange={e => {
                    if (e.target.value.match(/^[0-9]*$/) && e.target.value.length <= 4) {
                      setAuthPin(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl font-bold p-3 focus:ring-2 focus:ring-primary/20 tracking-[0.5em] text-center"
                  placeholder="••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all mt-4"
              >
                {authMode === 'Login' ? 'Masuk Sekarang' : 'Daftar Akun'}
              </button>
            </form>

            <div className="text-center mt-6">
              {users.length > 0 && (
                <button
                  onClick={() => setView('QuickLogin')}
                  className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600"
                >
                  Kembali ke Profil Tersimpan
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="py-8 text-center">
        <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">
          &copy; 2024 WealthWise AI • Secure Banking Grade
        </p>
      </footer>
    </div>
  );
};

export default Login;
