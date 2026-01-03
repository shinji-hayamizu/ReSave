'use client';

import { useQuery } from '@tanstack/react-query';

import type { TodayStats, DailyStats, SummaryStats } from '@/actions/stats';

export const statsKeys = {
  all: ['stats'] as const,
  today: () => [...statsKeys.all, 'today'] as const,
  daily: (days: number) => [...statsKeys.all, 'daily', days] as const,
  summary: () => [...statsKeys.all, 'summary'] as const,
};

export function useTodayStats() {
  return useQuery<TodayStats>({
    queryKey: statsKeys.today(),
    queryFn: async () => {
      const { getTodayStats } = await import('@/actions/stats');
      return getTodayStats();
    },
  });
}

export function useDailyStats(days: number = 7) {
  return useQuery<DailyStats[]>({
    queryKey: statsKeys.daily(days),
    queryFn: async () => {
      const { getDailyStats } = await import('@/actions/stats');
      return getDailyStats(days);
    },
  });
}

export function useSummaryStats() {
  return useQuery<SummaryStats>({
    queryKey: statsKeys.summary(),
    queryFn: async () => {
      const { getSummaryStats } = await import('@/actions/stats');
      return getSummaryStats();
    },
  });
}
