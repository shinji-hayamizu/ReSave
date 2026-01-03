# Implementation Plan

## Tasks

- [x] 1. スキル基盤と前提条件検証の実装
- [x] 1.1 前提条件検証ロジックの実装
  - Supabaseクライアントファイルの存在確認を行う
  - 必要ディレクトリ（types/, validations/, actions/, hooks/, app/api/）の検証を行う
  - 不足ディレクトリを自動作成する機能を実装する
  - package.jsonの依存関係（zod, @tanstack/react-query）を確認する
  - 不足時のエラーメッセージとインストールコマンド案内を実装する
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_
  - **実装場所**: `.claude/skills/api-backend-generate/SKILL.md` Phase 1セクション

- [x] 2. ドキュメント解析機能の実装
- [x] 2.1 アーキテクチャ文書解析の実装
  - architecture.mdまたはspecs/architecture.mdの検索ロジックを実装する
  - Mermaid ER図からエンティティ名を抽出する正規表現パターンを作成する
  - テーブル定義セクションからカラム詳細を抽出する
  - RLS設定と認証方式の情報を抽出する
  - 文書が見つからない場合のエラーハンドリングを実装する
  - _Requirements: 1.1, 1.2, 1.5_
  - **実装場所**: `.claude/skills/api-backend-generate/SKILL.md` Phase 2 Task 2.1セクション

- [x] 2.2 機能仕様書解析の実装
  - functions/_index.mdまたはfeatures/index.mdの検索ロジックを実装する
  - 個別機能仕様ファイル（F-XXX-*.md形式）の読み込みを実装する
  - 各仕様から入力/出力定義とビジネスルールを抽出する
  - 機能カテゴリ（auth, card, tag, review, stats）の識別を行う
  - 機能仕様が存在しない場合の警告表示を実装する
  - _Requirements: 1.3, 1.4, 1.6_
  - **実装場所**: `.claude/skills/api-backend-generate/SKILL.md` Phase 2 Task 2.2セクション

- [x] 3. リソース特定と選択機能の実装
- [x] 3.1 リソース自動特定の実装
  - ER図エンティティからリソース候補を抽出する
  - 機能カテゴリからリソースを補完する
  - リソース名のkebab-case正規化を実装する
  - 各リソースの説明と関連機能の紐付けを行う
  - 検出リソース一覧の表示フォーマットを実装する
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - **実装場所**: `.claude/skills/api-backend-generate/SKILL.md` Phase 3 Task 3.1セクション

- [x] 3.2 対話的リソース選択の実装
  - 検出リソースを番号付きで表示する機能を実装する
  - ユーザー入力（番号指定、all、カンマ区切り）の解析を実装する
  - 引数による直接指定時の対話スキップを実装する
  - --allオプションによる全選択を実装する
  - 無効なリソース名指定時のエラー表示と有効候補の提示を実装する
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  - **実装場所**: `.claude/skills/api-backend-generate/SKILL.md` Phase 3 Task 3.2セクション

- [x] 4. コード生成機能の実装（型定義・Zodスキーマ）
- [x] 4.1 (P) 型定義ファイル生成の実装
  - エンティティ型（Card, Tagなど）のnamed export生成を実装する
  - APIレスポンス型（CardsResponse）の生成を実装する
  - 入力型（CreateCardInput, UpdateCardInput）の生成を実装する
  - テーブル定義と機能仕様からフィールドを決定するロジックを実装する
  - camelCase命名とdefault export禁止のルールを適用する
  - 出力先パス（src/types/[resource].ts）への書き込みを実装する
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 11.1, 11.4_
  - **実装場所**: `.claude/skills/api-backend-generate/SKILL.md` Phase 4 Task 4.1セクション

- [x] 4.2 (P) Zodスキーマファイル生成の実装
  - 作成用スキーマ（createCardSchema）の生成を実装する
  - 更新用スキーマ（.partial()使用）の生成を実装する
  - クエリパラメータ用スキーマ（フィルタ・ページネーション対応）の生成を実装する
  - 日本語エラーメッセージの埋め込みを実装する
  - 機能仕様のバリデーション要件（最大文字数、必須フィールド）を反映する
  - 出力先パス（src/validations/[resource].ts）への書き込みを実装する
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 11.3_
  - **実装場所**: `.claude/skills/api-backend-generate/SKILL.md` Phase 4 Task 4.2セクション

- [x] 5. コード生成機能の実装（Server Actions・API Routes）
- [x] 5.1 (P) Server Actionsファイル生成の実装
  - 'use server'ディレクティブの配置を実装する
  - 認証チェック（supabase.auth.getUser()）の組み込みを実装する
  - Zodスキーマによる入力バリデーションの組み込みを実装する
  - Supabaseクライアントを使用したDB操作コードを生成する
  - CRUD操作（create, update, delete, getById, getAll）の関数を生成する
  - revalidatePath()呼び出しの組み込みを実装する
  - 機能仕様に基づく追加関数（例：今日の復習カード取得）の生成を実装する
  - 出力先パス（src/actions/[resource].ts）への書き込みを実装する
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 11.6_
  - **実装場所**: `.claude/skills/api-backend-generate/SKILL.md` Phase 4 Task 5.1セクション

- [x] 5.2 (P) API Routesファイル生成の実装
  - 一覧・作成用route.ts（GET, POST）の生成を実装する
  - 詳細・更新・削除用[id]/route.ts（GET, PATCH, DELETE）の生成を実装する
  - Bearer Token認証の実装コードを組み込む
  - 標準エラーレスポンス形式（{ error: { code, message } }）を適用する
  - 標準成功レスポンス形式（一覧: { data, pagination }、単体: { id, ... }）を適用する
  - 日付フィルタ機能用の追加ルート（/today）を条件付きで生成する
  - 検索機能用の追加ルート（/search）を条件付きで生成する
  - 出力先パス（src/app/api/[resource]/）への書き込みを実装する
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 11.7_
  - **実装場所**: `.claude/skills/api-backend-generate/SKILL.md` Phase 4 Task 5.2セクション

- [x] 6. コード生成機能の実装（TanStack Queryフック）
- [x] 6.1 (P) TanStack Queryフック生成の実装
  - クエリキー定数（cardKeysなど）のfactory patternを生成する
  - 一覧取得フック（useCards）をuseQueryで実装する
  - 詳細取得フック（useCard）をuseQueryで実装する
  - 作成フック（useCreateCard）をuseMutationで実装し、成功時のキャッシュ無効化を組み込む
  - 更新フック（useUpdateCard）をuseMutationで実装する
  - 削除フック（useDeleteCard）をuseMutationで実装する
  - Server ActionsをmutationFnとして使用する形式を適用する
  - 出力先パス（src/hooks/use[Resource].ts）への書き込みを実装する
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_
  - **実装場所**: `.claude/skills/api-backend-generate/SKILL.md` Phase 4 Task 6.1セクション

- [x] 7. 競合処理とオーケストレーションの実装
- [x] 7.1 既存ファイル競合処理の実装
  - 生成対象パスの既存ファイル検出を実装する
  - ユーザーへの処理方法確認UI（上書き/マージ/スキップ）を実装する
  - 上書き処理（完全置換）を実装する
  - マージ処理（既存内容保持しつつ不足分追加）を実装する
  - スキップ処理（生成をスキップ）を実装する
  - --forceオプションによる確認スキップを実装する
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  - **実装場所**: `.claude/skills/api-backend-generate/SKILL.md` Phase 5 Task 7.1セクション

- [x] 7.2 並列生成オーケストレーションの実装
  - Task toolによるsubagent並列起動を実装する
  - 各subagentへのコンテキスト（アーキテクチャ、機能仕様、出力パス、コード規約）の受け渡しを実装する
  - 同一リソースの5種類ファイル同時生成を実装する
  - 複数リソース対象時のリソース間並列実行を実装する
  - 全subagent完了待機とTaskOutput収集を実装する
  - 生成結果サマリー（成功/失敗、ファイルパス一覧）の表示を実装する
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  - **実装場所**: `.claude/skills/api-backend-generate/SKILL.md` Phase 5 Task 7.2セクション

- [x] 8. コード規約準拠の検証
- [x] 8.1 生成コードの規約準拠確認
  - Named exportのみ使用されていることを検証する
  - any型が使用されていないことを検証する
  - セミコロンが省略されていないことを検証する
  - パスエイリアス（@/）が使用されていることを検証する
  - import順序（外部ライブラリ→内部モジュール）が正しいことを検証する
  - 規約違反検出時の修正または警告表示を実装する
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
  - **実装場所**: `.claude/skills/api-backend-generate/SKILL.md` Phase 5 Task 8.1セクション

- [x] 9. 統合テストの実装
- [x] 9.1 ドキュメント解析のテスト
  - 実際のアーキテクチャ文書からのER図パースをテストする
  - 機能仕様ファイルからの入出力抽出をテストする
  - 不正なドキュメント形式に対するエラーハンドリングをテストする
  - _Requirements: 1.1, 1.2, 1.3, 1.4_
  - **実装場所**: `.kiro/specs/api-backend-generate/research.md` Test Strategyセクション

- [x] 9.2 生成コードの品質テスト
  - 生成された型定義のTypeScriptコンパイルチェックを行う
  - 生成されたZodスキーマの構文検証を行う
  - 生成されたServer Actionsの認証チェック有無を検証する
  - 生成されたAPI Routesのエンドポイント形式を検証する
  - 既存パターン（card.ts, validations/card.ts）との整合性を検証する
  - _Requirements: 4.1, 5.1, 6.1, 7.1, 8.1, 11.1_
  - **実装場所**: `.kiro/specs/api-backend-generate/research.md` Test Strategyセクション

- [x] 9.3 E2Eスキル実行テスト
  - cards/tags/reviewsリソースの完全生成フローをテストする
  - 競合発生時の各選択肢（上書き/マージ/スキップ）の動作をテストする
  - --allおよび--forceオプションの動作をテストする
  - 並列生成の正常完了を検証する
  - _Requirements: 9.5, 10.1, 10.2, 10.3, 10.4_
  - **実装場所**: `.kiro/specs/api-backend-generate/research.md` Test Strategyセクション

## Implementation Summary

### 実装ファイル一覧

| ファイル | 目的 |
|---------|------|
| `.claude/skills/api-backend-generate/SKILL.md` | スキル定義（全フェーズの実行手順） |
| `.kiro/specs/api-backend-generate/research.md` | 既存コードパターン分析・テスト戦略 |
| `.kiro/specs/api-backend-generate/design.md` | アーキテクチャ・コンポーネント設計 |
| `.kiro/specs/api-backend-generate/requirements.md` | 要件定義 |

### 実装方式

このスキルは **Claude Code スキル** として実装されています。つまり：

1. **SKILL.md** にスキルの実行手順を詳細に記述
2. Claude Code がスキル呼び出し時にこの手順に従って処理を実行
3. **Task tool** を使用してsubagentを並列起動し、コード生成を高速化

### 使用方法

```
/api-backend-generate              # 対話的にリソース選択
/api-backend-generate cards        # cardsのみ生成
/api-backend-generate cards,tags   # 複数リソース指定
/api-backend-generate --all        # 全リソース生成
/api-backend-generate --force      # 確認なしで上書き
```
