'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, Upload, FileSpreadsheet } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useToast } from '@/context/ToastContext';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { SelectField } from '@/components/Inputs';
import { EmptyNote } from '@/components/Lists';
import BulkImportModal from '@/components/BulkImportModal';
import Pill from '@/components/Pill';

export default function AdminSLOsScreen() {
  const { data, bulkAddSlos, slosCoveredSet } = useApp();
  const toast = useToast();

  const [classId, setClassId] = useState(data.classes[0]?.id);
  const [subjectId, setSubjectId] = useState('all');
  const [showBulkModal, setShowBulkModal] = useState(false);

  const covered = slosCoveredSet();
  const subjectOptions = [{ label: 'All Subjects', value: 'all' }, ...data.subjects.map((s) => ({ label: s.name, value: s.id }))];

  const list = data.slos.filter((s) => s.classId === classId && (subjectId === 'all' || s.subjectId === subjectId));
  const done = list.filter((s) => covered.has(s.id)).length;
  const pct = list.length ? Math.round((done / list.length) * 100) : 0;

  function handleBulkImport(rows) {
    bulkAddSlos(rows);
    setShowBulkModal(false);
    toast(`Successfully imported ${rows.length} syllabus SLOs from Excel!`, 'success');
  }

  return (
    <ScreenBody>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setShowBulkModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--role)] py-2.5 text-[13px] font-bold text-white shadow-sm hover:opacity-95"
        >
          <Upload size={15} /> Bulk Upload Syllabus (Excel / CSV)
        </button>
      </div>

      <Card title="Filter Syllabus">
        <div className="flex gap-2.5">
          <SelectField options={data.classes.map((c) => ({ label: c.name, value: c.id }))} value={classId} onChange={setClassId} className="flex-1" />
          <SelectField options={subjectOptions} value={subjectId} onChange={setSubjectId} className="flex-1" />
        </div>
      </Card>

      <Card title={`Coverage — ${done}/${list.length} (${pct}%)`}>
        {list.length === 0 ? (
          <EmptyNote>No SLOs match this filter yet.</EmptyNote>
        ) : (
          list.map((s) => {
            const subj = data.subjects.find((x) => x.id === s.subjectId);
            const isDone = covered.has(s.id);
            const Icon = isDone ? CheckCircle2 : Circle;
            return (
              <div key={s.id} className="flex items-center gap-2.5 border-b border-[var(--line)] py-2.5 last:border-b-0">
                <Icon size={17} className={isDone ? 'text-[var(--green)]' : 'text-[var(--sub)]'} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-[var(--ink)]">{s.text}</p>
                  {subjectId === 'all' ? <p className="text-[11px] text-[var(--sub)]">{subj ? subj.name : ''}</p> : null}
                </div>
                <Pill kind={isDone ? 'teach' : 'slo'} label={isDone ? 'Covered' : 'Pending'} />
              </div>
            );
          })
        )}
      </Card>

      <BulkImportModal
        open={showBulkModal}
        mode="slos"
        classes={data.classes}
        subjects={data.subjects}
        onCancel={() => setShowBulkModal(false)}
        onImport={handleBulkImport}
      />
    </ScreenBody>
  );
}

