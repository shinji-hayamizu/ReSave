# TypeScript/JavaScript テストガイド

本ドキュメントはTypeScript/JavaScriptプロジェクトにおけるテスト実装の全体ガイドです。

## 前提知識

このガイドを読む前に、以下の汎用原則ドキュメントを必ず読んでください：

- [docs/testing/OVERVIEW.md](docs/testing/OVERVIEW.md) - テスト原則の全体像
- [docs/testing/PATTERNS.md](docs/testing/PATTERNS.md) - Given-When-Thenパターン
- [docs/testing/ONE_CONCERN.md](docs/testing/ONE_CONCERN.md) - 1テスト1関心事の原則
- [docs/testing/COVERAGE.md](docs/testing/COVERAGE.md) - カバレッジ原則
- [docs/testing/NAMING.md](docs/testing/NAMING.md) - 命名規則
- [docs/testing/CHROME_MCP.md](docs/testing/CHROME_MCP.md) - Chrome MCP統合テスト

---

## 使用するツール

### テストフレームワーク: Vitest

本プロジェクトでは **Vitest 2.x** を使用します。

**選定理由:**
- 高速なテスト実行
- TypeScript/ESMネイティブサポート
- Jest互換のAPI
- 優れたカバレッジツール

### テストライブラリ

#### フロントエンド（React）
- **@testing-library/react** - Reactコンポーネントテスト
- **@testing-library/user-event** - ユーザーインタラクションシミュレーション
- **@testing-library/jest-dom** - DOM検証用カスタムマッチャー
- **jsdom** - ブラウザ環境シミュレーション

#### バックエンド（Node.js）
- Vitest標準API（describe, it, expect, vi）

---

## ディレクトリ構造

```
services/{service-name}/
├── src/                          # ソースコード
│   ├── lib/
│   ├── components/
│   └── app/
├── tests/                        # テストコード
│   ├── setup.ts                  # テストセットアップ
│   ├── mocks/                    # モックファイル
│   │   ├── db.mock.ts
│   │   ├── fetch.mock.ts
│   │   └── next-router.mock.ts
│   ├── lib/
│   │   └── validation.test.ts
│   ├── components/
│   │   └── UserInfo.test.tsx
│   └── app/
│       └── api/
└── vitest.config.ts              # Vitest設定
```

**重要な原則:**
- テストファイルは `tests/` ディレクトリに配置
- ソースコードと同じディレクトリ構造を維持
- ファイル名: `{対象ファイル名}.test.{ts|tsx|js}`

---

## 基本的なテストの書き方

### 1. インポート

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { functionUnderTest } from '@/lib/module';
```

**パスエイリアス:**
- 相対パス（`./`, `../`）は禁止
- 必ず `@/` を使用（`tsconfig.json`/`vitest.config.ts`で設定）

### 2. テスト構造

```typescript
describe('モジュール名', () => {
  describe('メソッド名', () => {
    it('条件: 期待される動作', () => {
      // Given: テスト対象の初期状態を準備
      const input = 'test-value';

      // When: テスト対象の処理を実行
      const result = functionUnderTest(input);

      // Then: 結果を検証
      expect(result).toBe('expected-result');
    });
  });
});
```

### 3. テスト実行

```bash
# プロジェクトルートから実行
docker-compose exec attendance pnpm test      # attendanceサービス
docker-compose exec jwt-validator pnpm test   # jwt-validatorサービス
```

---

## TypeScript/JavaScript固有の注意事項

### 型安全性

- `any` 型の使用は禁止
- テストデータにも適切な型を付ける
- モックにも型を定義する

```typescript
// Good
const mockUser: User = { id: 1, name: 'Test' };

// Bad
const mockUser: any = { id: 1, name: 'Test' };
```

### 非同期テスト

```typescript
it('非同期処理成功: データを返す', async () => {
  // Given
  const mockData = { id: 1 };
  mockFetch.mockResolvedValue(mockData);

  // When
  const result = await fetchData();

  // Then
  expect(result).toEqual(mockData);
});
```

### モックの基本

```typescript
import { vi } from 'vitest';

// 関数のモック
const mockFunction = vi.fn();
mockFunction.mockReturnValue('mocked value');

// 非同期関数のモック
const mockAsyncFunction = vi.fn();
mockAsyncFunction.mockResolvedValue({ data: 'test' });

// モジュール全体のモック
vi.mock('@/lib/module', () => ({
  functionName: vi.fn()
}));
```

---

## ドキュメント一覧

### 実践ガイド
- [docs/testing/typescript/GUIDELINES.md](docs/testing/typescript/GUIDELINES.md) - 実践的なテスト作成手順

### ツール固有
- [docs/testing/typescript/COVERAGE.md](docs/testing/typescript/COVERAGE.md) - Vitestカバレッジ設定
- [docs/testing/typescript/MOCK_STRATEGY.md](docs/testing/typescript/MOCK_STRATEGY.md) - モック戦略とVitest実装

---

## 実装例の参照

具体的な実装例は、各サービスの既存テストコード（`services/{service-name}/tests/`）を参照してください。

これらは常に最新のベストプラクティスを反映しており、実際に動作するコードです。

詳細は [docs/testing/typescript/GUIDELINES.md](docs/testing/typescript/GUIDELINES.md) の「実装例の参照」セクションを参照。

---

## よくある質問

### Q1: Jestとの違いは？

**A:** Vitestは基本的にJest互換ですが、以下の違いがあります：

- `import` 文で Vitest APIをインポート（Jest: グローバル）
- より高速な実行
- ESM/TypeScriptネイティブサポート

### Q2: setupファイルで何をすべき？

**A:** 全テスト共通の設定を記述：

```typescript
// tests/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

### Q3: パスエイリアスが解決されない

**A:** `vitest.config.ts` で alias設定を確認：

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

---

## 関連リンク

### プロジェクト規約
- [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md) - コーディング規約
- [docs/services/ATTENDANCE.md](docs/services/ATTENDANCE.md) - 勤怠管理サービス規約
- [docs/services/JWT_VALIDATOR.md](docs/services/JWT_VALIDATOR.md) - JWT認証サービス規約

### 外部リソース
- [Vitest公式ドキュメント](https://vitest.dev/)
- [Testing Library公式ドキュメント](https://testing-library.com/)
