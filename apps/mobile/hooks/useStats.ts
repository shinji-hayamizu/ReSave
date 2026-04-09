import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useSession } from './useSession';
import { statsKeys } from './query-keys';

interface TodayStats {
  reviewedCount: number;
  remainingCount: number;
  accuracy: number;
}

interface DailyStat {
  date: string;
  reviewedCount: number;
  accuracy: number;
}

interface SummaryStats {
  totalCards: number;
  totalReviews: number;
  streak: number;
  averageAccuracy: number;
}

export function useTodayStats() {
  const { token } = useSession();

  return useQuery({
    queryKey: statsKeys.today(),
    queryFn: () => apiClient<TodayStats>('/api/stats/today', { token: token! }),
    enabled: !!token,
  });
}

export function useDailyStats(days: number = 7) {
  const { token } = useSession();

  return useQuery({
    queryKey: statsKeys.daily(days),
    queryFn: () => apiClient<{ data: DailyStat[] }>(`/api/stats/daily?days=${days}`, { token: token! }),
    enabled: !!token,
  });
}

export function useSummaryStats() {
  const { token } = useSession();

  return useQuery({
    queryKey: statsKeys.summary(),
    queryFn: () => apiClient<SummaryStats>('/api/stats/summary', { token: token! }),
    enabled: !!token,
  });
}

export type { TodayStats, DailyStat, SummaryStats };
