import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;

/**
 * ヘルスチェック兼 Supabase keep-alive エンドポイント。
 *
 * Supabase 無料枠は7日間クエリがないと自動 pause されるため、
 * 外部 cron から定期的にこのエンドポイントを GET し、
 * Postgres に軽量クエリを1回発行してカウンタをリセットする。
 *
 * 認証不要の公開エンドポイントのため、レスポンスには
 * 到達可否のみを載せ、データ・エラー詳細・環境情報は返さない。
 *
 * GET /api/health
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const supabase = await createClient();

    // head: true で行データを転送せず、Postgres への到達のみを確認する
    const { error } = await supabase
      .from("review_schedules")
      .select("id", { count: "exact", head: true })
      .limit(1);

    if (error) {
      console.error("[health] db unreachable", {
        code: error.code,
        message: error.message,
      });
      return NextResponse.json(
        { status: "error", db: "unreachable", timestamp },
        { status: 503, headers: NO_STORE },
      );
    }

    return NextResponse.json(
      { status: "ok", db: "reachable", timestamp },
      { status: 200, headers: NO_STORE },
    );
  } catch (e) {
    console.error("[health] unexpected failure", e);
    return NextResponse.json(
      { status: "error", db: "unreachable", timestamp },
      { status: 503, headers: NO_STORE },
    );
  }
}
