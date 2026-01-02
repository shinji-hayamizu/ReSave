---
name: testing
description: Given-When-Then形式でテストを作成。テストを書く、テストを追加する、テストコードを作成する、カバレッジを上げる、ユニットテストを実装する場合に使用。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# テスト作成スキル

テストファイルを作成・編集する際は、以下の規約に従うこと。

## ファイル配置

```
src/
  utils/
    calculateTotal.ts
__tests__/
  src/
    utils/
      calculateTotal.test.ts
```

## Given-When-Then形式（必須）

**すべてのテストに Given-When-Then コメントを必ず記述する。**

```typescript
it('[期待される動作]', () => {
  // Given: [前提条件の説明]
  const input = setupTestData();

  // When: [実行する操作]
  const result = executeOperation(input);

  // Then: [期待される結果]
  expect(result).toBe(expected);
});
```

### Given（前提条件）
- テストの前提条件やセットアップを説明
- モックの設定、テストデータの準備などを含む

```typescript
// Given: ユーザーがログインしている状態
// Given: APIがエラーを返す状態をモック
```

### When（実行）
- テスト対象の操作や関数呼び出しを説明

```typescript
// When: ログアウト処理を実行
// When: 不正なパラメータでAPIを呼び出し
```

### Then（期待結果）
- 期待される結果やアサーションを説明

```typescript
// Then: セッションがクリアされる
// Then: バリデーションエラーがスローされる
```

## 1テスト1検証原則

**各テストは1つの論理的関心事を検証する。**

### 許容される同時検証

```typescript
// OK: 同一オブジェクトの構造検証
expect(response).toEqual({
  id: '123',
  type: 'ORDER',
  results: expect.any(Array)
});
```

### 禁止される同時検証

```typescript
// NG: モック検証とビジネスロジック検証の混在
expect(mockApiCall).toHaveBeenCalled();  // モック検証
expect(result.value).toBe(10);           // ビジネスロジック検証

// OK: 関心事ごとに分割して別テストにする
```

## ループテストの禁止

**forループを使った複数シナリオテストは禁止。test.each を使用する。**

```typescript
// NG
for (const method of methods) {
  expect(fetchMock).toHaveBeenCalledWith(url, { method });
}

// OK
test.each([
  { method: 'GET' as const },
  { method: 'POST' as const },
])('$methodリクエストを処理する', async ({ method }) => {
  // Given - When - Then
});
```

## テスト命名規則

```
[条件がある場合]〜の場合に[期待される動作]
[条件がない場合][期待される動作]
```

**良い例:**
```typescript
it('入力が不正な場合にバリデーションエラーをスローする', () => {});
it('キャッシュに値がある場合に外部APIを呼ばずに結果を返す', () => {});
```

**避けるべき命名:**
```typescript
it('正しく動作する', () => {});      // 抽象的すぎる
it('fetchUserを呼び出す', () => {}); // 実装詳細に依存
```

## テストすべき観点

1. **正常系**: 入力が正しい場合の動作
2. **異常系**: エラーが発生する場合の動作
3. **エッジケース**: 境界値や特殊なケース（空配列、最小/最大値など）

## モックの使用

```typescript
jest.mock('@/utils/api');

describe('getUserById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ユーザーデータを返す', async () => {
    // Given: APIがユーザーデータを返す状態をモック
    (fetchUserData as jest.Mock).mockResolvedValue({ id: '123', name: 'Alice' });

    // When: ユーザーIDでデータを取得
    const result = await getUserById('123');

    // Then: ユーザーデータが返される
    expect(result).toEqual({ id: '123', name: 'Alice' });
  });
});
```

## カバレッジ要件

| 指標 | 目標 |
|------|------|
| Statements | 100% |
| Branch | 100% |
| Functions | 100% |
| Lines | 100% |

テストが書きにくい場合は設計を見直す。istanbul ignoreは最終手段。
