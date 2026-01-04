---
name: e2e-test-all
description: 全画面E2Eテスト実行。UIテストを一括実行し、テスト失敗時の分析・修正提案を行う。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, TodoWrite
---

# E2E テスト一括実行スキル

PlaywrightによるE2Eテストを一括実行し、失敗時は分析・修正提案を行う。

## 使用方法

```bash
# 全テスト実行
/e2e-test-all

# 特定のテストファイルのみ
/e2e-test-all auth

# Visual Regressionテストのみ
/e2e-test-all visual

# 失敗したテストのみ再実行
/e2e-test-all --failed
```

## 実行手順

### Step 1: 環境確認

1. 環境変数の確認
```bash
# apps/web/.env.local に以下が設定されているか確認
# TEST_USER_EMAIL=xxx
# TEST_USER_PASSWORD=xxx
```

2. 開発サーバーの状態確認

### Step 2: テスト実行

```bash
cd apps/web
pnpm test:e2e
```

**オプション:**
- `--project=chromium`: 認証必要なテストのみ
- `--project=chromium-no-auth`: 認証不要なテストのみ
- `--grep "タグ"`: 特定のテスト名でフィルタ
- `--update-snapshots`: Visual Regressionの基準画像を更新

### Step 3: 結果分析

テスト失敗時:
1. `test-results/` ディレクトリのスクリーンショット確認
2. `playwright-report/` のHTMLレポート確認
3. 失敗原因の特定（セレクタ変更、UI変更、ロジックエラー）

### Step 4: 修正提案

失敗原因に応じて:

| 原因 | 対応 |
|------|------|
| セレクタが見つからない | data-testid追加、セレクタ更新 |
| タイムアウト | waitFor追加、タイムアウト延長 |
| Visual差分 | 意図的なら `--update-snapshots`、バグなら修正 |
| 認証エラー | storageState確認、auth.setup.ts確認 |

## テストファイル構成

```
apps/web/e2e/
├── auth.setup.ts       # 認証セットアップ
├── auth.spec.ts        # 認証フロー（認証不要）
├── splash.spec.ts      # スプラッシュ画面（認証不要）
├── cards.spec.ts       # カード学習フロー
├── tags.spec.ts        # タグ管理フロー
├── stats.spec.ts       # 統計画面
├── settings.spec.ts    # 設定画面
├── ui-regression.spec.ts # UI回帰テスト
├── visual.spec.ts      # Visual Regression
└── .auth/
    └── user.json       # 認証状態保存
```

## 画面カバレッジ

| 画面 | URL | テストファイル |
|------|-----|---------------|
| ログイン | /login | auth.spec.ts |
| 新規登録 | /signup | auth.spec.ts |
| パスワードリセット | /reset-password | auth.spec.ts |
| スプラッシュ | /splash | splash.spec.ts |
| ホーム | / | cards.spec.ts |
| カード新規作成 | /cards/new | cards.spec.ts |
| カード編集 | /cards/[id]/edit | cards.spec.ts |
| タグ管理 | /tags | tags.spec.ts |
| 統計 | /stats | stats.spec.ts |
| 設定 | /settings | settings.spec.ts |

## トラブルシューティング

### 認証エラー
```bash
# auth.setup.ts が失敗する場合
# 1. 環境変数確認
cat apps/web/.env.local | grep TEST_USER

# 2. storageState削除して再実行
rm -rf apps/web/e2e/.auth
pnpm test:e2e
```

### Visual Regression 差分
```bash
# 意図的な変更の場合、基準画像を更新
pnpm test:e2e --update-snapshots
```

### タイムアウト
```bash
# タイムアウトを延長して実行
pnpm test:e2e --timeout=60000
```
