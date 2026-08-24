'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useNav } from '@/navigation/AppShell';
import ScreenBody from '@/components/ScreenBody';
import GreetCard from '@/components/GreetCard';
import StatBox, { StatGrid } from '@/components/StatBox';
import { ListCard, ListRow, EmptyNote, SectionHeader, Avatar } from '@/components/Lists';
import Pill from '@/components/Pill';

export default function ParentDashboard() {
  const { data, session, switchChild, slosCoveredSet } = useApp();
  const nav = useNav();

  const student = data.students.find((s) => s.id === session.studentId) || data.students[0];
  const cls = student ? data.classes.find((c) => c.id === student.classId) : null;

  const covered = slosCoveredSet();
  const clsSlos = student ? data.slos.filter((s) => s.classId === student.classId) : [];
  const done = clsSlos.filter((s) => covered.has(s.id)).length;
  const pct = clsSlos.length ? Math.round((done / clsSlos.length) * 100) : 0;

  const attendance = student ? data.attendance.filter((a) => a.studentId === student.id) : [];
  const present = attendance.filter((a) => a.status === 'present').length;
  const attPct = attendance.length ? Math.round((present / attendance.length) * 100) : 100;

  const recentLogs = student
    ? [...data.dailyLog].filter((l) => l.classId === student.classId).sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 6)
    : [];

  if (!student) {
    return (
      <ScreenBody>
        <EmptyNote>No students available yet. Ask a teacher/admin to add one.</EmptyNote>
      </ScreenBody>
    );
  }

  return (
    <ScreenBody>
      <GreetCard name={session.name} subtitle={`Following ${student.name} · ${cls ? cls.name : ''}`} pct={pct} pctLabel="SLOs covered this term" />

      {data.students.length > 1 ? (
        <div className="mb-4">
          <SectionHeader title="Switch Child" />
          <div className="flex flex-wrap gap-2">
            {data.students.map((s) => {
              const active = s.id === student.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => switchChild(s.id)}
                  className={
                    'flex items-center gap-2 rounded-xl border-[1.5px] px-2.5 py-2 ' +
                    (active ? 'border-[var(--role)] bg-[var(--role-bg)]' : 'border-[var(--line)] bg-[var(--paper)]')
                  }
                >
                  <Avatar name={s.name} />
                  <span className="max-w-[90px] truncate text-xs font-semibold text-[var(--ink)]">{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <StatGrid>
        <StatBox value={`${pct}%`} label="Coverage" />
        <StatBox value={`${attPct}%`} label="Attendance" />
        <StatBox value={data.tests.filter((t) => t.studentId === student.id).length} label="Tests" />
        <StatBox value={attendance.filter((a) => a.status === 'absent').length} label="Absences" colorClass="text-[var(--red)]" />
      </StatGrid>

      <SectionHeader title="Recent Class Activity" actionLabel="View All" onAction={() => nav.navigate('SLOs')} />
      <ListCard>
        {recentLogs.length === 0 ? (
          <EmptyNote>No activity logged yet.</EmptyNote>
        ) : (
          recentLogs.map((l) => {
            const subj = data.subjects.find((s) => s.id === l.subjectId);
            const firstSlo = data.slos.find((x) => x.id === l.sloIds[0]);
            return (
              <ListRow
                key={l.id}
                icon={BookOpen}
                title={firstSlo ? firstSlo.text : 'SLO activity'}
                subtitle={`${subj ? subj.name : ''} · ${l.date}`}
                right={<Pill kind={l.type === 'Taught' ? 'teach' : 'revise'} label={l.type} />}
              />
            );
          })
        )}
      </ListCard>
    </ScreenBody>
  );
}
