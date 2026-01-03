'use client';

import { cn } from '@/lib/utils';

export type StatsPeriod = 'today' | 'week' | 'month';

interface PeriodTabsProps {
  activePeriod: StatsPeriod;
  onPeriodChange: (period: StatsPeriod) => void;
}

const PERIODS: { value: StatsPeriod; label: string }[] = [
  { value: 'today', label: '今日' },
  { value: 'week', label: '週間' },
  { value: 'month', label: '月間' },
];

export function PeriodTabs({ activePeriod, onPeriodChange }: PeriodTabsProps) {
  return (
    <div className="flex gap-2 rounded-lg bg-muted p-1">
      {PERIODS.map((period) => (
        <button
          key={period.value}
          className={cn(
            'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
            activePeriod === period.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => onPeriodChange(period.value)}
          type="button"
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
