'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, BookOpen } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { InfoModal } from '@/components/Modals';

const NotificationsContext = createContext(null);

const ICONS = { alert: AlertTriangle, book: BookOpen };

export function NotificationsProvider({ children }) {
  const [open, setOpen] = useState(false);
  const { getNotifications } = useApp();

  const openNotifications = useCallback(() => setOpen(true), []);
  const closeNotifications = useCallback(() => setOpen(false), []);
  const notifications = getNotifications();

  return (
    <NotificationsContext.Provider value={{ openNotifications, closeNotifications, hasNotifications: notifications.length > 0 }}>
      {children}
      <InfoModal open={open} title="Notifications" onClose={closeNotifications}>
        {notifications.length === 0 ? (
          <p className="py-2 text-sm text-[var(--sub)]">No new notifications. 🎉</p>
        ) : (
          <div className="flex flex-col">
            {notifications.map((n, i) => {
              const Icon = ICONS[n.icon] || AlertTriangle;
              return (
                <div key={i} className="flex items-center gap-3 border-b border-[var(--line)] py-3 last:border-b-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--role-bg)]">
                    <Icon size={16} className="text-[var(--role-dark)]" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">{n.title}</p>
                    <p className="mt-0.5 text-xs text-[var(--sub)]">{n.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </InfoModal>
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}
