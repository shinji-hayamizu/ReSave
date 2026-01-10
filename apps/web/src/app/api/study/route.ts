import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import type { Database } from '@/types/database';
import { submitAssessmentSchema } from '@/validations/study-log';

export const dynamic = 'force-dynamic';

/**
 * 学習結果送信 (Mobile用)
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    );
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証に失敗しました' } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = submitAssessmentSchema.parse(body);

    const { cardId, assessment } = validatedData;

    const { data: card, error: fetchError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !card) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'カードが見つかりません' } },
        { status: 404 }
      );
    }

    const schedule = card.schedule as number[];
    const isNewCard = card.status === 'new';
    let newCurrentStep = card.current_step;
    let nextReviewAt: string | null = null;
    let newStatus: 'new' | 'active' | 'completed' = card.status;
    let completedAt: string | null = card.completed_at;

    if (assessment === 'ok') {
      if (isNewCard) {
        newCurrentStep = 0;
        newStatus = 'active';
      } else {
        newCurrentStep = card.current_step + 1;
      }

      if (newCurrentStep >= schedule.length) {
        newStatus = 'completed';
        completedAt = new Date().toISOString();
        nextReviewAt = null;
      } else {
        const daysToAdd = schedule[newCurrentStep];
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + daysToAdd);
        nextReviewAt = nextDate.toISOString();
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

    const { data: updatedCard, error: updateError } = await supabase
      .from('cards')
      .update({
        current_step: newCurrentStep,
        next_review_at: nextReviewAt,
        status: newStatus,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cardId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !updatedCard) {
      return NextResponse.json(
        { error: { code: 'UPDATE_FAILED', message: 'カードの更新に失敗しました' } },
        { status: 500 }
      );
    }

    const { error: logError } = await supabase.from('study_logs').insert({
      user_id: user.id,
      card_id: cardId,
      assessment,
      studied_at: new Date().toISOString(),
    });

    if (logError) {
      console.error('学習ログの記録に失敗しました:', logError);
    }

    return NextResponse.json(
      {
        id: updatedCard.id,
        userId: updatedCard.user_id,
        front: updatedCard.front,
        back: updatedCard.back,
        schedule: updatedCard.schedule,
        currentStep: updatedCard.current_step,
        nextReviewAt: updatedCard.next_review_at,
        status: updatedCard.status,
        completedAt: updatedCard.completed_at,
        createdAt: updatedCard.created_at,
        updatedAt: updatedCard.updated_at,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'リクエストが不正です' } },
        { status: 400 }
      );
    }

    console.error('学習結果送信エラー:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'サーバーエラーが発生しました' } },
      { status: 500 }
    );
  }
}
