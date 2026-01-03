'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTodayStats, useSummaryStats } from '@/hooks/useStats';

interface StatItemProps {
  value: number;
  unit: string;
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'default';
}

function StatItem({ value, unit, label, variant = 'default' }: StatItemProps) {
  const variantClasses = {
    primary: 'text-primary',
    success: 'text-green-500',
    warning: 'text-orange-500',
    default: 'text-foreground',
  };

  return (
    <div className="rounded-lg bg-background p-4 text-center">
      <div className={`text-2xl font-bold leading-tight ${variantClasses[variant]}`}>
        {value}
        <span className="ml-0.5 text-sm font-medium text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function StatItemSkeleton() {
  return (
    <div className="rounded-lg bg-background p-4 text-center">
      <Skeleton className="mx-auto mb-2 h-6 w-10" />
      <Skeleton className="mx-auto mt-1 h-3 w-16" />
    </div>
  );
}

export function TodaySummary() {
  const { data: todayStats, isLoading: isTodayLoading } = useTodayStats();
  const { data: summaryStats, isLoading: isSummaryLoading } = useSummaryStats();

  const isLoading = isTodayLoading || isSummaryLoading;

  const accuracyRate =
    todayStats && todayStats.reviewedCount > 0
      ? Math.round((todayStats.correctCount / todayStats.reviewedCount) * 100)
      : 0;

  return (
    <Card className="p-4 shadow-sm">
      <h2 className="mb-4 text-base font-semibold">今日の学習</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isLoading ? (
          <>
            <StatItemSkeleton />
            <StatItemSkeleton />
            <StatItemSkeleton />
            <StatItemSkeleton />
          </>
        ) : (
          <>
            <StatItem
              label="学習カード数"
              unit="枚"
              value={todayStats?.reviewedCount ?? 0}
              variant="primary"
            />
            <StatItem
              label="正答率"
              unit="%"
              value={accuracyRate}
              variant="success"
            />
            <StatItem
              label="学習時間"
              unit="分"
              value={todayStats?.timeSpentMinutes ?? 0}
              variant="default"
            />
            <StatItem
              label="連続学習日数"
              unit="日"
              value={summaryStats?.currentStreak ?? 0}
              variant="warning"
            />
          </>
        )}
      </div>
    </Card>
  );
}

export function TodaySummarySkeleton() {
  return (
    <Card className="p-4 shadow-sm">
      <Skeleton className="mb-4 h-5 w-24" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatItemSkeleton />
        <StatItemSkeleton />
        <StatItemSkeleton />
        <StatItemSkeleton />
      </div>
    </Card>
  );
}
