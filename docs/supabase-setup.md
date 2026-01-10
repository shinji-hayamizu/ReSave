# Supabase セットアップガイド

## 環境変数の設定

### apps/web/.env.local

```bash
# ===========================================
# ローカル開発 (supabase start で起動)
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# ===========================================
# 本番 / ステージング (Supabase Dashboard から取得)
# ===========================================
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 接続確認方法

### 1. CLI スクリプトで確認

```bash
# ローカルSupabase接続確認
cd apps/web
pnpm check:supabase:local

# 環境変数の設定で接続確認
pnpm check:supabase
```

### 2. API エンドポイントで確認

開発サーバー起動後、以下のエンドポイントにアクセス:

```
GET http://localhost:3000/api/health
```

レスポンス例:

```json
{
  "status": "ok",
  "message": "Supabase接続成功",
  "env": {
    "supabaseUrl": "set",
    "supabaseAnonKey": "set",
    "environment": "local"
  },
  "supabase": {
    "auth": {
      "connected": true,
      "user": null
    },
    "database": {
      "status": "connected_rls_active",
      "error": null
    }
  },
  "timestamp": "2026-01-03T12:00:00.000Z"
}
```

### 3. ブラウザ開発者ツールで確認

開発サーバー起動後、ブラウザのコンソールで:

```javascript
fetch('/api/health')
  .then((r) => r.json())
  .then(console.log);
```

## 環境別設定

### ローカル開発

1. ローカル Supabase を起動:

   ```bash
   supabase start
   ```

2. 表示されるキーを確認（anon key はデフォルトで固定）

3. マイグレーションを適用:
   ```bash
   supabase db push
   ```

### 本番 / ステージング

1. [Supabase Dashboard](https://supabase.com/dashboard) でプロジェクト作成

2. Settings > API から以下を取得:

   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. `.env.local` に設定

4. リモートマイグレーション適用:
   ```bash
   supabase db push --db-url "postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"
   ```

## トラブルシューティング

### 接続エラー

| エラー               | 原因                          | 対処法                                   |
| -------------------- | ----------------------------- | ---------------------------------------- |
| `NEXT_PUBLIC_*未設定` | 環境変数が設定されていない    | `.env.local`ファイルを作成               |
| `PGRST116`           | テーブルが存在しない          | `supabase db push`でマイグレーション適用 |
| `42501`              | RLS権限エラー（未認証）       | 正常動作。認証後にデータアクセス可能     |
| `Connection refused` | ローカルSupabaseが起動してない | `supabase start`を実行                   |

### ローカルSupabase の再起動

```bash
supabase stop
supabase start
```

### データベースのリセット

```bash
supabase db reset
```



