'use client';

import React from 'react';

export default function Card({ title, children, className = '' }) {
  return (
    <div
      className={
        'mb-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 shadow-sm shadow-black/5 dark:shadow-black/20 ' +
        className
      }
    >
      {title ? <h3 className="mb-3 text-sm font-bold text-[var(--ink)]">{title}</h3> : null}
      {children}
    </div>
  );
}
