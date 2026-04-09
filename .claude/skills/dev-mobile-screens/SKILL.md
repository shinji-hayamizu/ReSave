---
name: dev:mobile-screens
description: |
  Phase 3: 全画面のUI作成とhooks接続。並列サブエージェントで画面グループを一括構築。
  認証画面はPhase 1で実装済み。カード、復習、タグ、統計画面を構築。
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent
---

# Phase 3: 全画面UI作成 + hooks接続

## 目的

Phase 1-2で作成した共通コンポーネントとhooksを使って、全画面を実装する。
並列サブエージェントで画面グループを同時構築し、効率化する。

## 前提

- Phase 1（AuthProvider + ナビゲーション + 認証画面）が完了していること
- Phase 2（全TanStack Query hooks）が完了していること
- 認証画面（login, signup, reset-password）は Phase 1 で実装済み

## Stats API Route 追加（前提作業）

Phase 3開始前に、Web側にStats用API Routeを追加する:

**`apps/web/src/app/api/stats/today/route.ts`**
- `GET /api/stats/today`
- Web版 `apps/web/src/actions/stats.ts` の `getTodayStats()` をAPI Route化
- 返り値: `{ reviewedCount, remainingCount, accuracy }`

**`apps/web/src/app/api/stats/daily/route.ts`**
- `GET /api/stats/daily?days=7`
- Web版 `apps/web/src/actions/stats.ts` の `getDailyStats()` をAPI Route化
- 返り値: `{ data: DailyStat[] }`

**`apps/web/src/app/api/stats/summary/route.ts`**
- `GET /api/stats/summary`
- Web版 `apps/web/src/actions/stats.ts` の `getSummaryStats()` をAPI Route化
- 返り値: `{ totalCards, totalReviews, streak, averageAccuracy }`

## 並列実装（サブエージェント）

以下の3グループを **並列サブエージェント** で同時実装する:

### Agent 1: カード画面

**`apps/mobile/app/(tabs)/cards.tsx`** (プレースホルダーを置き換え)
- `useCards()` hookでカード一覧取得
- 既存 `MobileCardList` コンポーネント使用
- Pull-to-refresh（`onRefresh` + `refetch()`）
- カードステータスフィルタ（全て / 新規 / 復習中 / 完了）
- ヘッダーに「+」ボタン → カード作成画面へ遷移

**`apps/mobile/app/cards/new.tsx`**
- カード作成画面
- `CardForm` コンポーネント使用
- `useCreateCard()` mutation
- `createCardSchema` でバリデーション
- 成功時: カード一覧へ戻る + toast

**`apps/mobile/app/cards/[id].tsx`**
- カード詳細・編集画面
- `useCard(id)` で既存データ取得
- `CardForm` コンポーネント使用（初期値あり）
- `useUpdateCard()` mutation
- `useDeleteCard()` mutation（確認ダイアログ付き）

**`apps/mobile/components/cards/CardForm.tsx`**
- 作成/編集共用フォーム
- フィールド: front (TextInput multiline), back (TextInput multiline), sourceUrl (TextInput)
- タグ選択: `useTags()` でタグ一覧取得、チェックボックスまたはチップ選択
- 既存UI使用: `Input`, `Button`, `TagBadge`

### Agent 2: 復習画面

**`apps/mobile/app/(tabs)/index.tsx`** (プレースホルダーを置き換え)
- 復習セッション画面
- `useTodayCards()` で今日の復習カード取得
- カードがない場合: `EmptyState`（「今日の復習はありません」）
- カードがある場合: `StudySession` コンポーネント表示
- 画面上部に `ProgressBar` で進捗表示

**`apps/mobile/components/study/StudySession.tsx`**
- 復習セッション管理コンポーネント
- 状態管理: currentIndex, isFlipped, isSubmitting
- 現在のカードを `StudyCard` コンポーネントで表示
- 回答表示後に `RatingButtons` を表示
- `useSubmitAssessment()` で評価送信
- 評価後: 次のカードへ自動進行
- 全カード完了時: `EmptyState`（「全てのカードを復習しました」）
- **RatingButtonsの値マッピング**: UI側の `'learned'` → API側の `'remembered'`

### Agent 3: タグ + 統計画面

**タグ画面:**

**`apps/mobile/app/(tabs)/tags.tsx`** (プレースホルダーを置き換え)
- `useTags()` でタグ一覧取得
- FlatList で `TagListItem` コンポーネント表示
- 各タグに `TagBadge` + カード枚数
- ヘッダーに「+」ボタン → タグ作成画面へ
- 長押しで編集/削除メニュー

**`apps/mobile/app/tags/new.tsx`**
- タグ作成画面
- `TagForm` コンポーネント使用
- `useCreateTag()` mutation

**`apps/mobile/app/tags/[id].tsx`**
- タグ編集画面
- `useUpdateTag()` mutation
- `useDeleteTag()` mutation（確認ダイアログ付き）

**`apps/mobile/components/tags/TagForm.tsx`**
- 作成/編集共用フォーム
- フィールド: name (Input), color（定義済みカラーパレットから選択）
- カラーパレット: `createTagSchema` の color enum（blue, green, purple, orange, pink, cyan, yellow, gray）
- 各色を丸いPressableとして表示、選択中はリング表示

**`apps/mobile/components/tags/TagListItem.tsx`**
- タグ行コンポーネント
- `TagBadge` + タグ名 + カード枚数

**統計画面:**

**`apps/mobile/app/(tabs)/stats.tsx`** (プレースホルダーを置き換え)
- `useTodayStats()`, `useSummaryStats()`, `useDailyStats(7)` でデータ取得
- セクション構成:
  1. 今日のサマリ（`TodaySummary`）
  2. ストリーク（`StreakCounter`）
  3. 週間グラフ（`DailyChart`）

**`apps/mobile/components/stats/TodaySummary.tsx`**
- 今日の復習数、残り、正答率を表示
- `ProgressBar` で進捗可視化

**`apps/mobile/components/stats/StreakCounter.tsx`**
- 連続学習日数を大きく表示
- 「日連続」ラベル

**`apps/mobile/components/stats/DailyChart.tsx`**
- 過去7日間の棒グラフ
- 外部ライブラリ不使用（View + height計算で簡易棒グラフ）
- 各棒の下に曜日ラベル

## 検証

全Agent完了後:

```bash
cd apps/mobile
npx tsc --noEmit
```

型エラーがあれば修正。

## 注意事項

- 並列Agentは互いに依存しないファイルを編集するため、コンフリクトは発生しない
- 各Agentには Phase 1-2 で作成した hooks/components のパスと使い方を明示的に伝えること
- `RatingButtons` の `onRate` コールバックは `'ok' | 'learned' | 'again'` を返すが、APIは `'ok' | 'remembered' | 'again'` を期待する。`'learned'` → `'remembered'` のマッピングを忘れないこと
