# Research & Design Decisions

## Summary
- **Feature**: api-backend-generate
- **Discovery Scope**: Extension（既存スキル定義の構造化・詳細設計）
- **Key Findings**:
  - 既存SKILL.mdに詳細な手順書が定義済み。アーキテクチャ設計で構造化が必要
  - 型定義・Zodスキーマ・Server Actionsのパターンが確立済み（card.ts, validations/card.ts参照）
  - Task toolによる並列実行がスキルの中核機能。subagent間の依存関係なしで独立実行可能

## Research Log

### Claude Code Task Tool並列実行パターン
- **Context**: 複数ファイル生成を効率化するための並列実行方式
- **Sources Consulted**: Claude Code内部ドキュメント、既存skill.md
- **Findings**:
  - `subagent_type: general-purpose` で汎用サブエージェントを起動
  - 単一メッセージ内で複数Task呼び出しにより並列実行
  - 各subagentは独立したコンテキストを持つため、必要情報をすべてpromptに含める必要あり
  - `model: haiku` で高速・低コスト実行が可能
- **Implications**: 5種類のファイル生成を同時実行可能。リソース数×5のsubagent起動

### 既存コードパターン分析
- **Context**: 生成コードが既存パターンに準拠するための調査
- **Sources Consulted**: `apps/web/src/types/card.ts`, `apps/web/src/validations/card.ts`, `apps/web/src/actions/auth.ts`
- **Findings**:
  - **型定義**: camelCase（`userId`, `createdAt`）、named export、`ListResponse<T>` ジェネリクス
  - **Zodスキーマ**: 日本語エラーメッセージ、`.partial()` で更新スキーマ生成、型推論エクスポート
  - **Server Actions**: `'use server'`, `createClient()` from `@/lib/supabase/server`, `revalidatePath()`
  - **API Routes**: `NextRequest/NextResponse`, Bearer Token認証, 標準エラー形式
- **Implications**: 生成テンプレートはこれらのパターンを厳守する必要あり

### ドキュメント構造解析アルゴリズム
- **Context**: architecture.mdからリソース抽出の実現方式
- **Sources Consulted**: `docs/requirements/architecture.md`, `docs/requirements/functions/_index.md`
- **Findings**:
  - ER図はMermaid `erDiagram` 記法。エンティティ名は `users`, `cards`, `tags` 形式
  - テーブル定義セクションにカラム詳細あり
  - 機能仕様は `F-XXX-*.md` 形式でカテゴリ分類（auth, card, tag, review, stats, sync）
- **Implications**: 正規表現でER図からエンティティ抽出、カテゴリ名からリソース推定

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| パイプライン | 解析→特定→選択→生成の直列処理 | シンプル、デバッグ容易 | 生成フェーズが遅い | 現状のSKILL.mdに近い |
| 並列コーディネータ | 中央オーケストレータが並列subagentを管理 | 高速、スケーラブル | 複雑性増加 | **採用** |
| イベント駆動 | 各フェーズ完了イベントで次フェーズ起動 | 疎結合 | オーバーヘッド大 | 過剰設計 |

## Design Decisions

### Decision: 並列生成のスコープ
- **Context**: どの粒度で並列化するか
- **Alternatives Considered**:
  1. リソース単位（cards全ファイル完了後にtags開始）
  2. ファイル種別単位（全リソースの型定義→全リソースのZod→...）
  3. ファイル単位（全ファイルを同時生成）
- **Selected Approach**: ファイル単位の完全並列
- **Rationale**: 各ファイルは他ファイルに依存しない。subagent間の同期不要
- **Trade-offs**: subagent数増加（3リソース×5ファイル=15並列）、コンテキスト重複
- **Follow-up**: 大規模プロジェクトでのsubagent上限確認

### Decision: 既存ファイル競合処理
- **Context**: 既存ファイルが存在する場合の対応方式
- **Alternatives Considered**:
  1. 常に上書き
  2. 常にスキップ
  3. ユーザー確認
  4. AST解析によるマージ
- **Selected Approach**: ユーザー確認（上書き/マージ/スキップ選択）+ `--force` オプション
- **Rationale**: 安全性と柔軟性のバランス
- **Trade-offs**: マージは単純な追記のみ（AST解析は複雑すぎる）
- **Follow-up**: マージ時の重複検出ロジック詳細設計

### Decision: コード生成テンプレート管理
- **Context**: 生成コードの品質担保方式
- **Alternatives Considered**:
  1. SKILL.md内に埋め込み
  2. 別ファイルとしてテンプレート管理
  3. subagentへの詳細プロンプトのみ
- **Selected Approach**: SKILL.md内のコード例をリファレンスとし、subagentプロンプトで指示
- **Rationale**: 既存SKILL.mdに良質なコード例あり。テンプレートファイル管理は過剰
- **Trade-offs**: プロンプト長増加、生成品質がsubagent解釈に依存
- **Follow-up**: 生成結果の品質検証テスト追加

## Risks & Mitigations
- **リスク1**: ER図パースの精度 → Mermaid構文の正規表現パターンを複数用意
- **リスク2**: subagent生成コードの品質ばらつき → 既存パターンを詳細にプロンプト化
- **リスク3**: 大規模プロジェクトでの実行時間 → 進捗表示、部分実行オプション

## References
- [Claude Code Task Tool](https://docs.anthropic.com/claude-code) - subagent並列実行パターン
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [TanStack Query](https://tanstack.com/query/latest/docs/react/overview) - useQuery/useMutationパターン
- [Zod Documentation](https://zod.dev/) - スキーマ定義パターン
