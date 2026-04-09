---
description: 型定義・Zodバリデーションスキーマを追加する。機能実装前に必ず実行する。monorepo（packages/shared）・single app 両対応。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: [機能名 (例: cards, tags, study) / 省略で全機能]
---

# 型・バリデーション追加

TypeScript 型定義と Zod バリデーションスキーマを追加する。
機能実装（`/dev:07-implement-feature`）の前に必ず実行すること。

**monorepo（`packages/shared`）・single app 両対応の汎用コマンド。**

## 使い方

```bash
# 単一機能
/dev:06-add-types cards

# 複数機能（カンマ区切り）
/dev:06-add-types cards,tags

# 全機能（ドキュメントから自動抽出）
/dev:06-add-types
```

引数: `$ARGUMENTS` = 機能名（省略時: アーキテクチャドキュメントから全機能を自動抽出）

---

## Step 0: プロジェクト構成の確認

```bash
# monorepo の shared パッケージを確認
ls packages/shared/src/ 2>/dev/null && echo "MONOREPO" || echo "SINGLE_APP"

# Expoアプリの確認
ls apps/*/app.json 2>/dev/null | xargs -I{} grep -l "expo" {} 2>/dev/null

# 既存の型定義・スキーマを確認
ls packages/shared/src/types/ 2>/dev/null
ls packages/shared/src/validations/ 2>/dev/null
```

確認した結果から出力先を決定:

| 構成 | 型定義の出力先 | Zodスキーマの出力先 |
|-----|-------------|-----------------|
| **monorepo** (`packages/shared/` あり) | `packages/shared/src/types/` | `packages/shared/src/validations/` |
| **single app** | `apps/{web_app}/src/types/` | `apps/{web_app}/src/validations/` |

また以下の変数を確認:
- **`{mobile_app}`** = Expoアプリのディレクトリ名（例: `mobile`）

---

## 必須読み込みファイル

1. `docs/requirements/architecture.md` — データモデル・型定義の根拠
2. `docs/requirements/functions/{機能}/*.md` — バリデーションルール・エラーメッセージ
3. `{types_dir}/` — 既存の型定義（重複チェック）
4. `{validations_dir}/` — 既存のスキーマ（重複チェック）

---

## Step 1: ドキュメント読み込み・対象機能の特定

### 1.1 対象機能の決定

- **引数あり**: 指定された機能名を対象にする
- **引数なし**: アーキテクチャドキュメントのデータモデルセクションから全機能を抽出

### 1.2 既存型の確認

```bash
ls {types_dir}/
ls {validations_dir}/
```

既存ファイルを読み込み、重複・競合がないか確認する。

---

## Step 2: 型定義の追加

### 2.1 型定義ファイル作成・更新

`{types_dir}/{feature}.ts` に以下のパターンで定義:

```typescript
// {types_dir}/{feature}.ts

export type {Feature} = {
  id: string
  userId: string
  // アーキテクチャドキュメントのデータモデルに従う
  createdAt: string
  updatedAt: string
}

export type {Feature}WithRelations = {Feature} & {
  // 関連エンティティ
}

export type Create{Feature}Input = {
  // 必須フィールドのみ（id, createdAt, updatedAt は除外）
}

export type Update{Feature}Input = Partial<Pick<{Feature}, 'field1' | 'field2'>>

// 一覧レスポンス（API Route 経由の場合）
export type {Feature}ListResponse = {
  data: {Feature}[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}
```

**命名規則**:
- 型名: `PascalCase`
- フィールド名: `camelCase`
- 全フィールドは `readonly` 推奨

---

## Step 3: Zodスキーマの追加

### 3.1 バリデーションスキーマ作成・更新

`{validations_dir}/{feature}.ts`:

```typescript
import { z } from 'zod'

// 作成スキーマ（機能仕様のバリデーションルールに従う）
export const create{Feature}Schema = z.object({
  // 例: text: z.string().min(1, '入力してください').max(500, '500文字以内で入力してください'),
})

// 更新スキーマ（部分更新）
export const update{Feature}Schema = create{Feature}Schema.partial()

// 一覧取得クエリスキーマ
export const {feature}QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

// 型推論
export type Create{Feature}Input = z.infer<typeof create{Feature}Schema>
export type Update{Feature}Input = z.infer<typeof update{Feature}Schema>
export type {Feature}Query = z.infer<typeof {feature}QuerySchema>
```

**バリデーションルール**:
- 文字数制限、必須チェック等は `docs/requirements/functions/{機能}/*.md` から抽出
- エラーメッセージは日本語で記述
- 数値は `z.coerce.number()` でStringからの変換に対応

---

## Step 4: index.ts の更新

### monorepo の場合

`packages/shared/src/index.ts` に export を追加:

```typescript
// Types
export type { {Feature}, Create{Feature}Input, Update{Feature}Input } from './types/{feature}'

// Validations
export { create{Feature}Schema, update{Feature}Schema, {feature}QuerySchema } from './validations/{feature}'
export type { Create{Feature}Input, Update{Feature}Input, {Feature}Query } from './validations/{feature}'
```

### single app の場合

`apps/{web_app}/src/types/index.ts` と `apps/{web_app}/src/validations/index.ts` に追加:

```typescript
// types/index.ts
export type { {Feature}, Create{Feature}Input, Update{Feature}Input } from './{feature}'

// validations/index.ts
export { create{Feature}Schema, update{Feature}Schema } from './{feature}'
export type { Create{Feature}Input, Update{Feature}Input } from './{feature}'
```

---

## Step 5: 型チェック・import 確認

```bash
# monorepo の場合: packages/shared のビルド確認
ls packages/shared && cd packages/shared && npx tsc --noEmit

# Web アプリでの import 確認
cd apps/{web_app} && npx tsc --noEmit

# Expo アプリが存在する場合
cd apps/{mobile_app} && npx tsc --noEmit
```

エラーがある場合は修正してから次のステップへ進む。

---

## 完了条件

- [ ] `{types_dir}/{feature}.ts` が作成されている
- [ ] `{validations_dir}/{feature}.ts` が作成されている
- [ ] `index.ts` に export が追加されている
- [ ] Web アプリで正しくimportできる
- [ ] Expo アプリが存在する場合、そちらでも正しくimportできる
- [ ] `npx tsc --noEmit` でエラーがない（Web・Expo 両方）
- [ ] 既存の型定義と競合・重複がない

---

## 次のステップ

- `/dev:07-implement-feature {機能名}` — 機能の CRUD 実装
