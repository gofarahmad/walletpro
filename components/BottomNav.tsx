
import React from 'react';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const tabs = [
    { id: 'Home' as Screen, label: 'Home', icon: 'home' },
    { id: 'Stats' as Screen, label: 'Analisis', icon: 'monitoring' },
    { id: 'Credits' as Screen, label: 'Kredit', icon: 'credit_card' },
    { id: 'Debts' as Screen, label: 'Debts', icon: 'handshake' },
    { id: 'Budget' as Screen, label: 'Pagu', icon: 'account_balance_wallet' },
    { id: 'Wallet' as Screen, label: 'Akun', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto h-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 flex items-center justify-around px-2 pb-4 z-[100]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onNavigate(tab.id)}
          className={`flex flex-col items-center transition-all px-1 flex-1 relative ${
            currentScreen === tab.id ? 'text-primary' : 'text-slate-400'
          }`}
        >
          {currentScreen === tab.id && (
            <div className="absolute -top-3 w-8 h-1 bg-primary rounded-full animate-in fade-in zoom-in duration-300"></div>
          )}
          <span className={`material-symbols-outlined text-[22px] ${currentScreen === tab.id ? 'fill-[1]' : ''}`}>
            {tab.icon}
          </span>
          <span className={`text-[9px] font-bold mt-1.5 transition-all ${currentScreen === tab.id ? 'text-primary' : 'text-slate-400'}`}>
            {tab.label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
