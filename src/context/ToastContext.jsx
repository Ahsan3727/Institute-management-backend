'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null); // {msg, type}
  const timer = useRef(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type, key: Date.now() });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast ? (
        <div
          key={toast.key}
          className={
            'animate-toast-in fixed bottom-24 left-1/2 z-[999] flex max-w-[90vw] -translate-x-1/2 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-xl ' +
            (toast.type === 'error' ? 'bg-[var(--red)]' : 'bg-[var(--ink)]')
          }
        >
          {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.msg}</span>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (ctx === null) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
