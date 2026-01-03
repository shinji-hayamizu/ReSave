# SDD (Spec-Driven Development) タスク実行

Kiro 形式の spec タスクを一気通貫で実行します。

## 使用方法

```
/dev/cc-sdd <spec-name>
/dev/cc-sdd <spec-name> --from <task-id>
/dev/cc-sdd <spec-name> --chunked
```

## 引数

$ARGUMENTS

## 実行モード

### 通常モード（デフォルト）

1セッションで全タスク実行。小〜中規模向け。

```
/dev/cc-sdd api-backend-generate
```

### 分割モード（--chunked）

フェーズごとに独立実行。大規模・コンテキスト節約向け。

```
/dev/cc-sdd api-backend-generate --chunked
```

### 再開モード（--from）

指定タスクから実行再開。

```
/dev/cc-sdd api-backend-generate --from 4.1
```

## 実行手順

### Step 1: Spec 検索

以下のパスを順に検索:
1. `.kiro/specs/{spec-name}/tasks.md`
2. `.claude/specs/{spec-name}/tasks.md`

見つからない場合はエラー表示と利用可能な spec 一覧を表示。

### Step 2: タスク解析

tasks.md から抽出:
- `- [ ] X.Y タスク名` → 未完了タスク
- `- [x] X.Y タスク名` → 完了済みタスク
- `(P)` マーク → 並列実行可能
- インデント配下 → 実行詳細
- `_Requirements: ..._` → 関連要件

### Step 3: フェーズ構成

同一メジャー番号でグループ化:

```
Phase 1: タスク 1.1
Phase 2: タスク 2.1, 2.2
Phase 3: タスク 3.1, 3.2
Phase 4: タスク 4.1(P), 4.2(P), 5.1(P), 5.2(P), 6.1(P) ← 並列
Phase 5: タスク 7.1, 7.2, 8.1
Phase 6: タスク 9.1, 9.2, 9.3
```

### Step 4: 実行

#### 通常タスク
順次実行し、各タスク完了後に進捗表示。

#### 並列タスク（(P)マーク）
可能な限り同時実行し、全完了を待機。

### Step 5: 進捗管理

`.claude/state/{spec-name}-progress.json` に記録:
- 完了タスク
- 生成ファイル
- エラー履歴

### Step 6: エラー時

```
❌ Task 4.2 失敗: {エラー内容}

再開コマンド:
/dev/cc-sdd {spec-name} --from 4.2
```

## 補足

### 関連ファイル

実行時に自動読み込み:
- `requirements.md` - 要件定義
- `design.md` - 設計仕様（あれば）
- `CLAUDE.md` - プロジェクト規約

### コンテキスト節約Tips

- `--chunked` で大規模タスクを分割
- 各フェーズ完了時に新規チャットで継続
- 状態ファイルで進捗を永続化

## 例

```bash
# api-backend-generate を通常実行
/dev/cc-sdd api-backend-generate

# コンテキスト節約モードで実行
/dev/cc-sdd api-backend-generate --chunked

# タスク 5.1 から再開
/dev/cc-sdd api-backend-generate --from 5.1

# テストタスクのみ実行
/dev/cc-sdd api-backend-generate --only 9.1,9.2,9.3
```
