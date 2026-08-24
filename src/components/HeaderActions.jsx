'use client';

import React from 'react';
import { Bell, Sun, Moon } from 'lucide-react';
import { useNotifications } from '@/context/NotificationsContext';
import { useTheme } from '@/context/ThemeContext';

export default function HeaderActions() {
  const { openNotifications, hasNotifications } = useNotifications();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggleTheme}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
      <button
        type="button"
        onClick={openNotifications}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {hasNotifications ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#FF5D5D]" /> : null}
      </button>
    </div>
  );
}
