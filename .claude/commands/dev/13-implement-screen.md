---
description: HTMLモックから既存Component/Hooksを使ってUIを実装し、APIとつなぎこむ。引数なしで全画面一括実装。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: [画面名 (省略時: 全画面一括実装)]
---

# HTMLモックからUI実装

指定されたHTMLモックを参考に、既存の共通コンポーネントとHooksを使ってUIを実装し、APIとつなぎこむ。

## 実行方法

**このタスクは ultrathink で実行すること。**

## サブエージェント実行（重要）

**各ファイル作成は、サブエージェント（Task tool）を使用して並列実行すること。**

### 実行パターン

1. **Step 1-2（分析・計画）** - メインエージェントで実行
2. **Step 3-5（コンポーネント・ページ作成）** - サブエージェントで並列実行（画面ごとに並列）
3. **Step 6（確認・レポート）** - メインエージェントで実行

---

## 使用方法

```bash
# 全画面一括実装（引数省略時）
/dev:13-implement-screen

# 特定画面のみ
/dev:13-implement-screen login

# 複数画面を指定
/dev:13-implement-screen main,stats,tags
```

引数: `$ARGUMENTS` = 画面名（省略時: 全画面一括実装、カンマ区切りで複数指定可能）

### 対象画面の決定ロジック

1. **引数あり**: 指定された画面のみ実装
2. **引数なし**: `docs/screens/mock/{version}/*.html` の全ファイルを対象に一括実装

```
# 引数なしの場合、以下を自動検出して全て実装:
docs/screens/mock/v1/
├── login.html      → (auth)/login
├── register.html   → (auth)/register
├── main.html       → (main)/
├── card-input.html → (main)/cards/new
├── tags.html       → (main)/tags
├── stats.html      → (main)/stats
├── settings.html   → (main)/settings
├── profile.html    → (main)/profile
└── ...
```

---

## 前提条件

- HTMLモックが `docs/screens/mock/{version}/` に存在
- 共通コンポーネントが作成済み（`/dev:02-create-common-components`）
- 型定義・Zodスキーマが作成済み（`/dev:03-create-types-and-schemas`）
- Hooksが作成済み（該当機能の `/dev:XX-implement-*`）

---

## 必須読み込みファイル

**以下を必ず読み込んでから作業を開始すること:**

### ドキュメント
1. `docs/screens/flow.md` - 画面遷移図・UI構成
2. `docs/screens/mock/{version}/{screen}.html` - 対象画面のHTMLモック
3. `docs/screens/mock/{version}/css/style.css` - デザイントークン
4. `docs/requirements/functions/_index.md` - 機能一覧（対象機能を特定）
5. `docs/requirements/functions/{category}/F-XXX-*.md` - 対応する機能仕様

### 既存コード
6. `{root}/src/components/ui/` - 既存の共通コンポーネント
7. `{root}/src/components/layout/` - レイアウトコンポーネント
8. `{root}/src/hooks/` - 既存のHooks（API連携用）
9. `{root}/src/types/` - 型定義
10. `{root}/src/validations/` - Zodスキーマ

---

## Step 1: モック・コード分析

### 1.1 出力先の特定

| 項目 | 確認内容 |
|------|---------|
| プロジェクトルート | 通常 `apps/web` |
| ページディレクトリ | `{root}/src/app/(auth)/` または `{root}/src/app/(main)/` |
| コンポーネントディレクトリ | `{root}/src/components/{feature}/` |

### 1.2 HTMLモックの分析

対象モックから以下を抽出:

| 項目 | 確認内容 |
|------|---------|
| 使用CSSクラス | `.btn`, `.form-input`, `.study-card` 等 |
| 画面構成 | ヘッダー、フォーム、リスト、モーダル等 |
| インタラクション | クリック、入力、トグル、遷移等 |
| データ表示箇所 | 動的データが表示される場所 |

### 1.3 既存リソースのマッピング

モックの要素と既存コンポーネント/Hooksを対応付け:

| モック要素 | 既存コンポーネント | 既存Hook |
|-----------|------------------|----------|
| `.btn` | `Button` | - |
| `.form-input` | `Input` | - |
| `.study-card` | `StudyCard` | `useCards` |
| `.rating-buttons` | `RatingButtons` | `useReview` |
| （例） | （例） | （例） |

### 1.4 機能仕様の確認

対応する機能仕様（F-XXX）から以下を確認:

- ユーザーフロー
- バリデーションルール
- エラーケース
- 状態遷移

---

## Step 2: 実装計画の提示

```
## 実装計画

### 対象画面: {画面名}

### 1. ページコンポーネント
- [ ] `{root}/src/app/(main)/{route}/page.tsx`

### 2. 機能コンポーネント
- [ ] `{root}/src/components/{feature}/{component-1}.tsx`
- [ ] `{root}/src/components/{feature}/{component-2}.tsx`

### 3. 使用する既存リソース
- Hooks: `use{Feature}`
- Components: `Button`, `Input`, `Card`, etc.
- Types: `{Type}`, `{Input}`

### 4. API連携
- Server Actions: `{action}` via `use{Feature}`

この計画で実装を進めてよいですか？
「OK」または修正指示をお願いします。
```

---

## Step 3: ページコンポーネント作成

### 3.1 Server Component（デフォルト）

```typescript
// {root}/src/app/(main)/{route}/page.tsx
import { Suspense } from 'react'

import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { FeatureComponent } from '@/components/{feature}/{component}'
import { Skeleton } from '@/components/ui/skeleton'

export default function FeaturePage() {
  return (
    <>
      <PageHeader title="タイトル" />
      <PageContainer>
        <Suspense fallback={<Skeleton className="h-40" />}>
          <FeatureComponent />
        </Suspense>
      </PageContainer>
    </>
  )
}
```

### 3.2 ルーティング構成

| ルートグループ | 用途 |
|--------------|------|
| `(auth)` | 認証画面（login, register等） |
| `(main)` | メイン画面（認証後） |

---

## Step 4: 機能コンポーネント作成

### 4.1 クライアントコンポーネント（インタラクション必要時）

```typescript
// {root}/src/components/{feature}/{component}.tsx
'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useFeature } from '@/hooks/useFeature'

export function FeatureComponent() {
  const { data, isLoading, error } = useFeature()
  const [localState, setLocalState] = useState(false)

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return <ErrorDisplay message="データの取得に失敗しました" />
  }

  return (
    <div className="space-y-4">
      {data?.map((item) => (
        <Card key={item.id}>
          {/* モックのUI構造を再現 */}
        </Card>
      ))}
    </div>
  )
}
```

### 4.2 実装規約

- 既存の `use{Feature}` Hookを使用してデータ取得・変更
- 既存の共通コンポーネント（`Button`, `Input`, `Card`等）を最大限活用
- モックのCSSクラス → Tailwind CSS + shadcn/uiに変換
- `use client` は必要な場合のみ付与（最小範囲で）

---

## Step 5: API連携の実装

### 5.1 データ取得（useQuery経由）

```typescript
// Hookを使用
const { data, isLoading } = useFeature()
```

### 5.2 データ変更（useMutation経由）

```typescript
// Hookを使用
const { mutate: createFeature } = useCreateFeature()

const handleSubmit = (data: CreateFeatureInput) => {
  createFeature(data, {
    onSuccess: () => {
      toast.success('作成しました')
      router.push('/features')
    },
    onError: () => {
      toast.error('作成に失敗しました')
    },
  })
}
```

### 5.3 フォーム連携

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createFeatureSchema } from '@/validations/feature'

const form = useForm<CreateFeatureInput>({
  resolver: zodResolver(createFeatureSchema),
  defaultValues: { field: '' },
})
```

---

## Step 6: 動作確認

### 6.1 確認項目

| 項目 | 確認方法 | 期待結果 |
|------|---------|---------|
| UI表示 | 画面にアクセス | モックと同等のUIが表示 |
| データ取得 | 画面にアクセス | データが表示される |
| フォーム送信 | フォーム入力・送信 | データが保存される |
| バリデーション | 不正値入力 | エラーメッセージ表示 |
| ナビゲーション | リンク・ボタン操作 | 正しく遷移する |
| エラー状態 | APIエラー時 | エラー表示される |
| ローディング | データ取得中 | Skeleton表示 |

### 6.2 Chrome MCPでの動作確認

```
Chrome DevToolsで実際の動作を確認:
1. 画面表示
2. インタラクション（クリック、入力）
3. データの変更・反映
4. エラーケース
```

---

## サブエージェント起動例

```
Task tool を使用して以下を並列実行:

1. Agent A: ページコンポーネント作成
   - 対象: {root}/src/app/(main)/{route}/page.tsx
   - 参照: モック、既存コンポーネント

2. Agent B: リストコンポーネント作成
   - 対象: {root}/src/components/{feature}/{feature}-list.tsx
   - 参照: モック、既存Hook

3. Agent C: フォームコンポーネント作成
   - 対象: {root}/src/components/{feature}/{feature}-form.tsx
   - 参照: モック、Zodスキーマ、既存Hook
```

各サブエージェントには以下を指示:
- 対象ファイルパス
- 参照すべきモック・既存コード
- 使用するHook・コンポーネント
- 実装パターン（本ドキュメントの該当セクション）

---

## 完了条件

- [ ] HTMLモックのUI構造が再現されている
- [ ] 既存の共通コンポーネントを活用している
- [ ] 既存のHooksでAPI連携している
- [ ] フォームバリデーションが動作する
- [ ] ローディング・エラー状態が適切に表示される
- [ ] 画面遷移が正しく動作する
- [ ] TypeScript型エラーがない
- [ ] `use client` が必要最小限

---

## 完了報告フォーマット

```
## {画面名} UI実装完了

### 作成したファイル

| ファイル | 種別 | 説明 |
|---------|------|------|
| `src/app/(main)/{route}/page.tsx` | Page | ページコンポーネント |
| `src/components/{feature}/{name}.tsx` | Component | 機能コンポーネント |

### 使用した既存リソース

| 種別 | リソース |
|------|---------|
| Hooks | `useFeature`, `useCreateFeature` |
| Components | `Button`, `Input`, `Card`, `Skeleton` |
| Types | `Feature`, `CreateFeatureInput` |
| Schemas | `createFeatureSchema` |

### 動作確認結果

| 項目 | 状態 |
|------|------|
| UI表示 | [Success/Failed] |
| データ取得 | [Success/Failed] |
| データ変更 | [Success/Failed] |
| バリデーション | [Success/Failed] |
| ナビゲーション | [Success/Failed] |

### 対応した機能仕様
- F-XXX: {機能名}

### 次のステップ
- 他画面の実装
- E2Eテスト追加
```

---

## 画面別ガイド（参考）

### 認証系画面

| 画面 | モック | ルート | 主要コンポーネント |
|------|-------|-------|------------------|
| login | `login.html` | `(auth)/login` | LoginForm |
| register | `register.html` | `(auth)/register` | RegisterForm |
| password-reset | `password-reset.html` | `(auth)/reset-password` | ResetPasswordForm |

### メイン画面

| 画面 | モック | ルート | 主要コンポーネント |
|------|-------|-------|------------------|
| main | `main.html` | `(main)/` | QuickInput, Tabs, CardList |
| card-input | `card-input.html` | `(main)/cards/new` | CardInputForm |
| tags | `tags.html` | `(main)/tags` | TagList, TagForm |
| stats | `stats.html` | `(main)/stats` | StatsSummary, StatsChart |
| settings | `settings.html` | `(main)/settings` | SettingsForm |
| profile | `profile.html` | `(main)/profile` | ProfileCard |

---

## 次のステップ

- `/dev:14-xxx` - 次の開発タスク
- `/phase-5-release/integration` - 結合テスト
