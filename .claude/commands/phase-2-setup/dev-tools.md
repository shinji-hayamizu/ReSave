---
description: 開発ツール（ESLint, Prettier, Husky等）のセットアップ
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
---

# Phase 2-B: 開発ツールのセットアップ

## 前提
以下が完了済みであること:
- プロジェクトの初期構築（`/phase-2-setup/init-project`）
- `pnpm install` が成功している

---

## 参照ドキュメント（必須読み込み）
- `docs/requirements/architecture.md`
- ルートの `package.json`
- 各アプリの `package.json`

## あなたの役割
経験豊富なDevOpsエンジニア。
チーム開発を効率化する開発環境の構築に精通している。

## 実行方法
このタスクは **ultrathink** で実行すること。

---

## Step 1: 現在の設定確認

既存の設定を確認し、必要なツールを特定:

### 確認項目
| ツール | 確認方法 | 状態 |
|--------|---------|------|
| ESLint | `eslint.config.js` or `.eslintrc.*` の存在 | 設定済み/未設定 |
| Prettier | `.prettierrc` or `prettier.config.js` の存在 | 設定済み/未設定 |
| TypeScript | `tsconfig.json` の存在 | 設定済み/未設定 |
| Husky | `.husky/` の存在 | 設定済み/未設定 |
| lint-staged | `package.json` の lint-staged 設定 | 設定済み/未設定 |

### create-next-app で自動設定されるもの
- ESLint（基本設定）
- TypeScript
- Tailwind CSS

---

## Step 2: ユーザー確認

```
## 開発ツール設定状況

| ツール | 状態 | 推奨アクション |
|--------|------|--------------|
| ESLint | [状態] | [アクション] |
| Prettier | [状態] | [アクション] |
| Husky | [状態] | [アクション] |
| lint-staged | [状態] | [アクション] |

### 推奨構成
1. **ESLint**: Next.js + TypeScript + import順序
2. **Prettier**: コードフォーマット統一
3. **Husky + lint-staged**: コミット時自動チェック
4. **VSCode設定**: チーム共通設定

この構成でセットアップを進めてよいですか？
「OK」または変更指示をお願いします。
```

---

## Step 3: 各ツールのセットアップ

### 3.1 ESLint設定

#### 必要なパッケージ
```bash
pnpm add -D -w eslint-config-prettier eslint-plugin-import @typescript-eslint/parser
```

#### eslint.config.mjs（Next.js 15 + Flat Config）
```javascript
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "prettier"
  ),
  {
    rules: {
      // TypeScript
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",

      // Import
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling"],
            "index",
            "type"
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc" }
        }
      ],

      // React
      "react/jsx-sort-props": ["error", {
        callbacksLast: true,
        shorthandFirst: true,
        reservedFirst: true
      }]
    }
  }
];

export default eslintConfig;
```

### 3.2 Prettier設定

#### 必要なパッケージ
```bash
pnpm add -D -w prettier prettier-plugin-tailwindcss
```

#### .prettierrc
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

#### .prettierignore
```
node_modules/
.next/
dist/
build/
coverage/
*.min.js
pnpm-lock.yaml
```

### 3.3 Husky + lint-staged設定

#### インストールとセットアップ
```bash
# Husky インストール
pnpm add -D -w husky lint-staged

# Husky 初期化
pnpm exec husky init
```

#### .husky/pre-commit
```bash
pnpm lint-staged
```

#### package.json に追加
```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

### 3.4 VSCode設定

#### .vscode/settings.json
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.tsdk": "node_modules/typescript/lib",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

#### .vscode/extensions.json
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "streetsidesoftware.code-spell-checker"
  ]
}
```

---

## Step 4: package.json スクリプト追加

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
    "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit",
    "prepare": "husky"
  }
}
```

---

## Step 5: 動作確認

### 5.1 Lintチェック
```bash
pnpm lint
```

### 5.2 フォーマットチェック
```bash
pnpm format:check
```

### 5.3 型チェック
```bash
pnpm typecheck
```

### 5.4 コミットフック確認
```bash
# テストファイルを作成してコミット
git add .
git commit -m "test: verify husky and lint-staged"
```

### 5.5 結果報告

```
## 開発ツール設定結果

| ツール | 状態 | 確認コマンド |
|--------|------|-------------|
| ESLint | [Success/Failed] | `pnpm lint` |
| Prettier | [Success/Failed] | `pnpm format:check` |
| TypeScript | [Success/Failed] | `pnpm typecheck` |
| Husky | [Success/Failed] | `git commit` 時に動作 |
| lint-staged | [Success/Failed] | `git commit` 時に動作 |

### 問題点（あれば）
- [問題と対処法]
```

---

## オプション: 追加ツール

### Biome（ESLint + Prettier の代替）

高速な代替として Biome を使用する場合:

```bash
pnpm add -D -w @biomejs/biome
npx @biomejs/biome init
```

#### biome.json
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded"
    }
  }
}
```

### Commitlint（コミットメッセージ規約）

```bash
pnpm add -D -w @commitlint/cli @commitlint/config-conventional
```

#### commitlint.config.js
```javascript
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf']
    ]
  }
}
```

#### .husky/commit-msg
```bash
npx --no -- commitlint --edit $1
```

---

## 完了条件

- [ ] ESLint が正常に動作する
- [ ] Prettier が正常に動作する
- [ ] Husky がコミット時にフックを実行する
- [ ] lint-staged がステージされたファイルのみをチェックする
- [ ] VSCode 設定が配置されている
- [ ] `pnpm lint`, `pnpm format:check`, `pnpm typecheck` が全てパスする

---

## 完了後のアクション

```
## 開発ツールのセットアップが完了しました

### 設定されたツール
- ESLint: コード品質チェック
- Prettier: コードフォーマット
- Husky: Git フック
- lint-staged: ステージファイルのチェック
- VSCode: エディタ設定

### 追加されたスクリプト
- `pnpm lint` - Lint実行
- `pnpm lint:fix` - Lint + 自動修正
- `pnpm format` - フォーマット実行
- `pnpm format:check` - フォーマットチェック
- `pnpm typecheck` - 型チェック

内容を確認し、問題なければ「OK」と入力してください。
```

---

## 次のステップ
`/phase-3-foundation/auth` - 認証機能の実装
