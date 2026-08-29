'use client';

import React, { useState } from 'react';
import { RotateCcw, Sun, Moon, Eye, EyeOff, GraduationCap, Lock, ArrowRight } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { TextField, Label } from '@/components/Inputs';

export default function LoginScreen() {
  const { session, login, authenticateUser } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const canResume = session.role && session.name;

  function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your student username or roll number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    const result = authenticateUser(username.trim(), password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Invalid credentials. Please check your username and password.');
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 sm:p-6"
      style={{ background: 'var(--bg)' }}
    >
      <div className="relative w-full max-w-[440px] rounded-[32px] border border-[var(--line)] bg-[var(--paper)] p-7 sm:p-9 shadow-2xl transition-all">

        {/* Dark/Light Mode Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute right-5 top-5 flex h-[36px] w-[36px] items-center justify-center rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--paper)] text-[var(--sub)] hover:text-[var(--ink)] transition shadow-sm"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Academy Branding Header — Styled as Student Portal */}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-3.5 flex h-[96px] w-[96px] items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-md border border-[var(--line)]">
            <img
              src="/logo.png"
              alt="Pak Science Academy"
              className="h-full w-full object-contain"
            />
          </div>
          
          <h1
            className="text-[22px] font-black tracking-tight text-[#12355A]"
            style={{ color: isDark ? 'var(--ink)' : '#12355A' }}
          >
            Pak Science Academy
          </h1>
          
          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#12355A]/10 dark:bg-blue-950/40 px-3 py-1 text-[12px] font-bold text-[#12355A] dark:text-blue-300">
            <GraduationCap size={14} />
            <span>Student & Parent Portal</span>
          </div>

          <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--sub)]">
            Enter your credentials to access your daily attendance, syllabus progress, exams, and fee ledger.
          </p>
        </div>

        {/* Quick Resume Session Banner (if logged in before) */}
        {canResume && (
          <button
            type="button"
            onClick={() => login(session.role, session.name, session.studentId, session.teacherId, session.username)}
            className="mb-5 flex w-full items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-3.5 text-left hover:border-[#12355A] transition shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <RotateCcw size={15} className="shrink-0 text-[#12355A]" />
              <div className="truncate">
                <p className="text-[12.5px] font-bold text-[var(--ink)] truncate">
                  Resume as {session.name}
                </p>
                <p className="text-[10.5px] text-[var(--sub)] capitalize">
                  {session.role === 'parent' ? 'Student / Parent' : session.role} Account
                </p>
              </div>
            </div>
            <ArrowRight size={14} className="shrink-0 text-[var(--sub)]" />
          </button>
        )}

        {/* Single Universal Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
          <div>
            <Label>Student Username / Roll No</Label>
            <div className="relative mt-1">
              <TextField
                value={username}
                onChange={setUsername}
                placeholder="Enter username or roll number"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <Label>Password</Label>
            <div className="relative mt-1">
              <TextField
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--sub)] hover:text-[var(--ink)] transition p-1"
                title="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-2.5 text-[12px] font-semibold text-red-600 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#12355A] py-3 text-[13.5px] font-black text-white shadow-md hover:opacity-95 active:scale-[0.99] transition disabled:opacity-70"
          >
            <Lock size={15} />
            <span>{loading ? 'Authenticating...' : 'Sign In to Student Portal'}</span>
          </button>
        </form>

        {/* Clean Footer */}
        <div className="mt-6 border-t border-[var(--line)] pt-4 text-center">
          <p className="text-[11px] font-medium text-[var(--sub)]">
            Pak Science Academy · Academic Information System
          </p>
          <p className="text-[10px] text-[var(--sub)] mt-0.5 opacity-75">
            © {new Date().getFullYear()} All Rights Reserved
          </p>
        </div>

      </div>
    </div>
  );
}
