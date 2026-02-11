# Implementation Plan

## Phase 1: キャッシュ戦略の基盤構築

- [x] 1. 型定義とServer Actionの作成
- [x] 1.1 ホーム画面用データ型の定義
  - ホーム画面で必要な全カード情報と今日の学習済みカードIDをまとめた統合型 `HomeCardsData` を定義する
  - 既存の `CardWithTags` 型を再利用し、新規フィールドは `todayStudiedCardIds`（文字列配列）のみ
  - _Requirements: 8.1_

- [x] 1.2 ホーム画面用統合データ取得Server Actionの作成
  - 認証済みユーザーのカードを1回のクエリで全取得するServer Action `getHomeCards` を作成する
  - 取得対象: status が new, active, completed のカード全て（タグ情報をJOINで含む）
  - 今日の学習ログから学習済みカードIDリストを取得して返却する
  - 既存の `getNewCards`, `getTodayCards`, `getTodayCompletedCards` は他画面用に維持する
  - _Requirements: 1.1_

- [x] 2. ホーム専用データ取得フックの作成
- [x] 2.1 useHomeCards フックの実装
  - 統合Server Actionをデータソースとする単一のTanStack Queryフックを作成する
  - キャッシュキー定数 `homeCardKeys` を定義し、ホーム画面専用のキャッシュ空間を確保する
  - staleTime を30秒に設定し、データ鮮度を重視する
  - _Requirements: 1.2, 3.2, 8.2_

- [x] 3. ホーム専用ミューテーションフック群の作成
- [x] 3.1 カード作成用ミューテーションフックの実装
  - ホーム画面用の楽観的更新付きカード作成フック `useHomeCreateCard` を作成する
  - 楽観的更新コンテキスト型 `HomeCardMutationContext` を定義（前回データのスナップショットのみ保持）
  - onMutate: キャッシュに新カードを即時追加、onError: 前の状態にロールバック、onSuccess: サーバーレスポンスで確定
  - `invalidateQueries` は使用せず `setQueryData` による直接更新のみ
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.2 (P) カード更新用ミューテーションフックの実装
  - ホーム画面用の楽観的更新付きカード更新フック `useHomeUpdateCard` を作成する
  - 対象カードのフィールドを楽観的に更新し、失敗時はロールバックする
  - 3.1と同じファイルに追加するが、独立した機能のため並行実装可能
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.3 (P) カード削除用ミューテーションフックの実装
  - ホーム画面用の楽観的更新付きカード削除フック `useHomeDeleteCard` を作成する
  - 対象カードをキャッシュから即時除去し、失敗時はロールバックする
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.4 (P) カードリセット用ミューテーションフックの実装
  - ホーム画面用の楽観的更新付きカードリセットフック `useHomeResetCard` を作成する
  - カードのステータスを「新規」に、復習レベルを0にリセットする楽観的更新を行う
  - _Requirements: 2.2, 7.3_

- [x] 3.5 (P) 評価送信用ミューテーションフックの実装
  - ホーム画面用の楽観的更新付き評価送信フック `useHomeSubmitAssessment` を作成する
  - 評価結果をカードに即時反映し、todayStudiedCardIdsにカードIDを追加する
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. グローバルキャッシュ設定の最適化
  - QueryClientのgcTimeを5分から2分に短縮してメモリ消費を削減する
  - _Requirements: 3.1_

---

## Phase 2: レンダリング最適化

- [x] 5. コンポーネントのメモ化
- [x] 5.1 (P) クイック入力フォームのメモ化とフック置換
  - QuickInputForm を `React.memo` でラップし、activeTab変更時の不要な再レンダリングを防止する
  - 内部のsubmitハンドラとダイアログsubmitハンドラを `useCallback` でメモ化する
  - カード作成フックを既存の汎用フックからホーム専用フック `useHomeCreateCard` に置換する
  - _Requirements: 4.1_

- [x] 5.2 (P) カードタブのメモ化
  - CardTabs を `React.memo` でラップし、親の状態変更による不要な再レンダリングを防止する
  - _Requirements: 4.2_

- [x] 5.3 (P) 仮想化カードリストの最適化
  - VirtualizedCardList を独立したメモ化コンポーネントとして抽出する
  - estimateSize が既にメモ化されていることを確認し、内部関数の再作成を防止する
  - _Requirements: 4.3_

---

## Phase 3: 統合

- [x] 6. ホーム画面ページの統合更新
- [x] 6.1 DashboardPage のデータ取得統合
  - 3つの独立クエリフック呼び出しを `useHomeCards` 1つに置換する
  - `useMemo` で newCards（status=new）、todayCards（status=active かつ今日が復習日）、completedCards（status=completedまたは今日学習済み）に派生する
  - `useMemo` でタブ表示用のカウントオブジェクトを派生する
  - `handleTabChange` を `useCallback` でメモ化し、既存のメモ化済みコールバックとの整合性を確認する
  - _Requirements: 1.3, 4.4, 7.1_

- [x] 6.2 Suspense境界の導入
  - カードリスト部分を Suspense で囲み、QuickInputForm と CardTabs は即座に表示されるようにする
  - フォールバックに StudyCardsSkeleton を使用する
  - 既存の isLoading による条件分岐を調整する
  - _Requirements: 5.1, 5.2_

- [x] 6.3 HomeStudyCard のフック置換
  - カード削除・更新・評価送信フックをホーム専用フックに置換する
  - 既存のUI動作とエラーハンドリングは維持する
  - _Requirements: 7.2_

- [x] 6.4 CardList のフック置換
  - カードリセット・更新フックをホーム専用フックに置換する
  - _Requirements: 7.3_

---

## Phase 4: テスト・検証

- [x] 7. フックのユニットテスト
- [x] 7.1 データ取得フックのテスト
  - useHomeCards のデータ取得、キャッシュキーの正確性、staleTime設定を検証する
  - _Requirements: 9.1_

- [x] 7.2 ミューテーションフック群のテスト
  - useHomeCreateCard の楽観的更新とロールバックを検証する
  - useHomeUpdateCard の楽観的更新を検証する
  - useHomeDeleteCard の楽観的更新を検証する
  - useHomeResetCard の楽観的更新を検証する
  - useHomeSubmitAssessment のキャッシュ更新を検証する
  - _Requirements: 9.1_

- [x] 8. コンポーネントテストと統合検証
- [x] 8.1 (P) メモ化テスト
  - QuickInputForm が props 不変時に再レンダリングしないことを検証する
  - CardTabs が props 不変時に再レンダリングしないことを検証する
  - _Requirements: 9.2_

- [x] 8.2 既存機能の互換性確認
  - `/cards` ページが正常に動作し、既存の useCards, useNewCards 等が引き続き機能することを確認する
  - 既存テスト（useCards 関連）が全てパスすることを確認する
  - _Requirements: 6.1, 6.2, 9.3_

- [x] 8.3 E2Eテストの実行
  - ホーム画面のE2Eテストが全てパスすることを確認する（カード作成、評価送信、カード削除）
  - _Requirements: 9.4_

---

## Requirements Coverage

| Requirement | Task(s) |
|-------------|---------|
| 1.1 | 1.2 |
| 1.2 | 2.1 |
| 1.3 | 6.1 |
| 2.1 | 3.1, 3.2, 3.3, 3.5 |
| 2.2 | 3.1, 3.2, 3.3, 3.4, 3.5 |
| 2.3 | 3.1, 3.2, 3.3, 3.5 |
| 3.1 | 4 |
| 3.2 | 2.1 |
| 3.3 | (既存動作を維持、実装変更なし) |
| 4.1 | 5.1 |
| 4.2 | 5.2 |
| 4.3 | 5.3 |
| 4.4 | 6.1 |
| 5.1 | 6.2 |
| 5.2 | 6.2 |
| 6.1 | 8.2 |
| 6.2 | 8.2 |
| 7.1 | 6.1 |
| 7.2 | 6.3 |
| 7.3 | 3.4, 6.4 |
| 8.1 | 1.1 |
| 8.2 | 2.1 |
| 9.1 | 7.1, 7.2 |
| 9.2 | 8.1 |
| 9.3 | 8.2 |
| 9.4 | 8.3 |
