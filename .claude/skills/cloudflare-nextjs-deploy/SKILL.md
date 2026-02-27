---
name: cloudflare-nextjs-deploy
description: Cloudflare PagesへのNext.jsデプロイ設定・最適化。wrangler.toml設定、Edge Runtime互換性チェック、Cloudflare固有機能（KV, R2, D1, Analytics）統合、パフォーマンス最適化を実施。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Cloudflare Pages + Next.js デプロイ・最適化スキル

Cloudflare PagesへのNext.js 16デプロイとCloudflare Workers互換性の確保。

## 前提知識

### Cloudflare Pages vs Vercel

| 項目 | Cloudflare Pages | Vercel |
|------|------------------|--------|
| Edge Runtime | Cloudflare Workers | Vercel Edge Runtime |
| Node.js互換性 | 制約あり（互換レイヤー必要） | 完全対応 |
| Server Actions | 要Edge Runtime対応 | ネイティブ対応 |
| Middleware | 制約あり | 完全対応 |
| 環境変数 | `wrangler.toml` | Vercel Dashboard |
| デプロイツール | `@cloudflare/next-on-pages` | ネイティブ |

### 重要な制約

1. **Node.js APIは使えない**（`fs`, `path`, `crypto.randomBytes`等）
2. **Dynamic Code Evaluationは禁止**（`eval`, `new Function`）
3. **Edge Runtime互換コードのみ動作**

---

## 1. デプロイ設定

### 1.1 `wrangler.toml` 生成

```toml
name = "resave"
compatibility_date = "2024-01-01"

pages_build_output_dir = ".vercel/output/static"

[env.production]
vars = { NODE_ENV = "production" }

[env.preview]
vars = { NODE_ENV = "preview" }
```

### 1.2 `package.json` スクリプト

```json
{
  "scripts": {
    "pages:build": "npx @cloudflare/next-on-pages",
    "pages:deploy": "npm run pages:build && wrangler pages deploy",
    "pages:dev": "npx @cloudflare/next-on-pages --experimental-minify"
  },
  "devDependencies": {
    "@cloudflare/next-on-pages": "latest",
    "wrangler": "latest"
  }
}
```

### 1.3 `next.config.ts` 最適化

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Cloudflare Pages互換性
  experimental: {
    runtime: 'experimental-edge', // Edge Runtime有効化
  },

  // 静的最適化
  output: 'standalone',

  // 画像最適化（Cloudflare Images使用時）
  images: {
    loader: 'custom',
    loaderFile: './lib/cloudflare-image-loader.ts',
  },
}

export default nextConfig
```

---

## 2. Edge Runtime互換性チェック

### 2.1 Server Actions検証

**Edge Runtime対応の書き方:**

```typescript
// app/actions/cards.ts
'use server'

// ✅ Good: Edge Runtime互換
export async function createCard(data: FormData) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify(data),
  })

  return response.json()
}

// ❌ Bad: Node.js API使用
import fs from 'fs' // Edge Runtimeでは動かない
export async function saveFile(data: string) {
  fs.writeFileSync('./data.txt', data) // エラー
}
```

### 2.2 Middleware検証

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

// ✅ Edge Runtime互換
export async function middleware(request: NextRequest) {
  // fetch, Headers, URLなどWeb標準APIのみ使用
  const response = NextResponse.next()

  // Cookieの読み書きはOK
  response.cookies.set('session', 'value')

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 2.3 API Routes → Pages Functions移行

**移行前（API Routes）:**
```typescript
// app/api/cards/route.ts
export async function GET(request: NextRequest) {
  // ...
}
```

**移行後（Pages Functions）:**
```typescript
// functions/api/cards.ts
export async function onRequestGet(context) {
  const { request, env } = context

  // env経由で環境変数アクセス
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL

  return new Response(JSON.stringify({ data: [] }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
```

---

## 3. Cloudflare固有機能統合

### 3.1 Workers KV（キーバリューストア）

**セッション管理の例:**

```typescript
// functions/api/session.ts
export async function onRequestGet(context) {
  const { env } = context

  // KVから取得
  const session = await env.KV_NAMESPACE.get('session:user123')

  return new Response(session)
}

export async function onRequestPost(context) {
  const { request, env } = context
  const data = await request.json()

  // KVに保存（TTL付き）
  await env.KV_NAMESPACE.put(
    `session:${data.userId}`,
    JSON.stringify(data),
    { expirationTtl: 3600 } // 1時間
  )

  return new Response('OK')
}
```

**`wrangler.toml`に追加:**
```toml
[[kv_namespaces]]
binding = "KV_NAMESPACE"
id = "your-kv-namespace-id"
```

### 3.2 R2 Storage（オブジェクトストレージ）

**画像アップロードの例:**

```typescript
// functions/api/upload.ts
export async function onRequestPost(context) {
  const { request, env } = context
  const formData = await request.formData()
  const file = formData.get('file') as File

  // R2にアップロード
  await env.R2_BUCKET.put(`images/${file.name}`, file.stream(), {
    httpMetadata: {
      contentType: file.type,
    },
  })

  return new Response(JSON.stringify({ url: `/images/${file.name}` }))
}
```

**`wrangler.toml`に追加:**
```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "resave-images"
```

### 3.3 D1 Database（SQLデータベース）

**Supabase代替としてのD1使用例:**

```typescript
// functions/api/cards.ts
export async function onRequestGet(context) {
  const { env } = context

  // D1クエリ実行
  const result = await env.DB.prepare(
    'SELECT * FROM cards WHERE user_id = ?'
  ).bind('user123').all()

  return new Response(JSON.stringify(result.results))
}
```

**`wrangler.toml`に追加:**
```toml
[[d1_databases]]
binding = "DB"
database_name = "resave-db"
database_id = "your-database-id"
```

### 3.4 Analytics（アクセス解析）

**Web Analytics統合:**

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <script
          defer
          src='https://static.cloudflareinsights.com/beacon.min.js'
          data-cf-beacon='{"token": "your-token"}'
        ></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

---

## 4. パフォーマンス最適化

### 4.1 Edge Caching戦略

```typescript
// app/api/cards/route.ts
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const response = await fetch('https://api.example.com/cards')

  // Cache APIでキャッシュ
  const cache = caches.default
  await cache.put(request.url, response.clone())

  return response
}
```

### 4.2 ISR/SSG/SSRの使い分け

| ページ種別 | 推奨方式 | 理由 |
|-----------|---------|------|
| ログイン/登録 | SSG | 静的、認証前 |
| ダッシュボード | SSR + Edge Cache | ユーザーごとに異なる |
| カード一覧 | ISR（revalidate: 60） | 頻繁な更新、キャッシュ可能 |
| 学習セッション | SSR | リアルタイム性重要 |

```typescript
// app/cards/page.tsx
export const revalidate = 60 // ISR: 60秒ごと再生成

export default async function CardsPage() {
  const cards = await fetchCards()
  return <CardList cards={cards} />
}
```

### 4.3 バンドルサイズ削減

```bash
# バンドル分析
npm run build -- --analyze

# 大きなライブラリをdynamic import
```

```typescript
// app/page.tsx
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  ssr: false,
  loading: () => <p>Loading...</p>,
})
```

---

## 5. 環境変数管理

### 5.1 Cloudflare Dashboard設定

1. **Pages プロジェクト → Settings → Environment variables**
2. 以下を設定:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 5.2 `wrangler.toml`での管理（ローカル開発用）

```toml
[vars]
NEXT_PUBLIC_SUPABASE_URL = "https://xxx.supabase.co"

# シークレットはwrangler secret put経由
```

```bash
# シークレット登録
wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 6. トラブルシューティング

### 6.1 `Error: Dynamic Code Evaluation`

**原因:** `eval()`, `new Function()`, `vm.runInContext()`等の使用

**対処:**
```typescript
// ❌ Bad
const fn = new Function('a', 'b', 'return a + b')

// ✅ Good
const fn = (a: number, b: number) => a + b
```

### 6.2 `Unhandled Promise Rejection`

**原因:** Server Actionsでのエラーハンドリング不足

**対処:**
```typescript
'use server'

export async function createCard(data: FormData) {
  try {
    const response = await fetch(...)
    if (!response.ok) throw new Error('Failed to create')
    return await response.json()
  } catch (error) {
    console.error('Error:', error)
    throw error // 必ず再スロー
  }
}
```

### 6.3 Edge Runtime制約の回避

**Node.js APIが必要な場合:**

1. **Pages Functionsで実行**（Node.js互換性レイヤーあり）
2. **外部APIに移行**（Supabase Edge Functions等）

```typescript
// functions/api/node-task.ts (Pages Functions)
// ここではNode.js APIが使える
import crypto from 'crypto'

export async function onRequestPost(context) {
  const hash = crypto.createHash('sha256').update('data').digest('hex')
  return new Response(hash)
}
```

---

## 7. デプロイ手順

### 7.1 初回デプロイ

```bash
# Cloudflare CLI認証
wrangler login

# Pages Projectとして作成
wrangler pages project create resave

# ビルド & デプロイ
npm run pages:deploy
```

### 7.2 CI/CD（GitHub Actions）

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run pages:build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy .vercel/output/static --project-name=resave
```

### 7.3 プレビューデプロイ

```bash
# プレビュー環境にデプロイ
wrangler pages deploy --branch=preview
```

---

## 8. チェックリスト

デプロイ前に以下を確認:

- [ ] `wrangler.toml` 作成済み
- [ ] `@cloudflare/next-on-pages` インストール済み
- [ ] Server ActionsにEdge Runtime互換性あり
- [ ] Middlewareが制約内で動作
- [ ] 環境変数をCloudflare Dashboardに登録
- [ ] Node.js APIを使用していない
- [ ] Dynamic Code Evaluationなし
- [ ] ビルドが成功する (`npm run pages:build`)
- [ ] ローカルで動作確認済み

---

## 9. 参考リンク

- [Cloudflare Pages - Next.js Guide](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [@cloudflare/next-on-pages](https://github.com/cloudflare/next-on-pages)
- [Workers KV](https://developers.cloudflare.com/kv/)
- [R2 Storage](https://developers.cloudflare.com/r2/)
- [D1 Database](https://developers.cloudflare.com/d1/)
