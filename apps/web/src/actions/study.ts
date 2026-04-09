'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import type { SubmitAssessmentInput, StudyStats } from '@/types/study-log';
import type { Card } from '@/types/card';
import { submitAssessmentSchema } from '@/validations/study-log';

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * カード評価を送信し、復習スケジュールを更新
 */
export async function submitAssessment(
  input: SubmitAssessmentInput
): Promise<ActionResult<{ card: Card }>> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: '認証が必要です' };
  }

  const validationResult = submitAssessmentSchema.safeParse(input);
  if (!validationResult.success) {
    return { ok: false, error: validationResult.error.issues[0].message };
  }

  const { cardId, assessment } = validationResult.data;

  const { data: card, error: fetchError } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !card) {
    return { ok: false, error: 'カードが見つかりません' };
  }

  const schedule = card.schedule as number[];
  const isNewCard = card.status === 'new';
  let newCurrentStep = card.current_step;
  let nextReviewAt: string | null = null;
  let newStatus: 'new' | 'active' | 'completed' = card.status as 'new' | 'active' | 'completed';
  let completedAt: string | null = card.completed_at;

  if (assessment === 'ok') {
    if (isNewCard) {
      newStatus = 'active';
    }

    const nextStep = card.current_step + 1;
    if (nextStep >= schedule.length) {
      newCurrentStep = nextStep;
      newStatus = 'completed';
      completedAt = new Date().toISOString();
      nextReviewAt = null;
    } else {
      const daysToAdd = schedule[card.current_step];
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + daysToAdd);
      nextReviewAt = nextDate.toISOString();
      newCurrentStep = nextStep;
    }
  } else if (assessment === 'again') {
    newCurrentStep = 0;
    const daysToAdd = schedule[0];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    nextReviewAt = nextDate.toISOString();
    newStatus = 'active';
    completedAt = null;
  } else if (assessment === 'remembered') {
    newStatus = 'completed';
    completedAt = new Date().toISOString();
    nextReviewAt = null;
  }

  const { error: updateError } = await supabase
    .from('cards')
    .update({
      current_step: newCurrentStep,
      next_review_at: nextReviewAt,
      status: newStatus,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cardId)
    .eq('user_id', user.id);

  if (updateError) {
    return { ok: false, error: 'カードの更新に失敗しました' };
  }

  const { error: logError } = await supabase.from('study_logs').insert({
    user_id: user.id,
    card_id: cardId,
    assessment,
    studied_at: new Date().toISOString(),
  });

  if (logError) {
    return { ok: false, error: '学習ログの記録に失敗しました' };
  }

  const { data: updatedCard, error: refetchError } = await supabase
    .from('cards')
    .select('*')
    .eq('id', cardId)
    .eq('user_id', user.id)
    .single();

  if (refetchError || !updatedCard) {
    return { ok: false, error: 'カードの取得に失敗しました' };
  }

  const mappedCard: Card = {
    id: updatedCard.id,
    userId: updatedCard.user_id,
    front: updatedCard.front,
    back: updatedCard.back,
    sourceUrl: updatedCard.source_url,
    schedule: updatedCard.schedule,
    currentStep: updatedCard.current_step,
    nextReviewAt: updatedCard.next_review_at,
    status: updatedCard.status,
    completedAt: updatedCard.completed_at,
    createdAt: updatedCard.created_at,
    updatedAt: updatedCard.updated_at,
  };

  revalidatePath('/study');
  revalidatePath('/cards');

  return { ok: true, data: { card: mappedCard } };
}

/**
 * 今日の学習セッション情報（カードと統計）を取得
 */
export async function getStudySession(): Promise<
  ActionResult<{
    cards: Array<{
      id: string;
      front: string;
      back: string;
      currentStep: number;
      schedule: number[];
    }>;
    stats: StudyStats;
  }>
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: '認証が必要です' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const { data: dueCards, error: dueError } = await supabase
    .from('cards')
    .select('id, front, back, current_step, schedule')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .lte('next_review_at', new Date().toISOString())
    .order('next_review_at', { ascending: true });

  if (dueError) {
    return { ok: false, error: '学習カードの取得に失敗しました' };
  }

  const { count: totalCount, error: totalError } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (totalError) {
    return { ok: false, error: '統計情報の取得に失敗しました' };
  }

  const { count: completedCount, error: completedError } = await supabase
    .from('study_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('studied_at', todayIso);

  if (completedError) {
    return { ok: false, error: '統計情報の取得に失敗しました' };
  }

  const streak = await calculateStreak(supabase, user.id);

  const mappedCards = (dueCards || []).map((card) => ({
    id: card.id,
    front: card.front,
    back: card.back,
    currentStep: card.current_step,
    schedule: card.schedule as number[],
  }));

  const stats: StudyStats = {
    totalCards: totalCount || 0,
    dueToday: mappedCards.length,
    completedToday: completedCount || 0,
    streak,
  };

  return {
    ok: true,
    data: {
      cards: mappedCards,
      stats,
    },
  };
}

/**
 * ユーザーの現在の学習ストリークを計算
 */
async function calculateStreak(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  const today = new Date();
  let streak = 0;
  const checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    checkDate.setHours(0, 0, 0, 0);
    const startOfDay = checkDate.toISOString();

    checkDate.setHours(23, 59, 59, 999);
    const endOfDay = checkDate.toISOString();

    const { count, error } = await supabase
      .from('study_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('studied_at', startOfDay)
      .lte('studied_at', endOfDay);

    if (error || !count || count === 0) {
      break;
    }

    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}
