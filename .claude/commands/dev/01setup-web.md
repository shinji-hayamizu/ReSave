# Web (Next.js) セットアップ

apps/web に必要なライブラリをインストールし、初期設定を行う。

## 実行手順

### 1. ライブラリインストール

apps/web ディレクトリで以下を実行:

```bash
cd $ARGUMENTS/apps/web

# 本番依存
pnpm add \
  @supabase/ssr \
  @supabase/supabase-js \
  @tanstack/react-query \
  zustand \
  react-hook-form \
  zod \
  @hookform/resolvers \
  lucide-react \
  class-variance-authority \
  clsx \
  tailwind-merge \
  @radix-ui/react-slot

# 開発依存
pnpm add -D \
  vitest \
  @vitejs/plugin-react \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom \
  @playwright/test \
  @serwist/next \
  serwist \
  prettier \
  prettier-plugin-tailwindcss
```

### 2. shadcn/ui 初期化

```bash
pnpm dlx shadcn@latest init
```

以下の設定を選択:
- Style: New York
- Base color: Neutral
- CSS variables: Yes

### 3. 設定ファイル作成

#### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

#### vitest.setup.ts
```typescript
import '@testing-library/jest-dom'
```

#### src/lib/utils.ts (shadcn/ui用)
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 4. 環境変数テンプレート作成

.env.local.example を作成:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 5. package.json スクリプト追加

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test"
  }
}
```
