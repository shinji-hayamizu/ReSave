---
description: 認証機能（Supabase Auth）の実装
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
---

# Phase 3-A: 認証機能の実装

## 前提
以下が完了済みであること:
- プロジェクト初期構築（`/phase-2-setup/init-project`）
- 開発ツール設定（`/phase-2-setup/dev-tools`）

---

## 参照ドキュメント（必須読み込み）
- `docs/requirements/architecture.md`（認証設計セクション）
- `docs/requirements/functions/auth/` 配下のファイル

## あなたの役割
セキュリティに精通したバックエンドエンジニア。
認証・認可の実装経験が豊富。

## 実行方法
このタスクは **ultrathink** で実行すること。

---

## Step 1: 認証方式の確認

architecture.md から認証設計を確認:

| 項目 | 確認内容 |
|------|---------|
| 認証プロバイダ | Supabase Auth / NextAuth / Clerk / その他 |
| 認証方式 | Email/Password, OAuth, Magic Link |
| セッション管理 | Cookie-based / JWT |
| 対象プラットフォーム | Web のみ / Web + Mobile |

---

## Step 2: Supabase Auth セットアップ（Supabase使用時）

### 2.1 Supabaseプロジェクト作成

```
Supabase Dashboardで以下を実行:
1. 新規プロジェクト作成
2. Project URL と anon key を取得
3. Authentication > Providers でEmail有効化
```

### 2.2 環境変数設定

#### .env.local
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 2.3 パッケージインストール

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

### 2.4 Supabaseクライアント作成

#### src/lib/supabase/client.ts（ブラウザ用）
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

#### src/lib/supabase/server.ts（サーバー用）
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

### 2.5 Middleware設定

#### middleware.ts
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

  // 認証が必要なパスの定義
  const protectedPaths = ['/dashboard', '/cards', '/study', '/settings']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  // 未認証ユーザーをログインページへリダイレクト
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // 認証済みユーザーを認証ページからリダイレクト
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
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

## Step 3: 認証画面の実装

### 3.1 ログイン画面

#### src/app/(auth)/login/page.tsx
```typescript
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">ログイン</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            アカウントにログインしてください
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
```

#### src/components/auth/login-form.tsx
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          required
          id="email"
          placeholder="email@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">パスワード</Label>
        <Input
          required
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button className="w-full" disabled={loading} type="submit">
        {loading ? 'ログイン中...' : 'ログイン'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        アカウントをお持ちでない方は{' '}
        <a className="text-primary hover:underline" href="/signup">
          新規登録
        </a>
      </p>
    </form>
  )
}
```

### 3.2 新規登録画面

#### src/app/(auth)/signup/page.tsx
```typescript
import { SignupForm } from '@/components/auth/signup-form'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">新規登録</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            アカウントを作成してください
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
```

#### src/components/auth/signup-form.tsx
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export function SignupForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }

    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError('登録に失敗しました。しばらくしてから再度お試しください')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          required
          id="email"
          placeholder="email@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">パスワード</Label>
        <Input
          required
          id="password"
          minLength={8}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">パスワード（確認）</Label>
        <Input
          required
          id="confirmPassword"
          minLength={8}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <Button className="w-full" disabled={loading} type="submit">
        {loading ? '登録中...' : '新規登録'}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        すでにアカウントをお持ちの方は{' '}
        <a className="text-primary hover:underline" href="/login">
          ログイン
        </a>
      </p>
    </form>
  )
}
```

### 3.3 パスワードリセット画面

#### src/app/(auth)/reset-password/page.tsx
```typescript
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">パスワードリセット</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            登録済みのメールアドレスを入力してください
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
```

---

## Step 4: Server Actions

#### src/actions/auth.ts
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

---

## Step 5: 認証フック

#### src/hooks/useAuth.ts
```typescript
'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // 初期ユーザー取得
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

---

## Step 6: 動作確認

### 6.1 開発サーバー起動
```bash
pnpm dev
```

### 6.2 確認項目

| 項目 | 確認方法 | 期待結果 |
|------|---------|---------|
| 新規登録 | /signup でフォーム送信 | ダッシュボードにリダイレクト |
| ログイン | /login でフォーム送信 | ダッシュボードにリダイレクト |
| 未認証アクセス | /dashboard に直接アクセス | /login にリダイレクト |
| 認証済みアクセス | ログイン後 /login にアクセス | /dashboard にリダイレクト |
| ログアウト | ログアウトボタンクリック | /login にリダイレクト |

---

## 完了条件

- [ ] Supabase クライアントが設定されている
- [ ] Middleware で認証チェックが動作する
- [ ] ログイン画面が動作する
- [ ] 新規登録画面が動作する
- [ ] パスワードリセット画面が動作する
- [ ] Server Actions でログアウトが動作する
- [ ] 認証フックが動作する

---

## 完了後のアクション

```
## 認証機能の実装が完了しました

### 実装されたファイル
- src/lib/supabase/client.ts
- src/lib/supabase/server.ts
- middleware.ts
- src/app/(auth)/login/page.tsx
- src/app/(auth)/signup/page.tsx
- src/app/(auth)/reset-password/page.tsx
- src/components/auth/*.tsx
- src/actions/auth.ts
- src/hooks/useAuth.ts

### 動作確認結果
| 項目 | 状態 |
|------|------|
| 新規登録 | [Success/Failed] |
| ログイン | [Success/Failed] |
| ログアウト | [Success/Failed] |
| 認証リダイレクト | [Success/Failed] |

内容を確認し、問題なければ「OK」と入力してください。
```

---

## 次のステップ
`/phase-3-foundation/layout` - 共通レイアウトの実装
