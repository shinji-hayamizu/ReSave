---
description: HTMLモック/デザイントークンから共通UIコンポーネントを作成（Web + Expo 同時）。shadcn/ui と NativeWind を使って両プラットフォームのUIを構築する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: [コンポーネント名 (省略で全コンポーネント)]
---

# 共通UIコンポーネント作成（Web + Expo）

HTMLモックとデザイントークンを参照して、Web（shadcn/ui + Tailwind）と Expo（NativeWind + React Native）の共通UIコンポーネントを作成する。

## 使い方

```bash
# 全コンポーネントを作成
/dev:02-create-components

# 特定コンポーネントのみ
/dev:02-create-components Button
/dev:02-create-components Card,Badge,Button
```

引数: `$ARGUMENTS` = コンポーネント名（省略時: HTMLモックから全コンポーネントを自動抽出）

## 前提条件

以下が完了済みであること:
- モノレポ基盤構築（`/dev:01-setup`）
- HTMLモックが存在すること（`docs/screens/mock/{version}/*.html`）

---

## 必須読み込みファイル

1. `docs/screens/mock/{version}/css/style.css` — デザイントークン（カラー・スペーシング・タイポグラフィ）
2. `docs/screens/mock/{version}/*.html` — コンポーネントパターン（繰り返し使われているUI要素を抽出）
3. `docs/requirements/architecture.md` — 技術スタック確認

---

## Phase 1: コンポーネント抽出

### 1.1 デザイントークンの読み込み

`docs/screens/mock/{version}/css/style.css` から以下を抽出:

| 種類 | 例 |
|------|---|
| カラー | primary, secondary, background, text, border |
| スペーシング | spacing-1 〜 spacing-8 |
| タイポグラフィ | font-size, font-weight, line-height |
| 角丸・影 | border-radius, box-shadow |

### 1.2 コンポーネントの特定

HTMLモック内で繰り返し使われているUIパターンを抽出:

```
よくあるコンポーネント:
- Button（primary/secondary/ghost バリアント）
- Card（コンテンツカード）
- Badge/Tag（ラベル）
- Input/Textarea（入力フォーム）
- Avatar（ユーザーアイコン）
- EmptyState（空状態）
- LoadingSpinner（ローディング）
- Modal/Dialog（モーダル）
- Toast/Notification（通知）
```

### 1.3 実装計画の提示

```
## コンポーネント実装計画

### Web（apps/web/src/components/ui/）
- [ ] Button.tsx
- [ ] Card.tsx
- [ ] Badge.tsx
- [ ] Input.tsx
- ...

### Expo（apps/mobile/components/ui/）
- [ ] Button.tsx（React Native版）
- [ ] Card.tsx
- [ ] Badge.tsx
- [ ] Input.tsx（TextInput wrapper）
- ...

この計画で実装を進めてよいですか？
```

---

## Phase 2: 実装（サブエージェント並列）

承認後、Web と Expo を**並列で実装**する。

### Web コンポーネント（apps/web/src/components/ui/）

shadcn/ui をベースに Tailwind でスタイリング:

#### Button

```tsx
// apps/web/src/components/ui/Button.tsx
'use client'

import { cn } from '@/lib/cn'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        {
          primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
          secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          ghost: 'hover:bg-accent hover:text-accent-foreground',
          destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        }[variant],
        {
          sm: 'h-8 px-3 text-sm',
          md: 'h-10 px-4',
          lg: 'h-12 px-6 text-lg',
        }[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
```

#### EmptyState

```tsx
// apps/web/src/components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
```

**デザイントークンを Tailwind config に反映**:

`apps/web/tailwind.config.ts` に CSS変数からカラーを設定:

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      // HTMLモックのCSS変数をマッピング
      primary: 'hsl(var(--primary))',
      secondary: 'hsl(var(--secondary))',
      // ...
    }
  }
}
```

---

### Expo コンポーネント（apps/mobile/components/ui/）

React Native プリミティブ + NativeWind でスタイリング:

#### Button（Expo版）

```tsx
// apps/mobile/components/ui/Button.tsx
import { Pressable, Text } from 'react-native'
import { cn } from '@/lib/cn'

interface ButtonProps {
  onPress?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export function Button({
  onPress,
  variant = 'primary',
  size = 'md',
  children,
  disabled,
  className,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'flex-row items-center justify-center rounded-lg',
        {
          primary: 'bg-primary',
          secondary: 'bg-secondary',
          ghost: 'bg-transparent',
          destructive: 'bg-destructive',
        }[variant],
        {
          sm: 'h-8 px-3',
          md: 'h-10 px-4',
          lg: 'h-12 px-6',
        }[size],
        disabled && 'opacity-50',
        className
      )}
    >
      <Text
        className={cn(
          'font-medium',
          variant === 'primary' ? 'text-white' : 'text-foreground',
          {
            sm: 'text-sm',
            md: 'text-base',
            lg: 'text-lg',
          }[size]
        )}
      >
        {children}
      </Text>
    </Pressable>
  )
}
```

#### EmptyState（Expo版）

```tsx
// apps/mobile/components/ui/EmptyState.tsx
import { View, Text } from 'react-native'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-12">
      {icon && <View className="mb-4">{icon}</View>}
      <Text className="text-lg font-semibold text-foreground">{title}</Text>
      {description && (
        <Text className="mt-1 text-sm text-muted-foreground text-center">{description}</Text>
      )}
      {action && <View className="mt-4">{action}</View>}
    </View>
  )
}
```

**NativeWind テーマ設定**:

`apps/mobile/tailwind.config.js` にカラーを追加:

```js
theme: {
  extend: {
    colors: {
      // HTMLモックのデザイントークンに合わせる
      primary: '#6366f1',
      secondary: '#f1f5f9',
      // ...
    }
  }
}
```

---

## Phase 3: index.ts の整備

### Web

```typescript
// apps/web/src/components/ui/index.ts
export { Button } from './Button'
export { Card } from './Card'
export { Badge } from './Badge'
export { EmptyState } from './EmptyState'
// ...
```

### Expo

```typescript
// apps/mobile/components/ui/index.ts
export { Button } from './Button'
export { Card } from './Card'
export { Badge } from './Badge'
export { EmptyState } from './EmptyState'
// ...
```

---

## Phase 4: 動作確認

### Web

```bash
cd apps/web && npx tsc --noEmit
pnpm dev:web
# → http://localhost:3000 でコンポーネントを確認
```

### Expo

```bash
cd apps/mobile && npx tsc --noEmit
pnpm dev:mobile
# → Expo Go でコンポーネントを確認
```

---

## 完了条件

- [ ] HTMLモックからコンポーネントを抽出済み
- [ ] デザイントークンを Tailwind config に反映済み
- [ ] Web: `apps/web/src/components/ui/` にコンポーネント群が作成されている
- [ ] Expo: `apps/mobile/components/ui/` にコンポーネント群が作成されている
- [ ] 各コンポーネントが named export されている（default export 禁止）
- [ ] TypeScript 型エラーがない（`npx tsc --noEmit`）
- [ ] 両プラットフォームで表示確認済み

---

## 次のステップ

- `/dev:03-setup-backend` — Supabase基盤構築
