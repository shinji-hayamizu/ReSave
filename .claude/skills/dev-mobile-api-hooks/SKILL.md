---
name: dev:mobile-api-hooks
description: |
  Phase 2: 全APIクライアント関数 + TanStack Queryフック作成。
  useCards, useTags, useStudy, useStats hooks。
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent
---

# Phase 2: APIクライアント関数 + TanStack Queryフック

## 目的

全てのAPI連携用hooksを作成する。Phase 3の画面実装で使用する。

## 前提

- Phase 1（AuthProvider + useSession）が完了していること
- `useSession()` hookで `token` を取得できること
- `lib/api/client.ts` の `apiClient<T>()` が利用可能

## トークン連携パターン

全てのAPI hookは以下のパターンでトークンを取得する:

```typescript
function useCards() {
  const { token } = useSession();
  return useQuery({
    queryKey: cardKeys.lists(),
    queryFn: () => apiClient<CardListResponse>('/api/cards', { token: token! }),
    enabled: !!token,
  });
}
```

- `enabled: !!token` でトークン取得前のリクエストを防止
- `token!` は `enabled` で保証されるため安全

## 実装対象

### 1. クエリキー定数

**`apps/mobile/hooks/query-keys.ts`**

Web版 `apps/web/src/lib/query-keys.ts` を参考に、Mobile用のクエリキーファクトリを作成:

```typescript
export const cardKeys = {
  all: ['cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  list: (filters: CardFilters) => [...cardKeys.lists(), filters] as const,
  details: () => [...cardKeys.all, 'detail'] as const,
  detail: (id: string) => [...cardKeys.details(), id] as const,
  today: () => [...cardKeys.all, 'today'] as const,
};

export const tagKeys = {
  all: ['tags'] as const,
  lists: () => [...tagKeys.all, 'list'] as const,
  detail: (id: string) => [...tagKeys.all, 'detail', id] as const,
};

export const studyKeys = {
  all: ['study'] as const,
  today: () => [...studyKeys.all, 'today'] as const,
};

export const statsKeys = {
  all: ['stats'] as const,
  today: () => [...statsKeys.all, 'today'] as const,
  daily: (days: number) => [...statsKeys.all, 'daily', days] as const,
  summary: () => [...statsKeys.all, 'summary'] as const,
};
```

### 2. カードhooks

**`apps/mobile/hooks/useCards.ts`**

Web版 `apps/web/src/hooks/useCards.ts` を参考。

| Hook | HTTP | エンドポイント | 説明 |
|------|------|-------------|------|
| `useCards(filters?)` | GET | `/api/cards` | カード一覧（フィルタ対応） |
| `useCard(id)` | GET | `/api/cards/${id}` | 単体取得 |
| `useTodayCards()` | GET | `/api/cards/today` | 今日の復習カード |
| `useCreateCard()` | POST | `/api/cards` | 作成（mutation） |
| `useUpdateCard()` | PATCH | `/api/cards/${id}` | 更新（mutation） |
| `useDeleteCard()` | DELETE | `/api/cards/${id}` | 削除（mutation） |

Mutation成功時は `queryClient.invalidateQueries({ queryKey: cardKeys.lists() })` でキャッシュ無効化。

### 3. タグhooks

**`apps/mobile/hooks/useTags.ts`**

| Hook | HTTP | エンドポイント | 説明 |
|------|------|-------------|------|
| `useTags()` | GET | `/api/tags` | タグ一覧 |
| `useCreateTag()` | POST | `/api/tags` | 作成 |
| `useUpdateTag()` | PATCH | `/api/tags/${id}` | 更新 |
| `useDeleteTag()` | DELETE | `/api/tags/${id}` | 削除 |

### 4. 復習hooks

**`apps/mobile/hooks/useStudy.ts`**

| Hook | HTTP | エンドポイント | 説明 |
|------|------|-------------|------|
| `useTodayCards()` | GET | `/api/cards/today` | 今日の復習カード（cardKeysのtodayを使用） |
| `useSubmitAssessment()` | POST | `/api/study` | 評価送信。成功時にcardKeys.today() + cardKeys.lists()を無効化 |

### 5. 統計hooks

**`apps/mobile/hooks/useStats.ts`**

Stats用APIは現在存在しないため、Phase 3で `apps/web/src/app/api/stats/` にAPI Routeを追加する前提。
hooksは先に作成しておき、APIが存在しない間は `enabled: false` にしておく。

| Hook | HTTP | エンドポイント | 説明 |
|------|------|-------------|------|
| `useTodayStats()` | GET | `/api/stats/today` | 今日の統計 |
| `useDailyStats(days)` | GET | `/api/stats/daily?days=${days}` | 日別統計 |
| `useSummaryStats()` | GET | `/api/stats/summary` | 累計統計 |

### 6. バリデーション再エクスポート追加

**`apps/mobile/validations/study-log.ts`** — `@resave/shared` から再エクスポート

## 検証

```bash
cd apps/mobile
npx tsc --noEmit
```

型エラーがなければ Phase 2 完了。
