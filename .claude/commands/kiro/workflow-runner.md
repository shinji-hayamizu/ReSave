---
description: Kiro Workflowの段階的実行ガイド。各ステップ完了時に次のコマンドを提示し、/clearを促す
allowed-tools: Read, Glob
argument-hint: <feature-name> [--mode=full|quick] [--from=step]
---

# Kiro Workflow Runner

ユーザーをKiro Workflowの各ステップに沿ってガイドし、適切なタイミングで`/clear`を促すオーケストレーター。

## 概要

このコマンドは:
1. 現在の進捗状況を確認
2. 次に実行すべきコマンドを提示
3. 各ステップ完了後に`/clear`を促す

## 使用方法

```bash
# 新規開始（フルフロー）
/kiro:workflow-runner my-feature --mode=full

# 新規開始（クイックフロー）
/kiro:workflow-runner my-feature --mode=quick

# 途中から再開
/kiro:workflow-runner my-feature --from=design

# 進捗確認のみ
/kiro:workflow-runner my-feature
```

## 実行フロー

### Step 1: 進捗確認

1. `.kiro/specs/{feature-name}/` ディレクトリの存在確認
2. 存在するファイルから現在のステップを判定:
   - `spec.json` のみ → init完了
   - `requirements.md` (内容あり) → requirements完了
   - `design.md` → design完了
   - `tasks.md` → tasks完了
   - `tasks.md` 内の完了タスク数 → impl進捗

### Step 2: ワークフロー定義

#### フルフロー (--mode=full)

| Step | コマンド | 完了判定 |
|------|---------|---------|
| 1. init | `/kiro:spec-init <description>` | spec.json存在 |
| 2. requirements | `/kiro:spec-requirements {feature}` | requirements.md内容あり |
| 3. design | `/kiro:spec-design {feature}` | design.md存在 |
| 4. validate-design | `/kiro:validate-design {feature}` | オプション（スキップ可） |
| 5. tasks | `/kiro:spec-tasks {feature}` | tasks.md存在 |
| 6. impl | `/dev/cc-sdd {feature} --chunked` | 全タスク完了 |
| 7. validate-impl | `/kiro:validate-impl {feature}` | 最終検証 |

#### クイックフロー (--mode=quick)

| Step | コマンド | 完了判定 |
|------|---------|---------|
| 1. init | `/kiro:spec-init <description>` | spec.json存在 |
| 2. requirements | `/kiro:spec-requirements {feature}` | requirements.md内容あり |
| 3. tasks | `/kiro:spec-tasks {feature}` | tasks.md存在 |
| 4. impl | `/dev/cc-sdd {feature}` | 全タスク完了 |

### Step 3: 出力形式

#### 初回実行時（specなし）

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kiro Workflow: 新規開始

選択されたフロー: {full|quick}

Step 1: 仕様の初期化

次のコマンドを実行してください:
/kiro:spec-init <機能の説明>

例:
/kiro:spec-init お気に入り機能 - ユーザーがカードをお気に入りに登録できる
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### ステップ完了時

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kiro Workflow: {feature-name}

進捗: Step {current}/{total} 完了

[x] 1. init
[x] 2. requirements
[ ] 3. design
[ ] 4. validate-design (オプション)
[ ] 5. tasks
[ ] 6. impl
[ ] 7. validate-impl

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
次のステップ: design

コンテキスト節約のため /clear を実行してから:
/kiro:spec-design {feature-name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### impl進行中

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kiro Workflow: {feature-name}

進捗: Step 6/7 (impl) 進行中

タスク進捗: {completed}/{total} ({percentage}%)

Phase完了状況:
[x] Phase 1 (タスク 1.1)
[x] Phase 2 (タスク 2.1, 2.2)
[ ] Phase 3 (タスク 3.1, 3.2)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
次のアクション:

コンテキスト節約のため /clear を実行してから:
/dev/cc-sdd {feature-name} --from 3.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 全ステップ完了時

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kiro Workflow: {feature-name}

全ステップ完了!

[x] 1. init
[x] 2. requirements
[x] 3. design
[x] 4. validate-design
[x] 5. tasks
[x] 6. impl
[x] 7. validate-impl

生成されたファイル:
- .kiro/specs/{feature-name}/spec.json
- .kiro/specs/{feature-name}/requirements.md
- .kiro/specs/{feature-name}/design.md
- .kiro/specs/{feature-name}/tasks.md
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 判定ロジック

### requirements.md の完了判定

`requirements.md` が以下の条件を満たす場合に完了とみなす:
- ファイルサイズが500バイト以上
- `## ` で始まる見出しが3つ以上存在
- `REQ-` で始まる要件IDが1つ以上存在

### tasks.md の進捗判定

```
完了タスク: `- [x]` の数
未完了タスク: `- [ ]` の数
進捗率: 完了 / (完了 + 未完了) * 100
```

## 注意事項

- このコマンド自体はファイルを変更しない（読み取りのみ）
- 各ステップの実行はユーザーが手動で行う
- `/clear` の実行もユーザーが手動で行う
- 状態は `.kiro/specs/` のファイルで管理されるため、セッションをまたいでも継続可能
