---
name: dev:new-feature
description: |
  ReSaveで新機能開発を開始するスキル。
  developブランチから feature/* ブランチを作成し、
  EnterWorktreeで分離されたworktree環境に入って作業を開始する。
allowed-tools: Bash, EnterWorktree, AskUserQuestion
---

# 新機能開発開始スキル

新機能開発をworktree環境で開始する。

## フロー

### Step 1: 未コミット変更の確認

```bash
git status --porcelain
```

未コミット変更がある場合は中断し、コミットまたはスタッシュするよう案内する。

### Step 2: ブランチ名の決定

引数からブランチ名を取得する。引数がない場合は質問する。

- 入力例: `add-tag-filter`, `fix-card-review`, `improve-home-ssr`
- 自動整形: `feature/<name>` 形式に変換（すでに `feature/` が付いている場合はそのまま）
- 英数字とハイフンのみ使用（スペースはハイフンに変換）

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

### Step 6: 完了案内

以下を表示する:

```
worktree環境に入りました。

作業を進めたら以下のスキルを使用してください:
- /dev:test     変更に関連するテストを実行
- /dev:finish   実装完了・PR作成・マージ・クリーンアップ
```

## 注意事項

- develop または master ブランチで実行すること（feature/* では実行しない）
- worktree内での作業は `.claude/worktrees/<name>/` 配下で行われるため、メインの作業ディレクトリに影響しない
