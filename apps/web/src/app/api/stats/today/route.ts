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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: logs, error } = await supabase
      .from('study_logs')
      .select('assessment')
      .eq('user_id', user.id)
      .gte('studied_at', today.toISOString());

    if (error) {
      return NextResponse.json(
        { error: { code: 'DATABASE_ERROR', message: error.message } },
        { status: 500 }
      );
    }

    const reviewedCount = logs?.length ?? 0;
    const correctCount =
      logs?.filter((log) => log.assessment === 'ok' || log.assessment === 'remembered').length ?? 0;

    const { count: dueCount } = await supabase
      .from('cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active')
      .lte('next_review_at', new Date().toISOString());

    const remainingCount = dueCount ?? 0;
    const accuracy = reviewedCount > 0 ? correctCount / reviewedCount : 0;

    return NextResponse.json({ reviewedCount, remainingCount, accuracy });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
