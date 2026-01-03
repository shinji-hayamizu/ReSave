'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * 今日の学習統計
 */
export type TodayStats = {
  reviewedCount: number;
  correctCount: number;
  timeSpentMinutes: number;
};

/**
 * 日別学習統計
 */
export type DailyStats = {
  date: string;
  reviewedCount: number;
  correctCount: number;
};

/**
 * 累計統計サマリー
 */
export type SummaryStats = {
  totalCards: number;
  totalReviews: number;
  currentStreak: number;
  averageAccuracy: number;
};

/**
 * 今日の学習統計を取得
 */
export async function getTodayStats(): Promise<TodayStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISOString = today.toISOString();

  const { data: logs, error } = await supabase
    .from('study_logs')
    .select('assessment')
    .eq('user_id', user.id)
    .gte('studied_at', todayISOString);

  if (error) {
    throw new Error(`Failed to fetch today's stats: ${error.message}`);
  }

  const reviewedCount = logs?.length ?? 0;
  const correctCount =
    logs?.filter((log) => log.assessment === 'ok' || log.assessment === 'remembered').length ?? 0;

  return {
    reviewedCount,
    correctCount,
    timeSpentMinutes: 0,
  };
}

/**
 * 過去N日間の日別統計を取得
 */
export async function getDailyStats(days: number): Promise<DailyStats[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  const startDateISOString = startDate.toISOString();

  const { data: logs, error } = await supabase
    .from('study_logs')
    .select('studied_at, assessment')
    .eq('user_id', user.id)
    .gte('studied_at', startDateISOString)
    .order('studied_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch daily stats: ${error.message}`);
  }

  const dailyMap = new Map<string, { reviewedCount: number; correctCount: number }>();

  logs?.forEach((log) => {
    const date = new Date(log.studied_at);
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];

    const existing = dailyMap.get(dateKey) ?? { reviewedCount: 0, correctCount: 0 };
    existing.reviewedCount += 1;
    if (log.assessment === 'ok' || log.assessment === 'remembered') {
      existing.correctCount += 1;
    }
    dailyMap.set(dateKey, existing);
  });

  const result: DailyStats[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0];

    const stats = dailyMap.get(dateKey) ?? { reviewedCount: 0, correctCount: 0 };
    result.push({
      date: dateKey,
      reviewedCount: stats.reviewedCount,
      correctCount: stats.correctCount,
    });
  }

  return result;
}

/**
 * 現在の学習ストリークを計算
 * 連続して学習した日数をカウント（今日は活動がなくてもOK）
 */
async function calculateStreak(
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<number> {
  const { data: logs, error } = await supabase
    .from('study_logs')
    .select('studied_at')
    .eq('user_id', userId)
    .order('studied_at', { ascending: false });

  if (error || !logs || logs.length === 0) {
    return 0;
  }

  const studyDates = new Set<string>();
  logs.forEach((log) => {
    const date = new Date(log.studied_at);
    date.setHours(0, 0, 0, 0);
    studyDates.add(date.toISOString().split('T')[0]);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  const hasStudiedToday = studyDates.has(checkDate.toISOString().split('T')[0]);
  if (hasStudiedToday) {
    streak = 1;
  }

  checkDate.setDate(checkDate.getDate() - 1);

  while (studyDates.has(checkDate.toISOString().split('T')[0])) {
    streak += 1;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

/**
 * 累計統計サマリーを取得
 */
export async function getSummaryStats(): Promise<SummaryStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { count: totalCards, error: cardsError } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (cardsError) {
    throw new Error(`Failed to fetch total cards: ${cardsError.message}`);
  }

  const { data: logs, error: logsError } = await supabase
    .from('study_logs')
    .select('assessment')
    .eq('user_id', user.id);

  if (logsError) {
    throw new Error(`Failed to fetch study logs: ${logsError.message}`);
  }

  const totalReviews = logs?.length ?? 0;
  const correctReviews =
    logs?.filter((log) => log.assessment === 'ok' || log.assessment === 'remembered').length ?? 0;
  const averageAccuracy = totalReviews > 0 ? correctReviews / totalReviews : 0;

  const currentStreak = await calculateStreak(user.id, supabase);

  return {
    totalCards: totalCards ?? 0,
    totalReviews,
    currentStreak,
    averageAccuracy,
  };
}
