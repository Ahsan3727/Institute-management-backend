'use client';

import React, { useState } from 'react';
import { Printer, Award } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useNav } from '@/navigation/AppShell';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { SelectField, Label } from '@/components/Inputs';
import { EmptyNote } from '@/components/Lists';
import StudentProgressBlock from '@/components/StudentProgressBlock';
import { printReportCard } from '@/utils/printUtils';

const TERMS = ['Term 1', 'Term 2', 'Final'];

export default function ParentProgressScreen() {
  const { data, session, getStudentGradeCard } = useApp();
  const nav = useNav();
  const [term, setTerm] = useState('Term 1');

  const student = data.students.find((s) => s.id === session.studentId) || data.students[0];
  const cls = student ? data.classes.find((c) => c.id === student.classId) : null;

  if (!student) {
    return (
      <ScreenBody>
        <EmptyNote>No student selected.</EmptyNote>
      </ScreenBody>
    );
  }

  const gradeCard = getStudentGradeCard(student.id, term);
  const attendance = data.attendance.filter((a) => a.studentId === student.id);
  const present = attendance.filter((a) => a.status === 'present').length;
  const total = attendance.length;
  const attPct = total > 0 ? Math.round((present / total) * 100) : 100;

  function handlePrint() {
    printReportCard({ student, classObj: cls, term, gradeRows: gradeCard, attPct, present, total });
  }

  return (
    <ScreenBody>
      <Card title="Term Report Card">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <Label>Select Term</Label>
            <SelectField options={TERMS.map((t) => ({ label: t, value: t }))} value={term} onChange={setTerm} />
          </div>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--role)] py-2.5 text-[13px] font-bold text-white shadow-sm"
        >
          <Printer size={15} />
          Print {term} Report Card
        </button>
      </Card>

      <StudentProgressBlock studentId={student.id} showMissed onViewAllMissed={() => nav.navigate('Missed', { studentId: student.id })} />
    </ScreenBody>
  );
}

