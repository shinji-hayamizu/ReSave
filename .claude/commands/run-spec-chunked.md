# コンテキスト節約型 Spec タスクランナー

各タスクを独立したセッションで実行し、コンテキスト使用量を最小化します。

## 使用方法

```
/run-spec-chunked <spec-name>
/run-spec-chunked <spec-name> --phase <N>
```

## 引数

$ARGUMENTS

## コンセプト

通常の `/run-spec` は1セッションで全タスクを実行しますが、
このコマンドは以下の方式でコンテキストを節約:

1. **フェーズ単位の状態永続化** - 各フェーズ完了時に成果物を記録
2. **最小コンテキスト転送** - 次フェーズには必要情報のみ渡す
3. **自動継続プロンプト生成** - 次フェーズ実行用コマンドを出力

## 実行手順

### Step 1: 初期化（初回のみ）

spec を読み込み、実行計画を `.claude/state/{spec-name}/` に保存:

```
.claude/state/{spec-name}/
├── plan.json          # 全タスク計画
├── context.json       # 共有コンテキスト（アーキテクチャ等）
├── phase-1.json       # Phase 1 の状態
├── phase-2.json       # Phase 2 の状態
└── outputs/           # 各タスクの成果物記録
    ├── task-1.1.json
    └── task-2.1.json
```

### Step 2: フェーズ実行

現在フェーズのタスクのみ実行:

```
📦 Phase {N} 実行中（コンテキスト節約モード）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

読み込みコンテキスト:
  - plan.json (500 tokens)
  - context.json (2000 tokens)
  - phase-{N-1} outputs (1500 tokens)
  
合計: ~4000 tokens（フル実行比 -80%）
```

### Step 3: 成果物記録

タスク完了時、最小限の情報を記録:

```json
// outputs/task-2.1.json
{
  "task_id": "2.1",
  "status": "completed",
  "outputs": [
    {
      "type": "file",
      "path": "src/types/card.ts",
      "summary": "Card型、CreateCardInput型を定義"
    }
  ],
  "context_for_next": {
    "available_types": ["Card", "CreateCardInput", "UpdateCardInput"],
    "import_path": "@/types/card"
  }
}
```

### Step 4: 継続プロンプト生成

フェーズ完了時、次フェーズ用のコマンドを表示:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Phase {N} 完了

次のフェーズを実行するには新しいチャットで:

/run-spec-chunked {spec-name} --phase {N+1}

または、全自動継続（シェルスクリプト）:
bash .claude/state/{spec-name}/continue.sh
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 5: 自動継続スクリプト生成

`.claude/state/{spec-name}/continue.sh`:

```bash
#!/bin/bash
# 自動生成された継続スクリプト

SPEC_NAME="{spec-name}"
STATE_DIR=".claude/state/$SPEC_NAME"
CURRENT_PHASE=$(cat "$STATE_DIR/current-phase" 2>/dev/null || echo "1")
TOTAL_PHASES=$(jq '.total_phases' "$STATE_DIR/plan.json")

if [ "$CURRENT_PHASE" -gt "$TOTAL_PHASES" ]; then
  echo "🎉 All phases completed!"
  exit 0
fi

echo "🚀 Executing Phase $CURRENT_PHASE..."

# Claude Code を非対話モードで実行
claude --print "/run-spec-chunked $SPEC_NAME --phase $CURRENT_PHASE"

# 次のフェーズ番号を記録
echo $((CURRENT_PHASE + 1)) > "$STATE_DIR/current-phase"

# 再帰実行
exec "$0"
```

## コンテキスト転送形式

### 最小コンテキスト（phase-N.json）

```json
{
  "phase": 2,
  "spec_name": "api-backend-generate",
  "prerequisites": {
    "completed_tasks": ["1.1"],
    "available_outputs": {
      "types": ["Card", "Tag"],
      "schemas": ["createCardSchema"]
    }
  },
  "current_tasks": [
    {
      "id": "2.1",
      "name": "アーキテクチャ文書解析の実装",
      "details": ["..."],
      "requirements": ["1.1", "1.2", "1.5"]
    }
  ]
}
```

### 共有コンテキスト（context.json）

プロジェクト共通情報（1回だけ解析）:

```json
{
  "project": {
    "type": "next-app",
    "src_dir": "apps/web/src"
  },
  "conventions": {
    "naming": "camelCase",
    "exports": "named-only"
  },
  "architecture": {
    "entities": ["Card", "Tag", "StudyLog"],
    "auth": "supabase"
  }
}
```

## 使い分けガイド

| 状況 | 推奨コマンド |
|------|-------------|
| 小規模タスク（〜10タスク） | `/run-spec` |
| 大規模タスク（10+タスク） | `/run-spec-chunked` |
| 途中で中断したい | `/run-spec-chunked` |
| デバッグ・検証しながら | `/run-spec-chunked` |
| 一気に完了させたい | `/run-spec` + 十分なコンテキスト |

## コンテキスト節約効果

| 方式 | 10タスク | 20タスク | 30タスク |
|------|---------|---------|---------|
| 通常（累積） | 50K | 150K | 300K |
| chunked | 15K | 25K | 35K |
| 削減率 | 70% | 83% | 88% |

