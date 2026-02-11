# Requirements Document

## Project Description (Input)
ホーム画面の包括的なパフォーマンス改善。キャッシュ戦略の最適化、コンポーネントのメモ化、レンダリング効率化を実施する。

### 対象問題

#### キャッシュ・データフェッチ関連
1. データの重複キャッシュ（newCards, todayCards, completedCards が別々に保持）
2. 3つのクエリ並列実行による過剰なAPIリクエスト
3. 過剰なキャッシュ無効化（Invalidation Storm）
4. 楽観的更新コンテキストの肥大化
5. gcTime（5分）が長すぎることによるメモリ圧迫

#### レンダリング関連
6. QuickInputForm がメモ化されていない（activeTab変更で毎回再レンダリング）
7. CardTabs がメモ化されていない
8. VirtualizedCardList が内部関数で毎回再作成
9. Suspense境界がなくページ全体がブロック

#### その他
10. Server Actions と TanStack Query の二重キャッシュ

### 解決アプローチ
1. 「単一ソース + 派生データ」パターンへの移行
2. コンポーネントの適切なメモ化
3. Suspense境界の導入

---

## Requirements

### REQ-1: 単一データソースの導入
**優先度**: High
**カテゴリ**: アーキテクチャ

#### REQ-1.1: 統合Server Actionの作成
- `getHomeCards()` Server Actionを新規作成する
- 1回のSupabaseクエリで、ホーム画面に必要な全カード（new + active + 今日完了）を取得する
- タグ情報を含めてJOINで取得する
- 既存の `getNewCards()`, `getTodayCards()`, `getTodayCompletedCards()` は他画面での利用のため残す

#### REQ-1.2: 統合フックの作成
- `useHomeCards()` フックを新規作成する
- キャッシュキーは `['cards', 'home']` とする
- 戻り値の型は `HomeCardsData` として定義する

```typescript
type HomeCardsData = {
  cards: CardWithTags[];
  todayStudiedCardIds: string[];
};
```

#### REQ-1.3: クライアント側でのデータ派生
- `useMemo` を使用して `newCards`, `todayCards`, `completedCards` に分割する
- フィルタリングロジックは既存のServer Action実装に準拠する
  - `newCards`: status = 'new'
  - `todayCards`: status = 'active' かつ next_review_at <= 今日
  - `completedCards`: status = 'completed' または todayStudiedCardIds に含まれる

---

### REQ-2: ミューテーション最適化
**優先度**: High
**カテゴリ**: パフォーマンス

#### REQ-2.1: 単一キャッシュへの直接更新
- ミューテーション成功時は `invalidateQueries` ではなく `setQueryData` を使用する
- `['cards', 'home']` キャッシュのみを更新する
- 既存の楽観的更新ロジックを簡素化する

#### REQ-2.2: ホーム専用ミューテーションフックの作成
以下のフックを `useHomeCards.ts` に追加する：
- `useHomeCreateCard()` - カード作成（ホーム用）
- `useHomeUpdateCard()` - カード更新（ホーム用）
- `useHomeDeleteCard()` - カード削除（ホーム用）
- `useHomeSubmitAssessment()` - 評価送信（ホーム用）

#### REQ-2.3: コンテキストの簡素化
楽観的更新のコンテキストを単一に統合する：

```typescript
type HomeCardMutationContext = {
  previousData: HomeCardsData | undefined;
};
```

---

### REQ-3: キャッシュ設定の最適化
**優先度**: Medium
**カテゴリ**: パフォーマンス

#### REQ-3.1: gcTime の短縮
- `providers.tsx` の `gcTime` を 5分 → 2分 に短縮する
- ホーム画面専用の設定は `useHomeCards` のオプションで上書き可能にする

#### REQ-3.2: staleTime の調整
- ホーム画面の `staleTime` を 30秒 に設定する（グローバルの60秒より短く）
- データの鮮度を重視する

#### REQ-3.3: refetchOnWindowFocus の維持
- 現状の `refetchOnWindowFocus: false` を維持する
- ホーム画面では手動リフレッシュまたはミューテーション後の更新に依存する

---

### REQ-4: コンポーネントのメモ化
**優先度**: High
**カテゴリ**: レンダリング最適化

#### REQ-4.1: QuickInputForm のメモ化
- `React.memo()` でラップする
- `onCardCreated` コールバックを props として受け取り、親で `useCallback` でメモ化する
- 内部の `handleSubmit`, `handleDialogSubmit` を `useCallback` でメモ化する

#### REQ-4.2: CardTabs のメモ化
- `React.memo()` でラップする
- `onChange` コールバックを親で `useCallback` でメモ化する
- `counts` オブジェクトを親で `useMemo` でメモ化する

#### REQ-4.3: VirtualizedCardList の最適化
- 内部関数から独立したメモ化コンポーネントに抽出する
- `estimateSize` を `useCallback` でメモ化する（既存実装を維持）

#### REQ-4.4: DashboardPage のコールバックメモ化
以下のコールバックを `useCallback` でメモ化する：
- `handleEdit`（既存）
- `handleEditDialogClose`（既存）
- `handleCardCreated`（既存）
- `setActiveTab` を直接渡すのではなく、メモ化されたハンドラを使用

---

### REQ-5: Suspense境界の導入
**優先度**: Medium
**カテゴリ**: UX改善

#### REQ-5.1: カードリスト用Suspense境界
- カードリスト部分を `Suspense` で囲む
- `fallback` に `StudyCardsSkeleton` を使用する
- QuickInputForm と CardTabs は即座に表示される

#### REQ-5.2: ローディング状態の最適化
- 既存の `isLoading` による条件分岐を Suspense に置換
- `loading.tsx` は認証チェック用のフォールバックとして維持

---

### REQ-6: 既存フックとの互換性
**優先度**: Medium
**カテゴリ**: 互換性

#### REQ-6.1: 既存フックの保持
以下の既存フックは削除せず、`/cards` ページ等での利用のため維持する：
- `useNewCards()`
- `useTodayCards()`
- `useTodayCompletedCards()`
- `useCards()`
- `useCard()`

#### REQ-6.2: ミューテーションフックの共存
既存のミューテーションフック（`useCreateCard`, `useUpdateCard`, `useDeleteCard`）は維持する：
- `/cards` ページでは既存フックを使用
- ホーム画面では新規のホーム専用フックを使用

---

### REQ-7: ページコンポーネントの更新
**優先度**: High
**カテゴリ**: 実装

#### REQ-7.1: DashboardPage の更新
`app/(main)/page.tsx` を以下のように変更する：
- 3つの `useQuery` 呼び出しを `useHomeCards()` 1つに置換
- `useMemo` でタブ別データを派生
- `useMemo` で `counts` オブジェクトを派生
- コールバックを `useCallback` でメモ化
- Suspense境界を追加

#### REQ-7.2: HomeStudyCard の更新
`components/home/home-study-card.tsx` を以下のように変更する：
- `useDeleteCard` → `useHomeDeleteCard` に置換
- `useUpdateCard` → `useHomeUpdateCard` に置換
- `useSubmitAssessment` → `useHomeSubmitAssessment` に置換

#### REQ-7.3: CardList の更新
`components/home/card-list.tsx` を以下のように変更する：
- `useResetCard` → `useHomeResetCard` に置換
- `useUpdateCard` → `useHomeUpdateCard` に置換
- VirtualizedCardList を独立コンポーネントに抽出

---

### REQ-8: 型定義の追加
**優先度**: Medium
**カテゴリ**: 型安全性

#### REQ-8.1: HomeCardsData 型の定義
`types/card.ts` に以下を追加：

```typescript
export type HomeCardsData = {
  cards: CardWithTags[];
  todayStudiedCardIds: string[];
};
```

#### REQ-8.2: キャッシュキー定数の追加
`hooks/useHomeCards.ts` に以下を追加：

```typescript
export const homeCardKeys = {
  all: ['cards', 'home'] as const,
};
```

---

### REQ-9: テストの更新
**優先度**: High
**カテゴリ**: 品質保証

#### REQ-9.1: 新規フックのテスト
以下のテストを追加する：
- `useHomeCards` のデータ取得テスト
- `useHomeCreateCard` の楽観的更新テスト
- `useHomeUpdateCard` の楽観的更新テスト
- `useHomeDeleteCard` の楽観的更新テスト
- `useHomeSubmitAssessment` のキャッシュ更新テスト

#### REQ-9.2: コンポーネントのレンダリングテスト
以下のテストを追加する：
- QuickInputForm のメモ化が機能していることを確認
- CardTabs のメモ化が機能していることを確認
- 不要な再レンダリングが発生しないことを確認

#### REQ-9.3: 既存テストの維持
既存の `useCards.ts` 関連テストは変更しない。

#### REQ-9.4: E2Eテストの確認
ホーム画面のE2Eテストが引き続きパスすることを確認する。

---

## Non-Functional Requirements

### NFR-1: パフォーマンス
| 指標 | Before | After |
|------|--------|-------|
| Supabaseリクエスト数（初期ロード） | 3回 | 1回 |
| メモリ使用量 | 3重キャッシュ | 単一キャッシュ（約50%削減） |
| ミューテーション後リフェッチ | 4回 | 0回（直接更新） |
| activeTab変更時の再レンダリング | QuickInputForm + CardTabs | なし（メモ化） |

### NFR-2: 保守性
- 新旧フックが共存するため、段階的な移行が可能
- 既存の `/cards` ページに影響なし
- コンポーネントの責務が明確

### NFR-3: 後方互換性
- API変更なし（Server Actionsの新規追加のみ）
- 既存コンポーネントの props 変更なし

### NFR-4: UX
- QuickInputForm と CardTabs は即座に表示（Suspense境界）
- スケルトンローディングでレイアウトシフト防止

---

## Out of Scope

以下は本仕様の対象外とする：

1. **ページネーション/仮想スクロールの導入** - CardListの仮想化は既存実装を維持
2. **`/cards` ページのキャッシュ最適化** - 本仕様はホーム画面のみ
3. **Server Actions の `revalidatePath` 削除** - 既存動作への影響を考慮し維持
4. **Mobile (Expo) アプリへの適用** - API Routes 経由のため対象外
5. **lucide-react のアイコン最適化** - 影響が軽微なため対象外
6. **react-textarea-autosize の置換** - 機能要件を満たすため維持

---

## Acceptance Criteria

1. ホーム画面の初期ロードで Supabase へのリクエストが 1回 であること
2. カード作成/更新/削除/評価後にリフェッチが発生しないこと（setQueryData で直接更新）
3. activeTab 変更時に QuickInputForm と CardTabs が再レンダリングされないこと
4. 既存の `/cards` ページが正常に動作すること
5. 全テストがパスすること
6. E2Eテストがパスすること
7. React DevTools で不要な再レンダリングがないことを確認

---

## File Changes Summary

| ファイル | 変更種別 | 内容 |
|---------|---------|------|
| `actions/cards.ts` | 追加 | `getHomeCards()` 関数追加 |
| `hooks/useHomeCards.ts` | 新規 | ホーム専用フック群 |
| `types/card.ts` | 追加 | `HomeCardsData` 型追加 |
| `app/(main)/page.tsx` | 修正 | 新フックへの移行、Suspense追加、コールバックメモ化 |
| `components/home/quick-input-form.tsx` | 修正 | memo化、useCallback追加 |
| `components/home/card-tabs.tsx` | 修正 | memo化 |
| `components/home/card-list.tsx` | 修正 | ミューテーションフック置換、VirtualizedCardList抽出 |
| `components/home/home-study-card.tsx` | 修正 | ミューテーションフック置換 |
| `providers.tsx` | 修正 | gcTime 調整 |
| `tests/hooks/useHomeCards.test.ts` | 新規 | 新フックのテスト |
| `tests/components/home/*.test.tsx` | 修正 | メモ化テスト追加 |

---

## Implementation Priority

### Phase 1: キャッシュ戦略（最優先）
1. REQ-1: 単一データソースの導入
2. REQ-2: ミューテーション最適化
3. REQ-3: キャッシュ設定の最適化

### Phase 2: レンダリング最適化
4. REQ-4: コンポーネントのメモ化
5. REQ-5: Suspense境界の導入

### Phase 3: 統合・テスト
6. REQ-6: 既存フックとの互換性確認
7. REQ-7: ページコンポーネントの更新
8. REQ-8: 型定義の追加
9. REQ-9: テストの更新

