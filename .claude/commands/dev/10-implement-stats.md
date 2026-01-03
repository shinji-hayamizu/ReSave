---
description: 統計機能実装。日別学習統計、ストリーク、累計統計を構築する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: [出力先ディレクトリ (例: apps/web)]
---

# 統計機能実装

日別学習統計、正答率、学習時間、連続学習日数（ストリーク）、累計統計機能を実装する。

## 前提

以下が完了済みであること:
- 学習・レビュー機能（`/dev:09-implement-study`）

**アーキテクチャファイルの場所（優先順）:**
1. `.kiro/specs/*/design.md` (Kiroスペック)
2. `docs/requirements/architecture.md` (標準)

**機能仕様の場所:**
- `docs/requirements/functions/stats/F-030-daily-stats.md`

---

## 参照ドキュメント（必須読み込み）

以下のドキュメントを読み込み、統計機能要件を特定すること:

1. **機能仕様（stats/F-030）** - 日別統計、累計統計、ストリーク計算

---

## あなたの役割

データ可視化に精通したフルスタックエンジニア。
学習統計を分かりやすく表示し、ユーザーの学習習慣の把握とモチベーション維持を支援する。

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
| 統計ページ | `{root}/src/app/(main)/stats/` |
| 統計コンポーネント | `{root}/src/components/stats/` |
| Server Actions | `{root}/src/actions/stats.ts` |
| フック | `{root}/src/hooks/useStats.ts` |

### 1.2 統計要件の確認

機能仕様から以下を確認:
- 今日の統計（学習カード数、正答率、学習時間、連続学習日数）
- 日別履歴（過去30日）
- 累計統計（総カード数、総復習回数、最長ストリーク、平均正答率）
- ストリーク計算ロジック

---

## Step 2: 型定義

### 2.1 統計関連型定義

#### {root}/src/types/stats.ts

- TodayStats型（reviewedCount, correctCount, incorrectCount, accuracyRate, timeSpentMinutes, newCardsLearned）
- DailyStats型（date, reviewedCount, correctCount, timeSpentMinutes）
- Summary型（totalCards, totalReviews, currentStreak, longestStreak, averageAccuracy）
- StatsResponse型（today, history, summary）

---

## Step 3: Server Actions

### 3.1 統計アクション

#### {root}/src/actions/stats.ts

以下のServer Actionsを実装:
- `getTodayStats()` - 今日の統計取得
- `getDailyStats(days: number)` - 日別履歴取得（過去N日）
- `getSummary()` - 累計統計取得
- `getStats(period?: 'today' | 'week' | 'month')` - 統合取得

統計計算:
- 正答率: (OK + 覚えた) / 全評価 × 100
- 学習時間: time_spent_msの合計を分単位
- ストリーク: 連続で学習した日数

---

## Step 4: ストリーク計算ロジック

### 4.1 calculateStreak

#### {root}/src/lib/streak.ts

```typescript
function calculateStreak(dailyStats: DailyStats[]): number
function calculateLongestStreak(dailyStats: DailyStats[]): number
```

ビジネスルール:
- 1日でも学習すればカウント継続
- 前日未学習でリセット
- 今日未学習でも昨日まで連続ならカウント維持

---

## Step 5: TanStack Queryフック

### 5.1 useStats

#### {root}/src/hooks/useStats.ts

- `useStats(period?)` - 統合統計取得
- `useTodayStats()` - 今日の統計取得
- `useDailyStats(days)` - 日別履歴取得
- `useSummary()` - 累計統計取得

クエリキー設計:
```typescript
export const statsKeys = {
  all: ['stats'] as const,
  today: () => [...statsKeys.all, 'today'] as const,
  daily: (days: number) => [...statsKeys.all, 'daily', days] as const,
  summary: () => [...statsKeys.all, 'summary'] as const,
}
```

---

## Step 6: 統計画面

### 6.1 統計ページ

#### {root}/src/app/(main)/stats/page.tsx

統計画面の構成:
- TodaySummary（今日の学習サマリー）
- PeriodTabs（期間切替タブ）
- StatsChart（日別学習グラフ）
- CumulativeStats（累計統計）

---

## Step 7: 今日の学習サマリー

### 7.1 TodaySummary

#### {root}/src/components/stats/today-summary.tsx

4項目グリッド表示:
- 学習カード数（青系）
- 正答率（緑系）
- 学習時間（通常色）
- 連続学習日数（黄系）

レスポンシブ: モバイル2x2 → デスクトップ4x1

---

## Step 8: 期間切替タブ

### 8.1 PeriodTabs

#### {root}/src/components/stats/period-tabs.tsx

3タブ構成:
- 今日（today）
- 週間（week）
- 月間（month）

---

## Step 9: 統計グラフ

### 9.1 StatsChart

#### {root}/src/components/stats/stats-chart.tsx

日別学習カード数のバーチャート:
- 過去7日（週間）または30日（月間）
- 各日の学習カード数をバー表示
- 日付ラベル（曜日または日付）

簡易実装（ライブラリなし）:
- div要素の高さで表現
- CSSグリッドでレイアウト

---

## Step 10: 累計統計

### 10.1 CumulativeStats

#### {root}/src/components/stats/cumulative-stats.tsx

4項目グリッド表示:
- 総カード数（Layersアイコン）
- 総復習回数（RotateCcwアイコン）
- 最長ストリーク（Flameアイコン）
- 平均正答率（Targetアイコン）

レスポンシブ: モバイル2x2 → デスクトップ4x1

---

## Step 11: PostgreSQL関数（オプション）

### 11.1 get_daily_stats

集計を効率化するためのRPC関数（Supabase Migration）:

```sql
CREATE OR REPLACE FUNCTION get_daily_stats(p_user_id uuid, p_days int)
RETURNS TABLE (
  date date,
  reviewed_count bigint,
  correct_count bigint,
  time_spent_minutes bigint
)
```

---

## 完了条件

- [ ] 型定義が作成されている
- [ ] Server Actions（統計取得）が作成されている
- [ ] ストリーク計算ロジックが実装されている
- [ ] TanStack Queryフックが作成されている
- [ ] 統計画面が表示される
- [ ] 今日の学習サマリーが表示される
- [ ] 期間切替タブが動作する
- [ ] 日別学習グラフが表示される
- [ ] 累計統計が表示される
- [ ] ストリークが正しく計算される
- [ ] 正答率が正しく計算される

---

## 完了後のアクション

```
## 統計機能実装が完了しました

### 作成されたファイル
- {root}/src/types/stats.ts
- {root}/src/lib/streak.ts
- {root}/src/actions/stats.ts
- {root}/src/hooks/useStats.ts
- {root}/src/app/(main)/stats/page.tsx
- {root}/src/components/stats/today-summary.tsx
- {root}/src/components/stats/period-tabs.tsx
- {root}/src/components/stats/stats-chart.tsx
- {root}/src/components/stats/cumulative-stats.tsx

### 動作確認結果
| 項目 | 状態 |
|------|------|
| 今日の統計 | [Success/Failed] |
| 期間切替 | [Success/Failed] |
| 日別グラフ | [Success/Failed] |
| 累計統計 | [Success/Failed] |
| ストリーク計算 | [Success/Failed] |
| 正答率計算 | [Success/Failed] |

### 完了したフェーズ
全機能実装が完了しました！

### 推奨される次のアクション
- E2Eテストの実装
- パフォーマンス最適化
- Mobile（Expo）への展開
```

---

## 関連コマンド
- `/dev:07-implement-cards` - カードCRUD機能
- `/dev:08-implement-tags` - タグ管理機能
- `/dev:09-implement-study` - 学習・レビュー機能
