# Next.js API設計ルール

## 概要
Next.js App Router + TanStack Query を使用したAPI設計の標準パターン。

## TanStack Query を使う理由

Next.js App RouterのServer ComponentsとTanStack Queryは**競合ではなく補完関係**。

| 役割 | 推奨技術 |
|------|----------|
| 初期データ取得（SSR） | Server Components |
| クライアント側キャッシュ・リフェッチ | TanStack Query `useQuery` |
| データ変更（mutation） | Server Actions + TanStack Query `useMutation` |

### TanStack Queryが必要な理由
- フォーカス時・ネット復帰時の自動リフェッチ
- 楽観的更新（APIレスポンス前にUI更新）
- ローディング・エラー状態の自動管理
- DevToolsでキャッシュ状態をデバッグ
- ページネーション・無限スクロール

### SWRとの比較
- **TanStack Query推奨**: mutation対応、DevTools、楽観的更新、機能が豊富
- **SWR**: シンプル、バンドルサイズ小、Vercel製でNext.jsと親和性高い

小規模でfetch中心なら**SWR**、mutation多め・中〜大規模なら**TanStack Query**。

---

## ディレクトリ構成
```
app/
├── api/
│   └── [resource]/
│       ├── route.ts          # GET(一覧), POST(作成)
│       └── [id]/
│           └── route.ts      # GET(単体), PATCH(更新), DELETE(削除)
├── actions/
│   └── [resource].ts         # Server Actions（mutation用）
├── providers.tsx             # QueryClientProvider
└── layout.tsx

lib/
├── db.ts                     # DBクライアント（Prisma, Drizzle, Supabase等）
├── api/
│   └── [resource].ts         # fetch関数群
├── validations/
│   └── [resource].ts         # Zodスキーマ
└── errors.ts                 # カスタムエラークラス

hooks/
└── use[Resource].ts          # TanStack Queryフック

types/
└── [resource].ts             # 型定義
```

---

## 実装パターン

### 1. 型定義 (`types/[resource].ts`)
```typescript
export type Task = {
  id: string
  title: string
  description: string | null
  status: 'todo' | 'in_progress' | 'done'
  user_id: string
  created_at: string
  updated_at: string
}

export type TasksResponse = {
  data: Task[]
  pagination: { total: number; limit: number; offset: number }
}

export type CreateTaskInput = { title: string; description?: string }
export type UpdateTaskInput = Partial<Pick<Task, 'title' | 'description' | 'status'>>
```

---

### 2. Route Handler (`app/api/[resource]/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'  // Prisma, Drizzle, Supabase等

// GET /api/tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Prismaの例
    const [data, total] = await Promise.all([
      db.task.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      db.task.count({ where: status ? { status } : undefined })
    ])

    return NextResponse.json({
      data,
      pagination: { total, limit, offset }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Zodバリデーション推奨
    
    const data = await db.task.create({ data: body })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}
```

### 動的ルート (`app/api/[resource]/[id]/route.ts`)
```typescript
type Params = { params: Promise<{ id: string }> }

// GET /api/tasks/:id
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params
  const data = await db.task.findUnique({ where: { id } })
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json(data)
}

// PATCH /api/tasks/:id
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await request.json()
  const data = await db.task.update({ where: { id }, data: body })
  return NextResponse.json(data)
}

// DELETE /api/tasks/:id
export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params
  await db.task.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
```

---

### 2.5 Server Actions（mutation用）
```typescript
// 📁 app/actions/tasks.ts
'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createTaskAction(data: { title: string; description?: string }) {
  const task = await db.task.create({ data })
  revalidatePath('/tasks')
  return task
}

export async function updateTaskAction(id: string, data: Partial<Task>) {
  const task = await db.task.update({ where: { id }, data })
  revalidatePath('/tasks')
  return task
}

export async function deleteTaskAction(id: string) {
  await db.task.delete({ where: { id } })
  revalidatePath('/tasks')
}
```

---

### 3. API関数 (`lib/api/[resource].ts`)
```typescript
import { Task, TasksResponse, CreateTaskInput, UpdateTaskInput } from '@/types/task'

const BASE_URL = '/api/tasks'

export const taskApi = {
  getAll: async (params?: { status?: string; limit?: number; offset?: number }): Promise<TasksResponse> => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.offset) searchParams.set('offset', String(params.offset))
    
    const url = searchParams.toString() ? `${BASE_URL}?${searchParams}` : BASE_URL
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch')
    return res.json()
  },

  getById: async (id: string): Promise<Task> => {
    const res = await fetch(`${BASE_URL}/${id}`)
    if (!res.ok) throw new Error('Not found')
    return res.json()
  },

  create: async (input: CreateTaskInput): Promise<Task> => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    if (!res.ok) throw new Error('Failed to create')
    return res.json()
  },

  update: async (id: string, input: UpdateTaskInput): Promise<Task> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
    if (!res.ok) throw new Error('Failed to update')
    return res.json()
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete')
  }
}
```

---

### 4. TanStack Queryフック (`hooks/use[Resource].ts`)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskApi } from '@/lib/api/tasks'

// クエリキー定数
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: { status?: string }) => [...taskKeys.lists(), filters] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
}

// 一覧取得
export function useTasks(status?: string) {
  return useQuery({
    queryKey: taskKeys.list({ status }),
    queryFn: () => taskApi.getAll({ status }),
  })
}

// 作成（API Route版）
export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: taskApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.lists() })
  })
}

// 作成（Server Actions版）- 推奨
export function useCreateTaskAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTaskAction,  // Server Actionを直接渡す
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.lists() })
  })
}

// 更新（楽観的更新）
export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) =>
      taskApi.update(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: taskKeys.lists() })
      const prev = qc.getQueryData(taskKeys.list({}))
      qc.setQueryData(taskKeys.list({}), (old: any) => ({
        ...old,
        data: old.data.map((t: Task) => t.id === id ? { ...t, ...input } : t)
      }))
      return { prev }
    },
    onError: (_, __, ctx) => qc.setQueryData(taskKeys.list({}), ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: taskKeys.lists() })
  })
}

// 削除
export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: taskApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.lists() })
  })
}
```

---

## HTTPステータスコード

| コード | 用途 |
|--------|------|
| 200 | 取得・更新成功 |
| 201 | 作成成功 |
| 204 | 削除成功（ボディなし） |
| 400 | リクエスト不正 |
| 401 | 認証エラー |
| 404 | リソース不在 |
| 422 | バリデーションエラー |
| 500 | サーバーエラー |

---

## レスポンス形式
```typescript
// 成功（一覧）
{ data: [...], pagination: { total, limit, offset } }

// 成功（単体）
{ id, title, ... }

// エラー
{ error: { code: 'VALIDATION_ERROR', message: '...', details: [...] } }
```

---

## 処理フロー

### データ取得
```
Server Component (初期データ) → prefetchQuery → HydrationBoundary
                                                      ↓
Component → useQuery → キャッシュから即時表示 → 必要に応じてリフェッチ
```

### データ変更（mutation）
```
Component → useMutation → Server Action or API Route → DB
                ↓
        onSuccess: invalidateQueries → 自動リフェッチ → UI更新
```

### API Route経由
```
Component → useQuery/useMutation → lib/api → fetch('/api/...') → Route Handler → DB
```

### Server Actions経由（推奨）
```
Component → useMutation → Server Action ('use server') → DB → revalidatePath
```