'use client';

import React from 'react';
import { useApp } from '@/state/AppContext';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { EmptyNote } from '@/components/Lists';
import Pill from '@/components/Pill';
import { fmtDate } from '@/utils/helpers';

export default function ParentSLOsScreen() {
  const { data, session } = useApp();

  const student = data.students.find((s) => s.id === session.studentId) || data.students[0];
  const logs = student
    ? [...data.dailyLog].filter((l) => l.classId === student.classId).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return (
    <ScreenBody>
      <Card title={`SLOs Covered — ${student ? student.name : ''}`}>
        {logs.length === 0 ? (
          <EmptyNote>Nothing logged for this class yet.</EmptyNote>
        ) : (
          logs.map((l) => {
            const subj = data.subjects.find((s) => s.id === l.subjectId);
            return (
              <div key={l.id} className="border-b border-[var(--line)] py-2.5 last:border-b-0">
                <div className="mb-1.5 flex flex-wrap items-center gap-1">
                  <span className="text-[13px] font-bold text-[var(--ink)]">{fmtDate(l.date)}</span>
                  <span className="text-[11.5px] text-[var(--sub)]"> · {subj ? subj.name : ''}</span>
                  <Pill kind={l.type === 'Taught' ? 'teach' : 'revise'} label={l.type} />
                </div>
                {l.sloIds.map((id) => {
                  const slo = data.slos.find((s) => s.id === id);
                  return slo ? (
                    <p key={id} className="mb-0.5 ml-1 text-[12.5px] text-[var(--sub)]">
                      • {slo.text}
                    </p>
                  ) : null;
                })}
              </div>
            );
          })
        )}
      </Card>
    </ScreenBody>
  );
}
