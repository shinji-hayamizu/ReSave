# データベースマイグレーションガイド

## 概要
[golang-migrate](https://github.com/golang-migrate/migrate)を使用してデータベースマイグレーションを管理します。docker-composeで自動実行され、継続的なスキーマ管理が可能です。

## マイグレーションの仕組み
- `migrations/`ディレクトリに連番付きSQLファイルを配置
- 各マイグレーションは`up`（適用）と`down`（ロールバック）のペア
- `schema_migrations`テーブルで適用履歴を管理

## ディレクトリ構造
```
migrations/
├── 000001_init_schema.up.sql       # 初期スキーマ作成
├── 000001_init_schema.down.sql     # 初期スキーマ削除
├── 000002_auth_tables.up.sql       # 認証テーブル追加
├── 000002_auth_tables.down.sql     # 認証テーブル削除
└── ...
```

## 基本コマンド

### 環境構築
```bash
# 全サービス起動（マイグレーション自動実行）
docker-compose up -d

# 手動マイグレーション実行
docker-compose run --rm migrate \
  -path=/migrations \
  -database="mysql://root:rootpassword@tcp(mysql:3306)/barrier_free_db" \
  up

# マイグレーションステータス確認
docker-compose run --rm migrate \
  -path=/migrations \
  -database="mysql://root:rootpassword@tcp(mysql:3306)/barrier_free_db" \
  version
```

### 新しいマイグレーション作成
```bash
# タイムスタンプ付きファイル生成
TIMESTAMP=$(date +%Y%m%d%H%M%S)
touch migrations/${TIMESTAMP}_add_user_preferences.up.sql
touch migrations/${TIMESTAMP}_add_user_preferences.down.sql

# または連番で作成
touch migrations/000003_add_user_preferences.up.sql
touch migrations/000003_add_user_preferences.down.sql
```

### ロールバック
```bash
# 直前のマイグレーションをロールバック
docker-compose run --rm migrate \
  -path=/migrations \
  -database="mysql://root:rootpassword@tcp(mysql:3306)/barrier_free_db" \
  down 1

# 特定バージョンに強制設定（緊急時のみ）
docker-compose run --rm migrate \
  -path=/migrations \
  -database="mysql://root:rootpassword@tcp(mysql:3306)/barrier_free_db" \
  force 1
```

### デバッグ
```bash
# MySQLに直接接続
docker-compose exec mysql mysql -uroot -prootpassword barrier_free_db

# マイグレーション履歴確認
mysql> SELECT * FROM schema_migrations;
```

## 開発フロー

1. **新機能開発時**
   ```bash
   # 1. マイグレーションファイル作成
   touch migrations/000003_feature_name.up.sql
   touch migrations/000003_feature_name.down.sql

   # 2. SQLファイル編集
   vim migrations/000003_feature_name.up.sql
   vim migrations/000003_feature_name.down.sql

   # 3. マイグレーション実行
   docker-compose run --rm migrate \
     -path=/migrations \
     -database="mysql://root:rootpassword@tcp(mysql:3306)/barrier_free_db" \
     up

   # 4. 動作確認
   docker-compose exec mysql mysql -uroot -prootpassword barrier_free_db
   ```

2. **環境リセット**
   ```bash
   # データベース完全リセット（注意：データ消去）
   docker-compose down -v
   docker-compose up -d
   ```

## マイグレーションファイル命名規則
- 形式: `[連番]_[説明].{up|down}.sql`
- 連番: 6桁ゼロパディング（000001, 000002...）
- 説明: snake_case使用
- 例: `000003_add_user_preferences.up.sql`

## ベストプラクティス

1. **トランザクション使用**
   ```sql
   BEGIN;
   -- マイグレーション処理
   COMMIT;
   ```

2. **冪等性の確保**
   ```sql
   CREATE TABLE IF NOT EXISTS ...
   ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...
   ```

3. **データ保護**
   - プロダクションデータの破壊的変更は避ける
   - 必ずdown.sqlを実装してロールバック可能にする

4. **テスト**
   - ローカル環境でup/downの両方をテスト
   - データが存在する状態でのマイグレーションも確認

## トラブルシューティング

### マイグレーション失敗時
```bash
# 現在のバージョン確認
docker-compose run --rm migrate \
  -path=/migrations \
  -database="mysql://root:rootpassword@tcp(mysql:3306)/barrier_free_db" \
  version

# 手動でロールバック
docker-compose run --rm migrate \
  -path=/migrations \
  -database="mysql://root:rootpassword@tcp(mysql:3306)/barrier_free_db" \
  down 1

# SQLを修正後、再実行
docker-compose run --rm migrate \
  -path=/migrations \
  -database="mysql://root:rootpassword@tcp(mysql:3306)/barrier_free_db" \
  up
```

### スキーマ不整合時
```bash
# 強制的にバージョンリセット（最終手段）
docker-compose run --rm migrate \
  -path=/migrations \
  -database="mysql://root:rootpassword@tcp(mysql:3306)/barrier_free_db" \
  force 0

# データベース再構築
docker-compose down -v
docker-compose up -d
```

## 本番環境への適用

### AWS Aurora MySQL使用時
```bash
# 環境変数設定
export DB_HOST=aurora-endpoint.amazonaws.com
export DB_USER=admin
export DB_PASSWORD=secure_password

# マイグレーション実行
migrate -path=./migrations \
  -database="mysql://${DB_USER}:${DB_PASSWORD}@tcp(${DB_HOST}:3306)/barrier_free_db" \
  up
```

### CI/CDパイプライン統合
GitHub Actionsやその他のCI/CDツールで自動実行可能：
```yaml
- name: Run migrations
  run: |
    docker run --rm \
      -v ./migrations:/migrations \
      migrate/migrate \
      -path=/migrations \
      -database="${DATABASE_URL}" \
      up
```
