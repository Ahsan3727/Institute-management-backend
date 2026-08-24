'use client';

import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useNav } from '@/navigation/AppShell';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { SelectField, Label } from '@/components/Inputs';
import StudentProgressBlock from '@/components/StudentProgressBlock';
import { printReportCard } from '@/utils/printUtils';

const TERMS = ['Term 1', 'Term 2', 'Final'];

export default function AdminReportsScreen() {
  const { data, getStudentGradeCard } = useApp();
  const nav = useNav();
  const [studentId, setStudentId] = useState(data.students[0]?.id);
  const [term, setTerm] = useState('Term 1');

  const studentOptions = data.students.map((s) => {
    const c = data.classes.find((c) => c.id === s.classId);
    return { label: `${s.name} (${c ? c.name : ''})`, value: s.id };
  });

  const student = data.students.find((s) => s.id === studentId);
  const classObj = student ? data.classes.find((c) => c.id === student.classId) : null;
  const gradeCard = studentId ? getStudentGradeCard(studentId, term) : [];
  const attendance = student ? data.attendance.filter((a) => a.studentId === studentId) : [];
  const present = attendance.filter((a) => a.status === 'present').length;
  const total = attendance.length;
  const attPct = total > 0 ? Math.round((present / total) * 100) : 100;

  function handlePrint() {
    if (!student) return;
    printReportCard({ student, classObj, term, gradeRows: gradeCard, attPct, present, total });
  }

  return (
    <ScreenBody>
      <Card title="Student Progress & Report Card">
        <div className="mb-2.5">
          <Label>Student</Label>
          <SelectField options={studentOptions} value={studentId} onChange={setStudentId} />
        </div>
        <div className="mb-3">
          <Label>Term (for Report Card)</Label>
          <SelectField options={TERMS.map((t) => ({ label: t, value: t }))} value={term} onChange={setTerm} />
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--role)] py-2.5 text-[13px] font-bold text-white"
        >
          <Printer size={15} />
          Print Report Card — {term}
        </button>
      </Card>

      {studentId ? (
        <StudentProgressBlock studentId={studentId} showMissed onViewAllMissed={() => nav.navigate('Missed', { studentId })} />
      ) : null}
    </ScreenBody>
  );
}

