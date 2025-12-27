# TypeScript/JavaScript テストガイド サマリー

本ドキュメントは TypeScript/JavaScript テストに関する各ドキュメントの要点をまとめたものです。

---

## 目次

1. [概要](#概要)
2. [テストフレームワーク・ライブラリ](#テストフレームワークライブラリ)
3. [ディレクトリ構造](#ディレクトリ構造)
4. [テスト作成の基本](#テスト作成の基本)
5. [カバレッジ設定](#カバレッジ設定)
6. [モック戦略](#モック戦略)
7. [チェックリスト](#チェックリスト)
8. [関連ドキュメント](#関連ドキュメント)

---

## 概要

### 使用ツール

- **テストフレームワーク**: Vitest 2.x
- **フロントエンド**: @testing-library/react, @testing-library/user-event, jsdom
- **バックエンド**: Vitest標準API（describe, it, expect, vi）

### 基本原則

- カバレッジ100%厳守
- Given-When-Thenパターン
- 1テスト1関心事
- 命名規則: 「条件: 期待される動作」

---

## テストフレームワーク・ライブラリ

| 用途 | ライブラリ |
|------|-----------|
| テスト実行 | Vitest 2.x |
| Reactコンポーネント | @testing-library/react |
| ユーザー操作 | @testing-library/user-event |
| DOM検証 | @testing-library/jest-dom |
| ブラウザ環境 | jsdom |
| カバレッジ | V8プロバイダー |

---

## ディレクトリ構造

```
services/{service-name}/
├── src/                          # ソースコード
├── tests/                        # テストコード
│   ├── setup.ts                  # テストセットアップ
│   ├── mocks/                    # モックファイル
│   │   ├── db.mock.ts
│   │   ├── fetch.mock.ts
│   │   └── cognito.mock.ts
│   ├── lib/
│   │   └── validation.test.ts
│   └── components/
│       └── UserInfo.test.tsx
└── vitest.config.ts              # Vitest設定
```

**ファイル命名規則**: `{対象ファイル名}.test.{ts|tsx}`

---

## テスト作成の基本

### 基本テンプレート

```typescript
import { describe, it, expect } from 'vitest';
import { functionUnderTest } from '@/lib/module';

describe('モジュール名', () => {
  describe('メソッド名', () => {
    it('条件: 期待される動作', () => {
      // Given
      const input = 'test-value';

      // When
      const result = functionUnderTest(input);

      // Then
      expect(result).toBe('expected-result');
    });
  });
});
```

### テスト作成の流れ

1. **対象ファイルを理解**: エクスポートされている関数/クラスを特定
2. **テストケースを列挙**: 正常系と異常系をリストアップ
3. **テストを実装**: Given-When-Thenパターンで実装
4. **カバレッジ確認**: 100%達成まで繰り返し

### テスト実行コマンド

```bash
# プロジェクトルートから実行
docker-compose exec {service-name} pnpm test
```

### カテゴリ別テンプレート

| カテゴリ | 特徴 |
|---------|------|
| ユーティリティ関数 | 入力・出力のシンプルなテスト |
| リポジトリクラス | モック接続を使用、beforeEachでリセット |
| API Route (Next.js) | NextRequestを使用、ステータスコード検証 |
| Reactコンポーネント | render + screen + userEvent |

---

## カバレッジ設定

### vitest.config.ts 基本設定

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
      exclude: [
        'tests/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.config.ts',
        '.next/**',
        'types/**'
      ]
    }
  }
});
```

### カバレッジ閾値（100%厳守）

| メトリクス | 閾値 |
|-----------|------|
| lines | 100% |
| functions | 100% |
| branches | 100% |
| statements | 100% |

### 未カバー時の対処

1. ターミナル出力の`Uncovered Lines`列を確認
2. 原因を分類（テストケース不足/エラーハンドリング未テスト/早期リターン未テスト）
3. 追加テストを作成
4. 100%達成まで繰り返し

---

## モック戦略

### モック対象の判断基準

#### 必ずモックする

- **データベース**: mysql2/promise等のDB操作
- **外部API**: AWS Cognito、Redis、HTTP通信（fetch）
- **ファイルシステム**: ファイル読み書き操作
- **時刻**: `Date.now()`, `new Date()`（テスト結果が時刻に依存する場合）

#### モックしない

- **純粋関数**: 入力から出力が決定論的に決まる
- **ユーティリティ関数**: バリデーション、フォーマット等
- **ドメインロジック**: ビジネスロジックの中核

### モック品質の要件

| 要件 | 説明 |
|------|------|
| 実際のデータ構造に忠実 | mysql2の戻り値 `[[data], []]` 等を再現 |
| エラーケースも再現 | `mockRejectedValue`でエラーを再現 |
| テスト間で独立 | `beforeEach`で`vi.clearAllMocks()` |
| 型安全 | `any`禁止、適切な型を付ける |

### モック実装例

```typescript
// DB接続モック
mockConnection.query.mockResolvedValue([[{ id: 1 }], []]);

// エラーケース
mockConnection.query.mockRejectedValue(new Error('Connection failed'));

// テスト間リセット
beforeEach(() => {
  vi.clearAllMocks();
});
```

### アンチパターン

| パターン | 問題 | 対処 |
|---------|------|------|
| 過度なモック | ビジネスロジックをテストしていない | 外部依存のみモック |
| 実装詳細への依存 | リファクタリングでテスト壊れる | 外部観察可能な動作のみテスト |
| リセット忘れ | テスト順序依存 | `beforeEach`で`vi.clearAllMocks()` |
| デフォルト戻り値依存 | 意図不明確 | 戻り値を明示的に設定 |

---

## チェックリスト

### テスト作成時

- [ ] Given-When-Thenパターンに従っている
- [ ] テスト名が「条件: 期待される動作」の形式
- [ ] 正常系のテストがある
- [ ] 異常系のテストがある
- [ ] エッジケースをカバーしている
- [ ] モックが適切に設定されている
- [ ] カバレッジ100%達成
- [ ] すべてのテストがpass

### モック作成時

- [ ] 外部依存（DB/API）をモック化している
- [ ] ビジネスロジックを直接テストしている（モックしていない）
- [ ] モックの戻り値が実際のデータ構造と一致
- [ ] `beforeEach`で`vi.clearAllMocks()`を実行
- [ ] エラーケースもモックで再現している

### カバレッジ確認時

- [ ] `vitest.config.ts`でカバレッジ設定が正しい
- [ ] すべてのメトリクスが100%
- [ ] ターミナル出力で未カバー箇所がない
- [ ] 除外設定が適切（最小限）
- [ ] コミット前に`docker-compose exec {service-name} pnpm test`を実行

---

## 関連ドキュメント

### 詳細ドキュメント（このディレクトリ内）

| ファイル | 内容 |
|---------|------|
| [OVERVIEW.md](./OVERVIEW.md) | TypeScript/JavaScriptテストの全体ガイド |
| [GUIDELINES.md](./GUIDELINES.md) | 実践的なテスト作成手順 |
| [COVERAGE.md](./COVERAGE.md) | Vitestカバレッジ設定 |
| [MOCK_STRATEGY.md](./MOCK_STRATEGY.md) | モック戦略とVitest実装 |

### 汎用テスト原則（parentディレクトリ）

| ファイル | 内容 |
|---------|------|
| [../OVERVIEW.md](../OVERVIEW.md) | テスト原則の全体像 |
| [../PATTERNS.md](../PATTERNS.md) | Given-When-Thenパターン詳細 |
| [../ONE_CONCERN.md](../ONE_CONCERN.md) | 1テスト1関心事の原則 |
| [../COVERAGE.md](../COVERAGE.md) | カバレッジ基準 |
| [../NAMING.md](../NAMING.md) | 命名規則 |
| [../CHROME_MCP.md](../CHROME_MCP.md) | Chrome MCP統合テスト |

### 外部リソース

- [Vitest公式ドキュメント](https://vitest.dev/)
- [Testing Library公式ドキュメント](https://testing-library.com/)

