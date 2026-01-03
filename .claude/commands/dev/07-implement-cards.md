---
description: カードCRUD（一覧/作成/編集/削除）実装。カード管理の基本機能を構築する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: [出力先ディレクトリ (例: apps/web)]
---

# カードCRUD機能実装

カードの一覧表示・作成（クイック/詳細）・編集・削除機能を実装する。

## 前提

以下が完了済みであること:
- 認証機能（`/dev:06-implement-auth`）
- 型定義とZodスキーマ（`/dev:03-create-types-and-schemas`）

**アーキテクチャファイルの場所（優先順）:**
1. `.kiro/specs/*/design.md` (Kiroスペック)
2. `docs/requirements/architecture.md` (標準)

**機能仕様の場所:**
- `docs/requirements/functions/card/F-013-card-create.md`
- `docs/requirements/functions/card/F-014-card-edit.md`
- `docs/requirements/functions/card/F-015-card-delete.md`
- `docs/requirements/functions/card/F-016-card-tagging.md`

---

## 参照ドキュメント（必須読み込み）

以下のドキュメントを読み込み、カード機能要件を特定すること:

1. **機能仕様（card/）** - ユーザーフロー、バリデーション、エラーケース
2. **アーキテクチャドキュメント** - データモデル、API設計

---

## あなたの役割

フルスタックエンジニアとして、カード管理機能を実装する。
UXに配慮したクイック入力と詳細入力の2パターンを提供し、学習履歴を維持したCRUD操作を実現する。

## 実行方法

- このタスクは **ultrathink** で実行すること
- **各コンポーネント作成はsubAgentで並列実行**すること

---

## Step 1: プロジェクト構造の確認

### 1.1 出力先の特定

引数 `$ARGUMENTS` からプロジェクトルートを特定。

| 項目 | 確認内容 |
|------|---------|
| プロジェクトルート | $ARGUMENTS (例: `apps/web`) |
| カードページ | `{root}/src/app/(main)/cards/` |
| カードコンポーネント | `{root}/src/components/card/` |
| Server Actions | `{root}/src/actions/card.ts` |
| フック | `{root}/src/hooks/useCards.ts` |

### 1.2 カード要件の確認

機能仕様から以下を確認:
- 入力項目（テキスト、隠しテキスト、タグ、ソースURL、リピート設定）
- バリデーションルール（文字数制限）
- エラーメッセージ

---

## Step 2: 型定義とZodスキーマ

### 2.1 カード型定義

#### {root}/src/types/card.ts

機能仕様F-013のデータモデルに基づき定義:
- Card型（id, user_id, text, hidden_text, source_url, state, interval_index, repeat_intervals, next_review_date, last_review_date, review_count, created_at, updated_at）
- CardState型（'new' | 'learning' | 'completed'）
- CreateCardInput型
- UpdateCardInput型

### 2.2 Zodスキーマ

#### {root}/src/validations/card.ts

- createCardSchema: テキスト必須（1-500文字）、隠しテキスト任意（最大2000文字）、ソースURL任意（URL形式）
- updateCardSchema: 部分更新スキーマ
- cardQuerySchema: フィルタ・ページネーション

---

## Step 3: Server Actions

### 3.1 カードアクション

#### {root}/src/actions/card.ts

以下のServer Actionsを実装:
- `createCard(input: CreateCardInput)` - カード作成、初期パラメータ設定
- `updateCard(id: string, input: UpdateCardInput)` - カード更新（復習パラメータ維持）
- `deleteCard(id: string)` - カード削除
- `getCards(filters?: CardFilters)` - カード一覧取得
- `getCard(id: string)` - カード詳細取得

---

## Step 4: TanStack Queryフック

### 4.1 useCards

#### {root}/src/hooks/useCards.ts

- `useCards(filters)` - カード一覧取得
- `useCard(id)` - 単体取得
- `useCreateCard()` - 作成mutation
- `useUpdateCard()` - 更新mutation（楽観的更新）
- `useDeleteCard()` - 削除mutation

クエリキー設計:
```typescript
export const cardKeys = {
  all: ['cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  list: (filters: CardFilters) => [...cardKeys.lists(), filters] as const,
  detail: (id: string) => [...cardKeys.all, 'detail', id] as const,
}
```

---

## Step 5: クイック入力コンポーネント

### 5.1 QuickInputForm

#### {root}/src/components/card/quick-input-form.tsx

ホーム画面上部のインライン入力フォーム:
- テキスト入力（placeholder: 覚えたいこと）
- 隠しテキスト入力（placeholder: 答え（任意））
- 保存ボタン（+アイコン）
- 詳細入力ボタン（編集アイコン）

---

## Step 6: カード入力画面（詳細）

### 6.1 カード入力ページ

#### {root}/src/app/(main)/cards/new/page.tsx

詳細入力専用画面。

### 6.2 CardInputForm

#### {root}/src/components/card/card-input-form.tsx

- テキストエリア（必須、500文字制限、カウンター付き）
- 隠しテキストエリア（任意、2000文字制限）
- タグセレクター（TagSelector）
- ソースURL入力
- リピート設定選択（間隔反復/毎日/毎週/なし）
- 保存ボタン

---

## Step 7: カード編集画面

### 7.1 カード編集ページ

#### {root}/src/app/(main)/cards/[id]/edit/page.tsx

既存カードの編集画面（CardInputFormを再利用）。
- 現在値をプリセット
- 復習パラメータは維持

---

## Step 8: カード一覧・表示コンポーネント

### 8.1 CardList

#### {root}/src/components/card/card-list.tsx

カード一覧表示コンポーネント。

### 8.2 CardItem

#### {root}/src/components/card/card-item.tsx

個別カード表示:
- 質問（テキスト）表示
- 答えトグル表示
- 編集リンク
- タグ表示

---

## Step 9: カード削除機能

### 9.1 削除確認モーダル

削除ボタンタップ時に確認ダイアログを表示。

---

## 完了条件

- [ ] カード型定義とZodスキーマが作成されている
- [ ] Server Actions（CRUD）が作成されている
- [ ] TanStack Queryフックが作成されている
- [ ] クイック入力フォームが動作する
- [ ] 詳細入力画面が動作する
- [ ] カード編集画面が動作する
- [ ] カード削除が動作する
- [ ] フォームバリデーションが動作する
- [ ] 文字数カウンターが表示される

---

## 完了後のアクション

```
## カードCRUD機能実装が完了しました

### 作成されたファイル
- {root}/src/types/card.ts
- {root}/src/validations/card.ts
- {root}/src/actions/card.ts
- {root}/src/hooks/useCards.ts
- {root}/src/components/card/quick-input-form.tsx
- {root}/src/components/card/card-input-form.tsx
- {root}/src/components/card/card-list.tsx
- {root}/src/components/card/card-item.tsx
- {root}/src/app/(main)/cards/new/page.tsx
- {root}/src/app/(main)/cards/[id]/edit/page.tsx

### 動作確認結果
| 項目 | 状態 |
|------|------|
| クイック入力 | [Success/Failed] |
| 詳細入力 | [Success/Failed] |
| カード編集 | [Success/Failed] |
| カード削除 | [Success/Failed] |

### 次のステップ
- タグ管理機能実装（`/dev:08-implement-tags`）
```

---

## 次のステップ
- `/dev:08-implement-tags` - タグ管理機能実装
