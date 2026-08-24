'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Users, Check, Search, UserCheck, AlertCircle } from 'lucide-react';
import { PrimaryButton } from '@/components/Buttons';
import { SelectField, SearchField } from '@/components/Inputs';
import { Avatar, EmptyNote } from '@/components/Lists';

export default function AssignStudentsModal({
  open,
  teacher,
  classes = [],
  students = [],
  teachers = [],
  onCancel,
  onSave,
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open && teacher) {
      setSelectedIds(new Set(teacher.assignedStudentIds || []));
      setSelectedClassId('all');
      setSearch('');
    }
  }, [open, teacher]);

  const classOptions = useMemo(() => {
    return [{ label: 'All Classes', value: 'all' }, ...classes.map((c) => ({ label: c.name, value: c.id }))];
  }, [classes]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass = selectedClassId === 'all' || s.classId === selectedClassId;
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.guardianPhone && s.guardianPhone.includes(search));
      return matchClass && matchSearch;
    });
  }, [students, selectedClassId, search]);

  if (!open || !teacher) return null;

  function toggleStudent(studentId) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  function handleSelectAllInView() {
    const allSelected = filteredStudents.every((s) => selectedIds.has(s.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        filteredStudents.forEach((s) => next.delete(s.id));
      } else {
        filteredStudents.forEach((s) => next.add(s.id));
      }
      return next;
    });
  }

  function handleSave() {
    onSave(teacher.id, Array.from(selectedIds));
  }

  const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedIds.has(s.id));

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 sm:items-center" onClick={onCancel}>
      <div
        className="animate-sheet-up flex max-h-[90vh] w-full max-w-md flex-col rounded-t-[24px] bg-[var(--paper)] p-5 pb-6 sm:rounded-[22px] sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-black/15 sm:hidden" />
        
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--role-bg)] text-[var(--role-dark)]">
                <Users size={16} />
              </div>
              <h3 className="text-[17px] font-bold text-[var(--ink)]">Assign Students</h3>
            </div>
            <p className="mt-0.5 text-[12.5px] text-[var(--sub)]">
              Select students for <strong className="text-[var(--ink)]">{teacher.name}</strong> to handle
            </p>
          </div>
          <div className="rounded-full bg-[var(--role-bg)] px-2.5 py-1 text-[11.5px] font-bold text-[var(--role-dark)]">
            {selectedIds.size} Selected
          </div>
        </div>

        {/* Filters */}
        <div className="mb-3 flex gap-2">
          <SelectField
            options={classOptions}
            value={selectedClassId}
            onChange={setSelectedClassId}
            className="w-1/3"
          />
          <div className="flex-1">
            <SearchField value={search} onChange={setSearch} placeholder="Search student name…" />
          </div>
        </div>

        {/* Action bar */}
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-[11.5px] font-medium text-[var(--sub)]">
            Showing {filteredStudents.length} student{filteredStudents.length === 1 ? '' : 's'}
          </span>
          {filteredStudents.length > 0 ? (
            <button
              type="button"
              onClick={handleSelectAllInView}
              className="text-[11.5px] font-semibold text-[var(--role-dark)] hover:underline"
            >
              {allFilteredSelected ? 'Deselect All in View' : 'Select All in View'}
            </button>
          ) : null}
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-2">
          {filteredStudents.length === 0 ? (
            <EmptyNote>No students found matching your filter.</EmptyNote>
          ) : (
            filteredStudents.map((s) => {
              const isChecked = selectedIds.has(s.id);
              const cls = classes.find((c) => c.id === s.classId);
              const otherTeacher =
                s.assignedTeacherId && s.assignedTeacherId !== teacher.id
                  ? teachers.find((t) => t.id === s.assignedTeacherId)
                  : null;

              return (
                <div
                  key={s.id}
                  onClick={() => toggleStudent(s.id)}
                  className={
                    'mb-1.5 flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition last:mb-0 ' +
                    (isChecked
                      ? 'border-[var(--role)] bg-[var(--paper)] shadow-sm'
                      : 'border-[var(--line)] bg-[var(--paper)] opacity-85 hover:opacity-100')
                  }
                >
                  <div
                    className={
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition ' +
                      (isChecked ? 'border-[var(--role)] bg-[var(--role)] text-white' : 'border-[var(--line)]')
                    }
                  >
                    {isChecked ? <Check size={13} strokeWidth={3} /> : null}
                  </div>

                  <Avatar name={s.name} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-[var(--ink)]">{s.name}</p>
                    <p className="truncate text-[11px] text-[var(--sub)]">
                      {cls ? cls.name : 'No class'}
                      {otherTeacher ? (
                        <span className="ml-1 text-[var(--amber)]">
                          · (Assigned to {otherTeacher.name})
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border-[1.5px] border-[var(--line)] py-3 text-[14px] font-bold text-[var(--ink)]"
          >
            Cancel
          </button>
          <PrimaryButton
            title={`Save ${selectedIds.size} Student${selectedIds.size === 1 ? '' : 's'}`}
            onClick={handleSave}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}
