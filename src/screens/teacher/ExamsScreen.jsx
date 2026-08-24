'use client';

import React, { useState } from 'react';
import { Target, Trash2, Award, BookOpen } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useToast } from '@/context/ToastContext';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { SelectField, TextField, DateField, Label } from '@/components/Inputs';
import { PrimaryButton, Segmented } from '@/components/Buttons';
import { ListCard, ListRow, EmptyNote } from '@/components/Lists';
import Pill from '@/components/Pill';
import { todayISO } from '@/utils/helpers';

const EXAM_TYPES = ['Quiz', 'Class Test', 'Midterm', 'Final'];
const TERMS = ['Term 1', 'Term 2', 'Final'];
const GRADE_COLORS = { 'A+': 'text-[#7C3AED]', A: 'text-[#2563eb]', B: 'text-[#16a34a]', C: 'text-[#d97706]', D: 'text-[#ea580c]', F: 'text-[var(--red)]' };

export default function TeacherExamsScreen() {
  const { data, session, addTest, deleteExamResult, getStudentGradeCard } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState('enter');

  const currentTeacher = data.teachers.find((t) => t.id === session.teacherId || t.name === session.name);
  const assignedIds = currentTeacher?.assignedStudentIds || [];

  const studentOptions = data.students.map((s) => {
    const cls = data.classes.find((c) => c.id === s.classId);
    const isAssigned = assignedIds.includes(s.id);
    return { label: `${s.name} (${cls?.name || '—'})${isAssigned ? ' ★' : ''}`, value: s.id };
  });

  const [studentId, setStudentId] = useState(assignedIds[0] || data.students[0]?.id);
  const [subjectId, setSubjectId] = useState(data.subjects[0]?.id);
  const [examType, setExamType] = useState('Quiz');
  const [term, setTerm] = useState('Term 1');
  const [score, setScore] = useState('');
  const [max, setMax] = useState('100');
  const [date, setDate] = useState(todayISO());

  // Grade summary
  const [gradeStudentId, setGradeStudentId] = useState(assignedIds[0] || data.students[0]?.id);
  const [gradeTerm, setGradeTerm] = useState('Term 1');

  const recentTests = [...data.tests]
    .filter((t) => {
      const isMyStudent = assignedIds.length === 0 || assignedIds.includes(t.studentId);
      return isMyStudent;
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  function handleSave() {
    const s = parseFloat(score);
    const m = parseFloat(max);
    if (Number.isNaN(s) || Number.isNaN(m) || m <= 0) { toast('Enter a valid score and total.', 'error'); return; }
    if (s < 0) { toast('Score cannot be negative.', 'error'); return; }
    if (s > m) { toast('Score cannot exceed the total.', 'error'); return; }
    const subj = data.subjects.find((x) => x.id === subjectId);
    addTest(studentId, subj?.name || '', s, m, date, examType, term);
    setScore('');
    toast(`${examType} result saved ✓`, 'success');
  }

  const gradeCard = gradeStudentId ? getStudentGradeCard(gradeStudentId, gradeTerm) : [];

  return (
    <ScreenBody>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { label: 'Enter Result', value: 'enter' },
          { label: 'Grade Summary', value: 'grades' },
        ]}
      />

      {tab === 'enter' ? (
        <>
          <Card title="Add Exam Result">
            <div className="mb-2.5">
              <Label>Student</Label>
              <SelectField options={studentOptions} value={studentId} onChange={setStudentId} />
            </div>
            <div className="mb-2.5">
              <Label>Subject</Label>
              <SelectField options={data.subjects.map((s) => ({ label: s.name, value: s.id }))} value={subjectId} onChange={setSubjectId} />
            </div>
            <div className="mb-2.5 flex gap-2.5">
              <div className="flex-1">
                <Label>Exam Type</Label>
                <SelectField options={EXAM_TYPES.map((e) => ({ label: e, value: e }))} value={examType} onChange={setExamType} />
              </div>
              <div className="flex-1">
                <Label>Term</Label>
                <SelectField options={TERMS.map((t) => ({ label: t, value: t }))} value={term} onChange={setTerm} />
              </div>
            </div>
            <div className="mb-2.5 flex gap-2.5">
              <div className="flex-1">
                <Label>Score Obtained</Label>
                <TextField value={score} onChange={setScore} placeholder="e.g. 78" type="number" />
              </div>
              <div className="flex-1">
                <Label>Total Marks</Label>
                <TextField value={max} onChange={setMax} placeholder="e.g. 100" type="number" />
              </div>
            </div>
            <div className="mb-3">
              <Label>Exam Date</Label>
              <DateField value={date} onChange={setDate} />
            </div>
            <PrimaryButton title="Save Exam Result" onClick={handleSave} />
          </Card>

          <Card title="Recent Results">
            {recentTests.length === 0 ? (
              <EmptyNote>No results yet. Add results above.</EmptyNote>
            ) : (
              <ListCard className="m-0 border-0 p-0">
                {recentTests.map((t) => {
                  const st = data.students.find((s) => s.id === t.studentId);
                  const pct = Math.round((t.score / t.max) * 100);
                  const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B' : pct >= 60 ? 'C' : pct >= 50 ? 'D' : 'F';
                  return (
                    <ListRow
                      key={t.id}
                      icon={Target}
                      title={`${st?.name || '—'} · ${t.subject}`}
                      subtitle={`${t.examType || 'Test'} · ${t.term || ''} · ${t.date}`}
                      right={
                        <div className="flex items-center gap-2">
                          <span className={`text-[13px] font-black ${GRADE_COLORS[grade] || ''}`}>{grade}</span>
                          <Pill kind="slo" label={`${pct}%`} />
                          <button
                            type="button"
                            onClick={() => { deleteExamResult(t.id); toast('Result deleted.', 'success'); }}
                            className="text-[var(--sub)] hover:text-[var(--red)]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      }
                    />
                  );
                })}
              </ListCard>
            )}
          </Card>
        </>
      ) : (
        <>
          <Card title="Grade Summary">
            <div className="mb-3 flex gap-2.5">
              <div className="flex-1">
                <Label>Student</Label>
                <SelectField options={studentOptions} value={gradeStudentId} onChange={setGradeStudentId} />
              </div>
              <div className="flex-1">
                <Label>Term</Label>
                <SelectField options={TERMS.map((t) => ({ label: t, value: t }))} value={gradeTerm} onChange={setGradeTerm} />
              </div>
            </div>
          </Card>

          {gradeCard.length === 0 ? (
            <Card><EmptyNote>No exam results found for this student & term.</EmptyNote></Card>
          ) : (
            <>
              {gradeCard.map((row) => (
                <Card key={row.subject}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-bold text-[var(--ink)]">{row.subject}</p>
                      <p className="mt-0.5 text-[11px] text-[var(--sub)]">
                        Quiz: {row.quizAvg !== null ? `${row.quizAvg}%` : '—'} · Midterm: {row.midtermScore !== null ? `${row.midtermScore}%` : '—'} · Final: {row.finalScore !== null ? `${row.finalScore}%` : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[22px] font-black ${GRADE_COLORS[row.grade] || ''}`}>{row.grade}</p>
                      <p className="text-[11px] font-semibold text-[var(--sub)]">{row.pct}% · {row.remarks}</p>
                    </div>
                  </div>
                </Card>
              ))}
              <Card>
                <div className="flex items-center gap-3">
                  <Award size={22} className="text-[var(--role-dark)]" />
                  <div>
                    <p className="text-[12px] font-bold uppercase tracking-wide text-[var(--sub)]">Overall Result</p>
                    <p className="text-[18px] font-extrabold text-[var(--ink)]">
                      {Math.round(gradeCard.reduce((s, r) => s + r.pct, 0) / gradeCard.length)}% —{' '}
                      {(() => { const avg = Math.round(gradeCard.reduce((s, r) => s + r.pct, 0) / gradeCard.length); return avg >= 90 ? 'A+' : avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F'; })()}
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </ScreenBody>
  );
}
