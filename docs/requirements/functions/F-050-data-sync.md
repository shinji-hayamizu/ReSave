# F-050: Web/Mobile自動同期

> 関連: [ビジネス要件](../business-requirements.md) | [機能一覧](./_index.md)

## 基本情報

| 項目 | 内容 |
|-----|-----|
| 機能ID | F-050 |
| 優先度 | P0 |
| 関連US | F-050 |
| ステータス | Draft |

## 概要

ユーザーがWeb/モバイル間でシームレスにデータを同期し、どのデバイスからでも学習を継続できるようにする。Supabase Realtimeを活用したリアルタイム同期と、オフライン時の遅延同期を提供する。

## ユーザーフロー

### リアルタイム同期
1. **[トリガー]** ユーザーがデバイスAでカードを作成/編集
2. **[システム]** Supabaseに保存、Realtimeで変更を配信
3. **[システム]** デバイスBで変更を受信
4. **[完了]** デバイスBの画面に即座に反映

### オフライン→オンライン同期
1. **[トリガー]** ユーザーがオフラインで学習
2. **[システム]** ローカルストレージに変更を保存
3. **[システム]** オンライン復帰を検知
4. **[システム]** 未同期データをサーバーに送信
5. **[完了]** 他デバイスにも反映

## 入力/出力

| 種別 | 項目名 | 型 | 必須 | 説明 | 制約・バリデーション |
|-----|-------|---|-----|-----|-------------------|
| 入力 | localChanges | Change[] | No | ローカルの未同期変更 | オフライン時に蓄積 |
| 出力 | syncStatus | SyncStatus | - | 同期状態 | 'synced' \| 'syncing' \| 'offline' |
| 出力 | lastSyncAt | Date | - | 最終同期日時 | - |

## ビジネスルール

| ID | ルール | 条件 | 結果 |
|----|-------|-----|-----|
| BR-F050-01 | リアルタイム優先 | オンライン時 | Supabase Realtimeで即座に同期 |
| BR-F050-02 | オフライン対応 | オフライン時 | ローカルに保存、オンライン復帰時に同期 |
| BR-F050-03 | コンフリクト解決 | 同一カードの同時編集 | updated_atが新しい方を採用 |
| BR-F050-04 | 削除の同期 | カード削除時 | 他デバイスからも即座に削除 |
| BR-F050-05 | 学習ログ同期 | 学習完了時 | review_logsを即座に同期 |

## 同期対象データ

| テーブル | 同期方向 | 優先度 |
|---------|---------|-------|
| cards | 双方向 | 高 |
| tags | 双方向 | 高 |
| card_tags | 双方向 | 高 |
| review_logs | 端末→サーバー | 中 |
| user_settings | 双方向 | 低 |

## コンフリクト解決戦略

### Last Write Wins（LWW）
```typescript
// 同一カードへの同時更新
// updated_at が新しい方を採用
if (serverCard.updated_at > localCard.updated_at) {
  // サーバーの値を採用
  useServerVersion(serverCard)
} else {
  // ローカルの値をサーバーに送信
  pushToServer(localCard)
}
```

### 学習ログのマージ
```typescript
// review_logsは追記のみなのでコンフリクトしない
// 同じcard_id + reviewed_atの組み合わせは重複とみなす
const uniqueLogs = [...new Map(
  logs.map(log => [
    `${log.card_id}_${log.reviewed_at}`,
    log
  ])
).values()]
```

## エラーケース

| ID | 条件 | エラーメッセージ | 対処 |
|----|-----|----------------|-----|
| E-F050-01 | 同期失敗 | データの同期に失敗しました | 自動リトライ |
| E-F050-02 | コンフリクト | データが他のデバイスで更新されました | LWW適用、通知 |
| E-F050-03 | オフライン超過 | オフライン期間が長すぎます | フル同期を実行 |

## 受け入れ条件（AC）

- [ ] AC-01: WebとMobile間でカードがリアルタイムに同期されること
- [ ] AC-02: オフラインで作成したカードがオンライン復帰後に同期されること
- [ ] AC-03: オフラインで学習した結果がオンライン復帰後に同期されること
- [ ] AC-04: 同期状態がUI上で確認できること（同期中/完了/オフライン）
- [ ] AC-05: コンフリクト発生時にデータが失われないこと

## 画面要件

### 同期ステータス表示
- ヘッダーに同期アイコン
  - ✅ 同期済み（緑）
  - 🔄 同期中（回転アニメーション）
  - ⚠️ オフライン（オレンジ）
  - ❌ 同期エラー（赤）
- 最終同期日時の表示
- 手動同期ボタン（プルダウンリフレッシュ）

### オフライン通知
- 画面上部にオフラインバナー
- オンライン復帰時の同期進捗表示

## 技術仕様

### Supabase Realtime
```typescript
// リアルタイム購読
const subscription = supabase
  .channel('cards-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'cards',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      switch (payload.eventType) {
        case 'INSERT':
          queryClient.setQueryData(['cards'], (old) => [...old, payload.new])
          break
        case 'UPDATE':
          queryClient.setQueryData(['cards'], (old) =>
            old.map(card => card.id === payload.new.id ? payload.new : card)
          )
          break
        case 'DELETE':
          queryClient.setQueryData(['cards'], (old) =>
            old.filter(card => card.id !== payload.old.id)
          )
          break
      }
    }
  )
  .subscribe()
```

### オフライン対応（TanStack Query）
```typescript
// オフライン時のミューテーション
const createCardMutation = useMutation({
  mutationFn: createCard,
  onMutate: async (newCard) => {
    // 楽観的更新
    await queryClient.cancelQueries({ queryKey: ['cards'] })
    const previousCards = queryClient.getQueryData(['cards'])
    queryClient.setQueryData(['cards'], (old) => [...old, { ...newCard, id: tempId }])
    return { previousCards }
  },
  onError: (err, newCard, context) => {
    // エラー時はロールバック
    queryClient.setQueryData(['cards'], context.previousCards)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['cards'] })
  },
  // オフライン時はキューに追加
  networkMode: 'offlineFirst',
  retry: 3
})
```

### モバイル（Expo）
```typescript
// ネットワーク状態監視
import NetInfo from '@react-native-community/netinfo'

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      // オンライン復帰時に同期
      syncPendingChanges()
    }
    setIsOnline(state.isConnected)
  })
  return () => unsubscribe()
}, [])
```

### ローカルストレージ
```typescript
// Web: IndexedDB (TanStack Query Persist)
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'resave-query-cache'
})

// Mobile: AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage'

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'resave-query-cache'
})
```

## 未確定事項

- 【要確認】オフライン時のデータ保持期間（何日分まで保存するか）
- 【要確認】コンフリクト発生時のユーザー通知方法
- 【仮定】LWW（Last Write Wins）でコンフリクト解決と仮定
- 【仮定】初期バージョンではフルオフライン対応は行わず、短期間のオフラインのみ対応と仮定
