# Vercel Supabase環境変数セットアップ

VercelにSupabase環境変数を設定する。

## 手順

### 1. 環境変数を順番に質問

以下の4つの値をユーザーに1つずつ質問する：

1. **Production用 SUPABASE_URL** を入力してください
2. **Production用 SUPABASE_ANON_KEY** を入力してください
3. **Preview用 SUPABASE_URL** を入力してください
4. **Preview用 SUPABASE_ANON_KEY** を入力してください

### 2. 環境変数を設定

取得した値を使って以下のコマンドを実行：

```bash
# Production
echo "<URL>" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "<KEY>" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# Preview
echo "<URL>" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview
echo "<KEY>" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
```

### 3. 完了報告

設定完了後、再デプロイが必要であることを伝える。
