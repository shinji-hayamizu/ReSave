# F-013: カード作成

> 関連: [ビジネス要件](../../business-requirements.md) | [機能一覧](../_index.md)

## 基本情報

| 項目 | 内容 |
|-----|-----|
| 機能ID | F-013 |
| 優先度 | P0 |
| 関連US | F-013, F-016 |
| ステータス | Draft |

## 概要

ユーザーが暗記したい内容をカード（テキストと隠しテキスト）として登録する。2つの入力方法を提供:

1. **クイック入力**: ホーム画面で最小限の項目（テキスト+隠しテキスト）を入力して即保存
2. **詳細入力**: 専用画面でタグ・ソース・リピート設定などを入力

## ユーザーフロー

### クイック入力フロー

1. **[トリガー]** ユーザーがホーム画面のクイック入力エリアをタップ
2. **[ユーザー]** テキスト（表面）を入力
3. **[ユーザー]** 隠しテキスト（裏面）を入力（任意）
4. **[ユーザー]** 「保存」ボタンをタップ
5. **[システム]** カードをDBに保存、初期パラメータを設定
6. **[完了]** カードが「未学習」タブに追加される

### 詳細入力フロー

1. **[トリガー]** ユーザーがホーム画面の「+」ボタン（詳細入力）をタップ
2. **[システム]** カード入力画面を表示
3. **[ユーザー]** テキスト（表面）を入力（必須）
4. **[ユーザー]** 隠しテキスト（裏面）を入力（任意）
5. **[ユーザー]** 「保存」ボタンで必須項目のみ保存可能
6. **[ユーザー]** 以下のオプション項目を入力（任意）:
   - タグを選択
   - ソースURL を入力
   - リピート設定を変更
7. **[ユーザー]** 「保存」ボタンをタップ
8. **[システム]** カードをDBに保存
9. **[完了]** ホーム画面に戻り、カードが「未学習」タブに追加される

## 入力/出力

### 必須項目（クイック入力・詳細入力共通）

| 種別 | 項目名 | 型 | 必須 | 説明 | 制約・バリデーション |
|-----|-------|---|-----|-----|-------------------|
| 入力 | text | string | Yes | テキスト（カード表面） | 1文字以上、最大500文字 |
| 入力 | hiddenText | string | No | 隠しテキスト（カード裏面） | 最大2000文字 |

### オプション項目（詳細入力のみ）

| 種別 | 項目名 | 型 | 必須 | 説明 | 制約・バリデーション |
|-----|-------|---|-----|-----|-------------------|
| 入力 | tagIds | string[] | No | 付与するタグのID配列 | 既存タグのみ |
| 入力 | sourceUrl | string | No | ソースURL | 有効なURL形式 |
| 入力 | repeatInterval | string | No | リピート設定 | 'default' or カスタム間隔 |

### 出力

| 種別 | 項目名 | 型 | 説明 |
|-----|-------|---|-----|
| 出力 | card | Card | 作成されたカード |

## ビジネスルール

| ID | ルール | 条件 | 結果 |
|----|-------|-----|-----|
| BR-F013-01 | 初期状態 | カード作成時 | state="new", interval_index=0 |
| BR-F013-02 | 次回復習日 | 新規カード | 作成日を次回復習日として設定（即日学習可能） |
| BR-F013-03 | デフォルトリピート | repeatInterval未指定 | デフォルト間隔（1,3,7,14,30,180日） |

## データモデル

### Card
```typescript
type Card = {
  id: string              // UUID
  user_id: string         // 所有者
  text: string            // テキスト（表面）
  hidden_text: string | null  // 隠しテキスト（裏面）
  source_url: string | null   // ソースURL
  created_at: string      // 作成日時
  updated_at: string      // 更新日時
  // 復習パラメータ
  state: 'new' | 'learning' | 'completed'
  interval_index: number  // 現在の間隔インデックス（0〜）
  repeat_intervals: number[] | null  // カスタム間隔 or null（デフォルト使用）
  next_review_date: string      // 次回復習日
  last_review_date: string | null  // 最終復習日
  review_count: number    // 復習回数
}
```

### CardTag（中間テーブル）
```typescript
type CardTag = {
  card_id: string
  tag_id: string
}
```

## エラーケース

| ID | 条件 | エラーメッセージ | 対処 |
|----|-----|----------------|-----|
| E-F013-01 | テキストが空 | テキストを入力してください | フォーム再入力 |
| E-F013-02 | テキストが長すぎる | テキストは500文字以内で入力してください | フォーム再入力 |
| E-F013-03 | 隠しテキストが長すぎる | 隠しテキストは2000文字以内で入力してください | フォーム再入力 |
| E-F013-04 | 無効なURL | 有効なURLを入力してください | URL修正 |
| E-F013-05 | 保存失敗 | カードの保存に失敗しました。再度お試しください | リトライ |

## 受け入れ条件（AC）

### クイック入力
- [ ] AC-01: ホーム画面でテキストを入力してカードを作成できること
- [ ] AC-02: 作成したカードが「未学習」タブに表示されること
- [ ] AC-03: テキストが空の場合、保存ボタンが非活性になること

### 詳細入力
- [ ] AC-04: 詳細入力画面でテキスト+隠しテキストのみでカードを作成できること
- [ ] AC-05: タグを付与してカードを作成できること
- [ ] AC-06: ソースURLを入力してカードを作成できること
- [ ] AC-07: リピート設定を変更してカードを作成できること
- [ ] AC-08: 文字数カウンター（0/500）が表示されること

## 画面要件

### クイック入力（main.html - QuickInputForm）

ホーム画面上部にインライン配置。

```
┌─────────────────────────────────────────────┐
│ [覚えたいこと____] [答え（任意）___] [+][編集] │
└─────────────────────────────────────────────┘
```

#### コンポーネント構成

| コンポーネント | 役割 | 親 |
|--------------|------|---|
| QuickInputForm | クイック入力エリア | HomePage |
| TextInput (question) | テキスト入力 | QuickInputForm |
| TextInput (answer) | 隠しテキスト入力 | QuickInputForm |
| SaveButton | 保存ボタン（+アイコン） | QuickInputForm |
| DetailButton | 詳細入力へ（編集アイコン） | QuickInputForm |

#### 入力フィールド

| フィールド | id | placeholder | maxlength | required |
|-----------|-----|------------|-----------|----------|
| テキスト | quick-text | 覚えたいこと | 500 | Yes |
| 隠しテキスト | quick-hidden | 答え（任意） | 2000 | No |

#### ボタン/アクション

| 要素 | class | data-action | 説明 |
|-----|-------|------------|------|
| 保存 | btn-icon--primary | onClick:handleSave | カード保存（テキスト未入力時disabled） |
| 詳細入力 | btn-icon--secondary | onClick:openDetailModal | 詳細入力画面へ遷移 |

### 詳細入力画面（card-input.html - CardInputPage）

独立した入力画面。必須項目（テキスト）のみで保存可能。

#### コンポーネント構成

| コンポーネント | 役割 | 親 |
|--------------|------|---|
| CardInputPage | ページルート | - |
| BackLink | 戻るリンク | CardInputPage |
| CardInputForm | 入力フォーム | CardInputPage |
| RequiredSection | 必須項目セクション | CardInputForm |
| OptionalSection | オプション項目セクション | CardInputForm |
| DangerSection | 削除セクション（編集時のみ） | CardInputForm |
| TextInput | テキストエリア | RequiredSection |
| TagSelector | タグ選択 | OptionalSection |
| SourceUrlInput | ソースURL入力 | OptionalSection |
| RepeatSelector | リピート設定 | OptionalSection |

#### 入力フィールド

| フィールド | id | type | maxlength | required | 説明 |
|-----------|-----|------|-----------|----------|------|
| テキスト | card-text | textarea | 500 | Yes | カード表面 |
| 隠しテキスト | card-hidden | textarea | 2000 | No | カード裏面 |
| タグ | - | TagSelector | - | No | 最大10個 |
| ソース | card-source | url | - | No | https://... |
| リピート | card-repeat | select | - | No | 間隔反復/毎日/毎週/なし |

#### リピート設定オプション

| value | label | 説明 |
|-------|-------|------|
| spaced | 間隔反復 | デフォルト（1,3,7,14,30,180日） |
| daily | 毎日 | 毎日復習 |
| weekly | 毎週 | 週1回復習 |
| none | なし | 復習スケジュールなし |

#### 状態バリエーション

| 状態 | data-show-if | 表示 |
|-----|-------------|------|
| 作成モード | mode === 'create' | DangerSection非表示 |
| 編集モード | mode === 'edit' | DangerSection表示（削除ボタン） |
| 文字数警告 | length >= 90% | カウンター黄色 |
| 文字数上限 | length >= 100% | カウンター赤色 |

#### ユーザーアクション

| 要素 | data-action | 説明 |
|-----|------------|------|
| 戻るリンク | onClick:navigateBack | main.htmlへ戻る |
| 保存ボタン（必須） | onClick:handleSaveRequired | テキストのみで保存 |
| 保存ボタン（全体） | onClick:handleSaveAll | 全項目で保存 |
| 削除ボタン | onClick:handleDelete | カード削除（確認付き） |
| 間隔反復について | onClick:showRepeatInfo | 説明モーダル表示 |

## 技術仕様

### Supabase連携

```typescript
// カード作成
const { data: card, error } = await supabase
  .from('cards')
  .insert({
    user_id: userId,
    text,
    hidden_text: hiddenText || null,
    source_url: sourceUrl || null,
    state: 'new',
    interval_index: 0,
    repeat_intervals: repeatIntervals || null,
    next_review_date: new Date().toISOString(),
    review_count: 0
  })
  .select()
  .single()

// タグ紐付け
if (tagIds.length > 0) {
  await supabase
    .from('card_tags')
    .insert(tagIds.map(tagId => ({ card_id: card.id, tag_id: tagId })))
}
```

### RLS（Row Level Security）

```sql
CREATE POLICY "Users can create their own cards"
ON cards FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## 未確定事項

- 【要確認】マークダウン記法のサポート有無

---

## 変更履歴

| 日付 | バージョン | 変更内容 | 作成者 |
|------|-----------|----------|--------|
| 2026-01-02 | 1.2 | 画像アップロードと公開状態を削除 | Claude Code |
| 2026-01-02 | 1.1 | クイック入力/詳細入力の2パターンに変更 | Claude Code |
| 2026-01-02 | 1.0 | 初版作成 | Claude Code |
