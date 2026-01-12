# デプロイガイド

## 概要

本プロジェクトは Vercel + Supabase でホスティングしています。

| 環境 | ブランチ | URL | 用途 |
|------|---------|-----|------|
| Production | main | resave.vercel.app | 本番環境 |
| Preview | develop | develop-resave.vercel.app | ステージング/QA |
| Preview | feature/* | pr-xxx-resave.vercel.app | PR プレビュー |

---

## ブランチ戦略

```
main ─────────────●───────────●─── 本番環境
                  ↑           ↑
develop ───●──●──●───●──●──●──●─── ステージング
            \   /     \     /
             feature   feature
```

### ブランチの役割

| ブランチ | 用途 | マージ先 |
|---------|------|----------|
| main | 本番リリース済みコード | - |
| develop | 開発統合・QA | main |
| feature/* | 機能開発 | develop |
| hotfix/* | 緊急修正 | main, develop |

### 開発フロー

1. `develop` から feature ブランチを作成
2. 開発完了後、`develop` へ PR 作成
3. レビュー・マージ → Preview 環境で確認
4. QA 完了後、`develop` → `main` へ PR 作成
5. マージ → Production デプロイ

---

## Vercel 設定

### 自動デプロイ

Vercel は GitHub 連携により自動デプロイを行います：

- **main ブランチへのプッシュ** → Production デプロイ
- **develop ブランチへのプッシュ** → Preview デプロイ
- **PR 作成** → Preview デプロイ（PR ごとに一意の URL）

### 環境変数

Vercel ダッシュボードで以下を設定：

| 変数名 | Production | Preview | 説明 |
|--------|------------|---------|------|
| NEXT_PUBLIC_SUPABASE_URL | 本番 URL | 開発 URL | Supabase API URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | 本番 Key | 開発 Key | Supabase 公開キー |
| SUPABASE_SERVICE_ROLE_KEY | 本番 Key | 開発 Key | Supabase サービスキー |

### Build 設定

| 項目 | 値 |
|------|-----|
| Framework Preset | Next.js |
| Root Directory | apps/web |
| Build Command | pnpm build |
| Output Directory | .next |
| Install Command | pnpm install |

---

## 手動デプロイ（緊急時）

### Vercel CLI

```bash
# CLI インストール
npm i -g vercel

# ログイン
vercel login

# Preview デプロイ
vercel

# Production デプロイ
vercel --prod
```

### ロールバック

Vercel ダッシュボードから即座にロールバック可能：

1. Deployments タブを開く
2. 戻したいデプロイを選択
3. 「Promote to Production」をクリック

---

## Supabase 環境

| 環境 | 用途 | プロジェクト |
|------|------|-------------|
| Production | 本番データ | resave-prod |
| Development | 開発・テスト | resave-dev |
| Local | ローカル開発 | supabase start |

### マイグレーション適用

```bash
# ローカル → リモート（開発環境）
supabase db push --linked

# マイグレーションファイル作成
supabase migration new <name>
```

---

## トラブルシューティング

### ビルドエラー

1. ローカルで `pnpm build` を実行して再現確認
2. 環境変数が正しく設定されているか確認
3. Vercel のビルドログを確認

### デプロイが反映されない

1. Vercel ダッシュボードでデプロイステータスを確認
2. ブラウザキャッシュをクリア
3. 別ブラウザ/シークレットモードで確認

### 環境変数の問題

- `NEXT_PUBLIC_` プレフィックスがないとクライアントで参照不可
- 環境変数変更後は再デプロイが必要
