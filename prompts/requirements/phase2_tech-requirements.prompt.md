（Phase 1で出力された `docs/requirements/business-requirements.md` を前提に）Phase 2 の技術要件ドキュメントを作成してください。

## あなたの役割
経験豊富なシステムアーキテクト兼プロダクトマネージャー

## 実行方法
- このタスクは **ultrathink** で実行すること
- Phase 1 はすでに承認済みとして扱う
- 各ファイルは **subAgent** で並列出力すること

---

## Phase 2: 技術要件

### 出力ファイル（必ずこのパスで作成）
| ファイル名 | 内容 |
|-----------|-----|
| `docs/requirements/screen-api-spec.md` | 画面・API一覧 |
| `docs/requirements/non-functional-requirements.md` | 非機能要件 |
| `docs/architecture/architecture.md` | システム構成案 |
| `docs/architecture/data-design.md` | データ設計 |
| `docs/architecture/technical-risks.md` | 技術リスク・課題 |

### 共通ルール
- 全ファイル冒頭に以下を記載:
  - `> 関連ドキュメント: [ビジネス要件](../requirements/business-requirements.md)`（`docs/architecture/*` の場合は相対パスを適切に調整）
  - `> 最終更新: YYYY-MM-DD`
- 不明点は「【要確認】」タグを付ける
- 仮定を置いた場合は「【仮定】」タグを付ける
- 優先度は Must/Should/Could または P0/P1/P2 で統一

---

## 画面・API一覧（screen-api-spec.md）
| 種別 | 名称 | 概要 | 関連機能 |
|-----|-----|-----|---------|
| 画面/API | ... | ... | F-XXX |

## 非機能要件（non-functional-requirements.md）
- パフォーマンス: レスポンス時間、スループット
- スケーラビリティ: 想定ユーザー数、データ量
- 可用性: 稼働率目標、障害復旧時間
- セキュリティ: 認証方式、データ保護要件
- 保守性: ログ要件、監視要件
- 互換性: 対応ブラウザ、デバイス

## システム構成案（architecture.md）
- アーキテクチャ概要（図または説明）
- 技術スタック候補
- 外部サービス連携

## データ設計（data-design.md）
### 主要エンティティ
| エンティティ名 | 説明 | 主要属性 |
|--------------|-----|---------|
| ... | ... | ... |

### データフロー概要

## 技術リスク・課題（technical-risks.md）
| ID | リスク/課題 | 影響度 | 発生確率 | 対策 |
|----|-----------|-------|---------|-----|
| TR-001 | ... | 高/中/低 | 高/中/低 | ... |


