'use client';

import React, { useState } from 'react';
import { Target, BookOpen, Users, Compass, RotateCcw, Sun, Moon, KeyRound, Eye, EyeOff, Sparkles, CheckCircle2 } from 'lucide-react';
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
  teacher: 'bg-[#4C1FA8] text-white',
  parent: 'bg-[#1F4FA8] text-white',
  admin: 'bg-[#0A6B3E] text-white',
};

const ROLE_BORDER = {
  teacher: 'border-[#4C1FA8]',
  parent: 'border-[#1F4FA8]',
  admin: 'border-[#0A6B3E]',
};

export default function LoginScreen() {
  const { data, session, login, authenticateUser } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const [role, setRole] = useState('admin');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const canResume = session.role && session.name;

  function handleRoleChange(newRole) {
    setRole(newRole);
    setError('');
    // Provide sensible default credential suggestions for easy testing
    if (newRole === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else if (newRole === 'teacher') {
      const firstTeacher = data.teachers[0];
      setUsername(firstTeacher?.username || 'ali');
      setPassword(firstTeacher?.password || 'password123');
    } else if (newRole === 'parent') {
      const firstStudent = data.students[0];
      setUsername(firstStudent?.username || 'ahmed_khan');
      setPassword(firstStudent?.password || 'password123');
    }
  }

  function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!role) {
      setError('Please pick a role to continue.');
      return;
    }
    if (!username.trim()) {
      setError('Please enter your username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    const result = authenticateUser(role, username.trim(), password);
    if (!result.success) {
      setError(result.error || 'Authentication failed. Please check your credentials.');
      return;
    }
    setError('');
  }

  function fillAccount(r, u, p) {
    setRole(r);
    setUsername(u);
    setPassword(p);
    setError('');
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="relative w-full max-w-[420px] rounded-[26px] border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-8 shadow-xl">
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute right-[18px] top-[18px] flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border-[1.5px] border-[var(--line)] bg-[var(--paper)] text-[var(--sub)] hover:text-[var(--ink)]"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="mb-4 flex h-[50px] w-[50px] items-center justify-center rounded-2xl bg-[#0A6B3E] shadow-sm">
          <Target size={24} className="text-white" />
        </div>
        <h1 className="mb-1 text-2xl font-bold text-[var(--ink)]">Institute Management</h1>
        <p className="mb-5 text-[13px] leading-[19px] text-[var(--sub)]">
          Sign in to access your administrative, teaching, or student portal.
        </p>

        {canResume ? (
          <button
            type="button"
            onClick={() => login(session.role, session.name, session.studentId, session.teacherId, session.username)}
            className="mb-4 flex w-full items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 text-left hover:border-[var(--role)] transition"
          >
            <RotateCcw size={14} className="shrink-0 text-[var(--role-dark)]" />
            <span className="text-[12.5px] font-semibold text-[var(--ink)]">
              Resume as {session.name} ({session.role[0].toUpperCase() + session.role.slice(1)})
            </span>
          </button>
        ) : null}

        {/* Role Selector */}
        <div className="mb-4 flex flex-col gap-2">
          <Label>Select Role</Label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => {
              const active = role === r.role;
              const Icon = r.icon;
              return (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleRoleChange(r.role)}
                  className={
                    'flex flex-col items-center justify-center rounded-2xl border-[1.5px] p-2.5 text-center transition ' +
                    (active
                      ? `${ROLE_BORDER[r.role]} bg-[var(--bg)] shadow-sm`
                      : 'border-[var(--line)] bg-[var(--paper)] opacity-75 hover:opacity-100')
                  }
                >
                  <div className={'mb-1.5 flex h-[34px] w-[34px] items-center justify-center rounded-xl ' + ROLE_COLOR[r.role]}>
                    <Icon size={16} />
                  </div>
                  <span className="text-[12px] font-bold text-[var(--ink)] leading-tight">{r.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <div>
            <Label>Username or Name</Label>
            <TextField
              value={username}
              onChange={setUsername}
              placeholder={role === 'admin' ? 'admin' : role === 'teacher' ? 'ali or teacher username' : 'student username'}
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
                title="Toggle password view"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error ? <p className="text-[12px] font-medium text-[var(--red)]">{error}</p> : null}

          <PrimaryButton title="Sign In" onClick={handleLogin} dark className="mt-1.5" />
        </form>

        {/* Demo Accounts Quick-Select Accordion */}
        <div className="mt-5 border-t border-[var(--line)] pt-3.5">
          <button
            type="button"
            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
            className="flex w-full items-center justify-between text-left text-[11.5px] font-semibold text-[var(--sub)] hover:text-[var(--ink)]"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-[var(--amber)]" />
              Quick Test Accounts
            </span>
            <span>{showDemoAccounts ? 'Hide' : 'Show'}</span>
          </button>

          {showDemoAccounts ? (
            <div className="mt-2.5 flex flex-col gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-2 text-[11px]">
              <button
                type="button"
                onClick={() => fillAccount('admin', 'admin', 'admin123')}
                className="flex items-center justify-between rounded-lg p-1.5 text-left hover:bg-[var(--paper)] transition"
              >
                <span className="font-semibold text-[var(--ink)]">👑 Admin</span>
                <span className="font-mono text-[var(--sub)]">admin / admin123</span>
              </button>
              <button
                type="button"
                onClick={() => fillAccount('teacher', data.teachers[0]?.username || 'ali', 'password123')}
                className="flex items-center justify-between rounded-lg p-1.5 text-left hover:bg-[var(--paper)] transition"
              >
                <span className="font-semibold text-[var(--ink)]">👩‍🏫 Teacher ({data.teachers[0]?.name || 'Mr. Ali'})</span>
                <span className="font-mono text-[var(--sub)]">{data.teachers[0]?.username || 'ali'} / password123</span>
              </button>
              <button
                type="button"
                onClick={() => fillAccount('parent', data.students[0]?.username || 'ahmed_khan', 'password123')}
                className="flex items-center justify-between rounded-lg p-1.5 text-left hover:bg-[var(--paper)] transition"
              >
                <span className="font-semibold text-[var(--ink)]">🎓 Student ({data.students[0]?.name || 'Ahmed Khan'})</span>
                <span className="font-mono text-[var(--sub)]">{data.students[0]?.username || 'ahmed_khan'} / password123</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
