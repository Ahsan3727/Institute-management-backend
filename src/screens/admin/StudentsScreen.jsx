'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, UserCheck, Phone, DollarSign, KeyRound, ShieldAlert } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useToast } from '@/context/ToastContext';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import StatBox, { StatGrid } from '@/components/StatBox';
import { PrimaryButton, IconButton, SmallButton } from '@/components/Buttons';
import { TextField, SelectField, SearchField } from '@/components/Inputs';
import { Avatar, EmptyNote } from '@/components/Lists';
import { ConfirmModal } from '@/components/Modals';
import StudentFormModal from '@/components/StudentFormModal';
import Pill from '@/components/Pill';

export default function AdminStudentsScreen() {
  const { data, addStudent, editStudent, deleteStudent, studentDependentCounts, nameExists } = useApp();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [editing, setEditing] = useState(null); // student object or {} for new
  const [deleting, setDeleting] = useState(null);

  const classOptions = useMemo(() => {
    return data.classes.map((c) => ({ label: c.name, value: c.id }));
  }, [data.classes]);

  const teacherOptions = useMemo(() => {
    return data.teachers.map((t) => ({ label: t.name, value: t.id }));
  }, [data.teachers]);

  const filterClassOptions = useMemo(() => {
    return [{ label: 'All Classes', value: 'all' }, ...classOptions];
  }, [classOptions]);

  const filterTeacherOptions = useMemo(() => {
    return [
      { label: 'All Teachers', value: 'all' },
      { label: 'Unassigned Only', value: 'unassigned' },
      ...teacherOptions,
    ];
  }, [teacherOptions]);

  const filteredList = useMemo(() => {
    return data.students.filter((s) => {
      const matchClass = classFilter === 'all' || s.classId === classFilter;
      const matchTeacher =
        teacherFilter === 'all' ||
        (teacherFilter === 'unassigned' ? !s.assignedTeacherId : s.assignedTeacherId === teacherFilter);
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.username && s.username.toLowerCase().includes(search.toLowerCase())) ||
        (s.guardianPhone && s.guardianPhone.includes(search));
      return matchClass && matchTeacher && matchSearch;
    });
  }, [data.students, classFilter, teacherFilter, search]);

  const totalFeePotential = data.students.reduce((sum, s) => sum + (s.tuitionFee || 0), 0);
  const unassignedCount = data.students.filter((s) => !s.assignedTeacherId).length;

  function handleSaveStudent(form) {
    if (editing && editing.id) {
      if (data.students.some((s) => s.id !== editing.id && s.classId === form.classId && s.name.toLowerCase() === form.name.toLowerCase())) {
        toast('A student with that name is already in this class.', 'error');
        return;
      }
      editStudent(editing.id, form);
      toast('Student updated successfully.', 'success');
    } else {
      if (data.students.some((s) => s.classId === form.classId && s.name.toLowerCase() === form.name.toLowerCase())) {
        toast('A student with that name already exists in this class.', 'error');
        return;
      }
      addStudent(form);
      toast('Student and account created successfully.', 'success');
    }
    setEditing(null);
  }

  return (
    <ScreenBody>
      <PrimaryButton
        title="Add Student & Create Account"
        icon={Plus}
        onClick={() => setEditing({})}
        className="mb-3"
      />

      <StatGrid>
        <StatBox value={data.students.length} label="Total Students" />
        <StatBox value={data.classes.length} label="Classes" />
        <StatBox value={`Rs ${totalFeePotential.toLocaleString()}`} label="Monthly Tuition" />
        <StatBox
          value={unassignedCount}
          label="Unassigned"
          colorClass={unassignedCount > 0 ? 'text-[var(--amber)]' : 'text-[var(--green)]'}
        />
      </StatGrid>

      <Card title="Student Directory">
        {/* Filters */}
        <div className="mb-3 flex flex-col gap-2">
          <SearchField value={search} onChange={setSearch} placeholder="Search student name, username, or phone…" />
          <div className="flex gap-2">
            <SelectField
              options={filterClassOptions}
              value={classFilter}
              onChange={setClassFilter}
              className="flex-1"
            />
            <SelectField
              options={filterTeacherOptions}
              value={teacherFilter}
              onChange={setTeacherFilter}
              className="flex-1"
            />
          </div>
        </div>

        {filteredList.length === 0 ? (
          <EmptyNote>
            {data.students.length === 0 ? 'No students added yet — tap "Add Student" above.' : 'No students match the active filters.'}
          </EmptyNote>
        ) : (
          filteredList.map((s) => {
            const cls = data.classes.find((c) => c.id === s.classId);
            const teacher = data.teachers.find((t) => t.id === s.assignedTeacherId);
            return (
              <div key={s.id} className="border-b border-[var(--line)] py-3 last:border-b-0">
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="truncate text-[14px] font-bold text-[var(--ink)]">{s.name}</p>
                      {s.username ? (
                        <span className="flex items-center gap-0.5 rounded-md bg-[var(--bg)] px-1.5 py-0.5 text-[10.5px] font-mono text-[var(--sub)] border border-[var(--line)]">
                          <KeyRound size={10} /> {s.username}
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate text-[11.5px] text-[var(--sub)]">
                      {cls ? cls.name : 'No Class'}
                      {s.guardianName ? ` · Guardian: ${s.guardianName}` : ''}
                    </p>
                  </div>
                  <IconButton icon={Pencil} onClick={() => setEditing(s)} />
                  <IconButton icon={Trash2} danger onClick={() => setDeleting(s)} />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-[46px]">
                  {s.guardianPhone ? (
                    <span className="flex items-center gap-1 text-[11px] text-[var(--sub)]">
                      <Phone size={11} /> {s.guardianPhone}
                    </span>
                  ) : null}
                  {s.tuitionFee ? (
                    <span className="text-[11px] font-semibold text-[var(--ink)]">
                      Rs {s.tuitionFee.toLocaleString()}/mo
                    </span>
                  ) : (
                    <span className="text-[11px] text-[var(--sub)]">No fee set</span>
                  )}
                  {teacher ? (
                    <Pill kind="teach" label={`Teacher: ${teacher.name}`} />
                  ) : (
                    <Pill kind="absent" label="No Teacher Assigned" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>

      <StudentFormModal
        open={!!editing}
        title={editing?.id ? 'Edit Student & Credentials' : 'Add Student & Create Account'}
        initial={editing?.id ? editing : null}
        classOptions={classOptions}
        teacherOptions={teacherOptions}
        showFee={true}
        saveLabel={editing?.id ? 'Save Changes' : 'Create Student Account'}
        onCancel={() => setEditing(null)}
        onSave={handleSaveStudent}
      />

      <ConfirmModal
        open={!!deleting}
        title={deleting ? `Remove "${deleting.name}"?` : ''}
        body={
          deleting
            ? (() => {
                const dep = studentDependentCounts(deleting.id);
                return `This will delete the student and their login account. This also removes ${dep.attendance} attendance records, ${dep.tests} test scores and ${dep.feePayments} fee records. This action cannot be undone.`;
              })()
            : ''
        }
        confirmLabel="Delete Student"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          deleteStudent(deleting.id);
          toast('Student removed.', 'success');
          setDeleting(null);
        }}
      />
    </ScreenBody>
  );
}
