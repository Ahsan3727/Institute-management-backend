'use client';

import React, { useState } from 'react';
import { Trash2, Pencil, Plus, Phone, Mail, UserCheck, KeyRound } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useToast } from '@/context/ToastContext';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { PrimaryButton, IconButton, SmallButton } from '@/components/Buttons';
import { Avatar, EmptyNote } from '@/components/Lists';
import { ConfirmModal } from '@/components/Modals';
import TeacherFormModal from '@/components/TeacherFormModal';
import AssignStudentsModal from '@/components/AssignStudentsModal';
import Pill from '@/components/Pill';
import { todayISO } from '@/utils/helpers';

const STATUS_PILL = { paid: ['teach', 'Paid'], partial: ['revise', 'Partial'], pending: ['absent', 'Pending'], 'n/a': ['slo', 'No salary set'] };

export default function AdminTeachersScreen() {
  const { data, addTeacher, editTeacher, nameExists, deleteTeacher, getSalaryRows, assignStudentsToTeacher } = useApp();
  const toast = useToast();
  const [target, setTarget] = useState(null);
  const [editing, setEditing] = useState(null); // teacher object being edited, or {} for "adding new"
  const [assigningTeacher, setAssigningTeacher] = useState(null); // teacher object for student assignment
  const month = todayISO().slice(0, 7);
  const salaryRows = getSalaryRows(month);

  function handleSave(form) {
    if (editing && editing.id) {
      if (nameExists(data.teachers, form.name, editing.id)) {
        toast('Another teacher already has that name.', 'error');
        return;
      }
      editTeacher(editing.id, form);
      toast('Teacher updated.', 'success');
    } else {
      if (nameExists(data.teachers, form.name)) {
        toast('A teacher with that name already exists.', 'error');
        return;
      }
      addTeacher(form);
      toast('Teacher added and account created.', 'success');
    }
    setEditing(null);
  }

  function handleSaveAssignments(teacherId, studentIds) {
    assignStudentsToTeacher(teacherId, studentIds);
    toast(`Assigned ${studentIds.length} student(s) to teacher.`, 'success');
    setAssigningTeacher(null);
  }

  return (
    <ScreenBody>
      <PrimaryButton title="Add Teacher & Create Account" icon={Plus} onClick={() => setEditing({})} className="mb-4" />

      <Card title="Teaching Staff">
        {data.teachers.length === 0 ? (
          <EmptyNote>No teachers added yet — tap "Add Teacher" above.</EmptyNote>
        ) : (
          salaryRows.map(({ teacher: t, salary, status }) => {
            const logCount = data.dailyLog.filter((l) => l.teacher === t.name).length;
            const assignedCount = (t.assignedStudentIds || []).length;
            const [pillKind, pillLabel] = STATUS_PILL[status];
            return (
              <div key={t.id} className="border-b border-[var(--line)] py-3.5 last:border-b-0">
                <div className="flex items-center gap-3">
                  <Avatar name={t.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="truncate text-[14px] font-bold text-[var(--ink)]">{t.name}</p>
                      {t.username ? (
                        <span className="flex items-center gap-0.5 rounded-md bg-[var(--bg)] px-1.5 py-0.5 text-[10.5px] font-mono text-[var(--sub)] border border-[var(--line)]">
                          <KeyRound size={10} /> {t.username}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11.5px] text-[var(--sub)]">
                      {logCount} activity log{logCount === 1 ? '' : 's'}
                      {t.qualification ? ` · ${t.qualification}` : ''}
                    </p>
                  </div>
                  <IconButton icon={Pencil} onClick={() => setEditing(t)} />
                  <IconButton icon={Trash2} danger onClick={() => setTarget(t)} />
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-y-2 pl-[46px]">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {t.phone ? (
                      <span className="flex items-center gap-1 text-[11px] text-[var(--sub)]">
                        <Phone size={11} /> {t.phone}
                      </span>
                    ) : null}
                    {t.email ? (
                      <span className="flex items-center gap-1 text-[11px] text-[var(--sub)]">
                        <Mail size={11} /> {t.email}
                      </span>
                    ) : null}
                    <span className="text-[11px] font-semibold text-[var(--ink)]">Rs {salary.toLocaleString()}/mo</span>
                    <Pill kind={pillKind} label={`Salary: ${pillLabel}`} />
                  </div>

                  <button
                    type="button"
                    onClick={() => setAssigningTeacher(t)}
                    className="flex items-center gap-1.5 rounded-lg border border-[var(--role)] bg-[var(--role-bg)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--role-dark)] hover:opacity-90 transition"
                  >
                    <UserCheck size={13} />
                    <span>{assignedCount} Assigned Students</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </Card>

      <TeacherFormModal
        open={!!editing}
        title={editing?.id ? 'Edit Teacher & Credentials' : 'Add Teacher & Create Account'}
        initial={editing?.id ? editing : null}
        saveLabel={editing?.id ? 'Save Changes' : 'Create Teacher Account'}
        onCancel={() => setEditing(null)}
        onSave={handleSave}
      />

      <AssignStudentsModal
        open={!!assigningTeacher}
        teacher={assigningTeacher}
        classes={data.classes}
        students={data.students}
        teachers={data.teachers}
        onCancel={() => setAssigningTeacher(null)}
        onSave={handleSaveAssignments}
      />

      <ConfirmModal
        open={!!target}
        title={target ? `Remove "${target.name}"?` : ''}
        body="This removes them from the staff list along with their salary payment history and unassigns any students assigned to them. Their past activity logs are kept for history."
        confirmLabel="Remove Teacher"
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          deleteTeacher(target.id);
          toast('Teacher removed.', 'success');
          setTarget(null);
        }}
      />
    </ScreenBody>
  );
}
