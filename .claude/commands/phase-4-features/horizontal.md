---
description: 垂直実装をパターンとして他機能を横展開
argument-hint: [機能名リスト（カンマ区切り）。例: タグ管理, カード編集, 学習セッション]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
---

$ARGUMENTS

---

上記の機能を、既存の垂直実装をパターンとして横展開してください。

## 目的
垂直実装で作成したパターンを参照し、複数の機能を効率的に実装する。

## 前提
以下が完了済みであること:
- 1機能の垂直実装（`/phase-4-features/vertical`）
- DB設計・API設計（`/phase-1-design/db-api`）

---

## 参照ドキュメント（必須読み込み）
- `docs/requirements/functions/_index.md`（機能一覧）
- `docs/requirements/functions/[category]/F-XXX-[function].md`（各機能の仕様）
- 既存の垂直実装コード（パターンとして参照）

## あなたの役割
フルスタックエンジニア。
パターンに従って効率的に実装を行う。

## 実行方法
- このタスクは **ultrathink** で実行すること
- 各機能は **subAgent** で並列実装可能

---

## Step 1: 実装対象の確認

指定された機能の仕様を確認:

| No | 機能ID | 機能名 | カテゴリ | 関連テーブル | 優先度 |
|----|--------|-------|---------|------------|-------|
| 1 | F-XXX | ... | ... | ... | P0 |
| 2 | F-YYY | ... | ... | ... | P0 |
| 3 | F-ZZZ | ... | ... | ... | P0 |

---

## Step 2: 実装計画の提示

```
## 横展開実装計画

### 参照パターン
既存の [機能名] 実装を参照パターンとして使用します。

### 実装順序
依存関係を考慮した実装順序:

1. **[機能1]** - [理由：他機能が依存 / 基盤機能 など]
2. **[機能2]** - [理由]
3. **[機能3]** - [理由]

### 各機能の実装範囲
| 機能 | DB | バリデーション | Actions | Hooks | UI | テスト |
|-----|---|--------------|---------|-------|---|------|
| [機能1] | 追加 | 新規 | 新規 | 新規 | 新規 | 新規 |
| [機能2] | - | 更新 | 追加 | 追加 | 新規 | 追加 |
| [機能3] | - | - | 追加 | 追加 | 新規 | 追加 |

### 並列実行可能な作業
- [機能1] と [機能2] は並列実装可能
- [機能3] は [機能1] 完了後に実装

この計画で実装を進めてよいですか？
「OK」または修正指示をお願いします。
```

---

## Step 3: subAgentによる並列実装

### 3.1 subAgent 起動

各機能をsubAgentで並列実装:

```
subAgent 1: [機能1] の実装
subAgent 2: [機能2] の実装
```

### 3.2 各subAgentの実装内容

各subAgentは以下の手順で実装:

1. **機能仕様の確認**
   - `docs/requirements/functions/[category]/F-XXX-[function].md` を読み込み

2. **DB層**
   - マイグレーション追加（必要な場合）
   - RLSポリシー確認

3. **バリデーション層**
   - Zodスキーマ作成・更新

4. **API層**
   - Server Actions 作成

5. **データ取得層**
   - TanStack Query フック作成

6. **UI層**
   - ページコンポーネント
   - 部品コンポーネント

7. **テスト**
   - ユニットテスト

---

## Step 4: 実装テンプレート

### 4.1 参照パターンの確認

既存の垂直実装から以下を参照:

```
src/
├── validations/[resource].ts      # Zodスキーマのパターン
├── actions/[resource].ts          # Server Actionsのパターン
├── hooks/use[Resources].ts        # TanStack Queryのパターン
├── app/(main)/[resources]/
│   ├── page.tsx                   # 一覧ページのパターン
│   └── new/page.tsx               # 作成ページのパターン
└── components/[resources]/
    ├── [resource]-list.tsx        # リストコンポーネントのパターン
    └── [resource]-form.tsx        # フォームコンポーネントのパターン
```

### 4.2 新機能への適用

パターンに従って、以下を変更して適用:

- リソース名（例: card -> tag）
- テーブル名（例: cards -> tags）
- フィールド（機能仕様に基づく）
- バリデーションルール（機能仕様に基づく）
- UIレイアウト（機能に適した形に調整）

---

## Step 5: 機能間の連携

### 5.1 関連機能の連携

機能間で連携が必要な場合:

```typescript
// 例: カードとタグの連携
export async function createCard(input: CreateCardInput) {
  // カード作成
  const { data: card } = await supabase
    .from('cards')
    .insert({ ... })
    .select()
    .single()

  // タグ紐付け
  if (input.tagIds?.length) {
    await supabase
      .from('card_tags')
      .insert(
        input.tagIds.map(tagId => ({
          card_id: card.id,
          tag_id: tagId,
        }))
      )
  }

  return card
}
```

### 5.2 共通コンポーネントの抽出

複数機能で共通するUIがあれば抽出:

```typescript
// 共通: タグ選択コンポーネント
// src/components/shared/tag-selector.tsx
export function TagSelector({
  value,
  onChange,
}: {
  value: string[]
  onChange: (value: string[]) => void
}) {
  const { data: tags } = useTags()
  // ...
}
```

---

## Step 6: 統合確認

### 6.1 全体動作確認

| 機能 | 一覧 | 作成 | 編集 | 削除 | 連携 |
|-----|-----|-----|-----|-----|-----|
| [機能1] | [ ] | [ ] | [ ] | [ ] | [ ] |
| [機能2] | [ ] | [ ] | [ ] | [ ] | [ ] |
| [機能3] | [ ] | [ ] | [ ] | [ ] | [ ] |

### 6.2 クロスファンクションテスト

機能間の連携を確認:

- [ ] [機能1] で作成したデータが [機能2] で正しく表示される
- [ ] [機能2] の変更が [機能3] に正しく反映される
- [ ] 関連データの削除時にカスケード削除が動作する

### 6.3 テスト実行

```bash
pnpm test
pnpm lint
pnpm typecheck
```

---

## Step 7: コードレビューチェックリスト

### パターン準拠
- [ ] 既存パターンに従っている
- [ ] 命名規則が統一されている
- [ ] ディレクトリ構造が統一されている

### コード品質
- [ ] TypeScript の型が適切
- [ ] エラーハンドリングが適切
- [ ] バリデーションが適切

### パフォーマンス
- [ ] 不要な再レンダリングがない
- [ ] クエリの最適化がされている
- [ ] N+1問題がない

### セキュリティ
- [ ] RLSが適切に設定されている
- [ ] 認証チェックがある
- [ ] 入力のサニタイズがされている

---

## 完了条件

- [ ] 全ての指定機能が実装されている
- [ ] 各機能の一覧・作成・編集・削除が動作する
- [ ] 機能間の連携が動作する
- [ ] 全テストがパスする
- [ ] Lint/TypeCheckがパスする

---

## 完了後のアクション

```
## 横展開実装が完了しました

### 実装された機能
| 機能ID | 機能名 | 状態 |
|--------|-------|------|
| F-XXX | [機能1] | 完了 |
| F-YYY | [機能2] | 完了 |
| F-ZZZ | [機能3] | 完了 |

### 実装されたファイル
[機能1]
- src/validations/xxx.ts
- src/actions/xxx.ts
- src/hooks/useXxx.ts
- src/app/(main)/xxx/...
- src/components/xxx/...

[機能2]
- ...

[機能3]
- ...

### 動作確認結果
| 確認項目 | 状態 |
|---------|------|
| 全機能の動作 | [Success/Failed] |
| 機能間連携 | [Success/Failed] |
| テスト | [Success/Failed] |
| Lint/TypeCheck | [Success/Failed] |

内容を確認し、問題なければ「OK」と入力してください。
```

---

## 次のステップ
`/phase-5-release/integration` - 結合テスト・動作確認
