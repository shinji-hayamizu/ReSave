# Vitestカバレッジ設定

本ドキュメントはVitest 2.xにおけるカバレッジ設定と確認方法を説明します。

## 前提知識

カバレッジの原則については以下を参照：
- [docs/testing/COVERAGE.md](docs/testing/COVERAGE.md) - カバレッジ原則（100%厳守）

---

## カバレッジ実行

### 基本コマンド

```bash
# プロジェクトルートから実行
docker-compose exec {service-name} pnpm test
```

### package.json設定

```json
{
  "scripts": {
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## vitest.config.ts設定

### 基本設定例

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

**注意**: サービス固有の除外設定は各サービスの `vitest.config.ts` を参照してください。

### 設定項目の説明

#### provider: 'v8'
- V8エンジンの組み込みカバレッジ機能を使用
- 高速で正確なカバレッジ計測

#### reporter
カバレッジレポートの出力形式:
- `'text'`: ターミナルに表示（基本）
- `'json'`: JSON形式で出力（CI/CD連携）
- `'html'`: HTMLレポート生成（オプション）
- `'lcov'`: CI/CDツール連携用

#### カバレッジ閾値（100%厳守）
```typescript
lines: 100,       // 行カバレッジ
functions: 100,   // 関数カバレッジ
branches: 100,    // 分岐カバレッジ
statements: 100,  // 文カバレッジ
```

**重要**: すべて100%を達成する必要があります。

#### exclude

カバレッジ計算から除外する基本パターン:

**共通の除外パターン:**
- `tests/**`: テストファイル自体
- `**/*.test.ts`, `**/*.test.tsx`: テストファイル
- `**/*.config.ts`: 設定ファイル
- `.next/**`: Next.jsビルド出力
- `types/**`: 型定義ファイル

**サービス固有の除外:**

各サービスで追加の除外が必要な場合、以下の条件を満たす場合のみ除外を検討してください：

1. **テスト環境で再現不可能**: Next.js middleware、環境依存の処理など
2. **外部ツールが生成**: コード生成ツールの出力
3. **デプロイ時のみ実行**: デプロイスクリプト

**重要**: 除外は最小限に留め、実行されるコードはすべてテストすべきです。

サービス固有の除外設定は各サービスの `vitest.config.ts` を参照してください。

---

## カバレッジレポートの確認

### ターミナル出力

```bash
# プロジェクトルートから実行
docker-compose exec {service-name} pnpm test
```

出力例:
```
 % Coverage report from v8
-----------------------|---------|----------|---------|---------|-------------------
File                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines
-----------------------|---------|----------|---------|---------|-------------------
All files              |     100 |      100 |     100 |     100 |
 lib/validation.ts     |     100 |      100 |     100 |     100 |
 lib/time.ts           |   85.71 |    66.66 |     100 |   85.71 | 25-30
-----------------------|---------|----------|---------|---------|-------------------
```

### 出力の読み方

- **% Stmts**: 文カバレッジ
- **% Branch**: 分岐カバレッジ
- **% Funcs**: 関数カバレッジ
- **% Lines**: 行カバレッジ
- **Uncovered Lines**: 未カバー行番号（例: `25-30`）

**重要**: `Uncovered Lines`列で未カバー箇所が即座に特定できる

---

## カバレッジ100%未達時の対処

### 1. 未カバー箇所の特定

ターミナル出力の`Uncovered Lines`列を確認:
```
lib/time.ts | 85.71 | 66.66 | 100 | 85.71 | 25-30
```
→ `lib/time.ts`の25-30行目が未カバー

### 2. 原因の分類

#### ケース1: テストケース不足
**症状**: 特定の条件分岐がカバーされていない

**対処**:
```typescript
// 未カバー: else分岐
if (value > 100) {
  return 'large';
}
return 'normal';
```

追加テスト:
```typescript
it('値が100以下の場合: "normal"を返す', () => {
  expect(categorize(50)).toBe('normal');
});
```

#### ケース2: エラーハンドリング未テスト
**症状**: catchブロックがカバーされていない

**対処**:
```typescript
it('エラー発生: エラーをthrowする', async () => {
  // Given
  mockFetch.mockRejectedValue(new Error('Network error'));

  // When & Then
  await expect(fetchData()).rejects.toThrow('Network error');
});
```

#### ケース3: 早期リターン未テスト
**症状**: ガード節がカバーされていない

**対処**:
```typescript
it('データがnullの場合: デフォルト値を返す', () => {
  expect(process(null)).toBe(DEFAULT_VALUE);
});
```

### 3. 再度カバレッジ確認

```bash
# プロジェクトルートから実行
docker-compose exec {service-name} pnpm test
```

100%達成まで繰り返し。

---

## CI/CD統合

### GitHub Actions例

CI環境ではサービスディレクトリ内で直接実行します（docker-compose環境が不要な場合）:

```yaml
- name: Run tests with coverage
  working-directory: services/attendance
  run: pnpm test

- name: Check coverage threshold
  run: |
    if [ $(jq '.total.lines.pct' coverage/coverage-summary.json) != "100" ]; then
      echo "Coverage is not 100%"
      exit 1
    fi
```

カバレッジが100%未満の場合、CIが失敗します。

---

## オプション: HTMLレポート

詳細な視覚的確認が必要な場合のみ使用:

```bash
# プロジェクトルートから実行（テスト実行でHTMLレポートも生成）
docker-compose exec attendance pnpm test

# ブラウザで表示（サービスディレクトリ内のcoverageフォルダ）
open services/attendance/coverage/index.html
```

HTMLレポートでは:
- ファイルごとのカバレッジ詳細
- 未カバー行のハイライト表示
- 分岐ごとのカバレッジ状況

**注意**: 通常はターミナル出力で十分。HTMLレポートは例外的な調査時のみ使用。

---

## よくある質問

### Q1: カバレッジ100%なのにバグがある

**A**: カバレッジ100%は「すべてのコードが実行された」ことを示すだけで、ロジックの正しさは保証しません。

**対策**:
- 期待値を正しく設定する
- エッジケースをテストする
- 複数の入力パターンでテストする

詳細: [docs/testing/COVERAGE.md](docs/testing/COVERAGE.md)

### Q2: サービス固有の除外設定を追加したい

**A**: 各サービスの`vitest.config.ts`で設定し、コメントで除外理由を明記してください。

除外が正当化される条件は、本ドキュメントの「exclude」セクションを参照してください。

例:
```typescript
exclude: [
  'tests/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.config.ts',
  '.next/**',
  'types/**',
  'src/middleware.ts'  // Next.js内部で実行されるため、テスト環境で再現困難
]
```

**注意**: 除外は最小限に留め、実行されるコードはすべてテストすべきです。

---

## まとめ

### Vitestカバレッジの特徴

1. **V8プロバイダー**: 高速で正確
2. **100%厳守**: すべてのメトリクスで100%必須
3. **ターミナル出力**: `Uncovered Lines`で即座に未カバー箇所を特定
4. **CI/CD統合**: カバレッジ未達でビルド失敗

### チェックリスト

- [ ] `vitest.config.ts`でカバレッジ設定が正しい
- [ ] すべてのメトリクスが100%
- [ ] ターミナル出力で未カバー箇所がない
- [ ] 除外設定が適切（最小限）
- [ ] コミット前に`docker-compose exec {service-name} pnpm test`を実行

---

## 関連ドキュメント

- [docs/testing/COVERAGE.md](docs/testing/COVERAGE.md) - カバレッジ原則
- [docs/testing/typescript/OVERVIEW.md](docs/testing/typescript/OVERVIEW.md) - TypeScript/JavaScriptテストガイド
- [docs/testing/typescript/GUIDELINES.md](docs/testing/typescript/GUIDELINES.md) - テスト作成ガイドライン
