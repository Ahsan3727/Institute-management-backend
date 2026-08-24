'use client';

import React from 'react';

export function PrimaryButton({ title, icon: Icon, onClick, className = '', dark, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={
        'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14.5px] font-bold text-white transition active:opacity-80 ' +
        (dark ? 'bg-[var(--ink)]' : 'bg-[var(--role)]') +
        ' ' +
        className
      }
    >
      {Icon ? <Icon size={16} /> : null}
      {title}
    </button>
  );
}

export function SmallButton({ title, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'rounded-lg bg-[var(--role)] px-4 py-2.5 text-[13px] font-bold text-white transition active:opacity-80 ' + className
      }
    >
      {title}
    </button>
  );
}

export function IconButton({ icon: Icon, onClick, danger, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg)] transition hover:opacity-80 ' + className
      }
    >
      <Icon size={15} className={danger ? 'text-[var(--red)]' : 'text-[var(--sub)]'} />
    </button>
  );
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="mb-4 flex gap-1 rounded-xl bg-[var(--role-bg)] p-1">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              'flex-1 rounded-lg py-2 text-[12.5px] font-bold transition ' +
              (active ? 'bg-[var(--role)] text-white' : 'text-[var(--role-dark)]')
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
