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

### Step 2: 品質チェック（マージ前）

以下を順番に実行し、**失敗した場合はマージを中断してユーザーに報告する**。

#### 2-1: ユニットテスト

```bash
pnpm --filter web test -- --run
```

失敗した場合: 「テストが失敗しています。修正してから再度 /dev-finish を実行してください。」と報告して中断。

#### 2-2: E2Eテスト

devサーバーが起動していることを確認する:

```bash
lsof -ti:3000 || lsof -ti:3002 || lsof -ti:3003
```

起動していない場合はバックグラウンドで起動してから実行:

```bash
# 起動中のポートを使ってE2Eを実行
BASE_URL=http://localhost:<port> pnpm --filter web test:e2e
```

失敗した場合: 「E2Eテストが失敗しています。スクリーンショットを確認して修正後、再度 /dev-finish を実行してください。」と失敗したテスト名とともに報告して中断。

両方のテストが通った場合のみ次のステップへ進む。

### Step 3: PRをマージ

```bash
gh pr merge <PR番号> --merge --delete-branch
```

`--delete-branch` でリモートブランチを自動削除。

### Step 4: devサーバーを停止

worktreeに記録されたPIDファイルからdevサーバーを停止する:

```bash
PID_FILE="/Users/haya/development/myApps/job/ReSave/.claude/worktrees/<name>/.dev-server-pid"
if [ -f "$PID_FILE" ]; then
  kill $(cat "$PID_FILE") 2>/dev/null || true
  rm "$PID_FILE"
fi
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
