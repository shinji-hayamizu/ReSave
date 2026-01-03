# F-022: 記憶度自己評価

> 関連: [ビジネス要件](../business-requirements.md) | [機能一覧](./_index.md)

## 基本情報

| 項目 | 内容 |
|-----|-----|
| 機能ID | F-022 |
| 優先度 | P0 |
| 関連US | F-022 |
| ステータス | Draft |

## 概要

ユーザーがカードの答えを見た後、記憶の度合いを自己評価する。この評価結果に基づいて次回復習日が決定される。シンプルな3段階評価で、直感的に操作できる。

## ユーザーフロー

1. **[前提]** ホーム画面でカードが表示されている（F-021のカードリスト形式）
2. **[ユーザー]** カード上部の評価ボタンで3段階評価（答え表示前でも評価可能）
   - **OK**: 覚えていた（次の間隔へ進む）
   - **覚えた**: 完全に習得（完了一覧へ移動）
   - **もう一度**: 忘れた（1日目からやり直し）
3. **[システム]** 評価結果に基づき次回復習日を設定（F-023へ）
4. **[システム]** 学習ログを記録
5. **[完了]** カードがリストから消える（または完了タブへ移動）

## 入力/出力

| 種別 | 項目名 | 型 | 必須 | 説明 | 制約・バリデーション |
|-----|-------|---|-----|-----|-------------------|
| 入力 | cardId | string | Yes | 評価対象カードID | UUID形式 |
| 入力 | rating | Rating | Yes | 評価値 | 'ok' \| 'learned' \| 'again' |
| 入力 | timeSpent | number | No | 回答時間（ミリ秒） | 自動計測 |
| 出力 | nextReviewDate | Date \| null | - | 次回復習日 | nullは完了一覧行き |
| 出力 | reviewLog | ReviewLog | - | 学習ログ | 統計用に保存 |

## ビジネスルール

| ID | ルール | 条件 | 結果 |
|----|-------|-----|-----|
| BR-F022-01 | 3段階評価 | 評価時 | OK/覚えた/もう一度 の3択 |
| BR-F022-02 | OK評価 | 覚えていた場合 | 次の間隔へ進む（1→3→7→14→30→180日） |
| BR-F022-03 | 覚えた評価 | 完全習得の場合 | 完了一覧へ移動（復習終了） |
| BR-F022-04 | もう一度評価 | 忘れた場合 | 間隔を1日目にリセット |
| BR-F022-05 | 最終間隔後のOK | 180日の間隔でOK | 完了一覧へ移動 |
| BR-F022-06 | 回答時間記録 | 評価時 | 表面表示からの経過時間を記録 |
| BR-F022-07 | ログ保存 | 評価確定時 | review_logsテーブルに記録 |

## 評価の意味と動作

| 評価 | 意味 | 動作 |
|-----|------|------|
| OK | 覚えていた | 次の間隔へ進む |
| 覚えた | 完全に習得した | 完了一覧へ移動 |
| もう一度 | 忘れた | 1日目からやり直し |

## 間隔の進行例

```
新規カード
  ↓ OK
1日後に復習
  ↓ OK
3日後に復習
  ↓ もう一度
1日後に復習（リセット）
  ↓ OK
3日後に復習
  ↓ OK
7日後に復習
  ...
  ↓ OK（180日後）
完了一覧へ
```

## データモデル

### ReviewLog
```typescript
type ReviewLog = {
  id: string
  card_id: string
  user_id: string
  rating: 'ok' | 'learned' | 'again'
  time_spent_ms: number           // 回答時間（ミリ秒）
  interval_index: number          // 評価時の間隔インデックス
  reviewed_at: string             // 評価日時
}
```

### Card（復習関連フィールド）
```typescript
type CardReviewFields = {
  state: 'new' | 'learning' | 'completed'
  interval_index: number          // 現在の間隔インデックス（0-5）
  next_review_date: string | null // 次回復習日
  last_review_date: string | null // 最終復習日
  review_count: number            // 復習回数
}
```

## エラーケース

| ID | 条件 | エラーメッセージ | 対処 |
|----|-----|----------------|-----|
| E-F022-01 | 評価保存失敗 | 評価の保存に失敗しました。再度お試しください | リトライ |
| E-F022-02 | 不正な評価値 | 無効な評価です | UI再描画 |

## 受け入れ条件（AC）

- [ ] AC-01: 3つの評価ボタン（OK/覚えた/もう一度）がカード上部に常時表示されること
- [ ] AC-02: 各ボタンに次回復習日のプレビューが表示されること（例: "3日後", "完了", "1日後"）
- [ ] AC-03: 評価をタップするとカードがリストから消える（または完了タブへ移動）こと
- [ ] AC-04: 評価結果がDBに保存されること
- [ ] AC-05: 回答時間が自動的に記録されること
- [ ] AC-06: 「覚えた」を選択したカードが完了タブに移動すること
- [ ] AC-07: 「もう一度」を選択したカードが1日後に復習対象になること
- [ ] AC-08: 完了タブのカードには評価ボタンが表示されないこと

## 画面要件

### 評価ボタン（RatingButtons）

カード上部（CardTopBar）に常時配置。答え表示前でも操作可能。

```
┌───────────────────────────────────┐
│  [ OK ]  [ 覚えた ]  [ もう一度 ]  │
│   3日後     完了       1日後      │
└───────────────────────────────────┘
```

#### コンポーネント構成

| 要素 | class | 説明 |
|-----|-------|------|
| コンテナ | rating-buttons | 評価ボタン群 |
| OKボタン | rating-btn rating-btn--ok | 緑系、次の間隔へ |
| 覚えたボタン | rating-btn rating-btn--learned | 青系、完了へ |
| もう一度ボタン | rating-btn rating-btn--again | 赤/オレンジ系、リセット |

#### 各ボタンの構造

```html
<button class="rating-btn rating-btn--ok" data-rating="ok">
  <span class="rating-btn__label">OK</span>
  <span class="rating-btn__preview">3日後</span>
</button>
```

#### 状態バリエーション

| 状態 | 条件 | 表示 |
|-----|------|------|
| 通常表示 | state != 'completed' | 全3ボタン表示 |
| 非表示 | state == 'completed' | ボタン非表示（完了タブ） |

### モバイル対応
- ボタンは十分な大きさ（タップしやすい）
- スワイプ操作対応は将来検討

## 技術仕様

### 評価処理
```typescript
async function submitRating(cardId: string, rating: Rating, timeSpent: number) {
  const card = await getCard(cardId)

  // 1. 次回復習日を計算（F-023）
  const { nextReviewDate, newIntervalIndex, newState } = calculateNextReview(card, rating)

  // 2. カードを更新
  await supabase
    .from('cards')
    .update({
      state: newState,
      interval_index: newIntervalIndex,
      next_review_date: nextReviewDate?.toISOString() ?? null,
      last_review_date: new Date().toISOString(),
      review_count: card.review_count + 1
    })
    .eq('id', cardId)

  // 3. 学習ログを保存
  await supabase
    .from('review_logs')
    .insert({
      card_id: cardId,
      user_id: userId,
      rating,
      time_spent_ms: timeSpent,
      interval_index: card.interval_index,
      reviewed_at: new Date().toISOString()
    })
}
```

### 次回復習日プレビュー
```typescript
function getNextReviewPreview(card: Card, rating: Rating): string {
  const { nextReviewDate, newState } = calculateNextReview(card, rating)

  if (newState === 'completed') return '完了'

  const days = differenceInDays(nextReviewDate, new Date())
  if (days === 1) return '明日'
  return `${days}日後`
}
```

## 未確定事項

- 【要確認】評価ボタンの配置順序（左から 覚え直し/OK/覚えた で適切か）
- 【要確認】スワイプ操作による評価の対応時期
