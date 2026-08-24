'use client';

import React, { useEffect, useState } from 'react';
import { KeyRound, UserCheck, Eye, EyeOff } from 'lucide-react';
import { PrimaryButton } from '@/components/Buttons';
import { TextField, SelectField, Label } from '@/components/Inputs';

const BLANK = {
  name: '',
  username: '',
  password: '',
  classId: '',
  assignedTeacherId: '',
  guardianName: '',
  guardianPhone: '',
  address: '',
  admissionDate: '',
  tuitionFee: '',
};

export default function StudentFormModal({
  open,
  title,
  initial,
  classOptions = [],
  teacherOptions = [],
  showFee = true,
  onCancel,
  onSave,
  saveLabel = 'Save',
}) {
  const [form, setForm] = useState(BLANK);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      const initName = initial?.name || '';
      const autoUsername = initName ? initName.toLowerCase().replace(/[^a-z0-9]/g, '_') : '';
      setForm({
        ...BLANK,
        classId: initial?.classId || classOptions[0]?.value || '',
        assignedTeacherId: initial?.assignedTeacherId || '',
        username: initial?.username || autoUsername,
        password: initial?.password || 'password123',
        ...initial,
        tuitionFee: initial?.tuitionFee != null ? String(initial.tuitionFee) : '',
      });
      setError('');
      setShowPassword(false);
    }
  }, [open, initial, classOptions]);

  if (!open) return null;

  function set(field, value) {
    setForm((f) => {
      const updated = { ...f, [field]: value };
      // Auto-suggest username if user hasn't typed a custom one
      if (field === 'name' && (!f.username || f.username === f.name.toLowerCase().replace(/[^a-z0-9]/g, '_'))) {
        updated.username = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
      }
      return updated;
    });
  }

  function handleSave() {
    const name = form.name.trim();
    if (!name) {
      setError('Student name is required.');
      return;
    }
    if (!form.classId) {
      setError('Please pick a class.');
      return;
    }
    const username = form.username.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const password = form.password.trim() || 'password123';
    const feeNum = form.tuitionFee === '' ? 0 : Number(form.tuitionFee);
    if (Number.isNaN(feeNum) || feeNum < 0) {
      setError('Tuition fee must be a valid, non-negative number.');
      return;
    }

    onSave({
      ...form,
      name,
      username,
      password,
      assignedTeacherId: form.assignedTeacherId || null,
      tuitionFee: feeNum,
    });
  }

  const teacherSelectOptions = [
    { label: 'Unassigned (No specific teacher)', value: '' },
    ...teacherOptions,
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center" onClick={onCancel}>
      <div
        className="animate-sheet-up max-h-[88vh] w-full max-w-md overflow-y-auto rounded-t-[24px] bg-[var(--paper)] p-5 pb-8 sm:rounded-[22px] sm:p-6 sm:pb-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15 sm:hidden" />
        <h3 className="mb-4 text-[17px] font-bold text-[var(--ink)]">{title}</h3>

        <div className="mb-3">
          <Label>Student Full Name *</Label>
          <TextField value={form.name} onChange={(v) => set('name', v)} placeholder="e.g. Ahmed Khan" />
        </div>

        <div className="mb-3 flex gap-2.5">
          <div className="flex-1">
            <Label>Class *</Label>
            <SelectField options={classOptions} value={form.classId} onChange={(v) => set('classId', v)} />
          </div>
          <div className="flex-1">
            <Label>Assigned Teacher</Label>
            <SelectField options={teacherSelectOptions} value={form.assignedTeacherId} onChange={(v) => set('assignedTeacherId', v)} />
          </div>
        </div>

        {/* Login Credentials Section */}
        <div className="mb-3 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-3.5">
          <div className="mb-2.5 flex items-center gap-1.5 text-[12px] font-bold text-[var(--role-dark)]">
            <KeyRound size={14} /> Student / Parent Login Credentials
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label>Username</Label>
              <TextField value={form.username} onChange={(v) => set('username', v)} placeholder="e.g. ahmed_khan" />
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
            Student/Parent will log in with this username and password.
          </p>
        </div>

        <div className="mb-3 flex gap-2.5">
          <div className="flex-1">
            <Label>Guardian Name</Label>
            <TextField value={form.guardianName} onChange={(v) => set('guardianName', v)} placeholder="e.g. Tariq Khan" />
          </div>
          <div className="flex-1">
            <Label>Guardian Phone</Label>
            <TextField value={form.guardianPhone} onChange={(v) => set('guardianPhone', v)} placeholder="03xx-xxxxxxx" />
          </div>
        </div>

        <div className="mb-3">
          <Label>Address</Label>
          <TextField value={form.address} onChange={(v) => set('address', v)} placeholder="Street, City" />
        </div>

        <div className="mb-3 flex gap-2.5">
          <div className="flex-1">
            <Label>Admission Date</Label>
            <TextField value={form.admissionDate} onChange={(v) => set('admissionDate', v)} type="date" />
          </div>
          {showFee ? (
            <div className="flex-1">
              <Label>Monthly Tuition Fee (Rs)</Label>
              <TextField value={form.tuitionFee} onChange={(v) => set('tuitionFee', v)} placeholder="5000" type="number" />
            </div>
          ) : null}
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
