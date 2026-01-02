# F-013: カード作成

> 関連: [ビジネス要件](../business-requirements.md) | [機能一覧](./_index.md)

## 基本情報

| 項目 | 内容 |
|-----|-----|
| 機能ID | F-013 |
| 優先度 | P0 |
| 関連US | F-013 |
| ステータス | Draft |

## 概要

ユーザーが暗記したい内容をカード（表面：質問、裏面：答え）として登録する。タグを付与して分類・整理が可能。

## ユーザーフロー

1. **[トリガー]** ユーザーが「カード追加」ボタンをタップ
2. **[システム]** カード作成フォームを表示
3. **[ユーザー]** 表面（質問）を入力
4. **[ユーザー]** 裏面（答え）を入力
5. **[ユーザー]** タグを選択または新規作成（任意）
6. **[ユーザー]** 「保存」ボタンをタップ
7. **[システム]** カードをDBに保存、FSRS初期パラメータを設定
8. **[完了]** カード一覧に新しいカードが表示される

## 入力/出力

| 種別 | 項目名 | 型 | 必須 | 説明 | 制約・バリデーション |
|-----|-------|---|-----|-----|-------------------|
| 入力 | front | string | Yes | 表面（質問） | 1文字以上、最大2000文字 |
| 入力 | back | string | Yes | 裏面（答え） | 1文字以上、最大5000文字 |
| 入力 | tagIds | string[] | No | 付与するタグのID配列 | 既存タグのみ |
| 入力 | newTags | string[] | No | 新規作成するタグ名 | 最大30文字/タグ |
| 出力 | card | Card | - | 作成されたカード | id, front, back, created_at, fsrs_state |

## ビジネスルール

| ID | ルール | 条件 | 結果 |
|----|-------|-----|-----|
| BR-F013-01 | FSRS初期化 | カード作成時 | stability=0, difficulty=0, state="new" |
| BR-F013-02 | タグ自動作成 | newTagsに値がある場合 | タグを作成してカードに紐付け |
| BR-F013-03 | 重複タグ防止 | 同名タグが存在する場合 | 既存タグを使用 |
| BR-F013-04 | 次回復習日 | 新規カード | 作成日を次回復習日として設定（即日学習可能） |

## データモデル

### Card
```typescript
type Card = {
  id: string           // UUID
  user_id: string      // 所有者
  front: string        // 表面（質問）
  back: string         // 裏面（答え）
  created_at: string   // 作成日時
  updated_at: string   // 更新日時
  // FSRS パラメータ
  fsrs_stability: number    // 安定性
  fsrs_difficulty: number   // 難易度
  fsrs_state: 'new' | 'learning' | 'review' | 'relearning'
  fsrs_due: string          // 次回復習日
  fsrs_last_review: string | null  // 最終復習日
  fsrs_reps: number         // 復習回数
  fsrs_lapses: number       // 忘却回数
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
| E-F013-01 | 表面が空 | 表面（質問）を入力してください | フォーム再入力 |
| E-F013-02 | 裏面が空 | 裏面（答え）を入力してください | フォーム再入力 |
| E-F013-03 | 表面が長すぎる | 表面は2000文字以内で入力してください | フォーム再入力 |
| E-F013-04 | 裏面が長すぎる | 裏面は5000文字以内で入力してください | フォーム再入力 |
| E-F013-05 | 保存失敗 | カードの保存に失敗しました。再度お試しください | リトライ |

## 受け入れ条件（AC）

- [ ] AC-01: 表面と裏面を入力してカードを作成できること
- [ ] AC-02: 作成したカードがカード一覧に表示されること
- [ ] AC-03: タグを付与してカードを作成できること
- [ ] AC-04: 新しいタグ名を入力すると、タグが自動作成されてカードに紐付くこと
- [ ] AC-05: 作成したカードが即日の学習対象になること
- [ ] AC-06: 表面または裏面が空の場合、エラーメッセージが表示されること

## 画面要件

### カード作成フォーム
- 表面（質問）入力エリア（テキストエリア）
- 裏面（答え）入力エリア（テキストエリア）
- タグ選択UI（既存タグのチップ + 新規タグ入力）
- 文字数カウンター
- 「キャンセル」ボタン
- 「保存」ボタン

### カード作成モーダル or ページ
- モバイル: フルスクリーンモーダル
- Web: サイドパネルまたはモーダル

## 技術仕様

### Supabase連携
```typescript
// カード作成
const { data: card, error } = await supabase
  .from('cards')
  .insert({
    user_id: userId,
    front,
    back,
    fsrs_stability: 0,
    fsrs_difficulty: 0,
    fsrs_state: 'new',
    fsrs_due: new Date().toISOString(),
    fsrs_reps: 0,
    fsrs_lapses: 0
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
- 【要確認】音声入力対応（モバイル）
- 【仮定】画像添付はv1.3で実装と仮定
