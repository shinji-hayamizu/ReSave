---
description: 型定義とZodスキーマ作成。APIRoute、Server Actions、TanStack Queryフックを作成する場合に使用。REST API、エンドポイント、CRUD操作、データフェッチを実装する際に適用。
allowed-tools: Read, Write, Edit, Glob, Grep, Task, WebSearch, WebFetch
argument-hint: [出力先ディレクトリ (例: apps/web) / 省略でmonorepo自動検出]
---

# 型定義 & Zodスキーマ作成

ドメインモデルとAPI設計から、TypeScript型定義とZodバリデーションスキーマを生成する。
**monorepo（packages/shared）・single app 両対応の汎用コマンド。**

## 前提

以下が完了済みであること:
- アーキテクチャ設計（ドメインモデル、テーブル定義を含む）

**アーキテクチャファイルの場所（優先順）:**
1. `.kiro/specs/*/design.md` (Kiroスペック)
2. `docs/requirements/architecture.md` (標準)
3. `docs/design/database.md` (DB設計のみ)

---

## 参照ドキュメント（必須読み込み）

以下のドキュメントを読み込み、ドメインモデルとテーブル定義を特定すること:

1. **アーキテクチャ/設計ドキュメント** - ドメインモデル、エンティティ定義、テーブル設計
2. **機能仕様（存在する場合）** - 入力/出力の型、ビジネスルール
3. **既存の型定義/スキーマ（存在する場合）** - 命名規則、パターンの参照

---

## あなたの役割

経験豊富なTypeScriptエンジニア。
型安全で保守性の高いコードを設計し、Zodスキーマと型定義の一貫性を保つ。

## 実行方法

- このタスクは **ultrathink** で実行すること
- **各リソースの型定義とZodスキーマはsubAgentで並列実行**すること

---

## Step 0: プロジェクト構成の確認

```bash
# monorepo の shared パッケージを確認
ls packages/shared/src/ 2>/dev/null && echo "MONOREPO" || echo "SINGLE_APP"

# 既存の型定義・スキーマを確認
ls packages/shared/src/types/ 2>/dev/null || ls apps/*/src/types/ 2>/dev/null
ls packages/shared/src/validations/ 2>/dev/null || ls apps/*/src/validations/ 2>/dev/null
```

確認結果から出力先を決定:

| 構成 | 型定義の出力先 | Zodスキーマの出力先 |
|-----|-------------|-----------------|
| **monorepo** (`packages/shared/` あり) | `packages/shared/src/types/` | `packages/shared/src/validations/` |
| **single app** | `{root}/src/types/` | `{root}/src/validations/` |

`{root}` = `$ARGUMENTS` で指定されたパス（省略時は `apps/` 配下のWebアプリを自動検出）

---

## Step 1: ドメインモデルの抽出

アーキテクチャドキュメントから以下を抽出:

- エンティティ一覧（テーブル名、属性、型、制約）
- リレーション（1:N, N:M など）
- ビジネスルール（ENUM値、デフォルト値）

---

## Step 2: 型定義の生成

### 2.1 ファイル構成

```
{types_dir}/
├── index.ts           # 全型のre-export
├── {entity}.ts        # エンティティ別の型定義
└── api.ts             # 共通APIレスポンス型
```

### 2.2 エンティティ型テンプレート

```typescript
// types/{entity}.ts

export type {Entity} = {
  id: string
  // ... DBカラムに対応するフィールド
  createdAt: string  // ISO 8601形式
  updatedAt: string
}

export type {Entity}ListResponse = {
  data: {Entity}[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

export type Create{Entity}Input = {
  // 作成時に必要なフィールドのみ
  // id, createdAt, updatedAt は除外
}

export type Update{Entity}Input = Partial<Create{Entity}Input>

export type {Entity}Filters = {
  // クエリパラメータに対応するフィルタ
}
```

### 2.3 共通API型テンプレート

```typescript
// types/api.ts

export type Pagination = {
  total: number
  limit: number
  offset: number
}

export type ListResponse<T> = {
  data: T[]
  pagination: Pagination
}

export type ApiError = {
  error: {
    code: string
    message: string
    details?: unknown[]
  }
}
```

### 2.4 命名規則

| 種別 | 命名パターン | 例 |
|-----|------------|-----|
| エンティティ型 | PascalCase | `Card`, `Tag`, `User` |
| 作成入力型 | `Create{Entity}Input` | `CreateCardInput` |
| 更新入力型 | `Update{Entity}Input` | `UpdateCardInput` |
| 一覧レスポンス型 | `{Entity}ListResponse` | `CardListResponse` |
| フィルタ型 | `{Entity}Filters` | `CardFilters` |

---

## Step 3: Zodスキーマの生成

### 3.1 ファイル構成

```
{validations_dir}/
├── index.ts           # 全スキーマのre-export
└── {entity}.ts        # エンティティ別のZodスキーマ
```

### 3.2 Zodスキーマテンプレート

```typescript
// validations/{entity}.ts

import { z } from 'zod'

// === 基本スキーマ ===

export const {entity}Schema = z.object({
  id: z.string().uuid(),
  // ... 全フィールド
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// === 入力スキーマ ===

export const create{Entity}Schema = z.object({
  // バリデーションメッセージは日本語で記述
  field: z.string()
    .min(1, '必須項目です')
    .max(255, '255文字以内で入力してください'),
})

export const update{Entity}Schema = create{Entity}Schema.partial()

// === クエリスキーマ ===

export const {entity}QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
})

// === 型エクスポート（Zodからの推論） ===

export type {Entity} = z.infer<typeof {entity}Schema>
export type Create{Entity}Input = z.infer<typeof create{Entity}Schema>
export type Update{Entity}Input = z.infer<typeof update{Entity}Schema>
export type {Entity}Query = z.infer<typeof {entity}QuerySchema>
```

### 3.3 バリデーションルール対応表

| DB型 | Zod | バリデーション例 |
|-----|-----|----------------|
| UUID | `z.string().uuid()` | - |
| VARCHAR(N) | `z.string().max(N)` | `.min(1)` で必須化 |
| TEXT | `z.string()` | `.max(10000)` で上限設定 |
| INT | `z.number().int()` | `.min(0).max(100)` で範囲指定 |
| BOOLEAN | `z.boolean()` | `.default(false)` |
| TIMESTAMP | `z.string().datetime()` | ISO 8601形式 |
| ENUM | `z.enum(['a', 'b', 'c'])` | DB定義と一致させる |
| NULL許可 | `.nullable()` | `z.string().nullable()` |
| 任意 | `.optional()` | 入力スキーマで使用 |

### 3.4 エラーメッセージ規約

- 日本語で記述
- ユーザーにわかりやすい表現を使用
- フィールド名を含めない（UIで補完）

```typescript
// Good
.min(1, '必須項目です')
.max(255, '255文字以内で入力してください')
.email('有効なメールアドレスを入力してください')

// Bad
.min(1, 'タイトルは必須です')  // フィールド名を含めない
.min(1, 'Required')           // 日本語で記述
```

---

## Step 4: 型定義とZodスキーマの整合性

### 4.1 型推論の活用

Zodスキーマから型を推論することで、型定義との二重管理を防ぐ。

```typescript
// validations/{entity}.ts
export const {entity}Schema = z.object({ ... })
export type {Entity} = z.infer<typeof {entity}Schema>

// types/{entity}.ts では validations からre-exportするか、
// 手動で型を定義する場合はZodスキーマと一致させる
```

### 4.2 monorepo の場合: index.ts のエクスポート

```typescript
// packages/shared/src/index.ts に追加
export type { {Entity}, Create{Entity}Input, Update{Entity}Input } from './types/{entity}'
export { create{Entity}Schema, update{Entity}Schema } from './validations/{entity}'
export type { {Entity}Query } from './validations/{entity}'
```

---

## Step 5: 並列実行

### 5.1 subAgentタスク分割

以下のタスクを **subAgentで並列実行** する:

1. **各エンティティの型定義** (`{types_dir}/{entity}.ts`)
2. **各エンティティのZodスキーマ** (`{validations_dir}/{entity}.ts`)

### 5.2 実行順序

```
[並列] エンティティごとの型定義 + Zodスキーマ
  ↓
[順次] index.ts の作成（re-export）
  ↓
[順次] 型チェック確認
```

---

## Step 6: 型チェック確認

```bash
# monorepo の場合
cd packages/shared && npx tsc --noEmit

# Web アプリでの import 確認
cd apps/{web_app} && npx tsc --noEmit

# Expo アプリが存在する場合
cd apps/{mobile_app} && npx tsc --noEmit
```

---

## 出力ルール

### ファイル命名

- 型定義: `types/{entity}.ts` (小文字、単数形)
- Zodスキーマ: `validations/{entity}.ts` (小文字、単数形)
- 例: `card.ts`, `tag.ts`, `user.ts`

### コメント

- JSDocは型定義の説明にのみ使用
- 処理説明コメントは禁止
- バリデーションメッセージで意図を表現

### 既存ファイルの扱い

- 既存の型定義/スキーマがある場合は **追記・更新**
- 新規の場合は **作成**
- 既存のコードスタイル・命名規則に従う

---

## 完了条件

- [ ] 全エンティティの型定義ファイルが作成されている
- [ ] 全エンティティのZodスキーマファイルが作成されている
- [ ] `index.ts` でre-exportされている
- [ ] DBカラムと型/スキーマのフィールドが一致している
- [ ] `npx tsc --noEmit` でエラーがない（Web・Expo 両方）
- [ ] 既存の型定義と競合・重複がない

---

## 完了後のアクション

```
型定義とZodスキーマを生成しました。

出力先:
- {types_dir}/         # 型定義
- {validations_dir}/   # Zodスキーマ

次のステップ:
- `/dev:04-setup-supabase` - Supabase連携基盤の構築
- `/dev:07-implement-feature` - 機能の CRUD 実装
```
