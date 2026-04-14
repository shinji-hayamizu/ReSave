---
description: Web（Next.js）+ Expo モノレポの基盤構築・起動確認。shadcn/ui、NativeWind、TanStack Query、Supabase、packages/shared の設定を行う。
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
argument-hint: [プロジェクトルート (例: /path/to/project)]
---

# モノレポ基盤セットアップ

Web（Next.js）と Expo（React Native）の両アプリが起動できる状態にする。

## 前提

- `docs/requirements/architecture.md` が存在すること
- pnpm + Turborepo のモノレポ構成であること

## 必須読み込みファイル

1. `docs/requirements/architecture.md` — 技術スタック・ディレクトリ構成を確認
2. `packages/shared/package.json` — 共有パッケージの構成を確認

---

## Step 1: 現状確認

```bash
# モノレポ構成確認
cat package.json
ls apps/
ls packages/

# 既存セットアップ状況確認
ls apps/web/package.json 2>/dev/null && echo "web: exists" || echo "web: not found"
ls apps/mobile/package.json 2>/dev/null && echo "mobile: exists" || echo "mobile: not found"
ls packages/shared/package.json 2>/dev/null && echo "shared: exists" || echo "shared: not found"
```

---

## Step 2: Web セットアップ（apps/web）

### 2.1 ライブラリインストール

```bash
cd apps/web

# UI・スタイル
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx shadcn@latest init

# データフェッチ・状態管理
pnpm add @tanstack/react-query @tanstack/react-query-devtools

# フォーム・バリデーション
pnpm add react-hook-form @hookform/resolvers zod

# Supabase
pnpm add @supabase/supabase-js @supabase/ssr

# UI補助
pnpm add next-themes sonner lucide-react clsx tailwind-merge
```

### 2.2 パスエイリアス設定

`tsconfig.json` に追加:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 2.3 packages/shared の参照追加

`apps/web/package.json` に追加:
```json
{
  "dependencies": {
    "@resave/shared": "workspace:*"
  }
}
```

### 2.4 環境変数テンプレート作成

`apps/web/.env.local.example`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Step 3: Expo セットアップ（apps/mobile）

### 3.1 ライブラリインストール

```bash
cd apps/mobile

# スタイリング
pnpm add nativewind
pnpm add -D tailwindcss

# データフェッチ・状態管理
pnpm add @tanstack/react-query

# フォーム・バリデーション
pnpm add react-hook-form @hookform/resolvers zod

# Supabase + セッション永続化
pnpm add @supabase/supabase-js @react-native-async-storage/async-storage

# ユーティリティ
pnpm add clsx tailwind-merge
```

### 3.2 NativeWind 設定

`apps/mobile/tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

`apps/mobile/babel.config.js`:
```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

`apps/mobile/global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`apps/mobile/metro.config.js`:
```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' });
```

### 3.3 packages/shared の参照追加

`apps/mobile/package.json` に追加:
```json
{
  "dependencies": {
    "@resave/shared": "workspace:*"
  }
}
```

### 3.4 Supabase クライアント

`apps/mobile/lib/supabase.ts`:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

### 3.5 API クライアント

`apps/mobile/lib/api/client.ts`:
```typescript
const API_URL = process.env.EXPO_PUBLIC_API_URL!

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  token?: string
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, token } = options

  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) throw new Error(`API Error: ${response.status}`)
  if (response.status === 204) return undefined as T

  return response.json()
}
```

### 3.6 cn ユーティリティ

`apps/mobile/lib/cn.ts`:
```typescript
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 3.7 QueryClient Provider 設定

`apps/mobile/app/_layout.tsx` に追加:
```tsx
import '../global.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 2 },
  },
})

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ... */}
    </QueryClientProvider>
  )
}
```

### 3.8 環境変数テンプレート

`apps/mobile/.env.example`:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

---

## Step 4: packages/shared の確認・初期化

```bash
ls packages/shared/src/types/
ls packages/shared/src/validations/
```

`packages/shared/src/index.ts` が存在しない場合は作成:
```typescript
// Types
export * from './types'
// Validations
export * from './validations'
```

---

## Step 5: 依存関係インストール・起動確認

```bash
# ルートから一括インストール
pnpm install

# Web 起動確認
pnpm dev:web
# → http://localhost:3000 で起動すること

# Expo 起動確認
pnpm dev:mobile
# → Metro Bundler が起動すること
```

---

## 完了条件

- [ ] `pnpm dev:web` で Next.js が http://localhost:3000 で起動する
- [ ] `pnpm dev:mobile` で Expo Metro Bundler が起動する
- [ ] `apps/web` が `@resave/shared` を参照できる
- [ ] `apps/mobile` が `@resave/shared` を参照できる
- [ ] 環境変数テンプレート（.env.local.example / .env.example）が作成されている
- [ ] TypeScript 型エラーがない（`npx tsc --noEmit`）

---

## 次のステップ

- `/dev:02-create-components` — 共通UIコンポーネント作成
