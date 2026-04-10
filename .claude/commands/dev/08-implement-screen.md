---
description: 単一画面の実装・調整（Web または Expo）。HTMLモック参照で画面を実装し、既存コンポーネント・Hooksを最大活用する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: [画面名] [web|expo|両方(省略)]
---

# 単一画面実装・調整

指定した画面を HTMLモック参照で実装する。既存コンポーネントと Hooks を最大活用し、新規作成は最小限に抑える。

## 使い方

```bash
# 特定画面を Web のみ実装
/dev:08-implement-screen home web

# 特定画面を Expo のみ実装
/dev:08-implement-screen profile expo

# 両プラットフォームに実装（省略時）
/dev:08-implement-screen settings
```

引数: `$ARGUMENTS` = `{画面名} [web|expo]`

---

## 前提条件

以下が完了済みであること:
- レイアウト構築（`/dev:04-create-layout`）
- 認証機能（`/dev:05-implement-auth`）
- 関連機能の実装（`/dev:07-implement-feature {機能名}`）

---

## 必須読み込みファイル

1. `docs/screens/mock/{version}/{画面名}.html` — 対象画面のUIデザイン
2. `docs/requirements/functions/{機能}/*.md` — 画面仕様・ユースケース
3. 既存の関連コンポーネント / Hooks（Grep で検索して把握する）

---

## Step 1: 画面分析

### 1.1 HTMLモックの読み込みと分析

HTMLモックから以下を抽出:

| 抽出内容 | 確認項目 |
|---------|---------|
| レイアウト構造 | 全体レイアウト・主要セクション |
| データ表示 | 表示するデータ項目 |
| インタラクション | ボタン・フォーム・ナビゲーション |
| 状態バリエーション | ローディング・空状態・エラー状態 |

### 1.2 既存コンポーネントの調査

```bash
# 再利用可能なコンポーネントを検索
# Grep で既存コンポーネントを把握してから実装する
```

確認項目:
- `apps/web/src/components/ui/` — 共通UIコンポーネント
- `apps/web/src/components/{機能}/` — 機能固有コンポーネント
- `apps/web/src/hooks/` — 既存のデータフックス
- `apps/mobile/components/ui/` — Expo共通UIコンポーネント

### 1.3 実装方針の提示

```
## {画面名} 実装計画

### 対象プラットフォーム
- [ ] Web: apps/web/src/app/(main)/{パス}/page.tsx
- [ ] Expo: apps/mobile/app/(tabs)/{パス}.tsx

### 再利用するコンポーネント
- `<ComponentA />` — 用途
- `<ComponentB />` — 用途

### 新規作成が必要なコンポーネント
- `<NewComponent />` — 用途・理由

### データフロー
- Hook: useXxx() — データ取得
- Action: xxxAction() — データ変更

この計画で実装を進めてよいですか？
```

---

## Step 2: Web 実装

### ページコンポーネント

`apps/web/src/app/(main)/{パス}/page.tsx`:

```tsx
// Server Component（デフォルト）
// 初期データをSSRで取得 → TanStack Query の prefetchQuery へ渡す

import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/server'
import { {Screen}Content } from '@/components/{feature}/{Screen}Content'

export default async function {Screen}Page() {
  const queryClient = new QueryClient()
  const supabase = await createClient()

  // SSR でデータを prefetch
  await queryClient.prefetchQuery({
    queryKey: [{feature}Keys.list()],
    queryFn: () => get{Feature}s(supabase),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <{Screen}Content />
    </HydrationBoundary>
  )
}
```

### クライアントコンポーネント（インタラクション部分）

`apps/web/src/components/{feature}/{Screen}Content.tsx`:

```tsx
'use client'

// HTMLモックのデザインに従って実装
// 既存の Hooks・コンポーネントを最大活用

import { use{Feature}s } from '@/hooks/use{Feature}'
import { EmptyState } from '@/components/ui/EmptyState'

export function {Screen}Content() {
  const { data, isLoading, error } = use{Feature}s()

  if (isLoading) {
    return <{Screen}Skeleton />
  }

  if (error) {
    return <div>エラーが発生しました</div>
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="データがありません"
        description="最初のアイテムを追加しましょう"
      />
    )
  }

  return (
    <div>
      {/* HTMLモックに従ったUI */}
    </div>
  )
}
```

---

## Step 3: Expo 実装

`apps/mobile/app/(tabs)/{パス}.tsx`:

```tsx
import { View, FlatList, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { use{Feature}s } from '@/hooks/use{Feature}'
import { EmptyState } from '@/components/ui/EmptyState'

export default function {Screen}Screen() {
  const { data, isLoading, error } = use{Feature}s()

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>読み込み中...</Text>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text className="text-destructive">エラーが発生しました</Text>
      </SafeAreaView>
    )
  }

  if (!data || data.length === 0) {
    return (
      <SafeAreaView className="flex-1">
        <EmptyState
          title="データがありません"
          description="最初のアイテムを追加しましょう"
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1">
      {/* HTMLモックに従ったUI */}
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View>{/* アイテムのUI */}</View>
        )}
      />
    </SafeAreaView>
  )
}
```

---

## Step 4: 状態バリエーションの実装

各画面で必ず実装すること:

| 状態 | Web 実装 | Expo 実装 |
|------|---------|---------|
| ローディング | Skeleton コンポーネント | ActivityIndicator または Skeleton |
| 空状態 | EmptyState コンポーネント | EmptyState コンポーネント |
| エラー状態 | エラーメッセージ + リトライボタン | エラーメッセージ + リトライボタン |
| 正常状態 | メインUI | メインUI |

---

## Step 5: 型チェック・動作確認

```bash
cd apps/web && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit
```

---

## 完了条件

- [ ] HTMLモックのデザインに沿った実装になっている
- [ ] 既存コンポーネントを最大限再利用している
- [ ] ローディング・空状態・エラー状態が実装されている
- [ ] データは既存の Hooks を通して取得している（直接 fetch しない）
- [ ] Server Component / Client Component の境界が適切
- [ ] TypeScript 型エラーがない（`npx tsc --noEmit`）

---

## 次のステップ

- `/dev:06-add-types {次の機能}` + `/dev:07-implement-feature {次の機能}` — 次の機能を実装
- `/dev:09-setup-pwa` — Web PWA対応
