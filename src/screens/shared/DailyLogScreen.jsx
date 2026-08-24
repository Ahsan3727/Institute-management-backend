'use client';

import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import ScreenBody from '@/components/ScreenBody';
import Card from '@/components/Card';
import { SelectField, SearchField } from '@/components/Inputs';
import { ListCard, ListRow, EmptyNote } from '@/components/Lists';
import Pill from '@/components/Pill';
import { fmtDate } from '@/utils/helpers';

export default function DailyLogScreen() {
  const { data, session } = useApp();

  const [classId, setClassId] = useState('all');
  const [search, setSearch] = useState('');

  const classOptions = [{ label: 'All Classes', value: 'all' }, ...data.classes.map((c) => ({ label: c.name, value: c.id }))];

  let logs = [...data.dailyLog].sort((a, b) => (b.ts || 0) - (a.ts || 0));
  if (classId !== 'all') logs = logs.filter((l) => l.classId === classId);
  if (session.role === 'teacher') logs = logs.filter((l) => l.teacher === session.name);
  if (search) {
    const q = search.toLowerCase();
    logs = logs.filter((l) =>
      l.sloIds.some((id) => {
        const slo = data.slos.find((s) => s.id === id);
        return slo && slo.text.toLowerCase().includes(q);
      })
    );
  }

  return (
    <ScreenBody>
      <Card>
        <SelectField options={classOptions} value={classId} onChange={setClassId} className="mb-2.5" />
        <SearchField value={search} onChange={setSearch} placeholder="Search SLO text…" />
      </Card>

      <Card title={`${logs.length} entr${logs.length === 1 ? 'y' : 'ies'}`}>
        {logs.length === 0 ? (
          <EmptyNote>No activity found.</EmptyNote>
        ) : (
          <ListCard className="m-0 border-0 p-0">
            {logs.map((l) => {
              const cls = data.classes.find((c) => c.id === l.classId);
              const subj = data.subjects.find((s) => s.id === l.subjectId);
              return (
                <ListRow
                  key={l.id}
                  alignStart
                  icon={BookOpen}
                  title={`${cls ? cls.name : ''} · ${subj ? subj.name : ''}`}
                  subtitle={`${l.teacher || ''} · ${fmtDate(l.date)} · ${l.sloIds.length} SLO(s)`}
                  right={<Pill kind={l.type === 'Taught' ? 'teach' : 'revise'} label={l.type} />}
                />
              );
            })}
          </ListCard>
        )}
      </Card>
    </ScreenBody>
  );
}
