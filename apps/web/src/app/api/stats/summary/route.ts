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
    const { count: totalCards } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { data: logs, error: logsError } = await supabase
      .from('study_logs')
      .select('assessment, studied_at')
      .eq('user_id', user.id)
      .order('studied_at', { ascending: false });

    if (logsError) {
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: logsError.message } },
        { status: 500 }
      );
    }

    const totalReviews = logs?.length ?? 0;
    const correctReviews =
      logs?.filter((log) => log.assessment === 'ok' || log.assessment === 'remembered').length ?? 0;
    const averageAccuracy = totalReviews > 0 ? correctReviews / totalReviews : 0;

    const studyDates = new Set<string>();
    logs?.forEach((log) => {
      const date = new Date(log.studied_at);
      date.setHours(0, 0, 0, 0);
      studyDates.add(date.toISOString().split('T')[0]!);
    });

    let streak = 0;
    const checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    if (studyDates.has(checkDate.toISOString().split('T')[0]!)) {
      streak = 1;
    }

    checkDate.setDate(checkDate.getDate() - 1);

    while (studyDates.has(checkDate.toISOString().split('T')[0]!)) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return NextResponse.json({
      totalCards: totalCards ?? 0,
      totalReviews,
      streak,
      averageAccuracy,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
