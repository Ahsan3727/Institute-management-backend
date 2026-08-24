'use client';

import React from 'react';
import { BookOpen, Clipboard, Calendar, BarChart2 } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useNav } from '@/navigation/AppShell';
import ScreenBody from '@/components/ScreenBody';
import GreetCard from '@/components/GreetCard';
import OnboardingBanner from '@/components/OnboardingBanner';
import StatBox, { StatGrid } from '@/components/StatBox';
import Card from '@/components/Card';
import TrendChart from '@/components/charts/TrendChart';
import { ListCard, ListRow, EmptyNote, SectionHeader } from '@/components/Lists';
import Pill from '@/components/Pill';
import { todayISO } from '@/utils/helpers';

const QUICK_ACTIONS = [
  { key: 'feed', icon: BookOpen, label: 'Feed SLOs', tab: 'SLOs', params: { mode: 'feed' } },
  { key: 'today', icon: Clipboard, label: 'Daily SLOs', tab: 'SLOs', params: { mode: 'today' } },
  { key: 'att', icon: Calendar, label: 'Attendance', tab: 'Attendance' },
  { key: 'rep', icon: BarChart2, label: 'Reports', tab: 'Reports' },
];

export default function TeacherDashboard() {
  const { data, session, slosCoveredSet, last7DaysCounts } = useApp();
  const nav = useNav();

  const today = todayISO();
  const todayLogs = [...data.dailyLog].filter((l) => l.date === today).sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const sloToday = new Set();
  todayLogs.forEach((l) => l.sloIds.forEach((id) => sloToday.add(id)));
  const absentToday = data.attendance.filter((a) => a.date === today && a.status === 'absent').length;
  const pct = data.slos.length ? Math.round((slosCoveredSet().size / data.slos.length) * 100) : 0;

  return (
    <ScreenBody>
      {data.classes.length === 0 ? <OnboardingBanner /> : null}
      <GreetCard name={session.name} subtitle="Here's what's happening in your classes today." pct={pct} />

      <StatGrid>
        <StatBox value={data.classes.length} label="Classes" />
        <StatBox value={data.students.length} label="Students" />
        <StatBox value={sloToday.size} label="SLOs Today" />
        <StatBox value={absentToday} label="Absent" colorClass="text-[var(--red)]" />
      </StatGrid>

      <Card title="SLOs Logged — Last 7 Days">
        <TrendChart points={last7DaysCounts((l) => l.teacher === session.name)} />
      </Card>

      <SectionHeader title="Today's Activity" actionLabel="View All" onAction={() => nav.navigate('Reports')} />
      <ListCard>
        {todayLogs.length === 0 ? (
          <EmptyNote>Nothing logged yet today.</EmptyNote>
        ) : (
          todayLogs.slice(0, 6).map((l) => {
            const cls = data.classes.find((c) => c.id === l.classId);
            const subj = data.subjects.find((s) => s.id === l.subjectId);
            const t = new Date(l.ts || Date.now());
            return (
              <ListRow
                key={l.id}
                time={t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                title={`${cls ? cls.name : ''} - ${subj ? subj.name : ''}`}
                subtitle={`${l.sloIds.length} SLO(s)`}
                right={<Pill kind={l.type === 'Taught' ? 'teach' : 'revise'} label={l.type} />}
              />
            );
          })
        )}
      </ListCard>

      <SectionHeader title="Quick Actions" />
      <div className="grid grid-cols-4 gap-2.5">
        {QUICK_ACTIONS.map((qa) => {
          const Icon = qa.icon;
          return (
            <button
              key={qa.key}
              type="button"
              onClick={() => nav.navigate(qa.tab, qa.params)}
              className="flex flex-col items-center rounded-2xl border border-[var(--line)] bg-[var(--paper)] py-3.5"
            >
              <div className="mb-1.5 flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[var(--role-bg)]">
                <Icon size={17} className="text-[var(--role-dark)]" />
              </div>
              <span className="text-center text-[10.5px] font-semibold text-[var(--ink)]">{qa.label}</span>
            </button>
          );
        })}
      </div>
    </ScreenBody>
  );
}
