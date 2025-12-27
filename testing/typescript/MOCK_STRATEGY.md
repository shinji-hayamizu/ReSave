# モック戦略

本ドキュメントはテストにおけるモック化の原則と判断基準を説明します。

## 前提知識

このガイドを読む前に、以下のドキュメントを必ず読んでください：

- [docs/testing/OVERVIEW.md](docs/testing/OVERVIEW.md) - テスト原則の全体像
- [docs/testing/typescript/GUIDELINES.md](docs/testing/typescript/GUIDELINES.md) - テスト作成ガイドライン

---

## モック化の目的

1. **テストの高速化**: 実際のDB/API通信を排除
2. **テストの安定化**: 外部サービスの状態に依存しない
3. **テストの独立性**: 他のテストに影響しない
4. **エラーケースの再現**: 意図的にエラーを発生させられる

---

## モック対象の判断基準

### 必ずモックする

以下の外部依存は**必ず**モック化する：

- **データベース** (mysql2/promise): すべてのDB操作
- **外部API**: AWS Cognito、Redis、HTTP通信（fetch）
- **ファイルシステム**: ファイル読み書き操作
- **時刻**: `Date.now()`, `new Date()`（テスト結果が時刻に依存する場合）

**理由**: これらはテストの速度・安定性・独立性を損なう

### モックしない

以下は**モック不要**：

- **純粋関数**: 入力から出力が決定論的に決まる関数
- **ユーティリティ関数**: バリデーション、フォーマット等
- **ドメインロジック**: ビジネスロジックの中核

**理由**: これらこそテストすべき対象

---

## モック品質の要件

### 1. 実際のデータ構造に忠実

モックの戻り値は実際のAPI/DBと同じ構造にする：

```typescript
// Good - mysql2の実際の戻り値構造
mockConnection.query.mockResolvedValue([[{ id: 1 }], []]);

// Bad - 構造が違う
mockConnection.query.mockResolvedValue({ id: 1 });
```

### 2. エラーケースも再現

正常系だけでなく異常系も：

```typescript
// 正常系
mockConnection.query.mockResolvedValue([[{ id: 1 }], []]);

// 異常系
mockConnection.query.mockRejectedValue(new Error('Connection failed'));
```

### 3. テスト間で独立

`beforeEach`で必ずモックをリセット：

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 4. 型安全

モックにも適切な型を付ける：

```typescript
// Good
const mockConnection: ReturnType<typeof createMockConnection> = createMockConnection();

// Bad
const mockConnection: any = createMockConnection();
```

---

## アンチパターン

### 1. 過度なモック

**症状**: ビジネスロジックまでモックしている

**問題**: テストが実装を検証していない

**対処**: モックは外部依存のみに限定

### 2. 実装詳細への依存

**症状**: 内部の関数呼び出し順序をテストしている

**問題**: リファクタリングでテストが壊れる

**対処**: 外部から観察可能な動作のみをテスト

### 3. モックのリセット忘れ

**症状**: テストの実行順序で結果が変わる

**問題**: テストの独立性が失われる

**対処**: `beforeEach`で`vi.clearAllMocks()`を必ず実行

### 4. デフォルト戻り値への依存

**症状**: モックの戻り値を設定せず`undefined`に依存

**問題**: 意図が不明確、バグの原因

**対処**: 戻り値を明示的に設定

---

## モックファイルの配置

### ディレクトリ構造

```
services/{service-name}/
└── tests/
    ├── mocks/
    │   ├── db.mock.ts          # DB接続モック
    │   ├── cognito.mock.ts     # Cognito APIモック
    │   ├── redis.mock.ts       # Redisクライアントモック
    │   └── fetch.mock.ts       # fetchモック
    └── lib/
        └── validation.test.ts
```

### 命名規則

- ファイル名: `{対象}.mock.{ts|tsx}`
- 関数名: `mock{対象名}`, `createMock{対象名}`

---

## まとめ

### モック戦略の原則

1. **外部依存のみモック**: DB、API、ファイルシステム
2. **ビジネスロジックはモック不要**: 純粋関数、ドメインロジック
3. **実データ構造に忠実**: モックは実際のAPIと同じ構造
4. **テスト間で独立**: `beforeEach`でリセット

### チェックリスト

- [ ] 外部依存（DB/API）をモック化している
- [ ] ビジネスロジックを直接テストしている（モックしていない）
- [ ] モックの戻り値が実際のデータ構造と一致
- [ ] `beforeEach`で`vi.clearAllMocks()`を実行
- [ ] エラーケースもモックで再現している

---

## モック実装の参照

本ドキュメントで説明した原則とパターンの**具体的な実装例**は、各サービスの既存モックファイルを参照してください。

### モックファイルの配置

```
services/{service-name}/
└── tests/
    └── mocks/
        ├── db.mock.ts           # データベース接続モック
        ├── fetch.mock.ts        # fetch APIモック
        ├── cognito.mock.ts      # AWS Cognitoモック（該当する場合）
        └── next-router.mock.ts  # Next.jsルーターモック（該当する場合）
```

### 推奨フロー

1. 本ドキュメントでモック戦略の原則を理解
2. 作業中のサービスの`tests/mocks/`配下の既存モックファイルを参照
3. 既存のモック関数（`createMock*`等）を活用
4. 新しいモックが必要な場合は、同様のパターンで作成

### モック関数の命名規則

- **ファクトリ関数**: `createMock{対象名}` - モックインスタンスを生成
  - 例: `createMockConnection()`, `createMockPool()`
- **ヘルパー関数**: `mock{対象名}` - モック値やレスポンスを生成
  - 例: `mockUser()`, `mockResponse()`

### 型安全なモック作成のポイント

```typescript
// Good - 実際の型を使用
import type { Pool, Connection } from 'mysql2/promise';

export const createMockPool = (): Pool => ({
  execute: vi.fn(),
  query: vi.fn(),
  getConnection: vi.fn(),
  // ... 必要なメソッドのみ実装
} as unknown as Pool);

// Bad - any型を使用
export const createMockPool = (): any => ({
  execute: vi.fn(),
});
```

**ポイント:**
- 実際の型（`Pool`, `Connection`等）をimportして使用
- `as unknown as {型}`でキャストして型安全性を保つ
- テストで使用するメソッドのみ実装（全てを実装する必要はない）

---

## 関連ドキュメント

- [docs/testing/OVERVIEW.md](docs/testing/OVERVIEW.md) - テスト原則の全体像
- [docs/testing/typescript/OVERVIEW.md](docs/testing/typescript/OVERVIEW.md) - TypeScript/JavaScriptテストガイド
- [docs/testing/typescript/GUIDELINES.md](docs/testing/typescript/GUIDELINES.md) - テスト作成ガイドライン
- [docs/testing/typescript/COVERAGE.md](docs/testing/typescript/COVERAGE.md) - Vitestカバレッジ設定
