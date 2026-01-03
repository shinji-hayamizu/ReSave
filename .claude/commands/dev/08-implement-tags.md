---
description: タグ管理機能実装。タグの一覧・作成・編集・削除機能を構築する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: [出力先ディレクトリ (例: apps/web)]
---

# タグ管理機能実装

タグの一覧表示・作成・編集・削除、およびカードへのタグ付け機能を実装する。

## 前提

以下が完了済みであること:
- カードCRUD機能（`/dev:07-implement-cards`）

**アーキテクチャファイルの場所（優先順）:**
1. `.kiro/specs/*/design.md` (Kiroスペック)
2. `docs/requirements/architecture.md` (標準)

**機能仕様の場所:**
- `docs/requirements/functions/tag/F-017-tag-management.md`
- `docs/requirements/functions/tag/F-018-tag-filter.md`
- `docs/requirements/functions/card/F-016-card-tagging.md`

---

## 参照ドキュメント（必須読み込み）

以下のドキュメントを読み込み、タグ機能要件を特定すること:

1. **機能仕様（tag/）** - タグCRUD、フィルタ機能
2. **機能仕様（card/F-016）** - カードへのタグ付け

---

## あなたの役割

フルスタックエンジニアとして、タグ管理機能を実装する。
タグはカードの分類に使用され、フィルタリングの基準となる重要な機能。

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
| タグページ | `{root}/src/app/(main)/tags/` |
| タグコンポーネント | `{root}/src/components/tag/` |
| Server Actions | `{root}/src/actions/tag.ts` |
| フック | `{root}/src/hooks/useTags.ts` |

### 1.2 タグ要件の確認

機能仕様から以下を確認:
- 入力項目（タグ名1-30文字、色Hex形式）
- ビジネスルール（同名タグ禁止、削除時カード維持）
- 8色カラーパレット

---

## Step 2: 型定義とZodスキーマ

### 2.1 タグ型定義

#### {root}/src/types/tag.ts

- Tag型（id, user_id, name, color, created_at, updated_at）
- TagWithCount型（card_count含む）
- CreateTagInput型
- UpdateTagInput型

### 2.2 Zodスキーマ

#### {root}/src/validations/tag.ts

- createTagSchema: name必須（1-30文字）、color任意（Hex形式）
- updateTagSchema: 部分更新スキーマ

---

## Step 3: Server Actions

### 3.1 タグアクション

#### {root}/src/actions/tag.ts

以下のServer Actionsを実装:
- `createTag(input: CreateTagInput)` - タグ作成（重複チェック）
- `updateTag(id: string, input: UpdateTagInput)` - タグ更新
- `deleteTag(id: string)` - タグ削除（紐付けのみ削除、カード維持）
- `getTags()` - タグ一覧取得（カード数付き）
- `getTag(id: string)` - タグ詳細取得

---

## Step 4: TanStack Queryフック

### 4.1 useTags

#### {root}/src/hooks/useTags.ts

- `useTags()` - タグ一覧取得
- `useCreateTag()` - 作成mutation
- `useUpdateTag()` - 更新mutation
- `useDeleteTag()` - 削除mutation

クエリキー設計:
```typescript
export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  detail: (id: string) => [...tagKeys.all, 'detail', id] as const,
}
```

---

## Step 5: タグ管理画面

### 5.1 タグ一覧ページ

#### {root}/src/app/(main)/tags/page.tsx

タグ管理画面:
- ページヘッダー（タイトル + タグ追加ボタン）
- タグ一覧（TagList）
- 空状態メッセージ

### 5.2 TagList

#### {root}/src/components/tag/tag-list.tsx

タグ一覧表示。

### 5.3 TagItem

#### {root}/src/components/tag/tag-item.tsx

個別タグ行:
- カラーチップ
- タグ名
- カード数（例: 15枚のカード）
- 編集ボタン
- 削除ボタン

---

## Step 6: タグ作成/編集モーダル

### 6.1 TagFormModal

#### {root}/src/components/tag/tag-form-modal.tsx

モーダルダイアログ:
- タグ名入力（30文字制限、カウンター付き）
- 8色カラーパレット選択
- キャンセル/保存ボタン

カラーバリエーション:
- blue, green, purple, orange, pink, cyan, yellow, gray

### 6.2 ColorPicker

#### {root}/src/components/tag/color-picker.tsx

8色パレットから選択するコンポーネント。

---

## Step 7: タグ削除確認モーダル

### 7.1 DeleteTagModal

#### {root}/src/components/tag/delete-tag-modal.tsx

削除確認ダイアログ:
- タグ名と紐付けカード数を表示
- 注意書き（カードは削除されない旨）
- キャンセル/削除ボタン

---

## Step 8: TagSelector（カード入力用）

### 8.1 TagSelector

#### {root}/src/components/tag/tag-selector.tsx

カード入力画面で使用するタグ選択コンポーネント:
- 既存タグから選択
- 複数選択可能
- 新規タグ作成リンク

---

## Step 9: タグフィルタ

### 9.1 TagFilter

#### {root}/src/components/tag/tag-filter.tsx

カード一覧画面でのタグフィルタ:
- タグ選択（複数可）
- 選択中タグの表示
- クリアボタン

---

## 完了条件

- [ ] タグ型定義とZodスキーマが作成されている
- [ ] Server Actions（CRUD）が作成されている
- [ ] TanStack Queryフックが作成されている
- [ ] タグ一覧画面が動作する
- [ ] タグ作成モーダルが動作する
- [ ] タグ編集モーダルが動作する
- [ ] タグ削除が動作する（確認付き）
- [ ] TagSelector（カード入力用）が動作する
- [ ] TagFilter（カード一覧用）が動作する
- [ ] 同名タグの重複チェックが動作する

---

## 完了後のアクション

```
## タグ管理機能実装が完了しました

### 作成されたファイル
- {root}/src/types/tag.ts
- {root}/src/validations/tag.ts
- {root}/src/actions/tag.ts
- {root}/src/hooks/useTags.ts
- {root}/src/app/(main)/tags/page.tsx
- {root}/src/components/tag/tag-list.tsx
- {root}/src/components/tag/tag-item.tsx
- {root}/src/components/tag/tag-form-modal.tsx
- {root}/src/components/tag/color-picker.tsx
- {root}/src/components/tag/delete-tag-modal.tsx
- {root}/src/components/tag/tag-selector.tsx
- {root}/src/components/tag/tag-filter.tsx

### 動作確認結果
| 項目 | 状態 |
|------|------|
| タグ一覧表示 | [Success/Failed] |
| タグ作成 | [Success/Failed] |
| タグ編集 | [Success/Failed] |
| タグ削除 | [Success/Failed] |
| カードへのタグ付け | [Success/Failed] |
| タグフィルタ | [Success/Failed] |

### 次のステップ
- 学習・レビュー機能実装（`/dev:09-implement-study`）
```

---

## 次のステップ
- `/dev:09-implement-study` - 学習・レビュー機能実装
