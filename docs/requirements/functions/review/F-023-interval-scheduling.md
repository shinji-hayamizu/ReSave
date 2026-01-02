# F-023: 固定間隔スケジューリング

> 関連: [ビジネス要件](../business-requirements.md) | [機能一覧](./_index.md)

## 基本情報

| 項目 | 内容 |
|-----|-----|
| 機能ID | F-023 |
| 優先度 | P0 |
| 関連US | F-023 |
| ステータス | Draft |

## 概要

ユーザーの評価結果に基づき、固定間隔で次回復習日を設定する。デフォルトの間隔は `1, 3, 7, 14, 30, 180` 日で、ユーザーが設定画面でカスタマイズできる。

## 復習間隔

### デフォルト間隔
```
[1, 3, 7, 14, 30, 180] 日
```

| インデックス | 間隔 | 説明 |
|-------------|------|------|
| 0 | 1日 | 初回復習 |
| 1 | 3日 | 2回目復習 |
| 2 | 7日 | 3回目復習 |
| 3 | 14日 | 4回目復習 |
| 4 | 30日 | 5回目復習 |
| 5 | 180日 | 最終復習 |

### カスタマイズ
- ユーザーは設定画面で間隔をカスタマイズできる
- 間隔の数は可変（増減可能）
- 最終間隔後に「OK」を選択すると完了一覧へ移動

## 状態遷移

```
new → learning → completed
        ↑    ↓
        └────┘ (覚え直しでリセット)
```

| 状態 | 説明 |
|------|------|
| new | 未学習（初回復習待ち） |
| learning | 学習中（固定間隔で復習） |
| completed | 完了（復習終了、完了一覧へ） |

## ユーザーフロー

1. **[前提]** ユーザーが評価（OK/覚えた/覚え直し）を選択（F-022から）
2. **[システム]** 評価に応じて次回復習日を計算
3. **[システム]** カードの状態と間隔インデックスを更新
4. **[完了]** 次のカードへ進む

## 入力/出力

| 種別 | 項目名 | 型 | 必須 | 説明 | 制約・バリデーション |
|-----|-------|---|-----|-----|-------------------|
| 入力 | card | Card | Yes | 現在のカード状態 | interval_index含む |
| 入力 | rating | Rating | Yes | ユーザー評価 | 'ok' \| 'learned' \| 'again' |
| 入力 | intervals | number[] | No | カスタム間隔 | デフォルト: [1,3,7,14,30,180] |
| 出力 | nextReviewDate | Date \| null | - | 次回復習日 | nullは完了一覧行き |
| 出力 | newIntervalIndex | number | - | 新しい間隔インデックス | 0〜intervals.length-1 |
| 出力 | newState | State | - | 新しい状態 | 'learning' \| 'completed' |

## ビジネスルール

| ID | ルール | 条件 | 結果 |
|----|-------|-----|-----|
| BR-F023-01 | 新規カードの初回OK | state='new' かつ rating='ok' | learning状態へ、interval_index=0、1日後 |
| BR-F023-02 | OK評価（通常） | rating='ok' かつ 最終間隔未満 | interval_index+1、次の間隔後 |
| BR-F023-03 | OK評価（最終間隔） | rating='ok' かつ 最終間隔 | completed状態へ |
| BR-F023-04 | 覚えた評価 | rating='learned' | completed状態へ（即時） |
| BR-F023-05 | 覚え直し評価 | rating='again' | interval_index=0、1日後（リセット） |
| BR-F023-06 | 間隔カスタマイズ | 設定画面から | ユーザー独自の間隔を適用 |

## 計算ロジック

### 次回復習日の計算
```typescript
type Rating = 'ok' | 'learned' | 'again'
type State = 'new' | 'learning' | 'completed'

const DEFAULT_INTERVALS = [1, 3, 7, 14, 30, 180]

type ScheduleResult = {
  nextReviewDate: Date | null
  newIntervalIndex: number
  newState: State
}

function calculateNextReview(
  card: Card,
  rating: Rating,
  intervals: number[] = DEFAULT_INTERVALS
): ScheduleResult {
  const now = new Date()

  // 覚えた: 即完了
  if (rating === 'learned') {
    return {
      nextReviewDate: null,
      newIntervalIndex: card.interval_index,
      newState: 'completed'
    }
  }

  // 覚え直し: リセット
  if (rating === 'again') {
    const nextDate = addDays(now, intervals[0])
    return {
      nextReviewDate: nextDate,
      newIntervalIndex: 0,
      newState: 'learning'
    }
  }

  // OK: 次の間隔へ
  const isLastInterval = card.interval_index >= intervals.length - 1

  if (isLastInterval) {
    // 最終間隔でOK → 完了
    return {
      nextReviewDate: null,
      newIntervalIndex: card.interval_index,
      newState: 'completed'
    }
  }

  // 次の間隔へ進む
  const newIndex = card.state === 'new' ? 0 : card.interval_index + 1
  const nextDate = addDays(now, intervals[newIndex])

  return {
    nextReviewDate: nextDate,
    newIntervalIndex: newIndex,
    newState: 'learning'
  }
}
```

### 評価オプションのプレビュー
```typescript
type SchedulingOption = {
  rating: Rating
  nextReviewDate: Date | null
  label: string
}

function getSchedulingOptions(
  card: Card,
  intervals: number[] = DEFAULT_INTERVALS
): SchedulingOption[] {
  return [
    {
      rating: 'again',
      ...calculateNextReview(card, 'again', intervals),
      label: `${intervals[0]}日後`
    },
    {
      rating: 'ok',
      ...calculateNextReview(card, 'ok', intervals),
      label: getOkLabel(card, intervals)
    },
    {
      rating: 'learned',
      ...calculateNextReview(card, 'learned', intervals),
      label: '完了'
    }
  ]
}

function getOkLabel(card: Card, intervals: number[]): string {
  const isLastInterval = card.interval_index >= intervals.length - 1
  if (isLastInterval) return '完了'

  const newIndex = card.state === 'new' ? 0 : card.interval_index + 1
  return `${intervals[newIndex]}日後`
}
```

## データモデル

### Card（復習関連フィールド）
```typescript
type CardReviewFields = {
  state: 'new' | 'learning' | 'completed'
  interval_index: number          // 現在の間隔インデックス（0〜）
  next_review_date: string | null // 次回復習日（ISO8601）
  last_review_date: string | null // 最終復習日（ISO8601）
  review_count: number            // 復習回数
}
```

### UserSettings（間隔設定）
```typescript
type UserSettings = {
  review_intervals: number[]      // カスタム間隔（デフォルト: [1,3,7,14,30,180]）
  daily_new_card_limit: number    // 1日の新規カード上限
}
```

## 受け入れ条件（AC）

- [ ] AC-01: OK評価で次の間隔に進むこと
- [ ] AC-02: 覚えた評価で即座に完了一覧へ移動すること
- [ ] AC-03: 覚え直し評価で1日後にリセットされること
- [ ] AC-04: 最終間隔（180日）でOKを選択すると完了一覧へ移動すること
- [ ] AC-05: 設定画面で間隔をカスタマイズできること
- [ ] AC-06: カスタム間隔が正しく適用されること
- [ ] AC-07: 次回復習日のプレビューが評価前に表示されること

## 技術仕様

### Supabase連携
```typescript
async function updateCardSchedule(
  cardId: string,
  rating: Rating,
  userIntervals?: number[]
) {
  const intervals = userIntervals ?? DEFAULT_INTERVALS
  const card = await getCard(cardId)
  const { nextReviewDate, newIntervalIndex, newState } = calculateNextReview(
    card,
    rating,
    intervals
  )

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
}
```

### ユーザー設定の取得
```typescript
async function getUserIntervals(userId: string): Promise<number[]> {
  const { data } = await supabase
    .from('user_settings')
    .select('review_intervals')
    .eq('user_id', userId)
    .single()

  return data?.review_intervals ?? DEFAULT_INTERVALS
}
```

## 間隔カスタマイズの例

| 設定名 | 間隔 | 用途 |
|-------|------|------|
| デフォルト | [1, 3, 7, 14, 30, 180] | 標準的な学習 |
| 短期集中 | [1, 2, 4, 7, 14, 30] | 試験前の集中学習 |
| 長期記憶 | [1, 7, 30, 90, 180, 365] | ゆっくり定着 |
| シンプル | [1, 7, 30] | 最小限の復習 |

## 未確定事項

- 【要確認】間隔の上限・下限の設定
- 【要確認】プリセット間隔の提供有無
- 【仮定】間隔は日単位のみ（時間単位は対応しない）
