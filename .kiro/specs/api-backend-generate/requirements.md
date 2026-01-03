# Requirements Document

## Introduction

本ドキュメントは、機能仕様書からAPIバックエンドコードを一括生成するClaudeスキル「api-backend-generate」の要件を定義する。

このスキルは、`docs/requirements/`配下のアーキテクチャ文書と機能仕様書を解析し、型定義・Zodスキーマ・Server Actions・API Routes・TanStack Queryフックを**並列で自動生成**する。Next.js + Supabase構成のプロジェクトで汎用的に使用可能。

## Requirements

### Requirement 1: ドキュメント解析

**Objective:** As a 開発者, I want スキルがプロジェクトのドキュメント構造を自動検出して解析する, so that 手動でパスを指定せずにコード生成を開始できる

#### Acceptance Criteria

1. When スキルが実行されたとき, the api-backend-generate skill shall `docs/requirements/architecture.md`または`docs/specs/architecture.md`を検索してアーキテクチャ文書を読み込む
2. When アーキテクチャ文書が見つかったとき, the api-backend-generate skill shall DB設計（テーブル定義、RLS）、API設計（データフロー、認証方式）、ディレクトリ構成を抽出する
3. When スキルが実行されたとき, the api-backend-generate skill shall `docs/requirements/functions/_index.md`または`docs/specs/features/index.md`を検索して機能一覧を読み込む
4. When 機能一覧が見つかったとき, the api-backend-generate skill shall 各機能仕様ファイル（F-XXX-*.mdまたは[feature-name].md）を読み込み、入力/出力定義とビジネスルールを抽出する
5. If アーキテクチャ文書が見つからないとき, then the api-backend-generate skill shall エラーメッセージを表示し、`--docs-path`オプションでのパス指定を促す
6. If 機能仕様ファイルが存在しないとき, then the api-backend-generate skill shall 警告を表示し、アーキテクチャ文書のみからリソースを推定する

### Requirement 2: リソース自動特定

**Objective:** As a 開発者, I want ドキュメントからAPIリソース（エンティティ）を自動で特定してもらいたい, so that 生成対象を手動で列挙する必要がない

#### Acceptance Criteria

1. When ドキュメント解析が完了したとき, the api-backend-generate skill shall アーキテクチャ文書のER図・テーブル定義からエンティティ名を抽出する
2. When 機能仕様が存在するとき, the api-backend-generate skill shall 機能カテゴリと各仕様のデータモデルからリソースを補完する
3. When リソース一覧が確定したとき, the api-backend-generate skill shall 各リソースについて（リソース名、説明、関連機能）の一覧を表示する
4. The api-backend-generate skill shall リソース名をkebab-case（例: `cards`, `study-sessions`）で正規化する

### Requirement 3: 対話的リソース選択

**Objective:** As a 開発者, I want 生成するリソースを選択できる, so that 必要なコードのみを生成できる

#### Acceptance Criteria

1. When 引数なしでスキルが実行されたとき, the api-backend-generate skill shall 検出されたリソース一覧を番号付きで表示し、選択を促す
2. When ユーザーが番号（例: `1,2`）を入力したとき, the api-backend-generate skill shall 指定されたリソースのみを生成対象とする
3. When ユーザーが`all`と入力したとき, the api-backend-generate skill shall 全リソースを生成対象とする
4. When `[resource]`引数付きでスキルが実行されたとき, the api-backend-generate skill shall 対話をスキップし、指定リソースを直接生成対象とする
5. When `--all`オプション付きでスキルが実行されたとき, the api-backend-generate skill shall 対話をスキップし、全リソースを生成対象とする
6. If 指定されたリソースが検出一覧に存在しないとき, then the api-backend-generate skill shall エラーを表示し、有効なリソース名を提示する

### Requirement 4: 型定義ファイル生成

**Objective:** As a 開発者, I want リソースのTypeScript型定義を自動生成してもらいたい, so that 型安全なコードを素早く書き始められる

#### Acceptance Criteria

1. When リソースが生成対象に含まれるとき, the api-backend-generate skill shall `src/types/[resource].ts`に型定義ファイルを生成する
2. The api-backend-generate skill shall エンティティ型（例: `Card`, `Tag`）をnamed exportで定義する
3. The api-backend-generate skill shall APIレスポンス型（例: `CardsResponse`）をnamed exportで定義する
4. The api-backend-generate skill shall 入力型（例: `CreateCardInput`, `UpdateCardInput`）をnamed exportで定義する
5. The api-backend-generate skill shall アーキテクチャ文書のテーブル定義と機能仕様の入出力定義に基づいてフィールドを決定する
6. The api-backend-generate skill shall default exportを使用しない

### Requirement 5: Zodスキーマファイル生成

**Objective:** As a 開発者, I want 入力バリデーション用Zodスキーマを自動生成してもらいたい, so that フォーム・APIのバリデーションを統一できる

#### Acceptance Criteria

1. When リソースが生成対象に含まれるとき, the api-backend-generate skill shall `src/validations/[resource].ts`にZodスキーマファイルを生成する
2. The api-backend-generate skill shall 作成用スキーマ（例: `createCardSchema`）を定義する
3. The api-backend-generate skill shall 更新用スキーマ（例: `updateCardSchema`）を定義する（全フィールドoptional）
4. The api-backend-generate skill shall クエリパラメータ用スキーマ（例: `cardQuerySchema`）を定義する（フィルタ・ページネーション対応）
5. The api-backend-generate skill shall 機能仕様の入力バリデーション要件（最大文字数、必須フィールド等）を反映する

### Requirement 6: Server Actionsファイル生成

**Objective:** As a 開発者, I want Server Actionsを自動生成してもらいたい, so that Web側のミューテーションを素早く実装できる

#### Acceptance Criteria

1. When リソースが生成対象に含まれるとき, the api-backend-generate skill shall `src/actions/[resource].ts`にServer Actionsファイルを生成する
2. The api-backend-generate skill shall ファイル先頭に`'use server'`ディレクティブを配置する
3. The api-backend-generate skill shall 各アクション関数に認証チェック（`supabase.auth.getUser()`）を含める
4. The api-backend-generate skill shall Zodスキーマによる入力バリデーションを含める
5. The api-backend-generate skill shall Supabaseクライアントを使用したDB操作を含める
6. The api-backend-generate skill shall 成功時に`revalidatePath()`を呼び出す
7. The api-backend-generate skill shall CRUD操作（create, update, delete, getById, getAll）に対応する関数を生成する
8. The api-backend-generate skill shall 機能仕様に特殊な操作（例: 今日の復習カード取得）がある場合、追加の関数を生成する

### Requirement 7: API Routesファイル生成

**Objective:** As a 開発者, I want Mobile用REST APIを自動生成してもらいたい, so that Expoアプリからデータアクセスできる

#### Acceptance Criteria

1. When リソースが生成対象に含まれるとき, the api-backend-generate skill shall `src/app/api/[resource]/route.ts`（一覧・作成）を生成する
2. When リソースが生成対象に含まれるとき, the api-backend-generate skill shall `src/app/api/[resource]/[id]/route.ts`（詳細・更新・削除）を生成する
3. The api-backend-generate skill shall Bearer Token認証（`Authorization: Bearer {token}`）を実装する
4. The api-backend-generate skill shall HTTPメソッドに応じたハンドラ（GET, POST, PATCH, DELETE）を実装する
5. The api-backend-generate skill shall エラーレスポンスを標準形式（`{ error: { code, message } }`）で返す
6. The api-backend-generate skill shall 成功レスポンスを標準形式（一覧: `{ data, pagination }`, 単体: `{ id, ... }`）で返す
7. When 機能仕様に日付フィルタ機能があるとき, the api-backend-generate skill shall `src/app/api/[resource]/today/route.ts`を追加生成する
8. When 機能仕様に検索機能があるとき, the api-backend-generate skill shall `src/app/api/[resource]/search/route.ts`を追加生成する

### Requirement 8: TanStack Queryフック生成

**Objective:** As a 開発者, I want TanStack Queryフックを自動生成してもらいたい, so that データフェッチ・ミューテーションを簡潔に実装できる

#### Acceptance Criteria

1. When リソースが生成対象に含まれるとき, the api-backend-generate skill shall `src/hooks/use[Resource].ts`にフックファイルを生成する
2. The api-backend-generate skill shall クエリキー定数（例: `cardKeys`）を定義する
3. The api-backend-generate skill shall 一覧取得フック（例: `useCards`）を`useQuery`で実装する
4. The api-backend-generate skill shall 詳細取得フック（例: `useCard`）を`useQuery`で実装する
5. The api-backend-generate skill shall 作成フック（例: `useCreateCard`）を`useMutation`で実装し、成功時に一覧キャッシュを無効化する
6. The api-backend-generate skill shall 更新フック（例: `useUpdateCard`）を`useMutation`で実装する
7. The api-backend-generate skill shall 削除フック（例: `useDeleteCard`）を`useMutation`で実装する
8. The api-backend-generate skill shall Server Actionsを`mutationFn`として使用する形式で実装する

### Requirement 9: 並列生成実行

**Objective:** As a 開発者, I want 複数ファイルを並列で生成してもらいたい, so that 生成時間を短縮できる

#### Acceptance Criteria

1. When 生成対象が確定したとき, the api-backend-generate skill shall Task tool（subagent_type: general-purpose）を使用して各ファイル生成を並列実行する
2. The api-backend-generate skill shall 同一リソースの5種類のファイル（型定義、Zodスキーマ、Server Actions、API Routes、フック）を同時に生成する
3. When 複数リソースが対象のとき, the api-backend-generate skill shall リソースごとの生成も並列実行する
4. The api-backend-generate skill shall 各subagentに必要なコンテキスト（アーキテクチャ、機能仕様、出力パス、コード規約）を渡す
5. When 全subagentが完了したとき, the api-backend-generate skill shall 生成結果のサマリー（成功/失敗、ファイルパス一覧）を表示する

### Requirement 10: 既存ファイル競合処理

**Objective:** As a 開発者, I want 既存ファイルとの競合を適切に処理してもらいたい, so that 意図しない上書きを防げる

#### Acceptance Criteria

1. When 生成対象パスに既存ファイルが存在するとき, the api-backend-generate skill shall ユーザーに処理方法（上書き、マージ、スキップ）を確認する
2. When ユーザーが「上書き」を選択したとき, the api-backend-generate skill shall 既存ファイルを完全に置き換える
3. When ユーザーが「マージ」を選択したとき, the api-backend-generate skill shall 既存の型・関数を保持しつつ、不足分を追加する
4. When ユーザーが「スキップ」を選択したとき, the api-backend-generate skill shall そのファイルの生成をスキップする
5. When `--force`オプションが指定されたとき, the api-backend-generate skill shall 確認なしで上書きする

### Requirement 11: コード規約準拠

**Objective:** As a 開発者, I want 生成コードがプロジェクトの規約に準拠してもらいたい, so that 追加の修正なしで使用できる

#### Acceptance Criteria

1. The api-backend-generate skill shall Named exportのみを使用する（default export禁止）
2. The api-backend-generate skill shall `any`型を使用しない（`unknown`と型ガードを使用）
3. The api-backend-generate skill shall セミコロンを省略しない
4. The api-backend-generate skill shall パスエイリアス（`@/`）を使用する（相対パス禁止）
5. The api-backend-generate skill shall import順序を外部ライブラリ→内部モジュールの順にする
6. The api-backend-generate skill shall Server Actionsに認証チェックを必ず含める
7. The api-backend-generate skill shall API Routesに認証・エラーハンドリングを必ず含める

### Requirement 12: 前提条件検証

**Objective:** As a 開発者, I want 生成に必要な前提条件を事前検証してもらいたい, so that 生成途中でエラーが発生しない

#### Acceptance Criteria

1. When スキルが実行されたとき, the api-backend-generate skill shall `src/lib/supabase/server.ts`の存在を確認する
2. If Supabaseクライアントファイルが存在しないとき, then the api-backend-generate skill shall エラーを表示し、先にSupabase設定を行うよう促す
3. When スキルが実行されたとき, the api-backend-generate skill shall 必要なディレクトリ（`src/types/`, `src/validations/`, `src/actions/`, `src/hooks/`, `src/app/api/`）の存在を確認する
4. If 必要ディレクトリが存在しないとき, then the api-backend-generate skill shall 自動的にディレクトリを作成する
5. When スキルが実行されたとき, the api-backend-generate skill shall package.jsonの依存関係（zod, @tanstack/react-query）を確認する
6. If 必要な依存関係が不足しているとき, then the api-backend-generate skill shall 警告を表示し、インストールコマンドを提示する
