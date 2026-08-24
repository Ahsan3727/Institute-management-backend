'use client';

import React, { useState } from 'react';
import { useApp } from '@/state/AppContext';
import { useToast } from '@/context/ToastContext';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { SelectField, DateField, SearchField } from '@/components/Inputs';
import { PrimaryButton } from '@/components/Buttons';
import { Avatar, EmptyNote } from '@/components/Lists';
import { todayISO } from '@/utils/helpers';

export default function TeacherAttendanceScreen() {
  const { data, session, saveAttendanceBulk } = useApp();
  const toast = useToast();

  const currentTeacher = data.teachers.find((t) => t.id === session.teacherId || t.name === session.name);
  const teacherAssignedIds = currentTeacher?.assignedStudentIds || [];
  const hasAssigned = teacherAssignedIds.length > 0;

  const [classId, setClassId] = useState(data.classes[0]?.id);
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState(hasAssigned ? 'assigned' : 'all'); // 'assigned' | 'all'
  const [draft, setDraft] = useState({});

  const allInClass = data.students.filter((s) => s.classId === classId);
  const classStudents = filterMode === 'assigned' && hasAssigned
    ? allInClass.filter((s) => teacherAssignedIds.includes(s.id))
    : allInClass;

  const filtered = search ? classStudents.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())) : classStudents;

  function statusFor(studentId) {
    if (draft[studentId]) return draft[studentId];
    const rec = data.attendance.find((a) => a.classId === classId && a.date === date && a.studentId === studentId);
    return rec ? rec.status : 'present';
  }

  function toggle(studentId) {
    setDraft((prev) => ({ ...prev, [studentId]: statusFor(studentId) === 'present' ? 'absent' : 'present' }));
  }

  const presentCount = classStudents.filter((s) => statusFor(s.id) === 'present').length;
  const total = classStudents.length;

  function handleSave() {
    const records = classStudents.map((s) => ({ studentId: s.id, status: statusFor(s.id) }));
    saveAttendanceBulk(classId, date, records);
    setDraft({});
    toast(`Attendance saved for ${records.length} student(s) on ${date}.`, 'success');
  }

  return (
    <ScreenBody>
      <Card>
        <div className="mb-3 flex gap-2.5">
          <SelectField
            options={data.classes.map((c) => ({ label: c.name, value: c.id }))}
            value={classId}
            onChange={(v) => {
              setClassId(v);
              setDraft({});
            }}
            className="flex-1"
          />
          <DateField
            value={date}
            onChange={(v) => {
              setDate(v);
              setDraft({});
            }}
            className="flex-1"
          />
        </div>

        {hasAssigned ? (
          <div className="mb-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setFilterMode('assigned');
                setDraft({});
              }}
              className={
                'flex-1 rounded-xl py-2 text-[12px] font-bold transition ' +
                (filterMode === 'assigned'
                  ? 'bg-[var(--role)] text-white shadow-sm'
                  : 'bg-[var(--bg)] text-[var(--sub)] border border-[var(--line)]')
              }
            >
              My Assigned Students ({teacherAssignedIds.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterMode('all');
                setDraft({});
              }}
              className={
                'flex-1 rounded-xl py-2 text-[12px] font-bold transition ' +
                (filterMode === 'all'
                  ? 'bg-[var(--role)] text-white shadow-sm'
                  : 'bg-[var(--bg)] text-[var(--sub)] border border-[var(--line)]')
              }
            >
              All in Class ({allInClass.length})
            </button>
          </div>
        ) : null}

        <div className="mb-3 flex gap-2">
          <SummaryBox label="Total" value={total} colorClass="text-[var(--ink)]" />
          <SummaryBox label="Present" value={presentCount} colorClass="text-[var(--green)]" />
          <SummaryBox label="Absent" value={total - presentCount} colorClass="text-[var(--red)]" />
        </div>

        <SearchField value={search} onChange={setSearch} placeholder="Search students…" />

        {filtered.length === 0 ? (
          <EmptyNote>No students found.</EmptyNote>
        ) : (
          filtered.map((s) => {
            const on = statusFor(s.id) === 'present';
            return (
              <div key={s.id} className="flex items-center gap-3 border-b border-[var(--line)] py-2.5 last:border-b-0">
                <Avatar name={s.name} />
                <span className="flex-1 text-[13.5px] font-semibold text-[var(--ink)]">{s.name}</span>
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  className={'flex h-[26px] w-11 items-center rounded-full p-[3px] transition ' + (on ? 'bg-[var(--green)] justify-end' : 'bg-[var(--line)] justify-start')}
                >
                  <span className="h-5 w-5 rounded-full bg-white shadow" />
                </button>
              </div>
            );
          })
        )}

        <PrimaryButton title="Save Attendance" onClick={handleSave} className="mt-3.5" />
      </Card>
    </ScreenBody>
  );
}

function SummaryBox({ label, value, colorClass }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-xl border border-[var(--line)] py-2.5">
      <span className={'text-[17px] font-extrabold ' + colorClass}>{value}</span>
      <span className="mt-0.5 text-[9.5px] font-bold text-[var(--sub)]">{label.toUpperCase()}</span>
    </div>
  );
}
