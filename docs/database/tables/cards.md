# cards テーブル

> 関連ドキュメント:
> - [ER図](../er-diagram.md)
> - [インデックス設計](../indexes.md)
> - [ビジネス要件 - カード管理](../../requirements/business-requirements.md#カード管理)
> - [FSRS Algorithm](https://github.com/open-spaced-repetition/fsrs4anki/wiki/abc-of-fsrs)

## 1. 概要

記憶カードを管理するテーブル。表面（質問）と裏面（答え）のコンテンツに加え、FSRSアルゴリズムに必要なパラメータを保持します。

## 2. カラム定義

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| user_id | uuid | NO | - | 所有ユーザーID（FK） |
| front_content | text | NO | - | 表面コンテンツ（質問） |
| back_content | text | NO | - | 裏面コンテンツ（答え） |
| image_url | text | YES | NULL | 添付画像URL（Supabase Storage） |
| stability | real | NO | 0 | FSRSの安定性パラメータ |
| difficulty | real | NO | 0 | FSRSの難易度パラメータ（0.0-1.0） |
| elapsed_days | integer | NO | 0 | 前回復習からの経過日数 |
| scheduled_days | integer | NO | 0 | 次回復習までの予定日数 |
| reps | integer | NO | 0 | 復習回数 |
| lapses | integer | NO | 0 | 忘却回数 |
| state | smallint | NO | 0 | カード状態（0-3） |
| last_review_at | timestamptz | YES | NULL | 最終復習日時 |
| next_review_at | timestamptz | YES | NULL | 次回復習予定日時 |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

### 2.1 カード状態（state）の値

| 値 | 状態 | 説明 |
|---|------|------|
| 0 | New | 新規カード（未学習） |
| 1 | Learning | 学習中 |
| 2 | Review | 復習段階（長期記憶化） |
| 3 | Relearning | 再学習中（忘却後） |

## 3. 制約

### 3.1 主キー制約

```sql
CONSTRAINT cards_pkey PRIMARY KEY (id)
```

### 3.2 外部キー制約

```sql
CONSTRAINT cards_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
```

### 3.3 CHECK制約

```sql
CONSTRAINT cards_state_valid CHECK (state >= 0 AND state <= 3)
CONSTRAINT cards_difficulty_valid CHECK (difficulty >= 0 AND difficulty <= 1)
CONSTRAINT cards_non_negative CHECK (
    stability >= 0 AND
    elapsed_days >= 0 AND
    scheduled_days >= 0 AND
    reps >= 0 AND
    lapses >= 0
)
```

## 4. インデックス

| インデックス名 | カラム | 種類 | 用途 |
|--------------|--------|------|------|
| cards_pkey | id | PRIMARY | 主キー検索 |
| cards_user_id_idx | user_id | BTREE | ユーザー別カード一覧 |
| cards_user_next_review_idx | (user_id, next_review_at) | BTREE | 復習予定カード取得 |
| cards_user_state_idx | (user_id, state) | BTREE | 状態別カード取得 |
| cards_created_at_idx | created_at | BTREE | 作成日時ソート |

## 5. RLSポリシー

```sql
-- RLS有効化
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- ユーザーは自身のカードのみ参照可能
CREATE POLICY "Users can view own cards"
ON cards FOR SELECT
USING (auth.uid() = user_id);

-- ユーザーは自身のカードを作成可能
CREATE POLICY "Users can create own cards"
ON cards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ユーザーは自身のカードを更新可能
CREATE POLICY "Users can update own cards"
ON cards FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ユーザーは自身のカードを削除可能
CREATE POLICY "Users can delete own cards"
ON cards FOR DELETE
USING (auth.uid() = user_id);
```

## 6. トリガー

### 6.1 updated_at自動更新

```sql
CREATE TRIGGER cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

## 7. DDL

```sql
CREATE TABLE cards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    front_content text NOT NULL,
    back_content text NOT NULL,
    image_url text,
    stability real NOT NULL DEFAULT 0,
    difficulty real NOT NULL DEFAULT 0,
    elapsed_days integer NOT NULL DEFAULT 0,
    scheduled_days integer NOT NULL DEFAULT 0,
    reps integer NOT NULL DEFAULT 0,
    lapses integer NOT NULL DEFAULT 0,
    state smallint NOT NULL DEFAULT 0,
    last_review_at timestamptz,
    next_review_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT cards_state_valid CHECK (state >= 0 AND state <= 3),
    CONSTRAINT cards_difficulty_valid CHECK (difficulty >= 0 AND difficulty <= 1),
    CONSTRAINT cards_non_negative CHECK (
        stability >= 0 AND
        elapsed_days >= 0 AND
        scheduled_days >= 0 AND
        reps >= 0 AND
        lapses >= 0
    )
);

-- RLS有効化
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- インデックス作成
CREATE INDEX cards_user_id_idx ON cards(user_id);
CREATE INDEX cards_user_next_review_idx ON cards(user_id, next_review_at);
CREATE INDEX cards_user_state_idx ON cards(user_id, state);
CREATE INDEX cards_created_at_idx ON cards(created_at);

-- updated_atトリガー
CREATE TRIGGER cards_updated_at
    BEFORE UPDATE ON cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

## 8. 関連テーブル

| テーブル | 関係 | 外部キー |
|---------|------|---------|
| users | N:1 | cards.user_id -> users.id |
| card_tags | 1:N | card_tags.card_id -> cards.id |
| study_logs | 1:N | study_logs.card_id -> cards.id |

## 9. FSRSアルゴリズム補足

### 9.1 パラメータの役割

| パラメータ | 説明 | 更新タイミング |
|-----------|------|--------------|
| stability | 記憶の安定性。高いほど忘れにくい | 復習時 |
| difficulty | カードの難しさ。ユーザーの評価から算出 | 復習時 |
| elapsed_days | 前回復習からの経過日数 | 復習時 |
| scheduled_days | 次回復習までの日数。stabilityから算出 | 復習時 |
| reps | 総復習回数 | 復習時 |
| lapses | 「Again」評価された回数 | 復習時 |

### 9.2 状態遷移

```
New -> Learning -> Review
             ^        |
             |        v (lapse)
             +-- Relearning
```

- **New -> Learning**: 初回学習開始
- **Learning -> Review**: 学習完了（Good/Easy評価）
- **Review -> Relearning**: 忘却（Again評価）
- **Relearning -> Review**: 再学習完了
