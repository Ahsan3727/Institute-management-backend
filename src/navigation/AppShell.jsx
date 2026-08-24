'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { Home, BookOpen, Calendar, BarChart2, Menu, Users, TrendingUp, Compass, ChevronLeft } from 'lucide-react';

import { AppProvider, useApp } from '@/state/AppContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import HeaderActions from '@/components/HeaderActions';

import LoginScreen from '@/screens/LoginScreen';

import TeacherDashboard from '@/screens/teacher/DashboardScreen';
import TeacherSLOsScreen from '@/screens/teacher/SLOsScreen';
import TeacherAttendanceScreen from '@/screens/teacher/AttendanceScreen';
import TeacherReportsScreen from '@/screens/teacher/ReportsScreen';

import ParentDashboard from '@/screens/parent/DashboardScreen';
import ParentAttendanceScreen from '@/screens/parent/AttendanceScreen';
import ParentProgressScreen from '@/screens/parent/ProgressScreen';
import ParentSLOsScreen from '@/screens/parent/SLOsScreen';

import AdminDashboard from '@/screens/admin/DashboardScreen';
import AdminSLOsScreen from '@/screens/admin/SLOsScreen';
import AdminTeachersScreen from '@/screens/admin/TeachersScreen';
import AdminReportsScreen from '@/screens/admin/ReportsScreen';

import MoreScreen from '@/screens/shared/MoreScreen';
import SetupScreen from '@/screens/shared/SetupScreen';
import MissedSLOsScreen from '@/screens/shared/MissedSLOsScreen';
import DailyLogScreen from '@/screens/shared/DailyLogScreen';
import FinanceScreen from '@/screens/admin/FinanceScreen';

const TAB_CONFIG = {
  teacher: [
    { name: 'Dashboard', icon: Home, component: TeacherDashboard, title: 'Dashboard' },
    { name: 'SLOs', icon: BookOpen, component: TeacherSLOsScreen, title: 'SLOs' },
    { name: 'Attendance', icon: Calendar, component: TeacherAttendanceScreen, title: 'Attendance' },
    { name: 'Reports', icon: BarChart2, component: TeacherReportsScreen, title: 'Reports' },
    { name: 'More', icon: Menu, component: MoreScreen, title: 'More' },
  ],
  parent: [
    { name: 'Dashboard', icon: Home, component: ParentDashboard, title: 'Dashboard' },
    { name: 'Attendance', icon: Calendar, component: ParentAttendanceScreen, title: 'Attendance' },
    { name: 'Progress', icon: TrendingUp, component: ParentProgressScreen, title: 'Progress' },
    { name: 'SLOs', icon: BookOpen, component: ParentSLOsScreen, title: 'SLOs Covered' },
    { name: 'More', icon: Menu, component: MoreScreen, title: 'More' },
  ],
  admin: [
    { name: 'Dashboard', icon: Home, component: AdminDashboard, title: 'Dashboard' },
    { name: 'SLOs', icon: BookOpen, component: AdminSLOsScreen, title: 'SLOs Overview' },
    { name: 'Teachers', icon: Users, component: AdminTeachersScreen, title: 'Teachers' },
    { name: 'Reports', icon: BarChart2, component: AdminReportsScreen, title: 'Student Progress' },
    { name: 'More', icon: Menu, component: MoreScreen, title: 'More' },
  ],
};

const OVERLAY_SCREENS = {
  Setup: { component: SetupScreen, title: 'Setup' },
  Missed: { component: MissedSLOsScreen, title: 'Missed SLOs' },
  DailyLog: { component: DailyLogScreen, title: 'Daily Activity Log' },
  Finance: { component: FinanceScreen, title: 'Finance' },
};

const NavContext = createContext(null);
export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within AppShell');
  return ctx;
}

function ShellInner() {
  const { session, data } = useApp();
  const { role } = useTheme();

  const tabs = TAB_CONFIG[role] || TAB_CONFIG.teacher;
  const [tab, setTab] = useState(tabs[0].name);
  const [tabParams, setTabParams] = useState(null);
  const [overlay, setOverlay] = useState(null); // { name, params }

  const nav = useMemo(
    () => ({
      params: tabParams,
      navigate(name, params) {
        if (OVERLAY_SCREENS[name]) {
          setOverlay({ name, params: params || null });
        } else {
          setTab(name);
          setTabParams(params || null);
        }
      },
      goBack() {
        setOverlay(null);
      },
    }),
    [tabParams]
  );

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[var(--role-bg)] border-t-[var(--role)]" />
      </div>
    );
  }

  if (!session.role) return <LoginScreen />;

  // Reset one-shot params once the active tab has read them.
  const activeTabCfg = tabs.find((t) => t.name === tab) || tabs[0];
  const ActiveTabComponent = activeTabCfg.component;

  const activeOverlay = overlay ? OVERLAY_SCREENS[overlay.name] : null;
  const headerTitle = activeOverlay ? activeOverlay.title : activeTabCfg.title;

  return (
    <NavContext.Provider value={nav}>
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[var(--bg)] sm:my-4 sm:min-h-[calc(100vh-2rem)] sm:overflow-hidden sm:rounded-[28px] sm:border sm:border-[var(--line)] sm:shadow-2xl">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-[var(--role)] px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-2">
            {activeOverlay ? (
              <button type="button" onClick={nav.goBack} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white">
                <ChevronLeft size={18} />
              </button>
            ) : null}
            <h1 className="truncate text-[16px] font-bold text-white">{headerTitle}</h1>
          </div>
          <HeaderActions />
        </header>

        <main className="flex flex-1 flex-col overflow-y-auto">
          {activeOverlay ? (
            <activeOverlay.component params={overlay.params} />
          ) : (
            <ActiveTabComponent params={tabParams} />
          )}
        </main>

        {!activeOverlay ? (
          <nav className="sticky bottom-0 z-30 flex border-t border-[var(--line)] bg-[var(--paper)]">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = t.name === tab;
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => {
                    setTab(t.name);
                    setTabParams(null);
                  }}
                  className="flex flex-1 flex-col items-center gap-1 py-2.5"
                >
                  <Icon size={18} className={active ? 'text-[var(--role-dark)]' : 'text-[var(--sub)]'} />
                  <span className={'text-[10.5px] font-semibold ' + (active ? 'text-[var(--role-dark)]' : 'text-[var(--sub)]')}>
                    {t.name}
                  </span>
                </button>
              );
            })}
          </nav>
        ) : null}
      </div>
    </NavContext.Provider>
  );
}

export default function AppShell() {
  return (
    <AppProvider>
      <ThemeProvider>
        <ToastProvider>
          <NotificationsProvider>
            <ShellInner />
          </NotificationsProvider>
        </ToastProvider>
      </ThemeProvider>
    </AppProvider>
  );
}
