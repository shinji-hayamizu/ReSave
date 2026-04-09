---
description: HTMLモックから共通UIコンポーネントを抽出・作成（Web/Expo両対応・汎用）
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
---

# 共通UIコンポーネント作成

HTMLモックを分析し、再利用可能な共通UIコンポーネントを作成する。
**Web（Next.js）・Expo（React Native）どちらにも対応した汎用コマンド。**

## 実行方法

**このタスクは ultrathink で実行すること。**

## 使用方法

```bash
# 基本（v1モックから作成）
/dev:02-create-common-components

# モックバージョン指定
/dev:02-create-common-components v2
```

引数: `$ARGUMENTS` = モックバージョン（省略時: v1）

---

## 事前確認（必須）

作業開始前に以下を確認し、プロジェクト構成を把握すること:

```bash
# アプリ構成の確認
ls apps/

# Web アプリの特定（Next.js）
ls apps/*/next.config.* 2>/dev/null || ls apps/*/next.config.js 2>/dev/null

# Expo アプリの特定
ls apps/*/app.json 2>/dev/null | xargs -I{} grep -l "expo" {} 2>/dev/null

# Web UIライブラリ確認
ls apps/*/components.json 2>/dev/null  # shadcn/ui
cat apps/*/package.json | grep -E '"(nativewind|tailwindcss)"'
```

確認した結果から:
- **`{web_app}`** = Webアプリのディレクトリ名（例: `web`, `admin`）
- **`{mobile_app}`** = Expoアプリのディレクトリ名（例: `mobile`）
- **`{web_components_dir}`** = Webコンポーネント出力先（例: `apps/web/src/components/ui`）
- **`{mobile_components_dir}`** = Mobileコンポーネント出力先（例: `apps/mobile/components/ui`）
- **`{web_utils}`** = Webのcnユーティリティパス（例: `@/lib/utils`）
- **`{mobile_utils}`** = MobileのCNユーティリティパス（例: `@/lib/cn`）

---

## サブエージェント実行（重要）

**各コンポーネントファイルの作成は、サブエージェント（Task tool）を使用して並列実行すること。**

### 実行パターン

1. **Step 0（事前確認）** - メインエージェントで実行
2. **Step 1（モック分析）** - メインエージェントで実行
3. **Step 2-3（コンポーネント作成）** - サブエージェントで並列実行
4. **Step 4-5（統合・エクスポート）** - メインエージェントで実行

### サブエージェント起動例（モック分析結果に応じて調整）

```
Task tool を使用して以下を並列実行:
# Web（Next.js）アプリが存在する場合
- ComponentA 作成（Web: {web_components_dir}）
- ComponentB 作成（Web: {web_components_dir}）
- ComponentC 作成（Web: {web_components_dir}）

# Expo アプリが存在する場合
- ComponentA 作成（Expo: {mobile_components_dir}）
- ComponentB 作成（Expo: {mobile_components_dir}）
- ComponentC 作成（Expo: {mobile_components_dir}）
```

各サブエージェントには以下を指示:
- 対象コンポーネント名
- 参照すべきモックのCSSクラス
- 実装パターン（本ドキュメントの該当セクション）
- 出力先パス（`{web_components_dir}` または `{mobile_components_dir}`）

---

## 必須読み込みファイル

**以下を必ず読み込んでから作業を開始すること:**

1. `docs/screens/mock/{version}/css/style.css` - デザイントークン・共通スタイル
2. `docs/screens/mock/{version}/*.html` - 各画面のHTMLモック（最低3-5ファイル）
3. `apps/{web_app}/tailwind.config.ts` or `tailwind.config.js` - Tailwind設定
4. `apps/{web_app}/src/app/globals.css` or `global.css` - グローバルスタイル

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

HTMLの `data-component` 属性とCSSクラスから抽出（**プロジェクト固有のコンポーネント名はモックから読み取る**）:

**基本UI（汎用）:**
- `.btn`, `.btn--*` → Button variants
- `.btn-icon` → IconButton
- `.form-input`, `.form-textarea` → Input, Textarea
- `.form-group`, `.form-label` → FormField
- `.form-alert` → Alert / FormAlert
- `.password-field` → PasswordInput
- `.progress-bar` → ProgressBar
- `.empty-state`, `.card-list__empty` → EmptyState

**カード系（プロジェクト依存）:**
- `data-component="card"` → モック上のクラス名からコンポーネント名を決定
- `.summary-card`, `.info-card` など → SummaryCard など

**ナビゲーション:**
- `.tabs`, `.tab` → Tabs
- `.sidebar` → Sidebar
- `.header` → Header
- `.bottom-nav`, `.tab-bar` → BottomNav / TabBar

**表示系（プロジェクト依存）:**
- `.rating-buttons`, `.rating-btn` → RatingButtons（ReSave固有）
- `.tag`, `.badge` → TagBadge

---

## Step 2: Web（Next.js）用コンポーネント作成

**`apps/{web_app}` が存在する場合に実行**

### 2.1 ディレクトリ構成

```
apps/{web_app}/src/components/     # or apps/{web_app}/components/
├── ui/                            # shadcn/ui + カスタムコンポーネント
│   ├── button.tsx                 # shadcn/ui 標準（既存の場合はスキップ）
│   ├── input.tsx                  # shadcn/ui 標準（既存の場合はスキップ）
│   ├── password-input.tsx         # カスタム: パスワード表示切替
│   ├── tabs.tsx                   # shadcn/ui 標準 or カスタム
│   ├── {component}.tsx            # モックから抽出した各コンポーネント
│   ├── progress-bar.tsx           # カスタム: 進捗バー
│   ├── empty-state.tsx            # カスタム: 空状態
│   └── form-alert.tsx             # カスタム: フォームアラート
└── layout/
    ├── sidebar.tsx                # デスクトップサイドバー（モック存在時）
    ├── header.tsx                 # ヘッダー（モック存在時）
    └── bottom-nav.tsx             # モバイルボトムナビ（モック存在時）
```

### 2.2 Web実装規約

```typescript
// 命名: PascalCase
// ファイル: kebab-case.tsx
// export: named export のみ（default export 禁止）

// 必須インポート
import { cn } from '{web_utils}'   // 例: '@/lib/utils'

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

**Web実装の注意点:**
- shadcn/ui が設定済みなら既存コンポーネントを優先活用
- インタラクション（`useState`, `useEffect`, `onClick`）を持つコンポーネントには `'use client'` を付与
- アイコンは `lucide-react` を使用（プロジェクトに導入済みの場合）
- `hover:` クラスでホバースタイルを表現

### 2.3 主要コンポーネント実装パターン（Web）

#### PasswordInput
```typescript
'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '{web_utils}'

interface PasswordInputProps extends React.ComponentProps<typeof Input> {
  showToggle?: boolean
  showLabel?: string   // デフォルト: 'Show password'
  hideLabel?: string   // デフォルト: 'Hide password'
}

export function PasswordInput({ className, showToggle = true, showLabel = 'Show password', hideLabel = 'Hide password', ...props }: PasswordInputProps) {
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
            {isVisible ? hideLabel : showLabel}
          </span>
        </Button>
      )}
    </div>
  )
}
```

#### TagBadge
```typescript
import { cn } from '{web_utils}'

interface TagBadgeProps {
  children: React.ReactNode
  className?: string
}

export function TagBadge({ children, className }: TagBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1',
        // デフォルトカラーはモックのデザイントークンに合わせて変更すること
        'bg-primary/10 text-primary border border-primary/20',
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

## Step 3: Expo（React Native）用コンポーネント作成

**`apps/{mobile_app}` が存在する場合に実行**

### 3.1 ディレクトリ構成

```
apps/{mobile_app}/components/
├── ui/
│   ├── Button.tsx         # Pressable + variantStyles（複数バリアント・サイズ）
│   ├── Input.tsx          # TextInput + label/error表示
│   ├── PasswordInput.tsx  # Input拡張 + 表示切替（useState）
│   ├── {Component}.tsx    # モックから抽出した各コンポーネント
│   ├── ProgressBar.tsx    # View with width style
│   ├── EmptyState.tsx     # View + Text + optional action
│   ├── FormAlert.tsx      # variant対応アラート
│   └── index.ts           # named export集約
└── layout/
    ├── TabBar.tsx          # ボトムタブバー（モック存在時）
    └── Header.tsx          # ヘッダー（モック存在時）
```

### 3.2 Expo実装規約

```typescript
// React Native + NativeWind
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native'
import { cn } from '{mobile_utils}'  // 例: '@/lib/cn'

// 命名: PascalCase（ファイル名もPascalCase）
// export: named export のみ（default export 禁止）

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

**Expo実装の注意点:**
- `div` → `View`、`span`/`p` → `Text`、`button` → `Pressable`、`input` → `TextInput`
- アイコンは絵文字テキストで代替（SVGはNativeWindの `className` 非対応のため）
- パスエイリアス: `@/*` → `./*`（tsconfig.json を事前確認）
- Web の `hover:` クラスは Expo では `active:` クラスに置き換える
- `style` プロパティではなく `className` でNativeWindスタイリングする
- ファイル名は **PascalCase**（WebのKebab-caseと異なる）

### 3.3 主要コンポーネント実装パターン（Expo）

#### Button
```typescript
import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native'
import { cn } from '{mobile_utils}'

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

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  default: { container: 'h-11 px-5 py-2.5', text: 'text-base' },
  sm:      { container: 'h-9 px-3 py-2',    text: 'text-sm' },
  lg:      { container: 'h-12 px-8 py-3',   text: 'text-lg' },
  icon:    { container: 'h-11 w-11 p-0',    text: '' },
}

export function Button({ children, variant = 'default', size = 'default', loading = false, disabled, className, textClassName, ...props }: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <Pressable
      className={cn(
        'flex-row items-center justify-center rounded-lg',
        variantStyles[variant].container,
        sizeStyles[size].container,
        isDisabled && 'opacity-50',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'default' || variant === 'destructive' ? '#ffffff' : '#374151'}
        />
      ) : typeof children === 'string' ? (
        <Text className={cn('font-medium text-center', variantStyles[variant].text, sizeStyles[size].text, textClassName)}>
          {children}
        </Text>
      ) : children}
    </Pressable>
  )
}

export type { ButtonProps, ButtonVariant, ButtonSize }
```

#### Input
```typescript
import { View, Text, TextInput, type TextInputProps } from 'react-native'
import { cn } from '{mobile_utils}'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  className?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
      )}
      <TextInput
        className={cn(
          'h-11 px-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-base',
          error && 'border-red-500',
          className
        )}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && (
        <Text className="text-sm text-red-500">{error}</Text>
      )}
    </View>
  )
}

export type { InputProps }
```

#### TagBadge
```typescript
import { Text } from 'react-native'
import { cn } from '{mobile_utils}'

interface TagBadgeProps {
  children: React.ReactNode
  className?: string
}

export function TagBadge({ children, className }: TagBadgeProps) {
  return (
    <Text className={cn(
      // デフォルトカラーはプロジェクトのデザイントークンに合わせて変更すること
      'px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full',
      className
    )}>
      {children}
    </Text>
  )
}

export type { TagBadgeProps }
```

#### EmptyState
```typescript
import { View, Text, Pressable } from 'react-native'
import { cn } from '{mobile_utils}'

interface EmptyStateProps {
  title: string
  description?: string
  action?: {
    label: string
    onPress: () => void
  }
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <View className={cn('flex-1 items-center justify-center px-6 py-12', className)}>
      <Text className="text-4xl mb-4">📭</Text>
      <Text className="text-lg font-semibold text-gray-900 text-center mb-2">{title}</Text>
      {description && (
        <Text className="text-sm text-gray-500 text-center mb-6">{description}</Text>
      )}
      {action && (
        <Pressable
          className="bg-blue-600 px-6 py-2.5 rounded-lg active:bg-blue-700"
          onPress={action.onPress}
        >
          <Text className="text-white font-medium">{action.label}</Text>
        </Pressable>
      )}
    </View>
  )
}

export type { EmptyStateProps }
```

---

## Step 4: デザイントークン統合

**WebアプリのCSSにデザイントークンを反映する**

### 4.1 globals.css 更新（`apps/{web_app}/src/app/globals.css`）

```css
@layer base {
  :root {
    /* モックから抽出したカラー（HSL形式に変換） */
    --color-primary: 217.2 91.2% 59.8%;
    --color-primary-hover: 221.2 83.2% 53.3%;
    --color-success: 160.1 84.1% 39.4%;
    --color-warning: 37.7 92.1% 50.2%;
    --color-danger: 0 84.2% 60.2%;

    /* 背景 */
    --bg-primary: 0 0% 100%;
    --bg-secondary: 210 40% 98%;

    /* テキスト */
    --text-primary: 222.2 84% 4.9%;
    --text-secondary: 215.4 16.3% 46.9%;
    --text-muted: 215.4 16.3% 63.9%;

    /* スペーシング（モックの値に合わせる） */
    --sidebar-width-collapsed: 72px;
    --sidebar-width-expanded: 260px;
    --header-height: 64px;
    --bottom-nav-height: 64px;
  }
}
```

### 4.2 tailwind.config.ts 更新（`apps/{web_app}/tailwind.config.ts`）

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

### 5.1 Web: index.ts でまとめてエクスポート

```typescript
// apps/{web_app}/src/components/ui/index.ts
export { Button } from './button'
export { Input } from './input'
export { PasswordInput } from './password-input'
export { TagBadge } from './tag-badge'
export { ProgressBar } from './progress-bar'
export { EmptyState } from './empty-state'
export { FormAlert } from './form-alert'
// モックから抽出した追加コンポーネントを列挙
```

### 5.2 Expo: index.ts でまとめてエクスポート（型exportも含める）

```typescript
// apps/{mobile_app}/components/ui/index.ts
export { Button } from './Button'
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button'

export { Input } from './Input'
export type { InputProps } from './Input'

export { PasswordInput } from './PasswordInput'
export type { PasswordInputProps } from './PasswordInput'

export { TagBadge } from './TagBadge'
export type { TagBadgeProps } from './TagBadge'

export { ProgressBar } from './ProgressBar'
export type { ProgressBarProps } from './ProgressBar'

export { EmptyState } from './EmptyState'
export type { EmptyStateProps } from './EmptyState'

export { FormAlert } from './FormAlert'
export type { FormAlertProps } from './FormAlert'

// モックから抽出した追加コンポーネントを列挙
```

---

## 完了条件

**Web（`apps/{web_app}` 存在時）:**
- [ ] モックのCSSからデザイントークンを抽出し、globals.css / tailwind.config.ts に反映
- [ ] モックから抽出した共通コンポーネントをすべて作成
- [ ] TypeScript型定義が適切
- [ ] `'use client'` が必要なコンポーネントにのみ付与
- [ ] `apps/{web_app}/src/components/ui/index.ts` でエクスポート設定完了

**Expo（`apps/{mobile_app}` 存在時）:**
- [ ] モックから抽出したコンポーネントをすべて作成
- [ ] `Pressable` / `TextInput` / `View` / `Text` を適切に使用（DOM要素を使わない）
- [ ] NativeWindの `className` でスタイリング（`style` プロパティ直書き禁止）
- [ ] Web の `hover:` → Expo では `active:` に置き換え済み
- [ ] ファイル名がPascalCase
- [ ] `apps/{mobile_app}/components/ui/index.ts` でexport type込みのエクスポート設定完了

---

## 完了報告フォーマット

```
## 共通UIコンポーネント作成完了

### プロジェクト構成
- Web: apps/{web_app}/
- Expo: apps/{mobile_app}/（存在する場合）

### 作成したコンポーネント

| コンポーネント | Web | Expo | 説明 |
|--------------|-----|------|------|
| Button       |  o  |  o   | 複数バリアント・サイズ |
| Input        |  o  |  o   | テキスト入力 |
| PasswordInput|  o  |  o   | パスワード表示切替 |
| TagBadge     |  o  |  o   | タグバッジ |
| ProgressBar  |  o  |  o   | 進捗バー |
| EmptyState   |  o  |  o   | 空状態表示 |
| FormAlert    |  o  |  o   | フォームアラート |
| {その他}     |  o  |  o   | モックから抽出 |

### 更新したファイル
- apps/{web_app}/src/app/globals.css
- apps/{web_app}/tailwind.config.ts
- apps/{web_app}/src/components/ui/index.ts
- apps/{mobile_app}/components/ui/index.ts（Expo存在時）

### 次のステップ
- `/dev:05-create-layout` - 共通レイアウト実装
- `/dev:07-implement-feature` - 機能実装
```
