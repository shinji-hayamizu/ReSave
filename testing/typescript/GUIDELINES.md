# TypeScript/JavaScript テスト作成ガイドライン

本ドキュメントはVitest + TypeScriptを使用した実践的なテスト作成手順を説明します。

## 前提知識

このガイドを読む前に、以下のドキュメントを必ず読んでください：

- [docs/testing/OVERVIEW.md](docs/testing/OVERVIEW.md) - テスト原則の全体像
- [docs/testing/PATTERNS.md](docs/testing/PATTERNS.md) - Given-When-Thenパターン
- [docs/testing/ONE_CONCERN.md](docs/testing/ONE_CONCERN.md) - 1テスト1関心事の原則
- [docs/testing/NAMING.md](docs/testing/NAMING.md) - 命名規則

---

## クイックスタート

### 1. テストファイル作成

```bash
# 対象ファイルと同じディレクトリ構造で作成
# 例: src/lib/validation.ts の場合
touch tests/lib/validation.test.ts
```

### 2. 基本テンプレート

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

### 3. テスト実行

```bash
# プロジェクトルートから実行
docker-compose exec attendance pnpm test
```

---

## テスト作成の流れ

### Step 1: 対象ファイルを理解する

1. 対象ファイルを読む
2. エクスポートされている関数/クラスを特定
3. 各関数の入力・出力を把握
4. エッジケースを洗い出す

### Step 2: テストケースを列挙する

正常系と異常系をリストアップ:

```markdown
## validateTimeString のテストケース

### 正常系
- 正常な時刻文字列("09:30"): trueを返す
- 正常な時刻文字列("00:00"): trueを返す
- 正常な時刻文字列("23:59"): trueを返す

### 異常系
- 無効な時刻文字列("25:00"): falseを返す
- 無効な時刻文字列("09:60"): falseを返す
- 空文字列: falseを返す
- nullが渡された場合: falseを返す
```

### Step 3: テストを実装する

リストに従ってテストを実装:

```typescript
describe('validation', () => {
  describe('validateTimeString', () => {
    // 正常系
    it('正常な時刻文字列("09:30"): trueを返す', () => {
      expect(validateTimeString('09:30')).toBe(true);
    });

    it('正常な時刻文字列("00:00"): trueを返す', () => {
      expect(validateTimeString('00:00')).toBe(true);
    });

    // 異常系
    it('無効な時刻文字列("25:00"): falseを返す', () => {
      expect(validateTimeString('25:00')).toBe(false);
    });

    it('空文字列: falseを返す', () => {
      expect(validateTimeString('')).toBe(false);
    });
  });
});
```

### Step 4: カバレッジ確認

```bash
# プロジェクトルートから実行
docker-compose exec attendance pnpm test
```

100%未達の場合、未カバー箇所を特定して追加テストを作成。

---

## カテゴリ別テンプレート

### ユーティリティ関数

```typescript
import { describe, it, expect } from 'vitest';
import { utilityFunction } from '@/lib/utils';

describe('utilityFunction', () => {
  it('正常な入力: 期待される結果を返す', () => {
    // Given
    const input = 'valid-input';

    // When
    const result = utilityFunction(input);

    // Then
    expect(result).toBe('expected-output');
  });

  it('無効な入力: エラーをthrowする', () => {
    // Given
    const input = 'invalid-input';

    // When & Then
    expect(() => utilityFunction(input)).toThrow('Invalid input');
  });
});
```

### リポジトリクラス

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createMockConnection } from '../mocks/db.mock';
import { Repository } from '@/lib/db/repositories/repository';

describe('Repository', () => {
  let mockConnection: ReturnType<typeof createMockConnection>;
  let repository: Repository;

  beforeEach(() => {
    mockConnection = createMockConnection();
    repository = new Repository(mockConnection);
  });

  describe('findById', () => {
    it('レコードが存在する場合: レコードを返す', async () => {
      // Given
      const id = 1;
      const mockRecord = { id, name: 'Test' };
      mockConnection.query.mockResolvedValue([[mockRecord], []]);

      // When
      const result = await repository.findById(id);

      // Then
      expect(result).toEqual(mockRecord);
    });

    it('レコードが存在しない場合: nullを返す', async () => {
      // Given
      const id = 999;
      mockConnection.query.mockResolvedValue([[], []]);

      // When
      const result = await repository.findById(id);

      // Then
      expect(result).toBe(null);
    });
  });
});
```

### API Route (Next.js)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/users/[id]/route';
import { createMockConnection } from '../mocks/db.mock';

describe('GET /api/users/[id]', () => {
  let mockConnection: ReturnType<typeof createMockConnection>;

  beforeEach(() => {
    mockConnection = createMockConnection();
  });

  it('ユーザー取得成功: ステータス200を返す', async () => {
    // Given
    const userId = 'user-123';
    const mockUser = { id: userId, name: 'Test User' };
    mockConnection.query.mockResolvedValue([[mockUser], []]);

    const request = new NextRequest('http://localhost/api/users/user-123');

    // When
    const response = await GET(request, { params: { id: userId } });

    // Then
    expect(response.status).toBe(200);
  });

  it('ユーザーが存在しない場合: ステータス404を返す', async () => {
    // Given
    const userId = 'nonexistent';
    mockConnection.query.mockResolvedValue([[], []]);

    const request = new NextRequest('http://localhost/api/users/nonexistent');

    // When
    const response = await GET(request, { params: { id: userId } });

    // Then
    expect(response.status).toBe(404);
  });
});
```

### Reactコンポーネント

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Component } from '@/components/Component';

describe('Component', () => {
  it('プロップスが正しく表示される', () => {
    // Given
    const props = { text: 'Test Text' };

    // When
    render(<Component {...props} />);

    // Then
    expect(screen.getByText('Test Text')).toBeInTheDocument();
  });

  it('ボタンクリック: イベントハンドラーが呼ばれる', async () => {
    // Given
    const onClick = vi.fn();
    render(<Component onClick={onClick} />);

    // When
    await userEvent.click(screen.getByRole('button'));

    // Then
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

---

## よくあるパターン

### 非同期処理

```typescript
it('非同期処理成功: 結果を返す', async () => {
  // Given
  const mockData = { id: 1 };
  mockFetch.mockResolvedValue(createMockResponse(mockData));

  // When
  const result = await fetchData();

  // Then
  expect(result).toEqual(mockData);
});
```

### エラーハンドリング

```typescript
it('エラー発生: エラーをthrowする', async () => {
  // Given
  mockFetch.mockRejectedValue(new Error('Network error'));

  // When & Then
  await expect(fetchData()).rejects.toThrow('Network error');
});
```

### モック呼び出し検証

```typescript
it('正しいパラメータで関数が呼ばれる', async () => {
  // Given
  const userId = 'user-123';
  mockConnection.query.mockResolvedValue([[{ id: userId }], []]);

  // When
  await repository.findById(userId);

  // Then
  expect(mockConnection.query).toHaveBeenCalledOnce();
  expect(mockConnection.query).toHaveBeenCalledWith(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );
});
```

---

## チェックリスト

テスト作成時の確認事項:

- [ ] Given-When-Thenパターンに従っている
- [ ] テスト名が「条件: 期待される動作」の形式
- [ ] 正常系のテストがある
- [ ] 異常系のテストがある
- [ ] エッジケースをカバーしている
- [ ] モックが適切に設定されている
- [ ] カバレッジ100%達成
- [ ] すべてのテストがpass

---

## 実装例の参照

本ドキュメントで説明した原則とパターンの**具体的な実装例**は、各サービスの既存テストコードを参照してください。

### 新規テスト作成時の推奨フロー

1. 本ドキュメントで原則とパターンを理解
2. 作業中のサービス内の既存テストコードから類似のものを参照
3. 既存コードの構造を参考に、テスト対象に合わせて実装
4. カバレッジ100%達成まで追加

### 参照先

各サービスの具体的なテストファイルと参考ポイントは、サービス固有のドキュメントを参照してください：

- [docs/services/ATTENDANCE.md](docs/services/ATTENDANCE.md) - 勤怠管理サービスのテスト実装例
- [docs/services/JWT_VALIDATOR.md](docs/services/JWT_VALIDATOR.md) - JWT認証サービスのテスト実装例

---

## 関連ドキュメント

### 汎用原則
- [docs/testing/OVERVIEW.md](docs/testing/OVERVIEW.md) - テスト原則の全体像
- [docs/testing/PATTERNS.md](docs/testing/PATTERNS.md) - Given-When-Thenパターン詳細
- [docs/testing/ONE_CONCERN.md](docs/testing/ONE_CONCERN.md) - 1テスト1関心事の原則
- [docs/testing/COVERAGE.md](docs/testing/COVERAGE.md) - カバレッジ基準
- [docs/testing/NAMING.md](docs/testing/NAMING.md) - 命名規則

### TypeScript/JavaScript固有
- [docs/testing/typescript/OVERVIEW.md](docs/testing/typescript/OVERVIEW.md) - TypeScript/JavaScriptテストガイド
- [docs/testing/typescript/COVERAGE.md](docs/testing/typescript/COVERAGE.md) - Vitestカバレッジ設定
- [docs/testing/typescript/MOCK_STRATEGY.md](docs/testing/typescript/MOCK_STRATEGY.md) - モック戦略
