---
description: 認証機能実装（Web + Expo 同時）。ログイン・サインアップ・パスワードリセット画面を HTMLモック参照で実装し、Supabase Auth と接続する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: []
---

# 認証機能実装（Web + Expo）

Supabase Auth を使ったログイン・サインアップ・パスワードリセット機能を Web と Expo で同時実装する。

## 前提条件

以下が完了済みであること:
- Supabase基盤（`/dev:03-setup-backend`）
- レイアウト構築（`/dev:04-create-layout`）
- `packages/shared` に auth 系の Zod スキーマが存在すること（`/dev:06-add-types` で追加）

---

## 必須読み込みファイル

1. `docs/screens/mock/{version}/login.html` — ログイン画面デザイン
2. `docs/screens/mock/{version}/signup.html` — サインアップ画面デザイン（存在する場合）
3. `packages/shared/src/validations/auth.ts` — Zodバリデーションスキーマ

---

## Phase 1: 実装計画の確認

HTMLモックを読み込み、以下を確認:

| 項目 | 確認内容 |
|------|---------|
| ログインフォーム | email / password フィールド |
| エラー表示 | バリデーションエラーの表示位置 |
| リダイレクト | ログイン後の遷移先 |
| ソーシャルログイン | Google / GitHub 等（ある場合） |

---

## Phase 2: 実装（サブエージェント並列）

### Web 実装

#### 2-W1: Server Actions（認証）

`apps/web/src/actions/auth.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, signUpSchema } from '@resave/shared'
import type { LoginInput, SignUpInput } from '@resave/shared'

export async function loginAction(input: LoginInput) {
  const validated = loginSchema.parse(input)
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: validated.email,
    password: validated.password,
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signUpAction(input: SignUpInput) {
  const validated = signUpSchema.parse(input)
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email: validated.email,
    password: validated.password,
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  redirect('/login?message=確認メールを送信しました')
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resetPasswordAction(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  })

  if (error) {
    return { ok: false, message: error.message }
  }

  return { ok: true, message: 'パスワードリセットメールを送信しました' }
}
```

#### 2-W2: ログイン画面

`apps/web/src/app/(auth)/login/page.tsx`:

```tsx
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        {/* HTMLモックのデザインに従ってレイアウト */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">ログイン</h1>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
```

`apps/web/src/components/auth/LoginForm.tsx`:

```tsx
'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@resave/shared'
import type { LoginInput } from '@resave/shared'
import { loginAction } from '@/actions/auth'
import { Button } from '@/components/ui/Button'

export function LoginForm() {
  const [isPending, startTransition] = useTransition()
  const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  function onSubmit(data: LoginInput) {
    startTransition(async () => {
      const result = await loginAction(data)
      if (result && !result.ok) {
        setError('root', { message: result.message })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="text-sm font-medium">メールアドレス</label>
        <input
          type="email"
          {...register('email')}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">パスワード</label>
        <input
          type="password"
          {...register('password')}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {errors.root && (
        <p className="text-sm text-destructive">{errors.root.message}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'ログイン中...' : 'ログイン'}
      </Button>
    </form>
  )
}
```

#### 2-W3: Auth レイアウト

`apps/web/src/app/(auth)/layout.tsx`:

```tsx
import type { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-muted/10">
      {children}
    </div>
  )
}
```

---

### Expo 実装

#### 2-E1: Auth フック

`apps/mobile/hooks/useAuthActions.ts`:

```typescript
import { useState } from 'react'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { loginSchema, signUpSchema } from '@resave/shared'
import type { LoginInput, SignUpInput } from '@resave/shared'

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function login(input: LoginInput) {
    const validated = loginSchema.parse(input)
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    router.replace('/(tabs)')
  }

  return { login, loading, error }
}

export function useLogout() {
  async function logout() {
    await supabase.auth.signOut()
    router.replace('/(auth)/login')
  }

  return { logout }
}

export function useSignUp() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signUp(input: SignUpInput) {
    const validated = signUpSchema.parse(input)
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    router.replace('/(auth)/login')
  }

  return { signUp, loading, error }
}
```

#### 2-E2: ログイン画面（Expo）

`apps/mobile/app/(auth)/login.tsx`:

```tsx
import { View, Text, TextInput, Alert } from 'react-native'
import { Link } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@resave/shared'
import type { LoginInput } from '@resave/shared'
import { useLogin } from '@/hooks/useAuthActions'
import { Button } from '@/components/ui/Button'

export default function LoginScreen() {
  const { login, loading, error } = useLogin()
  const { control, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <View className="flex-1 justify-center px-6">
      <Text className="text-2xl font-bold text-center mb-8">ログイン</Text>

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <View className="mb-4">
            <Text className="text-sm font-medium mb-1">メールアドレス</Text>
            <TextInput
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              className="border rounded-lg px-3 py-2"
            />
            {errors.email && (
              <Text className="text-destructive text-sm mt-1">{errors.email.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <View className="mb-6">
            <Text className="text-sm font-medium mb-1">パスワード</Text>
            <TextInput
              value={value}
              onChangeText={onChange}
              secureTextEntry
              className="border rounded-lg px-3 py-2"
            />
            {errors.password && (
              <Text className="text-destructive text-sm mt-1">{errors.password.message}</Text>
            )}
          </View>
        )}
      />

      {error && (
        <Text className="text-destructive text-sm mb-4 text-center">{error}</Text>
      )}

      <Button onPress={handleSubmit(login)} disabled={loading}>
        {loading ? 'ログイン中...' : 'ログイン'}
      </Button>
    </View>
  )
}
```

#### 2-E3: Auth レイアウト（Expo）

`apps/mobile/app/(auth)/_layout.tsx`:

```tsx
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  )
}
```

---

## Phase 3: 型チェック・動作確認

```bash
cd apps/web && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit
```

### 動作確認項目

| 項目 | Web | Expo |
|------|-----|------|
| ログインフォーム表示 | ✓/✗ | ✓/✗ |
| バリデーションエラー | ✓/✗ | ✓/✗ |
| ログイン成功→リダイレクト | ✓/✗ | ✓/✗ |
| 認証エラー表示 | ✓/✗ | ✓/✗ |
| ログアウト | ✓/✗ | ✓/✗ |

---

## 完了条件

- [ ] Web: `apps/web/src/actions/auth.ts` にServer Actions実装済み
- [ ] Web: ログイン画面（`(auth)/login/page.tsx`）が動作する
- [ ] Web: LoginForm コンポーネントに react-hook-form + zod が設定済み
- [ ] Web: 未認証時に `/login` へリダイレクトする
- [ ] Expo: `apps/mobile/hooks/useAuthActions.ts` に認証フック実装済み
- [ ] Expo: ログイン画面（`(auth)/login.tsx`）が動作する
- [ ] Expo: `supabase.auth.onAuthStateChange` でセッション監視中
- [ ] `packages/shared` の loginSchema / signUpSchema を両プラットフォームで使用
- [ ] TypeScript 型エラーがない（`npx tsc --noEmit`）

---

## 次のステップ

- `/dev:06-add-types {機能名}` + `/dev:07-implement-feature {機能名}` — 機能実装
