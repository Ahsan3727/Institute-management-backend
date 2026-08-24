'use client';

import React, { useState } from 'react';
import { useApp } from '@/state/AppContext';
import { useToast } from '@/context/ToastContext';
import { useNav } from '@/navigation/AppShell';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { SelectField, TextField, DateField } from '@/components/Inputs';
import { PrimaryButton } from '@/components/Buttons';
import { ListCard, ListRow, EmptyNote } from '@/components/Lists';
import Pill from '@/components/Pill';
import { Target } from 'lucide-react';
import { todayISO } from '@/utils/helpers';

export default function TeacherReportsScreen() {
  const { data, session, addTest } = useApp();
  const toast = useToast();
  const nav = useNav();

  const currentTeacher = data.teachers.find((t) => t.id === session.teacherId || t.name === session.name);
  const teacherAssignedIds = currentTeacher?.assignedStudentIds || [];

  const studentOptions = data.students.map((s) => {
    const cls = data.classes.find((c) => c.id === s.classId);
    const isAssigned = teacherAssignedIds.includes(s.id);
    return {
      label: `${s.name} (${cls ? cls.name : '—'})${isAssigned ? ' ★ Assigned' : ''}`,
      value: s.id,
    };
  });

  const [studentId, setStudentId] = useState(
    teacherAssignedIds[0] || data.students[0]?.id
  );
  const [subjectId, setSubjectId] = useState(data.subjects[0]?.id);
  const [score, setScore] = useState('');
  const [max, setMax] = useState('100');
  const [date, setDate] = useState(todayISO());

  const items = [...data.tests].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 20);

  function handleSave() {
    const s = parseFloat(score);
    const m = parseFloat(max);
    if (Number.isNaN(s) || Number.isNaN(m) || m <= 0) {
      toast('Enter a valid score and total.', 'error');
      return;
    }
    if (s < 0) {
      toast('Score cannot be negative.', 'error');
      return;
    }
    if (s > m) {
      toast('Score cannot be higher than the total.', 'error');
      return;
    }
    const subj = data.subjects.find((x) => x.id === subjectId);
    addTest(studentId, subj ? subj.name : '', s, m, date);
    setScore('');
    toast('Test result saved.', 'success');
  }

  return (
    <ScreenBody>
      <Card title="Add a test result">
        <div className="flex gap-2.5">
          <SelectField
            options={studentOptions}
            value={studentId}
            onChange={setStudentId}
            className="flex-1"
          />
          <SelectField
            options={data.subjects.map((s) => ({ label: s.name, value: s.id }))}
            value={subjectId}
            onChange={setSubjectId}
            className="flex-1"
          />
        </div>
        <div className="mt-2.5 flex gap-2.5">
          <TextField value={score} onChange={setScore} placeholder="Score" type="number" className="flex-1" />
          <TextField value={max} onChange={setMax} placeholder="Total" type="number" className="flex-1" />
        </div>
        <div className="mt-2.5">
          <DateField value={date} onChange={setDate} />
        </div>
        <PrimaryButton title="Save Result" onClick={handleSave} className="mt-3" />
      </Card>

      <Card title="Recent Results">
        {items.length === 0 ? (
          <EmptyNote>No results yet.</EmptyNote>
        ) : (
          <ListCard className="m-0 border-0 p-0">
            {items.map((t) => {
              const st = data.students.find((s) => s.id === t.studentId);
              const pct = Math.round((t.score / t.max) * 100);
              return (
                <ListRow
                  key={t.id}
                  icon={Target}
                  title={st ? st.name : ''}
                  subtitle={`${t.subject} · ${t.date}`}
                  right={<Pill kind="slo" label={`${pct}%`} />}
                />
              );
            })}
          </ListCard>
        )}
      </Card>

      <Card title="Full Activity Log">
        <button type="button" onClick={() => nav.navigate('DailyLog')} className="text-[12.5px] font-bold text-[var(--role-dark)]">
          Open Daily Activity Log →
        </button>
      </Card>
    </ScreenBody>
  );
}
