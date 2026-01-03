#!/usr/bin/env npx tsx
/**
 * Supabase接続確認スクリプト
 *
 * 使用方法:
 *   npx tsx scripts/check-supabase.ts
 *   npx tsx scripts/check-supabase.ts --local
 *   npx tsx scripts/check-supabase.ts --prod
 */

import { createClient } from '@supabase/supabase-js';

// ANSIカラーコード
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

// ローカルSupabaseのデフォルト設定
const LOCAL_CONFIG = {
  url: 'http://127.0.0.1:54321',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
};

interface CheckResult {
  name: string;
  status: 'ok' | 'error' | 'warning';
  message: string;
  details?: string;
}

async function checkSupabase(mode: 'local' | 'env'): Promise<void> {
  console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.cyan}  Supabase 接続確認${colors.reset}`);
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  const results: CheckResult[] = [];

  // 接続情報の取得
  let url: string;
  let anonKey: string;
  let envName: string;

  if (mode === 'local') {
    url = LOCAL_CONFIG.url;
    anonKey = LOCAL_CONFIG.anonKey;
    envName = 'ローカル (supabase start)';
  } else {
    url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    envName = detectEnvironment(url);
  }

  console.log(`${colors.blue}環境:${colors.reset} ${envName}`);
  console.log(`${colors.blue}URL:${colors.reset} ${url || '(未設定)'}`);
  console.log(`${colors.blue}Anon Key:${colors.reset} ${anonKey ? maskKey(anonKey) : '(未設定)'}`);
  console.log();

  // 1. 環境変数チェック
  if (!url) {
    results.push({
      name: '環境変数',
      status: 'error',
      message: 'NEXT_PUBLIC_SUPABASE_URL が設定されていません',
    });
  } else if (!anonKey) {
    results.push({
      name: '環境変数',
      status: 'error',
      message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません',
    });
  } else {
    results.push({
      name: '環境変数',
      status: 'ok',
      message: '設定済み',
    });
  }

  // 環境変数が未設定の場合は終了
  if (!url || !anonKey) {
    printResults(results);
    console.log(`\n${colors.yellow}ヒント:${colors.reset}`);
    console.log('  ローカル環境: npx tsx scripts/check-supabase.ts --local');
    console.log('  本番環境: apps/web/.env.local に環境変数を設定してください');
    process.exit(1);
  }

  // 2. Supabase接続テスト
  try {
    const supabase = createClient(url, anonKey);

    // Auth接続テスト
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
      results.push({
        name: 'Auth接続',
        status: 'error',
        message: '接続失敗',
        details: authError.message,
      });
    } else {
      results.push({
        name: 'Auth接続',
        status: 'ok',
        message: '接続成功',
        details: authData.session ? `ログイン中: ${authData.session.user.email}` : 'セッションなし',
      });
    }

    // Database接続テスト
    const { error: dbError } = await supabase.from('cards').select('id').limit(1);

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        results.push({
          name: 'Database接続',
          status: 'warning',
          message: 'テーブルが存在しません',
          details: 'マイグレーションを実行してください: supabase db push',
        });
      } else if (dbError.code === '42501') {
        results.push({
          name: 'Database接続',
          status: 'ok',
          message: '接続成功 (RLS有効)',
          details: '未認証のためデータアクセス不可（正常動作）',
        });
      } else {
        results.push({
          name: 'Database接続',
          status: 'error',
          message: '接続失敗',
          details: dbError.message,
        });
      }
    } else {
      results.push({
        name: 'Database接続',
        status: 'ok',
        message: '接続成功',
      });
    }
  } catch (error) {
    results.push({
      name: 'Supabase接続',
      status: 'error',
      message: '接続失敗',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  printResults(results);

  // 終了コード
  const hasError = results.some((r) => r.status === 'error');
  if (hasError) {
    process.exit(1);
  }
}

function printResults(results: CheckResult[]): void {
  console.log(`${colors.dim}──────────────────────────────────────${colors.reset}`);
  console.log();

  for (const result of results) {
    const icon = result.status === 'ok' ? '✓' : result.status === 'warning' ? '⚠' : '✗';
    const color =
      result.status === 'ok'
        ? colors.green
        : result.status === 'warning'
          ? colors.yellow
          : colors.red;

    console.log(`${color}${icon}${colors.reset} ${result.name}: ${result.message}`);
    if (result.details) {
      console.log(`  ${colors.dim}${result.details}${colors.reset}`);
    }
  }

  console.log();
}

function detectEnvironment(url: string): string {
  if (!url) return '未設定';
  if (url.includes('127.0.0.1') || url.includes('localhost')) return 'ローカル';
  if (url.includes('.supabase.co')) {
    const projectId = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    return projectId ? `本番 (${projectId})` : '本番';
  }
  return 'カスタム';
}

function maskKey(key: string): string {
  if (key.length <= 20) return '***';
  return key.slice(0, 10) + '...' + key.slice(-10);
}

// メイン実行
const args = process.argv.slice(2);
const mode = args.includes('--local') ? 'local' : 'env';

checkSupabase(mode);

