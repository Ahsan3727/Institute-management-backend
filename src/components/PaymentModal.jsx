'use client';

import React, { useEffect, useState } from 'react';
import { PrimaryButton } from '@/components/Buttons';
import { TextField, Label } from '@/components/Inputs';
import { todayISO } from '@/utils/helpers';

export default function PaymentModal({ open, title, subtitle, defaultAmount = 0, onCancel, onSave, saveLabel = 'Record Payment' }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setAmount(defaultAmount > 0 ? String(defaultAmount) : '');
      setDate(todayISO());
      setError('');
    }
  }, [open, defaultAmount]);

  if (!open) return null;

  function handleSave() {
    const n = Number(amount);
    if (Number.isNaN(n) || n <= 0) {
      setError('Enter a valid amount greater than zero.');
      return;
    }
    onSave(n, date);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-6" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-[20px] bg-[var(--paper)] p-[22px]" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-[16.5px] font-bold text-[var(--ink)]">{title}</h3>
        {subtitle ? <p className="mt-1 text-[12.5px] text-[var(--sub)]">{subtitle}</p> : null}

        <div className="mt-4">
          <Label>Amount (Rs)</Label>
          <TextField value={amount} onChange={setAmount} placeholder="5000" type="number" />
        </div>
        <div className="mt-3">
          <Label>Date</Label>
          <TextField value={date} onChange={setDate} type="date" />
        </div>
        {error ? <p className="mt-2 text-[12px] text-[var(--red)]">{error}</p> : null}

        <div className="mt-5 flex gap-2.5">
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
