---
description: Mobile (Expo) セットアップ。ライブラリインストール、ディレクトリ構造作成、Supabase/TanStack Query設定。
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
argument-hint: [project root directory (例: /path/to/project)]
---

# Mobile (Expo) セットアップ

apps/mobile に必要なライブラリをインストールし、初期設定を行う。

## 実行手順

### 1. ライブラリインストール

apps/mobile ディレクトリで以下を実行:

```bash
cd $ARGUMENTS/apps/mobile

# 本番依存
pnpm add \
  @supabase/supabase-js \
  @tanstack/react-query \
  zod \
  @react-native-async-storage/async-storage
```

### 2. ディレクトリ構造作成

```bash
mkdir -p lib/api
mkdir -p hooks
mkdir -p types
mkdir -p validations
mkdir -p constants
mkdir -p components/ui
mkdir -p components/cards
mkdir -p components/study
```

### 3. 設定ファイル作成

#### lib/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

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

#### lib/api/client.ts
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

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}
```

#### constants/index.ts
```typescript
export const API_URL = process.env.EXPO_PUBLIC_API_URL!
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 180] as const
```

### 4. 環境変数テンプレート作成

.env.example を作成:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

### 5. QueryClient Provider 設定

app/_layout.tsx に追加:
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分
      retry: 2,
    },
  },
})

// ルートレイアウトでラップ
<QueryClientProvider client={queryClient}>
  {children}
</QueryClientProvider>
```

### 6. web から型定義・スキーマをコピー

```bash
# web側で型定義とZodスキーマが作成されたら実行
cp -r ../web/src/types/* ./types/
cp -r ../web/src/validations/* ./validations/
```
