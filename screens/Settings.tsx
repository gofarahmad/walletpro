
import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';

interface SettingsProps {
  user: UserProfile;
  onBack: () => void;
  onUpdateUser: (updated: UserProfile) => void;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onBack, onUpdateUser, onLogout }) => {
  const [name, setName] = useState(user.name);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber);
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl);
  const [pin, setPin] = useState(user.pin);
  const [showPin, setShowPin] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (!name || !phoneNumber || !pin) return;
    onUpdateUser({ ...user, name, phoneNumber, photoUrl, pin });
    onBack();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleGoogleLogin = async () => {
    try {
      // Typically we'd call onUpdateUser with the email inside App.tsx via a dedicated handler, 
      // but for now we'll imply functionality or pass a handler. 
      // The architecture plan says Settings should handle UI.
      // We need to call GoogleDriveService.signIn() here.
      // However, Settings doesn't import GoogleDriveService directly to keep it clean? 
      // It's better if `onGoogleLogin` prop is passed.
      // For speed, let's assume we import the service here or App passes a handler.
      // Let's modify SettingsProps first or just import service. Importing service is easier for now.
      const email = await import('../services/google').then(m => m.GoogleDriveService.signIn());
      if (email) {
        onUpdateUser({ ...user, email });
      }
    } catch (error) {
      console.error('Google Login Error:', error);
    }
  };

  const handleGoogleLogout = async () => {
    await import('../services/google').then(m => m.GoogleDriveService.signOut());
    onUpdateUser({ ...user, email: undefined });
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-background-dark font-display">
      <header className="p-4 bg-white dark:bg-slate-900 sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <button onClick={onBack} className="size-8 flex items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800 text-slate-500">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <h2 className="text-lg font-bold">Pengaturan Profil</h2>
        <button
          onClick={handleSave}
          className="text-xs font-bold text-white px-5 py-2 bg-primary rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all"
        >
          Simpan
        </button>
      </header>

      <div className="flex-1 p-6 space-y-8 overflow-y-auto no-scrollbar pb-32">
        {/* Profile Photo Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <img
              src={photoUrl}
              alt="Profile"
              className="size-32 rounded-[40px] object-cover border-4 border-white dark:border-slate-800 shadow-2xl"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <button
              onClick={triggerFileInput}
              className="absolute -bottom-2 -right-2 size-10 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-xl">photo_camera</span>
            </button>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Klik ikon untuk ganti foto</p>
        </div>

        {/* Form Section */}
        <div className="space-y-6">
          <div className="space-y-1">
            {/* Google Sync Section */}
            <div className="bg-slate-900 text-white rounded-[28px] p-6 shadow-2xl relative overflow-hidden mb-6">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-1">Google Drive Sync</h3>
                <p className="text-white/60 text-xs mb-4">Singkronisasi otomatis ke akun Google Anda.</p>

                {user.email ? (
                  <div className="flex items-center justify-between bg-white/10 rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center gap-3">
                      <img src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" className="size-8" alt="Drive" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Terhubung</p>
                        <p className="text-sm font-bold">{user.email}</p>
                      </div>
                    </div>
                    <button onClick={handleGoogleLogout} className="size-10 rounded-xl bg-white/10 flex items-center justify-center text-white active:scale-95 transition-transform">
                      <span className="material-symbols-outlined">logout</span>
                    </button>
                  </div>
                ) : (
                  <button onClick={handleGoogleLogin} className="w-full h-14 bg-white text-slate-900 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm shadow-xl active:scale-[0.98] transition-all">
                    <img src="https://www.gstatic.com/images/branding/product/1x/google_g_48dp.png" className="size-6" alt="Google" />
                    Hubungkan Google Drive
                  </button>
                )}
              </div>
              {/* Decoration */}
              <div className="absolute -right-6 -bottom-10 opacity-10">
                <span className="material-symbols-outlined text-[120px]">cloud_sync</span>
              </div>
            </div>

            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nama Lengkap</label>
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="material-symbols-outlined text-slate-300">person</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama"
                className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nomor HP</label>
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="material-symbols-outlined text-slate-300">phone_iphone</span>
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="0812..."
                  className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Password / PIN Keamanan</label>
            <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <span className="material-symbols-outlined text-slate-300">lock</span>
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="****"
                maxLength={8}
                className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-slate-800 dark:text-slate-100 tracking-widest"
              />
              <button
                onClick={() => setShowPin(!showPin)}
                className="text-slate-400 active:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-xl">
                  {showPin ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-8 space-y-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Privasi & Keamanan</p>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between p-5 bg-rose-50 dark:bg-rose-950/20 rounded-[28px] border border-rose-100 dark:border-rose-900/50 text-rose-500 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm font-bold">Keluar dari Akun</span>
            </div>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
