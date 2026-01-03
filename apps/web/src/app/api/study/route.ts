import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import type { Database } from '@/types/database';
import { submitAssessmentSchema } from '@/validations/study-log';

export const dynamic = 'force-dynamic';

const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 180];

/**
 * 学習結果送信エンドポイント（Mobile用）
 * POST /api/study
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

    let newReviewLevel = card.review_level;
    let nextReviewAt: string | null = null;

    if (assessment === 'ok') {
      newReviewLevel = card.review_level + 1;
      const intervalDays = REVIEW_INTERVALS[newReviewLevel] || REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1];
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + intervalDays);
      nextReviewAt = nextDate.toISOString();
    } else if (assessment === 'again') {
      newReviewLevel = 0;
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + REVIEW_INTERVALS[0]);
      nextReviewAt = nextDate.toISOString();
    } else if (assessment === 'remembered') {
      nextReviewAt = null;
    }

    const { data: updatedCard, error: updateError } = await supabase
      .from('cards')
      .update({
        review_level: newReviewLevel,
        next_review_at: nextReviewAt,
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
        reviewLevel: updatedCard.review_level,
        nextReviewAt: updatedCard.next_review_at,
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
