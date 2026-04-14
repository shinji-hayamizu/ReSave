# デプロイガイド

## 概要

本プロジェクトは Vercel + Supabase でホスティングしています。

| 環境 | ブランチ | URL | 用途 |
|------|---------|-----|------|
| Production | master | resave.vercel.app | 本番環境 |
| Preview | develop | develop-resave.vercel.app | ステージング/QA |
| Preview | feature/* | pr-xxx-resave.vercel.app | PR プレビュー |

---

## ブランチ戦略

```
master ─────────────●───────────●─── 本番環境
                  ↑           ↑
develop ───●──●──●───●──●──●──●─── ステージング
            \   /     \     /
             feature   feature
```

### ブランチの役割

| ブランチ | 用途 | マージ先 |
|---------|------|----------|
| master | 本番環境 (Production) | - |
| develop | 開発統合・QA | master |
| feature/* | 機能開発 | develop |
| hotfix/* | 緊急修正 | master, develop |

### 開発フロー

1. `develop` から feature ブランチを作成
2. 開発完了後、`develop` へ PR 作成
3. レビュー・マージ → Preview 環境で確認
4. QA 完了後、`develop` → `master` へ PR 作成
5. マージ → Production デプロイ

---

## Vercel 設定

### 自動デプロイ

Vercel は GitHub 連携により自動デプロイを行います：

- **master ブランチへのプッシュ** → Production デプロイ
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

### マイグレーション適用フロー

DBスキーマ変更が含まれるリリースは、**必ずコードのデプロイ前にマイグレーションを適用**すること。
順序が逆になるとコードが新スキーマを前提に動くのに DB が古い状態となり障害になる。

#### 1. マイグレーションファイルの作成

```bash
# プロジェクトルートで実行
supabase migration new <name>
# 例: supabase migration new add_column_to_cards
# → supabase/migrations/YYYYMMDDHHMMSS_add_column_to_cards.sql が生成される
```

#### 2. ローカルで確認

```bash
supabase start          # ローカル Supabase 起動
supabase db reset       # 全マイグレーションをローカルに適用して動作確認
```

#### 3. 開発環境（resave-dev）に適用

```bash
# Supabase ダッシュボード → resave-dev のプロジェクト設定 → Reference ID をコピー
supabase link --project-ref <dev-project-ref>
supabase db push
```

Preview（develop-resave.vercel.app）で動作確認する。

#### 4. 本番環境（resave-prod）に適用 ← masterマージの前に必ず実施

```bash
# Supabase ダッシュボード → resave-prod のプロジェクト設定 → Reference ID をコピー
supabase link --project-ref <prod-project-ref>
supabase db push
```

適用後、Supabase ダッシュボードの Table Editor でスキーマが正しく反映されていることを確認する。

#### 5. masterにマージ → Vercel が自動デプロイ

本番 DB への適用完了を確認してから PR をマージする。

#### マイグレーションが不要なリリース（今回のような UI/ロジック修正のみ）

DBスキーマ変更がなければ上記手順は不要。Preview で動作確認後、そのまま master にマージしてよい。

変更内容にマイグレーションが含まれるかは以下で確認できる：

```bash
git diff origin/master...HEAD -- supabase/migrations/
```

差分がなければマイグレーション不要。

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
