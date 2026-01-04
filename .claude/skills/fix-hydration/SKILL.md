---
name: fix-hydration
description: Next.js + Radix UIのハイドレーションエラーを修正。ハイドレーション、hydration mismatch、SSR不一致、useIdエラーの修正に使用。
allowed-tools: Read, Write, Edit, Glob, Grep
---

# ハイドレーションエラー修正スキル

Next.js + Radix UI環境でのハイドレーションエラーを診断・修正する。

## 典型的なエラーメッセージ

```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
```

```
id="radix-_R_xxx_" (server) vs id="radix-_R_yyy_" (client)
```

## 原因と対策

### 1. Radix UIコンポーネントのID不一致

**原因**: Radix UIは内部で`useId`を使用。サーバーとクライアントでコンポーネントツリーが異なるとIDが不一致になる。

**対策**: クライアントサイドでのみRadixコンポーネントをマウント

```tsx
'use client';

import { useEffect, useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function MyComponent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div>
      {mounted ? (
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>...</DropdownMenuContent>
        </DropdownMenu>
      ) : (
        // サーバーサイド用プレースホルダー（同じ見た目）
        <button>Open</button>
      )}
    </div>
  );
}
```

### 2. 条件分岐によるツリー不一致

**原因**: `typeof window !== 'undefined'`などの条件分岐でサーバー/クライアントで異なるJSXを返す。

**対策**: 初期値を固定し、useEffect内で更新

```tsx
// NG
function Component() {
  const isBrowser = typeof window !== 'undefined';
  return isBrowser ? <ClientOnly /> : <ServerOnly />;
}

// OK
function Component() {
  const [isBrowser, setIsBrowser] = useState(false);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  return isBrowser ? <ClientOnly /> : <ServerOnly />;
}
```

### 3. 非決定的な値の使用

**原因**: `Date.now()`、`Math.random()`などがレンダリング中に使用される。

**対策**: useStateの初期値またはuseEffect内で設定

```tsx
// NG
function Component() {
  return <div>{Date.now()}</div>;
}

// OK
function Component() {
  const [timestamp, setTimestamp] = useState<number | null>(null);

  useEffect(() => {
    setTimestamp(Date.now());
  }, []);

  return <div>{timestamp ?? 'Loading...'}</div>;
}
```

### 4. useIsMobile等のカスタムフック

**原因**: `window.innerWidth`を直接使用するとサーバー/クライアントで値が異なる。

**対策**: 初期値をfalseに固定

```tsx
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}
```

## 対象Radixコンポーネント

以下のコンポーネントで発生しやすい:

- `DropdownMenu`
- `Dialog`
- `Popover`
- `Tooltip`
- `Select`
- `NavigationMenu`
- `ContextMenu`
- `AlertDialog`
- `Sheet`

## 診断手順

1. エラーメッセージから不一致の属性（id等）を特定
2. 該当コンポーネントのファイルを特定
3. 条件分岐や非決定的な値の使用箇所を確認
4. `mounted`パターンまたは`useEffect`での遅延レンダリングを適用

## 注意事項

- `suppressHydrationWarning`は根本解決にならないため非推奨
- プレースホルダーはUIが一致するように作成（レイアウトシフト防止）
- `dynamic(() => import(...), { ssr: false })`も有効だが、コード分割が発生
