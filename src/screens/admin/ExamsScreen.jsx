'use client';

import React, { useState } from 'react';
import { Award, Printer, ChevronDown } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useNav } from '@/navigation/AppShell';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import StatBox, { StatGrid } from '@/components/StatBox';
import { SelectField, Label } from '@/components/Inputs';
import { SmallButton, Segmented } from '@/components/Buttons';
import { EmptyNote } from '@/components/Lists';
import { printReportCard } from '@/utils/printUtils';

const TERMS = ['Term 1', 'Term 2', 'Final'];
const GRADE_COLORS = { 'A+': '#7C3AED', A: '#2563eb', B: '#16a34a', C: '#d97706', D: '#ea580c', F: '#dc2626' };

export default function AdminExamsScreen() {
  const { data, getStudentGradeCard } = useApp();
  const nav = useNav();

  const [filterClass, setFilterClass] = useState('all');
  const [studentId, setStudentId] = useState(data.students[0]?.id || '');
  const [term, setTerm] = useState('Term 1');

  const filteredStudents = filterClass === 'all'
    ? data.students
    : data.students.filter((s) => s.classId === filterClass);

  const studentOptions = filteredStudents.map((s) => {
    const cls = data.classes.find((c) => c.id === s.classId);
    return { label: `${s.name} (${cls?.name || '—'})`, value: s.id };
  });

  // When class filter changes, reset student selection
  const handleClassChange = (v) => {
    setFilterClass(v);
    const newStudents = v === 'all' ? data.students : data.students.filter((s) => s.classId === v);
    setStudentId(newStudents[0]?.id || '');
  };

  const student = data.students.find((s) => s.id === studentId);
  const classObj = student ? data.classes.find((c) => c.id === student.classId) : null;
  const gradeCard = studentId ? getStudentGradeCard(studentId, term) : [];

  const attendance = student ? data.attendance.filter((a) => a.studentId === studentId) : [];
  const present = attendance.filter((a) => a.status === 'present').length;
  const total = attendance.length;
  const attPct = total > 0 ? Math.round((present / total) * 100) : 100;

  const overallPct = gradeCard.length
    ? Math.round(gradeCard.reduce((s, r) => s + r.pct, 0) / gradeCard.length)
    : 0;
  const overallGrade = overallPct >= 90 ? 'A+' : overallPct >= 80 ? 'A' : overallPct >= 70 ? 'B' : overallPct >= 60 ? 'C' : overallPct >= 50 ? 'D' : 'F';

  function handlePrintReportCard() {
    if (!student) return;
    printReportCard({ student, classObj, term, gradeRows: gradeCard, attPct, present, total });
  }

  return (
    <ScreenBody>
      <Card title="Filter Students">
        <div className="mb-2.5">
          <Label>Class</Label>
          <SelectField
            options={[{ label: 'All Classes', value: 'all' }, ...data.classes.map((c) => ({ label: c.name, value: c.id }))]}
            value={filterClass}
            onChange={handleClassChange}
          />
        </div>
        <div className="mb-2.5">
          <Label>Student</Label>
          <SelectField
            options={studentOptions.length ? studentOptions : [{ label: 'No students in this class', value: '' }]}
            value={studentId}
            onChange={setStudentId}
          />
        </div>
        <div>
          <Label>Term</Label>
          <SelectField
            options={TERMS.map((t) => ({ label: t, value: t }))}
            value={term}
            onChange={setTerm}
          />
        </div>
      </Card>

      {student && (
        <>
          <StatGrid>
            <StatBox value={`${overallPct}%`} label="Overall %" colorClass={`text-[${GRADE_COLORS[overallGrade] || 'var(--ink)'}]`} />
            <StatBox value={overallGrade} label="Grade" colorClass={`text-[${GRADE_COLORS[overallGrade] || 'var(--ink)'}]`} />
            <StatBox value={`${attPct}%`} label="Attendance" />
            <StatBox value={overallGrade === 'F' ? 'FAIL' : 'PASS'} label="Result" colorClass={overallGrade === 'F' ? 'text-[var(--red)]' : 'text-[var(--green)]'} />
          </StatGrid>

          <Card title={`Grade Card — ${student.name} · ${term}`}>
            {gradeCard.length === 0 ? (
              <EmptyNote>No exam results recorded for this student in {term}.</EmptyNote>
            ) : (
              <div className="space-y-1">
                {/* Header row */}
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 pb-2 border-b border-[var(--line)]">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--sub)]">Subject</span>
                  <span className="text-[11px] font-bold text-[var(--sub)] text-center">Quiz</span>
                  <span className="text-[11px] font-bold text-[var(--sub)] text-center">Mid</span>
                  <span className="text-[11px] font-bold text-[var(--sub)] text-center">Final</span>
                  <span className="text-[11px] font-bold text-[var(--sub)] text-center">Total</span>
                  <span className="text-[11px] font-bold text-[var(--sub)] text-center">Grade</span>
                </div>
                {gradeCard.map((row) => (
                  <div key={row.subject} className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-2 py-2.5 border-b border-[var(--line)] last:border-b-0">
                    <div>
                      <p className="text-[13px] font-semibold text-[var(--ink)]">{row.subject}</p>
                      <p className="text-[10px] text-[var(--sub)]">{row.remarks}</p>
                    </div>
                    <span className="text-[12px] text-[var(--sub)] text-center self-center">{row.quizAvg !== null ? `${row.quizAvg}%` : '—'}</span>
                    <span className="text-[12px] text-[var(--sub)] text-center self-center">{row.midtermScore !== null ? `${row.midtermScore}%` : '—'}</span>
                    <span className="text-[12px] text-[var(--sub)] text-center self-center">{row.finalScore !== null ? `${row.finalScore}%` : '—'}</span>
                    <span className="text-[13px] font-bold text-[var(--ink)] text-center self-center">{row.pct}%</span>
                    <span
                      className="text-[14px] font-black text-center self-center"
                      style={{ color: GRADE_COLORS[row.grade] || 'var(--ink)' }}
                    >
                      {row.grade}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handlePrintReportCard}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--role)] py-3 text-[13px] font-bold text-white"
            >
              <Printer size={15} />
              Print Report Card — {student.name}
            </button>
          </Card>
        </>
      )}
    </ScreenBody>
  );
}
