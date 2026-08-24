'use client';

import React from 'react';
import ThreadLine from '@/components/charts/ThreadLine';

export default function GreetCard({ name, subtitle, pct, pctLabel, children }) {
  return (
    <div className="mb-4 rounded-[18px] border border-[var(--line)] bg-[var(--role-bg)] p-[18px]">
      <h2 className="text-[17.5px] font-bold text-[var(--ink)]">Good Morning, {name} 👋</h2>
      <p className="mt-1 text-[12.5px] text-[var(--sub)]">{subtitle}</p>
      {children}
      {typeof pct === 'number' ? <ThreadLine pct={pct} label={pctLabel} /> : null}
    </div>
  );
}
