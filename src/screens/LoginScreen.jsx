'use client';

import React, { useState } from 'react';
import { BookOpen, Users, Compass, RotateCcw, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { TextField, Label } from '@/components/Inputs';
import { PrimaryButton } from '@/components/Buttons';

const ROLES = [
  { role: 'teacher', icon: BookOpen, title: 'Teacher', sub: 'Feed SLOs, mark attendance' },
  { role: 'parent', icon: Users, title: 'Parent / Student', sub: 'Follow student progress & ledger' },
  { role: 'admin', icon: Compass, title: 'Admin / Principal', sub: 'Manage school, teachers & students' },
];

const ROLE_COLOR = {
  teacher: 'bg-[#1A4FA8] text-white',
  parent: 'bg-[#1A6B3E] text-white',
  admin: 'bg-[#12355A] text-white',
};

const ROLE_BORDER = {
  teacher: 'border-[#1A4FA8]',
  parent: 'border-[#1A6B3E]',
  admin: 'border-[#12355A]',
};

export default function LoginScreen() {
  const { session, login, authenticateUser } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const [role, setRole] = useState('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const canResume = session.role && session.name;

  function handleRoleChange(newRole) {
    setRole(newRole);
    setUsername('');
    setPassword('');
    setError('');
  }

  function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!role) { setError('Please pick a role to continue.'); return; }
    if (!username.trim()) { setError('Please enter your username.'); return; }
    if (!password) { setError('Please enter your password.'); return; }

    const result = authenticateUser(role, username.trim(), password);
    if (!result.success) {
      setError(result.error || 'Authentication failed. Please check your credentials.');
      return;
    }
    setError('');
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="relative w-full max-w-[440px] rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 shadow-2xl">

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute right-5 top-5 flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border-[1.5px] border-[var(--line)] bg-[var(--paper)] text-[var(--sub)] hover:text-[var(--ink)] transition"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Logo + Academy Name */}
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-[90px] w-[90px] items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md border border-[var(--line)]">
            <img src="/logo.png" alt="Pak Science Academy" className="h-[86px] w-[86px] object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#12355A]" style={{ color: isDark ? 'var(--ink)' : '#12355A' }}>
              Pak Science Academy
            </h1>
            <p className="mt-0.5 text-[12.5px] text-[var(--sub)]">
              Institute Management Portal
            </p>
          </div>
        </div>

        {/* Resume Session Banner */}
        {canResume && (
          <button
            type="button"
            onClick={() => login(session.role, session.name, session.studentId, session.teacherId, session.username)}
            className="mb-4 flex w-full items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 text-left hover:border-[#12355A] transition"
          >
            <RotateCcw size={14} className="shrink-0 text-[var(--role-dark)]" />
            <span className="text-[12.5px] font-semibold text-[var(--ink)]">
              Resume as {session.name} ({session.role[0].toUpperCase() + session.role.slice(1)})
            </span>
          </button>
        )}

        {/* Role Selector */}
        <div className="mb-4">
          <Label>Select Your Role</Label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {ROLES.map((r) => {
              const active = role === r.role;
              const Icon = r.icon;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleRoleChange(r.role)}
                  className={
                    'flex flex-col items-center justify-center rounded-2xl border-[1.5px] p-3 text-center transition ' +
                    (active
                      ? `${ROLE_BORDER[r.role]} bg-[var(--bg)] shadow-sm`
                      : 'border-[var(--line)] bg-[var(--paper)] opacity-70 hover:opacity-100')
                  }
                >
                  <div className={'mb-1.5 flex h-[36px] w-[36px] items-center justify-center rounded-xl ' + ROLE_COLOR[r.role]}>
                    <Icon size={17} />
                  </div>
                  <span className="text-[11.5px] font-bold text-[var(--ink)] leading-tight">{r.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <div>
            <Label>Username</Label>
            <TextField
              value={username}
              onChange={setUsername}
              placeholder={role === 'admin' ? 'Enter your admin username' : role === 'teacher' ? 'Enter your teacher username' : 'Enter your student username'}
            />
          </div>

          <div>
            <Label>Password</Label>
            <div className="relative">
              <TextField
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                type={showPassword ? 'text' : 'password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--sub)] hover:text-[var(--ink)]"
                title="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[12px] font-medium text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          <PrimaryButton title="Sign In to Portal" onClick={handleLogin} dark className="mt-1" />
        </form>

        {/* Footer */}
        <p className="mt-5 text-center text-[10.5px] text-[var(--sub)]">
          Pak Science Academy © {new Date().getFullYear()} · All rights reserved
        </p>
      </div>
    </div>
  );
}
