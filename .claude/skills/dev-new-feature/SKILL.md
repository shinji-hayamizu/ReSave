---
name: dev:new-feature
description: |
  ReSaveで新機能開発を開始するスキル。
  developブランチから feature/* ブランチを作成し、
  EnterWorktreeで分離されたworktree環境に入って作業を開始する。
  依存関係インストール + 環境変数リンク + devサーバー起動まで自動化。
allowed-tools: Bash, EnterWorktree, AskUserQuestion
---

# 新機能開発開始スキル

新機能開発をworktree環境で開始する。

## フロー

### Step 1: 未コミット変更の確認

```bash
git status --porcelain
```

未コミット変更があっても **そのまま続行する**。
worktreeは独立したディレクトリに作成されるため、メインリポジトリの未コミット変更はworktreeに一切影響しない。

### Step 2: ブランチ名の決定

引数がある場合はそれをブランチ名として使用する。
引数がない場合は、**直前の会話のタスク内容からブランチ名を自動生成する**（質問しない）。

ブランチ名の生成ルール:
- タスクの内容を英語の動詞+名詞で簡潔に表現する（例: `add-tag-filter`, `fix-card-review`, `improve-home-ssr`）
- 英数字とハイフンのみ使用（スペース・日本語はハイフンに変換または英訳）
- 20文字以内を目安にする
- `feature/` 形式に自動変換（すでに `feature/` が付いている場合はそのまま）

### Step 3: developの最新を取得

```bash
git fetch origin develop
git checkout develop
git pull origin develop
```

失敗した場合はエラー内容を表示して中断する。

### Step 4: worktreeを作成して入場

`EnterWorktree(name: "<name>")` を呼び出す。

EnterWorktreeは内部で以下を実行する:
- `.claude/worktrees/<name>/` にworktreeを作成
- `feature/<name>` ブランチを作成
- worktreeに入場（作業ディレクトリが切り替わる）

### Step 5: 依存関係インストール

```bash
pnpm install
```

### Step 6: 環境変数のシンボリックリンク作成

worktreeには `.env.local` / `.env` が存在しないため、メインリポジトリからシンボリックリンクを作成する:

```bash
MAIN_REPO=/Users/haya/development/myApps/job/ReSave

# apps/web/.env.local
[ -f "$MAIN_REPO/apps/web/.env.local" ] && \
  ln -sf "$MAIN_REPO/apps/web/.env.local" apps/web/.env.local

# apps/admin/.env.local
[ -f "$MAIN_REPO/apps/admin/.env.local" ] && \
  ln -sf "$MAIN_REPO/apps/admin/.env.local" apps/admin/.env.local

# apps/mobile/.env
[ -f "$MAIN_REPO/apps/mobile/.env" ] && \
  ln -sf "$MAIN_REPO/apps/mobile/.env" apps/mobile/.env

# apps/mobile/.env.local (存在する場合)
[ -f "$MAIN_REPO/apps/mobile/.env.local" ] && \
  ln -sf "$MAIN_REPO/apps/mobile/.env.local" apps/mobile/.env.local
```

### Step 7: packages/ シンボリックリンク

worktreeにpackages/がない場合（gitignoreされている場合）、メインリポジトリからリンク:

```bash
[ ! -d "packages" ] && [ -d "$MAIN_REPO/packages" ] && \
  ln -sf "$MAIN_REPO/packages" packages
```

### Step 8: devサーバー起動（オプション）

対象アプリに応じて起動する:

**Web (Next.js) の場合:**
```bash
# ポート確認
lsof -ti:3000 && echo "IN_USE" || echo "FREE"

# 空きポートで起動
PORT=$(lsof -ti:3000 > /dev/null 2>&1 && echo 3002 || echo 3000)
cd apps/web && pnpm next dev -p $PORT &
echo $! > .dev-server-pid
```

**Mobile (Expo) の場合:**
```bash
cd apps/mobile && npx expo start --port 8081 &
echo $! > .expo-server-pid
```

ユーザーの依頼内容に応じて起動するサーバーを判断する:
- Mobile関連の作業 → Expo devサーバーを起動
- Web関連の作業 → Next.js devサーバーを起動
- 両方 → 両方起動
- 不明な場合 → 起動しない（後で手動起動可能）

### Step 9: 完了案内

```
worktree環境に入りました。

ブランチ: feature/<name>
パス: .claude/worktrees/<name>/

作業を進めたら以下のスキルを使用してください:
- /dev-finish   実装完了・PR作成・マージ・クリーンアップ
```

## 注意事項

- develop または master ブランチで実行すること（feature/* では実行しない）
- worktree内での作業は `.claude/worktrees/<name>/` 配下で行われるため、メインの作業ディレクトリに影響しない
