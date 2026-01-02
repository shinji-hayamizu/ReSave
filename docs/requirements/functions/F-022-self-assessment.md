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

ユーザーがカードの答えを見た後、記憶の度合いを自己評価する。この評価結果がFSRSアルゴリズムの入力となり、次回復習日が決定される。

## ユーザーフロー

1. **[前提]** カードの裏面（答え）が表示されている（F-021から）
2. **[ユーザー]** 記憶度を4段階で評価
   - もう一度（Again）: 完全に忘れた
   - 難しい（Hard）: 思い出せたが時間がかかった
   - 良い（Good）: 少し考えて思い出せた
   - 簡単（Easy）: 即座に思い出せた
3. **[システム]** 評価結果をFSRSに渡す（F-023へ）
4. **[システム]** 学習ログを記録
5. **[完了]** 次のカードへ進む

## 入力/出力

| 種別 | 項目名 | 型 | 必須 | 説明 | 制約・バリデーション |
|-----|-------|---|-----|-----|-------------------|
| 入力 | cardId | string | Yes | 評価対象カードID | UUID形式 |
| 入力 | rating | Rating | Yes | 評価値 | 'again' \| 'hard' \| 'good' \| 'easy' |
| 入力 | timeSpent | number | No | 回答時間（ミリ秒） | 自動計測 |
| 出力 | nextDue | Date | - | 次回復習日 | FSRSで計算 |
| 出力 | reviewLog | ReviewLog | - | 学習ログ | 統計用に保存 |

## ビジネスルール

| ID | ルール | 条件 | 結果 |
|----|-------|-----|-----|
| BR-F022-01 | 4段階評価 | 評価時 | Again/Hard/Good/Easy の4択 |
| BR-F022-02 | Again選択 | 完全に忘れた場合 | 短期間で再出題（同日中） |
| BR-F022-03 | Easy選択 | 即座に思い出せた場合 | 次回復習間隔を大幅に延長 |
| BR-F022-04 | 回答時間記録 | 評価時 | 表面表示からの経過時間を記録 |
| BR-F022-05 | ログ保存 | 評価確定時 | review_logsテーブルに記録 |

## 評価の意味と次回復習への影響

| 評価 | 意味 | FSRSへの影響 |
|-----|------|-------------|
| Again | 完全に忘れた | stability低下、短期間で再出題 |
| Hard | 思い出せたが困難 | stability微減、間隔短め |
| Good | 適切に思い出せた | stability維持・微増、標準間隔 |
| Easy | 即座に思い出せた | stability大幅増、間隔大幅延長 |

## データモデル

### ReviewLog
```typescript
type ReviewLog = {
  id: string
  card_id: string
  user_id: string
  rating: 'again' | 'hard' | 'good' | 'easy'
  time_spent_ms: number      // 回答時間（ミリ秒）
  scheduled_days: number     // この時点での予定復習間隔
  elapsed_days: number       // 前回復習からの経過日数
  // FSRS状態のスナップショット
  fsrs_stability: number
  fsrs_difficulty: number
  fsrs_state: string
  reviewed_at: string        // 評価日時
}
```

## エラーケース

| ID | 条件 | エラーメッセージ | 対処 |
|----|-----|----------------|-----|
| E-F022-01 | 評価保存失敗 | 評価の保存に失敗しました。再度お試しください | リトライ |
| E-F022-02 | 不正な評価値 | 無効な評価です | UI再描画 |

## 受け入れ条件（AC）

- [ ] AC-01: 4つの評価ボタン（Again/Hard/Good/Easy）が表示されること
- [ ] AC-02: 各ボタンに次回復習日のプレビューが表示されること
- [ ] AC-03: 評価をタップすると次のカードに進むこと
- [ ] AC-04: 評価結果がDBに保存されること
- [ ] AC-05: 回答時間が自動的に記録されること

## 画面要件

### 評価ボタン
```
┌─────────────────────────────────────┐
│  [もう一度]  [難しい]  [良い]  [簡単]  │
│   <10分      <1日      3日     7日    │
└─────────────────────────────────────┘
```

### 各ボタンの表示
- ボタンラベル（日本語）
- 次回復習日のプレビュー（例: "3日後"）
- 色分け（Again:赤, Hard:オレンジ, Good:緑, Easy:青）

### モバイル対応
- ボタンは十分な大きさ（タップしやすい）
- スワイプ操作対応（左:Again, 上:Hard, 右:Good, 上右:Easy）は将来対応

## 技術仕様

### 評価処理
```typescript
async function submitRating(cardId: string, rating: Rating, timeSpent: number) {
  // 1. FSRSで次回復習日を計算（F-023）
  const { nextDue, newState } = calculateNextReview(card, rating)

  // 2. カードのFSRSパラメータを更新
  await supabase
    .from('cards')
    .update({
      fsrs_stability: newState.stability,
      fsrs_difficulty: newState.difficulty,
      fsrs_state: newState.state,
      fsrs_due: nextDue.toISOString(),
      fsrs_last_review: new Date().toISOString(),
      fsrs_reps: card.fsrs_reps + 1,
      fsrs_lapses: rating === 'again' ? card.fsrs_lapses + 1 : card.fsrs_lapses
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
      scheduled_days: card.fsrs_scheduled_days,
      elapsed_days: calculateElapsedDays(card.fsrs_last_review),
      fsrs_stability: newState.stability,
      fsrs_difficulty: newState.difficulty,
      fsrs_state: newState.state,
      reviewed_at: new Date().toISOString()
    })
}
```

### 次回復習日プレビュー
```typescript
function getNextDuePreview(card: Card, rating: Rating): string {
  const { nextDue } = calculateNextReview(card, rating)
  const days = differenceInDays(nextDue, new Date())

  if (days < 1) return '< 10分'
  if (days === 1) return '明日'
  return `${days}日後`
}
```

## 未確定事項

- 【要確認】評価ボタンの配置順序（左から Again/Hard/Good/Easy で適切か）
- 【要確認】スワイプ操作による評価の対応時期
- 【仮定】4段階評価はFSRS標準と仮定（2段階簡易モードは後日検討）
