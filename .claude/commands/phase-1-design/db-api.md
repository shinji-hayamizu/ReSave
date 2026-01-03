---
description: アーキテクチャからDB設計・API設計・Zodスキーマを生成
allowed-tools: Read, Write, Edit, Glob, Grep, Task, WebSearch, WebFetch
---

# Phase 1-C: DB設計・API設計・Zodスキーマ生成

## 前提
以下のファイルが完了済みであること:
- `docs/requirements/architecture.md`
- `docs/requirements/functions/_index.md`

---

## 参照ドキュメント（必須読み込み）
- `docs/requirements/architecture.md`
- `docs/requirements/business-requirements.md`
- `docs/requirements/functions/_index.md`

## あなたの役割
経験豊富なバックエンドエンジニア兼データベース設計者。
型安全でスケーラブルなAPI設計を行う。

## 実行方法
このタスクは **ultrathink** で実行すること。

---

## Step 1: architecture.md の確認

architecture.md を読み込み、以下を特定:

| 項目 | 確認内容 |
|------|---------|
| データベース | PostgreSQL / MySQL / その他 |
| ORM/クライアント | Prisma / Drizzle / Supabase Client / その他 |
| API形式 | REST / tRPC / GraphQL |
| 認証 | Supabase Auth / NextAuth / Clerk / その他 |
| バリデーション | Zod / Yup / Valibot / その他 |

---

## Step 2: DB設計の詳細化

### 2.1 テーブル設計書の作成

`docs/design/database.md` を作成:

```markdown
# データベース設計書

## 1. テーブル一覧

| テーブル名 | 説明 | RLS |
|-----------|------|-----|
| users | ユーザー情報（Supabase Auth管理） | - |
| [table_name] | ... | Yes/No |

## 2. テーブル詳細

### [table_name] テーブル

| カラム名 | 型 | NULL | デフォルト | 説明 | 制約 |
|---------|---|------|-----------|-----|------|
| id | UUID | NO | gen_random_uuid() | PK | PRIMARY KEY |
| user_id | UUID | NO | - | 所有者 | FK -> auth.users.id |
| ... | ... | ... | ... | ... | ... |
| created_at | TIMESTAMPTZ | NO | NOW() | 作成日時 | |
| updated_at | TIMESTAMPTZ | NO | NOW() | 更新日時 | |

**インデックス:**
- `idx_[table]_user_id` ON (user_id)
- `idx_[table]_[column]` ON ([column])

**RLS ポリシー:**
```sql
-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can CRUD own [table]" ON [table]
  FOR ALL USING (auth.uid() = user_id);
```

## 3. ER図

```mermaid
erDiagram
    [ER図をここに記述]
```

## 4. マイグレーションファイル

`supabase/migrations/YYYYMMDDHHMMSS_init.sql` の内容をここに記載
```

### 2.2 マイグレーションファイル作成

`supabase/migrations/` に初期マイグレーションを作成:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_init.sql

-- テーブル作成
CREATE TABLE IF NOT EXISTS [table_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 他のカラム
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_[table]_user_id ON [table_name](user_id);

-- RLS有効化
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can CRUD own [table]" ON [table_name]
  FOR ALL USING (auth.uid() = user_id);

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_[table]_updated_at
  BEFORE UPDATE ON [table_name]
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Step 3: API設計の詳細化

### 3.1 API設計書の作成

`docs/design/api.md` を作成:

```markdown
# API設計書

## 1. 概要

| 項目 | 内容 |
|------|------|
| 形式 | REST |
| ベースURL | /api |
| 認証 | Bearer Token (Supabase Auth) |
| バリデーション | Zod |

## 2. 共通仕様

### リクエストヘッダー
| ヘッダー | 必須 | 説明 |
|---------|------|------|
| Authorization | Yes | Bearer {access_token} |
| Content-Type | Yes | application/json |

### レスポンス形式

**成功（単体）:**
```json
{
  "id": "...",
  "field": "..."
}
```

**成功（一覧）:**
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0
  }
}
```

**エラー:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "...",
    "details": [...]
  }
}
```

## 3. エンドポイント一覧

### [リソース名]

| メソッド | パス | 説明 | 認証 |
|---------|-----|------|------|
| GET | /api/[resource] | 一覧取得 | 要 |
| POST | /api/[resource] | 作成 | 要 |
| GET | /api/[resource]/:id | 詳細取得 | 要 |
| PATCH | /api/[resource]/:id | 更新 | 要 |
| DELETE | /api/[resource]/:id | 削除 | 要 |

## 4. エンドポイント詳細

### GET /api/[resource]

**説明:** [リソース]の一覧を取得

**クエリパラメータ:**
| パラメータ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| limit | number | No | 取得件数（デフォルト: 10） |
| offset | number | No | オフセット（デフォルト: 0） |
| [filter] | string | No | フィルタ条件 |

**レスポンス例:**
```json
{
  "data": [
    {
      "id": "...",
      "field": "..."
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0
  }
}
```

### POST /api/[resource]

**説明:** [リソース]を作成

**リクエストボディ:**
```json
{
  "field1": "...",
  "field2": "..."
}
```

**レスポンス例:**
```json
{
  "id": "...",
  "field1": "...",
  "field2": "...",
  "created_at": "..."
}
```

## 5. エラーコード

| コード | HTTPステータス | 説明 |
|-------|--------------|------|
| VALIDATION_ERROR | 400 | バリデーションエラー |
| UNAUTHORIZED | 401 | 認証エラー |
| FORBIDDEN | 403 | 権限エラー |
| NOT_FOUND | 404 | リソース不在 |
| INTERNAL_ERROR | 500 | サーバーエラー |
```

---

## Step 4: Zodスキーマの生成

### 4.1 型定義ファイル

プロジェクトの構成に応じて配置先を決定:

- Next.js: `src/types/[resource].ts`
- モノレポ: `packages/shared/types/[resource].ts`

```typescript
// types/[resource].ts

export type [Resource] = {
  id: string
  userId: string
  field1: string
  field2: number | null
  createdAt: string
  updatedAt: string
}

export type [Resource]ListResponse = {
  data: [Resource][]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

export type Create[Resource]Input = {
  field1: string
  field2?: number
}

export type Update[Resource]Input = Partial<Create[Resource]Input>
```

### 4.2 Zodスキーマファイル

```typescript
// validations/[resource].ts

import { z } from 'zod'

// 基本スキーマ
export const [resource]Schema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  field1: z.string().min(1).max(255),
  field2: z.number().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// 作成用スキーマ
export const create[Resource]Schema = z.object({
  field1: z.string().min(1, '必須項目です').max(255, '255文字以内で入力してください'),
  field2: z.number().optional(),
})

// 更新用スキーマ
export const update[Resource]Schema = create[Resource]Schema.partial()

// クエリパラメータスキーマ
export const [resource]QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
  filter: z.string().optional(),
})

// 型エクスポート
export type [Resource] = z.infer<typeof [resource]Schema>
export type Create[Resource]Input = z.infer<typeof create[Resource]Schema>
export type Update[Resource]Input = z.infer<typeof update[Resource]Schema>
```

---

## Step 5: 成果物の確認

### 5.1 生成ファイル一覧

| ファイル | 説明 |
|---------|------|
| `docs/design/database.md` | DB設計書 |
| `docs/design/api.md` | API設計書 |
| `supabase/migrations/YYYYMMDDHHMMSS_init.sql` | 初期マイグレーション |
| `src/types/*.ts` | 型定義 |
| `src/validations/*.ts` | Zodスキーマ |

### 5.2 整合性チェック

- [ ] DB設計とER図が一致している
- [ ] APIエンドポイントとDB操作が対応している
- [ ] Zodスキーマとテーブル定義が一致している
- [ ] 型定義とZodスキーマが整合している

---

## 完了後のアクション

```
Phase 1-C（DB・API・Zodスキーマ設計）を出力しました。

出力ファイル:
- docs/design/database.md
- docs/design/api.md
- supabase/migrations/YYYYMMDDHHMMSS_init.sql
- src/types/*.ts
- src/validations/*.ts

内容を確認し、問題なければ「OK」と入力してください。
修正がある場合は、修正内容を指示してください。
```

---

## 次のステップ
`/phase-2-setup/init-project` - プロジェクト初期構築
