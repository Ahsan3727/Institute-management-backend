'use client';

import React from 'react';

export function ListCard({ children, className = '' }) {
  return <div className={'mb-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-3.5 ' + className}>{children}</div>;
}

export function ListRow({ icon: Icon, time, title, subtitle, right, last, onClick, alignStart }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      onClick={onClick}
      type={onClick ? 'button' : undefined}
      className={
        'flex w-full gap-3 border-b border-[var(--line)] py-2.5 text-left last:border-b-0 ' +
        (alignStart ? 'items-start' : 'items-center')
      }
    >
      {time ? <span className="w-14 shrink-0 text-[11px] font-semibold text-[var(--sub)]">{time}</span> : null}
      {Icon ? (
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-[var(--role-bg)]">
          <Icon size={16} className="text-[var(--role-dark)]" />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold text-[var(--ink)]">{title}</p>
        {subtitle ? <p className="mt-0.5 truncate text-[11.5px] text-[var(--sub)]">{subtitle}</p> : null}
      </div>
      {right}
    </Wrapper>
  );
}

export function EmptyNote({ children }) {
  return <p className="py-3.5 text-[12.5px] text-[var(--sub)]">{children}</p>;
}

export function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <div className="mb-2.5 mt-1.5 flex items-center justify-between">
      <h4 className="text-[12.5px] font-bold uppercase tracking-wide text-[var(--sub)]">{title}</h4>
      {actionLabel ? (
        <button type="button" onClick={onAction} className="text-[12.5px] font-bold text-[var(--role-dark)]">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function Avatar({ name, colorClass = 'bg-[var(--role)]' }) {
  const letters = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[12.5px] font-bold text-white ' + colorClass}>
      {letters}
    </div>
  );
}
