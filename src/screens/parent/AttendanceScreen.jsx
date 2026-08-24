'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { ListCard, ListRow, EmptyNote } from '@/components/Lists';
import Pill from '@/components/Pill';
import { fmtDate } from '@/utils/helpers';

export default function ParentAttendanceScreen() {
  const { data, session } = useApp();

  const student = data.students.find((s) => s.id === session.studentId) || data.students[0];
  const records = student
    ? [...data.attendance].filter((a) => a.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const present = records.filter((r) => r.status === 'present').length;
  const total = records.length;
  const pct = total ? Math.round((present / total) * 100) : 100;

  return (
    <ScreenBody>
      <Card title="Attendance Summary">
        <p className="text-[26px] font-extrabold text-[var(--role-dark)]">{pct}%</p>
        <p className="mt-1 text-xs text-[var(--sub)]">
          {present} present · {total - present} absent · {total} school day(s) recorded
        </p>
      </Card>

      <Card title="History">
        {records.length === 0 ? (
          <EmptyNote>No attendance recorded yet.</EmptyNote>
        ) : (
          <ListCard className="m-0 border-0 p-0">
            {records.map((r) => (
              <ListRow key={r.id} icon={Calendar} title={fmtDate(r.date)} right={<Pill kind={r.status} label={r.status === 'present' ? 'Present' : 'Absent'} />} />
            ))}
          </ListCard>
        )}
      </Card>
    </ScreenBody>
  );
}
