'use client';

import React from 'react';
import { useApp } from '@/state/AppContext';
import { useNav } from '@/navigation/AppShell';
import ScreenBody from '@/components/ScreenBody';
import { EmptyNote } from '@/components/Lists';
import StudentProgressBlock from '@/components/StudentProgressBlock';

export default function ParentProgressScreen() {
  const { data, session } = useApp();
  const nav = useNav();
  const student = data.students.find((s) => s.id === session.studentId) || data.students[0];

  if (!student) {
    return (
      <ScreenBody>
        <EmptyNote>No student selected.</EmptyNote>
      </ScreenBody>
    );
  }

  return (
    <ScreenBody>
      <StudentProgressBlock studentId={student.id} showMissed onViewAllMissed={() => nav.navigate('Missed', { studentId: student.id })} />
    </ScreenBody>
  );
}
