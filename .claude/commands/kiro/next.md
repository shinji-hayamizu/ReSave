---
description: 現在のspec進捗を確認し、次に実行すべきKiroコマンドを提示
allowed-tools: Read, Glob
argument-hint: [feature-name]
---

# Kiro Next Step

現在のspec進捗状況を確認し、次に実行すべきコマンドを提示する軽量コマンド。

## 使用方法

```bash
# 指定したfeatureの次ステップを確認
/kiro:next my-feature

# 最新のspecを自動検出して次ステップを確認
/kiro:next
```

## 実行フロー

### Step 1: Feature特定

引数がない場合:
1. `.kiro/specs/` 配下のディレクトリを取得
2. 各specの `spec.json` の `updatedAt` を確認
3. 最新のspecを対象とする

### Step 2: 進捗判定

`.kiro/specs/{feature-name}/` 内のファイルを確認:

| ファイル | 判定条件 | 完了ステップ |
|---------|---------|-------------|
| `spec.json` | 存在する | init |
| `requirements.md` | 500B以上 & REQ-あり | requirements |
| `design.md` | 存在 & 1KB以上 | design |
| `tasks.md` | 存在 | tasks |
| `tasks.md` | 全タスク[x] | impl |

### Step 3: 出力

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{feature-name}: {current-step} 完了

次のステップ:
/kiro:spec-{next-step} {feature-name}

Tip: /clear してから実行するとコンテキストを節約できます
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### impl進行中の場合

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{feature-name}: impl 進行中 ({completed}/{total})

次のタスク: {next-task-id} {task-name}

再開コマンド:
/dev/cc-sdd {feature-name} --from {next-task-id}

Tip: /clear してから実行するとコンテキストを節約できます
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## ステップ順序

```
init → requirements → design → tasks → impl → validate-impl → 完了
```

## 補足

- `validate-design` はオプションのためスキップ可能
- 各ステップ完了後は `/clear` を推奨
- 詳細な進捗確認は `/kiro:workflow-runner {feature}` を使用
