'use client';

import React from 'react';
import { EmptyNote } from '@/components/Lists';

// points: [{label, value}]
export default function TrendChart({ points = [] }) {
  if (!points.length || points.every((p) => p.value === 0)) {
    return <EmptyNote>No activity in this period yet.</EmptyNote>;
  }
  const w = 300;
  const h = 90;
  const pad = 10;
  const max = Math.max(1, ...points.map((p) => p.value));
  const stepX = (w - pad * 2) / (points.length - 1 || 1);
  const pts = points.map((p, i) => {
    const x = pad + stepX * i;
    const y = h - pad - (p.value / max) * (h - pad * 2);
    return { x, y, ...p };
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${h - pad} L ${pts[0].x.toFixed(1)} ${h - pad} Z`;

  return (
    <div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <path d={area} style={{ fill: 'var(--role-bg)' }} stroke="none" />
        <path d={line} fill="none" style={{ stroke: 'var(--role-dark)' }} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={3} style={{ fill: 'var(--role-dark)' }} />
        ))}
      </svg>
      <div className="mt-1 flex justify-between">
        {points.map((p, i) => (
          <span key={i} className="text-[10px] font-semibold text-[var(--sub)]">
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
