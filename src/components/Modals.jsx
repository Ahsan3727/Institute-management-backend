'use client';

import React, { useEffect, useState } from 'react';
import { PrimaryButton } from '@/components/Buttons';
import { TextField, SelectField, Label } from '@/components/Inputs';

export function ConfirmModal({ open, title, body, confirmLabel = 'Delete', danger = true, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-6" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-[20px] bg-[var(--paper)] p-[22px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-[16.5px] font-bold text-[var(--ink)]">{title}</h3>
        {body ? <p className="mt-2 text-[13px] leading-[19px] text-[var(--sub)]">{body}</p> : null}
        <div className="mt-5 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border-[1.5px] border-[var(--line)] py-3 text-[14px] font-bold text-[var(--ink)]"
          >
            Cancel
          </button>
          <PrimaryButton
            title={confirmLabel}
            onClick={onConfirm}
            className={danger ? '!bg-[var(--red)] flex-1' : 'flex-1'}
          />
        </div>
      </div>
    </div>
  );
}

export function InfoModal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="animate-sheet-up max-h-[75vh] w-full max-w-md overflow-auto rounded-t-[22px] bg-[var(--paper)] p-5 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3.5 h-1 w-10 rounded-full bg-black/15" />
        <h3 className="mb-3 text-[16.5px] font-bold text-[var(--ink)]">{title}</h3>
        {children}
      </div>
    </div>
  );
}

// Rename / edit modal — a single text field, with an optional secondary
// select (e.g. reassigning a student to a different class).
export function PromptModal({
  open,
  title,
  label = 'Name',
  initialValue = '',
  onCancel,
  onSave,
  saveLabel = 'Save',
  classOptions,
  classLabel = 'Class',
  initialClassId,
}) {
  const [value, setValue] = useState(initialValue);
  const [classId, setClassId] = useState(initialClassId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setClassId(initialClassId);
      setError('');
    }
  }, [open, initialValue, initialClassId]);

  if (!open) return null;

  function handleSave() {
    const v = value.trim();
    if (!v) {
      setError('This can\u2019t be empty.');
      return;
    }
    onSave(v, classId);
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-6" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-[20px] bg-[var(--paper)] p-[22px]" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-[16.5px] font-bold text-[var(--ink)]">{title}</h3>

        <Label>{label}</Label>
        <TextField value={value} onChange={setValue} placeholder={label} className="mb-1" />
        {error ? <p className="mb-2 text-[12px] text-[var(--red)]">{error}</p> : null}

        {classOptions ? (
          <div className="mt-3">
            <Label>{classLabel}</Label>
            <SelectField options={classOptions} value={classId} onChange={setClassId} />
          </div>
        ) : null}

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
