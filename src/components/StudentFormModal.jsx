'use client';

import React, { useEffect, useState } from 'react';
import { PrimaryButton } from '@/components/Buttons';
import { TextField, SelectField, Label } from '@/components/Inputs';

const BLANK = { name: '', classId: '', guardianName: '', guardianPhone: '', address: '', admissionDate: '', tuitionFee: '' };

export default function StudentFormModal({ open, title, initial, classOptions, showFee, onCancel, onSave, saveLabel = 'Save' }) {
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm({
        ...BLANK,
        classId: classOptions[0]?.value || '',
        ...initial,
        tuitionFee: initial?.tuitionFee != null ? String(initial.tuitionFee) : '',
      });
      setError('');
    }
  }, [open, initial, classOptions]);

  if (!open) return null;

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
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
    const feeNum = form.tuitionFee === '' ? 0 : Number(form.tuitionFee);
    if (Number.isNaN(feeNum) || feeNum < 0) {
      setError('Tuition fee must be a valid, non-negative number.');
      return;
    }
    onSave({ ...form, name, tuitionFee: feeNum });
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
          <Label>Student Name *</Label>
          <TextField value={form.name} onChange={(v) => set('name', v)} placeholder="e.g. Ahmed Khan" />
        </div>

        <div className="mb-3">
          <Label>Class *</Label>
          <SelectField options={classOptions} value={form.classId} onChange={(v) => set('classId', v)} />
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

        {!showFee ? (
          <p className="mb-3 text-[11.5px] text-[var(--sub)]">Tuition fee is managed by Admin under Finance.</p>
        ) : null}

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
