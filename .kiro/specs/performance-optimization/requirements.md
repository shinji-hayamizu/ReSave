# Requirements Document

## Introduction

本仕様書はReSaveアプリ全体のパフォーマンス最適化に関する要件を定義する。主な目標は、タップ時のレスポンス向上、不要な再レンダリングの削減、大量データ表示時のスムーズなスクロール、およびバンドルサイズの最適化である。Web（Next.js）とMobile（Expo）の両プラットフォームを対象とする。

## Requirements

### Requirement 1: 楽観的更新によるタップレスポンス向上

**Objective:** As a ユーザー, I want カード操作（作成・更新・削除・評価）が即座にUIに反映される, so that 待ち時間なくスムーズに学習を継続できる

#### Acceptance Criteria
1. When ユーザーがカードを作成した場合, the Card Hooks shall サーバーレスポンスを待たずにカード一覧に新規カードを即座に表示する
2. When ユーザーがカードを更新した場合, the Card Hooks shall キャッシュを先に更新してUIに即座に反映する
3. When ユーザーがカードを削除した場合, the Card Hooks shall キャッシュから即座に削除してUIから消去する
4. When ユーザーが学習画面でカードを評価した場合, the Study Hooks shall 評価結果を即座にUIに反映して次のカードを表示する
5. If サーバーへのリクエストが失敗した場合, the Hooks shall キャッシュを元の状態にロールバックしてエラーを表示する
6. While 楽観的更新中にサーバーリクエストが進行している場合, the System shall 進行中のクエリをキャンセルしてデータの整合性を維持する

### Requirement 2: TanStack Query設定の最適化

**Objective:** As a 開発者, I want TanStack Queryのキャッシュ設定が適切に構成されている, so that 不要なAPIリクエストを削減しレスポンスが向上する

#### Acceptance Criteria
1. The QueryClient shall staleTimeを60秒に設定してデータの新鮮さを維持する
2. The QueryClient shall gcTime（旧cacheTime）を5分に設定してメモリ使用量を最適化する
3. The QueryClient shall refetchOnWindowFocusをfalseに設定して不要なリフェッチを防止する
4. The QueryClient shall retry回数を1に制限してエラー時のレスポンスを改善する
5. When タグ一覧を取得する場合, the Tag Hooks shall staleTimeを5分に設定して頻繁な更新を抑制する

### Requirement 3: コンポーネント再レンダリング最適化

**Objective:** As a ユーザー, I want 画面遷移やインタラクション時にスムーズな描画が行われる, so that アプリがサクサク動作する体験を得られる

#### Acceptance Criteria
1. The StudyCard Component shall React.memoでラップされてpropsが変更されない限り再レンダリングをスキップする
2. The HomeStudyCard Component shall React.memoでラップされて不要な再描画を防止する
3. The TagBadge Component shall React.memoでラップされてリスト内の個別要素の再レンダリングを最適化する
4. The CardList Component shall React.memoでラップされて親の再レンダリング時に不要な描画をスキップする
5. When イベントハンドラをpropsとして渡す場合, the Parent Component shall useCallbackでハンドラをメモ化して参照の安定性を保証する
6. When 計算コストの高い値を算出する場合, the Component shall useMemoで結果をメモ化して再計算を防止する

### Requirement 4: 大量データ対応のリスト仮想化（Web）

**Objective:** As a ユーザー, I want 100件以上のカードがあっても滑らかにスクロールできる, so that 大量のカードを効率的に閲覧できる

#### Acceptance Criteria
1. When カード一覧が50件以上の場合, the CardList Component shall @tanstack/react-virtualを使用して仮想化レンダリングを行う
2. While 仮想化されたリストをスクロールしている場合, the System shall 画面外の要素をDOMから除外してメモリ使用量を削減する
3. The VirtualizedList shall estimateSizeを適切に設定してスクロール位置の計算精度を維持する
4. When リストの先頭や末尾にスクロールした場合, the System shall 適切なoverscan設定で先読みを行いちらつきを防止する

### Requirement 5: 大量データ対応のリスト仮想化（Mobile）

**Objective:** As a モバイルユーザー, I want カード一覧がスムーズにスクロールできる, so that 快適に学習カードを閲覧できる

#### Acceptance Criteria
1. The Mobile CardList shall FlatListコンポーネントを使用して仮想化レンダリングを実装する
2. The FlatList shall initialNumToRenderを10に設定して初期表示を高速化する
3. The FlatList shall maxToRenderPerBatchを5に設定してスクロール時のジャンクを防止する
4. The FlatList shall windowSizeを5に設定してメモリ使用量を最適化する
5. When リストアイテムをレンダリングする場合, the FlatList shall keyExtractorで一意のキーを指定してレンダリング効率を向上させる

### Requirement 6: Next.js設定の最適化

**Objective:** As a 開発者, I want Next.jsの設定が最適化されている, so that バンドルサイズが削減されページロードが高速化される

#### Acceptance Criteria
1. The next.config.ts shall optimizePackageImportsでlucide-reactと@tanstack/react-queryを最適化対象に指定する
2. The next.config.ts shall images.formatsでavifとwebpを指定して画像最適化を有効化する
3. The next.config.ts shall compressをtrueに設定してGzip圧縮を明示的に有効化する
4. The System shall バンドルサイズを現状から10%以上削減する

### Requirement 7: Server Actions importの最適化

**Objective:** As a 開発者, I want Server Actionsのimportが効率的に行われる, so that 不要な動的importオーバーヘッドを削減する

#### Acceptance Criteria
1. The useCards Hook shall Server Actionsをトップレベルでimportして動的importを排除する
2. The useTags Hook shall Server Actionsをトップレベルでimportして動的importを排除する
3. The useStudy Hook shall Server Actionsをトップレベルでimportして動的importを排除する
4. When TanStack QueryのqueryFnを定義する場合, the Hook shall 直接Server Action関数を参照する

### Requirement 8: パフォーマンス計測と監視

**Objective:** As a 開発者, I want パフォーマンス改善の効果を計測できる, so that 最適化の成果を定量的に評価できる

#### Acceptance Criteria
1. The Web App shall React DevTools Profilerで再レンダリング回数を計測可能である
2. The Web App shall TanStack Query DevToolsでキャッシュ状態とリクエスト回数を監視可能である
3. When 楽観的更新を実行した場合, the System shall UI更新からサーバー完了までの時間差を200ms以内に収める
4. The CardList shall 100件のカード表示時にFPS60を維持する
