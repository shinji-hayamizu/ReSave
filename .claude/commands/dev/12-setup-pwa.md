---
description: PWA対応（Service Worker、manifest）。Webアプリをインストール可能にし、アプリライクな体験を提供する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
argument-hint: [出力先ディレクトリ (例: apps/web)]
---

# PWA対応

WebアプリをPWA（Progressive Web App）として設定し、インストール可能なアプリとして提供する。

## 前提

以下が完了済みであること:
- Webアプリの基本実装（`/dev:01-setup-web`）
- レイアウト実装（`/dev:05-create-layout`）

**アーキテクチャファイルの場所（優先順）:**
1. `.kiro/specs/*/design.md` (Kiroスペック)
2. `docs/requirements/architecture.md` (標準)

---

## 参照ドキュメント（必須読み込み）

以下のドキュメントを読み込み、PWA要件を確認すること:

1. **アーキテクチャ** - PWA対応方針（@serwist/next使用）
2. **Serwist公式ドキュメント** - https://serwist.pages.dev/docs/next/getting-started

---

## あなたの役割

フロントエンドエンジニアとして、PWA対応を実装する。
@serwist/nextを使用してService Workerを設定し、インストール可能なWebアプリを構築する。

## 実行方法

- このタスクは **ultrathink** で実行すること
- **各コンポーネント作成はsubAgentで並列実行**すること

---

## Step 1: 依存関係のインストール

### 1.1 Serwistパッケージ

```bash
pnpm add @serwist/next
pnpm add -D serwist
```

---

## Step 2: Next.js設定

### 2.1 next.config.ts

#### {root}/next.config.ts

Serwist用の設定を追加:

```typescript
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist({
  // 既存のNext.js設定
});
```

---

## Step 3: Web App Manifest

### 3.1 マニフェスト設定

#### {root}/src/app/manifest.ts

Next.js 15の`manifest`関数を使用:

```typescript
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ReSave - 間隔反復学習",
    short_name: "ReSave",
    description: "忘却曲線に基づく間隔反復記憶カードアプリ",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
```

---

## Step 4: Service Worker

### 4.1 Service Worker設定

#### {root}/src/app/sw.ts

Serwist Service Workerを設定:

```typescript
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();
```

---

## Step 5: PWAアイコン

### 5.1 アイコン配置

以下のアイコンを `{root}/public/icons/` に配置:

| ファイル名 | サイズ | 用途 |
|-----------|-------|-----|
| icon-192.png | 192x192 | 標準アイコン |
| icon-512.png | 512x512 | 高解像度アイコン |
| icon-maskable.png | 512x512 | マスカブルアイコン |
| apple-touch-icon.png | 180x180 | iOS用 |
| favicon.ico | 16x16, 32x32 | ファビコン |

**プレースホルダーアイコン作成:**
シンプルなSVGからPNGを生成するか、プレースホルダーを配置。

---

## Step 6: メタデータ設定

### 6.1 ルートレイアウト

#### {root}/src/app/layout.tsx

PWA関連のメタデータを追加:

```typescript
export const metadata: Metadata = {
  title: "ReSave - 間隔反復学習",
  description: "忘却曲線に基づく間隔反復記憶カードアプリ",
  manifest: "/manifest.webmanifest",
  themeColor: "#6366f1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ReSave",
  },
  formatDetection: {
    telephone: false,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};
```

---

## Step 7: インストールプロンプト（任意）

### 7.1 PWAインストールバナー

#### {root}/src/components/pwa/install-prompt.tsx

インストールを促すUI（任意）:
- `beforeinstallprompt`イベントをキャッチ
- インストールボタン表示
- ネイティブインストールダイアログ表示

---

## Step 8: TypeScript設定

### 8.1 tsconfig.json

Service Worker用の型設定:

```json
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM", "DOM.Iterable", "WebWorker"]
  }
}
```

---

## Step 9: ビルド確認

### 9.1 本番ビルド

```bash
pnpm build
```

ビルド成功後、`public/sw.js`が生成されていることを確認。

### 9.2 PWA検証

- Lighthouseでpwa監査を実行
- インストール可能であることを確認
- マニフェストが正しく読み込まれることを確認

---

## 完了条件

- [ ] @serwist/nextがインストールされている
- [ ] next.config.tsにSerwist設定が追加されている
- [ ] manifest.tsが作成されている
- [ ] sw.tsが作成されている
- [ ] PWAアイコンが配置されている
- [ ] メタデータが設定されている
- [ ] 本番ビルドが成功する
- [ ] sw.jsが生成される
- [ ] アプリがインストール可能である

---

## 完了後のアクション

```
## PWA対応が完了しました

### 作成されたファイル
- {root}/src/app/manifest.ts
- {root}/src/app/sw.ts
- {root}/public/icons/icon-192.png
- {root}/public/icons/icon-512.png
- {root}/public/icons/icon-maskable.png

### 更新されたファイル
- {root}/next.config.ts
- {root}/src/app/layout.tsx
- {root}/tsconfig.json

### PWA機能
| 機能 | 状態 |
|------|------|
| インストール可能 | [Success/Failed] |
| マニフェスト | [Success/Failed] |
| Service Worker | [Success/Failed] |
| アイコン | [Success/Failed] |

### 今後の拡張（将来対応）
- オフラインキャッシュ戦略
- バックグラウンド同期
- プッシュ通知

### 検証方法
1. `pnpm build && pnpm start`
2. Chrome DevTools > Application > Manifest確認
3. Lighthouse > PWA監査
```

---

## 補足: オフライン対応（将来）

現時点ではオフライン対応は行わない。将来的な拡張として以下を検討:

- TanStack Query Persistによるキャッシュ永続化
- オフライン時のデータ保存
- オンライン復帰時の同期

詳細は `docs/requirements/functions/sync/F-050-data-sync.md` を参照。
