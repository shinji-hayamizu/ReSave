---
description: 共通レイアウト（Sidebar, TabBar, Providers）作成。Web/Expoのナビゲーション基盤を構築する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: [出力先ディレクトリ (例: web) / 省略で自動検出]
---

# 共通レイアウト作成

Sidebar、TabBar、Providersなど共通レイアウトコンポーネントを作成する。
**Web（Next.js）・Expo どちらにも対応した汎用コマンド。**

## 前提

以下が完了済みであること:
- Webセットアップ（`/dev:01-setup-web`）またはExpoセットアップ（`/dev:01-setup-mobile`）
- shadcn/ui初期設定（Webの場合）

**アーキテクチャファイルの場所（優先順）:**
1. `.kiro/specs/*/design.md` (Kiroスペック)
2. `docs/requirements/architecture.md` (標準)
3. `docs/requirements/functions/_index.md` (画面一覧)

---

## 参照ドキュメント（必須読み込み）

以下のドキュメントを読み込み、画面構成を特定すること:

1. **アーキテクチャドキュメント** - ディレクトリ構成、画面一覧
2. **機能仕様** - ナビゲーション項目
3. **HTMLモック（存在する場合）** - デザインパターン

---

## あなたの役割

UI/UXに精通したフロントエンドエンジニア。
レスポンシブデザインとアクセシビリティを重視。

## 実行方法

- このタスクは **ultrathink** で実行すること
- **各コンポーネント作成はsubAgentで並列実行**すること

---

## Step 0: プロジェクト構成の確認

```bash
# Webアプリ（Next.js）の確認
ls apps/*/next.config.* 2>/dev/null

# Expoアプリの確認
ls apps/*/app.json 2>/dev/null | xargs -I{} grep -l "expo" {} 2>/dev/null
```

確認した結果から:
- **`{web_app}`** = Next.jsアプリのディレクトリ名（例: `web`, `admin`）
- **`{mobile_app}`** = Expoアプリのディレクトリ名（例: `mobile`）
- **`{app_name}`** = アーキテクチャドキュメントまたはpackage.jsonのname（例: `MyApp`）
- **`nav_items`** = 画面一覧からナビゲーション項目を決定（アーキテクチャドキュメントから抽出）

---

## Step 1: ナビゲーション項目の特定

アーキテクチャドキュメントから画面一覧を抽出し、ナビゲーション項目を決定する。
以下は参考例（プロジェクトの画面一覧に合わせること）:

| 項目 | パス | アイコン |
|------|-----|---------|
| ホーム | / | Home |
| {機能1} | /{feature1} | {Icon1} |
| {機能2} | /{feature2} | {Icon2} |
| 設定 | /settings | Settings |

---

## Step 2: Web Providers作成

**`apps/{web_app}` が存在する場合に実行**

### 2.1 QueryClient + ThemeProvider

#### `apps/{web_app}/src/components/providers.tsx`
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        disableTransitionOnChange
        enableSystem
        attribute="class"
        defaultTheme="system"
      >
        {children}
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

---

## Step 3: Web ルートレイアウト

### 3.1 RootLayout更新

#### `apps/{web_app}/src/app/layout.tsx`
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: '{app_name}',
    template: '%s | {app_name}',
  },
  description: '{アーキテクチャドキュメントからアプリ説明を取得}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
```

---

## Step 4: Web メインレイアウト（認証済みユーザー用）

### 4.1 (main) グループレイアウト

#### `apps/{web_app}/src/app/(main)/layout.tsx`
```typescript
import { redirect } from 'next/navigation'

import { AppSidebar } from '@/components/layout/app-sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
      </SidebarInset>
      <MobileNav />
    </SidebarProvider>
  )
}
```

---

## Step 5: Web サイドバー（デスクトップ用）

### 5.1 AppSidebar

#### `apps/{web_app}/src/components/layout/app-sidebar.tsx`
```typescript
'use client'

import { Home, Settings, /* アーキテクチャから決定したアイコン */ } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { signOut } from '@/actions/auth'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar'

// アーキテクチャドキュメントの画面一覧から決定する
const navItems = [
  { title: 'ホーム', href: '/', icon: Home },
  // { title: '{機能名}', href: '/{path}', icon: {Icon} },
  { title: '設定', href: '/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="hidden md:flex">
      <SidebarHeader className="border-b p-4">
        <Link className="flex items-center gap-2 font-bold" href="/">
          <span className="text-xl">{app_name}</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()}>
              <span>ログアウト</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
```

---

## Step 6: Web モバイルナビゲーション

### 6.1 MobileNav

#### `apps/{web_app}/src/components/layout/mobile-nav.tsx`
```typescript
'use client'

import { Home, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

// アーキテクチャドキュメントの画面一覧から決定する
const navItems = [
  { title: 'ホーム', href: '/', icon: Home },
  // { title: '{機能名}', href: '/{path}', icon: {Icon} },
  { title: '設定', href: '/settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              className={cn(
                'flex flex-col items-center gap-1 p-2 text-xs',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              href={item.href}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

---

## Step 7: Web ページヘッダー・エラー系

### 7.1 PageHeader

#### `apps/{web_app}/src/components/layout/page-header.tsx`
```typescript
interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-4 md:px-6">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
```

### 7.2 Loading / Error / NotFound

```typescript
// apps/{web_app}/src/app/(main)/loading.tsx
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}

// apps/{web_app}/src/app/(main)/error.tsx
'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">エラーが発生しました</h2>
      <Button onClick={() => reset()}>再試行</Button>
    </div>
  )
}

// apps/{web_app}/src/app/not-found.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-4xl font-bold">404</h2>
      <p className="text-muted-foreground">ページが見つかりません</p>
      <Button asChild><Link href="/">ホームに戻る</Link></Button>
    </div>
  )
}
```

---

## Step 8: Expo レイアウト作成

**`apps/{mobile_app}` が存在する場合に実行**

### 8.1 ルートレイアウト（QueryClient + SafeArea）

#### `apps/{mobile_app}/app/_layout.tsx`
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
    },
  },
})

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
```

### 8.2 タブナビゲーション

#### `apps/{mobile_app}/app/(tabs)/_layout.tsx`
```typescript
import { Tabs } from 'expo-router'
import { View, Text } from 'react-native'

// アーキテクチャドキュメントの画面一覧から決定する
// アイコンは絵文字テキストで代替（NativeWind className がSVG非対応のため）
const TAB_ITEMS = [
  { name: 'index', title: 'ホーム',   icon: '🏠' },
  // { name: '{screen}', title: '{タブ名}', icon: '{絵文字}' },
  { name: 'settings', title: '設定',   icon: '⚙️' },
] as const

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          height: 64,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      {TAB_ITEMS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: 20, color }}>{tab.icon}</Text>
            ),
          }}
        />
      ))}
    </Tabs>
  )
}
```

### 8.3 スタック画面のヘッダー設定

#### `apps/{mobile_app}/app/(tabs)/{screen}/_layout.tsx`
```typescript
import { Stack } from 'expo-router'

export default function ScreenLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: '{画面タイトル}',
          headerStyle: { backgroundColor: '#ffffff' },
          headerTintColor: '#111827',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
    </Stack>
  )
}
```

### 8.4 Expo ホーム画面テンプレート

#### `apps/{mobile_app}/app/(tabs)/index.tsx`
```typescript
import { View, Text, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="px-4 pt-6 pb-4">
          <Text className="text-2xl font-bold text-gray-900">{app_name}</Text>
        </View>
        {/* コンテンツをここに追加 */}
      </ScrollView>
    </SafeAreaView>
  )
}
```

---

## Step 9: 動作確認

### Web
| 項目 | 確認方法 | 期待結果 |
|------|---------|---------|
| デスクトップ表示 | 幅1024px以上 | サイドバー表示 |
| モバイル表示 | 幅768px未満 | ボトムナビ表示 |
| ナビゲーション | 各リンクをクリック | 正しいページに遷移 |
| アクティブ状態 | 現在のページ | ハイライト表示 |

### Expo
| 項目 | 確認方法 | 期待結果 |
|------|---------|---------|
| タブ表示 | シミュレーター起動 | ボトムタブ表示 |
| タブ遷移 | タブをタップ | 正しいスクリーンに遷移 |
| アクティブ状態 | 現在のタブ | 色変化 |
| SafeArea | ノッチ端末で確認 | 適切な余白 |

---

## 完了条件

**Web（`apps/{web_app}` 存在時）:**
- [ ] Providersが作成されている（QueryClient + ThemeProvider）
- [ ] ルートレイアウトが更新されている（アプリ名が正しい）
- [ ] メインレイアウト（認証済み用）が作成されている
- [ ] AppSidebarが作成されている
- [ ] MobileNavが作成されている
- [ ] PageHeaderが作成されている
- [ ] Loading/Error/NotFoundが作成されている

**Expo（`apps/{mobile_app}` 存在時）:**
- [ ] `_layout.tsx`（ルート）にQueryClientProviderが設定されている
- [ ] `(tabs)/_layout.tsx` にタブナビゲーションが設定されている
- [ ] 各タブ画面の基本レイアウトが作成されている
- [ ] SafeAreaProviderが設定されている

---

## 完了後のアクション

```
## 共通レイアウト作成が完了しました

### プロジェクト構成
- Web: apps/{web_app}/
- Expo: apps/{mobile_app}/（存在する場合）

### 作成されたファイル

Web:
- apps/{web_app}/src/components/providers.tsx
- apps/{web_app}/src/app/layout.tsx
- apps/{web_app}/src/app/(main)/layout.tsx
- apps/{web_app}/src/components/layout/app-sidebar.tsx
- apps/{web_app}/src/components/layout/mobile-nav.tsx
- apps/{web_app}/src/components/layout/page-header.tsx

Expo:
- apps/{mobile_app}/app/_layout.tsx
- apps/{mobile_app}/app/(tabs)/_layout.tsx
- apps/{mobile_app}/app/(tabs)/index.tsx

### 次のステップ
- `/dev:06-implement-auth` - 認証機能実装
```

---

## 次のステップ
- `/dev:06-implement-auth` - 認証機能実装
