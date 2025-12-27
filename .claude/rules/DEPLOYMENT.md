# 本番環境デプロイ手順

## 前提条件

- EC2 インスタンスに Docker と Docker Compose がインストール済み
- Git がインストール済み

---

## 初回セットアップ

### 1. リポジトリのクローン

```bash
cd /opt
git clone <repository-url> barrierfree-employment
cd barrierfree-employment/docker/production
```

### 2. 環境変数の設定

```bash
cp .env.production.example .env.production
vi .env.production  # AWS Cognito の情報と本番 URL を設定
```

必要な環境変数の詳細は `.env.production.example` を参照。

---

## Docker Compose コマンド

すべてのコマンドは `docker/production` ディレクトリで実行:

```bash
cd /opt/barrierfree-employment/docker/production
```

### 起動

```bash
# 1. サービス起動
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# 2. データベースマイグレーション実行（初回 or スキーマ更新時）
docker-compose -f docker-compose.prod.yml --env-file .env.production run --rm migrate
```

マイグレーションの詳細は `docs/MIGRATION.md` を参照。

### 停止

```bash
docker-compose -f docker-compose.prod.yml down
```

### 再起動

```bash
docker-compose -f docker-compose.prod.yml restart
```

### ログ確認

```bash
# 全サービス
docker-compose -f docker-compose.prod.yml logs -f

# 特定サービス
docker-compose -f docker-compose.prod.yml logs -f attendance
```

### ステータス確認

```bash
docker-compose -f docker-compose.prod.yml ps
```

---

## コード更新時の再デプロイ

```bash
# プロジェクトルートに移動
cd /opt/barrierfree-employment

# 最新コードを取得
git pull

# 本番環境ディレクトリに移動
cd docker/production

# イメージ再ビルド
docker-compose -f docker-compose.prod.yml build --no-cache

# サービス再起動
docker-compose -f docker-compose.prod.yml up -d

# マイグレーション実行（スキーマ変更がある場合）
docker-compose -f docker-compose.prod.yml --env-file .env.production run --rm migrate
```

---

## 設定情報

### DB アカウント

`docker-compose.prod.yml` に記載:

- Root: `root` / `rootpassword`
- App: `app_user` / `apppassword`

### Redis

- Password: `redispassword`

### 公開ポート

- `3000`: Traefik (ELB からアクセス)

---

## ヘルスチェック

```bash
curl http://localhost:3000/attendance
```

---

## アーキテクチャ

```
CloudFront → ELB (TLS終端) → EC2:3000 (Traefik)
                                ├─ /attendance → attendance:3000
                                └─ /auth → jwt-validator:3000
```

詳細なアーキテクチャ設計は `docs/ARCHITECTURE.md` を参照。
