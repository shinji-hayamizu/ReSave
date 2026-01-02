# F-030: 日別学習統計

> 関連: [ビジネス要件](../business-requirements.md) | [機能一覧](./_index.md)

## 基本情報

| 項目 | 内容 |
|-----|-----|
| 機能ID | F-030 |
| 優先度 | P0 |
| 関連US | F-030 |
| ステータス | Draft |

## 概要

ユーザーが日別の学習カード数を確認し、学習習慣を把握できるようにする。ホーム画面でのサマリー表示と、詳細な統計画面を提供する。

## ユーザーフロー

### ホーム画面でのサマリー確認
1. **[トリガー]** ユーザーがホーム画面にアクセス
2. **[システム]** 今日の学習統計を表示
3. **[完了]** 学習カード数、正答率が表示される

### 詳細統計の確認
1. **[トリガー]** ユーザーが「統計」タブをタップ
2. **[システム]** 過去の学習履歴を集計して表示
3. **[完了]** 日別・週別のグラフ、累計統計が表示される

## 入力/出力

| 種別 | 項目名 | 型 | 必須 | 説明 | 制約・バリデーション |
|-----|-------|---|-----|-----|-------------------|
| 入力 | period | string | No | 集計期間 | 'today' \| 'week' \| 'month' \| 'all' |
| 出力 | todayStats | TodayStats | - | 今日の統計 | reviewed, correct, time |
| 出力 | history | DailyStats[] | - | 日別履歴 | 過去30日分 |
| 出力 | summary | Summary | - | 累計サマリー | totalCards, totalReviews, streak |

## ビジネスルール

| ID | ルール | 条件 | 結果 |
|----|-------|-----|-----|
| BR-F030-01 | 日付境界 | 統計集計時 | ユーザーのタイムゾーンで日付を判定 |
| BR-F030-02 | 正答率計算 | 評価結果から | (Good + Easy) / 全評価 × 100 |
| BR-F030-03 | 学習時間 | review_logsから | time_spent_msの合計を分単位で表示 |
| BR-F030-04 | ストリーク | 連続学習日数 | 1日でも学習すればカウント継続 |
| BR-F030-05 | ストリーク途切れ | 前日未学習 | ストリークを0にリセット |

## データモデル

### TodayStats
```typescript
type TodayStats = {
  reviewedCount: number    // 今日復習したカード数
  correctCount: number     // Good + Easy の数
  incorrectCount: number   // Again + Hard の数
  accuracyRate: number     // 正答率（%）
  timeSpentMinutes: number // 学習時間（分）
  newCardsLearned: number  // 新規学習カード数
}
```

### DailyStats
```typescript
type DailyStats = {
  date: string             // YYYY-MM-DD
  reviewedCount: number
  correctCount: number
  timeSpentMinutes: number
}
```

### Summary
```typescript
type Summary = {
  totalCards: number       // 総カード数
  totalReviews: number     // 累計復習回数
  currentStreak: number    // 現在のストリーク
  longestStreak: number    // 最長ストリーク
  averageAccuracy: number  // 平均正答率
}
```

## エラーケース

| ID | 条件 | エラーメッセージ | 対処 |
|----|-----|----------------|-----|
| E-F030-01 | 統計取得失敗 | 統計データの取得に失敗しました | リトライ |

## 受け入れ条件（AC）

- [ ] AC-01: 今日学習したカード数が表示されること
- [ ] AC-02: 今日の正答率が表示されること
- [ ] AC-03: 今日の学習時間が表示されること
- [ ] AC-04: 過去30日の学習履歴が確認できること
- [ ] AC-05: 連続学習日数（ストリーク）が表示されること
- [ ] AC-06: 学習がない日は0としてカウントされること

## 画面要件

### ホーム画面サマリー
```
┌─────────────────────────────┐
│  今日の学習                  │
│                             │
│  📚 15枚  ✅ 87%  ⏱️ 12分   │
│  🔥 連続 7日               │
└─────────────────────────────┘
```

### 統計詳細画面
- 期間切替タブ（今日 / 週間 / 月間）
- 日別学習カード数の棒グラフ
- 正答率の推移グラフ
- 累計統計
  - 総カード数
  - 総復習回数
  - 最長ストリーク
  - 平均正答率

### ヒートマップ（将来対応）
- GitHubのContribution graphのような表示
- 色の濃さで学習量を表現

## 技術仕様

### Supabase連携
```typescript
// 今日の統計
const today = new Date()
today.setHours(0, 0, 0, 0)

const { data: todayLogs } = await supabase
  .from('review_logs')
  .select('rating, time_spent_ms')
  .eq('user_id', userId)
  .gte('reviewed_at', today.toISOString())

const todayStats = {
  reviewedCount: todayLogs.length,
  correctCount: todayLogs.filter(l => l.rating === 'good' || l.rating === 'easy').length,
  timeSpentMinutes: Math.round(
    todayLogs.reduce((sum, l) => sum + l.time_spent_ms, 0) / 60000
  )
}

// 日別履歴（過去30日）
const { data: history } = await supabase
  .rpc('get_daily_stats', {
    user_id: userId,
    days: 30
  })
```

### PostgreSQL関数
```sql
CREATE OR REPLACE FUNCTION get_daily_stats(p_user_id uuid, p_days int)
RETURNS TABLE (
  date date,
  reviewed_count bigint,
  correct_count bigint,
  time_spent_minutes bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(reviewed_at) as date,
    COUNT(*) as reviewed_count,
    COUNT(*) FILTER (WHERE rating IN ('good', 'easy')) as correct_count,
    ROUND(SUM(time_spent_ms) / 60000) as time_spent_minutes
  FROM review_logs
  WHERE user_id = p_user_id
    AND reviewed_at >= CURRENT_DATE - p_days
  GROUP BY DATE(reviewed_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;
```

### ストリーク計算
```typescript
function calculateStreak(dailyStats: DailyStats[]): number {
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i <= 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - i)
    const dateStr = checkDate.toISOString().split('T')[0]

    const dayStats = dailyStats.find(s => s.date === dateStr)
    if (dayStats && dayStats.reviewedCount > 0) {
      streak++
    } else if (i > 0) {
      // 今日は学習していなくてもOK、昨日以前で途切れたらストップ
      break
    }
  }

  return streak
}
```

## 未確定事項

- 【要確認】ストリークの開始時間（深夜0時固定 or ユーザー設定）
- 【要確認】統計のエクスポート機能が必要か
- 【仮定】タイムゾーンはデバイスの設定に従うと仮定
