'use client';

import React, { useEffect, useState } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { PrimaryButton } from '@/components/Buttons';
import { TextField, Label } from '@/components/Inputs';

const BLANK = {
  name: '',
  username: '',
  password: '',
  phone: '',
  email: '',
  qualification: '',
  joiningDate: '',
  salary: '',
};

export default function TeacherFormModal({ open, title, initial, onCancel, onSave, saveLabel = 'Save' }) {
  const [form, setForm] = useState(BLANK);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      const initName = initial?.name || '';
      const autoUsername = initName ? initName.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
      setForm({
        ...BLANK,
        username: initial?.username || autoUsername,
        password: initial?.password || 'password123',
        ...initial,
        salary: initial?.salary != null ? String(initial.salary) : '',
      });
      setError('');
      setShowPassword(false);
    }
  }, [open, initial]);

  if (!open) return null;

  function set(field, value) {
    setForm((f) => {
      const updated = { ...f, [field]: value };
      if (field === 'name' && (!f.username || f.username === f.name.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
        updated.username = value.toLowerCase().replace(/[^a-z0-9]/g, '');
      }
      return updated;
    });
  }

  function handleSave() {
    const name = form.name.trim();
    if (!name) {
      setError('Teacher name is required.');
      return;
    }
    const username = form.username.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const password = form.password.trim() || 'password123';
    const salaryNum = form.salary === '' ? 0 : Number(form.salary);
    if (Number.isNaN(salaryNum) || salaryNum < 0) {
      setError('Salary must be a valid, non-negative number.');
      return;
    }
    onSave({
      ...form,
      name,
      username,
      password,
      salary: salaryNum,
    });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center" onClick={onCancel}>
      <div
        className="animate-sheet-up max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[24px] bg-[var(--paper)] p-5 pb-8 sm:rounded-[22px] sm:p-6 sm:pb-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15 sm:hidden" />
        <h3 className="mb-4 text-[17px] font-bold text-[var(--ink)]">{title}</h3>

        <div className="mb-3">
          <Label>Teacher Full Name *</Label>
          <TextField value={form.name} onChange={(v) => set('name', v)} placeholder="e.g. Ali Raza" />
        </div>

        {/* Login Credentials Section */}
        <div className="mb-3 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5 text-[12px] font-bold text-[var(--role-dark)]">
            <KeyRound size={14} /> Teacher Login Credentials
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label>Username</Label>
              <TextField value={form.username} onChange={(v) => set('username', v)} placeholder="e.g. ali" />
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <TextField
                  value={form.password}
                  onChange={(v) => set('password', v)}
                  placeholder="e.g. password123"
                  type={showPassword ? 'text' : 'password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--sub)] hover:text-[var(--ink)]"
                  title="Toggle password view"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <p className="mt-1.5 text-[10.5px] text-[var(--sub)]">
            Teacher will log in with this username and password.
          </p>
        </div>

        <div className="mb-3 flex gap-2.5">
          <div className="flex-1">
            <Label>Phone</Label>
            <TextField value={form.phone} onChange={(v) => set('phone', v)} placeholder="03xx-xxxxxxx" />
          </div>
          <div className="flex-1">
            <Label>Email</Label>
            <TextField value={form.email} onChange={(v) => set('email', v)} placeholder="name@school.edu" type="email" />
          </div>
        </div>

        <div className="mb-3">
          <Label>Qualification</Label>
          <TextField value={form.qualification} onChange={(v) => set('qualification', v)} placeholder="e.g. M.Sc Mathematics" />
        </div>

        <div className="mb-3 flex gap-2.5">
          <div className="flex-1">
            <Label>Joining Date</Label>
            <TextField value={form.joiningDate} onChange={(v) => set('joiningDate', v)} type="date" />
          </div>
          <div className="flex-1">
            <Label>Monthly Salary (Rs)</Label>
            <TextField value={form.salary} onChange={(v) => set('salary', v)} placeholder="45000" type="number" />
          </div>
        </div>

        {error ? <p className="mb-2 text-[12px] font-medium text-[var(--red)]">{error}</p> : null}

        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border-[1.5px] border-[var(--line)] py-3 text-[14px] font-bold text-[var(--ink)]"
          >
            Cancel
          </button>
          <PrimaryButton title={saveLabel} onClick={handleSave} className="flex-1" />
        </div>
      </div>
    </div>
  );
}
