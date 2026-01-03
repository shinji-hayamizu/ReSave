---
description: 1機能を垂直に完全実装（DB -> API -> UI -> テスト）
argument-hint: [機能名またはID（例: カード作成, F-013）]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
---

$ARGUMENTS

---

上記の機能を垂直に完全実装してください。

## 目的
1つの機能を**DB -> API -> UI -> テスト**まで完全に実装し、
他の機能実装のパターンとなる「参照実装」を作成する。

## 前提
以下が完了済みであること:
- DB設計・API設計（`/phase-1-design/db-api`）
- 共通UIコンポーネント（`/phase-3-foundation/ui-components`）

---

## 参照ドキュメント（必須読み込み）
- `docs/requirements/functions/[category]/F-XXX-[function].md`（対象機能の仕様）
- `docs/design/database.md`（DB設計）
- `docs/design/api.md`（API設計）
- `docs/requirements/architecture.md`（技術スタック確認）

## あなたの役割
フルスタックエンジニア。
堅牢で保守性の高いコードを書く。

## 実行方法
このタスクは **ultrathink** で実行すること。

---

## Step 1: 機能仕様の確認

指定された機能の仕様を確認:

| 項目 | 内容 |
|------|------|
| 機能ID | F-XXX |
| 機能名 | [機能名] |
| カテゴリ | [カテゴリ] |
| 関連テーブル | [テーブル名] |
| 関連API | [エンドポイント] |

### 機能概要
```
[機能仕様から概要を記載]
```

### 入出力
| 種別 | 項目 | 型 | 必須 |
|-----|------|---|-----|
| 入力 | ... | ... | ... |
| 出力 | ... | ... | ... |

### ビジネスルール
- BR-XXX-01: ...
- BR-XXX-02: ...

---

## Step 2: 実装計画の提示

```
## 実装計画

### 1. DB層
- [ ] マイグレーション確認・追加
- [ ] RLS ポリシー確認

### 2. バリデーション層
- [ ] Zodスキーマ作成・更新

### 3. API層（Server Actions）
- [ ] Server Action 作成
- [ ] エラーハンドリング

### 4. データ取得層
- [ ] TanStack Query フック作成

### 5. UI層
- [ ] ページコンポーネント
- [ ] フォームコンポーネント
- [ ] リストコンポーネント（該当する場合）

### 6. テスト
- [ ] ユニットテスト（Vitest）
- [ ] 手動動作確認

この計画で実装を進めてよいですか？
「OK」または修正指示をお願いします。
```

---

## Step 3: DB層

### 3.1 マイグレーション確認

既存のマイグレーションファイルを確認し、必要に応じて追加:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_[description].sql

-- 新規テーブル（必要な場合）
CREATE TABLE IF NOT EXISTS [table_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- カラム定義
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_[table]_user_id ON [table_name](user_id);

-- RLS
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own [table]" ON [table_name]
  FOR ALL USING (auth.uid() = user_id);
```

### 3.2 マイグレーション実行

```bash
# ローカル
supabase db reset

# リモート（開発環境）
supabase db push
```

---

## Step 4: バリデーション層

### 4.1 Zodスキーマ

#### src/validations/[resource].ts
```typescript
import { z } from 'zod'

// 基本スキーマ
export const [resource]Schema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  // フィールド定義
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// 作成用スキーマ
export const create[Resource]Schema = z.object({
  field1: z.string().min(1, '必須項目です').max(255, '255文字以内で入力してください'),
  field2: z.number().optional(),
})

// 更新用スキーマ
export const update[Resource]Schema = create[Resource]Schema.partial()

// 型エクスポート
export type [Resource] = z.infer<typeof [resource]Schema>
export type Create[Resource]Input = z.infer<typeof create[Resource]Schema>
export type Update[Resource]Input = z.infer<typeof update[Resource]Schema>
```

---

## Step 5: API層（Server Actions）

### 5.1 Server Actions

#### src/actions/[resource].ts
```typescript
'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { create[Resource]Schema, update[Resource]Schema } from '@/validations/[resource]'

import type { Create[Resource]Input, Update[Resource]Input } from '@/validations/[resource]'

// 一覧取得
export async function get[Resources]() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data, error } = await supabase
    .from('[table]')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Failed to fetch [resources]')
  }

  return data
}

// 作成
export async function create[Resource](input: Create[Resource]Input) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // バリデーション
  const validated = create[Resource]Schema.parse(input)

  const { data, error } = await supabase
    .from('[table]')
    .insert({
      user_id: user.id,
      ...validated,
    })
    .select()
    .single()

  if (error) {
    throw new Error('Failed to create [resource]')
  }

  revalidatePath('/[resources]')
  return data
}

// 更新
export async function update[Resource](id: string, input: Update[Resource]Input) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // バリデーション
  const validated = update[Resource]Schema.parse(input)

  const { data, error } = await supabase
    .from('[table]')
    .update(validated)
    .eq('id', id)
    .eq('user_id', user.id) // RLSの補助
    .select()
    .single()

  if (error) {
    throw new Error('Failed to update [resource]')
  }

  revalidatePath('/[resources]')
  return data
}

// 削除
export async function delete[Resource](id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('[table]')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw new Error('Failed to delete [resource]')
  }

  revalidatePath('/[resources]')
}
```

---

## Step 6: データ取得層（TanStack Query）

### 6.1 Query Hooks

#### src/hooks/use[Resources].ts
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  create[Resource],
  delete[Resource],
  get[Resources],
  update[Resource],
} from '@/actions/[resource]'

import type { Create[Resource]Input, Update[Resource]Input } from '@/validations/[resource]'

// クエリキー
export const [resource]Keys = {
  all: ['[resources]'] as const,
  lists: () => [...[resource]Keys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...[resource]Keys.lists(), filters] as const,
  detail: (id: string) => [...[resource]Keys.all, 'detail', id] as const,
}

// 一覧取得
export function use[Resources]() {
  return useQuery({
    queryKey: [resource]Keys.lists(),
    queryFn: () => get[Resources](),
  })
}

// 作成
export function useCreate[Resource]() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Create[Resource]Input) => create[Resource](input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource]Keys.lists() })
    },
  })
}

// 更新
export function useUpdate[Resource]() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Update[Resource]Input }) =>
      update[Resource](id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource]Keys.lists() })
    },
  })
}

// 削除
export function useDelete[Resource]() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => delete[Resource](id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource]Keys.lists() })
    },
  })
}
```

---

## Step 7: UI層

### 7.1 一覧ページ

#### src/app/(main)/[resources]/page.tsx
```typescript
import { Plus } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { [Resource]List } from '@/components/[resources]/[resource]-list'

export default function [Resources]Page() {
  return (
    <>
      <PageHeader
        action={
          <Button asChild>
            <Link href="/[resources]/new">
              <Plus className="mr-2 h-4 w-4" />
              新規作成
            </Link>
          </Button>
        }
        title="[リソース名]"
      />
      <PageContainer>
        <[Resource]List />
      </PageContainer>
    </>
  )
}
```

### 7.2 作成ページ

#### src/app/(main)/[resources]/new/page.tsx
```typescript
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { [Resource]Form } from '@/components/[resources]/[resource]-form'

export default function New[Resource]Page() {
  return (
    <>
      <PageHeader title="[リソース名]を作成" />
      <PageContainer className="max-w-2xl">
        <[Resource]Form />
      </PageContainer>
    </>
  )
}
```

### 7.3 リストコンポーネント

#### src/components/[resources]/[resource]-list.tsx
```typescript
'use client'

import { Package } from 'lucide-react'

import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { use[Resources] } from '@/hooks/use[Resources]'

import { [Resource]Card } from './[resource]-card'

export function [Resource]List() {
  const { data: [resources], isLoading, error } = use[Resources]()

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-destructive">
        データの取得に失敗しました
      </div>
    )
  }

  if (![resources] || [resources].length === 0) {
    return (
      <EmptyState
        description="新しい[リソース]を作成しましょう"
        icon={Package}
        title="[リソース]がありません"
      />
    )
  }

  return (
    <div className="space-y-4">
      {[resources].map(([resource]) => (
        <[Resource]Card key={[resource].id} [resource]={[resource]} />
      ))}
    </div>
  )
}
```

### 7.4 フォームコンポーネント

#### src/components/[resources]/[resource]-form.tsx
```typescript
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { LoadingButton } from '@/components/ui/loading-button'
import { useCreate[Resource] } from '@/hooks/use[Resources]'
import { create[Resource]Schema } from '@/validations/[resource]'

import type { Create[Resource]Input } from '@/validations/[resource]'

export function [Resource]Form() {
  const router = useRouter()
  const { mutate: create[Resource], isPending } = useCreate[Resource]()

  const form = useForm<Create[Resource]Input>({
    resolver: zodResolver(create[Resource]Schema),
    defaultValues: {
      field1: '',
      field2: undefined,
    },
  })

  const onSubmit = (data: Create[Resource]Input) => {
    create[Resource](data, {
      onSuccess: () => {
        toast.success('[リソース]を作成しました')
        router.push('/[resources]')
      },
      onError: () => {
        toast.error('作成に失敗しました')
      },
    })
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="field1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>フィールド1</FormLabel>
              <FormControl>
                <Input placeholder="入力してください" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            キャンセル
          </Button>
          <LoadingButton loading={isPending} type="submit">
            作成
          </LoadingButton>
        </div>
      </form>
    </Form>
  )
}
```

---

## Step 8: テスト

### 8.1 ユニットテスト

#### src/validations/__tests__/[resource].test.ts
```typescript
import { describe, expect, it } from 'vitest'

import { create[Resource]Schema } from '../[resource]'

describe('create[Resource]Schema', () => {
  it('有効な入力を受け入れる', () => {
    const input = {
      field1: 'テスト',
    }

    const result = create[Resource]Schema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('空のfield1を拒否する', () => {
    const input = {
      field1: '',
    }

    const result = create[Resource]Schema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('長すぎるfield1を拒否する', () => {
    const input = {
      field1: 'a'.repeat(256),
    }

    const result = create[Resource]Schema.safeParse(input)
    expect(result.success).toBe(false)
  })
})
```

### 8.2 テスト実行

```bash
pnpm test
```

---

## Step 9: 動作確認

### 9.1 確認項目

| 項目 | 確認方法 | 期待結果 |
|------|---------|---------|
| 一覧表示 | /[resources] にアクセス | 一覧が表示される |
| 新規作成 | フォームに入力して送信 | 作成後、一覧に表示される |
| 更新 | 編集フォームで変更して送信 | 変更が反映される |
| 削除 | 削除ボタンをクリック | 一覧から削除される |
| バリデーション | 不正な入力で送信 | エラーメッセージが表示される |
| 認証 | ログアウト状態でアクセス | ログイン画面にリダイレクト |

---

## 完了条件

- [ ] DB マイグレーションが適用されている
- [ ] Zod スキーマが作成されている
- [ ] Server Actions が動作する
- [ ] TanStack Query フックが動作する
- [ ] 一覧・作成・編集・削除の UI が動作する
- [ ] バリデーションが動作する
- [ ] ユニットテストがパスする
- [ ] 手動動作確認が完了している

---

## 完了後のアクション

```
## [機能名] の垂直実装が完了しました

### 実装されたファイル
- supabase/migrations/YYYYMMDDHHMMSS_xxx.sql
- src/validations/[resource].ts
- src/actions/[resource].ts
- src/hooks/use[Resources].ts
- src/app/(main)/[resources]/page.tsx
- src/app/(main)/[resources]/new/page.tsx
- src/components/[resources]/[resource]-list.tsx
- src/components/[resources]/[resource]-form.tsx
- src/components/[resources]/[resource]-card.tsx
- src/validations/__tests__/[resource].test.ts

### 動作確認結果
| 項目 | 状態 |
|------|------|
| 一覧表示 | [Success/Failed] |
| 新規作成 | [Success/Failed] |
| 更新 | [Success/Failed] |
| 削除 | [Success/Failed] |
| テスト | [Success/Failed] |

この実装をパターンとして、他の機能を横展開できます。
```

---

## 次のステップ
`/phase-4-features/horizontal` - 他機能の横展開
