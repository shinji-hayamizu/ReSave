---
description: 認証機能（ログイン/登録/リセット）実装。Supabase Authを使用した認証フローを構築する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: [出力先ディレクトリ (例: apps/web)]
---

# 認証機能実装

Supabase Authを使用したログイン・新規登録・パスワードリセット機能を実装する。

## 前提

以下が完了済みであること:
- Supabaseセットアップ（`/dev:04-setup-supabase`）
- 共通レイアウト作成（`/dev:05-create-layout`）

**アーキテクチャファイルの場所（優先順）:**
1. `.kiro/specs/*/design.md` (Kiroスペック)
2. `docs/requirements/architecture.md` (標準)

**機能仕様の場所:**
- `docs/requirements/functions/auth/F-001-user-registration.md`
- `docs/requirements/functions/auth/F-002-user-login.md`
- `docs/requirements/functions/auth/F-003-password-reset.md`

---

## 参照ドキュメント（必須読み込み）

以下のドキュメントを読み込み、認証要件を特定すること:

1. **機能仕様（auth/）** - ユーザーフロー、バリデーション、エラーケース
2. **アーキテクチャドキュメント** - 認証方式、セッション管理

---

## あなたの役割

セキュリティに精通したフルスタックエンジニア。
認証・認可の実装経験が豊富で、UXにも配慮した設計ができる。

## 実行方法

- このタスクは **ultrathink** で実行すること
- **各認証画面・コンポーネント作成はsubAgentで並列実行**すること

---

## Step 1: プロジェクト構造の確認

### 1.1 出力先の特定

引数 `$ARGUMENTS` からプロジェクトルートを特定。

| 項目 | 確認内容 |
|------|---------|
| プロジェクトルート | $ARGUMENTS (例: `apps/web`) |
| 認証ページ | `{root}/src/app/(auth)/` |
| 認証コンポーネント | `{root}/src/components/auth/` |
| Server Actions | `{root}/src/actions/auth.ts` |
| フック | `{root}/src/hooks/useAuth.ts` |

### 1.2 認証要件の確認

機能仕様から以下を確認:
- バリデーションルール（メール形式、パスワード要件）
- エラーメッセージ
- リダイレクト先

---

## Step 2: 認証用Zodスキーマ

### 2.1 バリデーションスキーマ

#### {root}/src/validations/auth.ts
```typescript
import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
})

export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, 'メールアドレスを入力してください')
      .email('有効なメールアドレスを入力してください'),
    password: z
      .string()
      .min(8, 'パスワードは8文字以上で入力してください')
      .regex(
        /^(?=.*[a-zA-Z])(?=.*[0-9])/,
        'パスワードは英字と数字を含める必要があります'
      ),
    confirmPassword: z.string().min(1, 'パスワード（確認）を入力してください'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください'),
})

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'パスワードは8文字以上で入力してください')
      .regex(
        /^(?=.*[a-zA-Z])(?=.*[0-9])/,
        'パスワードは英字と数字を含める必要があります'
      ),
    confirmPassword: z.string().min(1, 'パスワード（確認）を入力してください'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })

export type LoginInput = z.infer<typeof loginSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
```

---

## Step 3: Server Actions

### 3.1 認証アクション

#### {root}/src/actions/auth.ts
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
```

---

## Step 4: 認証フック

### 4.1 useAuth

#### {root}/src/hooks/useAuth.ts
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

## Step 5: 認証レイアウト

### 5.1 (auth) グループレイアウト

#### {root}/src/app/(auth)/layout.tsx
```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="w-full max-w-md px-4">
        {children}
      </div>
    </div>
  )
}
```

---

## Step 6: ログイン画面

### 6.1 ログインページ

#### {root}/src/app/(auth)/login/page.tsx
```typescript
import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'ログイン',
}

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">ログイン</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          アカウントにログインしてください
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
```

### 6.2 ログインフォーム

#### {root}/src/components/auth/login-form.tsx
```typescript
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { createClient } from '@/lib/supabase/client'
import { loginSchema } from '@/validations/auth'

import type { LoginInput } from '@/validations/auth'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginInput) => {
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません')
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード</FormLabel>
              <FormControl>
                <PasswordInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" disabled={loading} type="submit">
          {loading ? 'ログイン中...' : 'ログイン'}
        </Button>
        <div className="space-y-2 text-center text-sm">
          <p>
            <Link className="text-primary hover:underline" href="/reset-password">
              パスワードを忘れた方
            </Link>
          </p>
          <p className="text-muted-foreground">
            アカウントをお持ちでない方は{' '}
            <Link className="text-primary hover:underline" href="/signup">
              新規登録
            </Link>
          </p>
        </div>
      </form>
    </Form>
  )
}
```

---

## Step 7: 新規登録画面

### 7.1 新規登録ページ

#### {root}/src/app/(auth)/signup/page.tsx
```typescript
import { SignupForm } from '@/components/auth/signup-form'

export const metadata = {
  title: '新規登録',
}

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">新規登録</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          アカウントを作成してください
        </p>
      </div>
      <SignupForm />
    </div>
  )
}
```

### 7.2 新規登録フォーム

#### {root}/src/components/auth/signup-form.tsx
```typescript
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { createClient } from '@/lib/supabase/client'
import { signupSchema } from '@/validations/auth'

import type { SignupInput } from '@/validations/auth'

export function SignupForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: SignupInput) => {
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setError('登録に失敗しました。しばらくしてから再度お試しください')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード</FormLabel>
              <FormControl>
                <PasswordInput {...field} />
              </FormControl>
              <FormDescription>8文字以上、英字と数字を含む</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>パスワード（確認）</FormLabel>
              <FormControl>
                <PasswordInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" disabled={loading} type="submit">
          {loading ? '登録中...' : '新規登録'}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          すでにアカウントをお持ちの方は{' '}
          <Link className="text-primary hover:underline" href="/login">
            ログイン
          </Link>
        </p>
      </form>
    </Form>
  )
}
```

---

## Step 8: パスワードリセット画面

### 8.1 パスワードリセットページ

#### {root}/src/app/(auth)/reset-password/page.tsx
```typescript
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata = {
  title: 'パスワードリセット',
}

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">パスワードリセット</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          登録済みのメールアドレスを入力してください
        </p>
      </div>
      <ResetPasswordForm />
    </div>
  )
}
```

### 8.2 パスワードリセットフォーム

#### {root}/src/components/auth/reset-password-form.tsx
```typescript
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { resetPasswordSchema } from '@/validations/auth'

import type { ResetPasswordInput } from '@/validations/auth'

export function ResetPasswordForm() {
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ResetPasswordInput) => {
    setLoading(true)

    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          パスワードリセット用のメールを送信しました。
          メールに記載されたリンクからパスワードを再設定してください。
        </p>
        <Link className="text-sm text-primary hover:underline" href="/login">
          ログインに戻る
        </Link>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="w-full" disabled={loading} type="submit">
          {loading ? '送信中...' : 'リセットリンクを送信'}
        </Button>
        <p className="text-center text-sm">
          <Link className="text-primary hover:underline" href="/login">
            ログインに戻る
          </Link>
        </p>
      </form>
    </Form>
  )
}
```

---

## Step 9: 認証コールバック

### 9.1 Auth Callback Route

#### {root}/src/app/auth/callback/route.ts
```typescript
import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
```

---

## 完了条件

- [ ] 認証用Zodスキーマが作成されている
- [ ] Server Actions（signOut, getUser）が作成されている
- [ ] useAuthフックが作成されている
- [ ] (auth)レイアウトが作成されている
- [ ] ログイン画面が動作する
- [ ] 新規登録画面が動作する
- [ ] パスワードリセット画面が動作する
- [ ] 認証コールバックが設定されている
- [ ] フォームバリデーションが動作する

---

## 完了後のアクション

```
## 認証機能実装が完了しました

### 作成されたファイル
- {root}/src/validations/auth.ts
- {root}/src/actions/auth.ts
- {root}/src/hooks/useAuth.ts
- {root}/src/app/(auth)/layout.tsx
- {root}/src/app/(auth)/login/page.tsx
- {root}/src/app/(auth)/signup/page.tsx
- {root}/src/app/(auth)/reset-password/page.tsx
- {root}/src/components/auth/login-form.tsx
- {root}/src/components/auth/signup-form.tsx
- {root}/src/components/auth/reset-password-form.tsx
- {root}/src/app/auth/callback/route.ts

### 動作確認結果
| 項目 | 状態 |
|------|------|
| 新規登録 | [Success/Failed] |
| ログイン | [Success/Failed] |
| ログアウト | [Success/Failed] |
| パスワードリセット | [Success/Failed] |

### 次のステップ
- 機能開発開始（カード作成、学習セッションなど）
```

---

## 次のステップ
- `/phase-4-features/vertical` - 1機能の垂直実装
