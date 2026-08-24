'use client';

import React, { useState } from 'react';
import { useApp } from '@/state/AppContext';
import { useNav } from '@/navigation/AppShell';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { SelectField } from '@/components/Inputs';
import StudentProgressBlock from '@/components/StudentProgressBlock';

export default function AdminReportsScreen() {
  const { data } = useApp();
  const nav = useNav();
  const [studentId, setStudentId] = useState(data.students[0]?.id);

  const studentOptions = data.students.map((s) => {
    const c = data.classes.find((c) => c.id === s.classId);
    return { label: `${s.name} (${c ? c.name : ''})`, value: s.id };
  });

  return (
    <ScreenBody>
      <Card title="Student Progress">
        <SelectField options={studentOptions} value={studentId} onChange={setStudentId} />
      </Card>
      {studentId ? (
        <StudentProgressBlock studentId={studentId} showMissed onViewAllMissed={() => nav.navigate('Missed', { studentId })} />
      ) : null}
    </ScreenBody>
  );
}
