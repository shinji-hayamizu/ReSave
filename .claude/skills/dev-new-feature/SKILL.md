---
name: dev:new-feature
description: |
  ReSaveで新機能開発を開始するスキル。
  developブランチから feature/* ブランチを作成し、
  EnterWorktreeで分離されたworktree環境に入り、実装 → コミット → PR作成 → devサーバー起動まで行う。
allowed-tools: Bash, EnterWorktree, AskUserQuestion, Skill
---

# 新機能開発開始スキル

新機能開発をworktree環境で開始し、PR作成・devサーバー起動までを一括で行う。

## フロー

### Step 1: 未コミット変更の確認

```bash
git status --porcelain
```

未コミット変更があっても **そのまま続行する**。

worktreeは独立したディレクトリ（`.claude/worktrees/<name>/`）に作成されるため、
メインリポジトリの未コミット変更はworktreeに一切影響しない。stashは不要。

### Step 2: ブランチ名の決定

引数がある場合はそれをブランチ名として使用する。
引数がない場合は、**直前の会話のタスク内容からブランチ名を自動生成する**（質問しない）。

ブランチ名の生成ルール:
- タスクの内容を英語の動詞+名詞で簡潔に表現する（例: `add-tag-filter`, `fix-card-review`, `improve-home-ssr`）
- 英数字とハイフンのみ使用（スペース・日本語はハイフンに変換または英訳）
- 20文字以内を目安にする
- `feature/` 形式に自動変換（すでに `feature/` が付いている場合はそのまま）

生成したブランチ名はStep 4の確認表示で提示し、変更を希望する場合はユーザーが申告できるようにする。

### Step 3: developの最新を取得

```bash
git fetch origin develop
git checkout develop
git pull origin develop
```

失敗した場合はエラー内容を表示して中断する。

### Step 4: 確認表示

以下の情報を表示してユーザーに確認を求める:

```
新機能開発を開始します:
- ブランチ名: feature/<name>
- ベース: develop (最新をpull済み)
- worktreeパス: .claude/worktrees/<name>/

続行しますか？
```

### Step 5: worktreeを作成して入場

`EnterWorktree(name: "<name>")` を呼び出す。

EnterWorktreeは内部で以下を実行する:
- `.claude/worktrees/<name>/` にworktreeを作成
- `feature/<name>` ブランチを作成
- worktreeに入場（作業ディレクトリが切り替わる）

### Step 6: 依存関係インストール・環境変数のシンボリックリンク作成

worktreeには `node_modules` が存在しないため、インストールする:

```bash
cd .claude/worktrees/<name> && pnpm install
```

次に、worktreeには `.env.local` が存在しないため、メインリポジトリからシンボリックリンクを作成する:

```bash
# apps/web/.env.local
ln -sf /Users/haya/development/myApps/job/ReSave/apps/web/.env.local \
  .claude/worktrees/<name>/apps/web/.env.local

# apps/admin/.env.local (存在する場合)
[ -f /Users/haya/development/myApps/job/ReSave/apps/admin/.env.local ] && \
  ln -sf /Users/haya/development/myApps/job/ReSave/apps/admin/.env.local \
    .claude/worktrees/<name>/apps/admin/.env.local
```

### Step 7: 実装

ユーザーの依頼内容に従って実装を行う。
実装完了後、テストを作成・実行する（`/testing` スキルを使用）。

### Step 8: コミット・push・PR作成

```
Skill(convenience:commit)
```

コミット後、pushしてPRを作成する:

```bash
git push origin <branch>
```

```
Skill(convenience:create-pr)
```

PR設定:
- ベースブランチ: `develop`
- タイトル・本文: コミット内容から自動生成（確認不要でそのまま作成）

### Step 8: devサーバー起動

3000番ポートが使用中かチェックし、空いていれば3000、使用中なら3002で起動する:

```bash
# ポート確認
lsof -ti:3000 && echo "IN_USE" || echo "FREE"
```

空いている場合:
```bash
cd apps/web && pnpm next dev -p 3000
```

使用中の場合:
```bash
cd apps/web && pnpm next dev -p 3002
```

バックグラウンドで起動し、起動確認後にURLを表示する。

### Step 9: 完了案内

```
完了しました。

PR URL: <url>
devサーバー: http://localhost:<port>

動作確認後は /dev-finish でマージ・クリーンアップを行ってください。
```


## 注意事項

- develop または master ブランチで実行すること（feature/* では実行しない）
- worktree内での作業は `.claude/worktrees/<name>/` 配下で行われるため、メインの作業ディレクトリに影響しない
