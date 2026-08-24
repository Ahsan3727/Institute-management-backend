'use client';

import React, { useEffect, useState } from 'react';
import { PrimaryButton } from '@/components/Buttons';
import { TextField, Label } from '@/components/Inputs';

const BLANK = { name: '', phone: '', email: '', qualification: '', joiningDate: '', salary: '' };

export default function TeacherFormModal({ open, title, initial, onCancel, onSave, saveLabel = 'Save' }) {
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({ ...BLANK, ...initial, salary: initial?.salary != null ? String(initial.salary) : '' });
      setError('');
    }
  }, [open, initial]);

  if (!open) return null;

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSave() {
    const name = form.name.trim();
    if (!name) {
      setError('Teacher name is required.');
      return;
    }
    const salaryNum = form.salary === '' ? 0 : Number(form.salary);
    if (Number.isNaN(salaryNum) || salaryNum < 0) {
      setError('Salary must be a valid, non-negative number.');
      return;
    }
    onSave({ ...form, name, salary: salaryNum });
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center" onClick={onCancel}>
      <div
        className="animate-sheet-up max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-t-[22px] bg-[var(--paper)] p-5 pb-8 sm:rounded-[20px] sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15 sm:hidden" />
        <h3 className="mb-4 text-[16.5px] font-bold text-[var(--ink)]">{title}</h3>

        <div className="mb-3">
          <Label>Full Name *</Label>
          <TextField value={form.name} onChange={(v) => set('name', v)} placeholder="e.g. Ali Raza" />
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

        {error ? <p className="mb-2 text-[12px] text-[var(--red)]">{error}</p> : null}

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
