---
description: 学習・レビュー機能（今日の復習、評価、スケジューリング）実装。間隔反復学習の中核機能を構築する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: [出力先ディレクトリ (例: apps/web)]
---

# 学習・レビュー機能実装

今日の復習カード抽出、カード学習、3段階評価、固定間隔スケジューリング機能を実装する。

## 前提

以下が完了済みであること:
- カードCRUD機能（`/dev:07-implement-cards`）
- タグ管理機能（`/dev:08-implement-tags`）

**アーキテクチャファイルの場所（優先順）:**
1. `.kiro/specs/*/design.md` (Kiroスペック)
2. `docs/requirements/architecture.md` (標準)

**機能仕様の場所:**
- `docs/requirements/functions/review/F-020-review-today.md`
- `docs/requirements/functions/review/F-021-card-study.md`
- `docs/requirements/functions/review/F-022-self-assessment.md`
- `docs/requirements/functions/review/F-023-interval-scheduling.md`

---

## 参照ドキュメント（必須読み込み）

以下のドキュメントを読み込み、学習機能要件を特定すること:

1. **機能仕様（review/）** - 今日の復習、学習フロー、評価、スケジューリング
2. **CLAUDE.md** - 復習スケジューリング仕様（固定間隔: 1,3,7,14,30,180日）

---

## あなたの役割

学習アルゴリズムに精通したフルスタックエンジニア。
間隔反復学習の中核機能を実装し、ユーザーの学習効率を最大化する。

## 実行方法

- このタスクは **ultrathink** で実行すること
- **各コンポーネント作成はsubAgentで並列実行**すること

---

## Step 1: プロジェクト構造の確認

### 1.1 出力先の特定

引数 `$ARGUMENTS` からプロジェクトルートを特定。

| 項目 | 確認内容 |
|------|---------|
| プロジェクトルート | $ARGUMENTS (例: `apps/web`) |
| ホームページ | `{root}/src/app/(main)/page.tsx` |
| 学習コンポーネント | `{root}/src/components/study/` |
| Server Actions | `{root}/src/actions/review.ts` |
| フック | `{root}/src/hooks/useStudy.ts` |
| スケジューリングロジック | `{root}/src/lib/scheduling.ts` |

### 1.2 学習要件の確認

機能仕様から以下を確認:
- 復習対象抽出条件（next_review_date <= 今日）
- 3段階評価（OK/覚えた/もう一度）
- 固定間隔（1,3,7,14,30,180日）
- 優先順位（overdue > new > due today）

---

## Step 2: 型定義とZodスキーマ

### 2.1 学習関連型定義

#### {root}/src/types/review.ts

- Rating型（'ok' | 'learned' | 'again'）
- ReviewLog型（id, card_id, user_id, rating, time_spent_ms, interval_index, reviewed_at）
- TodayReview型（reviewCount, newCount, totalStudyTime）
- StudySession型（cards, currentIndex, startedAt, results）
- ScheduleResult型（nextReviewDate, newIntervalIndex, newState）

### 2.2 Zodスキーマ

#### {root}/src/validations/review.ts

- submitRatingSchema: cardId, rating, timeSpent

---

## Step 3: スケジューリングロジック

### 3.1 固定間隔スケジューリング

#### {root}/src/lib/scheduling.ts

```typescript
const DEFAULT_INTERVALS = [1, 3, 7, 14, 30, 180]

function calculateNextReview(card: Card, rating: Rating, intervals?: number[]): ScheduleResult
function getSchedulingOptions(card: Card, intervals?: number[]): SchedulingOption[]
function getNextReviewPreview(card: Card, rating: Rating): string
```

ビジネスルール:
- OK: 次の間隔へ進む（最終間隔後は完了）
- 覚えた: 即座に完了一覧へ
- もう一度: interval_index=0にリセット

---

## Step 4: Server Actions

### 4.1 レビューアクション

#### {root}/src/actions/review.ts

以下のServer Actionsを実装:
- `getTodayReview(tagIds?: string[])` - 今日の復習対象取得
- `submitRating(cardId: string, rating: Rating, timeSpent: number)` - 評価送信
- `getReviewLogs(cardId: string)` - 学習ログ取得

評価送信処理:
1. 次回復習日を計算（scheduling.ts使用）
2. カードを更新（state, interval_index, next_review_date, last_review_date, review_count）
3. 学習ログを保存（review_logsテーブル）

---

## Step 5: TanStack Queryフック

### 5.1 useStudy

#### {root}/src/hooks/useStudy.ts

- `useTodayReview(tagIds?)` - 今日の復習サマリー取得
- `useSubmitRating()` - 評価送信mutation
- `useReviewCards(tagIds?)` - 復習対象カード取得

クエリキー設計:
```typescript
export const reviewKeys = {
  all: ['review'] as const,
  today: (tagIds?: string[]) => [...reviewKeys.all, 'today', tagIds] as const,
  cards: (tagIds?: string[]) => [...reviewKeys.all, 'cards', tagIds] as const,
}
```

---

## Step 6: ホーム画面（ダッシュボード）

### 6.1 ホームページ

#### {root}/src/app/(main)/page.tsx

ホーム画面の構成:
- QuickInputForm（クイック入力）
- TodaySummary（今日の学習サマリー）
- CardTabs（未学習/復習中/完了タブ）
- CardList（カード一覧）

### 6.2 TodaySummary

#### {root}/src/components/study/today-summary.tsx

今日の学習サマリーカード:
- 復習カード数
- 新規カード数
- 推定学習時間
- プログレスバー
- 学習開始ボタン

---

## Step 7: カードタブ

### 7.1 CardTabs

#### {root}/src/components/study/card-tabs.tsx

3タブ構成:
- 未学習（state='new'）
- 復習中（state='learning'）
- 完了（state='completed'）

各タブにカード件数バッジ表示。

---

## Step 8: 学習カードコンポーネント

### 8.1 StudyCard

#### {root}/src/components/study/study-card.tsx

カードリスト形式の学習コンポーネント:
- CardTopBar（評価ボタン + タグ）
- 質問表示（テキスト）
- 答えトグルボタン
- 答え表示エリア（hidden_text）
- 編集ボタン

### 8.2 RatingButtons

#### {root}/src/components/study/rating-buttons.tsx

3段階評価ボタン（カード上部に常時表示）:
- OK: 次の間隔へ（プレビュー表示: "3日後"）
- 覚えた: 完了へ（プレビュー表示: "完了"）
- もう一度: リセット（プレビュー表示: "1日後"）

### 8.3 AnswerToggle

#### {root}/src/components/study/answer-toggle.tsx

答えの表示/非表示トグルボタン。

---

## Step 9: 学習完了画面

### 9.1 StudyCompleteModal

#### {root}/src/components/study/study-complete-modal.tsx

学習セッション完了時のモーダル:
- 学習カード数
- 評価内訳（OK/覚えた/もう一度の数）
- 学習時間
- ホームに戻るボタン

---

## Step 10: 状態管理（Zustand）

### 10.1 StudyStore

#### {root}/src/stores/study-store.ts

学習セッション状態管理:
- session: StudySession | null
- currentCard: Card | null
- showAnswer: boolean
- startSession(cards)
- toggleAnswer()
- submitRating(rating)
- endSession()

---

## 完了条件

- [ ] 型定義とZodスキーマが作成されている
- [ ] スケジューリングロジックが実装されている
- [ ] Server Actions（getTodayReview, submitRating）が作成されている
- [ ] TanStack Queryフックが作成されている
- [ ] ホーム画面の今日の学習サマリーが表示される
- [ ] 3タブ（未学習/復習中/完了）が動作する
- [ ] 答えトグル表示が動作する
- [ ] 3段階評価が動作する
- [ ] 評価後に次のカードが表示される
- [ ] 評価結果がDBに保存される
- [ ] 次回復習日プレビューが表示される
- [ ] 学習完了画面が表示される

---

## 完了後のアクション

```
## 学習・レビュー機能実装が完了しました

### 作成されたファイル
- {root}/src/types/review.ts
- {root}/src/validations/review.ts
- {root}/src/lib/scheduling.ts
- {root}/src/actions/review.ts
- {root}/src/hooks/useStudy.ts
- {root}/src/stores/study-store.ts
- {root}/src/app/(main)/page.tsx
- {root}/src/components/study/today-summary.tsx
- {root}/src/components/study/card-tabs.tsx
- {root}/src/components/study/study-card.tsx
- {root}/src/components/study/rating-buttons.tsx
- {root}/src/components/study/answer-toggle.tsx
- {root}/src/components/study/study-complete-modal.tsx

### 動作確認結果
| 項目 | 状態 |
|------|------|
| 今日の復習サマリー | [Success/Failed] |
| タブ切り替え | [Success/Failed] |
| 答えトグル | [Success/Failed] |
| 3段階評価 | [Success/Failed] |
| スケジューリング | [Success/Failed] |
| 学習完了画面 | [Success/Failed] |

### 次のステップ
- 統計機能実装（`/dev:10-implement-stats`）
```

---

## 次のステップ
- `/dev:10-implement-stats` - 統計機能実装
