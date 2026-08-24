'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  Home, BookOpen, Calendar, BarChart2, Menu, Users, TrendingUp,
  GraduationCap, ChevronLeft, Award, Wallet, Settings, List,
  AlertTriangle, Printer, Sun, Moon, LogOut, ChevronRight,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

import { AppProvider, useApp } from '@/state/AppContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import HeaderActions from '@/components/HeaderActions';

import LoginScreen from '@/screens/LoginScreen';

import TeacherDashboard from '@/screens/teacher/DashboardScreen';
import TeacherSLOsScreen from '@/screens/teacher/SLOsScreen';
import TeacherAttendanceScreen from '@/screens/teacher/AttendanceScreen';
import TeacherExamsScreen from '@/screens/teacher/ExamsScreen';

import ParentDashboard from '@/screens/parent/DashboardScreen';
import ParentAttendanceScreen from '@/screens/parent/AttendanceScreen';
import ParentProgressScreen from '@/screens/parent/ProgressScreen';
import ParentSLOsScreen from '@/screens/parent/SLOsScreen';
import ParentFeesScreen from '@/screens/parent/FeesScreen';

import AdminDashboard from '@/screens/admin/DashboardScreen';
import AdminSLOsScreen from '@/screens/admin/SLOsScreen';
import AdminTeachersScreen from '@/screens/admin/TeachersScreen';
import AdminStudentsScreen from '@/screens/admin/StudentsScreen';
import AdminReportsScreen from '@/screens/admin/ReportsScreen';
import AdminExamsScreen from '@/screens/admin/ExamsScreen';

import MoreScreen from '@/screens/shared/MoreScreen';
import SetupScreen from '@/screens/shared/SetupScreen';
import MissedSLOsScreen from '@/screens/shared/MissedSLOsScreen';
import DailyLogScreen from '@/screens/shared/DailyLogScreen';
import FinanceScreen from '@/screens/admin/FinanceScreen';

const TAB_CONFIG = {
  teacher: [
    { name: 'Dashboard', icon: Home,      component: TeacherDashboard,       title: 'Dashboard' },
    { name: 'SLOs',      icon: BookOpen,  component: TeacherSLOsScreen,      title: 'SLOs' },
    { name: 'Attendance',icon: Calendar,  component: TeacherAttendanceScreen, title: 'Attendance' },
    { name: 'Exams',     icon: Award,     component: TeacherExamsScreen,      title: 'Exams & Grades' },
    { name: 'More',      icon: Menu,      component: MoreScreen,              title: 'More' },
  ],
  parent: [
    { name: 'Dashboard', icon: Home,       component: ParentDashboard,        title: 'Dashboard' },
    { name: 'Attendance',icon: Calendar,   component: ParentAttendanceScreen, title: 'Attendance' },
    { name: 'Fees',      icon: Wallet,     component: ParentFeesScreen,       title: 'Tuition Fees' },
    { name: 'Progress',  icon: TrendingUp, component: ParentProgressScreen,   title: 'Progress' },
    { name: 'More',      icon: Menu,       component: MoreScreen,             title: 'More' },
  ],
  admin: [
    { name: 'Dashboard', icon: Home,          component: AdminDashboard,      title: 'Dashboard' },
    { name: 'Teachers',  icon: Users,         component: AdminTeachersScreen, title: 'Teachers' },
    { name: 'Students',  icon: GraduationCap, component: AdminStudentsScreen, title: 'Students' },
    { name: 'SLOs',      icon: BookOpen,      component: AdminSLOsScreen,     title: 'SLOs Overview' },
    { name: 'More',      icon: Menu,          component: MoreScreen,          title: 'More' },
  ],
};

const OVERLAY_SCREENS = {
  Setup:    { component: SetupScreen,        title: 'Setup' },
  Missed:   { component: MissedSLOsScreen,   title: 'Missed SLOs' },
  DailyLog: { component: DailyLogScreen,     title: 'Daily Activity Log' },
  Finance:  { component: FinanceScreen,      title: 'Finance' },
  Students: { component: AdminStudentsScreen,title: 'Students' },
  Reports:  { component: AdminReportsScreen, title: 'Student Progress' },
  Exams:    { component: AdminExamsScreen,   title: 'Exams & Grades' },
  Fees:     { component: ParentFeesScreen,   title: 'Tuition Fees' },
};

// Desktop sidebar links — shown in collapsed sidebar beyond the main tabs
const ADMIN_SIDEBAR_EXTRA = [
  { label: 'Reports',  icon: BarChart2,     screen: 'Reports' },
  { label: 'Exams',    icon: Award,         screen: 'Exams' },
  { label: 'Finance',  icon: Wallet,        screen: 'Finance' },
  { label: 'Setup',    icon: Settings,      screen: 'Setup' },
  { label: 'Activity', icon: List,          screen: 'DailyLog' },
  { label: 'Missed',   icon: AlertTriangle, screen: 'Missed' },
];
const TEACHER_SIDEBAR_EXTRA = [
  { label: 'Activity', icon: List,          screen: 'DailyLog' },
  { label: 'Missed',   icon: AlertTriangle, screen: 'Missed' },
  { label: 'Setup',    icon: Settings,      screen: 'Setup' },
];

const NavContext = createContext(null);
export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within AppShell');
  return ctx;
}

// ── Desktop Sidebar ───────────────────────────────────────────────────────────
function DesktopSidebar({ tabs, tab, setTab, setTabParams, nav, session, dbStatus, isDark, toggleTheme, logout, collapsed, setCollapsed }) {
  const extraLinks = session.role === 'admin' ? ADMIN_SIDEBAR_EXTRA : TEACHER_SIDEBAR_EXTRA;
  return (
    <aside
      className={`hidden md:flex flex-col border-r border-[var(--line)] bg-[var(--paper)] transition-all duration-200 ${collapsed ? 'w-[64px]' : 'w-[220px]'} shrink-0`}
      style={{ minHeight: '100vh' }}
    >
      {/* Logo / School name */}
      <div className={`flex items-center gap-2.5 px-3 py-4 border-b border-[var(--line)] ${collapsed ? 'justify-center' : ''}`}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--role)] text-white font-black text-[13px]">
          SLO
        </div>
        {!collapsed && (
          <div>
            <p className="text-[12.5px] font-extrabold text-[var(--ink)] leading-none">SLO Tracker</p>
            <p className="text-[10px] text-[var(--sub)] mt-0.5 capitalize">{session.role} Portal</p>
          </div>
        )}
      </div>

      {/* Cloud Sync Status Indicator */}
      {!collapsed && (
        <div className="mx-2.5 my-2 flex items-center gap-1.5 rounded-lg bg-[var(--bg)] px-2.5 py-1 text-[10px] font-semibold text-[var(--sub)]">
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${
              dbStatus === 'connected'
                ? 'bg-[var(--green)] animate-pulse'
                : dbStatus === 'syncing'
                ? 'bg-[var(--amber)] animate-ping'
                : 'bg-[var(--sub)]'
            }`}
          />
          <span className="truncate">
            {dbStatus === 'connected' ? 'MongoDB Synced' : dbStatus === 'syncing' ? 'Syncing Cloud...' : 'Offline (Local)'}
          </span>
        </div>
      )}

      {/* Main nav tabs */}
      <nav className="flex-1 overflow-y-auto py-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = t.name === tab;
          return (
            <button
              key={t.name}
              type="button"
              onClick={() => { setTab(t.name); setTabParams(null); }}
              title={collapsed ? t.name : undefined}
              className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl mx-1 my-0.5 transition-colors ${collapsed ? 'justify-center' : ''} ${
                active
                  ? 'bg-[var(--role-bg)] text-[var(--role-dark)]'
                  : 'text-[var(--sub)] hover:bg-[var(--bg)] hover:text-[var(--ink)]'
              }`}
              style={{ width: collapsed ? 'calc(100% - 8px)' : 'calc(100% - 8px)' }}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="text-[13px] font-semibold truncate">{t.name}</span>}
            </button>
          );
        })}

        {/* Extra overlay links */}
        {extraLinks.length > 0 && (
          <>
            {!collapsed && (
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--sub)]">More</p>
            )}
            {collapsed && <div className="my-2 mx-3 h-px bg-[var(--line)]" />}
            {extraLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => nav.navigate(link.screen)}
                  title={collapsed ? link.label : undefined}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl mx-1 my-0.5 text-[var(--sub)] hover:bg-[var(--bg)] hover:text-[var(--ink)] transition-colors ${collapsed ? 'justify-center' : ''}`}
                  style={{ width: 'calc(100% - 8px)' }}
                >
                  <Icon size={16} className="shrink-0" />
                  {!collapsed && <span className="text-[13px] font-semibold truncate">{link.label}</span>}
                </button>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--line)] py-2">
        {/* User chip */}
        {!collapsed && (
          <div className="mx-2 mb-2 rounded-xl bg-[var(--role-bg)] px-3 py-2">
            <p className="text-[11px] font-bold text-[var(--role-dark)] truncate">{session.name}</p>
            <p className="text-[10px] text-[var(--sub)] capitalize">{session.role}</p>
          </div>
        )}
        <div className={`flex ${collapsed ? 'flex-col items-center gap-1' : 'gap-1 px-2'}`}>
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Light mode' : 'Dark mode'}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--bg)] text-[var(--sub)]"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--bg)] text-[var(--sub)]"
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
          <button
            type="button"
            onClick={logout}
            title="Log out"
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--red-bg)] text-[var(--sub)] hover:text-[var(--red)]"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Shell Inner ───────────────────────────────────────────────────────────────
function ShellInner() {
  const { session, data, dbStatus, logout } = useApp();
  const { role, isDark, toggleTheme } = useTheme();

  const tabs = TAB_CONFIG[role] || TAB_CONFIG.teacher;
  const [tab, setTab] = useState(tabs[0].name);
  const [tabParams, setTabParams] = useState(null);
  const [overlay, setOverlay] = useState(null); // { name, params }
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const activeTabCfg = tabs.find((t) => t.name === tab) || tabs[0];
  const ActiveTabComponent = activeTabCfg.component;

  const activeOverlay = overlay ? OVERLAY_SCREENS[overlay.name] : null;
  const headerTitle = activeOverlay ? activeOverlay.title : activeTabCfg.title;

  const showSidebar = session.role === 'teacher' || session.role === 'admin';

  return (
    <NavContext.Provider value={nav}>
      {/* Full-viewport flex container — sidebar + main */}
      <div className="flex min-h-screen w-full bg-[var(--bg)]">

        {/* ── Desktop Sidebar (md+) ── */}
        {showSidebar && (
          <DesktopSidebar
            tabs={tabs}
            tab={tab}
            setTab={setTab}
            setTabParams={setTabParams}
            nav={nav}
            session={session}
            dbStatus={dbStatus}
            isDark={isDark}
            toggleTheme={toggleTheme}
            logout={logout}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
          />
        )}

        {/* ── Main content column ── */}
        <div className="flex flex-1 flex-col min-h-screen">

          {/* Mobile: wrap in a centered card shell */}
          <div className={`flex flex-1 flex-col w-full ${!showSidebar ? 'md:mx-auto md:max-w-lg md:my-4 md:rounded-[28px] md:border md:border-[var(--line)] md:shadow-2xl md:overflow-hidden' : ''}`}>

            {/* Header */}
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

            {/* Page body */}
            <main className="flex flex-1 flex-col overflow-y-auto">
              <div className={`w-full ${showSidebar && !activeOverlay ? 'md:max-w-3xl md:mx-auto' : ''}`}>
                {activeOverlay ? (
                  <activeOverlay.component params={overlay.params} />
                ) : (
                  <ActiveTabComponent params={tabParams} />
                )}
              </div>
            </main>

            {/* Mobile bottom nav (hidden on md+ when sidebar is shown) */}
            {!activeOverlay ? (
              <nav className={`sticky bottom-0 z-30 flex border-t border-[var(--line)] bg-[var(--paper)] ${showSidebar ? 'md:hidden' : ''}`}>
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const active = t.name === tab;
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => { setTab(t.name); setTabParams(null); }}
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
        </div>
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

