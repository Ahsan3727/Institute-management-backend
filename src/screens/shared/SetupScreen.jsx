'use client';

import React, { useState } from 'react';
import { Trash2, Pencil, Plus } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useToast } from '@/context/ToastContext';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { TextField } from '@/components/Inputs';
import { SmallButton, PrimaryButton, IconButton } from '@/components/Buttons';
import { Avatar, EmptyNote } from '@/components/Lists';
import { ConfirmModal, PromptModal } from '@/components/Modals';
import StudentFormModal from '@/components/StudentFormModal';
import { SearchField } from '@/components/Inputs';

export default function SetupScreen() {
  const { session } = useApp();
  const canEdit = session.role === 'teacher' || session.role === 'admin';
  const isAdmin = session.role === 'admin';

  return (
    <ScreenBody>
      <ClassesSection canEdit={canEdit} />
      <SubjectsSection canEdit={canEdit} />
      <StudentsSection canEdit={canEdit} isAdmin={isAdmin} />
      <BackupSection />
    </ScreenBody>
  );
}

function ClassesSection({ canEdit }) {
  const { data, addClass, editClass, nameExists, classDependentCounts, deleteClass } = useApp();
  const toast = useToast();
  const [name, setName] = useState('');
  const [target, setTarget] = useState(null);
  const [editing, setEditing] = useState(null);

  function handleAdd() {
    const v = name.trim();
    if (!v) return;
    if (nameExists(data.classes, v)) {
      toast('A class with that name already exists.', 'error');
      return;
    }
    addClass(v);
    setName('');
    toast('Class added.', 'success');
  }

  function handleSaveEdit(newName) {
    if (nameExists(data.classes, newName, editing.id)) {
      toast('Another class already has that name.', 'error');
      return;
    }
    editClass(editing.id, newName);
    toast('Class renamed.', 'success');
    setEditing(null);
  }

  return (
    <>
      <Card title="Add a class">
        <div className="flex items-center gap-2.5">
          <TextField value={name} onChange={setName} placeholder="e.g. Class 9" className="flex-1" />
          <SmallButton title="Add" onClick={handleAdd} />
        </div>
      </Card>
      <Card title="Classes">
        {data.classes.length === 0 ? (
          <EmptyNote>No classes yet — add your first one above.</EmptyNote>
        ) : (
          data.classes.map((c) => (
            <div key={c.id} className="flex items-center gap-2 border-b border-[var(--line)] py-2.5 last:border-b-0">
              <span className="flex-1 truncate text-[13.5px] font-semibold text-[var(--ink)]">{c.name}</span>
              <span className="shrink-0 text-[11.5px] text-[var(--sub)]">{data.students.filter((s) => s.classId === c.id).length} students</span>
              {canEdit ? (
                <>
                  <IconButton icon={Pencil} onClick={() => setEditing(c)} />
                  <IconButton icon={Trash2} danger onClick={() => setTarget(c)} />
                </>
              ) : null}
            </div>
          ))
        )}
      </Card>

      <PromptModal
        open={!!editing}
        title="Rename class"
        label="Class name"
        initialValue={editing?.name || ''}
        onCancel={() => setEditing(null)}
        onSave={handleSaveEdit}
      />

      <ConfirmModal
        open={!!target}
        title={target ? `Delete "${target.name}"?` : ''}
        body={
          target
            ? (() => {
                const dep = classDependentCounts(target.id);
                return `This also removes ${dep.students} student(s), ${dep.slos} SLO(s), ${dep.logs} activity log entr${dep.logs === 1 ? 'y' : 'ies'} and ${dep.attendance} attendance record(s) tied to this class. This can't be undone.`;
              })()
            : ''
        }
        confirmLabel="Delete class"
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          deleteClass(target.id);
          toast('Class deleted.', 'success');
          setTarget(null);
        }}
      />
    </>
  );
}

function SubjectsSection({ canEdit }) {
  const { data, addSubject, editSubject, nameExists, subjectDependentCounts, deleteSubject } = useApp();
  const toast = useToast();
  const [name, setName] = useState('');
  const [target, setTarget] = useState(null);
  const [editing, setEditing] = useState(null);

  function handleAdd() {
    const v = name.trim();
    if (!v) return;
    if (nameExists(data.subjects, v)) {
      toast('A subject with that name already exists.', 'error');
      return;
    }
    addSubject(v);
    setName('');
    toast('Subject added.', 'success');
  }

  function handleSaveEdit(newName) {
    if (nameExists(data.subjects, newName, editing.id)) {
      toast('Another subject already has that name.', 'error');
      return;
    }
    editSubject(editing.id, newName);
    toast('Subject renamed.', 'success');
    setEditing(null);
  }

  return (
    <>
      <Card title="Add a subject">
        <div className="flex items-center gap-2.5">
          <TextField value={name} onChange={setName} placeholder="e.g. Urdu" className="flex-1" />
          <SmallButton title="Add" onClick={handleAdd} />
        </div>
      </Card>
      <Card title="Subjects">
        {data.subjects.length === 0 ? (
          <EmptyNote>No subjects yet — add your first one above.</EmptyNote>
        ) : (
          data.subjects.map((s) => (
            <div key={s.id} className="flex items-center gap-2 border-b border-[var(--line)] py-2.5 last:border-b-0">
              <span className="flex-1 truncate text-[13.5px] font-semibold text-[var(--ink)]">{s.name}</span>
              <span className="shrink-0 text-[11.5px] text-[var(--sub)]">{data.slos.filter((x) => x.subjectId === s.id).length} SLOs</span>
              {canEdit ? (
                <>
                  <IconButton icon={Pencil} onClick={() => setEditing(s)} />
                  <IconButton icon={Trash2} danger onClick={() => setTarget(s)} />
                </>
              ) : null}
            </div>
          ))
        )}
      </Card>

      <PromptModal
        open={!!editing}
        title="Rename subject"
        label="Subject name"
        initialValue={editing?.name || ''}
        onCancel={() => setEditing(null)}
        onSave={handleSaveEdit}
      />

      <ConfirmModal
        open={!!target}
        title={target ? `Delete "${target.name}"?` : ''}
        body={
          target
            ? (() => {
                const dep = subjectDependentCounts(target.id);
                return `This also removes ${dep.slos} SLO(s) and ${dep.logs} activity log entr${dep.logs === 1 ? 'y' : 'ies'} tied to this subject. This can't be undone.`;
              })()
            : ''
        }
        confirmLabel="Delete subject"
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          deleteSubject(target.id);
          toast('Subject deleted.', 'success');
          setTarget(null);
        }}
      />
    </>
  );
}

function StudentsSection({ canEdit, isAdmin }) {
  const { data, addStudent, editStudent, studentDependentCounts, deleteStudent } = useApp();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState(null);
  const [editing, setEditing] = useState(null); // student object, or {} for "adding new"

  const classOptions = data.classes.map((c) => ({ label: c.name, value: c.id }));
  const list = search ? data.students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase())) : data.students;

  function handleSave(form) {
    if (editing && editing.id) {
      if (data.students.some((s) => s.id !== editing.id && s.classId === form.classId && s.name.toLowerCase() === form.name.toLowerCase())) {
        toast('That student is already in this class.', 'error');
        return;
      }
      // Non-admins don't see the fee field in the form — keep the existing fee untouched.
      const updates = isAdmin ? form : { ...form, tuitionFee: editing.tuitionFee };
      editStudent(editing.id, updates);
      toast('Student updated.', 'success');
    } else {
      if (data.students.some((s) => s.classId === form.classId && s.name.toLowerCase() === form.name.toLowerCase())) {
        toast('That student is already in this class.', 'error');
        return;
      }
      addStudent(form);
      toast('Student added.', 'success');
    }
    setEditing(null);
  }

  return (
    <>
      <Card title="Students">
        {classOptions.length === 0 ? (
          <EmptyNote>Add a class first before adding students.</EmptyNote>
        ) : (
          <PrimaryButton title="Add Student" icon={Plus} onClick={() => setEditing({})} className="mb-3" />
        )}
        <SearchField value={search} onChange={setSearch} placeholder="Search students…" />
        {list.length === 0 ? (
          <EmptyNote>{data.students.length === 0 ? 'No students yet.' : 'No students found.'}</EmptyNote>
        ) : (
          list.map((s) => {
            const cls = data.classes.find((c) => c.id === s.classId);
            return (
              <div key={s.id} className="flex items-center gap-2 border-b border-[var(--line)] py-2.5 last:border-b-0">
                <Avatar name={s.name} />
                <div className="ml-1 min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-[var(--ink)]">{s.name}</p>
                  <p className="truncate text-[11px] text-[var(--sub)]">
                    {cls ? cls.name : '—'}
                    {s.guardianPhone ? ` · ${s.guardianPhone}` : ''}
                  </p>
                </div>
                {isAdmin && s.tuitionFee ? (
                  <span className="shrink-0 text-[11px] font-semibold text-[var(--ink)]">Rs {s.tuitionFee.toLocaleString()}/mo</span>
                ) : null}
                {canEdit ? (
                  <>
                    <IconButton icon={Pencil} onClick={() => setEditing(s)} />
                    <IconButton icon={Trash2} danger onClick={() => setTarget(s)} />
                  </>
                ) : null}
              </div>
            );
          })
        )}
      </Card>

      <StudentFormModal
        open={!!editing}
        title={editing?.id ? 'Edit student' : 'Add a student'}
        initial={editing?.id ? editing : null}
        classOptions={classOptions}
        showFee={isAdmin}
        saveLabel={editing?.id ? 'Save Changes' : 'Add Student'}
        onCancel={() => setEditing(null)}
        onSave={handleSave}
      />

      <ConfirmModal
        open={!!target}
        title={target ? `Remove "${target.name}"?` : ''}
        body={
          target
            ? (() => {
                const dep = studentDependentCounts(target.id);
                return `This also removes ${dep.attendance} attendance record(s), ${dep.tests} test result(s) and ${dep.feePayments} fee payment record(s) for this student. This can't be undone.`;
              })()
            : ''
        }
        confirmLabel="Remove student"
        onCancel={() => setTarget(null)}
        onConfirm={() => {
          deleteStudent(target.id);
          toast('Student removed.', 'success');
          setTarget(null);
        }}
      />
    </>
  );
}

function BackupSection() {
  const { exportSnapshot, resetDemoData, clearAllData } = useApp();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  async function handleExport() {
    const text = exportSnapshot();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text, title: 'SLO Tracker Backup' });
        return;
      } catch (e) {
        /* fall through to copy */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast('Backup JSON copied to clipboard.', 'success');
    } catch (e) {
      toast('Could not export.', 'error');
    }
  }

  return (
    <Card title="Backup & Restore">
      <p className="mb-3 text-xs leading-[17px] text-[var(--sub)]">
        Your data lives only in this browser. Export a backup now and then to be safe.
      </p>
      <SmallButton title="Export backup" onClick={handleExport} className="mb-2.5 w-full" />

      <div className="mt-1 flex flex-col gap-2.5">
        <PrimaryButton title="Start fresh — clear all data" onClick={() => setConfirmClear(true)} className="!bg-[var(--red)]" />
        <PrimaryButton title="Reset to demo/sample data" dark onClick={() => setConfirmReset(true)} />
      </div>

      <ConfirmModal
        open={confirmClear}
        title="Clear all data and start fresh?"
        body="This permanently deletes every class, subject, teacher, student, SLO, attendance record, test result, fee payment and salary payment stored in this browser — giving you a completely blank app to build your real school's data in. This can't be undone."
        confirmLabel="Clear everything"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearAllData();
          toast('All data cleared. Add your first class to get started.', 'success');
          setConfirmClear(false);
        }}
      />

      <ConfirmModal
        open={confirmReset}
        title="Reset to demo data?"
        body="This deletes everything currently stored in this browser and restores the original sample classes, subjects and students — useful if you just want to explore the app again."
        confirmLabel="Reset"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemoData();
          toast('Demo data restored.', 'success');
          setConfirmReset(false);
        }}
      />
    </Card>
  );
}
