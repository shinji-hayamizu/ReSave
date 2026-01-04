import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Supabase接続確認エンドポイント
 * GET /api/health
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 環境変数チェック
  const envStatus = {
    supabaseUrl: supabaseUrl ? 'set' : 'missing',
    supabaseAnonKey: supabaseAnonKey ? 'set' : 'missing',
    environment: detectEnvironment(supabaseUrl),
  };

  // 環境変数が未設定の場合
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        status: 'error',
        message: '環境変数が設定されていません',
        env: envStatus,
        supabase: null,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }

  try {
    const supabase = await createClient();

    // 接続テスト: 認証状態を取得
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // データベース接続テスト: cardsテーブルの存在確認
    const { error: dbError } = await supabase.from('cards').select('id').limit(1);

    const dbStatus = dbError
      ? dbError.code === 'PGRST116' // テーブルが存在しない
        ? 'table_not_found'
        : dbError.code === '42501' // RLS権限エラー（未認証）
          ? 'connected_rls_active'
          : 'error'
      : 'connected';

    return NextResponse.json({
      status: 'ok',
      message: 'Supabase接続成功',
      env: envStatus,
      supabase: {
        auth: {
          connected: !authError,
          user: user ? { id: user.id, email: user.email } : null,
        },
        database: {
          status: dbStatus,
          error: dbError?.message || null,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Supabase接続失敗',
        env: envStatus,
        supabase: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 接続先環境を判定
 */
function detectEnvironment(url: string | undefined): string {
  if (!url) return 'unknown';

  if (url.includes('127.0.0.1') || url.includes('localhost')) {
    return 'local';
  }

  if (url.includes('.supabase.co')) {
    // プロジェクトIDから環境を推測
    const projectId = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (projectId) {
      if (projectId.includes('dev') || projectId.includes('staging')) {
        return 'development';
      }
      return 'production';
    }
  }

  return 'custom';
}


