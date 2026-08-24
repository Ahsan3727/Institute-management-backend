'use client';

import React from 'react';

// kind: teach | revise | slo | present | absent
const MAP = {
  teach: 'bg-[var(--green-bg)] text-[var(--green)]',
  present: 'bg-[var(--green-bg)] text-[var(--green)]',
  revise: 'bg-[var(--amber-bg)] text-[#A26A10]',
  absent: 'bg-[var(--red-bg)] text-[var(--red)]',
  slo: 'bg-[var(--role-bg)] text-[var(--role-dark)]',
};

export default function Pill({ kind = 'slo', label }) {
  return (
    <span className={'shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-bold ' + (MAP[kind] || MAP.slo)}>
      {label}
    </span>
  );
}
