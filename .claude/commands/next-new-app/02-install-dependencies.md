---
description: architecture.md に基づき、Next.js Webアプリに必要なライブラリをインストールして初期設定を行う
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task
---

# Phase: ライブラリインストール・初期設定

## 前提
- `01-create-project.md` でNext.jsプロジェクトが作成済み
- `apps/web/` ディレクトリが存在

---

## 参照ドキュメント
- docs/requirements/architecture.md

## 実行方法
- このタスクは **ultrathink** で実行すること
- コードの修正は行わない（インストールと設定ファイルのみ）

---

## Step 1: 作業ディレクトリへ移動

```bash
cd apps/web
```

---

## Step 2: 依存ライブラリのインストール

### 2.1 状態管理・データフェッチ

```bash
pnpm add @tanstack/react-query zustand react-hook-form zod
```

| ライブラリ | 用途 |
|-----------|------|
| @tanstack/react-query | サーバー状態管理、キャッシュ |
| zustand | グローバルクライアント状態管理 |
| react-hook-form | フォーム管理 |
| zod | バリデーションスキーマ |

### 2.2 UIコンポーネント

```bash
pnpm add lucide-react tw-animate-css class-variance-authority clsx tailwind-merge
```

| ライブラリ | 用途 |
|-----------|------|
| lucide-react | アイコン |
| tw-animate-css | Tailwind v4対応アニメーション |
| class-variance-authority | shadcn/ui用バリアント管理 |
| clsx | クラス名結合 |
| tailwind-merge | Tailwindクラス競合解決 |

### 2.3 Supabase

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

| ライブラリ | 用途 |
|-----------|------|
| @supabase/supabase-js | Supabase SDKコア |
| @supabase/ssr | Server/Client両対応、Cookie管理 |

### 2.4 開発ツール（devDependencies）

```bash
pnpm add -D prettier
```

---

## Step 3: テストライブラリのインストール

```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

| ライブラリ | 用途 |
|-----------|------|
| vitest | ユニットテストランナー |
| @vitejs/plugin-react | VitestでReactをサポート |
| jsdom | DOM環境シミュレーション |
| @testing-library/react | コンポーネントテスト |
| @testing-library/jest-dom | DOMマッチャー |

---

## Step 4: shadcn/ui 初期化

```bash
pnpm dlx shadcn@latest init -y
```

初期化時の選択（デフォルトを使用）：
- Style: Default
- Base color: Slate
- CSS variables: Yes

**注意**: 対話的プロンプトが出る場合は適切に回答する

---

## Step 5: 設定ファイルの確認・作成

### 5.1 vitest.config.ts を作成

```bash
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
EOF
```

### 5.2 vitest.setup.ts を作成

```bash
cat > vitest.setup.ts << 'EOF'
import '@testing-library/jest-dom'
EOF
```

### 5.3 .prettierrc を作成

```bash
cat > .prettierrc << 'EOF'
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": []
}
EOF
```

### 5.4 package.json にスクリプト追加

以下のスクリプトが存在することを確認し、なければ追加:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

---

## Step 6: ビルド確認

```bash
pnpm build
```

### 期待結果
- ビルドが成功すること
- `.next/` ディレクトリが生成されること

---

## Step 7: 結果報告

### 報告フォーマット

```
## ライブラリインストール結果

### インストール済みライブラリ
| カテゴリ | ライブラリ | ステータス |
|---------|-----------|----------|
| 状態管理 | @tanstack/react-query | ✅ |
| 状態管理 | zustand | ✅ |
| フォーム | react-hook-form | ✅ |
| バリデーション | zod | ✅ |
| UI | lucide-react | ✅ |
| UI | tw-animate-css | ✅ |
| UI | class-variance-authority | ✅ |
| UI | clsx | ✅ |
| UI | tailwind-merge | ✅ |
| BaaS | @supabase/supabase-js | ✅ |
| BaaS | @supabase/ssr | ✅ |
| 開発 | prettier | ✅ |
| テスト | vitest | ✅ |
| テスト | @testing-library/react | ✅ |
| テスト | @testing-library/jest-dom | ✅ |

### ビルド結果
- ステータス: [Success/Failed]
- 詳細: [エラー内容があれば記載]

### 後回しにしたライブラリ
| ライブラリ | 理由 |
|-----------|------|
| @serwist/next | PWA対応は将来実装のため |
| playwright | E2Eテストは後のフェーズで設定 |

### 作成された設定ファイル
- vitest.config.ts
- vitest.setup.ts
- .prettierrc
- components.json (shadcn/ui)
```

---

## 後回しにするライブラリ

以下のライブラリは現時点ではインストールしない:

| ライブラリ | 理由 |
|-----------|------|
| @serwist/next | PWA対応は将来フェーズ（設定が複雑） |
| playwright | E2Eテストは後のフェーズで設定 |
| @playwright/test | 同上 |

---

## 完了条件

- [ ] 状態管理ライブラリがインストールされている
- [ ] UIライブラリがインストールされている
- [ ] Supabaseライブラリがインストールされている
- [ ] テストライブラリがインストールされている
- [ ] shadcn/ui が初期化されている
- [ ] vitest.config.ts が作成されている
- [ ] .prettierrc が作成されている
- [ ] `pnpm build` が成功する

---

## 次のステップ

ビルド確認完了後、以下を案内:

```
## ライブラリインストールが完了しました

### 追加されたコマンド
- `pnpm test` - テスト実行
- `pnpm format` - コード整形

### 次のステップ候補
1. Supabase プロジェクト設定
2. 環境変数ファイル (.env.local) 作成
3. shadcn/ui コンポーネント追加

何から始めますか？
```





