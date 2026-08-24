'use client';

import React from 'react';
import { BookOpen, Wallet, ChevronRight } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { useNav } from '@/navigation/AppShell';
import ScreenBody from '@/components/ScreenBody';
import GreetCard from '@/components/GreetCard';
import OnboardingBanner from '@/components/OnboardingBanner';
import StatBox, { StatGrid } from '@/components/StatBox';
import Card from '@/components/Card';
import DonutChart from '@/components/charts/DonutChart';
import BarChart from '@/components/charts/BarChart';
import TrendChart from '@/components/charts/TrendChart';
import { ListCard, ListRow, EmptyNote, SectionHeader } from '@/components/Lists';
import { timeAgo, todayISO } from '@/utils/helpers';

export default function AdminDashboard() {
  const { data, session, slosCoveredSet, last7DaysCounts, getFinanceSummary } = useApp();
  const nav = useNav();

  const all = data.slos;
  const covered = slosCoveredSet();
  const doneCount = all.filter((s) => covered.has(s.id)).length;
  const pct = all.length ? Math.round((doneCount / all.length) * 100) : 0;
  const recent = [...data.dailyLog].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 6);
  const finance = getFinanceSummary(todayISO().slice(0, 7));

  const classBars = data.classes.map((c) => {
    const clsSlos = data.slos.filter((s) => s.classId === c.id);
    const done = clsSlos.filter((s) => covered.has(s.id)).length;
    return { label: c.name, sub: `${done}/${clsSlos.length} SLOs`, pct: clsSlos.length ? Math.round((done / clsSlos.length) * 100) : 0 };
  });

  return (
    <ScreenBody>
      {data.classes.length === 0 ? <OnboardingBanner /> : null}
      <GreetCard name={session.name} subtitle="Overview of all classes and SLOs." pct={pct} pctLabel="School-wide coverage" />

      <button
        type="button"
        onClick={() => nav.navigate('Finance')}
        className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-4 text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--role-bg)]">
          <Wallet size={18} className="text-[var(--role-dark)]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold text-[var(--ink)]">This Month&apos;s Income: Rs {finance.collectedIncome.toLocaleString()}</p>
          <p className="text-[11.5px] text-[var(--sub)]">To pay teachers: Rs {finance.pendingPayroll.toLocaleString()} · tap for Finance</p>
        </div>
        <ChevronRight size={16} className="text-[var(--sub)]" />
      </button>

      <StatGrid>
        <StatBox value={data.teachers.length} label="Teachers" />
        <StatBox value={data.classes.length} label="Classes" />
        <StatBox value={data.students.length} label="Students" />
        <StatBox value={all.length} label="SLOs Total" />
      </StatGrid>

      <Card title="SLOs Overall Progress">
        <DonutChart
          pct={pct}
          legendItems={[
            { label: 'Completed', value: doneCount, colorClass: 'bg-[var(--green)]' },
            { label: 'Remaining', value: all.length - doneCount, colorClass: 'bg-[var(--line)]' },
          ]}
        />
      </Card>

      <Card title="Coverage by Class">
        <BarChart items={classBars} />
      </Card>

      <Card title="Activity — Last 7 Days">
        <TrendChart points={last7DaysCounts(() => true)} />
      </Card>

      <SectionHeader title="Recent Activity" actionLabel="View All" onAction={() => nav.navigate('DailyLog')} />
      <ListCard>
        {recent.length === 0 ? (
          <EmptyNote>No teaching activity yet.</EmptyNote>
        ) : (
          recent.map((l) => {
            const cls = data.classes.find((c) => c.id === l.classId);
            const subj = data.subjects.find((s) => s.id === l.subjectId);
            const firstSlo = data.slos.find((s) => s.id === l.sloIds[0]);
            return (
              <ListRow
                key={l.id}
                icon={BookOpen}
                title={`${l.teacher || 'A teacher'} ${l.type.toLowerCase()} "${firstSlo ? firstSlo.text : 'SLO'}"`}
                subtitle={`${cls ? cls.name : ''} · ${subj ? subj.name : ''}`}
                right={<span className="shrink-0 text-[11px] text-[var(--sub)]">{timeAgo(l.ts || Date.now())}</span>}
              />
            );
          })
        )}
      </ListCard>
    </ScreenBody>
  );
}
