---
description: architecture.md に基づき、プロジェクトの初期構築とビルド確認を実行
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
---

# Phase 2-A: プロジェクト初期構築

## 前提
以下のドキュメントが完了済みであること:
- `docs/requirements/architecture.md`

---

## 参照ドキュメント（必須読み込み）
- `docs/requirements/architecture.md`
- `docs/requirements/business-requirements.md`

## あなたの役割
経験豊富なフルスタックエンジニア。
モダンな開発環境の構築に精通している。

## 実行方法
- このタスクは **ultrathink** で実行すること
- 各アプリケーションの初期化は **subAgent** で並列実行可能

---

## Step 1: 構成確認

architecture.md を読み込み、以下を特定する:

### アプリケーション構成
| 種別 | 存在 | 技術スタック | ディレクトリ |
|------|------|-------------|-------------|
| Web（フロントエンド） | Y/N | 例: Next.js | web/ or apps/web |
| Web（バックエンド/API） | Y/N | 例: Hono | api/ or apps/api |
| モバイル | Y/N | 例: Expo | mobile/ or apps/mobile |
| 管理画面 | Y/N | 例: Next.js | admin/ or apps/admin |
| 共通ライブラリ | Y/N | 例: TypeScript | packages/shared |

### モノレポ構成
| 項目 | 設定 |
|------|------|
| ツール | Turborepo / Nx / pnpm workspace / なし |
| パッケージマネージャ | pnpm / npm / yarn |

---

## Step 2: ユーザー確認

特定した構成をユーザーに確認する:

```
## architecture.md から以下の構成を読み取りました

| 種別 | 技術スタック | ディレクトリ |
|------|-------------|-------------|
| [一覧表示] |

### 確認事項
1. この構成で初期構築を進めてよいですか？
2. 追加・変更したいアプリケーションはありますか？
3. パッケージマネージャの指定はありますか？（デフォルト: pnpm）

「OK」または修正指示をお願いします。
```

---

## Step 3: プロジェクト初期構築

ユーザー承認後、以下を実行:

### 3.1 ルートディレクトリのセットアップ

```bash
# package.json 初期化
pnpm init

# .gitignore 作成
# .editorconfig 作成
```

### 3.2 各アプリケーションの初期化

**subAgent で並列実行可能な作業:**

#### Next.js（Web/管理画面）
```bash
npx create-next-app@latest [dir] \
  --typescript \
  --eslint \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-pnpm
```

#### Expo（モバイル）
```bash
npx create-expo-app [dir] --template blank-typescript
```

#### Hono（バックエンド）
```bash
npm create hono@latest [dir]
```

### 3.3 共通設定ファイル

#### .gitignore
```
# Dependencies
node_modules/
.pnpm-store/

# Build
.next/
dist/
build/
.expo/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Test
coverage/

# Misc
*.log
npm-debug.log*
```

#### .editorconfig
```
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

---

## Step 4: ビルド確認

各アプリケーションのビルドを実行し、結果を報告:

### 4.1 依存関係インストール
```bash
pnpm install
```

### 4.2 各アプリケーションのビルド確認

**subAgent で並列実行:**

| アプリ | コマンド | 期待結果 |
|--------|---------|---------|
| Web | `pnpm --filter web build` | 成功 |
| Mobile | `cd mobile && npx expo export` | 成功（または警告のみ） |
| Admin | `pnpm --filter admin build` | 成功 |

### 4.3 結果報告フォーマット

```
## ビルド確認結果

| アプリ | ステータス | 詳細 |
|--------|----------|------|
| Web | [Success/Failed] | [エラー内容があれば記載] |
| Mobile | [Success/Failed] | [エラー内容があれば記載] |
| Admin | [Success/Failed] | [エラー内容があれば記載] |

### 成功したアプリケーション
- [リスト]

### 修正が必要なアプリケーション
- [アプリ名]: [問題点と推奨修正]
```

---

## Step 5: 開発環境起動確認（オプション）

ユーザーが希望する場合、開発サーバーの起動確認も実施:

```bash
# Web
pnpm --filter web dev

# Mobile
cd mobile && npx expo start

# Admin
pnpm --filter admin dev
```

---

## 出力成果物

### ディレクトリ構造例（モノレポ構成）

```
project-root/
├── web/                      # Webフロントエンド
│   ├── src/
│   ├── package.json
│   └── ...
├── mobile/                   # モバイルアプリ
│   ├── app/
│   ├── package.json
│   └── ...
├── supabase/                 # DB設定
│   └── migrations/
├── docs/                     # ドキュメント
├── package.json              # ルートpackage.json
├── pnpm-workspace.yaml       # ワークスペース設定（使用時）
├── .gitignore
├── .editorconfig
└── README.md
```

### ディレクトリ構造例（単一プロジェクト）

```
project-root/
├── src/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── hooks/
│   ├── actions/
│   ├── types/
│   └── validations/
├── supabase/
│   └── migrations/
├── docs/
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── .gitignore
├── .editorconfig
└── README.md
```

---

## 技術スタック別の初期化コマンド参考

### フロントエンド
| 技術 | コマンド |
|------|---------|
| Next.js | `npx create-next-app@latest [dir] --typescript --eslint --tailwind --app` |
| Vite + React | `npm create vite@latest [dir] -- --template react-ts` |
| Remix | `npx create-remix@latest [dir]` |

### モバイル
| 技術 | コマンド |
|------|---------|
| Expo | `npx create-expo-app [dir] --template blank-typescript` |
| React Native (CLI) | `npx react-native init [dir] --template react-native-template-typescript` |

### バックエンド
| 技術 | コマンド |
|------|---------|
| Hono | `npm create hono@latest [dir]` |
| Express | 手動セットアップ |
| Fastify | `npm init fastify -- --lang ts [dir]` |

---

## エラー対応ガイド

### よくあるエラーと対処

| エラー | 原因 | 対処 |
|--------|------|------|
| `ERESOLVE unable to resolve` | 依存関係の競合 | `--legacy-peer-deps` または依存バージョン調整 |
| `Module not found` | パス設定ミス | tsconfig.json の paths 確認 |
| `Port already in use` | ポート競合 | 別ポートを指定またはプロセス停止 |
| `EACCES permission denied` | 権限問題 | sudo不要、node_modules 再作成 |

---

## 完了条件

- [ ] 全アプリケーションのディレクトリが作成されている
- [ ] 各アプリケーションの package.json が存在する
- [ ] `pnpm install` が成功する
- [ ] 各アプリケーションのビルドが成功する
- [ ] .gitignore, .editorconfig が配置されている

---

## 完了後のアクション

```
## プロジェクト初期構築が完了しました

### 作成されたディレクトリ
[ディレクトリ構造を表示]

### 実行可能なコマンド
- `pnpm dev` - 開発サーバー起動
- `pnpm build` - ビルド
- `pnpm lint` - Lint実行

内容を確認し、問題なければ「OK」と入力してください。
```

---

## 次のステップ
`/phase-2-setup/dev-tools` - 開発ツールのセットアップ
