# コーディング規約

<!-- このドキュメントは全サービス共通の基本原則を定義します。
技術スタック固有の規約は各サービスのドキュメント（`docs/services/`）を参照してください。 -->

---

## 基本原則

### すべてのコードで遵守
- **セルフドキュメンティング**: コメント不要な明確なコードを目指す
- **テストファースト**: テストなしのコードはコミット禁止
- **テストカバレッジ**: 100%厳守
- **絵文字禁止**: コード、コミットメッセージ、ドキュメント全般で使用禁止
- **秘密情報**: 環境変数使用必須、ハードコード禁止

---

<!-- ## 命名規則（概念レベル） -->

<!-- 各サービスの具体的な命名規則は `docs/services/` 配下のサービスドキュメントを参照。

### 共通概念
- **コンポーネント/クラス**: PascalCase
- **変数/関数**: camelCase
- **定数**: UPPER_SNAKE_CASE
- **ドキュメントファイル**: UPPER_SNAKE_CASE.md
- **ディレクトリ**: lowercase

### 例（言語非依存）
```
# コンポーネント/クラス
UserProfile, AttendanceForm, TokenValidator

# 変数/関数
handleSubmit, userData, validateToken

# 定数
API_BASE_URL, MAX_RETRIES, DEFAULT_TIMEOUT

# ドキュメント
CODING_STANDARDS.md, API.md, ARCHITECTURE.md

# ディレクトリ
docs/services/, src/components/
``` -->

---

## コメント規約

### 基本方針: コメントは原則不要
- **セルフドキュメンティングコードを目指す**
- コメントが必要なコードは設計の見直しを検討
- 変数名・関数名でコードの意図を明確に表現

### コメントを書く場合（例外的）
**WHYを説明、WHATは避ける**

```
// Good - 理由を説明
// ブラウザキャッシュ回避のため明示的に無効化
fetch('/api/data', { cache: 'no-store' });

// Bad - コードを読めば分かる
// データを取得
const data = await fetchData();
```

### 複雑なロジックは簡潔に説明
```
// Good - 意図を明確化
// 日をまたぐ勤務の場合は24時間加算が必要
const workingHours = calculateCrossDayHours(checkIn, checkOut);
```

---

## アクセシビリティ原則

### WCAG 2.1 AA準拠
- すべてのインタラクティブ要素はキーボードでアクセス可能
- 適切なARIA属性の使用
- 十分な色コントラスト比の確保
- スクリーンリーダー対応

詳細な実装方法は各サービスドキュメントを参照。

---

## セキュリティ原則

### 環境変数管理
- 秘密情報（APIキー、パスワード等）は環境変数使用必須
- `.env` ファイルは `.gitignore` に追加
- クライアント公開が必要な場合のみ `NEXT_PUBLIC_` 等のプレフィックス使用
- APIキー・パスワード等の秘密情報はハードコード絶対禁止
- 秘密情報をログ・コンソール・エラーメッセージに出力しない

### 認証情報の扱い
- Cookie-based認証: `credentials: 'include'` 必須
- CSRF対策: POST/PUT/PATCH/DELETE に `X-CSRF-Token` ヘッダー必須
- 詳細は `docs/ARCHITECTURE.md` の認証セクション参照
- ユーザー入力・外部データは必ず検証してから使用

---

## テスト規約

### 最重要原則

1. **テストしていないコードは絶対にコミットしない**
2. **カバレッジ100%厳守** (Lines, Functions, Branches, Statements)
3. **Chrome MCP実動作確認必須** (コンポーネント実装後)
4. **Given-When-Thenパターン厳守**
5. **1テスト1関心事の原則**

### 基本ルール

- テストファイル: `tests/{対象パス}/{ファイル名}.test.{拡張子}`
- テスト名: `条件: 期待される動作` (日本語)
- 外部依存は必ずモック化
- 異なる関心事は別テストに分割

### テスト実行

```bash
# プロジェクトルートから実行
docker-compose exec {service-name} pnpm test
```

### 関連ドキュメント
<!-- 
#### 汎用原則

- [docs/testing/OVERVIEW.md](testing/OVERVIEW.md) - テスト原則の全体像
- [docs/testing/PATTERNS.md](testing/PATTERNS.md) - Given-When-Thenパターン
- [docs/testing/ONE_CONCERN.md](testing/ONE_CONCERN.md) - 1テスト1関心事の原則
- [docs/testing/COVERAGE.md](testing/COVERAGE.md) - カバレッジ原則
- [docs/testing/NAMING.md](testing/NAMING.md) - 命名規則
- [docs/testing/CHROME_MCP.md](testing/CHROME_MCP.md) - Chrome MCP統合テスト

#### TypeScript/JavaScript固有

- [docs/testing/typescript/OVERVIEW.md](testing/typescript/OVERVIEW.md) - TypeScript/JavaScriptテストガイド
- [docs/testing/typescript/GUIDELINES.md](testing/typescript/GUIDELINES.md) - テスト作成ガイドライン
- [docs/testing/typescript/COVERAGE.md](testing/typescript/COVERAGE.md) - Vitestカバレッジ設定
- [docs/testing/typescript/MOCK_STRATEGY.md](testing/typescript/MOCK_STRATEGY.md) - モック戦略 -->

---

## 禁止事項（全言語・全サービス共通）

### 絶対禁止
- 秘密情報のハードコード
- テストなしのコード
- 絵文字の使用（コード・コミット・ドキュメント）
- デバッグログ（`console.log` 等）のコミット

<!-- ---

## 技術スタック固有の規約

各サービスの技術スタックと詳細な規約は以下を参照:

| サービス | ドキュメント | 技術スタック |
|---------|-------------|-------------|
| 勤怠管理 | [docs/services/ATTENDANCE.md](services/ATTENDANCE.md) | Next.js 15 + TypeScript |
| JWT認証 | [docs/services/JWT_VALIDATOR.md](services/JWT_VALIDATOR.md) | Express.js + JavaScript |

新規サービス追加時は `docs/services/` 配下にドキュメントを作成し、上記表に追記すること。 -->
