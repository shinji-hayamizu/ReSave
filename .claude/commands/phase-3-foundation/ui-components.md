---
description: shadcn/ui + 共通UIコンポーネントの実装
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
---

# Phase 3-C: 共通UIコンポーネントの実装

## 前提
以下が完了済みであること:
- 共通レイアウトの実装（`/phase-3-foundation/layout`）
- Tailwind CSS の設定

---

## 参照ドキュメント（必須読み込み）
- `docs/requirements/architecture.md`
- HTMLモックがある場合は `mock/` 配下のファイル

## あなたの役割
UI/UXに精通したフロントエンドエンジニア。
再利用可能なコンポーネント設計に長けている。

## 実行方法
このタスクは **ultrathink** で実行すること。

---

## Step 1: shadcn/ui 初期設定

### 1.1 初期化

```bash
npx shadcn@latest init
```

### 1.2 設定内容

```
Would you like to use TypeScript? yes
Which style would you like to use? Default
Which color would you like to use as base color? Slate
Would you like to use CSS variables for colors? yes
```

### 1.3 components.json 確認

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

---

## Step 2: 必須コンポーネントのインストール

### 2.1 基本コンポーネント

```bash
# フォーム関連
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add checkbox
npx shadcn@latest add switch
npx shadcn@latest add form

# フィードバック
npx shadcn@latest add alert
npx shadcn@latest add sonner
npx shadcn@latest add skeleton

# レイアウト
npx shadcn@latest add card
npx shadcn@latest add separator
npx shadcn@latest add badge
npx shadcn@latest add avatar

# ナビゲーション
npx shadcn@latest add sidebar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add dialog
npx shadcn@latest add sheet

# データ表示
npx shadcn@latest add table
npx shadcn@latest add tabs
```

### 2.2 一括インストール（推奨）

```bash
npx shadcn@latest add button input label textarea select checkbox switch form alert sonner skeleton card separator badge avatar sidebar dropdown-menu dialog sheet table tabs
```

---

## Step 3: カスタムコンポーネント

### 3.1 Empty State

#### src/components/ui/empty-state.tsx
```typescript
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
```

### 3.2 Confirm Dialog

#### src/components/ui/confirm-dialog.tsx
```typescript
'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = '確認',
  cancelText = 'キャンセル',
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            className={
              variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : ''
            }
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### 3.3 Loading Button

#### src/components/ui/loading-button.tsx
```typescript
import { Loader2 } from 'lucide-react'

import { Button, ButtonProps } from '@/components/ui/button'

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
}

export function LoadingButton({
  loading,
  disabled,
  children,
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}
```

### 3.4 Page Container

#### src/components/ui/page-container.tsx
```typescript
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('container mx-auto px-4 py-6 md:px-6', className)}>
      {children}
    </div>
  )
}
```

### 3.5 Stats Card

#### src/components/ui/stats-card.tsx
```typescript
import { LucideIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatsCardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  description?: string
  trend?: {
    value: number
    label: string
  }
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p
            className={cn(
              'text-xs',
              trend.value >= 0 ? 'text-green-500' : 'text-red-500'
            )}
          >
            {trend.value >= 0 ? '+' : ''}
            {trend.value}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## Step 4: フォームコンポーネント

### 4.1 Form Field Wrapper

#### src/components/ui/form-field.tsx
```typescript
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  htmlFor,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
```

### 4.2 Tag Input（複数タグ入力）

#### src/components/ui/tag-input.tsx
```typescript
'use client'

import { X } from 'lucide-react'
import { useState, KeyboardEvent } from 'react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface TagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  maxTags?: number
}

export function TagInput({
  value,
  onChange,
  placeholder = 'タグを入力...',
  maxTags = 10,
}: TagInputProps) {
  const [input, setInput] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = input.trim()
      if (tag && !value.includes(tag) && value.length < maxTags) {
        onChange([...value, tag])
        setInput('')
      }
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  return (
    <div className="flex flex-wrap gap-2 rounded-md border p-2">
      {value.map((tag) => (
        <Badge key={tag} variant="secondary">
          {tag}
          <button
            className="ml-1 hover:text-destructive"
            type="button"
            onClick={() => removeTag(tag)}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Input
        className="min-w-[120px] flex-1 border-0 p-0 focus-visible:ring-0"
        placeholder={value.length >= maxTags ? '' : placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
```

---

## Step 5: ユーティリティ関数

### 5.1 cn（クラス名結合）

#### src/lib/utils.ts
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 5.2 formatDate

#### src/lib/format.ts
```typescript
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`
  if (hours < 24) return `${hours}時間前`
  if (days < 7) return `${days}日前`
  return formatDate(d)
}
```

---

## Step 6: 動作確認

### 6.1 Storybook（オプション）

```bash
npx storybook@latest init
```

### 6.2 コンポーネントカタログページ（代替）

#### src/app/(main)/components/page.tsx
```typescript
import { Package } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingButton } from '@/components/ui/loading-button'
import { PageContainer } from '@/components/ui/page-container'
import { StatsCard } from '@/components/ui/stats-card'

export default function ComponentsPage() {
  return (
    <PageContainer>
      <h1 className="mb-8 text-2xl font-bold">コンポーネントカタログ</h1>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Button</h2>
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <LoadingButton loading>Loading</LoadingButton>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Badge</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Card</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <StatsCard
              description="前日比"
              title="総カード数"
              value={128}
            />
            <StatsCard
              description="今日の目標"
              title="今日の学習"
              value="12/20"
            />
            <StatsCard
              description="継続中"
              title="ストリーク"
              value="7日"
            />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold">Empty State</h2>
          <Card>
            <CardContent className="py-8">
              <EmptyState
                action={<Button>カードを作成</Button>}
                description="新しいカードを作成して学習を始めましょう"
                icon={Package}
                title="カードがありません"
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </PageContainer>
  )
}
```

---

## 完了条件

- [ ] shadcn/ui が初期化されている
- [ ] 必須コンポーネントがインストールされている
- [ ] カスタムコンポーネントが作成されている
- [ ] ユーティリティ関数が作成されている
- [ ] コンポーネントが正しく表示される

---

## 完了後のアクション

```
## 共通UIコンポーネントの実装が完了しました

### インストールされた shadcn/ui コンポーネント
- button, input, label, textarea, select
- checkbox, switch, form
- alert, sonner, skeleton
- card, separator, badge, avatar
- sidebar, dropdown-menu, dialog, sheet
- table, tabs

### 作成したカスタムコンポーネント
- EmptyState
- ConfirmDialog
- LoadingButton
- PageContainer
- StatsCard
- FormField
- TagInput

### ユーティリティ
- cn（クラス名結合）
- formatDate, formatDateTime, formatRelativeTime

内容を確認し、問題なければ「OK」と入力してください。
```

---

## 次のステップ
`/phase-4-features/vertical` - 1機能の垂直実装
