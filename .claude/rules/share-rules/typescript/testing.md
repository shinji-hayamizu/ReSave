---
paths: tests/**/*.{ts,tsx}
---

# テスト規約ガイド

## 目次

1. [基本原則](#基本原則)
2. [Given-When-Thenパターン（必須）](#given-when-thenパターン必須)
3. [1テスト1検証原則（緩い解釈）](#1テスト1検証原則緩い解釈)
4. [ループテストの禁止](#ループテストの禁止)
5. [テスト命名規則](#テスト命名規則)
6. [テストファイル構成](#テストファイル構成)
7. [テスト作成ガイドライン](#テスト作成ガイドライン)
8. [テスト実行](#テスト実行)
9. [カバレッジ要件](#カバレッジ要件)

---

## 基本原則

### なぜテストが重要か

テストはコードの品質を保証し、リファクタリングの安全性を確保します。

**テストのメリット**:
1. **バグの早期発見**: 実装時にバグを検出
2. **リファクタリングの安全性**: 変更時の影響を確認
3. **ドキュメント効果**: テストが仕様を表現
4. **設計の改善**: テスト可能な設計は保守しやすい

### テスト方針

- **カバレッジ**: 原則100%（詳細は「カバレッジ要件」を参照）
- **原則**: テストが書けないコードは設計の問題
- **対応**: カバレッジ未達のコードはリファクタリング必須
- **責務**: 機能開発者がテスト実装まで一貫して責任を持つ

---

## Given-When-Thenパターン（必須）

**すべてのテストに Given-When-Then コメントを必ず記述する。**

### 基本構造

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

### 記述ルール

#### Given（前提条件）
- テストの前提条件やセットアップを説明
- モックの設定、テストデータの準備などを含む
- 「何が与えられているか」を明確に記述

```typescript
// Given: ユーザーがログインしている状態
// Given: APIがエラーを返す状態をモック
// Given: 大きなサイズの画像データ
```

#### When（実行）
- テスト対象の操作や関数呼び出しを説明
- 「何を実行するか」を明確に記述

```typescript
// When: ログアウト処理を実行
// When: 画像最適化を実行
// When: 不正なパラメータでAPIを呼び出し
```

#### Then（期待結果）
- 期待される結果やアサーションを説明
- 「何が起きるべきか」を明確に記述

```typescript
// Then: セッションがクリアされる
// Then: 最適化された画像が返される
// Then: バリデーションエラーがスローされる
```

### 実例

#### シンプルなテスト

```typescript
it('コンテキストなしでメッセージをログ出力する', () => {
  // Given: ログ出力するメッセージ
  const message = 'Test message';

  // When: コンテキストなしでログ出力
  logger.info(message);

  // Then: console.logが呼ばれる
  expect(consoleLogSpy).toHaveBeenCalledWith(message);
});
```

#### 中規模テスト

```typescript
it('外部サービスが成功を返した場合に成功結果を返す', async () => {
  // Given: 外部サービスが成功する状態をモック
  const input = { userId: 'user-1', amount: 1200 };
  mockExternalService.execute.mockResolvedValue({ status: 'OK', message: 'Accepted' });

  // When: ユースケースを実行
  const result = await executeUseCase(input);

  // Then: 成功結果が返される
  expect(result).toEqual({ status: 'OK', message: 'Accepted' });
});
```

#### 複雑なテスト

```typescript
it('キャッシュから処理状態を復元し、未完了の項目のみ処理する', async () => {
  // Given: キャッシュストアに部分的に完了した状態が保存されている
  // NOTE: キャッシュの実装は in-memory / Redis / DB など何でもよい。ここでは「キャッシュI/F」をモックする。
  const cachedStates: ProcessingStates = {
    itemA: { completed: true, result: { status: 'OK', reason: 'Cached result' } },
    itemB: { completed: false, result: null },
  };
  mockCache.get.mockResolvedValue(JSON.stringify(cachedStates));
  mockCache.set.mockResolvedValue('OK');
  mockProcessItem.mockResolvedValue({ status: 'NG', reason: 'Issue found' });

  // When: バッチ処理を実行
  const result = await executeBatch(mockBatchInput);

  // Then: キャッシュ済み結果と新規処理結果が組み合わされる
  expect(result).toEqual({
    results: {
      itemA: { status: 'OK', reason: 'Cached result' },
      itemB: { status: 'NG', reason: 'Issue found' },
    },
  });

  // Then: 未完了の項目のみ処理される
  expect(mockProcessItem).toHaveBeenCalledTimes(1);
});
```

---

## 1テスト1検証原則（緩い解釈）

### 原則

**各テストは1つの論理的関心事を検証する。**

同一の論理的関心事に含まれる複数側面の検証は許容されるが、異なる関心事の検証を1つのテストに混在させてはならない。

### 許容される同時検証

#### ケース1: 同一オブジェクトの構造検証

```typescript
// OK: APIレスポンスの構造全体を検証
it('有効なAPIレスポンス構造を返す', async () => {
  // Given: 有効なリクエストデータ
  const request = { id: '123', type: 'ORDER', items: [...] };

  // When: APIを呼び出し
  const response = await processRequest(request);

  // Then: 期待される構造のレスポンスが返される
  expect(response).toEqual({
    id: '123',
    type: 'ORDER',
    results: expect.any(Array)
  });
});
```

#### ケース2: 同一関心事の複数側面

```typescript
// OK: HTTPレスポンスの成功状態を検証（ok と status は密接に関連）
it('成功したHTTPレスポンスを返す', async () => {
  // Given: 有効なHTTPリクエスト
  const url = 'https://api.example.com/data';
  const options = { method: 'GET' };

  // When: リクエストを実行
  const response = await fetchWithOptions(url, options);

  // Then: 成功レスポンスが返される
  expect(response.ok).toBe(true);
  expect(response.status).toBe(200);
});
```

### 禁止される同時検証

#### ケース1: モック検証とビジネスロジック検証の混在

```typescript
// NG: 異なる関心事（呼び出し検証と結果検証）を混在
it('APIを呼び出して結果を返す', async () => {
  // Given
  const input = { data: 'test' };

  // When
  const result = await processData(input);

  // Then
  expect(mockApiCall).toHaveBeenCalled();  // モック検証
  expect(result.value).toBe(10);           // ビジネスロジック検証
});

// OK: 関心事ごとに分割
it('正しいパラメータでAPIを呼び出す', async () => {
  // Given: テストデータ
  const input = { data: 'test' };

  // When: データ処理を実行
  await processData(input);

  // Then: APIが正しいパラメータで呼ばれる
  expect(mockApiCall).toHaveBeenCalledWith(expect.objectContaining({ data: 'test' }));
});

it('計算結果を返す', async () => {
  // Given: テストデータ
  const input = { data: 'test' };

  // When: データ処理を実行
  const result = await processData(input);

  // Then: 計算結果が返される
  expect(result.value).toBe(10);
});
```

---

## ループテストの禁止

**forループを使った複数シナリオテストは禁止。**

`test.each` を使用してパラメータ化テストを記述する。

### 禁止パターン

```typescript
it('すべてのHTTPメソッドを処理する', async () => {
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];

  for (const method of methods) {
    fetchMock.resetMocks();
    await fetchWithOptions(url, { method });
    expect(fetchMock).toHaveBeenCalledWith(url, { method });
  }
});
```

**問題点:**
- テスト失敗時にどのイテレーションで失敗したか不明確
- 各シナリオが独立していない
- デバッグが困難

### 推奨パターン: test.each

```typescript
describe('HTTPメソッドのサポート', () => {
  test.each([
    { method: 'GET' as const },
    { method: 'POST' as const },
    { method: 'PUT' as const },
    { method: 'DELETE' as const },
  ])('$methodリクエストを処理する', async ({ method }) => {
    // Given: HTTPリクエストの準備
    const url = 'https://api.example.com/data';
    const options = { method };
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(JSON.stringify({ data: 'test' }));

    // When: リクエストを実行
    await fetchWithOptions(url, options);

    // Then: 正しいパラメータでfetchが呼ばれる
    expect(fetchMock).toHaveBeenCalledWith(url, options);
  });
});
```

**利点:**
- 失敗したシナリオが明確（例: "POSTリクエストを処理する"）
- 各テストが独立して実行される
- デバッグが容易

---

## テスト命名規則

### 基本フォーマット

```
[条件がある場合]〜の場合に[期待される動作]
[条件がない場合][期待される動作]
```

### 良い例

```typescript
it('入力が不正な場合にバリデーションエラーをスローする', () => { ... });
it('外部APIがタイムアウトした場合にリトライして失敗したらエラーをスローする', async () => { ... });
it('キャッシュに値がある場合に外部APIを呼ばずに結果を返す', async () => { ... });
it('支払いが成功した場合に注文を確定する', async () => { ... });
it('権限がない場合にアクセスを拒否する', async () => { ... });
```

### 避けるべき命名

```typescript
// NG: 抽象的すぎる
it('正しく動作する', () => { ... });
it('テストケース1', () => { ... });

// NG: 実装詳細に依存
it('fetchUserを呼び出す', () => { ... });
it('stateをtrueに設定する', () => { ... });

// NG: 曖昧
it('エラーを処理する', () => { ... });
it('データを返す', () => { ... });
```

### 命名のポイント

1. **ビジネス価値を表現**: 技術的詳細ではなく、何を達成するかを記述
2. **具体的に**: 曖昧な表現を避ける
3. **条件を明示**: 必要に応じて「〜の場合に」で条件を追加
4. **簡潔に**: 長すぎる名前は避けるが、明確さを優先

---

### ディレクトリ構造

```
src/
└── utils/
    └── calculateTotal.ts
__tests__/
└── src/
    └── utils/
        └── calculateTotal.test.ts
```

### ファイル命名パターン

```
calculateTotal.ts → calculateTotal.test.ts
UserService.ts → UserService.test.ts
formatDate.ts → formatDate.test.ts
```

### 理由

- テスト対象ファイルの場所が明確
- ディレクトリ構造がsrcと同期
- テストファイルがsrcを汚染しない

---

## テスト作成ガイドライン

### テストすべき観点

#### 正常系

入力が正しい場合の動作を確認。

```typescript
describe('calculateTotal', () => {
  it('単一アイテムの合計を計算する', () => {
    // Given: 単一アイテム
    const items = [{ price: 100 }];

    // When: 合計を計算
    const result = calculateTotal(items);

    // Then: 正しい合計が返される
    expect(result).toBe(100);
  });

  it('複数アイテムの合計を計算する', () => {
    // Given: 複数アイテム
    const items = [{ price: 100 }, { price: 200 }];

    // When: 合計を計算
    const result = calculateTotal(items);

    // Then: 正しい合計が返される
    expect(result).toBe(300);
  });
});
```

#### 異常系

エラーが発生する場合の動作を確認。

```typescript
describe('validateEmail', () => {
  it('不正なメールアドレスの場合にエラーをスローする', () => {
    // Given: 不正なメールアドレス
    const invalidEmail = 'invalid';

    // When: バリデーションを実行
    const act = () => validateEmail(invalidEmail);

    // Then: バリデーションエラーがスローされる
    expect(act).toThrow('Invalid email format');
  });

  it('空のメールアドレスの場合にエラーをスローする', () => {
    // Given: 空のメールアドレス
    const emptyEmail = '';

    // When: バリデーションを実行
    const act = () => validateEmail(emptyEmail);

    // Then: 必須エラーがスローされる
    expect(act).toThrow('Email is required');
  });
});
```

#### エッジケース

境界値や特殊なケースを確認。

```typescript
describe('formatDate', () => {
  it('最小日付を処理する', () => {
    // Given: 最小日付
    const minDate = new Date('1970-01-01');

    // When: 日付をフォーマット
    const result = formatDate(minDate);

    // Then: 正しくフォーマットされる
    expect(result).toBe('1970-01-01');
  });

  it('空の配列を処理する', () => {
    // Given: 空の配列
    const emptyArray = [];

    // When: 合計を計算
    const result = calculateTotal(emptyArray);

    // Then: ゼロが返される
    expect(result).toBe(0);
  });
});
```

### モックの使用

#### 外部依存をモック

```typescript
import { fetchUserData } from '@/utils/api';
import { getUserById } from '@/utils/userService';

jest.mock('@/utils/api');

describe('getUserById', () => {
  it('ユーザーデータを返す', async () => {
    // Given: APIがユーザーデータを返す状態をモック
    (fetchUserData as jest.Mock).mockResolvedValue({ id: '123', name: 'Alice' });

    // When: ユーザーIDでデータを取得
    const result = await getUserById('123');

    // Then: ユーザーデータが返される
    expect(result).toEqual({ id: '123', name: 'Alice' });
  });

  it('ユーザーIDに対応するエンドポイントでAPIを呼び出す', async () => {
    // Given: APIが正常に返る状態をモック
    (fetchUserData as jest.Mock).mockResolvedValue({ id: '123', name: 'Alice' });

    // When: ユーザーIDでデータを取得
    await getUserById('123');

    // Then: 正しいパスでAPIが呼ばれる
    expect(fetchUserData).toHaveBeenCalledWith('/api/users/123');
  });
});
```

#### モックのクリーンアップ

```typescript
beforeEach(() => {
  jest.clearAllMocks();  // 各テスト前にモックをクリア
});

afterEach(() => {
  jest.restoreAllMocks();  // スパイをリストア
});
```

### テストの独立性

各テストは他のテストに依存してはいけません。

```typescript
// NG: 悪い例（テスト間で状態を共有）
let sharedState = 0;

describe('incrementCounter', () => {
  it('1にインクリメントする', () => {
    sharedState = incrementCounter(sharedState);
    expect(sharedState).toBe(1);
  });

  it('2にインクリメントする', () => {
    sharedState = incrementCounter(sharedState); // 前のテストに依存
    expect(sharedState).toBe(2);
  });
});

// OK: 良い例（各テストが独立）
describe('incrementCounter', () => {
  it('0から1にインクリメントする', () => {
    // Given: 初期値0
    const initial = 0;

    // When: インクリメント
    const result = incrementCounter(initial);

    // Then: 1になる
    expect(result).toBe(1);
  });

  it('5から6にインクリメントする', () => {
    // Given: 初期値5
    const initial = 5;

    // When: インクリメント
    const result = incrementCounter(initial);

    // Then: 6になる
    expect(result).toBe(6);
  });
});
```

---

## テスト実行

### 基本コマンド

```bash
# すべてのテストを実行
npm test
# または: yarn test / pnpm test

# 特定のファイルを実行
npm test -- --testPathPattern=calculateTotal
# または: npm test -- calculateTotal.test.ts

# ウォッチモード（ファイル変更を監視）
npm run test:watch
# または: npm test -- --watch

# カバレッジ確認
npm test -- --coverage

# HTMLカバレッジレポート生成
npm test -- --coverage --coverageReporters=html
# coverage/lcov-report/index.html で確認
```

### カバレッジレポートの見方

```
--------------------|---------|----------|---------|---------|-------------------
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
--------------------|---------|----------|---------|---------|-------------------
All files           |  100.00 |   100.00 |  100.00 |  100.00 |
 calculateTotal.ts  |  100.00 |   100.00 |  100.00 |  100.00 |
 formatDate.ts      |  100.00 |   100.00 |  100.00 |  100.00 |
--------------------|---------|----------|---------|---------|-------------------
```

- **% Stmts**: 実行された文の割合
- **% Branch**: 分岐条件の網羅率
- **% Funcs**: 実行された関数の割合
- **% Lines**: 実行された行の割合
- **Uncovered Line #s**: カバーされていない行番号

---

## カバレッジ要件

### 必達目標

**100%カバレッジ必達（原則）**

| 指標 | 目標 |
|------|------|
| Statements | 100% |
| Branch | 100% |
| Functions | 100% |
| Lines | 100% |

### カバレッジ未達の対応

#### 1. テストを追加

最も基本的な対応。

```typescript
// Given: エッジケース入力
// When: 処理を実行
// Then: 期待される結果
```

#### 2. リファクタリング

テストが書きにくい場合、設計を見直す。

```typescript
// NG: 悪い例（テストしにくい）
function complexFunction(data: any) {
  if (data.type === 'A') {
    // 複雑な処理
  } else if (data.type === 'B') {
    // 複雑な処理
  }
}

// OK: 良い例（テストしやすい）
function processTypeA(data: TypeAData) {
  // A専用の処理
}

function processTypeB(data: TypeBData) {
  // B専用の処理
}

function complexFunction(data: Data) {
  if (data.type === 'A') {
    return processTypeA(data);
  } else if (data.type === 'B') {
    return processTypeB(data);
  }
}
```

#### 3. istanbul ignoreコメント

どうしてもテスト不可能な場合のみ使用（最終手段・レビュー必須）。

```typescript
/* istanbul ignore next - only executed in non-test environments */
if (process.env.NODE_ENV !== 'test') {
  await new Promise(resolve => setTimeout(resolve, delay));
}
```

**使用条件**:
- テスト環境では実行できないコード
- 外部環境に強く依存するコード
- コメントで理由を明記


## まとめ

- **Given-When-Then**: すべてのテストに必須
- **1テスト1検証**: 論理的関心事ごとに分割
- **ループ禁止**: test.eachでパラメータ化
- **カバレッジ**: 100%必達
- **命名**: `*.test.ts` または `*.test.tsx`
- **観点**: 正常系・異常系・エッジケース・境界値をすべてテスト
- **モック**: 外部依存を適切にモック化
- **独立性**: 各テストは独立して実行可能
- **責務**: 機能開発者がテスト実装まで責任を持つ

テストは品質保証の最後の砦です。テストが書けないコードは設計を見直すべきです。
