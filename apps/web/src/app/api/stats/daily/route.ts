import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import type { Database } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = request.nextUrl;
    const days = parseInt(searchParams.get('days') || '7', 10);
    const clampedDays = Math.min(Math.max(days, 1), 90);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - clampedDays);
    startDate.setHours(0, 0, 0, 0);

    const { data: logs, error } = await supabase
      .from('study_logs')
      .select('studied_at, assessment')
      .eq('user_id', user.id)
      .gte('studied_at', startDate.toISOString())
      .order('studied_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    const dailyMap = new Map<string, { reviewedCount: number; accuracy: number; correctCount: number }>();

    logs?.forEach((log) => {
      const date = new Date(log.studied_at);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];

      const existing = dailyMap.get(dateKey) ?? { reviewedCount: 0, accuracy: 0, correctCount: 0 };
      existing.reviewedCount += 1;
      if (log.assessment === 'ok' || log.assessment === 'remembered') {
        existing.correctCount += 1;
      }
      dailyMap.set(dateKey, existing);
    });

    const result = [];
    for (let i = 0; i < clampedDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (clampedDays - 1 - i));
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().split('T')[0];

      const stats = dailyMap.get(dateKey) ?? { reviewedCount: 0, correctCount: 0 };
      const accuracy = stats.reviewedCount > 0 ? stats.correctCount / stats.reviewedCount : 0;
      result.push({
        date: dateKey,
        reviewedCount: stats.reviewedCount,
        accuracy,
      });
    }

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
