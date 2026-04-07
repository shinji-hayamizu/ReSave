---
name: dev:finish
description: |
  ReSaveの機能確認完了後、PRをマージしてクリーンアップするスキル。
  PRマージ → devサーバー停止 → worktree・ブランチ削除。
allowed-tools: Bash, Skill
---

# 機能完了スキル

動作確認済みのPRをマージし、devサーバー停止・worktreeクリーンアップまでを一括で行う。

## フロー

### Step 1: ブランチ・PR確認

```bash
git branch --show-current
```

現在のブランチ名（worktree名）を取得する。

```bash
gh pr view --json number,url,baseRefName,title
```

対象PRの番号とURLを確認する。PRがない場合は中断する。

### Step 2: PRをマージ

```bash
gh pr merge <PR番号> --merge --delete-branch
```

`--delete-branch` でリモートブランチを自動削除。

### Step 3: devサーバーを停止

起動中のdevサーバー（3000・3002番）を停止する:

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
```

### Step 4: worktreeとローカルブランチを削除

worktree名を現在のブランチ名から取得する（例: `worktree-auth-error-messages`）。

Codex MCPを使って以下を実行する（Bashのcwdがworktree内にあるため、直接Bashでは実行できない）:

```
mcp__codex__codex({
  prompt: "以下を順番に実行してください:\n1. git checkout develop\n2. git pull origin develop\n3. git worktree remove .claude/worktrees/<name> --force 2>/dev/null || echo 'worktree already removed'\n4. git worktree prune\n5. git branch -D <branch> 2>/dev/null || echo 'branch already gone'\n6. git worktree list",
  cwd: "/Users/haya/development/myApps/job/ReSave",
  sandbox: "workspace-write",
  approval-policy: "never"
})
```

### Step 5: 完了報告

```
完了しました。

マージ先: develop
削除したブランチ: <branch>
devサーバー: 停止済み

次のアクション:
- /release          developをmasterにリリース
- /dev-new-feature  次の機能開発を開始
```

## 注意事項

- dev-new-feature で起動したdevサーバーを自動停止する
- worktreeとローカルブランチはマージ後に自動削除される
