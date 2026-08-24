'use client';

import React from 'react';
import { EmptyNote } from '@/components/Lists';

// items: [{label, sub, pct, colorClass}]
export default function BarChart({ items = [] }) {
  if (!items.length) return <EmptyNote>Nothing to compare yet.</EmptyNote>;
  return (
    <div className="flex flex-col gap-3">
      {items.map((it, i) => (
        <div key={i}>
          <div className="mb-1 flex justify-between">
            <span className="text-[12.5px] font-bold text-[var(--ink)]">{it.label}</span>
            {it.sub ? <span className="text-[11px] text-[var(--sub)]">{it.sub}</span> : null}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--line)]">
              <div
                className={'h-full rounded-full ' + (it.colorClass || 'bg-[var(--role)]')}
                style={{ width: `${Math.max(2, it.pct)}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-[11.5px] font-bold text-[var(--sub)]">{it.pct}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
