'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import Card from '@/components/Card';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import { EmptyNote, SectionHeader } from '@/components/Lists';
import { fmtDate } from '@/utils/helpers';

export default function StudentProgressBlock({ studentId, showMissed, onViewAllMissed }) {
  const { data, slosCoveredSet, computeMissedSlos } = useApp();

  const tests = data.tests.filter((t) => t.studentId === studentId).sort((a, b) => a.date.localeCompare(b.date));
  const attendance = data.attendance.filter((a) => a.studentId === studentId);
  const avg = tests.length ? Math.round(tests.reduce((s, t) => s + (t.score / t.max) * 100, 0) / tests.length) : null;
  const total = attendance.length;
  const present = attendance.filter((a) => a.status === 'present').length;
  const attPct = total ? Math.round((present / total) * 100) : 100;

  const student = data.students.find((s) => s.id === studentId);
  const covered = slosCoveredSet();
  const subjectBars = student
    ? data.subjects
        .map((subj) => {
          const subjSlos = data.slos.filter((s) => s.classId === student.classId && s.subjectId === subj.id);
          const done = subjSlos.filter((s) => covered.has(s.id)).length;
          return subjSlos.length
            ? { label: subj.name, sub: `${done}/${subjSlos.length} SLOs`, pct: Math.round((done / subjSlos.length) * 100) }
            : null;
        })
        .filter(Boolean)
    : [];

  const missed = showMissed ? computeMissedSlos(studentId).slice(0, 3) : [];

  return (
    <div>
      <Card title="Overall Performance">
        <p className="mb-2.5 text-[26px] font-extrabold text-[var(--role-dark)]">{avg === null ? '—' : `${avg}%`}</p>
        <LineChart tests={tests} />
      </Card>

      <Card title="Coverage by Subject">
        <BarChart items={subjectBars} />
      </Card>

      <Card title="Attendance">
        <p className="text-[22px] font-extrabold text-[var(--ink)]">{attPct}%</p>
        <p className="mt-0.5 text-[12px] text-[var(--sub)]">
          {present} Present · {total - present} Absent
        </p>
      </Card>

      {showMissed ? (
        <Card>
          <SectionHeader title="SLOs Missed Due To Absence" actionLabel="View All" onAction={onViewAllMissed} />
          {missed.length === 0 ? (
            <EmptyNote>No missed SLOs. 🎉</EmptyNote>
          ) : (
            missed.map((m, i) => {
              const subj = data.subjects.find((s) => s.id === m.subjectId);
              return (
                <div key={i} className="flex items-start gap-2.5 py-2">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[var(--red)]" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--ink)]">{m.slo.text}</p>
                    <p className="text-[11.5px] text-[var(--sub)]">
                      {subj ? subj.name : ''} · {fmtDate(m.date)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      ) : null}
    </div>
  );
}
