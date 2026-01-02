---
description: architecture.md に基づき、プロジェクトの初期構築とビルド確認を実行
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
---

# Phase 4: プロジェクト初期構築

## 前提
以下のドキュメントが完了済みであること:
- `docs/architecture/architecture.md`

---

## 参照ドキュメント（必須）
- docs/architecture/architecture.md
- docs/requirements/business-requirements.md

## 実行方法
- このタスクは **ultrathink** で実行すること
- 各アプリケーションは **subAgent** で並列実行可能

---

## Step 1: 構成確認

architecture.md を読み込み、以下を特定する:

### アプリケーション構成
| 種別 | 存在 | 技術スタック | ディレクトリ |
|------|------|-------------|-------------|
| Web（フロントエンド） | Y/N | 例: Next.js | apps/web |
| Web（バックエンド/API） | Y/N | 例: NestJS | apps/api |
| モバイル | Y/N | 例: React Native | apps/mobile |
| 管理画面 | Y/N | 例: Next.js | apps/admin |
| 共通ライブラリ | Y/N | 例: TypeScript | packages/shared |

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
3. モノレポツール（Turborepo/Nx等）の指定はありますか？
   （なければ architecture.md の設定を使用）

「OK」または修正指示をお願いします。
```

---

## Step 3: プロジェクト初期構築

ユーザー承認後、以下を実行:

### 3.1 ルートディレクトリのセットアップ

```bash
# package.json 初期化（モノレポ構成）
# 必要なdevDependencies追加
# .gitignore, .editorconfig 等の設定ファイル
```

### 3.2 各アプリケーションの初期化

**subAgent で並列実行可能な作業:**

#### Web フロントエンド（存在する場合）
```bash
# 例: Next.js
npx create-next-app@latest apps/web --typescript --eslint --tailwind --app --src-dir
```

#### バックエンド/API（存在する場合）
```bash
# 例: NestJS
npx @nestjs/cli new apps/api --package-manager pnpm --skip-git
```

#### モバイル（存在する場合）
```bash
# 例: React Native with Expo
npx create-expo-app apps/mobile --template blank-typescript
```

#### 管理画面（存在する場合）
```bash
# 例: Next.js
npx create-next-app@latest apps/admin --typescript --eslint --tailwind --app --src-dir
```

#### 共通パッケージ（存在する場合）
```bash
mkdir -p packages/shared/src
# package.json, tsconfig.json 等の設定
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
| API | `pnpm --filter api build` | 成功 |
| Mobile | `pnpm --filter mobile export` または `expo build` | 成功（または警告のみ） |
| Admin | `pnpm --filter admin build` | 成功 |

### 4.3 結果報告フォーマット

```
## ビルド確認結果

| アプリ | ステータス | 詳細 |
|--------|----------|------|
| Web | [Success/Failed] | [エラー内容があれば記載] |
| API | [Success/Failed] | [エラー内容があれば記載] |
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

# API
pnpm --filter api start:dev

# Mobile
pnpm --filter mobile start

# Admin
pnpm --filter admin dev
```

---

## 出力成果物

### ディレクトリ構造例（モノレポ）

```
project-root/
├── apps/
│   ├── web/                 # Webフロントエンド
│   │   ├── src/
│   │   ├── package.json
│   │   └── ...
│   ├── api/                 # バックエンドAPI
│   │   ├── src/
│   │   ├── package.json
│   │   └── ...
│   ├── mobile/              # モバイルアプリ
│   │   ├── src/
│   │   ├── package.json
│   │   └── ...
│   └── admin/               # 管理画面
│       ├── src/
│       ├── package.json
│       └── ...
├── packages/
│   └── shared/              # 共通ライブラリ
│       ├── src/
│       └── package.json
├── docs/                    # ドキュメント
├── mock/                    # HTMLモック
├── package.json             # ルートpackage.json
├── pnpm-workspace.yaml      # ワークスペース設定
├── turbo.json               # Turborepo設定（使用時）
├── .gitignore
├── .editorconfig
└── README.md
```

### 各 package.json のスクリプト例

#### ルート package.json
```json
{
  "name": "project-name",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

---

## 技術スタック別の初期化コマンド参考

### フロントエンド
| 技術 | コマンド |
|------|---------|
| Next.js | `npx create-next-app@latest [dir] --typescript --eslint --tailwind --app` |
| Vite + React | `npm create vite@latest [dir] -- --template react-ts` |
| Remix | `npx create-remix@latest [dir]` |

### バックエンド
| 技術 | コマンド |
|------|---------|
| NestJS | `npx @nestjs/cli new [dir]` |
| Express | 手動セットアップ |
| Fastify | `npm init fastify -- --lang ts [dir]` |
| Hono | `npm create hono@latest [dir]` |

### モバイル
| 技術 | コマンド |
|------|---------|
| React Native (Expo) | `npx create-expo-app [dir] --template blank-typescript` |
| React Native (CLI) | `npx react-native init [dir] --template react-native-template-typescript` |
| Flutter | `flutter create [dir]` |

### モノレポツール
| 技術 | セットアップ |
|------|-------------|
| Turborepo | `npx create-turbo@latest` または手動 |
| Nx | `npx create-nx-workspace@latest` |
| pnpm workspace | `pnpm-workspace.yaml` のみ |

---

## エラー対応ガイド

### よくあるエラーと対処

| エラー | 原因 | 対処 |
|--------|------|------|
| `ERESOLVE unable to resolve` | 依存関係の競合 | `--legacy-peer-deps` または依存バージョン調整 |
| `Module not found` | パス設定ミス | tsconfig.json のpaths確認 |
| `Port already in use` | ポート競合 | 別ポートを指定またはプロセス停止 |
| `EACCES permission denied` | 権限問題 | sudo不要、node_modules再作成 |

---

## 完了条件

- [ ] 全アプリケーションのディレクトリが作成されている
- [ ] 各アプリケーションの package.json が存在する
- [ ] `pnpm install` が成功する
- [ ] 各アプリケーションのビルドが成功する（または問題点が報告されている）
- [ ] ルートの package.json にワークスペーススクリプトが設定されている
- [ ] ビルド結果がユーザーに報告されている

---

## 次のステップ

ビルド確認完了後、以下を案内:

```
## プロジェクト初期構築が完了しました

### 実行可能なコマンド
- `pnpm dev` - 全アプリの開発サーバー起動
- `pnpm build` - 全アプリのビルド
- `pnpm lint` - 全アプリのLint実行

### 次のステップ候補
1. 開発環境の起動確認
2. CI/CD パイプラインの設定
3. 本格的な実装開始

何から始めますか？
```
