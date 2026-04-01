'use client';

import { Layers, RotateCcw, Flame, Target } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { useSummaryStats } from '@/hooks/useStats';

interface CumulativeStatItemProps {
  icon: React.ReactNode;
  value: number | string;
  unit: string;
  label: string;
}

function CumulativeStatItem({ icon, value, unit, label }: CumulativeStatItemProps) {
  return (
    <div className="rounded-lg border bg-background p-4 text-center">
      <div className="mx-auto mb-2 h-6 w-6 text-primary">{icon}</div>
      <div className="text-2xl font-bold text-foreground">
        {value}
        <span className="ml-0.5 text-xs font-medium text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function CumulativeStatItemSkeleton() {
  return (
    <div className="rounded-lg border bg-background p-4 text-center">
      <Skeleton className="mx-auto mb-2 h-6 w-6" />
      <Skeleton className="mx-auto h-7 w-12" />
      <Skeleton className="mx-auto mt-1 h-3 w-16" />
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return num.toLocaleString();
  }
  return String(num);
}

export function CumulativeStats() {
  const { data: summaryStats, isLoading } = useSummaryStats();

  const averageAccuracyPercent = summaryStats
    ? Math.round(summaryStats.averageAccuracy * 100)
    : 0;

  return (
    <div>
      <h3 className="mb-4 mt-6 text-base font-semibold">累計統計</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {isLoading ? (
          <>
            <CumulativeStatItemSkeleton />
            <CumulativeStatItemSkeleton />
            <CumulativeStatItemSkeleton />
            <CumulativeStatItemSkeleton />
          </>
        ) : (
          <>
            <CumulativeStatItem
              icon={<Layers className="h-6 w-6" />}
              label="総カード数"
              unit="枚"
              value={formatNumber(summaryStats?.totalCards ?? 0)}
            />
            <CumulativeStatItem
              icon={<RotateCcw className="h-6 w-6" />}
              label="総復習回数"
              unit="回"
              value={formatNumber(summaryStats?.totalReviews ?? 0)}
            />
            <CumulativeStatItem
              icon={<Flame className="h-6 w-6" />}
              label="連続学習日数"
              unit="日"
              value={summaryStats?.currentStreak ?? 0}
            />
            <CumulativeStatItem
              icon={<Target className="h-6 w-6" />}
              label="平均正答率"
              unit="%"
              value={averageAccuracyPercent}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function CumulativeStatsSkeleton() {
  return (
    <div>
      <Skeleton className="mb-4 mt-6 h-5 w-20" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CumulativeStatItemSkeleton />
        <CumulativeStatItemSkeleton />
        <CumulativeStatItemSkeleton />
        <CumulativeStatItemSkeleton />
      </div>
    </div>
  );
}
