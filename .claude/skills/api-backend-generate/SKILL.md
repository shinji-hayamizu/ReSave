---
name: api-backend-generate
description: 機能仕様書からAPIバックエンド(型定義、Zodスキーマ、Server Actions、API Routes、TanStack Queryフック)を一括生成。docs/requirements/functionsを参照してバックエンド実装を行う際に使用。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task
model: opus
---

# APIバックエンド一括生成スキル

機能仕様書を読み取り、バックエンドAPI関連ファイルを **subAgent並列実行** で生成する汎用コマンド。

## 汎用性

このスキルは **任意のNext.js + Supabaseプロジェクト** で使用可能。
プロジェクト固有の情報はドキュメントから動的に読み取る。

### 他プロジェクトへのコピー方法

```bash
# このスキルを他プロジェクトにコピー
cp -r .claude/skills/api-backend-generate /path/to/other-project/.claude/skills/
```

## 前提条件

### 必須ドキュメント構造

以下のいずれかのドキュメント構造が存在すること：

**パターン1: requirements配下**
```
docs/
  requirements/
    architecture.md        # DB設計・API設計・ディレクトリ構成
    functions/
      _index.md            # 機能一覧・依存関係
      [category]/
        F-XXX-[name].md    # 個別機能仕様
```

**パターン2: specs配下**
```
docs/
  specs/
    architecture.md
    features/
      index.md
      [feature-name].md
```

**パターン3: カスタム**
スキル実行時にパスを指定可能

## 実行手順

### Phase 1: ドキュメント解析

1. **アーキテクチャ確認**
   - `docs/requirements/architecture.md` を読み込む
   - DB設計（テーブル定義、RLS）を把握
   - API設計（データフロー、認証方式）を把握
   - ディレクトリ構成を把握

2. **機能一覧確認**
   - `docs/requirements/functions/_index.md` を読み込む
   - MVP機能セットを特定
   - 機能間の依存関係を把握

3. **個別機能仕様確認**
   - 各 `F-XXX-*.md` を読み込む
   - 入力/出力定義を抽出
   - ビジネスルールを抽出
   - データモデルを抽出

### Phase 2: 生成対象の決定

アーキテクチャと機能仕様から **リソース（エンティティ）** を自動特定：

```
1. architecture.mdのER図・テーブル定義を解析
2. functions/_index.mdのカテゴリを解析
3. 各機能仕様のデータモデルを解析
4. リソース一覧を生成
```

**例: ReSaveプロジェクトの場合**
- **cards**: カード管理（CRUD + 今日の復習）
- **tags**: タグ管理（CRUD）
- **study**: 学習・復習機能

**例: ECサイトの場合**
- **products**: 商品管理
- **orders**: 注文管理
- **users**: ユーザー管理

### Phase 3: 並列生成（subAgentを使用）

以下のファイルを **Task tool で並列実行** する：

#### 1. 型定義 (`src/types/[resource].ts`)
```
Task: general-purpose subagent
Prompt:
アーキテクチャ({architecture_path})と機能仕様({spec_paths})に基づき、
{resource}の型定義ファイルを作成してください。

以下の型を含めること:
- エンティティ型（Card, Tag等）
- APIレスポンス型（CardsResponse等）
- 入力型（CreateCardInput, UpdateCardInput等）

出力先: {output_path}
```

#### 2. Zodスキーマ (`src/validations/[resource].ts`)
```
Task: general-purpose subagent
Prompt:
機能仕様({spec_paths})の入力バリデーション要件に基づき、
{resource}のZodスキーマファイルを作成してください。

以下を含めること:
- 作成用スキーマ
- 更新用スキーマ
- クエリパラメータ用スキーマ

出力先: {output_path}
```

#### 3. Server Actions (`src/actions/[resource].ts`)
```
Task: general-purpose subagent
Prompt:
アーキテクチャ({architecture_path})と機能仕様({spec_paths})に基づき、
{resource}のServer Actionsファイルを作成してください。

要件:
- 'use server' ディレクティブ
- Supabase連携
- 認証チェック必須
- Zodバリデーション
- revalidatePath

出力先: {output_path}
```

#### 4. API Routes (`src/app/api/[resource]/route.ts`)
```
Task: general-purpose subagent
Prompt:
アーキテクチャ({architecture_path})に基づき、
{resource}のAPI Route（Mobile用REST API）を作成してください。

要件:
- GET/POST/PATCH/DELETE対応
- Bearer Token認証
- Supabase RLS連携
- エラーハンドリング

出力先: {output_path}
```

#### 5. TanStack Query フック (`src/hooks/use[Resource].ts`)
```
Task: general-purpose subagent
Prompt:
{resource}のTanStack Queryフックを作成してください。

要件:
- queryKeys定数
- useQuery（一覧・詳細）
- useMutation（作成・更新・削除）
- Server Actionsを呼び出す形式

出力先: {output_path}
```

### Phase 4: 実行コマンド

```typescript
// 並列実行の例（Claudeコード内）
await Promise.all([
  Task({ subagent_type: 'general-purpose', prompt: '型定義生成...', model: 'haiku' }),
  Task({ subagent_type: 'general-purpose', prompt: 'Zodスキーマ生成...', model: 'haiku' }),
  Task({ subagent_type: 'general-purpose', prompt: 'Server Actions生成...', model: 'haiku' }),
  Task({ subagent_type: 'general-purpose', prompt: 'API Routes生成...', model: 'haiku' }),
  Task({ subagent_type: 'general-purpose', prompt: 'フック生成...', model: 'haiku' }),
])
```

## 使用方法

### スキル呼び出し

```
/api-backend-generate
/api-backend-generate [resource]
/api-backend-generate --all
/api-backend-generate --docs-path=docs/specs
```

### 引数

| 引数 | 説明 | 例 |
|------|------|-----|
| なし | 対話的にリソースを選択 | `/api-backend-generate` |
| [resource] | 特定リソースのみ生成 | `/api-backend-generate cards` |
| --all | 全リソースを生成 | `/api-backend-generate --all` |
| --docs-path | ドキュメントパス指定 | `/api-backend-generate --docs-path=docs/specs` |

### 対話的実行例

```
User: /api-backend-generate

Claude: ドキュメントを解析中...

検出されたリソース:
1. cards (カード管理)
2. tags (タグ管理)
3. study (学習機能)

どのリソースを生成しますか？
- 番号で選択（例: 1,2）
- "all" で全て生成
```

## 生成ファイル一覧（テンプレート）

各リソース `[resource]` に対して以下のファイルを生成：

| ファイル | 説明 |
|---------|------|
| `src/types/[resource].ts` | 型定義 |
| `src/validations/[resource].ts` | Zodバリデーション |
| `src/actions/[resource].ts` | Server Actions |
| `src/app/api/[resource]/route.ts` | API (一覧/作成) |
| `src/app/api/[resource]/[id]/route.ts` | API (詳細/更新/削除) |
| `src/hooks/use[Resource].ts` | TanStack Queryフック |

### 特殊エンドポイント

機能仕様に応じて追加のAPIエンドポイントを生成：

| 条件 | 追加ファイル |
|------|------------|
| 日付フィルタ機能あり | `src/app/api/[resource]/today/route.ts` |
| 検索機能あり | `src/app/api/[resource]/search/route.ts` |
| 一括操作あり | `src/app/api/[resource]/bulk/route.ts` |

## コード規約

### 型定義
```typescript
// Named exportのみ（default export禁止）
export type Card = {
  id: string;
  user_id: string;
  front: string;
  back: string;
  review_level: number;
  next_review_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CardsResponse = {
  data: Card[];
  pagination: { total: number; limit: number; offset: number };
};

export type CreateCardInput = {
  front: string;
  back: string;
  tagIds?: string[];
};
```

### Server Actions
```typescript
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { createCardSchema } from '@/validations/card';

export async function createCard(input: CreateCardInput) {
  const supabase = await createServerClient();

  // 認証チェック
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // バリデーション
  const validated = createCardSchema.parse(input);

  // DB操作
  const { data, error } = await supabase
    .from('cards')
    .insert({ ...validated, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/cards');
  return data;
}
```

### API Route（Mobile用）
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  // Bearer Token認証
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  // RLSにより自動的にユーザーのデータのみ取得
  const { data, error } = await supabase.from('cards').select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

### TanStack Query フック
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createCard, updateCard, deleteCard } from '@/actions/cards';

export const cardKeys = {
  all: ['cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  list: (filters: CardFilters) => [...cardKeys.lists(), filters] as const,
  today: () => [...cardKeys.all, 'today'] as const,
  detail: (id: string) => [...cardKeys.all, 'detail', id] as const,
};

export function useCards(filters?: CardFilters) {
  return useQuery({
    queryKey: cardKeys.list(filters ?? {}),
    queryFn: () => fetchCards(filters),
  });
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCard,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });
}
```

## 注意事項

1. **認証・認可**: Server ActionsとAPI Routesには必ず認証チェックを含める
2. **RLS**: Supabase RLSが有効な前提で設計
3. **バリデーション**: Zodスキーマで入力を必ず検証
4. **キャッシュ**: Next.js 15ではfetchのデフォルトがno-storeに変更されているため明示指定

## トラブルシューティング

### Q: 機能仕様が見つからない
A: `docs/requirements/functions/` ディレクトリが存在するか確認。存在しない場合は先にドキュメントを作成。

### Q: 型定義が既に存在する
A: 既存ファイルとマージするか、上書きするか確認を求める。

### Q: Supabaseクライアントが設定されていない
A: `src/lib/supabase/server.ts` と `src/lib/supabase/client.ts` を先に作成する必要がある。
