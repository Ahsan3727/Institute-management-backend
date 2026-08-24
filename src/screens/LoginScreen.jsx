'use client';

import React, { useState } from 'react';
import { Target, BookOpen, Users, Compass, RotateCcw, Sun, Moon } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { TextField, SelectField, Label } from '@/components/Inputs';
import { PrimaryButton } from '@/components/Buttons';

const ROLES = [
  { role: 'teacher', icon: BookOpen, title: 'Teacher', sub: 'Feed SLOs, attendance, results' },
  { role: 'parent', icon: Users, title: 'Parent', sub: "Follow your child's ledger" },
  { role: 'admin', icon: Compass, title: 'Admin / Principal', sub: 'School-wide overview' },
];

const ROLE_DOT = { teacher: 'bg-[#4C1FA8]', parent: 'bg-[#1F4FA8]', admin: 'bg-[#0A6B3E]' };

export default function LoginScreen() {
  const { data, session, login } = useApp();
  const { isDark, toggleTheme } = useTheme();
  const [role, setRole] = useState(null);
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState(data.students[0] ? data.students[0].id : null);
  const [error, setError] = useState('');

  const canResume = session.role && session.name;

  const studentOptions = data.students.map((s) => {
    const c = data.classes.find((c) => c.id === s.classId);
    return { label: `${s.name} (${c ? c.name : ''})`, value: s.id };
  });

  function handleContinue() {
    if (!role) {
      setError('Please pick a role to continue.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter your name to continue.');
      return;
    }
    if (role === 'parent' && data.students.length === 0) {
      setError('No students set up yet — ask a teacher/admin to add one first.');
      return;
    }
    setError('');
    login(role, name.trim(), role === 'parent' ? studentId : null);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="relative w-full max-w-[400px] rounded-[26px] border border-[var(--line)] bg-[var(--paper)] p-[30px]">
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute right-[18px] top-[18px] flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border-[1.5px] border-[var(--line)] bg-[var(--paper)] text-[var(--sub)]"
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div className="mb-[18px] flex h-[50px] w-[50px] items-center justify-center rounded-2xl bg-[#4C1FA8]">
          <Target size={22} className="text-white" />
        </div>
        <h1 className="mb-1.5 text-2xl font-bold text-[var(--ink)]">SLO Tracker</h1>
        <p className="mb-[22px] text-[13px] leading-[19px] text-[var(--sub)]">
          Feed SLOs, mark attendance, and follow progress across Teacher, Parent, and Admin roles.
        </p>

        {canResume ? (
          <button
            type="button"
            onClick={() => login(session.role, session.name, session.studentId)}
            className="mb-4 flex w-full items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3 text-left"
          >
            <RotateCcw size={14} className="shrink-0 text-[var(--role-dark)]" />
            <span className="text-[12.5px] font-semibold text-[var(--ink)]">
              Resume as {session.name} ({session.role[0].toUpperCase() + session.role.slice(1)})
            </span>
          </button>
        ) : null}

        <div className="mb-[18px] flex flex-col gap-2.5">
          {ROLES.map((r) => {
            const active = role === r.role;
            const Icon = r.icon;
            return (
              <button
                key={r.role}
                type="button"
                onClick={() => setRole(r.role)}
                className={
                  'flex items-center gap-3 rounded-2xl border-[1.5px] p-3.5 text-left transition ' +
                  (active ? 'border-[var(--ink)] bg-[var(--bg)]' : 'border-[var(--line)] bg-[var(--paper)]')
                }
              >
                <div className={'flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl ' + ROLE_DOT[r.role]}>
                  <Icon size={17} className="text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14.5px] font-bold text-[var(--ink)]">{r.title}</p>
                  <p className="text-xs text-[var(--sub)]">{r.sub}</p>
                </div>
              </button>
            );
          })}
        </div>

        {role === 'parent' ? (
          <div className="mb-3.5">
            <Label>Your Child</Label>
            <SelectField options={studentOptions} value={studentId} onChange={setStudentId} />
          </div>
        ) : null}

        <div className="mb-3.5">
          <Label>Your Name</Label>
          <TextField value={name} onChange={setName} placeholder="Enter your name" />
        </div>

        {error ? <p className="mb-2 text-[12.5px] text-[var(--red)]">{error}</p> : null}

        <PrimaryButton title="Continue" onClick={handleContinue} dark className="mt-1.5" />
      </div>
    </div>
  );
}
