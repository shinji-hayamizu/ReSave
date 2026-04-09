---
description: Supabaseクライアント、Middleware、マイグレーションファイル作成。認証・DB連携の基盤を構築する。Web（Next.js）・Expo両対応。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: [出力先ディレクトリ (例: apps/web) / 省略で自動検出]
---

# Supabaseセットアップ

Supabase Auth/DBとの連携基盤を構築する。
**Web（Next.js）・Expo どちらにも対応した汎用コマンド。**

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

## Step 0: プロジェクト構成の確認

```bash
# Webアプリ（Next.js）の確認
ls apps/*/next.config.* 2>/dev/null || ls apps/*/next.config.js 2>/dev/null

# Expoアプリの確認
ls apps/*/app.json 2>/dev/null | xargs -I{} grep -l "expo" {} 2>/dev/null

# 既存のSupabaseクライアントを確認
find apps/ -name "supabase.ts" -o -name "supabase.js" 2>/dev/null
```

確認した結果から:
- **`{web_app}`** = Next.jsアプリのディレクトリ名（例: `web`, `admin`）
- **`{mobile_app}`** = Expoアプリのディレクトリ名（例: `mobile`）

---

## Step 1: プロジェクト構造の確認

| 項目 | Web（Next.js） | Expo |
|------|--------------|------|
| Supabaseクライアント | `apps/{web_app}/src/lib/supabase/` | `apps/{mobile_app}/lib/supabase.ts` |
| Middleware | `apps/{web_app}/middleware.ts` | 不要（Expo Routerで制御） |
| マイグレーション | `supabase/migrations/` | 共通（同じDB） |

### 環境変数の確認

各アプリの `.env.local.example` or `.env.example` に以下が含まれているか確認:

**Web（Next.js）:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Expo:**
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL`（WebアプリのAPI URLを呼び出す場合）

---

## Step 2: Web（Next.js）Supabaseクライアント作成

**`apps/{web_app}` が存在する場合に実行**

### 2.1 ブラウザ用クライアント

#### `apps/{web_app}/src/lib/supabase/client.ts`
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

#### `apps/{web_app}/src/lib/supabase/server.ts`
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

## Step 3: Expo Supabaseクライアント作成

**`apps/{mobile_app}` が存在する場合に実行**

### 3.1 Expoクライアント（AsyncStorage使用）

#### `apps/{mobile_app}/lib/supabase.ts`
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

**必要パッケージ（未インストールの場合）:**
```bash
cd apps/{mobile_app}
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
```

### 3.2 Expo用認証フック

#### `apps/{mobile_app}/hooks/useAuth.ts`
```typescript
import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { session, isLoading, user: session?.user ?? null }
}
```

---

## Step 4: Web Middleware作成

**`apps/{web_app}` が存在する場合に実行**

### 4.1 認証Middleware

#### `apps/{web_app}/middleware.ts`

**注意**: 保護パス・認証パスはアーキテクチャドキュメントの画面一覧から決定すること。

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // アーキテクチャドキュメントの画面一覧から決定する
  const protectedPaths = [
    '/',
    // 認証が必要な画面パスを追加
  ]
  const authPaths = ['/login', '/signup', '/reset-password']

  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  )
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  if (isProtectedPath && !user && !isApiRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

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

## Step 5: マイグレーションファイル作成

### 5.1 アーキテクチャドキュメントからテーブル定義を抽出

ドキュメントに定義されているテーブルを元にマイグレーションファイルを作成すること。
以下はパターンテンプレート（テーブル名はプロジェクト固有のものに置き換える）:

#### `supabase/migrations/YYYYMMDDHHMMSS_init.sql`

**注意**: ファイル名のタイムスタンプは実行時の日時に置き換えること。

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- {table_name} table（アーキテクチャドキュメントに従い作成）
-- ===========================================
CREATE TABLE IF NOT EXISTS {table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- フィールドをここに追加
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- Indexes
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_{table_name}_user_id ON {table_name}(user_id);

-- ===========================================
-- Row Level Security
-- ===========================================
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can SELECT own {table_name}" ON {table_name}
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can INSERT own {table_name}" ON {table_name}
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can UPDATE own {table_name}" ON {table_name}
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can DELETE own {table_name}" ON {table_name}
  FOR DELETE USING (auth.uid() = user_id);

-- ===========================================
-- Updated_at trigger
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_{table_name}_updated_at
  BEFORE UPDATE ON {table_name}
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Step 6: 型付きSupabaseクライアント（Web）

### 6.1 Database型定義

```typescript
// apps/{web_app}/src/types/database.ts
// Supabase CLIで生成するか手動で作成:
// supabase gen types typescript --local > apps/{web_app}/src/types/database.ts

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
      // アーキテクチャドキュメントのテーブルに合わせて定義
      {table_name}: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
```

### 6.2 型付きクライアントへの更新

```typescript
// apps/{web_app}/src/lib/supabase/client.ts（更新）
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

## Step 7: 環境変数テンプレート

### Web: `apps/{web_app}/.env.local.example`
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Service Role Key (for admin operations)
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Expo: `apps/{mobile_app}/.env.example`
```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Web API（WebアプリのAPI Routesを呼び出す場合）
EXPO_PUBLIC_API_URL=http://localhost:3000
```

---

## Step 8: 動作確認

| 項目 | 確認方法 | 期待結果 |
|------|---------|---------|
| Webクライアント | TypeScriptエラーなし | 型エラーなし |
| Expoクライアント | TypeScriptエラーなし | 型エラーなし |
| Middleware（Web） | 未認証でアクセス | /login へリダイレクト |
| 環境変数 | .env.local に設定 | 接続成功 |
| マイグレーション | `supabase db push` | テーブル作成成功 |

### Supabase CLIコマンド

```bash
# Supabase CLIインストール（未インストールの場合）
brew install supabase/tap/supabase

# ローカルSupabase起動
supabase start

# マイグレーション適用
supabase db push

# 型定義生成（推奨）
supabase gen types typescript --local > apps/{web_app}/src/types/database.ts
```

---

## 完了条件

**Web（`apps/{web_app}` 存在時）:**
- [ ] ブラウザ用Supabaseクライアントが作成されている
- [ ] サーバー用Supabaseクライアントが作成されている
- [ ] Middlewareが設定されている
- [ ] Database型定義が作成されている
- [ ] `.env.local.example` が作成されている

**Expo（`apps/{mobile_app}` 存在時）:**
- [ ] AsyncStorage使用のSupabaseクライアントが作成されている
- [ ] `useAuth` フックが作成されている
- [ ] `.env.example` が作成されている

**共通:**
- [ ] マイグレーションファイルが作成されている
- [ ] RLSポリシーが定義されている

---

## 完了後のアクション

```
## Supabaseセットアップが完了しました

### 作成されたファイル

Web（Next.js）:
- apps/{web_app}/src/lib/supabase/client.ts
- apps/{web_app}/src/lib/supabase/server.ts
- apps/{web_app}/middleware.ts
- apps/{web_app}/src/types/database.ts
- apps/{web_app}/.env.local.example

Expo:
- apps/{mobile_app}/lib/supabase.ts
- apps/{mobile_app}/hooks/useAuth.ts
- apps/{mobile_app}/.env.example

共通:
- supabase/migrations/YYYYMMDDHHMMSS_init.sql

### 次のステップ
1. Supabase Dashboardでプロジェクト作成
2. 各アプリの環境変数を設定
3. `supabase db push` でマイグレーション適用
4. `/dev:05-create-layout` - 共通レイアウト作成
```

---

## 次のステップ

- `/dev:05-create-layout` - 共通レイアウト作成
- `/dev:06-implement-auth` - 認証機能実装
