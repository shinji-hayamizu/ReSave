---
description: Supabase基盤構築（Web + Expo）。クライアント設定・Middleware・マイグレーションSQL生成・RLSポリシーをアーキテクチャドキュメントから自動抽出して実装する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: []
---

# Supabase基盤構築（Web + Expo）

アーキテクチャドキュメントのテーブル定義を読み取り、Supabaseクライアント設定・Middleware・マイグレーションSQL・RLSポリシーを実装する。

## 前提条件

以下が完了済みであること:
- モノレポ基盤構築（`/dev:01-setup`）
- `docs/requirements/architecture.md` にテーブル定義が記述されていること

---

## 必須読み込みファイル

1. `docs/requirements/architecture.md` — テーブル定義・インデックス・RLSポリシー設計

---

## Step 1: アーキテクチャドキュメントからテーブル定義を抽出

`docs/requirements/architecture.md` を読み込み、以下を抽出:

| 抽出内容 | 確認項目 |
|---------|---------|
| テーブル名 | スキーマ名・テーブル名 |
| カラム定義 | 型・制約（NOT NULL, DEFAULT等） |
| インデックス | 検索パターンに応じたインデックス |
| RLS設計 | ユーザーごとのアクセス制御方針 |
| 認証フロー | `auth.users` との連携方法 |
| 保護パス | 認証が必要なページ一覧 |

---

## Step 2: Supabaseクライアント設定（Web）

### 2.1 ブラウザ用クライアント

`apps/web/src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 2.2 サーバー用クライアント

`apps/web/src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component からの呼び出しは無視
          }
        },
      },
    }
  )
}
```

### 2.3 Middleware

`apps/web/src/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // アーキテクチャドキュメントの「保護パス」を参照して設定
  const protectedPaths = [
    // architecture.md の protectedPaths セクションから抽出
  ]

  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## Step 3: Supabaseクライアント設定（Expo）

`apps/mobile/lib/supabase.ts` が未作成の場合に作成:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

---

## Step 4: マイグレーションSQL生成

`docs/requirements/architecture.md` のテーブル定義から以下のSQLを生成:

### 4.1 テーブル作成

`supabase/migrations/{timestamp}_initial_schema.sql`:

```sql
-- アーキテクチャドキュメントのテーブル定義に従って生成
-- 例:
CREATE TABLE public.{table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- architecture.md のカラム定義を展開
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_{table_name}_updated_at
  BEFORE UPDATE ON public.{table_name}
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 インデックス

```sql
-- アーキテクチャドキュメントのクエリパターンに基づいて設定
CREATE INDEX idx_{table_name}_user_id ON public.{table_name}(user_id);
-- 必要に応じて追加インデックス
```

### 4.3 RLSポリシー

```sql
-- Row Level Security の有効化
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;

-- ユーザー自身のデータのみ操作可能
CREATE POLICY "{table_name}_select_own" ON public.{table_name}
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "{table_name}_insert_own" ON public.{table_name}
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "{table_name}_update_own" ON public.{table_name}
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "{table_name}_delete_own" ON public.{table_name}
  FOR DELETE USING (auth.uid() = user_id);
```

---

## Step 5: データベース適用

```bash
# Supabase CLI でマイグレーション適用
supabase db push

# または直接実行
supabase migration up
```

---

## Step 6: 動作確認

```bash
# Supabase接続確認
cd apps/web && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit
```

### 確認項目

| 項目 | 確認方法 |
|------|---------|
| テーブル作成 | Supabase Dashboard > Table Editor |
| RLS有効 | Dashboard > Authentication > Policies |
| インデックス | Dashboard > Database > Indexes |
| 接続確認 | Web/Expo アプリからクエリ実行 |

---

## 完了条件

- [ ] `apps/web/src/lib/supabase/client.ts` が作成されている
- [ ] `apps/web/src/lib/supabase/server.ts` が作成されている
- [ ] `apps/web/src/middleware.ts` に認証ガードが設定されている
- [ ] `apps/mobile/lib/supabase.ts` が作成されている（AsyncStorage対応）
- [ ] `supabase/migrations/` にマイグレーションSQLが作成されている
- [ ] RLSポリシーが設定されている
- [ ] `supabase db push` が成功する
- [ ] TypeScript 型エラーがない（`npx tsc --noEmit`）

---

## 次のステップ

- `/dev:04-create-layout` — ナビゲーション・レイアウト構築
