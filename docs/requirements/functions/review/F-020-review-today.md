# F-020: 今日の復習カード

> 関連: [ビジネス要件](../business-requirements.md) | [機能一覧](./_index.md)

## 基本情報

| 項目 | 内容 |
|-----|-----|
| 機能ID | F-020 |
| 優先度 | P0 |
| 関連US | F-020 |
| ステータス | Draft |

## 概要

ユーザーが今日復習すべきカードを確認し、効率的に学習できるようにする。固定間隔スケジューリングに基づいて次回復習日（next_review_date）が今日以前のカードを抽出する。

## ユーザーフロー

1. **[トリガー]** ユーザーがホーム画面にアクセス
2. **[システム]** 今日の復習対象カードを集計
3. **[システム]** 復習カード数と新規カード数を表示
4. **[ユーザー]** 「学習開始」をタップ
5. **[完了]** 学習セッションが開始される（F-021へ）

## 入力/出力

| 種別 | 項目名 | 型 | 必須 | 説明 | 制約・バリデーション |
|-----|-------|---|-----|-----|-------------------|
| 入力 | tagIds | string[] | No | フィルタするタグ | 空の場合は全カード |
| 出力 | reviewCount | number | - | 復習対象カード数 | next_review_date <= today |
| 出力 | newCount | number | - | 新規カード数 | state = 'new' |
| 出力 | totalStudyTime | number | - | 推定学習時間（分） | カード数 x 平均所要時間 |

## ビジネスルール

| ID | ルール | 条件 | 結果 |
|----|-------|-----|-----|
| BR-F020-01 | 復習対象抽出 | next_review_date <= 今日の終わり | 復習リストに含める |
| BR-F020-02 | 新規カード | state = 'new' | 新規カードとしてカウント |
| BR-F020-03 | 優先順位 | 学習時 | 期限超過(overdue) > 新規(new) > 期限内(due today) |
| BR-F020-04 | 1日の制限 | 新規カード | デフォルト20枚/日（設定で変更可能） |
| BR-F020-05 | タグフィルタ | タグ指定時 | 該当タグのカードのみカウント |
| BR-F020-06 | 完了カード除外 | state = 'completed' | 復習リストに含めない |

## カード状態

| 状態 | 説明 |
|------|------|
| new | 未学習 |
| learning | 学習中（固定間隔で復習中） |
| completed | 完了一覧（復習終了） |

## データ抽出ロジック

```typescript
// 復習対象カード（学習中で復習日が今日以前）
const reviewCards = cards.filter(card =>
  card.state === 'learning' &&
  new Date(card.next_review_date) <= endOfToday
)

// 新規カード（1日の上限内）
const newCards = cards.filter(card =>
  card.state === 'new'
).slice(0, dailyNewCardLimit)

// 推定学習時間（1カード平均30秒と仮定）
const estimatedMinutes = Math.ceil((reviewCards.length + newCards.length) * 0.5)
```

## エラーケース

| ID | 条件 | エラーメッセージ | 対処 |
|----|-----|----------------|-----|
| E-F020-01 | 取得失敗 | カードの取得に失敗しました | リトライ |

## 受け入れ条件（AC）

- [ ] AC-01: ホーム画面に今日の復習カード数が表示されること
- [ ] AC-02: 新規カード数が別途表示されること
- [ ] AC-03: 復習対象がない場合、「本日の復習は完了です」と表示されること
- [ ] AC-04: タグでフィルタした場合、該当タグのカードのみがカウントされること
- [ ] AC-05: 推定学習時間が表示されること
- [ ] AC-06: 完了一覧のカードは復習対象に含まれないこと

## 画面要件

### ホーム画面（ダッシュボード）
- 今日の復習サマリー
  - 復習カード数（例: 復習 15枚）
  - 新規カード数（例: 新規 5枚）
  - 推定学習時間（例: 約10分）
- 「学習開始」ボタン（大きく目立つ）
- タグフィルタ（任意）
- 復習完了時の達成メッセージ

### サマリーカード
```
┌─────────────────────────────┐
│  今日の学習                  │
│                             │
│  復習: 15枚  新規: 5枚       │
│  推定時間: 約10分            │
│                             │
│  [────────────] 0%          │
│                             │
│     [ 学習開始 ]            │
└─────────────────────────────┘
```

## 技術仕様

### Supabase連携
```typescript
// 今日の復習対象を取得
const today = new Date()
today.setHours(23, 59, 59, 999)

const { data: reviewCards, count: reviewCount } = await supabase
  .from('cards')
  .select('*', { count: 'exact' })
  .eq('user_id', userId)
  .eq('state', 'learning')
  .lte('next_review_date', today.toISOString())

const { data: newCards, count: newCount } = await supabase
  .from('cards')
  .select('*', { count: 'exact' })
  .eq('user_id', userId)
  .eq('state', 'new')
```

### TanStack Query Hook
```typescript
export function useTodayReview(tagIds?: string[]) {
  return useQuery({
    queryKey: ['review', 'today', tagIds],
    queryFn: () => fetchTodayReview(tagIds),
    staleTime: 1000 * 60, // 1分キャッシュ
  })
}
```

## 未確定事項

- 【要確認】1日の新規カード上限のデフォルト値（20枚で適切か）
- 【要確認】推定学習時間の計算方法（過去の実績ベースにするか）
- 【仮定】1カードあたり30秒で計算と仮定
