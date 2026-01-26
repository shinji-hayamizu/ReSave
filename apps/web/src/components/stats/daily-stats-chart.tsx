'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDailyStats } from '@/hooks/useStats';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

function getDayLabel(dateString: string): string {
  const date = new Date(dateString);
  return DAY_LABELS[date.getDay()];
}

interface ChartBarProps {
  value: number;
  heightPercent: number;
  label: string;
}

function ChartBar({ value, heightPercent, label }: ChartBarProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className="text-xs font-medium text-muted-foreground">{value}</div>
      <div
        className="w-full max-w-10 rounded-t bg-primary transition-all duration-300"
        style={{ height: `${Math.max(heightPercent, 4)}%` }}
      />
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ChartBarSkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <Skeleton className="h-3 w-4" />
      <Skeleton className="h-16 w-full max-w-10" />
      <Skeleton className="h-3 w-4" />
    </div>
  );
}

interface DailyStatsChartProps {
  days?: number;
}

export function DailyStatsChart({ days = 7 }: DailyStatsChartProps) {
  const { data: dailyStats, isLoading } = useDailyStats(days);

  const maxValue = dailyStats?.reduce(
    (max, stat) => Math.max(max, stat.reviewedCount),
    0
  ) ?? 0;

  return (
    <Card className="p-6 shadow-sm" data-testid="daily-stats-chart">
      <h3 className="mb-5 text-base font-semibold">日別学習カード数（過去{days}日）</h3>
      <div className="flex h-40 items-end justify-between gap-2 px-2">
        {isLoading ? (
          <>
            {Array.from({ length: days }).map((_, i) => (
              <ChartBarSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            {dailyStats?.map((stat) => (
              <ChartBar
                key={stat.date}
                heightPercent={maxValue > 0 ? (stat.reviewedCount / maxValue) * 100 : 0}
                label={getDayLabel(stat.date)}
                value={stat.reviewedCount}
              />
            ))}
          </>
        )}
      </div>
    </Card>
  );
}

export function DailyStatsChartSkeleton() {
  return (
    <Card className="p-6 shadow-sm">
      <Skeleton className="mb-5 h-5 w-48" />
      <div className="flex h-40 items-end justify-between gap-2 px-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <ChartBarSkeleton key={i} />
        ))}
      </div>
    </Card>
  );
}
