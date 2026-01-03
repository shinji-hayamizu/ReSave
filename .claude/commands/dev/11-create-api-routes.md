---
description: Mobile用REST API作成（/api/cards, /api/tags, /api/study）。Expo/ReactNativeからのデータアクセス基盤を構築する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: [出力先ディレクトリ (例: apps/web)]
---

# Mobile用REST API作成

MobileアプリからのデータアクセスのためのREST APIを実装する。

## 前提

以下が完了済みであること:
- カードCRUD機能（`/dev:07-implement-cards`）
- タグ管理機能（`/dev:08-implement-tags`）
- 学習機能（`/dev:09-implement-study`）
- 統計機能（`/dev:10-implement-stats`）

**アーキテクチャファイルの場所（優先順）:**
1. `.kiro/specs/*/design.md` (Kiroスペック)
2. `docs/requirements/architecture.md` (標準)

**機能仕様の場所:**
- `docs/requirements/functions/sync/F-050-data-sync.md`

---

## 参照ドキュメント（必須読み込み）

以下のドキュメントを読み込み、API設計を確認すること:

1. **アーキテクチャ** - API Routes設計、認証フロー
2. **.claude/rules/next/api-design.md** - API設計ルール
3. **機能仕様（sync/）** - データ同期要件

---

## あなたの役割

APIエンジニアとして、Mobile向けのREST APIを実装する。
既存のServer ActionsをラップしてREST APIとして公開し、Bearer Token認証でセキュアなアクセスを提供する。

## 実行方法

- このタスクは **ultrathink** で実行すること
- **各API Route作成はsubAgentで並列実行**すること

---

## Step 1: プロジェクト構造の確認

### 1.1 出力先の特定

引数 `$ARGUMENTS` からプロジェクトルートを特定。

| 項目 | 確認内容 |
|------|---------|
| プロジェクトルート | $ARGUMENTS (例: `apps/web`) |
| API Routes | `{root}/src/app/api/` |
| 共通ユーティリティ | `{root}/src/lib/api/` |

### 1.2 API設計の確認

既存のServer Actionsを確認し、REST APIでラップするエンドポイントを特定:
- cards: CRUD + today取得
- tags: CRUD
- study: 評価送信

---

## Step 2: API認証ユーティリティ

### 2.1 認証ヘルパー

#### {root}/src/lib/api/auth.ts

Bearer Token認証ヘルパーを実装:
- `getAuthenticatedUser(request)` - Authorizationヘッダーからユーザー取得
- トークン検証失敗時は401エラー
- Supabaseクライアント作成（トークン付き）

```typescript
// 実装例
export async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Unauthorized' }
  }

  const token = authHeader.split(' ')[1]
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, supabase, error }
}
```

---

## Step 3: Cards API

### 3.1 カード一覧・作成

#### {root}/src/app/api/cards/route.ts

- GET: カード一覧取得（フィルタ: tagIds, state, limit, offset）
- POST: カード作成

### 3.2 今日の復習カード

#### {root}/src/app/api/cards/today/route.ts

- GET: 今日の復習対象カード取得（tagIds フィルタ対応）

### 3.3 カード詳細・更新・削除

#### {root}/src/app/api/cards/[id]/route.ts

- GET: カード詳細取得
- PATCH: カード更新
- DELETE: カード削除

---

## Step 4: Tags API

### 4.1 タグ一覧・作成

#### {root}/src/app/api/tags/route.ts

- GET: タグ一覧取得
- POST: タグ作成

### 4.2 タグ更新・削除

#### {root}/src/app/api/tags/[id]/route.ts

- PATCH: タグ更新
- DELETE: タグ削除

---

## Step 5: Study API

### 5.1 学習結果送信

#### {root}/src/app/api/study/route.ts

- POST: 学習結果送信（cardId, rating, timeSpent）
- レスポンス: 更新後のカード情報、次回復習日

---

## Step 6: レスポンス形式統一

### 6.1 共通レスポンスヘルパー

#### {root}/src/lib/api/response.ts

レスポンス形式を統一:
- 成功（一覧）: `{ data: [...], pagination: { total, limit, offset } }`
- 成功（単体）: `{ id, ... }`
- エラー: `{ error: { code: string, message: string, details?: any } }`

---

## Step 7: エラーハンドリング

### 7.1 共通エラーハンドラー

#### {root}/src/lib/api/error.ts

HTTPステータスコードマッピング:
- 400: リクエスト不正
- 401: 認証エラー
- 404: リソース不在
- 422: バリデーションエラー
- 500: サーバーエラー

---

## 完了条件

- [ ] 認証ユーティリティが作成されている
- [ ] Cards API（GET/POST/PATCH/DELETE + today）が動作する
- [ ] Tags API（GET/POST/PATCH/DELETE）が動作する
- [ ] Study API（POST）が動作する
- [ ] Bearer Token認証が動作する
- [ ] レスポンス形式が統一されている
- [ ] エラーハンドリングが実装されている
- [ ] 未認証リクエストが401を返す

---

## 完了後のアクション

```
## Mobile用REST API作成が完了しました

### 作成されたファイル
- {root}/src/lib/api/auth.ts
- {root}/src/lib/api/response.ts
- {root}/src/lib/api/error.ts
- {root}/src/app/api/cards/route.ts
- {root}/src/app/api/cards/today/route.ts
- {root}/src/app/api/cards/[id]/route.ts
- {root}/src/app/api/tags/route.ts
- {root}/src/app/api/tags/[id]/route.ts
- {root}/src/app/api/study/route.ts

### APIエンドポイント一覧
| メソッド | パス | 説明 |
|---------|-----|-----|
| GET | /api/cards | カード一覧 |
| POST | /api/cards | カード作成 |
| GET | /api/cards/today | 今日の復習カード |
| GET | /api/cards/:id | カード詳細 |
| PATCH | /api/cards/:id | カード更新 |
| DELETE | /api/cards/:id | カード削除 |
| GET | /api/tags | タグ一覧 |
| POST | /api/tags | タグ作成 |
| PATCH | /api/tags/:id | タグ更新 |
| DELETE | /api/tags/:id | タグ削除 |
| POST | /api/study | 学習結果送信 |

### 動作確認結果
| 項目 | 状態 |
|------|------|
| Cards API | [Success/Failed] |
| Tags API | [Success/Failed] |
| Study API | [Success/Failed] |
| 認証 | [Success/Failed] |

### 次のステップ
- PWA対応（`/dev:12-setup-pwa`）
```

---

## 次のステップ
- `/dev:12-setup-pwa` - PWA対応（Service Worker、manifest）
