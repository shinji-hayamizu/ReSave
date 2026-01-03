---
description: Supabaseクライアント、Middleware、マイグレーションファイル作成。認証・DB連携の基盤を構築する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: [出力先ディレクトリ (例: apps/web)]
---

# Supabaseセットアップ

Supabase Auth/DBとの連携基盤を構築する。

## 前提

以下が完了済みであること:
- 型定義とZodスキーマ作成（`/dev:03-create-types-and-schemas`）

**アーキテクチャファイルの場所（優先順）:**
1. `.kiro/specs/*/design.md` (Kiroスペック)
2. `docs/requirements/architecture.md` (標準)

---

## 参照ドキュメント（必須読み込み）

以下のドキュメントを読み込み、認証・DB設計を特定すること:

1. **アーキテクチャドキュメント** - 認証方式、DB設計、テーブル定義
2. **Supabase公式ドキュメント** - 必要に応じてWebSearchで最新情報を取得

---

## あなたの役割

セキュリティに精通したバックエンドエンジニア。
Supabase Auth/DBの設定、RLS（Row Level Security）の設計経験が豊富。

## 実行方法

- このタスクは **ultrathink** で実行すること
- **各ファイル作成はsubAgentで並列実行**すること

---

## Step 1: プロジェクト構造の確認

### 1.1 出力先の特定

引数 `$ARGUMENTS` からプロジェクトルートを特定。

| 項目 | 確認内容 |
|------|---------|
| プロジェクトルート | $ARGUMENTS (例: `apps/web`) |
| Supabaseクライアント | `{root}/src/lib/supabase/` |
| Middleware | `{root}/middleware.ts` |
| マイグレーション | `supabase/migrations/` |

### 1.2 環境変数の確認

`.env.local.example` に以下が含まれているか確認:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 2: Supabaseクライアント作成

### 2.1 ブラウザ用クライアント

#### {root}/src/lib/supabase/client.ts
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

#### {root}/src/lib/supabase/server.ts
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
            // Server Component からの呼び出し時は無視
          }
        },
      },
    }
  )
}
```

---

## Step 3: Middleware作成

### 3.1 認証Middleware

#### {root}/middleware.ts
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 認証が必要なパスの定義（プロジェクトに応じて調整）
  const protectedPaths = ['/', '/cards', '/study', '/stats', '/settings', '/tags']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  )

  // 認証ページのパス
  const authPaths = ['/login', '/signup', '/reset-password']
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // API Routesは別途認証（Mobile用）
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  // 未認証ユーザーをログインページへリダイレクト
  if (isProtectedPath && !user && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // 認証済みユーザーを認証ページからリダイレクト
  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
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

## Step 4: マイグレーションファイル作成

### 4.1 アーキテクチャドキュメントからテーブル定義を抽出

ドキュメントに定義されているテーブル（cards, tags, card_tags, study_logs）を元に、マイグレーションファイルを作成。

### 4.2 マイグレーションファイル

#### supabase/migrations/YYYYMMDDHHMMSS_init.sql

**注意**: ファイル名のタイムスタンプは実行時の日時に置き換えること。

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- Cards table
-- 暗記カードのメインテーブル
-- ===========================================
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  review_level INT NOT NULL DEFAULT 0 CHECK (review_level >= 0 AND review_level <= 6),
  next_review_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- Tags table
-- カードに付与するタグ
-- ===========================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- ===========================================
-- Card-Tag junction table
-- カードとタグの多対多関係
-- ===========================================
CREATE TABLE IF NOT EXISTS card_tags (
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (card_id, tag_id)
);

-- ===========================================
-- Study logs table
-- 学習履歴の記録
-- ===========================================
CREATE TABLE IF NOT EXISTS study_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  assessment VARCHAR(20) NOT NULL CHECK (assessment IN ('ok', 'remembered', 'again')),
  studied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- Indexes
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_next_review_at ON cards(next_review_at);
CREATE INDEX IF NOT EXISTS idx_cards_user_next_review ON cards(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_card_tags_card_id ON card_tags(card_id);
CREATE INDEX IF NOT EXISTS idx_card_tags_tag_id ON card_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_study_logs_user_id_studied_at ON study_logs(user_id, studied_at);
CREATE INDEX IF NOT EXISTS idx_study_logs_card_id ON study_logs(card_id);

-- ===========================================
-- Row Level Security
-- ===========================================
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_logs ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- RLS Policies
-- ===========================================

-- Cards: ユーザーは自分のカードのみアクセス可能
CREATE POLICY "Users can SELECT own cards" ON cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can INSERT own cards" ON cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can UPDATE own cards" ON cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can DELETE own cards" ON cards
  FOR DELETE USING (auth.uid() = user_id);

-- Tags: ユーザーは自分のタグのみアクセス可能
CREATE POLICY "Users can SELECT own tags" ON tags
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can INSERT own tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can UPDATE own tags" ON tags
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can DELETE own tags" ON tags
  FOR DELETE USING (auth.uid() = user_id);

-- Card Tags: カード所有者のみ操作可能
CREATE POLICY "Users can SELECT own card_tags" ON card_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cards WHERE cards.id = card_id AND cards.user_id = auth.uid())
  );

CREATE POLICY "Users can INSERT own card_tags" ON card_tags
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM cards WHERE cards.id = card_id AND cards.user_id = auth.uid())
  );

CREATE POLICY "Users can DELETE own card_tags" ON card_tags
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM cards WHERE cards.id = card_id AND cards.user_id = auth.uid())
  );

-- Study Logs: ユーザーは自分のログのみアクセス可能
CREATE POLICY "Users can SELECT own study_logs" ON study_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can INSERT own study_logs" ON study_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- Updated_at trigger function
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to cards
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Step 5: 型定義の生成（Database Types）

### 5.1 Supabase型定義

#### {root}/src/types/database.ts

Supabase CLIで生成するか、手動で以下を作成:

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      cards: {
        Row: {
          id: string
          user_id: string
          front: string
          back: string
          review_level: number
          next_review_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          front: string
          back: string
          review_level?: number
          next_review_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          front?: string
          back?: string
          review_level?: number
          next_review_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          created_at?: string
        }
      }
      card_tags: {
        Row: {
          card_id: string
          tag_id: string
        }
        Insert: {
          card_id: string
          tag_id: string
        }
        Update: {
          card_id?: string
          tag_id?: string
        }
      }
      study_logs: {
        Row: {
          id: string
          user_id: string
          card_id: string
          assessment: 'ok' | 'remembered' | 'again'
          studied_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          assessment: 'ok' | 'remembered' | 'again'
          studied_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          assessment?: 'ok' | 'remembered' | 'again'
          studied_at?: string
        }
      }
    }
  }
}
```

### 5.2 型付きSupabaseクライアント

クライアントファイルを更新して型を適用:

```typescript
// {root}/src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

## Step 6: 環境変数テンプレート

### 6.1 .env.local.example

#### {root}/.env.local.example
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Service Role Key (for admin operations)
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Step 7: 動作確認

### 7.1 確認項目

| 項目 | 確認方法 | 期待結果 |
|------|---------|---------|
| クライアント作成 | TypeScriptエラーなし | 型エラーなし |
| Middleware | 未認証でアクセス | /login へリダイレクト |
| 環境変数 | .env.local に設定 | 接続成功 |
| マイグレーション | `supabase db push` | テーブル作成成功 |

### 7.2 Supabase CLIコマンド

```bash
# Supabase CLIインストール（未インストールの場合）
brew install supabase/tap/supabase

# ローカルSupabase起動
supabase start

# マイグレーション適用
supabase db push

# 型定義生成（オプション）
supabase gen types typescript --local > apps/web/src/types/database.ts
```

---

## 完了条件

- [ ] Supabaseブラウザクライアントが作成されている
- [ ] Supabaseサーバークライアントが作成されている
- [ ] Middlewareが設定されている
- [ ] マイグレーションファイルが作成されている
- [ ] RLSポリシーが定義されている
- [ ] Database型定義が作成されている
- [ ] 環境変数テンプレートが作成されている

---

## 完了後のアクション

```
## Supabaseセットアップが完了しました

### 作成されたファイル
- {root}/src/lib/supabase/client.ts
- {root}/src/lib/supabase/server.ts
- {root}/middleware.ts
- {root}/src/types/database.ts
- {root}/.env.local.example
- supabase/migrations/YYYYMMDDHHMMSS_init.sql

### 次のステップ
1. Supabase Dashboardでプロジェクト作成
2. 環境変数を.env.localに設定
3. `supabase db push` でマイグレーション適用
4. `/dev:05-create-layout` - 共通レイアウト作成
```

---

## 次のステップ

- `/dev:05-create-layout` - 共通レイアウト作成
- `/dev:06-implement-auth` - 認証機能実装

---

## 復習スケジューリングロジック（参考）

マイグレーション後、Server Actionsで使用する間隔計算:

```typescript
// 固定間隔（日数）
const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 180] as const

function calculateNextReviewAt(reviewLevel: number): Date | null {
  // レベル6以上は完了（next_review_at = null）
  if (reviewLevel >= REVIEW_INTERVALS.length) {
    return null
  }

  const daysToAdd = REVIEW_INTERVALS[reviewLevel]
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + daysToAdd)
  return nextDate
}

// 評価に応じた処理
function processAssessment(
  currentLevel: number,
  assessment: 'ok' | 'remembered' | 'again'
): { newLevel: number; nextReviewAt: Date | null } {
  switch (assessment) {
    case 'ok':
      const newLevel = currentLevel + 1
      return {
        newLevel,
        nextReviewAt: calculateNextReviewAt(newLevel)
      }
    case 'remembered':
      return {
        newLevel: currentLevel,
        nextReviewAt: null  // 完了
      }
    case 'again':
      return {
        newLevel: 0,
        nextReviewAt: calculateNextReviewAt(0)
      }
  }
}
```
