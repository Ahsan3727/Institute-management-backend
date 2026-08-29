'use client';

import React, { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Share2, RotateCcw, Printer, FileSpreadsheet, Download } from 'lucide-react';
import { printFeeVoucher, printSalarySlip } from '@/utils/printUtils';
import { exportFeeLedger } from '@/utils/excelUtils';
import { useApp } from '@/state/AppContext';
import { useToast } from '@/context/ToastContext';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import StatBox, { StatGrid } from '@/components/StatBox';
import { Segmented, SmallButton } from '@/components/Buttons';
import { EmptyNote } from '@/components/Lists';
import Pill from '@/components/Pill';
import PaymentModal from '@/components/PaymentModal';
import { todayISO } from '@/utils/helpers';

const STATUS_PILL = { paid: ['teach', 'Paid'], partial: ['revise', 'Partial'], pending: ['absent', 'Pending'], 'n/a': ['slo', 'N/A'] };

export default function FinanceScreen() {
  const { session } = useApp();

  if (session.role !== 'admin' && session.role !== 'superadmin') {
    return (
      <ScreenBody>
        <Card title="Restricted Access">
          <p className="text-[13px] text-[var(--sub)]">Only the Administrator can view full institutional finance details.</p>
        </Card>
      </ScreenBody>
    );
  }

  return <FinanceInner />;
}

function FinanceInner() {
  const { data, getFinanceSummary, getFeeRows, buildFinanceSummaryText } = useApp();
  const toast = useToast();
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [tab, setTab] = useState('fees');

  const summary = getFinanceSummary(month);
  const monthLabel = new Date(month + '-01T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long' });

  const pendingProofsCount = (data?.feeSubmissions || []).filter((s) => s.status === 'pending').length;

  async function handleShare() {
    const text = buildFinanceSummaryText(month);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text, title: 'Finance Summary' });
        return;
      } catch (e) {
        /* fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast('Finance summary copied to clipboard.', 'success');
    } catch (e) {
      toast('Could not share.', 'error');
    }
  }

  return (
    <ScreenBody>
      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-[var(--sub)]">Viewing</p>
            <p className="text-[14.5px] font-bold text-[var(--ink)]">{monthLabel}</p>
          </div>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border-[1.5px] border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-[13px] font-semibold text-[var(--ink)] outline-none"
          />
        </div>
        <div className="flex gap-2">
          <SmallButton title="Share summary" onClick={handleShare} className="flex-1" />
          <button
            type="button"
            onClick={() => exportFeeLedger(getFeeRows(month), data.classes, month)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3 py-2 text-[12px] font-bold text-[var(--ink)] shadow-sm hover:bg-[var(--bg)]"
          >
            <Download size={13} /> Export Ledger (.xlsx)
          </button>
        </div>
      </Card>

      <div className="mb-4 rounded-[18px] border border-[var(--line)] bg-[var(--role-bg)] p-[18px]">
        <div className="mb-1 flex items-center gap-2">
          <Wallet size={16} className="text-[var(--role-dark)]" />
          <p className="text-[12.5px] font-bold uppercase tracking-wide text-[var(--sub)]">Net Balance This Month</p>
        </div>
        <p className={'text-[28px] font-extrabold ' + (summary.netBalance >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]')}>
          Rs {summary.netBalance.toLocaleString()}
        </p>
        <p className="mt-1 text-[11.5px] text-[var(--sub)]">Income collected minus payroll paid, for {monthLabel}.</p>
      </div>

      <StatGrid>
        <StatBox value={`Rs ${summary.collectedIncome.toLocaleString()}`} label="Income Collected" colorClass="text-[var(--green)]" />
        <StatBox value={`Rs ${summary.pendingIncome.toLocaleString()}`} label="Income Pending" colorClass="text-[var(--red)]" />
        <StatBox value={`Rs ${summary.paidPayroll.toLocaleString()}`} label="Salaries Paid" colorClass="text-[var(--green)]" />
        <StatBox value={`Rs ${summary.pendingPayroll.toLocaleString()}`} label="To Pay Teachers" colorClass="text-[var(--red)]" />
      </StatGrid>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { label: 'Student Fees', value: 'fees' },
          { label: 'Teacher Salaries', value: 'salaries' },
          { label: `Online Proofs${pendingProofsCount > 0 ? ` (${pendingProofsCount})` : ''}`, value: 'proofs' },
        ]}
      />

      {tab === 'fees' && <FeesPanel month={month} />}
      {tab === 'salaries' && <SalariesPanel month={month} />}
      {tab === 'proofs' && <ProofSubmissionsPanel />}
    </ScreenBody>
  );
}

function FeesPanel({ month }) {
  const { data, getFeeRows, recordFeePayment, clearFeePaymentsForMonth } = useApp();
  const toast = useToast();
  const [payTarget, setPayTarget] = useState(null); // {student, fee, paid}
  const rows = getFeeRows(month);

  return (
    <Card title="Tuition Fee Collection">
      {rows.length === 0 ? (
        <EmptyNote>No students yet — add some in Setup first.</EmptyNote>
      ) : (
        rows.map(({ student, fee, paid, status }) => {
          const [pillKind, pillLabel] = STATUS_PILL[status];
          const remaining = Math.max(0, fee - paid);
          return (
            <div key={student.id} className="border-b border-[var(--line)] py-3 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-[var(--ink)]">{student.name}</p>
                  <p className="text-[11px] text-[var(--sub)]">
                    Rs {paid.toLocaleString()} of Rs {fee.toLocaleString()} paid
                  </p>
                </div>
                <Pill kind={pillKind} label={pillLabel} />
              </div>
              {status !== 'n/a' ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {status !== 'paid' ? (
                    <SmallButton
                      title={status === 'partial' ? `Pay Remaining Rs ${remaining.toLocaleString()}` : 'Mark Paid'}
                      onClick={() => setPayTarget({ student, fee, paid, remaining })}
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      const cls = data.classes.find((c) => c.id === student.classId);
                      printFeeVoucher({ student, classObj: cls, month, fee, paid, status });
                    }}
                    className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-[var(--line)] px-3 py-2 text-[12px] font-bold text-[var(--sub)]"
                  >
                    <Printer size={12} /> Voucher
                  </button>
                  {paid > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        clearFeePaymentsForMonth(student.id, month);
                        toast('Payment record cleared for this month.', 'success');
                      }}
                      className="flex items-center gap-1 rounded-lg border-[1.5px] border-[var(--line)] px-3 py-2 text-[12px] font-bold text-[var(--sub)]"
                    >
                      <RotateCcw size={12} /> Undo
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })
      )}

      <PaymentModal
        open={!!payTarget}
        title={`Record fee payment`}
        subtitle={payTarget ? `${payTarget.student.name} · remaining Rs ${payTarget.remaining.toLocaleString()}` : ''}
        defaultAmount={payTarget?.remaining || 0}
        onCancel={() => setPayTarget(null)}
        onSave={(amount, date) => {
          recordFeePayment(payTarget.student.id, month, amount, date);
          toast('Fee payment recorded.', 'success');
          setPayTarget(null);
        }}
      />
    </Card>
  );
}

function SalariesPanel({ month }) {
  const { getSalaryRows, recordSalaryPayment, clearSalaryPaymentsForMonth } = useApp();
  const toast = useToast();
  const [payTarget, setPayTarget] = useState(null);
  const rows = getSalaryRows(month);

  return (
    <Card title="Teacher Salary Payments">
      {rows.length === 0 ? (
        <EmptyNote>No teachers yet — add some in the Teachers tab first.</EmptyNote>
      ) : (
        rows.map(({ teacher, salary, paid, status }) => {
          const [pillKind, pillLabel] = STATUS_PILL[status];
          const remaining = Math.max(0, salary - paid);
          return (
            <div key={teacher.id} className="border-b border-[var(--line)] py-3 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold text-[var(--ink)]">{teacher.name}</p>
                  <p className="text-[11px] text-[var(--sub)]">
                    Rs {paid.toLocaleString()} of Rs {salary.toLocaleString()} paid
                  </p>
                </div>
                <Pill kind={pillKind} label={pillLabel} />
              </div>
              {status !== 'n/a' ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {status !== 'paid' ? (
                    <SmallButton
                      title={status === 'partial' ? `Pay Remaining Rs ${remaining.toLocaleString()}` : 'Mark Paid'}
                      onClick={() => setPayTarget({ teacher, salary, paid, remaining })}
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => printSalarySlip({ teacher, month, salary, paid, status })}
                    className="flex items-center gap-1.5 rounded-lg border-[1.5px] border-[var(--line)] px-3 py-2 text-[12px] font-bold text-[var(--sub)]"
                  >
                    <Printer size={12} /> Salary Slip
                  </button>
                  {paid > 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        clearSalaryPaymentsForMonth(teacher.id, month);
                        toast('Payment record cleared for this month.', 'success');
                      }}
                      className="flex items-center gap-1 rounded-lg border-[1.5px] border-[var(--line)] px-3 py-2 text-[12px] font-bold text-[var(--sub)]"
                    >
                      <RotateCcw size={12} /> Undo
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })
      )}

      <PaymentModal
        open={!!payTarget}
        title="Record salary payment"
        subtitle={payTarget ? `${payTarget.teacher.name} · remaining Rs ${payTarget.remaining.toLocaleString()}` : ''}
        defaultAmount={payTarget?.remaining || 0}
        saveLabel="Record Payment"
        onCancel={() => setPayTarget(null)}
        onSave={(amount, date) => {
          recordSalaryPayment(payTarget.teacher.id, month, amount, date);
          toast('Salary payment recorded.', 'success');
          setPayTarget(null);
        }}
      />
    </Card>
  );
}

function ProofSubmissionsPanel() {
  const { data, approveFeeSubmission, rejectFeeSubmission } = useApp();
  const toast = useToast();
  const [filter, setFilter] = useState('all'); // all | pending | approved | rejected
  const [rejectTarget, setRejectTarget] = useState(null); // submission object
  const [rejectReason, setRejectReason] = useState('');

  const submissions = data.feeSubmissions || [];
  const filtered = submissions.filter((s) => (filter === 'all' ? true : s.status === filter));

  function handleApprove(sub) {
    approveFeeSubmission(sub.id);
    const student = data.students.find((s) => s.id === sub.studentId);
    toast(`Payment of Rs ${sub.amount.toLocaleString()} approved & credited for ${student?.name || 'Student'}.`, 'success');
  }

  function handleConfirmReject() {
    if (!rejectTarget) return;
    rejectFeeSubmission(rejectTarget.id, rejectReason.trim() || 'Payment details could not be verified.');
    toast('Payment proof marked as rejected.', 'success');
    setRejectTarget(null);
    setRejectReason('');
  }

  return (
    <Card title="Parent Online Payment Proofs">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {[
          { label: 'All', value: 'all' },
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ].map((btn) => (
          <button
            key={btn.value}
            type="button"
            onClick={() => setFilter(btn.value)}
            className={
              'rounded-lg px-3 py-1.5 text-[12px] font-bold ' +
              (filter === btn.value
                ? 'bg-[var(--role)] text-white'
                : 'bg-[var(--bg)] text-[var(--sub)] hover:text-[var(--ink)]')
            }
          >
            {btn.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyNote>No payment proofs found.</EmptyNote>
      ) : (
        <div className="divide-y divide-[var(--line)]">
          {filtered.map((sub) => {
            const student = data.students.find((s) => s.id === sub.studentId);
            const cls = student ? data.classes.find((c) => c.id === student.classId) : null;
            const monthLabel = new Date(sub.month + '-01T00:00:00').toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

            return (
              <div key={sub.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold text-[var(--ink)]">
                      {student ? student.name : 'Unknown Student'}
                      {cls ? ` (${cls.name})` : ''}
                    </p>
                    <p className="text-[12px] font-semibold text-[var(--role-dark)]">
                      Rs {sub.amount.toLocaleString()} · {sub.paymentMethod}
                    </p>
                    <p className="text-[11px] font-mono text-[var(--sub)]">Ref: {sub.referenceId}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--sub)]">
                      For: {monthLabel} · Paid on {sub.date}
                    </p>
                    {sub.note && (
                      <p className="mt-1 text-[11.5px] italic text-[var(--sub)]">"{sub.note}"</p>
                    )}
                    {sub.rejectionReason && (
                      <p className="mt-1 text-[11px] font-semibold text-[var(--red)]">
                        Rejection reason: {sub.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    {sub.status === 'pending' && (
                      <span className="rounded-full bg-[var(--amber-bg)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--amber)]">
                        Pending
                      </span>
                    )}
                    {sub.status === 'approved' && (
                      <span className="rounded-full bg-[var(--green-bg)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--green)]">
                        Approved
                      </span>
                    )}
                    {sub.status === 'rejected' && (
                      <span className="rounded-full bg-[var(--red-bg)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--red)]">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>

                {sub.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(sub)}
                      className="flex-1 rounded-xl bg-[var(--green)] py-2 text-[12px] font-bold text-white shadow-sm hover:opacity-95"
                    >
                      Approve & Credit Fee
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRejectTarget(sub);
                        setRejectReason('');
                      }}
                      className="rounded-xl border border-[var(--line)] bg-[var(--paper)] px-3.5 py-2 text-[12px] font-bold text-[var(--red)] hover:bg-[var(--red-bg)]"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--paper)] p-5 shadow-2xl">
            <p className="text-[15px] font-bold text-[var(--ink)]">Reject Payment Proof?</p>
            <p className="mt-1 text-[12px] text-[var(--sub)]">
              Specify a reason so the parent knows why their submission was declined.
            </p>
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Transaction ID not found in bank statement"
              className="mt-3 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-3.5 py-2.5 text-[13px] text-[var(--ink)] outline-none"
            />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="flex-1 rounded-xl border border-[var(--line)] py-2.5 text-[12.5px] font-bold text-[var(--sub)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 rounded-xl bg-[var(--red)] py-2.5 text-[12.5px] font-bold text-white"
              >
                Reject Proof
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

