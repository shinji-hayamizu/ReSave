# Research & Design Decisions

## Summary
- **Feature**: performance-optimization
- **Discovery Scope**: Extension（既存システムの最適化）
- **Key Findings**:
  - 全hooksで動的import使用 → トップレベルimportに変更可能
  - React.memo未使用 → コンポーネントメモ化で再レンダリング削減
  - QueryClient設定が最小限 → gcTime, refetchOnWindowFocus追加で最適化
  - next.config.ts空 → optimizePackageImportsでバンドルサイズ削減

## Research Log

### TanStack Query 楽観的更新パターン
- **Context**: カード操作時のUI即時反映を実現するため
- **Sources Consulted**: TanStack Query v5公式ドキュメント
- **Findings**:
  - `onMutate`でキャッシュを先行更新
  - `cancelQueries`で進行中クエリをキャンセル
  - `onError`でロールバック処理
  - `onSettled`で最終的なinvalidateQueries
- **Implications**: useCards, useTags, useStudyの各mutation hookに楽観的更新を追加

### @tanstack/react-virtual 仮想化
- **Context**: 大量カード表示時のDOM最適化
- **Sources Consulted**: @tanstack/react-virtual v3公式ドキュメント
- **Findings**:
  - `useVirtualizer`でスクロールコンテナを仮想化
  - `estimateSize`で行高さを推定
  - `overscan`で先読み行数を設定（ちらつき防止）
  - TanStack Queryと同じエコシステムで統一感
- **Implications**: CardListコンポーネントに仮想化を実装

### React.memo と useCallback
- **Context**: 不要な再レンダリング防止
- **Sources Consulted**: React 19公式ドキュメント
- **Findings**:
  - `React.memo`でprops比較によるレンダリングスキップ
  - `useCallback`でイベントハンドラの参照安定化
  - `useMemo`で計算結果のキャッシュ
  - React 19ではコンパイラ最適化も期待できるが明示的メモ化は有効
- **Implications**: StudyCard, HomeStudyCard, TagBadge, CardListをmemo化

### Next.js 16 optimizePackageImports
- **Context**: バンドルサイズ削減
- **Sources Consulted**: Next.js 16公式ドキュメント
- **Findings**:
  - `experimental.optimizePackageImports`でtree-shakingを強化
  - lucide-react, @tanstack/react-queryは対象として推奨
  - images.formatsでavif/webp対応
- **Implications**: next.config.tsに設定追加

### FlatList パフォーマンス設定（Mobile）
- **Context**: React Native/Expoでの仮想化
- **Sources Consulted**: React Native FlatList公式ドキュメント
- **Findings**:
  - `initialNumToRender`: 初期表示件数（10推奨）
  - `maxToRenderPerBatch`: バッチ描画件数（5推奨）
  - `windowSize`: 描画ウィンドウサイズ（5推奨）
  - `keyExtractor`: 一意キー指定必須
- **Implications**: Mobile CardListでFlatList設定最適化

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 楽観的更新 | onMutateでキャッシュ先行更新 | 即時UI反映、UX向上 | エラー時ロールバック複雑化 | TanStack Query標準パターン |
| React.memo | コンポーネントメモ化 | 再レンダリング削減 | 過剰メモ化はメモリ増加 | リストアイテムに適用 |
| 仮想化 | 画面外DOM除外 | メモリ・描画効率化 | スクロール位置計算の複雑さ | 50件以上で効果顕著 |

## Design Decisions

### Decision: 楽観的更新のスコープ
- **Context**: どのmutationに楽観的更新を適用するか
- **Alternatives Considered**:
  1. 全mutation → 複雑度が高い
  2. CRUD操作のみ → バランスが良い
  3. 作成・削除のみ → 更新時の遅延が残る
- **Selected Approach**: カードとタグのCRUD操作全てに適用
- **Rationale**: ユーザー体験の一貫性を維持
- **Trade-offs**: 実装複雑度は上がるが体感速度向上
- **Follow-up**: エラー発生時のロールバックUIをテストで確認

### Decision: 仮想化のしきい値
- **Context**: 何件以上で仮想化を有効にするか
- **Alternatives Considered**:
  1. 常に有効 → 少量データでオーバーヘッド
  2. 50件以上 → バランスが良い
  3. 100件以上 → 効果発現が遅い
- **Selected Approach**: 50件以上で仮想化有効
- **Rationale**: 一般的なユーザーのカード数を考慮
- **Trade-offs**: 50件未満では従来の描画方式を維持

### Decision: QueryClient gcTime設定
- **Context**: キャッシュ保持期間の決定
- **Alternatives Considered**:
  1. 5分 → メモリ効率とキャッシュ活用のバランス
  2. 10分 → キャッシュヒット率向上
  3. Infinity → メモリリーク懸念
- **Selected Approach**: 5分（300,000ms）
- **Rationale**: ページ遷移間でキャッシュ活用しつつメモリ効率維持

## Risks & Mitigations
- **楽観的更新のデータ不整合** → onError/onSettledでの適切なロールバック・再フェッチ
- **仮想化によるスクロール位置ずれ** → estimateSizeの精度向上、動的サイズ測定
- **過剰メモ化によるメモリ増加** → 必要最小限のコンポーネントのみmemo化

## References
- [TanStack Query Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [@tanstack/react-virtual](https://tanstack.com/virtual/latest)
- [Next.js optimizePackageImports](https://nextjs.org/docs/app/api-reference/config/next-config-js/optimizePackageImports)
- [React.memo](https://react.dev/reference/react/memo)
- [React Native FlatList](https://reactnative.dev/docs/flatlist)
