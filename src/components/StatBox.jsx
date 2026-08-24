'use client';

import React from 'react';

export function StatGrid({ children }) {
  return <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{children}</div>;
}

export default function StatBox({ value, label, colorClass = 'text-[var(--role-dark)]' }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-[var(--line)] bg-[var(--paper)] py-3">
      <span className={'text-lg font-bold ' + colorClass}>{value}</span>
      <span className="mt-1 text-[9.5px] font-bold uppercase tracking-wide text-[var(--sub)]">{label}</span>
    </div>
  );
}
