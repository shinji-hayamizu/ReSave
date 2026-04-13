---
description: ナビゲーション・レイアウト基盤構築（Web + Expo 同時）。機能仕様ドキュメントからナビ項目を自動抽出してサイドバー/BottomNav/Tabs を実装する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: []
---

# ナビゲーション・レイアウト構築（Web + Expo）

機能仕様ドキュメントからナビ項目を抽出し、Web（Sidebar + BottomNav）と Expo（Expo Router Tabs + Stack）のレイアウト基盤を構築する。

## 前提条件

以下が完了済みであること:
- モノレポ基盤構築（`/dev:01-setup`）
- 共通UIコンポーネント（`/dev:02-create-components`）
- Supabase基盤（`/dev:03-setup-backend`）

---

## 必須読み込みファイル

1. `docs/requirements/functions/_index.md` — 画面一覧・ナビ項目（ここからタブ構造を抽出）
2. `docs/screens/mock/{version}/*.html` — レイアウトデザイン

---

## Step 1: ナビ項目の抽出

`docs/requirements/functions/_index.md` を読み込み、以下を特定:

| 抽出内容 | 確認項目 |
|---------|---------|
| タブ項目 | アイコン・ラベル・パス |
| 認証が必要なページ | ログインが必要なルート |
| 画面階層 | タブ内のサブ画面 |

---

## Step 2: Web レイアウト（apps/web）

### 2.1 Root Layout + Providers

`apps/web/src/app/layout.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Providers } from '@/components/layout/Providers'

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

`apps/web/src/components/layout/Providers.tsx`:

```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 1000 * 60 * 5, retry: 2 },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

### 2.2 認証済みレイアウト（Main Layout）

`apps/web/src/app/(main)/layout.tsx`:

```tsx
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

interface MainLayoutProps {
  children: ReactNode
}

export default async function MainLayout({ children }: MainLayoutProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* デスクトップ: サイドバー */}
      <Sidebar className="hidden md:flex" />

      {/* メインコンテンツ */}
      <main className="flex-1 pb-16 md:pb-0">
        {children}
      </main>

      {/* モバイル: ボトムナビ */}
      <BottomNav className="md:hidden" />
    </div>
  )
}
```

### 2.3 Sidebar（_index.md から抽出したナビ項目）

`apps/web/src/components/layout/Sidebar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import type { HTMLAttributes } from 'react'

// docs/requirements/functions/_index.md から抽出したナビ項目に差し替え
const NAV_ITEMS = [
  { href: '/', label: 'ホーム', icon: HomeIcon },
  // ...
]

interface SidebarProps extends HTMLAttributes<HTMLElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn('flex w-64 flex-col border-r bg-background', className)}
      {...props}
    >
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname === href
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
```

### 2.4 BottomNav（モバイル用）

`apps/web/src/components/layout/BottomNav.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import type { HTMLAttributes } from 'react'

// NAV_ITEMS は Sidebar と共有
const NAV_ITEMS = [/* ... */]

interface BottomNavProps extends HTMLAttributes<HTMLElement> {}

export function BottomNav({ className, ...props }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 border-t bg-background',
        className
      )}
      {...props}
    >
      <div className="flex h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors',
              pathname === href
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
```

---

## Step 3: Expo レイアウト（apps/mobile）

### 3.1 Root Layout

`apps/mobile/app/_layout.tsx`:

```tsx
import '../global.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { useState } from 'react'

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 1000 * 60 * 5, retry: 2 },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </QueryClientProvider>
  )
}
```

### 3.2 Tabs Layout（認証済みエリア）

`apps/mobile/app/(tabs)/_layout.tsx`:

```tsx
import { Redirect } from 'expo-router'
import { Tabs } from 'expo-router'
import { useAuth } from '@/hooks/useAuth'

// docs/requirements/functions/_index.md から抽出したタブ項目に差し替え
export default function TabsLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return null // またはSplashScreen
  }

  if (!user) {
    return <Redirect href="/login" />
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1', // デザイントークンの primary 色
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
      }}
    >
      {/* _index.md から抽出したタブ項目 */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      {/* ... */}
    </Tabs>
  )
}
```

### 3.3 Auth状態管理フック

`apps/mobile/hooks/useAuth.ts`:

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

---

## Step 4: 型チェック

```bash
cd apps/web && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit
```

---

## 完了条件

- [ ] Web: `apps/web/src/app/layout.tsx` にProviders設定済み
- [ ] Web: `apps/web/src/app/(main)/layout.tsx` に認証ガード設定済み
- [ ] Web: Sidebar（デスクトップ）が動作する
- [ ] Web: BottomNav（モバイル）が動作する
- [ ] Expo: `apps/mobile/app/_layout.tsx` にQueryClientProvider設定済み
- [ ] Expo: `apps/mobile/app/(tabs)/_layout.tsx` にタブナビゲーション設定済み
- [ ] Expo: 未認証時に `/login` へリダイレクトする
- [ ] ナビ項目は `docs/requirements/functions/_index.md` から抽出した内容（ハードコードしない）
- [ ] TypeScript 型エラーがない（`npx tsc --noEmit`）

---

## 次のステップ

- `/dev:05-implement-auth` — 認証機能（ログイン・サインアップ）実装
