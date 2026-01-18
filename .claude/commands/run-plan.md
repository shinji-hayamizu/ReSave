# Plan Runner

保存された計画ファイルを読み込み、タスクを順次実行します。

## 使用方法

```
/run-plan <plan-name>
/run-plan <plan-name> --from <task-id>
/run-plan <plan-name> --only <task-ids>
/run-plan <plan-name> --chunked
/run-plan <plan-name> --dry-run
```

## 引数

$ARGUMENTS

- `<plan-name>`: 計画ファイル名（.md 省略可）
- `--from <id>`: 指定タスクから再開（例: `--from 2.1`）
- `--only <ids>`: 指定タスクのみ実行（例: `--only 1.1,1.2,2.1`）
- `--chunked`: フェーズ単位で実行（各フェーズ完了後に停止）
- `--dry-run`: 実行計画のみ表示（実際の変更なし）

## 実行手順

### Step 1: 計画ファイル読み込み

以下のパスを順に検索:
1. `.claude/plans/{plan-name}.md`
2. `.claude/plans/{plan-name}` (拡張子付き)

**読み込み内容**:
- Summary / Goal / Context
- Files テーブル
- Tasks 一覧
- Verification 項目

### Step 2: コンテキスト復元

計画から以下を抽出し、実行に必要なコンテキストを構築:

1. **参照ファイルの読み込み**
   - Files テーブルの `reference` ファイル
   - プロジェクトの CLAUDE.md（規約確認）

2. **状態確認**
   - 進捗ファイル（`.claude/state/{plan-name}-progress.json`）があれば読み込み
   - 完了済みタスクをスキップ対象に

### Step 3: 実行計画表示

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plan: {タイトル}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Goal:
  {Goal の内容}

Execution Plan:

Phase 1: {フェーズ名}
  ├─ 1.1 {タスク名} {[DONE] | [SKIP] | [TODO]}
  └─ 1.2 {タスク名} {[DONE] | [SKIP] | [TODO]}

Phase 2: {フェーズ名}
  ├─ 2.1 {タスク名} {[TODO]}
  └─ 2.2 {タスク名} {[TODO]}

Summary:
  - Total: {N} tasks
  - Done: {M} tasks
  - Remaining: {K} tasks

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

`--dry-run` 時はここで終了。

### Step 4: タスク順次実行

**実行モード判定**:
- `--chunked` 指定時: フェーズ単位で実行し、各フェーズ完了後に停止
- 通常モード: 全タスクを連続実行

各タスクを以下の手順で実行:

#### 4a. タスク開始

```
──────────────────────────────────────
▶️ Task {X.Y}: {タスク名}
──────────────────────────────────────

Target: {対象ファイル}
Action: {作業内容}

Details:
  - {詳細1}
  - {詳細2}

Acceptance: {完了条件}
──────────────────────────────────────
```

#### 4b. 実装実行

計画に基づいて実装:
1. 対象ファイルを読み込み
2. 計画の Details に従って変更
3. Acceptance 条件を満たすことを確認

#### 4c. タスク完了

```
✅ Task {X.Y} 完了

Changes:
  - {変更ファイル1}: {変更内容}
  - {変更ファイル2}: {変更内容}
```

#### 4d. フェーズ完了時（--chunked モード）

`--chunked` モードでフェーズ（同一メジャー番号のタスク群）が完了した場合:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase {N} 完了
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

完了タスク:
  [x] {N}.1 {タスク名}
  [x] {N}.2 {タスク名}

進捗: {completed}/{total} タスク ({percentage}%)

次のフェーズ: Phase {N+1}
  [ ] {N+1}.1 {タスク名}
  [ ] {N+1}.2 {タスク名}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
コンテキスト節約のため /clear を実行してから:

/run-plan {plan-name} --from {N+1}.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**重要**: `--chunked` モードでは、各フェーズ完了後に実行を停止します。
ユーザーが `/clear` 後に再開コマンドを実行することで、新しいコンテキストで次フェーズを開始できます。

### Step 5: 進捗記録

各タスク完了時に進捗を保存:

`.claude/state/{plan-name}-progress.json`:
```json
{
  "plan": "{plan-name}",
  "started_at": "2024-01-17T10:00:00Z",
  "updated_at": "2024-01-17T11:30:00Z",
  "tasks": {
    "1.1": { "status": "completed", "completed_at": "..." },
    "1.2": { "status": "completed", "completed_at": "..." },
    "2.1": { "status": "in_progress" }
  }
}
```

### Step 6: 検証実行

全タスク完了後、Verification セクションを実行:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Running: {テストコマンド}
  ✅ Passed

Running: pnpm type-check
  ✅ Passed

Running: pnpm build
  ✅ Passed

Manual Check Required:
  - {手動確認項目}
```

### Step 7: 完了サマリー

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Plan Completed: {タイトル}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Results:
  ✅ Completed: {N} tasks
  ⏭️ Skipped: {M} tasks
  ❌ Failed: {K} tasks

Changed Files:
  - {ファイル1}
  - {ファイル2}
  ...

Verification:
  ✅ All checks passed

Next Steps:
  - Review changes: git diff
  - Commit: git add . && git commit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## エラーハンドリング

### 計画ファイルが見つからない場合

```
❌ Plan not found: {plan-name}

Available plans:
  - 2024-01-15-login-validation
  - 2024-01-16-dashboard-refactor
  ...

Usage: /run-plan <plan-name>
```

### タスク実行失敗時

```
❌ Task {X.Y} 失敗

Error:
  {エラー内容}

Progress saved. Resume with:
  /run-plan {plan-name} --from {X.Y}

Or skip this task:
  /run-plan {plan-name} --from {X.Y+1}
```

### 検証失敗時

```
⚠️ Verification Failed

Failed check: {テストコマンド}
Output:
  {エラー出力}

Options:
  1. Fix the issue and re-run verification
  2. Mark as known issue and proceed
```

## コンテキスト管理

### 新規セッションでの実行

別セッションで実行する場合、以下が自動的に復元されます:

1. **計画の Goal と Context** - 作業の目的を把握
2. **Files テーブル** - 対象ファイルの一覧
3. **各タスクの Details** - 具体的な実装指示
4. **進捗状態** - 完了済みタスクのスキップ

### コンテキスト節約

大規模な計画の場合:

1. **フェーズ単位で実行**
   ```
   /run-plan my-plan --only 1.1,1.2,1.3
   ```

2. **セッション分割**
   - Phase 1 完了 → 新セッション → Phase 2 から再開
   ```
   /run-plan my-plan --from 2.1
   ```

## 補足

### 計画の修正

実行中に計画の修正が必要な場合:
1. 現在のタスクを完了またはスキップ
2. 計画ファイルを直接編集
3. `--from` で該当タスクから再開

### 並列タスクの扱い

計画に `(P)` マークのタスクがある場合:
- デフォルトでは順次実行
- 将来的に `--parallel` オプションで並列実行対応予定

### 計画のアーカイブ

完了した計画は自動的にステータスが更新されます:
- `Status: draft` → `Status: completed`
- `Completed: {YYYY-MM-DD HH:mm}` が追加

## ワークフロー連携

### /plan-workflow との連携

`/plan-workflow` を使用すると、計画から検証までの全体フローを管理できます:

```bash
# ワークフロー全体を管理
/plan-workflow {plan-name}

# 進捗確認
/plan-workflow {plan-name} --status
```

### 推奨ワークフロー（大規模計画）

```bash
# Session 1: Phase 1 実行
/run-plan my-plan --chunked
# → Phase 1 完了後に停止

# Session 2: Phase 2 実行
/clear
/run-plan my-plan --from 2.1
# → Phase 2 完了後に停止

# Session N: 検証
/clear
/plan-workflow my-plan
# → 検証手順を案内
```

### 推奨ワークフロー（小規模計画）

```bash
# 1セッションで完了
/run-plan my-plan
# → 全タスク実行 → 検証 → 完了
```
