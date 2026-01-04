---
name: kiro-batch-impl
description: Kiro specの実装タスクを一括実行。tasks.mdの全タスクをPhase順に自動実行する。spec実装を一気に進める、タスクを連続実行する場合に使用。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, TodoWrite
---

# Kiro Spec タスク一括実行スキル

## 概要

`.kiro/specs/{feature}/tasks.md` に定義された実装タスクを Phase 順に一括実行する。

## 使用方法

```
/kiro-batch-impl {feature-name}
```

**例:**
```
/kiro-batch-impl api-backend-generate
```

## 実行フロー

### Step 1: コンテキスト読み込み

1. `.kiro/specs/{feature}/spec.json` を読み込み、phase が `tasks-generated` であることを確認
2. `.kiro/specs/{feature}/tasks.md` を読み込み、タスク一覧を取得
3. `.kiro/specs/{feature}/requirements.md` と `design.md` を読み込み、実装コンテキストを取得
4. `.kiro/steering/` 配下の全ファイルを読み込み、プロジェクトコンテキストを取得

### Step 2: Phase 分析

tasks.md のタスクを以下の基準で Phase に分類:

| Phase | 特徴 | 実行方式 |
|-------|------|----------|
| Foundation | 前提条件、基盤構築 | 直列実行 |
| Analysis | ドキュメント解析、データ抽出 | 直列実行 |
| Detection | リソース検出、選択UI | 直列実行 |
| Generation | コード生成（(P)マーカー付き） | **並列実行** |
| Integration | 競合処理、オーケストレーション | 直列実行 |
| Testing | テスト実装 | 直列実行 |

**並列実行の判定:**
- タスク番号に `(P)` マーカーがあるタスクは並列実行可能
- 並列タスクは Task tool で同時に subagent を起動

### Step 3: Phase 順次実行

```
Phase 1 (Foundation) 完了
    ↓
Phase 2 (Analysis) 完了
    ↓
Phase 3 (Detection) 完了
    ↓
Phase 4 (Generation) 完了 ← 並列実行
    ↓
Phase 5 (Integration) 完了
    ↓
Phase 6 (Testing) 完了
    ↓
全タスク完了
```

**各タスク実行時:**
1. TodoWrite でタスクを `in_progress` にマーク
2. タスク内容を実装
3. 実装完了後、tasks.md のチェックボックスを `[x]` に更新
4. TodoWrite でタスクを `completed` にマーク
5. 次のタスクへ進む

### Step 4: エラーハンドリング

- **エラー発生時**: 即座に停止し、エラー内容を報告
- **復旧方法**: エラーを修正後、同じコマンドで再実行（完了済みタスクはスキップ）

## 実行オプション

### 基本実行（全タスク）
```
/kiro-batch-impl {feature}
```

### Phase 指定実行
```
/kiro-batch-impl {feature} --phase=generation
```

### タスク範囲指定
```
/kiro-batch-impl {feature} --from=4.1 --to=6.1
```

### ドライラン（実行せず計画のみ表示）
```
/kiro-batch-impl {feature} --dry-run
```

## 実装時の注意事項

### 並列実行時のコンテキスト

並列タスク（Generation Phase）では、各 subagent に以下を渡す:

```typescript
const context = {
  resource: Resource,           // 対象リソース情報
  architecture: ArchitectureData, // アーキテクチャ情報
  functionSpecs: FunctionSpec[], // 機能仕様
  conventions: CodeConventions,  // コード規約
  outputDir: string,            // 出力先ディレクトリ
};
```

### tasks.md 更新ルール

タスク完了時、以下の形式で更新:

```markdown
# Before
- [ ] 4.1 (P) 型定義ファイル生成の実装

# After
- [x] 4.1 (P) 型定義ファイル生成の実装
```

### spec.json 更新

全タスク完了後:

```json
{
  "phase": "implementation-complete",
  "approvals": {
    "tasks": {
      "generated": true,
      "approved": true
    }
  },
  "ready_for_implementation": false
}
```

## Phase 構成例（api-backend-generate）

```
Phase 1 - Foundation:
  1.1 前提条件検証ロジックの実装

Phase 2 - Analysis:
  2.1 アーキテクチャ文書解析の実装
  2.2 機能仕様書解析の実装

Phase 3 - Detection:
  3.1 リソース自動特定の実装
  3.2 対話的リソース選択の実装

Phase 4 - Generation (並列):
  4.1 (P) 型定義ファイル生成の実装
  4.2 (P) Zodスキーマファイル生成の実装
  5.1 (P) Server Actionsファイル生成の実装
  5.2 (P) API Routesファイル生成の実装
  6.1 (P) TanStack Queryフック生成の実装

Phase 5 - Integration:
  7.1 既存ファイル競合処理の実装
  7.2 並列生成オーケストレーションの実装
  8.1 生成コードの規約準拠確認

Phase 6 - Testing:
  9.1 ドキュメント解析のテスト
  9.2 生成コードの品質テスト
  9.3 E2Eスキル実行テスト
```

## 完了条件

- 全タスクのチェックボックスが `[x]` になっている
- spec.json の phase が `implementation-complete` になっている
- エラーなく全 Phase が完了している

## トラブルシューティング

### コンテキスト溢れが発生した場合

1. `/clear` でコンテキストをクリア
2. 同じコマンドで再実行（完了済みタスクは自動スキップ）

### 特定タスクで失敗が続く場

1. `--from={task-id}` オプションで該当タスクから再開えｂで
2. または手動で `/kiro:spec-impl {feature} {task-id}` を実行
