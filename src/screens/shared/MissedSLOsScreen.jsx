'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { SelectField } from '@/components/Inputs';
import { EmptyNote } from '@/components/Lists';
import { fmtDate } from '@/utils/helpers';

export default function MissedSLOsScreen({ params }) {
  const { data, session, computeMissedSlos } = useApp();
  const isAdmin = session.role === 'admin';
  const [studentId, setStudentId] = useState(params?.studentId || session.studentId || data.students[0]?.id);

  const missed = studentId ? computeMissedSlos(studentId) : [];
  const student = data.students.find((s) => s.id === studentId);

  return (
    <ScreenBody>
      {isAdmin ? (
        <Card title="Choose a student">
          <SelectField options={data.students.map((s) => ({ label: s.name, value: s.id }))} value={studentId} onChange={setStudentId} />
        </Card>
      ) : null}

      <Card title={`Missed SLOs${student ? ` — ${student.name}` : ''}`}>
        {missed.length === 0 ? (
          <EmptyNote>No missed SLOs. 🎉</EmptyNote>
        ) : (
          missed.map((m, i) => {
            const subj = data.subjects.find((s) => s.id === m.subjectId);
            return (
              <div key={i} className="flex items-start gap-2.5 border-b border-[var(--line)] py-2.5 last:border-b-0">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--red)]" />
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-[var(--ink)]">{m.slo.text}</p>
                  <p className="mt-0.5 text-[11.5px] text-[var(--sub)]">
                    {subj ? subj.name : ''} · {m.type} on {fmtDate(m.date)} while absent
                  </p>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </ScreenBody>
  );
}
