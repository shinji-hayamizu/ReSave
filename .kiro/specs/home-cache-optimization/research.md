# Research & Design Decisions

## Summary
- **Feature**: `home-cache-optimization`
- **Discovery Scope**: Extension（既存キャッシュ戦略の最適化）
- **Key Findings**:
  - 現在3つのクエリ（newCards, todayCards, completedCards）が独立してキャッシュされ、ミューテーション時に4〜5つのキャッシュを無効化
  - 楽観的更新コンテキストが5つのスナップショットを保持し、メモリを圧迫
  - QuickInputFormとCardTabsがメモ化されておらず、activeTab変更で不要な再レンダリング発生

## Research Log

### TanStack Query キャッシュ戦略
- **Context**: 現在のホーム画面は3つの独立したクエリを使用
- **Sources Consulted**:
  - TanStack Query v5 ドキュメント
  - 既存コード `hooks/useCards.ts`
- **Findings**:
  - `cardKeys.new()`, `cardKeys.today()`, `cardKeys.todayCompleted()` が別々にキャッシュ
  - `onSettled` で4つのクエリを `invalidateQueries` → 過剰なリフェッチ
  - `setQueryData` での直接更新が可能だが、現在は `invalidateQueries` を使用
- **Implications**:
  - 単一キャッシュ `['cards', 'home']` に統合し、`useMemo` で派生データを生成
  - ミューテーション後は `setQueryData` で直接更新、`invalidateQueries` を削除

### React.memo と useCallback パターン
- **Context**: コンポーネントのメモ化状況調査
- **Sources Consulted**:
  - `components/home/quick-input-form.tsx`
  - `components/home/card-tabs.tsx`
  - `components/home/home-study-card.tsx`（memo済み）
- **Findings**:
  - QuickInputForm: メモ化なし、内部で `useCreateCard` を呼び出し
  - CardTabs: メモ化なし、props駆動の純粋なUIコンポーネント
  - HomeStudyCard: `memo()` 済み、`useCallback` も適用済み
- **Implications**:
  - QuickInputForm と CardTabs を `memo()` でラップ
  - 親の DashboardPage でコールバックを `useCallback` でメモ化

### Supabase クエリ統合
- **Context**: 3つのServer Actionを1つに統合する可能性
- **Sources Consulted**:
  - `actions/cards.ts` の `getNewCards`, `getTodayCards`, `getTodayCompletedCards`
- **Findings**:
  - `getNewCards`: `status = 'new'` でフィルタ
  - `getTodayCards`: `status = 'active'` かつ `next_review_at <= today`
  - `getTodayCompletedCards`: `status = 'completed'` または今日の `study_logs` に存在
  - 3つのクエリは異なる条件だが、OR条件で1クエリに統合可能
  - 完了タブは `study_logs` との結合が必要で、追加クエリが発生
- **Implications**:
  - `getHomeCards()` で全カードを取得し、クライアント側でフィルタリング
  - `todayStudiedCardIds` を別途取得してレスポンスに含める

### gcTime と staleTime の最適値
- **Context**: 現在のキャッシュ設定の調査
- **Sources Consulted**:
  - `components/providers.tsx`
  - TanStack Query ドキュメント
- **Findings**:
  - 現在: `staleTime: 60秒`, `gcTime: 5分`
  - `gcTime` はメモリからの削除までの時間
  - ホーム画面はデータ更新頻度が高いため、短めが適切
- **Implications**:
  - `gcTime`: 5分 → 2分
  - `staleTime`: ホーム専用に30秒を設定

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 単一キャッシュ + 派生 | 1つのクエリで全データ取得、useMemoで分割 | メモリ削減、単一無効化ポイント | クライアント側フィルタリングのオーバーヘッド | 採用 |
| 正規化キャッシュ | エンティティごとにIDベースで正規化 | 重複なし、参照整合性 | 実装複雑、TanStack Queryの標準パターンから外れる | 不採用 |
| 現状維持 + 最適化 | 3クエリ維持、invalidateを精密化 | 変更最小 | 根本解決にならない | 不採用 |

## Design Decisions

### Decision: 単一データソースパターンの採用
- **Context**: 3つの独立クエリによるメモリ重複とinvalidation storm
- **Alternatives Considered**:
  1. 正規化キャッシュ（redux-toolkitのentityAdapter的アプローチ）
  2. クエリ維持 + 精密な invalidation
  3. 単一クエリ + クライアント派生
- **Selected Approach**: 単一クエリ + クライアント派生
- **Rationale**:
  - TanStack Queryの標準パターンに沿っている
  - 実装が比較的シンプル
  - メモリ使用量が大幅に削減される
- **Trade-offs**:
  - クライアント側でフィルタリングするCPUコスト（軽微）
  - 初期データ量が増える可能性（全カード取得）
- **Follow-up**: パフォーマンス計測でフィルタリングコストを検証

### Decision: ホーム専用フックの分離
- **Context**: 既存フックを修正すると `/cards` ページに影響
- **Alternatives Considered**:
  1. 既存フックを修正
  2. 新規フックを作成して共存
- **Selected Approach**: 新規フック `useHomeCards.ts` を作成
- **Rationale**:
  - 既存機能への影響なし
  - 段階的移行が可能
  - 責務の分離
- **Trade-offs**:
  - コードの重複（一部ロジック）
  - 2つのキャッシュ戦略が共存

### Decision: コンポーネントメモ化戦略
- **Context**: activeTab変更でQuickInputFormとCardTabsが再レンダリング
- **Selected Approach**:
  - QuickInputForm, CardTabs を `React.memo()` でラップ
  - DashboardPage でコールバックを `useCallback` でメモ化
  - `counts` オブジェクトを `useMemo` で安定化
- **Rationale**:
  - 最小限の変更で最大の効果
  - React標準のパフォーマンス最適化パターン

## Risks & Mitigations
- **Risk 1**: 全カード取得による初期ロード遅延 → ページネーションは将来対応、現状はカード数が限定的と想定
- **Risk 2**: 既存フックとの不整合 → 既存フックは維持し、新規フックは独立したキャッシュキーを使用
- **Risk 3**: Suspense境界導入による複雑化 → 段階的導入、まずはキャッシュ最適化を優先

## References
- [TanStack Query - Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [React.memo](https://react.dev/reference/react/memo)
- [Supabase - JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
