---
name: api-backend-generate
description: 機能仕様書からAPIバックエンド(型定義、Zodスキーマ、Server Actions、API Routes、TanStack Queryフック)を一括生成。docs/requirements/functionsを参照してバックエンド実装を行う際に使用。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion
model: opus
---

# APIバックエンド一括生成スキル

機能仕様書を読み取り、バックエンドAPI関連ファイルを **subAgent並列実行** で生成する汎用コマンド。

## 汎用性

このスキルは **任意のNext.js + Supabaseプロジェクト** で使用可能。
プロジェクト固有の情報はドキュメントから動的に読み取る。

### 他プロジェクトへのコピー方法

```bash
cp -r .claude/skills/api-backend-generate /path/to/other-project/.claude/skills/
```

---

## 実行フロー概要

```
Phase 1: 前提条件検証 (1.1)
    ↓
Phase 2: ドキュメント解析 (2.1, 2.2)
    ↓
Phase 3: リソース検出・選択 (3.1, 3.2)
    ↓
Phase 4: コード生成 [並列] (4.1, 4.2, 5.1, 5.2, 6.1)
    ↓
Phase 5: 統合・検証 (7.1, 7.2, 8.1)
    ↓
Phase 6: 完了サマリー
```

---

## Phase 1: 前提条件検証 (Task 1.1)

### 実行手順

1. **Supabaseクライアント確認**
   ```
   必須ファイル: apps/web/src/lib/supabase/server.ts
   - 存在しない場合: エラー終了
   - メッセージ: "Supabaseクライアントが見つかりません。先に /dev:04-setup-supabase を実行してください"
   ```

2. **必須ディレクトリ検証・自動作成**
   ```
   検証対象:
   - apps/web/src/types/
   - apps/web/src/validations/
   - apps/web/src/actions/
   - apps/web/src/hooks/
   - apps/web/src/app/api/

   存在しない場合: 自動作成
   ```

3. **依存関係確認**
   ```
   package.json確認:
   - zod: 必須
   - @tanstack/react-query: 必須

   不足時:
   - 警告表示
   - インストールコマンド提示: pnpm add zod @tanstack/react-query
   ```

### 検証結果の表示形式

```
前提条件チェック:
✓ Supabaseクライアント: apps/web/src/lib/supabase/server.ts
✓ ディレクトリ: types/, validations/, actions/, hooks/, app/api/
✓ 依存関係: zod, @tanstack/react-query
```

---

## Phase 2: ドキュメント解析

### Task 2.1: アーキテクチャ文書解析

**検索パス優先順位:**
1. `docs/requirements/architecture.md`
2. `docs/specs/architecture.md`
3. `--docs-path` オプションで指定されたパス

**抽出対象:**

1. **ER図からエンティティ抽出**
   ```
   正規表現パターン:
   - Mermaid ER図: /(\w+)\s*\{[^}]+\}/g
   - テーブル名抽出: /erDiagram.*?(\w+)\s*\|\|/gs
   ```

2. **テーブル定義からカラム抽出**
   ```
   パターン:
   - "#### [テーブル名] テーブル" セクション
   - | カラム名 | 型 | NULL | ... | の表形式
   ```

3. **RLS設定確認**
   ```
   - "Row Level Security" または "RLS" セクション
   - 認証方式: 'rls' | 'middleware' | 'both'
   ```

### Task 2.2: 機能仕様書解析

**検索パス優先順位:**
1. `docs/requirements/functions/_index.md`
2. `docs/specs/features/index.md`

**個別仕様ファイル検索:**
```
Glob パターン:
- docs/requirements/functions/**/F-*.md
- docs/requirements/functions/**/*.md
```

**抽出対象:**

1. **機能IDとカテゴリ**
   ```
   パターン: F-[CATEGORY]-[NUMBER]
   例: F-CARD-001, F-TAG-001, F-REVIEW-001
   ```

2. **入出力定義**
   ```
   セクション: "## 入力" または "## Input"
   セクション: "## 出力" または "## Output"
   ```

3. **ビジネスルール**
   ```
   セクション: "## ビジネスルール" または "## Business Rules"
   ```

### 解析結果の内部表現

```typescript
type ArchitectureData = {
  tables: {
    name: string;           // cards
    columns: ColumnDef[];
    primaryKey: string;
    foreignKeys: ForeignKey[];
  }[];
  authPattern: 'rls' | 'middleware' | 'both';
};

type FunctionSpec = {
  id: string;               // F-CARD-001
  category: string;         // card
  title: string;
  inputs: FieldDef[];
  outputs: FieldDef[];
  businessRules: string[];
};
```

---

## Phase 3: リソース検出・選択

### Task 3.1: リソース自動特定

**特定ロジック:**

1. **ER図エンティティから抽出**
   ```
   users → 除外（認証は別管理）
   cards → cards リソース
   tags → tags リソース
   card_tags → 除外（中間テーブル）
   study_logs → study リソース
   ```

2. **機能カテゴリから補完**
   ```
   functions/card/ → cards
   functions/tag/ → tags
   functions/review/ → review (study と統合)
   functions/stats/ → stats
   ```

3. **リソース名正規化**
   ```
   - kebab-case に統一
   - 複数形に統一（card → cards）
   - PascalCase版も保持（Card, Cards）
   ```

### Task 3.2: 対話的リソース選択

**引数なしの場合:**
```
検出されたリソース:
1. cards (カード管理) - CRUD + 今日の復習
2. tags (タグ管理) - CRUD
3. study (学習機能) - 学習セッション、評価
4. stats (統計) - 日別・累計統計

どのリソースを生成しますか？
- 番号で選択（例: 1,2）
- "all" で全て生成
- カンマ区切りで複数指定（例: cards,tags）
```

**引数ありの場合:**
```
/api-backend-generate cards     → cardsのみ生成
/api-backend-generate --all     → 全リソース生成
/api-backend-generate cards,tags → cards, tags生成
```

**無効なリソース名の場合:**
```
エラー: "orders" は有効なリソースではありません
有効なリソース: cards, tags, study, stats
```

---

## Phase 4: コード生成 [並列実行]

**重要: 以下の5種類のファイル生成を Task tool で並列実行する**

### 並列実行の実装

```
単一メッセージ内で複数のTask tool呼び出しを行う：

Task 1: 型定義生成 (4.1)
Task 2: Zodスキーマ生成 (4.2)
Task 3: Server Actions生成 (5.1)
Task 4: API Routes生成 (5.2)
Task 5: TanStack Queryフック生成 (6.1)

これらを1つのレスポンスで同時に実行
```

### Task 4.1: 型定義ファイル生成

**出力先:** `apps/web/src/types/[resource].ts`

**subagent プロンプト:**
```
[resource]の型定義ファイルを作成してください。

## 既存パターン参照
apps/web/src/types/card.ts を参照してスタイルを合わせること

## 生成する型
1. エンティティ型（例: Card）
   - DBテーブルのカラムに対応
   - camelCase命名（user_id → userId）
   - 日付は string 型（ISO 8601）
   - nullable は string | null

2. レスポンス型（例: CardsResponse）
   - { data: Card[], pagination: {...} }

3. 入力型
   - CreateCardInput: 作成時の必須/任意フィールド
   - UpdateCardInput: 更新時は全フィールドoptional

4. フィルター型（例: CardFilters）
   - クエリパラメータ用

## コード規約
- Named exportのみ（default export禁止）
- import type を使用
- セミコロン必須
- パスエイリアス @/ 使用
```

### Task 4.2: Zodスキーマファイル生成

**出力先:** `apps/web/src/validations/[resource].ts`

**subagent プロンプト:**
```
[resource]のZodスキーマファイルを作成してください。

## 既存パターン参照
apps/web/src/validations/card.ts を参照

## 生成するスキーマ
1. [resource]Schema: エンティティ全体
2. create[Resource]Schema: 作成用
3. update[Resource]Schema: 更新用（.partial()）
4. [resource]QuerySchema: クエリパラメータ用

## バリデーション要件
- 文字列: .min(1, '必須項目です').max(N, 'N文字以内で入力してください')
- UUID: .uuid()
- 数値: .int().min(0).max(N)
- 日付: .datetime()
- ページネーション: limit 1-100、offset 0以上

## 日本語エラーメッセージ
- '必須項目です'
- 'N文字以内で入力してください'
- '有効なUUIDを入力してください'
```

### Task 5.1: Server Actionsファイル生成

**出力先:** `apps/web/src/actions/[resource].ts`

**subagent プロンプト:**
```
[resource]のServer Actionsファイルを作成してください。

## 既存パターン参照
apps/web/src/actions/auth.ts を参照

## 必須要素
1. 'use server' ディレクティブ（ファイル先頭）
2. 認証チェック（全関数で必須）:
   const supabase = await createClient();
   const { data: { user }, error } = await supabase.auth.getUser();
   if (error || !user) throw new Error('Unauthorized');

3. Zodバリデーション
4. revalidatePath() 呼び出し

## 生成する関数
- create[Resource](input: Create[Resource]Input)
- update[Resource](id: string, input: Update[Resource]Input)
- delete[Resource](id: string)
- get[Resource](id: string)
- get[Resource]s(filters?: [Resource]Filters)

## 機能仕様に基づく追加関数
- getTodayCards() ← 日付フィルタ機能
- submitAssessment() ← 学習機能
```

### Task 5.2: API Routesファイル生成

**出力先:**
- `apps/web/src/app/api/[resource]/route.ts` (GET一覧, POST作成)
- `apps/web/src/app/api/[resource]/[id]/route.ts` (GET詳細, PATCH更新, DELETE削除)

**subagent プロンプト:**
```
[resource]のAPI Routes（Mobile用REST API）を作成してください。

## 認証方式
Bearer Token認証:
const authHeader = request.headers.get('Authorization');
if (!authHeader?.startsWith('Bearer ')) {
  return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '認証が必要です' } }, { status: 401 });
}

## レスポンス形式
成功（一覧）: { data: [...], pagination: { total, limit, offset } }
成功（単体）: { id, ... }
エラー: { error: { code: string, message: string } }

## HTTPステータスコード
200: 取得・更新成功
201: 作成成功
204: 削除成功
400: バリデーションエラー
401: 認証エラー
404: リソース不在
500: サーバーエラー

## 特殊エンドポイント（機能仕様に応じて）
- /api/[resource]/today/route.ts ← 日付フィルタ
- /api/[resource]/search/route.ts ← 検索機能
```

### Task 6.1: TanStack Queryフック生成

**出力先:** `apps/web/src/hooks/use[Resource].ts`

**subagent プロンプト:**
```
[resource]のTanStack Queryフックを作成してください。

## 構造
1. クエリキー定数（factory pattern）:
   export const [resource]Keys = {
     all: ['[resource]'] as const,
     lists: () => [...[resource]Keys.all, 'list'] as const,
     list: (filters) => [...[resource]Keys.lists(), filters] as const,
     detail: (id: string) => [...[resource]Keys.all, 'detail', id] as const,
   };

2. 取得フック:
   - use[Resource]s(filters?): useQuery
   - use[Resource](id): useQuery

3. ミューテーションフック:
   - useCreate[Resource](): useMutation + invalidateQueries
   - useUpdate[Resource](): useMutation + invalidateQueries
   - useDelete[Resource](): useMutation + invalidateQueries

## Server Actions呼び出し形式
mutationFn: create[Resource]  // Server Actionsを直接渡す

## キャッシュ無効化
onSuccess: () => {
  qc.invalidateQueries({ queryKey: [resource]Keys.lists() });
}
```

---

## Phase 5: 統合・検証

### Task 7.1: 既存ファイル競合処理

**競合検出:**
```
生成前に以下をチェック:
- apps/web/src/types/[resource].ts
- apps/web/src/validations/[resource].ts
- apps/web/src/actions/[resource].ts
- apps/web/src/hooks/use[Resource].ts
- apps/web/src/app/api/[resource]/route.ts
```

**競合時の処理:**
```
既存ファイルが検出されました:
- apps/web/src/types/card.ts

処理方法を選択してください:
1. 上書き - 既存ファイルを完全に置き換え
2. マージ - 既存の型/関数を保持し、不足分を追加
3. スキップ - このファイルの生成をスキップ
```

**--force オプション:**
```
確認なしで上書き
```

### Task 7.2: 並列生成オーケストレーション

**実行方法:**
```
1. 同一リソースの5種類ファイルを並列実行
2. 複数リソース対象時はリソース間も並列実行
3. TaskOutput で全subagent完了を待機
4. 結果を集約
```

**コンテキスト受け渡し:**
```
各subagentに以下を渡す:
- アーキテクチャ情報（テーブル定義、カラム）
- 機能仕様（入出力、ビジネスルール）
- 出力パス
- コード規約（Named export、パスエイリアス等）
- 既存パターン参照先
```

### Task 8.1: コード規約準拠検証

**検証項目:**
```
1. Named exportのみ使用（default export禁止）
   - 違反パターン: export default

2. any型未使用
   - 違反パターン: : any

3. セミコロン必須
   - 行末にセミコロンがあること

4. パスエイリアス使用
   - import from '@/' を使用
   - import from './' を禁止

5. import順序
   - 外部ライブラリ → 内部モジュール
```

**違反検出時:**
```
コード規約違反を検出しました:
- apps/web/src/types/card.ts:5 - default exportは禁止されています
- apps/web/src/actions/card.ts:12 - any型は使用できません

自動修正を行いますか？ [y/n]
```

---

## Phase 6: 完了サマリー

**表示形式:**
```
生成完了サマリー
================

リソース: cards
✓ apps/web/src/types/card.ts
✓ apps/web/src/validations/card.ts
✓ apps/web/src/actions/card.ts
✓ apps/web/src/app/api/cards/route.ts
✓ apps/web/src/app/api/cards/[id]/route.ts
✓ apps/web/src/hooks/useCard.ts

リソース: tags
✓ apps/web/src/types/tag.ts
✓ apps/web/src/validations/tag.ts
...

生成ファイル: 12
スキップ: 0
エラー: 0

次のステップ:
1. 生成されたコードを確認してください
2. pnpm build でコンパイルエラーがないか確認してください
3. pnpm test でテストを実行してください
```

---

## 使用方法

### スキル呼び出し

```
/api-backend-generate              # 対話的にリソース選択
/api-backend-generate cards        # cardsのみ生成
/api-backend-generate cards,tags   # 複数リソース指定
/api-backend-generate --all        # 全リソース生成
/api-backend-generate --force      # 確認なしで上書き
/api-backend-generate --docs-path=docs/specs  # カスタムドキュメントパス
```

### 引数一覧

| 引数 | 説明 | 例 |
|------|------|-----|
| なし | 対話的にリソースを選択 | `/api-backend-generate` |
| [resource] | 特定リソースのみ生成 | `/api-backend-generate cards` |
| [r1],[r2] | 複数リソース指定 | `/api-backend-generate cards,tags` |
| --all | 全リソースを生成 | `/api-backend-generate --all` |
| --force | 確認なしで上書き | `/api-backend-generate --force` |
| --docs-path | ドキュメントパス指定 | `/api-backend-generate --docs-path=docs/specs` |

---

## 生成ファイル一覧

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

---

## コード規約

### 型定義
```typescript
import type { Tag } from './tag';
import type { ListResponse } from './api';

// Named exportのみ（default export禁止）
export type Card = {
  id: string;
  userId: string;
  front: string;
  back: string;
  reviewLevel: number;
  nextReviewAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CardWithTags = Card & {
  tags: Tag[];
};

export type CardListResponse = ListResponse<CardWithTags>;

export type CreateCardInput = {
  front: string;
  back: string;
  tagIds?: string[];
};

export type UpdateCardInput = Partial<CreateCardInput>;
```

### Zodスキーマ
```typescript
import { z } from 'zod';

export const cardSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  front: z.string().min(1, '必須項目です').max(10000, '10000文字以内で入力してください'),
  back: z.string().min(1, '必須項目です').max(10000, '10000文字以内で入力してください'),
  reviewLevel: z.number().int().min(0).max(6),
  nextReviewAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createCardSchema = z.object({
  front: z.string().min(1, '必須項目です').max(10000, '10000文字以内で入力してください'),
  back: z.string().min(1, '必須項目です').max(10000, '10000文字以内で入力してください'),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const updateCardSchema = createCardSchema.partial();

export const cardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  tagId: z.string().uuid().optional(),
  status: z.enum(['all', 'due', 'completed']).default('all'),
});
```

### Server Actions
```typescript
'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/lib/supabase/server';
import { createCardSchema } from '@/validations/card';

import type { CreateCardInput } from '@/types/card';

export async function createCard(input: CreateCardInput) {
  const supabase = await createClient();

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
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Bearer Token認証
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    );
  }

  const token = authHeader.split(' ')[1];
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  // RLSにより自動的にユーザーのデータのみ取得
  const { data, error, count } = await supabase
    .from('cards')
    .select('*', { count: 'exact' });

  if (error) {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    data,
    pagination: { total: count ?? 0, limit: 20, offset: 0 },
  });
}
```

### TanStack Query フック
```typescript
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createCard, deleteCard, getCards, updateCard } from '@/actions/cards';

import type { CardFilters } from '@/types/card';

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
    queryFn: () => getCards(filters),
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

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCardInput }) =>
      updateCard(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCard,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });
}
```

---

## 注意事項

1. **認証・認可**: Server ActionsとAPI Routesには必ず認証チェックを含める
2. **RLS**: Supabase RLSが有効な前提で設計
3. **バリデーション**: Zodスキーマで入力を必ず検証
4. **キャッシュ**: Next.js 15ではfetchのデフォルトがno-storeに変更されているため明示指定

---

## トラブルシューティング

### Q: 機能仕様が見つからない
A: `docs/requirements/functions/` ディレクトリが存在するか確認。存在しない場合は先にドキュメントを作成。

### Q: 型定義が既に存在する
A: 競合処理フェーズで上書き/マージ/スキップを選択できます。

### Q: Supabaseクライアントが設定されていない
A: `/dev:04-setup-supabase` スキルを先に実行してください。

### Q: 依存関係が不足している
A: 表示されたコマンド（`pnpm add zod @tanstack/react-query`）を実行してください。

### Q: TypeScriptエラーが発生する
A: 既存の型定義ファイル（`apps/web/src/types/api.ts`等）との整合性を確認してください。
