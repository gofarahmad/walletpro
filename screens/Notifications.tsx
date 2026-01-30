
import React, { useState, useEffect, useRef } from 'react';
import { Notification } from '../types';

interface NotificationsProps {
  notifications: Notification[];
  onBack: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onRestore: (notif: Notification) => void;
  onClearAll: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({
  notifications,
  onBack,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onRestore,
  onClearAll
}) => {
  const handleItemClick = (id: string) => {
    onMarkAsRead(id);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-background-dark font-display relative overflow-hidden">
      <header className="p-4 bg-white dark:bg-slate-900 sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="size-8 flex items-center justify-center rounded-full active:bg-slate-100 dark:active:bg-slate-800 text-slate-500">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <h2 className="text-lg font-bold">Notifikasi</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClearAll}
            className="text-[10px] font-bold text-rose-500 px-3 py-1.5 bg-rose-500/10 rounded-lg active:scale-95 transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">delete_sweep</span>
            Hapus
          </button>
          <button
            onClick={onMarkAllAsRead}
            className="text-[10px] font-bold text-primary px-3 py-1.5 bg-primary/10 rounded-lg active:scale-95 transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">done_all</span>
            Baca
          </button>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto no-scrollbar pb-32">
        {notifications.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <span className="material-symbols-outlined text-4xl">notifications_off</span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Belum ada notifikasi</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className="relative overflow-hidden rounded-[28px]">
              <div
                onClick={() => handleItemClick(n.id)}
                className={`p-4 bg-white dark:bg-slate-900 border transition-all relative z-10 select-none active:bg-slate-50 dark:active:bg-slate-800/50 ${n.isRead
                  ? 'border-slate-100 dark:border-slate-800 opacity-50 grayscale'
                  : 'border-primary/20 shadow-md shadow-primary/5'
                  }`}
              >
                {!n.isRead ? (
                  <div className="absolute top-4 right-4 size-2.5 bg-primary rounded-full animate-pulse border-2 border-white dark:border-slate-900"></div>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Hapus notifikasi ini?')) onDelete(n.id);
                    }}
                    className="absolute top-3 right-3 p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-all"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
                <div className="flex gap-4">
                  <div className={`size-11 rounded-2xl shrink-0 flex items-center justify-center ${n.isRead ? 'bg-slate-100 text-slate-400' :
                    n.type === 'Warning' ? 'bg-amber-500/10 text-amber-500' :
                      n.type === 'Success' ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-primary/10 text-primary'
                    }`}>
                    <span className="material-symbols-outlined text-xl">
                      {n.type === 'Warning' ? 'warning' : n.type === 'Success' ? 'check_circle' : 'info'}
                    </span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className={`font-bold text-sm leading-tight mt-1 ${n.isRead ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>{n.title}</h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {new Date(n.date).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
