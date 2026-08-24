'use client';

import React, { useState } from 'react';
import { Trash2, Pencil, Plus, Phone, Mail, GraduationCap } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useToast } from '@/context/ToastContext';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { PrimaryButton, IconButton } from '@/components/Buttons';
import { Avatar, EmptyNote } from '@/components/Lists';
import { ConfirmModal } from '@/components/Modals';
import TeacherFormModal from '@/components/TeacherFormModal';
import Pill from '@/components/Pill';
import { todayISO } from '@/utils/helpers';

const STATUS_PILL = { paid: ['teach', 'Paid'], partial: ['revise', 'Partial'], pending: ['absent', 'Pending'], 'n/a': ['slo', 'No salary set'] };

export default function AdminTeachersScreen() {
  const { data, addTeacher, editTeacher, nameExists, deleteTeacher, getSalaryRows } = useApp();
  const toast = useToast();
  const [target, setTarget] = useState(null);
  const [editing, setEditing] = useState(null); // teacher object being edited, or {} for "adding new"
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
      toast('Teacher added.', 'success');
    }
    setEditing(null);
  }

  return (
    <ScreenBody>
      <PrimaryButton title="Add Teacher" icon={Plus} onClick={() => setEditing({})} className="mb-4" />

      <Card title="Teaching Staff">
        {data.teachers.length === 0 ? (
          <EmptyNote>No teachers added yet — tap "Add Teacher" above.</EmptyNote>
        ) : (
          salaryRows.map(({ teacher: t, salary, status }) => {
            const logCount = data.dailyLog.filter((l) => l.teacher === t.name).length;
            const [pillKind, pillLabel] = STATUS_PILL[status];
            return (
              <div key={t.id} className="border-b border-[var(--line)] py-3 last:border-b-0">
                <div className="flex items-center gap-3">
                  <Avatar name={t.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-[var(--ink)]">{t.name}</p>
                    <p className="text-[11.5px] text-[var(--sub)]">
                      {logCount} activity log{logCount === 1 ? '' : 's'}
                      {t.qualification ? ` · ${t.qualification}` : ''}
                    </p>
                  </div>
                  <IconButton icon={Pencil} onClick={() => setEditing(t)} />
                  <IconButton icon={Trash2} danger onClick={() => setTarget(t)} />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 pl-[46px]">
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
                  <Pill kind={pillKind} label={`This month: ${pillLabel}`} />
                </div>
              </div>
            );
          })
        )}
      </Card>

      <TeacherFormModal
        open={!!editing}
        title={editing?.id ? 'Edit teacher' : 'Add a teacher'}
        initial={editing?.id ? editing : null}
        saveLabel={editing?.id ? 'Save Changes' : 'Add Teacher'}
        onCancel={() => setEditing(null)}
        onSave={handleSave}
      />

      <ConfirmModal
        open={!!target}
        title={target ? `Remove "${target.name}"?` : ''}
        body="This removes them from the staff list along with their salary payment history. Their past activity logs are kept for history."
        confirmLabel="Remove"
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
