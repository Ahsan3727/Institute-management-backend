'use client';

import React, { useEffect, useState } from 'react';
import { Check, Trash2, Pencil } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useToast } from '@/context/ToastContext';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { Segmented, PrimaryButton, IconButton } from '@/components/Buttons';
import { SelectField, TextField, Label } from '@/components/Inputs';
import { EmptyNote } from '@/components/Lists';
import Pill from '@/components/Pill';
import { ConfirmModal, PromptModal } from '@/components/Modals';
import { todayISO } from '@/utils/helpers';

export default function TeacherSLOsScreen({ params }) {
  const [mode, setMode] = useState(params?.mode || 'feed');

  useEffect(() => {
    if (params?.mode) setMode(params.mode);
  }, [params?.mode]);

  return (
    <ScreenBody>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { label: 'Feed SLOs', value: 'feed' },
          { label: "Today's Coverage", value: 'today' },
        ]}
      />
      {mode === 'feed' ? <FeedSlos /> : <TodayCoverage />}
    </ScreenBody>
  );
}

function FeedSlos() {
  const { data, addSlosFromLines, deleteSlo, editSlo } = useApp();
  const toast = useToast();

  const [classId, setClassId] = useState(data.classes[0]?.id);
  const [subjectId, setSubjectId] = useState(data.subjects[0]?.id);
  const [term, setTerm] = useState('Term 1');
  const [text, setText] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [editing, setEditing] = useState(null);

  const classOptions = data.classes.map((c) => ({ label: c.name, value: c.id }));
  const subjectOptions = data.subjects.map((s) => ({ label: s.name, value: s.id }));
  const termOptions = ['Term 1', 'Term 2', 'Term 3', 'Full Year'].map((t) => ({ label: t, value: t }));

  const list = data.slos.filter((s) => s.classId === classId && s.subjectId === subjectId);

  function handleAdd() {
    const count = addSlosFromLines(classId, subjectId, term, text);
    if (count === 0) {
      toast('Add at least one SLO line.', 'error');
      return;
    }
    setText('');
    toast(`${count} SLO(s) added.`, 'success');
  }

  return (
    <div>
      <Card title="Feed SLOs (for whole Year / Term)">
        <div className="flex gap-2">
          <SelectField options={classOptions} value={classId} onChange={setClassId} className="flex-1" />
          <SelectField options={subjectOptions} value={subjectId} onChange={setSubjectId} className="flex-1" />
        </div>
        <div className="mt-2">
          <SelectField options={termOptions} value={term} onChange={setTerm} />
        </div>
        <div className="mt-2.5">
          <Label>SLOs (one per line)</Label>
          <TextField value={text} onChange={setText} placeholder="One SLO per line…" multiline rows={4} />
        </div>
        <PrimaryButton title="Add New SLO" onClick={handleAdd} className="mt-3" />
      </Card>

      <Card title="SLO List">
        {list.length === 0 ? (
          <EmptyNote>No SLOs fed for this class/subject yet.</EmptyNote>
        ) : (
          list.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2.5 border-b border-[var(--line)] py-2.5 last:border-b-0">
              <span className="shrink-0 rounded-lg bg-[var(--role-bg)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--role-dark)]">
                #{i + 1}
              </span>
              <span className="flex-1 text-[13.5px] text-[var(--ink)]">{s.text}</span>
              <IconButton icon={Pencil} onClick={() => setEditing(s)} />
              <IconButton icon={Trash2} danger onClick={() => setToDelete(s)} />
            </div>
          ))
        )}
      </Card>

      <PromptModal
        open={!!editing}
        title="Edit SLO"
        label="SLO text"
        initialValue={editing?.text || ''}
        onCancel={() => setEditing(null)}
        onSave={(newText) => {
          editSlo(editing.id, newText);
          toast('SLO updated.', 'success');
          setEditing(null);
        }}
      />

      <ConfirmModal
        open={!!toDelete}
        title={toDelete ? `Delete "${toDelete.text}"?` : ''}
        body="This SLO will be removed from the list. Past activity logs referencing it are kept."
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          deleteSlo(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}

function TodayCoverage() {
  const { data, session, addDailyLog, slosCoveredSet } = useApp();
  const toast = useToast();

  const [classId, setClassId] = useState(data.classes[0]?.id);
  const [subjectId, setSubjectId] = useState(data.subjects[0]?.id);
  const [type, setType] = useState('Taught');
  const [date, setDate] = useState(todayISO());
  const [checked, setChecked] = useState(new Set());

  const items = data.slos.filter((s) => s.classId === classId && s.subjectId === subjectId);
  const covered = slosCoveredSet();

  function toggle(id) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    if (checked.size === 0) {
      toast('Tick at least one SLO first.', 'error');
      return;
    }
    addDailyLog(classId, subjectId, date, type, [...checked], session.name);
    setChecked(new Set());
    toast("Saved — visible to Admin and Parents now.", 'success');
  }

  return (
    <Card title="Mark today's teaching / revision">
      <div className="flex gap-2">
        <SelectField
          options={data.classes.map((c) => ({ label: c.name, value: c.id }))}
          value={classId}
          onChange={setClassId}
          className="flex-1"
        />
        <SelectField
          options={data.subjects.map((s) => ({ label: s.name, value: s.id }))}
          value={subjectId}
          onChange={setSubjectId}
          className="flex-1"
        />
      </div>
      <div className="mt-2">
        <SelectField
          options={[
            { label: 'Teach', value: 'Taught' },
            { label: 'Revise', value: 'Revised' },
          ]}
          value={type}
          onChange={setType}
        />
      </div>

      <div className="mt-3">
        {items.length === 0 ? (
          <EmptyNote>No SLOs fed yet — add them in &quot;Feed SLOs&quot; first.</EmptyNote>
        ) : (
          items.map((s) => {
            const on = checked.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggle(s.id)}
                className="flex w-full items-center gap-2.5 border-b border-[var(--line)] py-2.5 text-left last:border-b-0"
              >
                <span
                  className={
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-[1.5px] ' +
                    (on ? 'border-[var(--role)] bg-[var(--role)]' : 'border-[var(--line)]')
                  }
                >
                  {on ? <Check size={12} className="text-white" /> : null}
                </span>
                <span className="flex-1 text-[13.5px] text-[var(--ink)]">{s.text}</span>
                {covered.has(s.id) ? <Pill kind="teach" label="Done before" /> : null}
              </button>
            );
          })
        )}
      </div>

      <PrimaryButton title="Save Today's Coverage" onClick={handleSave} className="mt-3" />
    </Card>
  );
}
