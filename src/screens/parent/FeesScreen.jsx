'use client';

import React, { useState } from 'react';
import { Wallet, Printer, Upload, CheckCircle2, Clock, XCircle, ChevronRight, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useToast } from '@/context/ToastContext';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import StatBox, { StatGrid } from '@/components/StatBox';
import { PrimaryButton, SmallButton, IconButton } from '@/components/Buttons';
import { TextField, SelectField, DateField, Label } from '@/components/Inputs';
import { EmptyNote, SectionHeader } from '@/components/Lists';
import Pill from '@/components/Pill';
import { InfoModal } from '@/components/Modals';
import { printFeeVoucher } from '@/utils/printUtils';
import { todayISO } from '@/utils/helpers';

const PAYMENT_METHODS = ['Bank Transfer', 'EasyPaisa', 'JazzCash', 'Cash at Office'];
const STATUS_BADGE = {
  paid: ['teach', 'Paid'],
  partial: ['revise', 'Partial'],
  pending: ['absent', 'Pending'],
  'n/a': ['slo', 'N/A'],
};

export default function ParentFeesScreen() {
  const { data, session, submitFeePaymentProof, getStudentFeeHistory, getStudentFeePaid } = useApp();
  const toast = useToast();

  const student = data.students.find((s) => s.id === session.studentId) || data.students[0];
  const cls = student ? data.classes.find((c) => c.id === student.classId) : null;

  const currentMonth = todayISO().slice(0, 7);
  const currentMonthLabel = new Date(currentMonth + '-01T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long' });

  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Form states
  const fee = student?.tuitionFee || 0;
  const paidThisMonth = student ? getStudentFeePaid(student.id, currentMonth) : 0;
  const remainingThisMonth = Math.max(0, fee - paidThisMonth);
  const currentStatus = fee === 0 ? 'n/a' : paidThisMonth >= fee ? 'paid' : paidThisMonth > 0 ? 'partial' : 'pending';

  const [formMonth, setFormMonth] = useState(currentMonth);
  const [formMethod, setFormMethod] = useState('EasyPaisa');
  const [formRefId, setFormRefId] = useState('');
  const [formAmount, setFormAmount] = useState(remainingThisMonth > 0 ? String(remainingThisMonth) : String(fee));
  const [formDate, setFormDate] = useState(todayISO());
  const [formNote, setFormNote] = useState('');

  if (!student) {
    return (
      <ScreenBody>
        <Card><EmptyNote>No student account linked.</EmptyNote></Card>
      </ScreenBody>
    );
  }

  const feeHistory = getStudentFeeHistory(student.id, 6);
  const mySubmissions = (data.feeSubmissions || []).filter((s) => s.studentId === student.id);

  function handleSubmitProof() {
    const amt = parseFloat(formAmount);
    if (Number.isNaN(amt) || amt <= 0) {
      toast('Enter a valid payment amount.', 'error');
      return;
    }
    if (!formRefId.trim()) {
      toast('Please enter a Transaction Reference ID or Receipt Number.', 'error');
      return;
    }

    submitFeePaymentProof({
      studentId: student.id,
      month: formMonth,
      amount: amt,
      paymentMethod: formMethod,
      referenceId: formRefId.trim(),
      date: formDate,
      note: formNote.trim(),
    });

    toast('Payment proof submitted! Admin will verify and credit your fee.', 'success');
    setShowSubmitModal(false);
    setFormRefId('');
    setFormNote('');
  }

  const monthOptions = feeHistory.map((h) => ({
    label: h.monthLabel,
    value: h.month,
  }));

  const [pillKind, pillLabel] = STATUS_BADGE[currentStatus];

  return (
    <ScreenBody>
      {/* Current Month Overview Card */}
      <div className="mb-4 rounded-[22px] border border-[var(--line)] bg-[var(--paper)] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-[var(--sub)]">Current Month Tuition</p>
            <p className="text-[18px] font-extrabold text-[var(--ink)]">{currentMonthLabel}</p>
          </div>
          <Pill kind={pillKind} label={pillLabel} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[var(--bg)] p-3 text-center">
          <div>
            <p className="text-[10.5px] font-semibold text-[var(--sub)]">Tuition Fee</p>
            <p className="text-[14.5px] font-bold text-[var(--ink)]">Rs {fee.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-semibold text-[var(--sub)]">Paid</p>
            <p className="text-[14.5px] font-bold text-[var(--green)]">Rs {paidThisMonth.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10.5px] font-semibold text-[var(--sub)]">Balance</p>
            <p className={'text-[14.5px] font-bold ' + (remainingThisMonth > 0 ? 'text-[var(--red)]' : 'text-[var(--sub)]')}>
              Rs {remainingThisMonth.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => printFeeVoucher({ student, classObj: cls, month: currentMonth, fee, paid: paidThisMonth, status: currentStatus })}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--paper)] py-2.5 text-[12.5px] font-bold text-[var(--ink)] hover:bg-[var(--bg)]"
          >
            <Printer size={15} /> Print Fee Voucher
          </button>
          {currentStatus !== 'paid' && (
            <button
              type="button"
              onClick={() => {
                setFormAmount(String(remainingThisMonth > 0 ? remainingThisMonth : fee));
                setShowSubmitModal(true);
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--role)] py-2.5 text-[12.5px] font-bold text-white shadow-sm"
            >
              <Upload size={15} /> Submit Online Proof
            </button>
          )}
        </div>
      </div>

      {/* Online Payment Submissions Tracker */}
      {mySubmissions.length > 0 && (
        <Card title="Submitted Online Proofs">
          <div className="space-y-2.5">
            {mySubmissions.slice(0, 5).map((sub) => {
              const monthName = new Date(sub.month + '-01T00:00:00').toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
              return (
                <div key={sub.id} className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-bold text-[var(--ink)]">
                        Rs {sub.amount.toLocaleString()} · {sub.paymentMethod}
                      </p>
                      <p className="text-[11px] font-mono text-[var(--sub)]">Ref: {sub.referenceId}</p>
                      <p className="mt-0.5 text-[10.5px] text-[var(--sub)]">
                        {monthName} Fee · Submitted {new Date(sub.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {sub.status === 'pending' && (
                      <span className="flex items-center gap-1 rounded-full bg-[var(--amber-bg)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--amber)]">
                        <Clock size={11} /> Under Review
                      </span>
                    )}
                    {sub.status === 'approved' && (
                      <span className="flex items-center gap-1 rounded-full bg-[var(--green-bg)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--green)]">
                        <CheckCircle2 size={11} /> Approved
                      </span>
                    )}
                    {sub.status === 'rejected' && (
                      <span className="flex items-center gap-1 rounded-full bg-[var(--red-bg)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--red)]">
                        <XCircle size={11} /> Rejected
                      </span>
                    )}
                  </div>
                  {sub.rejectionReason && (
                    <p className="mt-2 rounded-lg bg-[var(--paper)] p-2 text-[11px] text-[var(--red)]">
                      <strong>Admin note:</strong> {sub.rejectionReason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Monthly Fee History Ledger */}
      <Card title="Monthly Fee History & Vouchers">
        {feeHistory.length === 0 ? (
          <EmptyNote>No fee history recorded.</EmptyNote>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {feeHistory.map((item) => {
              const [statusKind, statusTxt] = STATUS_BADGE[item.status];
              return (
                <div key={item.month} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-[13.5px] font-bold text-[var(--ink)]">{item.monthLabel}</p>
                    <p className="text-[11px] text-[var(--sub)]">
                      Rs {item.paid.toLocaleString()} of Rs {item.fee.toLocaleString()} paid
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill kind={statusKind} label={statusTxt} />
                    <button
                      type="button"
                      onClick={() => printFeeVoucher({ student, classObj: cls, month: item.month, fee: item.fee, paid: item.paid, status: item.status })}
                      title="Print Month Voucher"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--paper)] text-[var(--sub)] hover:text-[var(--ink)]"
                    >
                      <Printer size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Submit Online Proof Modal */}
      <InfoModal open={showSubmitModal} title="Submit Payment Proof" onClose={() => setShowSubmitModal(false)}>
        <div className="space-y-3">
          <div>
            <Label>Tuition Fee Month</Label>
            <SelectField options={monthOptions} value={formMonth} onChange={setFormMonth} />
          </div>

          <div>
            <Label>Payment Method</Label>
            <SelectField
              options={PAYMENT_METHODS.map((m) => ({ label: m, value: m }))}
              value={formMethod}
              onChange={setFormMethod}
            />
          </div>

          <div>
            <Label>Transaction Ref ID / Receipt No.</Label>
            <TextField
              value={formRefId}
              onChange={setFormRefId}
              placeholder="e.g. EP-9948210 or Bank Transfer Ref"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Amount Paid (Rs)</Label>
              <TextField
                value={formAmount}
                onChange={setFormAmount}
                type="number"
                placeholder="5000"
              />
            </div>
            <div className="flex-1">
              <Label>Payment Date</Label>
              <DateField value={formDate} onChange={setFormDate} />
            </div>
          </div>

          <div>
            <Label>Remarks / Account Name (Optional)</Label>
            <TextField
              value={formNote}
              onChange={setFormNote}
              placeholder="e.g. Paid via Meezan Bank of Tariq Khan"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              className="flex-1 rounded-xl border border-[var(--line)] py-2.5 text-[13px] font-bold text-[var(--sub)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitProof}
              className="flex-1 rounded-xl bg-[var(--role)] py-2.5 text-[13px] font-bold text-white shadow-sm"
            >
              Submit Proof
            </button>
          </div>
        </div>
      </InfoModal>
    </ScreenBody>
  );
}
