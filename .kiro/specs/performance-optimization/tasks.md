# Implementation Plan

## Phase 1: 基盤設定

- [x] 1. QueryClient最適化設定
- [x] 1.1 QueryClientのデフォルトオプションを更新
  - staleTimeを60秒に設定
  - gcTimeを5分に設定
  - refetchOnWindowFocusをfalseに設定
  - retryを1回に制限
  - ReactQueryDevtoolsが開発環境で利用可能か確認
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 8.2_

- [x] 2. (P) Next.js設定最適化
- [x] 2.1 (P) next.config.tsにバンドル最適化設定を追加
  - optimizePackageImportsでlucide-react、@tanstack/react-queryを指定
  - images.formatsでavif、webpを有効化
  - compressをtrueに設定
  - _Requirements: 6.1, 6.2, 6.3_
- [x] 2.2 バンドルサイズ削減を確認
  - ビルド前後のバンドルサイズを比較
  - 10%以上の削減を確認
  - _Requirements: 6.4_

- [x] 3. (P) Server Actionsインポート最適化
- [x] 3.1 (P) useCardsの動的importをトップレベルimportに変更
  - Server Actions関数をファイル先頭でimport
  - queryFnから動的import呼び出しを削除
  - 直接Server Action関数を参照
  - _Requirements: 7.1, 7.4_
- [x] 3.2 (P) useTagsの動的importをトップレベルimportに変更
  - 3.1と同様のパターンを適用
  - _Requirements: 7.2, 7.4_
- [x] 3.3 (P) useStudyの動的importをトップレベルimportに変更
  - 3.1と同様のパターンを適用
  - _Requirements: 7.3, 7.4_

## Phase 2: 楽観的更新実装

- [x] 4. useCards楽観的更新
- [x] 4.1 カード作成時の楽観的更新を実装
  - onMutateでカード一覧キャッシュに新規カードを追加
  - cancelQueriesで進行中クエリをキャンセル
  - 一時IDで楽観的データを生成
  - _Requirements: 1.1, 1.6_
- [x] 4.2 カード更新時の楽観的更新を実装
  - onMutateで対象カードのキャッシュを更新
  - 更新前データをcontextに保存
  - _Requirements: 1.2, 1.6_
- [x] 4.3 カード削除時の楽観的更新を実装
  - onMutateでキャッシュから対象カードを除外
  - 削除前のデータをcontextに保存
  - _Requirements: 1.3, 1.6_
- [x] 4.4 エラー時のロールバック処理を実装
  - onErrorでcontextからキャッシュを復元
  - toast通知でエラーをユーザーに表示
  - onSettledでinvalidateQueriesを実行
  - _Requirements: 1.5_

- [x] 5. (P) useTags楽観的更新
- [x] 5.1 タグ一覧のstaleTimeを5分に設定
  - useTagsのqueryオプションにstaleTime追加
  - _Requirements: 2.5_
- [x] 5.2 タグCRUD操作に楽観的更新を実装
  - 作成・更新・削除のonMutate/onError/onSettled
  - useCardsと同様のパターンを適用
  - _Requirements: 1.5, 1.6_

- [x] 6. (P) useStudy楽観的更新
- [x] 6.1 評価送信時の楽観的更新を実装
  - onMutateでtodayCardsから対象カードを即座に除外
  - 次のカード表示を即時実行
  - cancelQueriesで進行中クエリをキャンセル
  - _Requirements: 1.4, 1.6_
- [x] 6.2 評価エラー時のロールバックを実装
  - onErrorでtodayCardsを復元
  - エラー通知を表示
  - _Requirements: 1.5_

## Phase 3: コンポーネント最適化

- [x] 7. コンポーネントメモ化
- [x] 7.1 (P) StudyCardをReact.memoでラップ
  - propsが変更されない限り再レンダリングをスキップ
  - 内部stateは維持
  - _Requirements: 3.1_
- [x] 7.2 (P) HomeStudyCardをReact.memoでラップ
  - handleRateをuseCallbackでメモ化
  - イベントハンドラの参照安定化
  - _Requirements: 3.2, 3.5_
- [x] 7.3 (P) TagBadgeをReact.memoでラップ
  - シンプルな表示コンポーネントのメモ化
  - _Requirements: 3.3_
- [x] 7.4 CardListをReact.memoでラップ
  - 計算コストの高い値をuseMemoでメモ化
  - 親の再レンダリング時に不要な描画をスキップ
  - _Requirements: 3.4, 3.6_

- [x] 8. リスト仮想化
- [x] 8.1 @tanstack/react-virtualをインストール
  - pnpm add @tanstack/react-virtual
  - _Requirements: 4.1_
- [x] 8.2 CardListに仮想化を実装
  - 50件以上でuseVirtualizerを有効化
  - estimateSizeを180pxに設定
  - overscanを5に設定
  - 画面外要素をDOMから除外
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

## Phase 4: Mobile最適化

- [x] 9. (P) Mobile FlatList最適化
- [x] 9.1 MobileCardListにFlatList最適化設定を追加
  - initialNumToRenderを10に設定
  - maxToRenderPerBatchを5に設定
  - windowSizeを5に設定
  - keyExtractorでcard.idを指定
  - removeClippedSubviewsを有効化
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

## Phase 5: 検証

- [x] 10. パフォーマンス検証
- [x] 10.1 DevTools設定確認
  - React DevTools Profilerで再レンダリング回数を計測
  - TanStack Query DevToolsでキャッシュ状態を監視
  - _Requirements: 8.1, 8.2_
- [x] 10.2 パフォーマンス指標を検証
  - 楽観的更新のUI更新が200ms以内か確認
  - 100件カード表示時に60FPSを維持するか確認
  - _Requirements: 8.3, 8.4_
