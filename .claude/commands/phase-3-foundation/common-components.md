---
description: HTMLモックから共通UIコンポーネントを作成（Web/Mobile両対応）
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
---

# Phase 3: 共通UIコンポーネント作成

## 前提
以下が完了済みであること:
- HTMLモックが `docs/screens/mock/` に存在
- Next.js プロジェクト（`apps/web`）が初期化済み
- Expo プロジェクト（`apps/mobile`）が存在する場合は対応

---

## 参照ドキュメント（必須読み込み）

**以下のファイルを必ず読み込むこと:**
- `docs/screens/mock/v1/css/style.css` - 共通スタイル定義
- `docs/screens/mock/v1/*.html` - 各画面のHTMLモック
- `docs/requirements/architecture.md`（存在する場合）

---

## あなたの役割

UI/UXに精通したフロントエンドエンジニア。
HTMLモックからReactコンポーネントを抽出・実装する専門家。
Web（Next.js + shadcn/ui）とMobile（Expo + NativeWind）両方に対応可能。

---

## 実行方法

このタスクは **ultrathink** で実行すること。

---

## Step 1: モック分析

### 1.1 CSSから共通スタイルを抽出

`docs/screens/mock/v1/css/style.css` を読み込み、以下を特定:

1. **デザイントークン（CSS変数）**
   - カラーパレット（`--color-primary` など）
   - スペーシング（`--sidebar-width` など）
   - 境界線半径（`--border-radius` など）
   - シャドウ（`--shadow-*`）
   - トランジション

2. **共通コンポーネントパターン**
   - `.btn`, `.btn--*` - ボタンバリエーション
   - `.form-*` - フォーム要素
   - `.tabs`, `.tab` - タブコンポーネント
   - `.study-card`, `.summary-card` - カードコンポーネント
   - `.rating-btn` - 評価ボタン
   - その他繰り返し使用されるパターン

### 1.2 HTMLからコンポーネント構造を抽出

各HTMLファイルの `data-component` 属性を確認し、コンポーネント階層を整理:

```
例:
- LoginCard
  - LoginForm
    - PasswordInput
- HomePage
  - QuickInputForm
  - CardTabs
  - CardList
    - StudyCard
      - RatingButtons
      - TagList
```

---

## Step 2: Web用コンポーネント作成（Next.js + shadcn/ui）

### 2.1 ディレクトリ構成

```
apps/web/src/
├── components/
│   ├── ui/                    # shadcn/ui + カスタムコンポーネント
│   │   ├── button.tsx         # shadcn/ui 標準
│   │   ├── input.tsx          # shadcn/ui 標準
│   │   ├── password-input.tsx # カスタム: パスワード表示切替
│   │   ├── tabs.tsx           # shadcn/ui 標準
│   │   ├── rating-buttons.tsx # カスタム: OK/覚えた/もう一度
│   │   ├── tag-badge.tsx      # カスタム: タグ表示
│   │   ├── study-card.tsx     # カスタム: 学習カード
│   │   ├── empty-state.tsx    # カスタム: 空状態
│   │   └── progress-bar.tsx   # カスタム: 進捗バー
│   └── layout/
│       ├── sidebar.tsx
│       ├── header.tsx
│       └── bottom-nav.tsx
├── lib/
│   └── utils.ts               # cn() など
└── styles/
    └── globals.css            # デザイントークン
```

### 2.2 デザイントークン変換

モックのCSS変数をTailwind設定に変換:

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          hover: 'hsl(var(--primary-hover))',
        },
        accent: 'hsl(var(--accent))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        danger: 'hsl(var(--danger))',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
    },
  },
} satisfies Config
```

### 2.3 主要コンポーネント実装例

#### PasswordInput（モックの `.password-input-wrapper` から）

```typescript
// apps/web/src/components/ui/password-input.tsx
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

#### RatingButtons（モックの `.rating-buttons` から）

```typescript
// apps/web/src/components/ui/rating-buttons.tsx
'use client'

import { cn } from '@/lib/utils'

type Rating = 'ok' | 'learned' | 'again'

interface RatingButtonsProps {
  onRate: (rating: Rating) => void
  intervals?: {
    ok?: string
    again?: string
  }
  disabled?: boolean
  className?: string
}

const ratingConfig = {
  ok: {
    label: 'OK',
    className: 'bg-success/10 text-success hover:bg-success hover:text-white',
  },
  learned: {
    label: '覚えた',
    preview: '完了',
    className: 'bg-primary/10 text-primary hover:bg-primary hover:text-white',
  },
  again: {
    label: 'もう一度',
    className: 'bg-danger/10 text-danger hover:bg-danger hover:text-white',
  },
}

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

#### StudyCard（モックの `.study-card` から）

```typescript
// apps/web/src/components/ui/study-card.tsx
'use client'

import { useState } from 'react'
import { Eye, EyeOff, Edit } from 'lucide-react'

import { cn } from '@/lib/utils'
import { RatingButtons } from '@/components/ui/rating-buttons'
import { TagBadge } from '@/components/ui/tag-badge'

interface StudyCardProps {
  question: string
  answer: string
  tags?: string[]
  isCompleted?: boolean
  intervals?: { ok?: string; again?: string }
  onRate?: (rating: 'ok' | 'learned' | 'again') => void
  onEdit?: () => void
  className?: string
}

export function StudyCard({
  question,
  answer,
  tags = [],
  isCompleted = false,
  intervals,
  onRate,
  onEdit,
  className,
}: StudyCardProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className={cn(
        'bg-background rounded-xl shadow-sm overflow-hidden',
        'hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 p-3">
        {!isCompleted && onRate && (
          <RatingButtons onRate={onRate} intervals={intervals} />
        )}
        {tags.length > 0 && (
          <div className={cn('flex flex-wrap gap-1', isCompleted && 'ml-auto')}>
            {tags.map((tag) => (
              <TagBadge key={tag}>{tag}</TagBadge>
            ))}
          </div>
        )}
      </div>

      {/* Question */}
      <div className="px-5 pb-2">
        <div className="flex justify-between items-start gap-3">
          <p className="flex-1 text-base leading-relaxed">{question}</p>
          {onEdit && (
            <button
              type="button"
              className="shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:bg-border hover:text-foreground transition-colors"
              onClick={onEdit}
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Toggle */}
      <button
        type="button"
        className="w-full flex items-center justify-center gap-1.5 py-3 text-primary text-sm font-medium hover:bg-secondary transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <>
            <EyeOff className="w-4 h-4" />
            <span>答えを隠す</span>
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            <span>答えを見る</span>
          </>
        )}
      </button>

      {/* Answer */}
      {isOpen && (
        <div className="px-5 pb-5">
          <div className="inline-block px-4 py-3 bg-yellow-50 border border-yellow-300 rounded-lg text-base leading-relaxed">
            {answer}
          </div>
        </div>
      )}
    </div>
  )
}
```

#### TagBadge（モックの `.study-card__tag` から）

```typescript
// apps/web/src/components/ui/tag-badge.tsx
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

## Step 3: Mobile用コンポーネント作成（Expo + NativeWind）

**apps/mobile が存在する場合のみ実行**

### 3.1 ディレクトリ構成

```
apps/mobile/src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── PasswordInput.tsx
│   │   ├── RatingButtons.tsx
│   │   ├── TagBadge.tsx
│   │   ├── StudyCard.tsx
│   │   └── EmptyState.tsx
│   └── layout/
│       ├── TabBar.tsx
│       └── Header.tsx
└── lib/
    └── cn.ts
```

### 3.2 主要コンポーネント実装例

#### PasswordInput（Mobile版）

```typescript
// apps/mobile/src/components/ui/PasswordInput.tsx
import { useState } from 'react'
import { View, TextInput, Pressable } from 'react-native'
import { Eye, EyeOff } from 'lucide-react-native'

import { cn } from '@/lib/cn'

interface PasswordInputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  className?: string
}

export function PasswordInput({
  value,
  onChangeText,
  placeholder = 'パスワードを入力',
  className,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <View className={cn('relative', className)}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!isVisible}
        placeholder={placeholder}
        className="w-full px-3 py-3 pr-12 border border-border rounded-lg text-base"
        placeholderTextColor="#94a3b8"
      />
      <Pressable
        className="absolute right-3 top-1/2 -translate-y-1/2"
        onPress={() => setIsVisible(!isVisible)}
      >
        {isVisible ? (
          <EyeOff size={20} color="#64748b" />
        ) : (
          <Eye size={20} color="#64748b" />
        )}
      </Pressable>
    </View>
  )
}
```

#### RatingButtons（Mobile版）

```typescript
// apps/mobile/src/components/ui/RatingButtons.tsx
import { View, Pressable, Text } from 'react-native'

import { cn } from '@/lib/cn'

type Rating = 'ok' | 'learned' | 'again'

interface RatingButtonsProps {
  onRate: (rating: Rating) => void
  intervals?: { ok?: string; again?: string }
}

const config = {
  ok: {
    label: 'OK',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    activeBg: 'bg-emerald-500',
  },
  learned: {
    label: '覚えた',
    preview: '完了',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    activeBg: 'bg-blue-500',
  },
  again: {
    label: 'もう一度',
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    activeBg: 'bg-red-500',
  },
}

export function RatingButtons({ onRate, intervals }: RatingButtonsProps) {
  return (
    <View className="flex-row gap-1.5">
      {(['ok', 'learned', 'again'] as const).map((rating) => (
        <Pressable
          key={rating}
          className={cn(
            'flex-row items-center gap-1 px-3 py-2 rounded-lg',
            config[rating].bg
          )}
          onPress={() => onRate(rating)}
        >
          <Text className={cn('text-sm font-semibold', config[rating].text)}>
            {config[rating].label}
          </Text>
          <Text className={cn('text-xs opacity-80', config[rating].text)}>
            {rating === 'learned'
              ? '完了'
              : intervals?.[rating as 'ok' | 'again']}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}
```

---

## Step 4: 共通コンポーネント一覧

HTMLモックから抽出すべき主要コンポーネント:

### 基本UI
| コンポーネント | モックのクラス | 説明 |
|--------------|--------------|------|
| Button | `.btn`, `.btn--*` | 各種ボタン |
| IconButton | `.btn-icon` | アイコンボタン |
| Input | `.form-input` | テキスト入力 |
| Textarea | `.form-textarea` | テキストエリア |
| PasswordInput | `.password-input-wrapper` | パスワード表示切替付き |
| FormGroup | `.form-group` | ラベル+入力のラッパー |
| FormAlert | `.form-alert` | エラー/警告メッセージ |

### カード系
| コンポーネント | モックのクラス | 説明 |
|--------------|--------------|------|
| StudyCard | `.study-card` | 学習カード |
| SummaryCard | `.summary-card` | サマリーカード |

### ナビゲーション系
| コンポーネント | モックのクラス | 説明 |
|--------------|--------------|------|
| Tabs | `.tabs`, `.tab` | タブナビゲーション |
| Sidebar | `.sidebar` | サイドバー |
| Header | `.header` | ヘッダー |
| BottomNav | `.bottom-nav` | モバイル用ボトムナビ |

### 表示系
| コンポーネント | モックのクラス | 説明 |
|--------------|--------------|------|
| RatingButtons | `.rating-buttons` | 評価ボタン群 |
| TagBadge | `.study-card__tag` | タグバッジ |
| ProgressBar | `.progress-bar` | 進捗バー |
| EmptyState | `.card-list__empty` | 空状態表示 |

---

## Step 5: 動作確認

### 5.1 Storybook（オプション・Web用）

```bash
cd apps/web
npx storybook@latest init
```

### 5.2 コンポーネントカタログページ

`apps/web/src/app/(main)/components/page.tsx` に確認用ページを作成。

---

## 完了条件

- [ ] モックのCSSからデザイントークンを抽出済み
- [ ] Web用共通コンポーネントが作成済み（shadcn/ui + カスタム）
- [ ] Mobile用共通コンポーネントが作成済み（apps/mobile存在時のみ）
- [ ] コンポーネントが正しく表示・動作する
- [ ] TypeScript型定義が適切

---

## 完了後のアクション

```
## 共通UIコンポーネント作成が完了しました

### 作成したコンポーネント
[作成したコンポーネント一覧を列挙]

### Web（Next.js）
- 配置先: apps/web/src/components/ui/
- ベース: shadcn/ui + カスタム拡張

### Mobile（Expo）※存在する場合
- 配置先: apps/mobile/src/components/ui/
- ベース: React Native + NativeWind

内容を確認し、問題なければ「OK」と入力してください。
```

---

## 次のステップ

- `/phase-3-foundation/layout` - 共通レイアウトの実装
- `/phase-4-features/vertical` - 1機能の垂直実装
