'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { readJSON, writeJSON, THEME_KEY } from '@/state/storage';
import { useApp } from '@/state/AppContext';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { session } = useApp();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = readJSON(THEME_KEY);
    if (saved && saved.mode === 'dark') setIsDark(true);
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      writeJSON(THEME_KEY, { mode: next ? 'dark' : 'light' });
      return next;
    });
  }, []);

  const role = session.role || 'teacher';

  const value = useMemo(() => ({ isDark, toggleTheme, role }), [isDark, toggleTheme, role]);

  return (
    <ThemeContext.Provider value={value}>
      <div data-theme={isDark ? 'dark' : 'light'} data-role={role} className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
        {mounted ? children : null}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
