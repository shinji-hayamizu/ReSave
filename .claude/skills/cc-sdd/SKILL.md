---
name: cc-sdd
description: SDD (Spec-Driven Development) タスク実行。tasks.mdの全タスクをPhase順に自動実行する。spec実装を一気に進める、タスクを連続実行する場合に使用。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, TodoWrite
---

# SDD (Spec-Driven Development) タスク実行スキル

## 概要

Kiro形式のspecタスクを一気通貫で実行する。

## 使用方法

```
/cc-sdd {spec-name}
/cc-sdd {spec-name} --from {task-id}
/cc-sdd {spec-name} --chunked
```

## 重要: コンテキスト節約ルール

### フェーズ完了時の必須出力

**各フェーズ（メジャー番号単位）完了時に、必ず以下の形式で出力すること:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Phase X 完了

完了タスク:
- [x] X.1 タスク名
- [x] X.2 タスク名

次のフェーズ: Phase Y (タスク Y.1, Y.2, ...)

コンテキスト節約のため /clear を実行してください。

再開コマンド:
/cc-sdd {spec-name} --from Y.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### --chunked モード

`--chunked` オプション使用時は、1フェーズ完了後に自動停止し、上記の出力を表示する。

### 推奨ワークフロー

```
1. /cc-sdd spec-name --chunked
2. Phase 1 完了 → ユーザーが /clear 実行
3. /cc-sdd spec-name --from 2.1
4. Phase 2 完了 → ユーザーが /clear 実行
5. 繰り返し...
```

## 実行フロー

### Step 1: Spec検索

以下のパスを順に検索:
1. `.kiro/specs/{spec-name}/tasks.md`
2. `.claude/specs/{spec-name}/tasks.md`

見つからない場合はエラー表示と利用可能なspec一覧を表示。

### Step 2: コンテキスト読み込み

1. `tasks.md` を読み込み、タスク一覧を取得
2. `requirements.md` と `design.md` を読み込み、実装コンテキストを取得
3. `.kiro/steering/` 配下の全ファイルを読み込み、プロジェクトコンテキストを取得
4. `CLAUDE.md` を読み込み、プロジェクト規約を取得

### Step 3: タスク解析

tasks.mdから抽出:
- `- [ ] X.Y タスク名` → 未完了タスク
- `- [x] X.Y タスク名` → 完了済みタスク（スキップ）
- `(P)` マーク → 並列実行可能
- インデント配下 → 実行詳細
- `_Requirements: ..._` → 関連要件

### Step 4: フェーズ構成

同一メジャー番号でグループ化:

```
Phase 1: タスク 1.1
Phase 2: タスク 2.1, 2.2
Phase 3: タスク 3.1, 3.2
Phase 4: タスク 4.1(P), 4.2(P), 5.1(P), 5.2(P), 6.1(P) ← 並列
Phase 5: タスク 7.1, 7.2, 8.1
Phase 6: タスク 9.1, 9.2, 9.3
```

### Step 5: 実行

#### 通常タスク
順次実行し、各タスク完了後に進捗表示。

#### 並列タスク（(P)マーク）
Task toolで同時にsubagentを起動し、全完了を待機。

#### フェーズ完了時
**必ず「重要: コンテキスト節約ルール」セクションの出力形式に従う。**

### Step 6: 進捗管理

`.claude/state/{spec-name}-progress.json` に記録:
- 完了タスク
- 生成ファイル
- エラー履歴

### Step 7: エラー時

```
❌ Task X.Y 失敗: {エラー内容}

再開コマンド:
/cc-sdd {spec-name} --from X.Y
```

## tasks.md 更新ルール

タスク完了時、以下の形式で更新:

```markdown
# Before
- [ ] 4.1 (P) 型定義ファイル生成の実装

# After
- [x] 4.1 (P) 型定義ファイル生成の実装
```

## 完了条件

- 全タスクのチェックボックスが `[x]` になっている
- エラーなく全Phaseが完了している

## トラブルシューティング

### コンテキスト溢れが発生した場合

1. `/clear` でコンテキストをクリア
2. `/cc-sdd {spec-name} --from {last-completed-task + 1}` で再開

### 特定タスクで失敗が続く場合

1. `--from={task-id}` オプションで該当タスクから再開
2. または手動で実装後、tasks.mdを更新して次タスクから再開
