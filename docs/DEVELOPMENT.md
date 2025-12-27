# 開発ガイド

コーディング規約については [CODING_STANDARDS.md](CODING_STANDARDS.md) を参照してください。

---

## 開発環境

### 前提条件
- Docker & Docker Compose
- Git

### Dockerベース開発
本プロジェクトはDockerコンテナ内で開発を行います。ローカルにNode.jsをインストールする必要はありません。

### 開発コマンド
すべてのコマンドはDockerコンテナ内で実行されます：

```bash
# テスト実行
docker-compose exec develop sh -c "npm test"

# テスト（ウォッチモード）
docker-compose exec develop sh -c "npm run test:watch"

# カバレッジ確認
docker-compose exec develop sh -c "npm test -- --coverage"

# リント実行
docker-compose exec develop sh -c "npm run lint"

# 依存関係の追加
docker-compose exec develop sh -c "npm install <package-name>"

# 評価システムの実行（プロジェクトルートから）
./scripts/prompt-sync.sh v1.29                                        # プロンプト同期のみ
./scripts/run-evaluation.sh data/input_data/test.csv --models gpt     # 評価実行のみ
./scripts/prompt-evaluate.sh v1.29 data/input_data/test.csv --models gpt  # 同期+再起動+評価の一括実行
```

※Dev Container使用時は、VSCode内のターミナルで直接`npm test`等を実行できます。
※評価システムの詳細は [評価システムガイド](./EVALUATION.md) を参照してください。

---

## ブランチ戦略とワークフロー

### ブランチ構成

本プロジェクトでは3種類のブランチを使用します：

- **main**: 安定版コード（本番環境で稼働中のコード）
- **develop**: 開発統合用（QA環境で検証中のコード）
- **開発用ブランチ**: Linearが自動生成（例: `username/issue-123-add-feature`）

ブランチ命名規則は不要です。Linearが自動的に適切な名前を生成します。

### 開発フロー

1. **開発**: Linearのイシューから開発用ブランチを作成し、機能開発・修正を実施
2. **統合**: 開発用ブランチをdevelopにマージ（プルリクエスト経由）
3. **QA**: developブランチでQA作業を実施、必要に応じて修正開発
4. **本番リリース**: アップデートされたdevelopブランチを本番環境にデプロイ
5. **監視**: リリースが無事に済んだかを監視
6. **切り戻し判断**:
   - 問題が発生した場合: mainブランチを使って本番環境に切り戻し
   - 問題がない場合: mainブランチにdevelopブランチをマージして安定版を更新
7. **次のサイクル**: 1に戻る

### Linear統合

本プロジェクトではLinearを使用してイシュー管理とブランチ作成を統合しています：

- Linearのイシューから直接ブランチを作成
- ブランチ名はLinearが自動生成（命名規則は不要）
- プルリクエストとイシューが自動連携
- イシューのステータスがプルリクエストと同期

### コミットメッセージ規約

#### フォーマット

コミットメッセージは以下の形式で **1行のみ** 記述する：

```
[<tag>] <type>(<scope>): <summary>
```

#### 各要素の説明

**`<tag>`（任意）**

プロジェクト固有のタグ。

- 例: `AI-DEV`（AI支援で開発した場合）

**`<type>`（任意）**

変更の種類。

| type | 用途 | 例 |
|------|------|-----|
| `update` | 機能面の変更全般 | 新機能、仕様変更、リファクタ、テスト追加 |
| `fix` | バグ修正・誤りの是正 | バグ修正、エラー処理修正 |
| `docs` | ドキュメントのみの変更 | README更新、コメント追加 |
| `chore` | 上記以外の雑務・整備 | 依存更新、整形、ツール設定 |

**`<scope>`（任意）**

変更の影響範囲。

- 例: `api`, `worker`, `test`, `docker`

**`<summary>`（必須）**

変更内容の要約。

**ルール:**
- **英語で記述**: コミットメッセージは英語で書くこと
- **1行**で記述
- **命令形**を使用（add, update, fix）
- **72文字程度**を目安
- **末尾にピリオド不要**
- **絵文字禁止**: コミットメッセージに絵文字を含めてはならない

#### コミットメッセージ例

**良い例:**

```
[AI-DEV] update(api): add gemini-2.5 model support
fix(worker): resolve rate limit handling issue
```

**悪い例:**

```
Update code                    # 何を変更したか不明
🤖 Generated with Claude       # 絵文字使用
```

#### コミット作成手順

```bash
# 1. 変更ファイルの確認
git status

# 2. フォーマット実行
docker-compose exec develop sh -c "npm run fmt"

# 3. テスト実行
docker-compose exec develop sh -c "npm test"

# 4. ステージング
git add .

# 5. コミット作成
git commit -m "[AI-DEV] update(api): add gemini-2.5 model support"

# 6. プッシュ
git push origin <branch-name>
```

---

## テスト規約

### テスト方針

- **カバレッジ**: 100%を基本とする（Statements, Branch, Functions, Lines）
- **原則**: テストが書けないコードは設計の問題
- **対応**: カバレッジ未達のコードはリファクタリング必須
- **責務**: 機能開発者がテスト実装まで一貫して責任を持つ

### テスト構造

**Given-When-Thenコメント必須**
- すべてのテストに適用（例外なし）
- Given: テスト前提条件
- When: テスト対象の実行
- Then: 期待結果の検証

**1テスト1検証原則（緩い解釈）**
- 各テストは1つの論理的関心事を検証
- 同一関心事内の複数側面は同時検証可
- モック検証とビジネスロジック検証の混在は禁止

**ループテストの禁止**
- test.each によるパラメータ化テストを使用
- forループによる複数シナリオテストは禁止

### テストファイル構成

- **配置**: `__tests__/` ディレクトリにsrc構造と同期して配置
- **命名規則**: `*.test.ts` または `*.test.tsx`

### テスト実行

```bash
# テスト実行
docker-compose exec develop sh -c "npm test"

# ウォッチモード
docker-compose exec develop sh -c "npm run test:watch"

# カバレッジ確認
docker-compose exec develop sh -c "npm test -- --coverage"
```

**詳細**: [guides/TESTING.md](/docs/guides/TESTING.md)

---

## ドキュメント原則

- **機能ドキュメントはすべて `docs/` に配置する**
- **ソースコード内のコメントは原則禁止**
- **TypeScriptの型システムを第一のドキュメントとする**

---

## セキュリティ

**開発時は以下のセキュリティ原則を必ず遵守すること**

### 環境変数の管理

- **APIキーは絶対にコードにハードコーディングしない**
- すべての機密情報は環境変数（`.env`）で管理する
- `.env`ファイルは`.gitignore`に含まれており、**絶対にコミットしてはならない**
- `.env.example`をテンプレートとして使用し、実際の値は含めない

### 入力検証

- **外部からの入力は必ずバリデーションを実施する**
- ユーザー入力、API リクエスト、外部データソースからのデータは信頼しない
- 型ガードと適切なバリデーションライブラリを使用する

### 機密情報のログ出力禁止

- ログに機密情報（APIキー、パスワード、個人情報など）を出力しない
- エラーログにも機密情報が含まれていないか確認する

### 依存関係の管理

- 定期的に依存関係の脆弱性をチェックする（`npm audit`）
- セキュリティアップデートは速やかに適用する
