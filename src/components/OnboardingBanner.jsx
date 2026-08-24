'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useNav } from '@/navigation/AppShell';

export default function OnboardingBanner() {
  const nav = useNav();
  return (
    <div className="mb-4 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--role-bg)]">
          <Sparkles size={16} className="text-[var(--role-dark)]" />
        </div>
        <p className="text-[14px] font-bold text-[var(--ink)]">Let&apos;s set up your school</p>
      </div>
      <p className="mb-3 text-[12.5px] leading-[18px] text-[var(--sub)]">
        No classes yet. Head to Setup to add your real classes, subjects, teachers and students — then come
        back here to start feeding SLOs and marking attendance.
      </p>
      <button
        type="button"
        onClick={() => nav.navigate('Setup')}
        className="rounded-lg bg-[var(--role)] px-4 py-2.5 text-[13px] font-bold text-white"
      >
        Go to Setup →
      </button>
    </div>
  );
}
