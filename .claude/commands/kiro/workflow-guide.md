---
description: Kiroワークフローの使い方ガイド。コマンドの使い所と順序を解説
allowed-tools: Read
---

# Kiro Workflow Guide

Kiroコマンドの使い方、順序、実践的な使い分けを解説します。

## Specification ライフサイクル

| コマンド | 役割 |
|---------|------|
| `/kiro:spec-init` | 新規仕様の初期化。プロジェクト説明から開始 |
| `/kiro:spec-requirements` | EARS形式で要件定義を生成 |
| `/kiro:spec-design` | 技術設計の作成 |
| `/kiro:validate-design` | 技術設計のレビューと検証 |
| `/kiro:spec-tasks` | 実装タスクの分解と生成 |
| `/kiro:spec-impl` | TDD方式でタスク実行 |
| `/kiro:validate-impl` | 実装と要件の整合性検証 |
| `/kiro:spec-status` | 進捗確認 |
| `/kiro:validate-gap` | 既存コードと要件のギャップ分析 |
| `/kiro:steering` | `.kiro/steering/`配下の永続的プロジェクト知識を管理 |
| `/kiro:steering-custom` | 特殊なコンテキスト用のカスタムステアリングドキュメント作成 |

---

## Claude Codeとの比較

| 概念 | Kiro | Claude Code |
|------|------|-------------|
| プロジェクト知識 | `.kiro/steering/` | `CLAUDE.md`, `.claude/rules/` |
| 仕様管理 | 構造化されたspec workflow | 自由形式 |
| タスク分解 | `spec-tasks`で自動化 | 手動または都度依頼 |
| 検証 | 専用validate系コマンド | 明示的なプロンプトで実施 |

---

## コマンドの使い所と順序

### 1. プロジェクト初期セットアップ（1回）

```bash
/kiro:steering
```

プロジェクト全体の知識ベースを構築。技術スタック、コーディング規約、アーキテクチャ方針などを`.kiro/steering/`に永続化。

```bash
/kiro:steering-custom
```

特殊なコンテキスト（例：特定ドメイン固有の業務ルール）があれば追加で作成。

---

### 2. 機能開発フロー（機能ごとに実行）

#### フルフロー（大規模・新規機能）

```bash
/kiro:spec-init <機能説明>
↓
/kiro:spec-requirements <feature-name>
↓
/kiro:spec-design <feature-name>
↓
/kiro:validate-design <feature-name>  # 設計レビュー
↓
/kiro:spec-tasks <feature-name>
↓
/kiro:spec-impl <feature-name>  # または /dev/cc-sdd <feature-name>
↓
/kiro:validate-impl <feature-name>  # 実装検証
```

#### クイックフロー（小規模機能）

```bash
/kiro:spec-init <機能説明>
↓
/kiro:spec-requirements <feature-name>
↓
/kiro:spec-tasks <feature-name>
↓
/dev/cc-sdd <feature-name>
```

---

### 3. 既存コードの改善・拡張

```bash
/kiro:validate-gap  # 現状分析
↓
/kiro:spec-requirements  # 不足分の要件定義
↓
（通常フローへ）
```

---

### 4. 進捗確認（随時）

```bash
/kiro:spec-status  # どのタスクが完了/未完了か確認
```

---

## 実践的な使い分け

| シナリオ | 推奨フロー |
|---------|-----------|
| 新規機能（大規模） | フルフロー: init → requirements → design → validate-design → tasks → impl → validate-impl |
| 新規機能（小規模） | クイックフロー: init → requirements → tasks → impl |
| バグ修正 | validate-gap → 直接修正 |
| リファクタリング | validate-gap → spec-design → impl |
| 既存機能の拡張 | validate-gap → requirements → design → tasks → impl |

---

## Tips

### コンテキスト節約（重要）

Kiro系の開発では、各コマンド完了時に `/clear` を実行することを推奨。

```
1. /kiro:spec-requirements → 完了 → /clear
2. /kiro:spec-design → 完了 → /clear
3. /kiro:spec-tasks → 完了 → /clear
4. /dev/cc-sdd --chunked → Phase完了ごとに /clear
```

#### 推奨ワークフロー（大規模機能）

```
/kiro:spec-init → /clear
/kiro:spec-requirements → /clear
/kiro:spec-design → /clear
/kiro:validate-design → /clear
/kiro:spec-tasks → /clear
/dev/cc-sdd --chunked → 各Phase完了ごとに /clear
/kiro:validate-impl
```

- `/dev/cc-sdd --chunked` で大規模タスクを分割
- **各フェーズ完了時に `/clear` を実行**してから次へ
- 状態ファイルで進捗を永続化（clearしても継続可能）

### 並列実行

- タスクに `(P)` マークがあれば並列実行可能
- `/dev/parallel-build` で並列サブエージェント構築テンプレートを生成

---

## オーケストレーターコマンド

### `/kiro:workflow-runner`

ワークフロー全体をガイドするオーケストレーター。各ステップ完了時に次のコマンドを提示し、`/clear`を促す。

```bash
# 新規開始（フルフロー）
/kiro:workflow-runner my-feature --mode=full

# 新規開始（クイックフロー: design, validate-designをスキップ）
/kiro:workflow-runner my-feature --mode=quick

# 途中から再開
/kiro:workflow-runner my-feature --from=design
```

### `/kiro:next`

現在の進捗を確認し、次に実行すべきコマンドを1行で提示する軽量コマンド。

```bash
# 指定したfeatureの次ステップ
/kiro:next my-feature

# 最新のspecを自動検出
/kiro:next
```

---

## 関連コマンド

- `/dev/cc-sdd` - SDD タスク一気通貫実行
- `/kiro:spec-status` - 進捗確認
- `/dev/parallel-build` - 並列構築テンプレート生成
