'use client';

import React from 'react';

// legendItems: [{label, value, colorClass}]
export default function DonutChart({ pct = 0, legendItems = [] }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const size = 110;
  return (
    <div className="flex items-center gap-5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 110 110">
          <circle cx="55" cy="55" r={r} fill="none" style={{ stroke: 'var(--line)' }} strokeWidth={12} />
          <circle
            cx="55"
            cy="55"
            r={r}
            fill="none"
            style={{ stroke: 'var(--green)' }}
            strokeWidth={12}
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={c - (pct / 100) * c}
            strokeLinecap="round"
            transform="rotate(-90 55 55)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[22px] font-extrabold text-[var(--ink)]">{pct}%</span>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {legendItems.map((li) => (
          <div key={li.label} className="flex items-center gap-2">
            <span className={'h-2.5 w-2.5 rounded-sm ' + (li.colorClass || 'bg-[var(--green)]')} />
            <span className="text-[12.5px] text-[var(--ink)]">{li.label}</span>
            <span className="ml-1 text-[12.5px] font-bold text-[var(--sub)]">{li.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
