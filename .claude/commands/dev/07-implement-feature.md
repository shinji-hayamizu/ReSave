---
description: 指定機能のCRUD実装（Web + Expo 同時）。Server Actions・TanStack Query hooks・画面コンポーネントを一括生成する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: [機能名 (例: cards, tags, study)]
---

# 機能CRUD実装（Web + Expo）

指定された機能の CRUD を Web（Next.js）と Expo（React Native）に同時実装する。

## 使い方

```bash
# 単一機能を実装
/dev:07-implement-feature cards
/dev:07-implement-feature tags
/dev:07-implement-feature study
```

引数: `$ARGUMENTS` = 機能名

## 前提条件

以下が完了済みであること:
- 型・バリデーション追加（`/dev:06-add-types {機能名}`）
- 認証機能（`/dev:05-implement-auth`）
- Supabase基盤（`/dev:03-setup-backend`）

## 実行方法

**このタスクは ultrathink で実行すること。**

## サブエージェント実行（重要）

各ファイル作成は、サブエージェント（Task tool）を使用して並列実行すること。

### 実行パターン

1. **Phase 1（計画）** - メインエージェントで実行
2. **Phase 2（実装）** - サブエージェントで並列実行（Web/Expo 同時）
3. **Phase 3（確認）** - メインエージェントで実行

---

## 必須読み込みファイル

1. `docs/requirements/architecture.md` — データモデル・API設計
2. `docs/requirements/functions/{機能}/*.md` — 機能仕様・バリデーションルール
3. `docs/screens/mock/{version}/{機能}.html` — UIデザイン（存在する場合）
4. `packages/shared/src/types/{機能}.ts` — 型定義
5. `packages/shared/src/validations/{機能}.ts` — Zodスキーマ

---

## Phase 1: 計画（メインエージェント）

### 1.1 機能仕様の確認

機能仕様ドキュメントから以下を抽出:

| 項目 | 確認内容 |
|------|---------|
| エンティティ | テーブル名・フィールド |
| 操作 | 一覧/作成/更新/削除/その他 |
| 認可 | 誰が何を操作できるか |
| バリデーション | 入力制約・エラーメッセージ |
| 関連機能 | タグ付け・フィルタ等 |

### 1.2 型・スキーマの確認

```bash
# packages/shared に型が存在するか確認
cat packages/shared/src/types/{機能}.ts
cat packages/shared/src/validations/{機能}.ts
```

型が存在しない場合:
```
先に `/dev:06-add-types {機能名}` を実行してください。
```

### 1.3 実装計画の提示

以下の形式で計画を提示し、ユーザーの承認を得てから実装に進む:

```
## {機能名} 実装計画

### Web（apps/web）
- [ ] Server Actions: src/actions/{機能}.ts
- [ ] TanStack Query hooks: src/hooks/use{Feature}.ts
- [ ] 一覧画面: src/app/(main)/{機能}/page.tsx
- [ ] 作成画面: src/app/(main)/{機能}/new/page.tsx
- [ ] 編集画面: src/app/(main)/{機能}/[id]/edit/page.tsx
- [ ] コンポーネント: src/components/{機能}/

### Expo（apps/mobile）
- [ ] API hooks: hooks/use{Feature}.ts
- [ ] 一覧画面: app/(tabs)/{機能}/index.tsx
- [ ] 作成・編集画面: app/(tabs)/{機能}/[id].tsx
- [ ] コンポーネント: components/{機能}/

### packages/shared
- [ ] 型定義確認済み
- [ ] Zodスキーマ確認済み

この計画で実装を進めてよいですか？
```

---

## Phase 2: 実装（サブエージェント並列）

承認後、以下を並列で実行する。

### Web 実装

#### 2-W1: Server Actions

`apps/web/src/actions/{機能}.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { create{Feature}Schema, update{Feature}Schema } from '@resave/shared'
import type { Create{Feature}Input, Update{Feature}Input } from '@resave/shared'

export async function get{Feature}s(filters?: {Feature}Filters) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // アーキテクチャドキュメントのクエリ設計に従う
  const { data, error } = await supabase
    .from('{table}')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function create{Feature}(input: Create{Feature}Input) {
  const validated = create{Feature}Schema.parse(input)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('{table}')
    .insert({ ...validated, user_id: user.id })
    .select()
    .single()

  if (error) throw error
  revalidatePath('/{機能}')
  return data
}

export async function update{Feature}(id: string, input: Update{Feature}Input) {
  const validated = update{Feature}Schema.parse(input)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('{table}')
    .update(validated)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  revalidatePath('/{機能}')
  return data
}

export async function delete{Feature}(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('{table}')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/{機能}')
}
```

#### 2-W2: TanStack Query Hooks

`apps/web/src/hooks/use{Feature}.ts`:

```typescript
'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  create{Feature},
  delete{Feature},
  get{Feature}s,
  update{Feature},
} from '@/actions/{機能}'
import type { Create{Feature}Input, Update{Feature}Input } from '@resave/shared'

export const {feature}Keys = {
  all: ['{機能}'] as const,
  lists: () => [...{feature}Keys.all, 'list'] as const,
  list: (filters?: unknown) => [...{feature}Keys.lists(), filters] as const,
  detail: (id: string) => [...{feature}Keys.all, 'detail', id] as const,
}

export function use{Feature}s(filters?: {Feature}Filters) {
  return useQuery({
    queryKey: {feature}Keys.list(filters),
    queryFn: () => get{Feature}s(filters),
  })
}

export function useCreate{Feature}() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Create{Feature}Input) => create{Feature}(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: {feature}Keys.lists() }),
  })
}

export function useUpdate{Feature}() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Update{Feature}Input }) =>
      update{Feature}(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: {feature}Keys.lists() }),
  })
}

export function useDelete{Feature}() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => delete{Feature}(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: {feature}Keys.lists() }),
  })
}
```

#### 2-W3: 画面コンポーネント

HTMLモック（`docs/screens/mock/{version}/{機能}.html`）を参照して実装:

- 一覧ページ: `apps/web/src/app/(main)/{機能}/page.tsx`
- 作成ページ: `apps/web/src/app/(main)/{機能}/new/page.tsx`
- 編集ページ: `apps/web/src/app/(main)/{機能}/[id]/edit/page.tsx`
- コンポーネント: `apps/web/src/components/{機能}/`

---

### Expo 実装

#### 2-E1: API Route（Web 側）

`apps/web/src/app/api/{機能}/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

// Bearer Token 認証
async function authenticateRequest(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser(token)
  return user
}

export async function GET(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 一覧取得ロジック
}

export async function POST(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  // 作成ロジック
}
```

#### 2-E2: TanStack Query Hooks（Expo）

`apps/mobile/hooks/use{Feature}.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { apiClient } from '@/lib/api/client'
import type { Create{Feature}Input, Update{Feature}Input, {Feature} } from '@resave/shared'

export const {feature}Keys = {
  all: ['{機能}'] as const,
  lists: () => [...{feature}Keys.all, 'list'] as const,
  list: (filters?: unknown) => [...{feature}Keys.lists(), filters] as const,
}

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

export function use{Feature}s() {
  return useQuery({
    queryKey: {feature}Keys.lists(),
    queryFn: async () => {
      const token = await getToken()
      return apiClient<{Feature}[]>('/api/{機能}', { token })
    },
  })
}

export function useCreate{Feature}() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Create{Feature}Input) => {
      const token = await getToken()
      return apiClient<{Feature}>('/api/{機能}', {
        method: 'POST',
        body: input,
        token,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: {feature}Keys.lists() }),
  })
}
```

#### 2-E3: 画面コンポーネント（Expo）

HTMLモック参照で以下を実装:
- 一覧画面: `apps/mobile/app/(tabs)/{機能}/index.tsx`
- 作成・編集画面: `apps/mobile/app/(tabs)/{機能}/[id].tsx`
- コンポーネント: `apps/mobile/components/{機能}/`

---

## Phase 3: 確認（メインエージェント）

### 3.1 型チェック

```bash
cd apps/web && npx tsc --noEmit
cd apps/mobile && npx tsc --noEmit
```

### 3.2 動作確認項目

| 項目 | Web | Expo |
|------|-----|------|
| 一覧表示 | ✓/✗ | ✓/✗ |
| データ作成 | ✓/✗ | ✓/✗ |
| データ更新 | ✓/✗ | ✓/✗ |
| データ削除 | ✓/✗ | ✓/✗ |
| バリデーション | ✓/✗ | ✓/✗ |
| 認証ガード | ✓/✗ | ✓/✗ |

---

## 完了条件

- [ ] Web: Server Actions（CRUD）が実装されている
- [ ] Web: TanStack Query hooks が実装されている
- [ ] Web: 一覧・作成・編集画面が動作する
- [ ] Expo: API Route（Bearer Token認証）が実装されている
- [ ] Expo: TanStack Query hooks が実装されている
- [ ] Expo: 一覧・作成・編集画面が動作する
- [ ] packages/shared の型・スキーマを共有している
- [ ] TypeScript 型エラーがない

---

## 次のステップ

- `/dev:06-add-types {次の機能}` + `/dev:07-implement-feature {次の機能}` — 次の機能を実装
- `/dev:08-implement-screen {画面名}` — 画面の微調整
