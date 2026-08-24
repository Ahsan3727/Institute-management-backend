'use client';

import React, { useState } from 'react';
import { Settings, List, AlertTriangle, Sun, Moon, Share2, RefreshCw, LogOut, Printer, ChevronRight, Wallet, GraduationCap, BarChart2 } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useNav } from '@/navigation/AppShell';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { ConfirmModal } from '@/components/Modals';

async function shareOrCopy(text, title, toast) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text, title });
      return;
    } catch (e) {
      /* user cancelled or share failed — fall through to copy */
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied to clipboard (Web Share not available here).', 'success');
  } catch (e) {
    toast('Could not share or copy.', 'error');
  }
}

export default function MoreScreen() {
  const { session, logout, exportSnapshot, resetDemoData, buildProgressReportText } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();
  const nav = useNav();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const isTeacherOrAdmin = session.role === 'teacher' || session.role === 'admin';
  const isParentOrAdmin = session.role === 'parent' || session.role === 'admin';
  const isAdmin = session.role === 'admin';

  const items = [
    isAdmin && { icon: GraduationCap, label: 'Students Directory & Accounts', go: () => nav.navigate('Students') },
    isAdmin && { icon: BarChart2, label: 'Student Progress Reports', go: () => nav.navigate('Reports') },
    isAdmin && { icon: Wallet, label: 'Finance — Fees & Salaries', go: () => nav.navigate('Finance') },
    isTeacherOrAdmin && { icon: Settings, label: isAdmin ? 'Setup — Classes, Subjects & School' : 'View Classes & Subjects', go: () => nav.navigate('Setup') },
    isTeacherOrAdmin && { icon: List, label: 'Daily Activity Log', go: () => nav.navigate('DailyLog') },
    isParentOrAdmin && { icon: AlertTriangle, label: 'Missed SLOs', go: () => nav.navigate('Missed') },
    isTeacherOrAdmin && {
      icon: Printer,
      label: 'Share Progress Report',
      go: () => shareOrCopy(buildProgressReportText(), 'SLO Progress Report', toast),
    },
    { icon: isDark ? Sun : Moon, label: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode', go: toggleTheme },
    { icon: Share2, label: 'Export / Backup Data', go: () => shareOrCopy(exportSnapshot(), 'SLO Tracker Backup', toast) },
    isAdmin && { icon: RefreshCw, label: 'Reset Demo Data', go: () => setConfirmReset(true), danger: true },
    { icon: LogOut, label: 'Log Out', go: () => setConfirmLogout(true), danger: true },
  ].filter(Boolean);

  return (
    <ScreenBody>
      <Card title={`${session.name} · ${session.role[0].toUpperCase() + session.role.slice(1)}`}>
        <p className="text-[12.5px] leading-[18px] text-[var(--sub)]">
          Manage app-wide setup, review activity, back up your data, or switch accounts.
        </p>
      </Card>

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <button
              key={it.label}
              type="button"
              onClick={it.go}
              className={
                'flex w-full items-center gap-3 px-3.5 py-3.5 text-left ' +
                (i !== items.length - 1 ? 'border-b border-[var(--line)]' : '')
              }
            >
              <div className={'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ' + (it.danger ? 'bg-[var(--red-bg)]' : 'bg-[var(--role-bg)]')}>
                <Icon size={16} className={it.danger ? 'text-[var(--red)]' : 'text-[var(--role-dark)]'} />
              </div>
              <span className={'flex-1 text-[13.5px] font-semibold ' + (it.danger ? 'text-[var(--red)]' : 'text-[var(--ink)]')}>
                {it.label}
              </span>
              <ChevronRight size={16} className="text-[var(--sub)]" />
            </button>
          );
        })}
      </div>

      <ConfirmModal
        open={confirmLogout}
        title="Log out?"
        body="You can resume this session again from the login screen."
        confirmLabel="Log Out"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          logout();
        }}
      />
      <ConfirmModal
        open={confirmReset}
        title="Reset demo data?"
        body="All classes, SLOs, attendance, and results will be replaced with the original sample data. This cannot be undone."
        confirmLabel="Reset"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          resetDemoData();
          toast('Demo data restored.', 'success');
        }}
      />
    </ScreenBody>
  );
}
