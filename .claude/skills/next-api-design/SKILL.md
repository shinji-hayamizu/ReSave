---
name: api-design
description: Next.js App Router API設計。API Route、Server Actions、TanStack Queryフックを作成する場合に使用。REST API、エンドポイント、CRUD操作、データフェッチを実装する際に適用。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Next.js API設計スキル

Next.js App Router + TanStack Query を使用したAPI設計の標準パターン。

## ディレクトリ構成

```
app/
  api/
    [resource]/
      route.ts          # GET(一覧), POST(作成)
      [id]/
        route.ts        # GET(単体), PATCH(更新), DELETE(削除)
  actions/
    [resource].ts       # Server Actions（mutation用）

lib/
  api/
    [resource].ts       # fetch関数群
  validations/
    [resource].ts       # Zodスキーマ

hooks/
  use[Resource].ts      # TanStack Queryフック

types/
  [resource].ts         # 型定義
```

## 型定義 (`types/[resource].ts`)

```typescript
export type Task = {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
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

## Route Handler (`app/api/[resource]/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const [data, total] = await Promise.all([
      db.task.findMany({ skip: offset, take: limit }),
      db.task.count()
    ])

    return NextResponse.json({ data, pagination: { total, limit, offset } })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await db.task.create({ data: body })
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}
```

## 動的ルート (`app/api/[resource]/[id]/route.ts`)

```typescript
type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params
  const data = await db.task.findUnique({ where: { id } })
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const body = await request.json()
  const data = await db.task.update({ where: { id }, data: body })
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params
  await db.task.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
```

## Server Actions（mutation用・推奨）

```typescript
// app/actions/tasks.ts
'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createTaskAction(data: { title: string }) {
  // 認証・認可チェック必須
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const task = await db.task.create({ data })
  revalidatePath('/tasks')
  return task
}
```

## TanStack Query フック (`hooks/use[Resource].ts`)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: { status?: string }) => [...taskKeys.lists(), filters] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
}

export function useTasks(status?: string) {
  return useQuery({
    queryKey: taskKeys.list({ status }),
    queryFn: () => taskApi.getAll({ status }),
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTaskAction,
    onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.lists() })
  })
}
```

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

## レスポンス形式

```typescript
// 成功（一覧）
{ data: [...], pagination: { total, limit, offset } }

// 成功（単体）
{ id, title, ... }

// エラー
{ error: { code: 'VALIDATION_ERROR', message: '...' } }
```

## 重要な注意点

1. **Server Actionsには認証・認可チェックを必ず含める**
2. **fetchのcache/revalidateは必ず明示指定**（Next.js 15でデフォルト変更あり）
3. **Zodによる入力バリデーションを推奨**
