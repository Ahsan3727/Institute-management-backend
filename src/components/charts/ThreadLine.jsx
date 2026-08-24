'use client';

import React from 'react';

export default function ThreadLine({ pct = 0, label = 'Term coverage' }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const w = 320;
  const h = 22;
  const midY = 12;
  const amp = 6;
  const segs = 8;
  let d = `M0 ${midY}`;
  for (let i = 1; i <= segs; i++) {
    const x = (w / segs) * i;
    const y = midY + (i % 2 === 0 ? amp : -amp);
    d += ` Q ${x - w / segs / 2} ${y} ${x} ${midY}`;
  }
  const cutX = ((w * clamped) / 100).toFixed(1);
  const clipId = 'threadClip-' + Math.round(clamped);

  return (
    <div className="mt-3.5">
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={cutX} height={h} />
          </clipPath>
        </defs>
        <path d={d} style={{ stroke: 'var(--line)' }} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeDasharray="1 7" />
        <g clipPath={`url(#${clipId})`}>
          <path d={d} style={{ stroke: 'var(--role-dark)' }} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        </g>
      </svg>
      <div className="mt-1 flex justify-between text-[10.5px] font-semibold text-[var(--sub)]">
        <span>{label}</span>
        <span>{Math.round(clamped)}%</span>
      </div>
    </div>
  );
}
