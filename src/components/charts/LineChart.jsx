'use client';

import React from 'react';
import { EmptyNote } from '@/components/Lists';
import { fmtDate } from '@/utils/helpers';

// tests: [{date, score, max}]
export default function LineChart({ tests = [] }) {
  if (!tests.length) return <EmptyNote>No test results yet.</EmptyNote>;

  const scores = tests.map((t) => Math.round((t.score / t.max) * 100));
  const w = 300;
  const h = 120;
  const padX = 14;
  const padY = 16;
  const n = scores.length;
  const range = 100;

  const x = (i) => (n > 1 ? padX + ((w - 2 * padX) * i) / (n - 1) : w / 2);
  const y = (v) => h - padY - ((h - 2 * padY) * v) / range;

  const path = scores.map((s, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(s).toFixed(1)}`).join(' ');

  return (
    <div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <line x1={padX} y1={y(50)} x2={w - padX} y2={y(50)} style={{ stroke: 'var(--line)' }} strokeWidth={1} strokeDasharray="3 4" />
        <path d={path} fill="none" style={{ stroke: 'var(--role-dark)' }} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {scores.map((s, i) => (
          <circle key={i} cx={x(i)} cy={y(s)} r={3.2} style={{ fill: 'var(--role-dark)' }} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10.5px] font-semibold text-[var(--sub)]">
        <span>{fmtDate(tests[0].date)}</span>
        {tests.length > 1 ? <span>{fmtDate(tests[tests.length - 1].date)}</span> : null}
      </div>
    </div>
  );
}
