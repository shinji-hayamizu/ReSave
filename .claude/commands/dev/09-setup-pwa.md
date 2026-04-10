---
description: Web PWA設定（@serwist/next・manifest・Service Worker）。アプリをインストール可能にしてアプリライクな体験を提供する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: []
---

# Web PWA設定

@serwist/next を使って Service Worker・Web App Manifest を設定し、Web アプリをインストール可能にする。

## 前提条件

以下が完了済みであること:
- Web アプリの基本実装（`/dev:01-setup`）
- レイアウト実装（`/dev:04-create-layout`）

---

## 必須読み込みファイル

1. `docs/requirements/architecture.md` — アプリ名・説明・テーマカラーを確認

---

## Step 1: 依存関係のインストール

```bash
cd apps/web
pnpm add @serwist/next
pnpm add -D serwist
```

---

## Step 2: Next.js設定

`apps/web/next.config.ts`:

```typescript
import withSerwistInit from '@serwist/next'

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

export default withSerwist({
  // 既存のNext.js設定
})
```

---

## Step 3: Web App Manifest

`apps/web/src/app/manifest.ts`:

```typescript
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    // architecture.md からアプリ名・説明を読み取って設定
    name: '{アプリ名}',
    short_name: '{短縮名}',
    description: '{説明}',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '{デザイントークンの primary カラー}',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
```

---

## Step 4: Service Worker

`apps/web/src/app/sw.ts`:

```typescript
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
```

---

## Step 5: PWAアイコン

以下のアイコンを `apps/web/public/icons/` に配置:

| ファイル名 | サイズ | 用途 |
|-----------|-------|-----|
| icon-192.png | 192x192 | 標準アイコン |
| icon-512.png | 512x512 | 高解像度アイコン |
| icon-maskable.png | 512x512 | マスカブルアイコン |
| apple-touch-icon.png | 180x180 | iOS用 |

---

## Step 6: ルートレイアウトのメタデータ更新

`apps/web/src/app/layout.tsx` の `metadata` に追加:

```typescript
export const metadata: Metadata = {
  // 既存の設定...
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '{アプリ名}',
  },
  formatDetection: {
    telephone: false,
  },
}
```

---

## Step 7: TypeScript設定

`apps/web/tsconfig.json` の `lib` に `WebWorker` を追加:

```json
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM", "DOM.Iterable", "WebWorker"]
  }
}
```

---

## Step 8: ビルド確認

```bash
cd apps/web
pnpm build
```

- `public/sw.js` が生成されることを確認
- Lighthouse で PWA 監査を実行

---

## 完了条件

- [ ] `@serwist/next` がインストールされている
- [ ] `next.config.ts` に Serwist 設定が追加されている
- [ ] `src/app/manifest.ts` が作成されている
- [ ] `src/app/sw.ts` が作成されている
- [ ] PWA アイコンが `public/icons/` に配置されている
- [ ] ルートレイアウトのメタデータに PWA 設定が追加されている
- [ ] `pnpm build` が成功し `public/sw.js` が生成される
- [ ] アプリがインストール可能である（Chrome DevTools > Application > Manifest で確認）
