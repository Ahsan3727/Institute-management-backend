'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Search, Calendar } from 'lucide-react';
import { todayISO } from '@/utils/helpers';

export function Label({ children }) {
  return <label className="mb-1.5 block text-[11.5px] font-bold uppercase tracking-wide text-[var(--sub)]">{children}</label>;
}

export function TextField({ value, onChange, placeholder, className = '', multiline, rows = 4, type = 'text', ...rest }) {
  const base =
    'w-full rounded-lg border-[1.5px] border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-[14.5px] text-[var(--ink)] placeholder:text-[var(--sub)] outline-none focus:border-[var(--role)] ' +
    className;
  if (multiline) {
    return <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={base} {...rest} />;
  }
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={base} {...rest} />;
}

// options: [{label, value}]
export function SelectField({ value, options, onChange, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className={'relative ' + className} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border-[1.5px] border-[var(--line)] bg-[var(--paper)] px-3.5 py-2.5 text-left text-[13.5px] font-semibold text-[var(--ink)]"
      >
        <span className="truncate">{current ? current.label : 'Select…'}</span>
        <ChevronDown size={16} className="shrink-0 text-[var(--sub)]" />
      </button>
      {open ? (
        <div className="absolute z-40 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[var(--line)] bg-[var(--paper)] p-1 shadow-xl">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={
                'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[13.5px] hover:bg-[var(--bg)] ' +
                (opt.value === value ? 'font-bold text-[var(--role-dark)]' : 'text-[var(--ink)]')
              }
            >
              {opt.label}
              {opt.value === value ? <Check size={15} className="text-[var(--role-dark)]" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DateField({ value, onChange, className = '' }) {
  return (
    <div
      className={
        'flex items-center gap-2 rounded-lg border-[1.5px] border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 ' + className
      }
    >
      <Calendar size={15} className="shrink-0 text-[var(--sub)]" />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-[13.5px] font-semibold text-[var(--ink)] outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(todayISO())}
        className="shrink-0 text-[12px] font-bold text-[var(--role-dark)]"
      >
        Today
      </button>
    </div>
  );
}

export function SearchField({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="mb-2.5 flex items-center gap-2 rounded-lg border-[1.5px] border-[var(--line)] bg-[var(--paper)] px-3.5 py-2">
      <Search size={15} className="shrink-0 text-[var(--sub)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-[13.5px] text-[var(--ink)] placeholder:text-[var(--sub)] outline-none"
      />
    </div>
  );
}
