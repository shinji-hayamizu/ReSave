'use client';

import { useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import {
  TodaySummary,
  PeriodTabs,
  DailyStatsChart,
  CumulativeStats,
  type StatsPeriod,
} from '@/components/stats';

export default function StatsPage() {
  const [activePeriod, setActivePeriod] = useState<StatsPeriod>('today');

  return (
    <div>
      <PageHeader
        description="学習の進捗を確認しましょう"
        title="統計"
      />
      <div className="space-y-5 p-4 md:p-6">
        <TodaySummary />
        <PeriodTabs
          activePeriod={activePeriod}
          onPeriodChange={setActivePeriod}
        />
        <DailyStatsChart days={activePeriod === 'month' ? 30 : 7} />
        <CumulativeStats />
      </div>
    </div>
  );
}
