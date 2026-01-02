# F-023: FSRS次回復習日設定

> 関連: [ビジネス要件](../business-requirements.md) | [機能一覧](./_index.md)

## 基本情報

| 項目 | 内容 |
|-----|-----|
| 機能ID | F-023 |
| 優先度 | P0 |
| 関連US | F-023 |
| ステータス | Draft |

## 概要

FSRS（Free Spaced Repetition Scheduler）アルゴリズムを使用して、ユーザーの評価結果に基づき次回復習日を自動計算する。FSRSは機械学習で最適化された最新のSRSアルゴリズムで、SM-2比で20-30%の学習効率向上が期待できる。

## FSRSアルゴリズム概要

### 主要パラメータ

| パラメータ | 説明 | 初期値 |
|-----------|------|-------|
| stability (S) | 記憶の安定性。90%の確率で思い出せる間隔 | 0 |
| difficulty (D) | カードの難易度。0-10のスケール | 0 |
| state | 学習状態 | 'new' |

### 状態遷移

```
new → learning → review
           ↑        ↓
           └─ relearning ←┘
```

| 状態 | 説明 |
|-----|------|
| new | 未学習 |
| learning | 初回学習中（短期間隔で復習） |
| review | 通常復習（長期間隔） |
| relearning | 忘却後の再学習（Againを選択した場合） |

## ユーザーフロー

1. **[前提]** ユーザーが評価（Again/Hard/Good/Easy）を選択（F-022から）
2. **[システム]** FSRSアルゴリズムで次回復習日を計算
3. **[システム]** カードのFSRSパラメータを更新
4. **[完了]** 次のカードへ進む

## 入力/出力

| 種別 | 項目名 | 型 | 必須 | 説明 | 制約・バリデーション |
|-----|-------|---|-----|-----|-------------------|
| 入力 | card | Card | Yes | 現在のカード状態 | FSRSパラメータ含む |
| 入力 | rating | Rating | Yes | ユーザー評価 | 'again' \| 'hard' \| 'good' \| 'easy' |
| 入力 | now | Date | Yes | 評価時刻 | - |
| 出力 | nextDue | Date | - | 次回復習日 | - |
| 出力 | newState | FSRSState | - | 更新後のFSRS状態 | stability, difficulty, state |

## ビジネスルール

| ID | ルール | 条件 | 結果 |
|----|-------|-----|-----|
| BR-F023-01 | 初回学習 | state='new' | learningへ遷移、短い間隔で復習 |
| BR-F023-02 | Again評価 | 任意のstate | relearningへ遷移、stability低下 |
| BR-F023-03 | Good/Easy評価 | learning状態 | reviewへ昇格 |
| BR-F023-04 | 間隔計算 | review状態 | S × 目標保持率 で間隔決定 |
| BR-F023-05 | 難易度更新 | 毎回の評価後 | D = D + 調整値 |

## 計算ロジック

### 次回復習間隔の計算
```typescript
// 目標保持率（90%で思い出せる間隔を計算）
const TARGET_RETENTION = 0.9

function calculateInterval(stability: number): number {
  // FSRS公式: I = S × ln(target) / ln(0.9)
  // 簡略化: I ≈ S × 9 (目標保持率90%の場合)
  return Math.round(stability * 9)
}
```

### 評価による安定性の更新
```typescript
function updateStability(
  currentStability: number,
  difficulty: number,
  rating: Rating,
  elapsedDays: number
): number {
  const ratingMultiplier = {
    again: 0,      // リセット
    hard: 0.8,     // 減少
    good: 1.0,     // 維持
    easy: 1.3      // 増加
  }

  // 新しい安定性 = 基本値 × 難易度調整 × 評価調整
  const baseStability = elapsedDays > 0
    ? currentStability * (1 + Math.log(elapsedDays + 1))
    : 1

  return baseStability * ratingMultiplier[rating] * (11 - difficulty) / 10
}
```

## データモデル

### FSRSState
```typescript
type FSRSState = {
  stability: number       // 安定性（日数）
  difficulty: number      // 難易度（0-10）
  state: 'new' | 'learning' | 'review' | 'relearning'
  due: Date               // 次回復習日
  lastReview: Date | null // 最終復習日
  reps: number            // 復習回数
  lapses: number          // 忘却回数（Again選択回数）
}
```

## 受け入れ条件（AC）

- [ ] AC-01: 評価に応じて次回復習日が自動設定されること
- [ ] AC-02: Again評価で短期間（同日中）に再出題されること
- [ ] AC-03: Easy評価で間隔が大幅に延長されること
- [ ] AC-04: 新規カードは短い間隔から始まること
- [ ] AC-05: 復習を重ねるごとに間隔が徐々に延びること
- [ ] AC-06: 次回復習日のプレビューが評価前に表示されること

## 技術仕様

### FSRSライブラリ
```typescript
// packages/srs/src/fsrs.ts
import { FSRS, Rating, Card as FSRSCard } from 'ts-fsrs'

const fsrs = new FSRS({
  request_retention: 0.9,  // 目標保持率90%
  maximum_interval: 36500, // 最大間隔100年
  w: [                     // 最適化済みパラメータ
    0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01,
    1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61
  ]
})

export function calculateNextReview(card: Card, rating: Rating) {
  const fsrsCard = toFSRSCard(card)
  const result = fsrs.repeat(fsrsCard, new Date())

  return {
    nextDue: result[rating].card.due,
    newState: {
      stability: result[rating].card.stability,
      difficulty: result[rating].card.difficulty,
      state: result[rating].card.state
    }
  }
}
```

### 評価オプションのプレビュー
```typescript
export function getSchedulingOptions(card: Card): SchedulingOption[] {
  const fsrsCard = toFSRSCard(card)
  const result = fsrs.repeat(fsrsCard, new Date())

  return [
    { rating: 'again', due: result[Rating.Again].card.due },
    { rating: 'hard', due: result[Rating.Hard].card.due },
    { rating: 'good', due: result[Rating.Good].card.due },
    { rating: 'easy', due: result[Rating.Easy].card.due }
  ]
}
```

## 参考リソース

- [FSRS Algorithm Wiki](https://github.com/open-spaced-repetition/fsrs4anki/wiki/abc-of-fsrs)
- [ts-fsrs NPM Package](https://www.npmjs.com/package/ts-fsrs)
- [FSRS vs SM-2 Comparison](https://github.com/open-spaced-repetition/fsrs4anki/wiki/Comparison-with-SM-2)

## 未確定事項

- 【要確認】FSRSのパラメータをユーザーの学習履歴で最適化するか
- 【要確認】目標保持率（90%）をユーザーが変更できるようにするか
- 【仮定】ts-fsrsライブラリを使用と仮定（自前実装ではなく）
