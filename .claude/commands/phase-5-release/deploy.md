---
description: デプロイ設定・CI/CD・運用準備
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
---

# Phase 5-B: デプロイ・運用準備

## 前提
以下が完了済みであること:
- 結合テスト・動作確認（`/phase-5-release/integration`）
- 全てのP0/P1バグが修正済み

---

## 参照ドキュメント（必須読み込み）
- `docs/requirements/architecture.md`（インフラ設計セクション）
- `docs/requirements/non-functional.md`

## あなたの役割
DevOpsエンジニア。
安全で効率的なデプロイパイプラインを構築する。

## 実行方法
このタスクは **ultrathink** で実行すること。

---

## Step 1: デプロイ環境の確認

### 1.1 インフラ構成

architecture.md から確認:

| 項目 | 設定 |
|------|------|
| ホスティング | Vercel / AWS / その他 |
| データベース | Supabase / PlanetScale / その他 |
| 認証 | Supabase Auth / NextAuth / その他 |
| ストレージ | Supabase Storage / S3 / その他 |
| CI/CD | GitHub Actions / Vercel / その他 |

### 1.2 環境構成

| 環境 | URL | 用途 |
|------|-----|------|
| development | localhost:3000 | ローカル開発 |
| preview | pr-xxx.vercel.app | PRプレビュー |
| staging | stg.example.com | 本番前テスト |
| production | example.com | 本番環境 |

---

## Step 2: Vercel デプロイ設定

### 2.1 Vercel プロジェクト作成

```bash
# Vercel CLI インストール
pnpm add -D vercel

# プロジェクト連携
npx vercel link
```

### 2.2 環境変数設定

Vercel Dashboard で環境変数を設定:

| 変数名 | 環境 | 説明 |
|-------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | Service Role Key（必要な場合） |

### 2.3 vercel.json

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["hnd1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## Step 3: GitHub Actions CI/CD

### 3.1 CI ワークフロー

#### .github/workflows/ci.yml
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

### 3.2 E2Eテストワークフロー

#### .github/workflows/e2e.yml
```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright Browsers
        run: pnpm exec playwright install --with-deps

      - name: Run Playwright tests
        run: pnpm exec playwright test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Upload Playwright Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## Step 4: Supabase 本番設定

### 4.1 本番プロジェクト作成

```
Supabase Dashboard:
1. 新規プロジェクト作成（本番用）
2. Project URL と keys を取得
3. Authentication > Providers 設定
4. Database > RLS ポリシー確認
```

### 4.2 マイグレーション適用

```bash
# Supabase CLI でリモートに接続
supabase link --project-ref [project-id]

# マイグレーション適用
supabase db push
```

### 4.3 バックアップ設定

Supabase Dashboard で確認:
- 自動バックアップ: 有効（日次）
- Point-in-time recovery: 必要に応じて有効化

---

## Step 5: 本番環境チェックリスト

### 5.1 セキュリティ

- [ ] 環境変数が正しく設定されている
- [ ] HTTPS が有効
- [ ] セキュリティヘッダーが設定されている
- [ ] RLS ポリシーが有効
- [ ] 認証が正しく動作する
- [ ] CORS が適切に設定されている

### 5.2 パフォーマンス

- [ ] 画像が最適化されている
- [ ] バンドルサイズが適切
- [ ] キャッシュ戦略が設定されている
- [ ] CDN が有効
- [ ] Core Web Vitals が良好

### 5.3 監視・ログ

- [ ] エラーログが収集される
- [ ] パフォーマンスメトリクスが収集される
- [ ] アラートが設定されている

### 5.4 運用

- [ ] ロールバック手順が文書化されている
- [ ] 障害対応手順が文書化されている
- [ ] バックアップが有効

---

## Step 6: エラー監視設定（オプション）

### 6.1 Sentry 設定

```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

#### sentry.client.config.ts
```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})
```

### 6.2 Vercel Analytics（代替）

```bash
pnpm add @vercel/analytics @vercel/speed-insights
```

#### src/app/layout.tsx に追加
```typescript
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

---

## Step 7: 本番デプロイ

### 7.1 デプロイ前チェック

```bash
# ビルド確認
pnpm build

# Lint/Type確認
pnpm lint
pnpm typecheck

# テスト
pnpm test
```

### 7.2 デプロイ実行

```bash
# Vercelへデプロイ（自動）
git push origin main

# または手動デプロイ
npx vercel --prod
```

### 7.3 デプロイ後確認

| 項目 | 確認方法 | 状態 |
|------|---------|-----|
| サイトアクセス | 本番URLにアクセス | [ ] |
| ログイン | テストユーザーでログイン | [ ] |
| 主要機能 | 各機能の動作確認 | [ ] |
| SSL | 証明書が有効 | [ ] |
| パフォーマンス | Lighthouse実行 | [ ] |

---

## Step 8: 運用ドキュメント作成

### 8.1 README.md 更新

```markdown
# [プロジェクト名]

## 環境

| 環境 | URL | ブランチ |
|------|-----|---------|
| Production | https://example.com | main |
| Preview | PRごとに自動生成 | feature/* |

## 開発

### セットアップ
\`\`\`bash
pnpm install
cp .env.example .env.local
pnpm dev
\`\`\`

### コマンド
- `pnpm dev` - 開発サーバー起動
- `pnpm build` - ビルド
- `pnpm test` - テスト実行
- `pnpm lint` - Lint実行

## デプロイ

mainブランチへのpushで自動デプロイ。

### 手動デプロイ
\`\`\`bash
npx vercel --prod
\`\`\`

## 環境変数

| 変数名 | 説明 | 必須 |
|-------|------|-----|
| NEXT_PUBLIC_SUPABASE_URL | Supabase URL | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase Anon Key | Yes |
```

### 8.2 CONTRIBUTING.md

```markdown
# コントリビューションガイド

## ブランチ戦略

- `main` - 本番環境
- `develop` - 開発統合
- `feature/*` - 機能開発
- `fix/*` - バグ修正

## プルリクエスト

1. `develop`から`feature/*`ブランチを作成
2. 変更を実装
3. テストを追加・実行
4. PRを作成
5. レビュー後にマージ

## コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/) に従う:

- `feat:` 新機能
- `fix:` バグ修正
- `docs:` ドキュメント
- `style:` フォーマット
- `refactor:` リファクタリング
- `test:` テスト
- `chore:` その他
```

---

## 完了条件

- [ ] Vercel プロジェクトが設定されている
- [ ] 環境変数が設定されている
- [ ] CI/CD ワークフローが動作する
- [ ] Supabase 本番環境が設定されている
- [ ] 本番環境にデプロイされている
- [ ] 本番環境で動作確認済み
- [ ] 運用ドキュメントが作成されている

---

## 完了後のアクション

```
## デプロイ・運用準備が完了しました

### デプロイ情報
| 項目 | 値 |
|-----|---|
| 本番URL | https://example.com |
| ホスティング | Vercel |
| リージョン | hnd1 (東京) |
| CI/CD | GitHub Actions |

### 設定状況
| 項目 | 状態 |
|-----|------|
| 環境変数 | 設定済み |
| CI/CD | 動作確認済み |
| Supabase | 設定済み |
| 監視 | [Sentry/Vercel Analytics] 設定済み |

### 運用ドキュメント
- README.md 更新済み
- CONTRIBUTING.md 作成済み

---

本番リリースが完了しました！

### 次のステップ（運用開始後）
1. ユーザーからのフィードバック収集
2. パフォーマンス監視
3. 機能改善の計画
```

---

## 追加タスク（将来）

- [ ] カスタムドメイン設定
- [ ] PWA 設定
- [ ] プッシュ通知設定
- [ ] SEO 最適化
- [ ] アクセス解析（Google Analytics等）
