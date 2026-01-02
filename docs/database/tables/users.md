# users テーブル

> 関連ドキュメント:
> - [ER図](../er-diagram.md)
> - [インデックス設計](../indexes.md)
> - [ビジネス要件 - 認証・ユーザー管理](../../requirements/business-requirements.md#認証ユーザー管理)

## 1. 概要

ユーザー情報を管理するテーブル。Supabase Authと連携し、認証済みユーザーのプロファイル情報を保持します。

## 2. カラム定義

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | 主キー（Supabase Auth UIDと同一） |
| email | text | NO | - | メールアドレス（一意） |
| display_name | text | YES | NULL | 表示名 |
| avatar_url | text | YES | NULL | アバター画像URL |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

## 3. 制約

### 3.1 主キー制約

```sql
CONSTRAINT users_pkey PRIMARY KEY (id)
```

### 3.2 一意制約

```sql
CONSTRAINT users_email_key UNIQUE (email)
```

### 3.3 CHECK制約

```sql
CONSTRAINT users_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
```

## 4. インデックス

| インデックス名 | カラム | 種類 | 用途 |
|--------------|--------|------|------|
| users_pkey | id | PRIMARY | 主キー検索 |
| users_email_key | email | UNIQUE | メールアドレス検索・一意保証 |

## 5. RLSポリシー

```sql
-- RLS有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ユーザーは自身のデータのみ参照可能
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- ユーザーは自身のデータのみ更新可能
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 新規ユーザー作成はauth.usersトリガー経由のみ
-- INSERT/DELETEポリシーは設定しない（サービスロールで実行）
```

## 6. トリガー

### 6.1 updated_at自動更新

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

### 6.2 Supabase Auth連携（自動ユーザー作成）

```sql
-- auth.usersへの挿入時に自動でusersテーブルにも挿入
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
```

## 7. DDL

```sql
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    display_name text,
    avatar_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT users_email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- RLS有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- インデックス（PKとUNIQUEで自動作成済み）

-- updated_atトリガー
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

## 8. 関連テーブル

| テーブル | 関係 | 外部キー |
|---------|------|---------|
| cards | 1:N | cards.user_id -> users.id |
| tags | 1:N | tags.user_id -> users.id |
| study_logs | 1:N | study_logs.user_id -> users.id |
| notification_settings | 1:1 | notification_settings.user_id -> users.id |
