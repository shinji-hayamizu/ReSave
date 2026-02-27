---
name: nextjs-react-troubleshoot
description: Next.js + React統合トラブルシューティング。ハイドレーションエラー診断、Server/Client境界チェック、キャッシュ不整合調査、パフォーマンス劣化診断、Edge Runtime制約対応。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# Next.js + React 統合トラブルシューティングスキル

ハイドレーションエラー、Server/Client境界、キャッシュ、パフォーマンスの問題を診断・修正。

---

## 1. ハイドレーションエラー診断

### 1.1 一般的な原因

| エラーメッセージ | 原因 | 対処 |
|----------------|------|------|
| `Hydration failed` | Server/Client間のHTML不一致 | 条件分岐、非決定的値を修正 |
| `Text content does not match` | テキストの不一致 | `suppressHydrationWarning`または修正 |
| `Expected server HTML to contain` | 要素の不一致 | Server/Clientで同じDOM構造を保証 |

### 1.2 診断フロー

```bash
# 1. エラー箇所特定
grep -r "use client" apps/web/src --include="*.tsx"

# 2. Server Componentチェック
grep -r "useState\|useEffect" apps/web/src/app --include="*.tsx"

# 3. 環境依存コードチェック
grep -r "window\|document\|localStorage" apps/web/src --include="*.tsx"
```

### 1.3 よくあるパターンと修正

#### パターン1: Date/時刻の不一致

**❌ Bad:**
```typescript
// Server Component
export default function Page() {
  return <div>Current time: {new Date().toLocaleString()}</div>
}
```

**✅ Good:**
```typescript
// Server Component
export default function Page() {
  const time = new Date().toISOString() // サーバー側で固定
  return <ClientTime time={time} />
}

// Client Component
'use client'
function ClientTime({ time }: { time: string }) {
  const [localTime, setLocalTime] = useState(time)

  useEffect(() => {
    setLocalTime(new Date(time).toLocaleString())
  }, [time])

  return <div>Current time: {localTime}</div>
}
```

#### パターン2: localStorage使用

**❌ Bad:**
```typescript
// Server Component
export default function Page() {
  const theme = localStorage.getItem('theme') // エラー
  return <div className={theme}>...</div>
}
```

**✅ Good:**
```typescript
// Server Component
export default function Page() {
  return <ThemeProvider>...</ThemeProvider>
}

// Client Component
'use client'
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) setTheme(savedTheme)
  }, [])

  return <div className={theme}>{children}</div>
}
```

#### パターン3: useId()の誤用

**❌ Bad:**
```typescript
// Math.random()はServer/Clientで異なる値
const id = `id-${Math.random()}`
```

**✅ Good:**
```typescript
import { useId } from 'react'

function Component() {
  const id = useId() // React管理のID
  return <input id={id} />
}
```

### 1.4 suppressHydrationWarning（最終手段）

```typescript
// 時刻表示など、Server/Clientで必ず異なる場合のみ使用
<time suppressHydrationWarning>
  {new Date().toLocaleString()}
</time>
```

---

## 2. Server/Client境界チェック

### 2.1 `use client`配置の検証

**原則:**
- Server Componentがデフォルト
- `use client`は最小の葉コンポーネントにのみ
- page/layoutを丸ごとClient化しない

**診断コマンド:**
```bash
# page.tsxにuse clientがあるか（通常はNG）
find apps/web/src/app -name "page.tsx" -exec grep -l "use client" {} \;

# layout.tsxにuse clientがあるか（通常はNG）
find apps/web/src/app -name "layout.tsx" -exec grep -l "use client" {} \;
```

### 2.2 境界違反の検出

**❌ Bad: Client ComponentからServer-onlyをimport**
```typescript
'use client'

import { db } from '@/lib/db' // Prisma/Drizzleなど（Server-only）

export default function Page() {
  const data = await db.user.findMany() // エラー
  return <div>{data}</div>
}
```

**✅ Good: Server Componentでデータ取得**
```typescript
// Server Component
import { db } from '@/lib/db'

export default async function Page() {
  const data = await db.user.findMany()
  return <UserList data={data} />
}

// Client Component
'use client'
function UserList({ data }: { data: User[] }) {
  return <div>{data.map(...)}</div>
}
```

### 2.3 シリアライズ不可能なpropsの検出

**チェック項目:**
- Date → ISO文字列に変換
- Map/Set → Arrayに変換
- 関数 → Server Actionsまたはイベントハンドラに移動
- class instance → プレーンオブジェクトに変換

**❌ Bad:**
```typescript
// Server Component
export default function Page() {
  const date = new Date()
  return <ClientComponent date={date} /> // エラー
}
```

**✅ Good:**
```typescript
// Server Component
export default function Page() {
  const date = new Date().toISOString()
  return <ClientComponent date={date} />
}

// Client Component
'use client'
function ClientComponent({ date }: { date: string }) {
  const dateObj = new Date(date)
  return <div>{dateObj.toLocaleDateString()}</div>
}
```

---

## 3. キャッシュ不整合診断

### 3.1 Next.js 15のキャッシュデフォルト変更

| バージョン | `fetch()` デフォルト | 対処 |
|-----------|-------------------|------|
| Next.js 14 | `cache: 'force-cache'` | 明示指定推奨 |
| Next.js 15/16 | `cache: 'no-store'` | **必ず明示指定** |

### 3.2 fetch()キャッシュ戦略の検証

**診断コマンド:**
```bash
# cacheオプションなしのfetch()を検出（要修正）
grep -r "fetch(" apps/web/src --include="*.ts" --include="*.tsx" | \
  grep -v "cache:" | grep -v "next:"
```

**修正パターン:**
```typescript
// ❌ Bad: キャッシュ戦略が不明確
const res = await fetch('https://api.example.com/data')

// ✅ Good: 戦略を明示
const res = await fetch('https://api.example.com/data', {
  cache: 'no-store', // 常に最新
})

// ✅ Good: ISR
const res = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 }, // 60秒ごと再検証
})

// ✅ Good: 静的
const res = await fetch('https://api.example.com/data', {
  cache: 'force-cache', // ビルド時のみ
})
```

### 3.3 キャッシュ戦略の使い分け

| ページ種別 | 推奨戦略 | 理由 |
|-----------|---------|------|
| ログイン/登録 | `force-cache` | 静的 |
| ダッシュボード | `no-store` | ユーザーごとに異なる |
| カード一覧 | `revalidate: 60` | 頻繁な更新あり |
| 統計ページ | `revalidate: 300` | リアルタイム性低い |
| 設定ページ | `no-store` | 即座に反映必要 |

### 3.4 revalidatePath/revalidateTagの適切な使用

```typescript
// Server Action
'use server'

import { revalidatePath } from 'next/cache'

export async function createCard(data: FormData) {
  await db.card.create({ data })

  // カード一覧ページのキャッシュを無効化
  revalidatePath('/cards')

  // 特定カードのキャッシュを無効化
  revalidatePath(`/cards/${cardId}`)
}
```

---

## 4. パフォーマンス劣化診断

### 4.1 不要な再レンダリング検出

**React DevTools Profiler使用:**
```bash
# 本番ビルドでプロファイリング有効化
NEXT_PUBLIC_PROFILING=true npm run build
```

**診断観点:**
- 親コンポーネント更新時の子コンポーネント再レンダリング
- props変更なしでの再レンダリング
- 高頻度の再レンダリング

### 4.2 React.memoの適用判断

**適用すべき:**
- 重い計算を含むコンポーネント
- リスト項目コンポーネント
- 頻繁に再レンダリングされるが、propsが変わらないコンポーネント

**❌ Bad: メモ化なし**
```typescript
function CardList({ cards }: { cards: Card[] }) {
  return cards.map(card => <CardItem key={card.id} card={card} />)
}

function CardItem({ card }: { card: Card }) {
  // 重い処理
  const processed = expensiveProcess(card)
  return <div>{processed}</div>
}
```

**✅ Good: メモ化あり**
```typescript
const CardItem = React.memo(({ card }: { card: Card }) => {
  const processed = expensiveProcess(card)
  return <div>{processed}</div>
})
```

### 4.3 useMemo/useCallbackの適用判断

**useMemo:**
```typescript
function Component({ items }: { items: Item[] }) {
  // ❌ Bad: 毎回計算
  const expensiveValue = items.reduce((acc, item) => acc + item.value, 0)

  // ✅ Good: メモ化
  const expensiveValue = useMemo(
    () => items.reduce((acc, item) => acc + item.value, 0),
    [items]
  )

  return <div>{expensiveValue}</div>
}
```

**useCallback:**
```typescript
function Parent() {
  // ❌ Bad: 毎回新しい関数
  const handleClick = () => console.log('clicked')

  // ✅ Good: メモ化（子がReact.memoの場合のみ効果）
  const handleClick = useCallback(() => console.log('clicked'), [])

  return <MemoizedChild onClick={handleClick} />
}
```

### 4.4 dynamic import（コード分割）

```typescript
// ❌ Bad: 大きなライブラリを全ページで読み込む
import HeavyChart from 'heavy-chart-library'

// ✅ Good: 使用ページでのみ動的読み込み
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('heavy-chart-library'), {
  ssr: false,
  loading: () => <Skeleton />,
})
```

---

## 5. Edge Runtime制約対応（Cloudflare Pages）

### 5.1 Node.js API使用の検出

**診断コマンド:**
```bash
# Node.js API使用箇所を検出
grep -r "require('fs')\|require('path')\|require('crypto')" apps/web/src
```

### 5.2 代替実装

| Node.js API | Edge Runtime代替 |
|-------------|------------------|
| `fs.readFile` | `fetch()` |
| `path.join` | 文字列操作 |
| `crypto.randomBytes` | `crypto.getRandomValues` (Web API) |
| `Buffer` | `Uint8Array` |

**例: crypto.randomBytes → crypto.getRandomValues**
```typescript
// ❌ Bad: Node.js API
import crypto from 'crypto'
const bytes = crypto.randomBytes(16)

// ✅ Good: Web API
const bytes = new Uint8Array(16)
crypto.getRandomValues(bytes)
```

### 5.3 Server ActionsのEdge Runtime対応

```typescript
// ✅ Edge Runtime互換
'use server'

export async function createCard(data: FormData) {
  // fetch, Headers, URLなどWeb標準APIのみ
  const response = await fetch(`${process.env.API_URL}/cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.fromEntries(data)),
  })

  return response.json()
}
```

---

## 6. React Server Components特有の問題

### 6.1 asyncコンポーネントでのhooks使用

**❌ Bad:**
```typescript
// Server Component
export default async function Page() {
  const [state, setState] = useState(0) // エラー
  const data = await fetchData()
  return <div>{data}</div>
}
```

**✅ Good:**
```typescript
// Server Component
export default async function Page() {
  const data = await fetchData()
  return <ClientComponent initialData={data} />
}

// Client Component
'use client'
function ClientComponent({ initialData }) {
  const [state, setState] = useState(0)
  return <div>{state}</div>
}
```

### 6.2 Contextの適切な配置

**❌ Bad: Server ComponentでContext作成**
```typescript
// Server Component
export default function Layout({ children }) {
  return (
    <ThemeContext.Provider value="dark"> // エラー
      {children}
    </ThemeContext.Provider>
  )
}
```

**✅ Good: Client ComponentでContext作成**
```typescript
// Server Component
export default function Layout({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

// Client Component
'use client'
function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value="dark">
      {children}
    </ThemeContext.Provider>
  )
}
```

---

## 7. 診断チェックリスト

### 7.1 ハイドレーションエラー
- [ ] Server/Clientで同じHTML構造
- [ ] 非決定的値（Date, Math.random等）をClient側に隔離
- [ ] `useId()`使用（独自ID生成禁止）

### 7.2 Server/Client境界
- [ ] `use client`は最小の葉コンポーネントのみ
- [ ] page/layoutがServer Component
- [ ] propsがシリアライズ可能

### 7.3 キャッシュ
- [ ] `fetch()`に`cache`または`next: { revalidate }`指定
- [ ] Server Actionsで`revalidatePath`/`revalidateTag`使用

### 7.4 パフォーマンス
- [ ] 重いコンポーネントに`React.memo`
- [ ] 高価な計算に`useMemo`
- [ ] 大きなライブラリは`dynamic import`

### 7.5 Edge Runtime（Cloudflare）
- [ ] Node.js API不使用
- [ ] Dynamic Code Evaluation不使用
- [ ] Server ActionsがWeb標準APIのみ

---

## 8. トラブルシューティングコマンド集

```bash
# ハイドレーションエラー原因調査
npm run dev 2>&1 | grep -i "hydration\|mismatch"

# use client配置チェック
find apps/web/src -name "*.tsx" -exec grep -l "use client" {} \;

# Node.js API使用チェック
grep -r "require('fs')\|require('path')\|require('crypto')" apps/web/src

# fetch()キャッシュ戦略チェック
grep -r "fetch(" apps/web/src | grep -v "cache:" | grep -v "next:"

# 大きなバンドルサイズ検出
npm run build -- --analyze
```

---

## 9. 参考リンク

- [Next.js - Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React - Hydration](https://react.dev/reference/react-dom/client/hydrateRoot)
- [Next.js - Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [Cloudflare - Edge Runtime](https://developers.cloudflare.com/workers/runtime-apis/)
