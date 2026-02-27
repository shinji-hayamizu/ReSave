---
description: 共通レイアウト（Sidebar, MobileNav, Providers）作成。Web/Mobileのナビゲーション基盤を構築する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: [出力先ディレクトリ (例: web)]
---

# 共通レイアウト作成

Sidebar、MobileNav、Providersなど共通レイアウトコンポーネントを作成するよ。

## 前提

以下が完了済みであること:
- Webセットアップ（`/dev:01-setup-web`）
- shadcn/ui初期設定

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

## Step 1: プロジェクト構造の確認

### 1.1 出力先の特定

引数 `$ARGUMENTS` からプロジェクトルートを特定。

| 項目 | 確認内容 |
|------|---------|
| プロジェクトルート | $ARGUMENTS (例: `web`) |
| レイアウトコンポーネント | `{root}/src/components/layout/` |
| Providers | `{root}/src/components/providers.tsx` |
| ルートレイアウト | `{root}/src/app/layout.tsx` |

### 1.2 ナビゲーション項目の特定

アーキテクチャドキュメントから画面一覧を抽出し、ナビゲーション項目を決定:

| 項目 | パス | アイコン |
|------|-----|---------|
| ダッシュボード | / | Home |
| カード | /cards | Library |
| 学習 | /study | GraduationCap |
| 統計 | /stats | BarChart |
| 設定 | /settings | Settings |

---

## Step 2: Providers作成

### 2.1 QueryClient + ThemeProvider

#### {root}/src/components/providers.tsx
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

## Step 3: ルートレイアウト

### 3.1 RootLayout更新

#### {root}/src/app/layout.tsx
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'ReSave',
    template: '%s | ReSave',
  },
  description: '忘却曲線に基づく間隔反復記憶カードアプリ',
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

## Step 4: メインレイアウト（認証済みユーザー用）

### 4.1 (main) グループレイアウト

#### {root}/src/app/(main)/layout.tsx
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

## Step 5: サイドバー（デスクトップ用）

### 5.1 AppSidebar

#### {root}/src/components/layout/app-sidebar.tsx
```typescript
'use client'

import {
  BarChart,
  GraduationCap,
  Home,
  Library,
  LogOut,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { signOut } from '@/actions/auth'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const navItems = [
  { title: 'ダッシュボード', href: '/', icon: Home },
  { title: 'カード', href: '/cards', icon: Library },
  { title: '学習', href: '/study', icon: GraduationCap },
  { title: '統計', href: '/stats', icon: BarChart },
  { title: '設定', href: '/settings', icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="hidden md:flex">
      <SidebarHeader className="border-b p-4">
        <Link className="flex items-center gap-2 font-bold" href="/">
          <span className="text-xl">ReSave</span>
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
              <LogOut className="h-4 w-4" />
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

## Step 6: モバイルナビゲーション

### 6.1 MobileNav

#### {root}/src/components/layout/mobile-nav.tsx
```typescript
'use client'

import {
  BarChart,
  GraduationCap,
  Home,
  Library,
  Settings,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

const navItems = [
  { title: 'ホーム', href: '/', icon: Home },
  { title: 'カード', href: '/cards', icon: Library },
  { title: '学習', href: '/study', icon: GraduationCap },
  { title: '統計', href: '/stats', icon: BarChart },
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

## Step 7: ページヘッダー

### 7.1 PageHeader

#### {root}/src/components/layout/page-header.tsx
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

---

## Step 8: ローディング・エラー・NotFound

### 8.1 Loading

#### {root}/src/app/(main)/loading.tsx
```typescript
import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
```

### 8.2 Error

#### {root}/src/app/(main)/error.tsx
```typescript
'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">エラーが発生しました</h2>
      <p className="text-muted-foreground">
        問題が解決しない場合は、ページを再読み込みしてください
      </p>
      <Button onClick={() => reset()}>再試行</Button>
    </div>
  )
}
```

### 8.3 NotFound

#### {root}/src/app/not-found.tsx
```typescript
import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-4xl font-bold">404</h2>
      <p className="text-muted-foreground">ページが見つかりません</p>
      <Button asChild>
        <Link href="/">ホームに戻る</Link>
      </Button>
    </div>
  )
}
```

---

## Step 9: 動作確認

### 9.1 確認項目

| 項目 | 確認方法 | 期待結果 |
|------|---------|---------|
| デスクトップ表示 | 幅1024px以上 | サイドバー表示 |
| モバイル表示 | 幅768px未満 | ボトムナビ表示 |
| ナビゲーション | 各リンクをクリック | 正しいページに遷移 |
| アクティブ状態 | 現在のページ | ハイライト表示 |
| ダークモード | テーマ切り替え | 正しく適用 |
| ローディング | ページ遷移時 | ローディング表示 |

---

## 完了条件

- [ ] Providersが作成されている（QueryClient + ThemeProvider）
- [ ] ルートレイアウトが更新されている
- [ ] メインレイアウト（認証済み用）が作成されている
- [ ] AppSidebarが作成されている
- [ ] MobileNavが作成されている
- [ ] PageHeaderが作成されている
- [ ] Loading/Error/NotFoundが作成されている
- [ ] レスポンシブ対応している

---

## 完了後のアクション

```
## 共通レイアウト作成が完了しました

### 作成されたファイル
- {root}/src/components/providers.tsx
- {root}/src/app/layout.tsx（更新）
- {root}/src/app/(main)/layout.tsx
- {root}/src/components/layout/app-sidebar.tsx
- {root}/src/components/layout/mobile-nav.tsx
- {root}/src/components/layout/page-header.tsx
- {root}/src/app/(main)/loading.tsx
- {root}/src/app/(main)/error.tsx
- {root}/src/app/not-found.tsx

### 動作確認結果
| 項目 | 状態 |
|------|------|
| デスクトップ表示 | [Success/Failed] |
| モバイル表示 | [Success/Failed] |
| ナビゲーション | [Success/Failed] |
| ダークモード | [Success/Failed] |

### 次のステップ
- `/dev:06-implement-auth` - 認証機能実装
```

---

## 次のステップ
- `/dev:06-implement-auth` - 認証機能実装
