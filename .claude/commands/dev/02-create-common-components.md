---
description: HTMLモックから共通UIコンポーネントを抽出・作成（Web/Mobile両対応）
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
---

# 共通UIコンポーネント作成

HTMLモックを分析し、再利用可能な共通UIコンポーネントを作成する。

## 実行方法

**このタスクは ultrathink で実行すること。**

## サブエージェント実行（重要）

**各コンポーネントファイルの作成は、サブエージェント（Task tool）を使用して並列実行すること。**

### 実行パターン

1. **Step 1（モック分析）** - メインエージェントで実行
2. **Step 2-3（コンポーネント作成）** - サブエージェントで並列実行
3. **Step 4-5（統合・エクスポート）** - メインエージェントで実行

### サブエージェント起動例

```
Task tool を使用して以下を並列実行:
- PasswordInput 作成（Web）
- RatingButtons 作成（Web）
- TagBadge 作成（Web）
- StudyCard 作成（Web）
- EmptyState 作成（Web）
- Button 作成（Mobile）
- RatingButtons 作成（Mobile）
- StudyCard 作成（Mobile）
- EmptyState 作成（Mobile）
```

各サブエージェントには以下を指示:
- 対象コンポーネント名
- 参照すべきモックのCSSクラス
- 実装パターン（本ドキュメントの該当セクション）
- 出力先パス

---

## 使用方法

```bash
# 基本（v1モックから作成）
/dev:02-create-common-components

# モックバージョン指定
/dev:02-create-common-components v2
```

引数: `$ARGUMENTS` = モックバージョン（省略時: v1）

---

## 前提条件

- HTMLモックが `docs/screens/mock/{version}/` に存在
- Next.js プロジェクト（`apps/web`）が初期化済み
- shadcn/ui が設定済み（`components.json` 存在）

---

## 必須読み込みファイル

**以下を必ず読み込んでから作業を開始すること:**

1. `docs/screens/mock/{version}/css/style.css` - デザイントークン・共通スタイル
2. `docs/screens/mock/{version}/*.html` - 各画面のHTMLモック（最低3-5ファイル）
3. `apps/web/tailwind.config.ts` - 現在のTailwind設定
4. `apps/web/src/app/globals.css` - 現在のグローバルスタイル

---

## Step 1: モック分析

### 1.1 デザイントークンの抽出

CSSファイルから以下を特定・整理:

| カテゴリ | CSS変数例 | 変換先 |
|---------|----------|--------|
| カラー | `--color-primary`, `--color-success` | Tailwind theme.extend.colors |
| 背景 | `--bg-primary`, `--bg-secondary` | CSS変数（globals.css） |
| テキスト | `--text-primary`, `--text-secondary` | CSS変数（globals.css） |
| ボーダー | `--border-color`, `--border-radius` | Tailwind theme.extend |
| シャドウ | `--shadow-sm`, `--shadow-md` | Tailwind theme.extend.boxShadow |
| スペーシング | `--sidebar-width`, `--header-height` | CSS変数（globals.css） |

### 1.2 コンポーネントパターンの特定

HTMLの `data-component` 属性とCSSクラスから抽出:

**基本UI:**
- `.btn`, `.btn--*` → Button variants
- `.btn-icon` → IconButton
- `.form-input`, `.form-textarea` → Input, Textarea
- `.form-group`, `.form-label` → FormField
- `.form-alert` → Alert

**カード系:**
- `.study-card` → StudyCard
- `.summary-card` → SummaryCard

**ナビゲーション:**
- `.tabs`, `.tab` → Tabs
- `.sidebar` → Sidebar
- `.header` → Header

**表示系:**
- `.rating-buttons`, `.rating-btn` → RatingButtons
- `.study-card__tag` → TagBadge
- `.progress-bar` → ProgressBar
- `.card-list__empty` → EmptyState

---

## Step 2: Web用コンポーネント作成

### 2.1 ディレクトリ構成

```
apps/web/src/components/
├── ui/                      # shadcn/ui + カスタムコンポーネント
│   ├── button.tsx           # shadcn/ui 標準（既存）
│   ├── input.tsx            # shadcn/ui 標準（既存）
│   ├── password-input.tsx   # カスタム: パスワード表示切替
│   ├── tabs.tsx             # shadcn/ui 標準 or カスタム
│   ├── rating-buttons.tsx   # カスタム: OK/覚えた/もう一度
│   ├── tag-badge.tsx        # カスタム: タグバッジ
│   ├── study-card.tsx       # カスタム: 学習カード
│   ├── summary-card.tsx     # カスタム: サマリーカード
│   ├── progress-bar.tsx     # カスタム: 進捗バー
│   ├── empty-state.tsx      # カスタム: 空状態
│   └── form-alert.tsx       # カスタム: フォームアラート
└── layout/
    ├── sidebar.tsx          # デスクトップサイドバー
    ├── header.tsx           # ヘッダー
    └── bottom-nav.tsx       # モバイルボトムナビ
```

### 2.2 コンポーネント実装規約

```typescript
// 命名: PascalCase
// ファイル: kebab-case.tsx
// export: named export のみ（default export 禁止）

// 必須インポート
import { cn } from '@/lib/utils'

// Props型定義
interface ComponentNameProps {
  className?: string  // 常に含める
  // ...その他のprops
}

// コンポーネント実装
export function ComponentName({ className, ...props }: ComponentNameProps) {
  return (
    <div className={cn('base-classes', className)}>
      {/* ... */}
    </div>
  )
}
```

### 2.3 主要コンポーネント実装パターン

#### PasswordInput
```typescript
'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PasswordInputProps extends React.ComponentProps<typeof Input> {
  showToggle?: boolean
}

export function PasswordInput({
  className,
  showToggle = true,
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        type={isVisible ? 'text' : 'password'}
        className={cn('pr-10', className)}
        {...props}
      />
      {showToggle && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
          onClick={() => setIsVisible(!isVisible)}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="sr-only">
            {isVisible ? 'パスワードを隠す' : 'パスワードを表示'}
          </span>
        </Button>
      )}
    </div>
  )
}
```

#### RatingButtons
```typescript
'use client'

import { cn } from '@/lib/utils'

type Rating = 'ok' | 'learned' | 'again'

interface RatingButtonsProps {
  onRate: (rating: Rating) => void
  intervals?: { ok?: string; again?: string }
  disabled?: boolean
  className?: string
}

const ratingConfig = {
  ok: {
    label: 'OK',
    className: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white',
  },
  learned: {
    label: '覚えた',
    preview: '完了',
    className: 'bg-primary/10 text-primary hover:bg-primary hover:text-white',
  },
  again: {
    label: 'もう一度',
    className: 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white',
  },
} as const

export function RatingButtons({
  onRate,
  intervals,
  disabled,
  className,
}: RatingButtonsProps) {
  return (
    <div className={cn('flex gap-1.5', className)}>
      {(['ok', 'learned', 'again'] as const).map((rating) => (
        <button
          key={rating}
          type="button"
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium',
            'transition-colors disabled:opacity-50',
            ratingConfig[rating].className
          )}
          onClick={() => onRate(rating)}
        >
          <span className="font-semibold">{ratingConfig[rating].label}</span>
          <span className="text-xs opacity-85">
            {rating === 'learned'
              ? '完了'
              : intervals?.[rating as 'ok' | 'again']}
          </span>
        </button>
      ))}
    </div>
  )
}
```

#### TagBadge
```typescript
import { cn } from '@/lib/utils'

interface TagBadgeProps {
  children: React.ReactNode
  className?: string
}

export function TagBadge({ children, className }: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1',
        'bg-sky-100 text-sky-700 border border-sky-200',
        'text-xs font-medium rounded-full',
        className
      )}
    >
      {children}
    </span>
  )
}
```

---

## Step 3: Mobile用コンポーネント作成

**`apps/mobile` が存在する場合は必ず実行すること**

### 3.1 ディレクトリ構成

```
apps/mobile/components/
├── ui/
│   ├── Button.tsx         # Pressable + variantStyles（6バリアント・4サイズ）
│   ├── Input.tsx          # TextInput + label/error表示
│   ├── PasswordInput.tsx  # Input拡張 + 表示切替（useState）
│   ├── RatingButtons.tsx  # Pressable × 3ボタン（ok/learned/again）
│   ├── TagBadge.tsx       # View + Text（sky-100背景）
│   ├── StudyCard.tsx      # フリップカード（Q&A表示）
│   ├── ProgressBar.tsx    # View with width style
│   ├── EmptyState.tsx     # View + Text + optional action
│   ├── FormAlert.tsx      # variant対応アラート
│   └── index.ts           # named export集約
└── cards/
    └── MobileCardList.tsx # FlatList 最適化版
```

### 3.2 Mobile実装規約

```typescript
// React Native + NativeWind
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native'
import { cn } from '@/lib/cn'  // Web は '@/lib/utils'、Mobile は '@/lib/cn'

interface ComponentNameProps {
  className?: string
}

export function ComponentName({ className }: ComponentNameProps) {
  return (
    <View className={cn('base-classes', className)}>
      <Text>Content</Text>
    </View>
  )
}
```

**Mobile実装の注意点:**
- `div` → `View`、`span`/`p` → `Text`、`button` → `Pressable`、`input` → `TextInput`
- アイコンは絵文字テキストで代替（SVGはNativeWindの `className` 非対応のため）
- パスエイリアス: `@/*` → `./*`（tsconfig.json）
- Web の `hover:` クラスは Mobile では `active:` クラスに置き換える
- `style` プロパティではなく `className` でNativeWindスタイリングする

### 3.3 主要コンポーネント実装パターン

#### Button
```typescript
import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native'
import { cn } from '@/lib/cn'

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

interface ButtonProps extends Omit<PressableProps, 'children'> {
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  textClassName?: string
  loading?: boolean
}

const variantStyles: Record<ButtonVariant, { container: string; text: string }> = {
  default:     { container: 'bg-blue-600 active:bg-blue-700', text: 'text-white' },
  destructive: { container: 'bg-red-500 active:bg-red-600',   text: 'text-white' },
  outline:     { container: 'border border-gray-300 bg-white active:bg-gray-100', text: 'text-gray-900' },
  secondary:   { container: 'bg-gray-100 active:bg-gray-200', text: 'text-gray-900' },
  ghost:       { container: 'active:bg-gray-100',             text: 'text-gray-900' },
  link:        { container: '',                               text: 'text-blue-600' },
}

export function Button({ children, variant = 'default', size = 'default', loading = false, disabled, className, textClassName, ...props }: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <Pressable
      className={cn('flex-row items-center justify-center rounded-lg h-11 px-5 py-2.5',
        variantStyles[variant].container, isDisabled && 'opacity-50', className)}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'default' || variant === 'destructive' ? '#ffffff' : '#374151'} />
      ) : typeof children === 'string' ? (
        <Text className={cn('font-medium text-center text-base', variantStyles[variant].text, textClassName)}>
          {children}
        </Text>
      ) : children}
    </Pressable>
  )
}
```

#### RatingButtons
```typescript
import { View, Text, Pressable } from 'react-native'
import { cn } from '@/lib/cn'

type Rating = 'ok' | 'learned' | 'again'

interface RatingButtonsProps {
  onRate: (rating: Rating) => void
  intervals?: { ok?: string; again?: string }
  disabled?: boolean
  className?: string
}

const ratingConfig = {
  ok:      { label: 'OK',       bgClass: 'bg-emerald-100', textClass: 'text-emerald-600' },
  learned: { label: '覚えた',   bgClass: 'bg-blue-100',    textClass: 'text-blue-600' },
  again:   { label: 'もう一度', bgClass: 'bg-red-100',     textClass: 'text-red-500' },
} as const

export function RatingButtons({ onRate, intervals, disabled, className }: RatingButtonsProps) {
  return (
    <View className={cn('flex-row gap-1.5', className)}>
      {(['ok', 'learned', 'again'] as const).map((rating) => (
        <Pressable key={rating} disabled={disabled}
          className={cn('flex-row items-center gap-1.5 px-3.5 py-2 rounded-lg',
            ratingConfig[rating].bgClass, disabled && 'opacity-50')}
          onPress={() => onRate(rating)}
        >
          <Text className={cn('text-sm font-semibold', ratingConfig[rating].textClass)}>
            {ratingConfig[rating].label}
          </Text>
          <Text className={cn('text-xs opacity-85', ratingConfig[rating].textClass)}>
            {rating === 'learned' ? '完了' : intervals?.[rating as 'ok' | 'again']}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}
```

#### TagBadge
```typescript
import { Text } from 'react-native'
import { cn } from '@/lib/cn'

interface TagBadgeProps {
  children: React.ReactNode
  className?: string
}

export function TagBadge({ children, className }: TagBadgeProps) {
  return (
    <Text className={cn('px-3 py-1 bg-sky-100 text-sky-700 text-xs font-medium rounded-full', className)}>
      {children}
    </Text>
  )
}
```

---

## Step 4: デザイントークン統合

### 4.1 globals.css 更新

```css
@layer base {
  :root {
    /* Colors from mock */
    --color-primary: 217.2 91.2% 59.8%;
    --color-primary-hover: 221.2 83.2% 53.3%;
    --color-success: 160.1 84.1% 39.4%;
    --color-warning: 37.7 92.1% 50.2%;
    --color-danger: 0 84.2% 60.2%;

    /* Backgrounds */
    --bg-primary: 0 0% 100%;
    --bg-secondary: 210 40% 98%;

    /* Text */
    --text-primary: 222.2 84% 4.9%;
    --text-secondary: 215.4 16.3% 46.9%;
    --text-muted: 215.4 16.3% 63.9%;

    /* Spacing */
    --sidebar-width-collapsed: 72px;
    --sidebar-width-expanded: 260px;
    --header-height: 64px;
    --bottom-nav-height: 64px;
  }
}
```

### 4.2 tailwind.config.ts 更新

```typescript
import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--color-primary))',
          hover: 'hsl(var(--color-primary-hover))',
        },
        success: 'hsl(var(--color-success))',
        warning: 'hsl(var(--color-warning))',
        danger: 'hsl(var(--color-danger))',
      },
    },
  },
} satisfies Config
```

---

## Step 5: コンポーネントのエクスポート

### index.ts でまとめてエクスポート

**Web:**
```typescript
// apps/web/src/components/ui/index.ts
export { Button } from './button'
export { Input } from './input'
export { PasswordInput } from './password-input'
export { RatingButtons } from './rating-buttons'
export { TagBadge } from './tag-badge'
export { StudyCard } from './study-card'
export { SummaryCard } from './summary-card'
export { ProgressBar } from './progress-bar'
export { EmptyState } from './empty-state'
export { FormAlert } from './form-alert'
```

**Mobile:**
```typescript
// apps/mobile/components/ui/index.ts
export { Button } from './Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button'

export { Input } from './Input'
export type { InputProps } from './Input'

export { PasswordInput } from './PasswordInput'
export type { PasswordInputProps } from './PasswordInput'

export { RatingButtons } from './RatingButtons'
export type { Rating, RatingButtonsProps } from './RatingButtons'

export { TagBadge } from './TagBadge'
export type { TagBadgeProps } from './TagBadge'

export { StudyCard } from './StudyCard'
export type { StudyCardProps } from './StudyCard'

export { ProgressBar } from './ProgressBar'
export type { ProgressBarProps } from './ProgressBar'

export { EmptyState } from './EmptyState'
export type { EmptyStateProps } from './EmptyState'

export { FormAlert } from './FormAlert'
export type { FormAlertProps, AlertVariant } from './FormAlert'
```

---

## 完了条件

- [ ] モックのCSSからデザイントークンを抽出し、globals.css / tailwind.config.ts に反映
- [ ] 以下の共通コンポーネントを作成:
  - [ ] PasswordInput
  - [ ] RatingButtons
  - [ ] TagBadge
  - [ ] StudyCard
  - [ ] EmptyState
  - [ ] FormAlert
  - [ ] ProgressBar
- [ ] TypeScript型定義が適切
- [ ] `use client` が必要なコンポーネントにのみ付与（Web）
- [ ] `apps/web/src/components/ui/index.ts` でエクスポート設定完了
- [ ] （Mobile存在時）Mobile用コンポーネントも作成
  - [ ] `Pressable` / `TextInput` / `View` / `Text` を適切に使用
  - [ ] NativeWindの `className` でスタイリング（`style` プロパティ直書き禁止）
  - [ ] Web の `hover:` → Mobile では `active:` に置き換え
  - [ ] `apps/mobile/components/ui/index.ts` でエクスポート設定完了

---

## 完了報告フォーマット

```
## 共通UIコンポーネント作成完了

### 作成したコンポーネント

| コンポーネント | Web | Mobile | 説明 |
|--------------|-----|--------|------|
| Button | o | o | 複数バリアント・サイズ |
| Input | o | o | テキスト入力 |
| PasswordInput | o | o | パスワード表示切替 |
| RatingButtons | o | o | OK/覚えた/もう一度 |
| TagBadge | o | o | タグバッジ |
| StudyCard | o | o | 学習カード（フリップ） |
| ProgressBar | o | o | 進捗バー |
| EmptyState | o | o | 空状態表示 |
| FormAlert | o | o | フォームアラート |

### 更新したファイル
- apps/web/src/app/globals.css
- apps/web/tailwind.config.ts
- apps/web/src/components/ui/index.ts

### 次のステップ
- `/phase-3-foundation/layout` - 共通レイアウト実装
- `/phase-4-features/vertical` - 1機能の垂直実装
```
