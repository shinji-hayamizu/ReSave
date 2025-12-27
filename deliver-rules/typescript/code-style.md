---
paths: "**/*.{ts,tsx}"
---

# コードスタイルガイド

## 目次

1. [基本原則](#基本原則)
2. [命名規則](#命名規則)
3. [Prettier設定](#prettier設定)
4. [ESLint設定](#eslint設定)
5. [TypeScript設定](#typescript設定)
6. [インポート順序](#インポート順序)
7. [コメント方針](#コメント方針)
8. [定数管理](#定数管理)
9. [エラーハンドリング](#エラーハンドリング)
10. [ロギング](#ロギング)

---

## 基本原則

### なぜコードスタイルが重要か

一貫したコードスタイルは、チーム開発における摩擦を減らし、コードレビューの効率を向上させます。

**コードスタイル統一のメリット**:
1. **可読性向上**: 誰が書いても同じスタイル
2. **レビュー効率化**: スタイルではなくロジックに集中できる
3. **差分の最小化**: 不要なフォーマット変更を防ぐ
4. **自動化**: ツールで機械的にチェック・修正

---

## 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| ファイル名 | kebab-case | `user-profile.ts`, `api-client.tsx` |
| 変数 | camelCase | `userName`, `isLoading` |
| 型・クラス | PascalCase | `UserProfile`, `ApiClient` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |

---

## Prettier設定

### 原則

- **Prettierで自動フォーマット**: `npm run fmt`
- **設定ファイル**: `app/.prettierrc`
- **手動整形禁止**: Prettierに任せる

### 設定内容

```json
{
  "printWidth": 80,
  "singleQuote": true,
  "semi": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### 各設定の意味

#### printWidth: 80

1行の最大文字数を80文字に制限。

**理由**:
- 横スクロールなしで読める
- サイドバイサイド比較が容易
- 長すぎる行は可読性を低下させる

**例**:
```typescript
// 80文字で自動的に折り返される
const result = await processPhoto(
  photoId,
  angleLabel,
  options
);
```

---

#### singleQuote: true

文字列にシングルクォートを使用。

**理由**:
- TypeScript/JavaScriptの一般的な慣習
- JSONではダブルクォートを使うため、区別が明確
- shift不要で入力が楽

**例**:
```typescript
// 正しい
const message = 'Hello World';
const url = '/api/process';

// ダブルクォートは不要
const message = "Hello World";
```

---

#### semi: true

文末にセミコロンを追加。

**理由**:
- ASI（Automatic Semicolon Insertion）の落とし穴を回避
- 意図しないエラーを防止
- TypeScriptの標準的な慣習

**例**:
```typescript
// 正しい
const x = 1;
const y = 2;

// セミコロンなしは非推奨
const x = 1
const y = 2
```

---

#### trailingComma: "es5"

ES5互換の末尾カンマを使用。

**理由**:
- オブジェクト・配列の最後の要素にカンマを付ける
- 要素追加時の差分が最小化される
- 関数引数には付けない（ES5互換）

**例**:
```typescript
// 正しい
const obj = {
  a: 1,
  b: 2,
};

const arr = [
  'item1',
  'item2',
];

// 関数引数には付けない
function foo(
  a: number,
  b: number
) {}
```

---

#### tabWidth: 2

インデントは2スペース。

**理由**:
- JavaScriptコミュニティの標準
- ネストが深くなっても読みやすい
- ファイルの横幅を節約

**例**:
```typescript
function foo() {
  if (condition) {
    doSomething();
  }
}
```

---

#### useTabs: false

タブではなくスペースを使用。

**理由**:
- 異なるエディタでの表示が統一される
- タブ幅の設定差異によるズレを防止

---

#### arrowParens: "always"

アロー関数の引数を常に括弧で囲む。

**理由**:
- 引数追加時の差分が最小化される
- TypeScript型注釈との整合

**例**:
```typescript
// 正しい
const increment = (x) => x + 1;
const double = (x: number) => x * 2;

// 括弧なしは非推奨（引数が1つでも括弧を付ける）
const increment = x => x + 1;
```

---

#### endOfLine: "lf"

Unix形式の改行（LF）を使用。

**理由**:
- クロスプラットフォーム対応
- Gitでの差分を最小化
- CRLFとの混在を防止

---

## ESLint設定

### 原則

- **Next.js Core Web Vitals設定**: `.eslintrc.json`
- **実行コマンド**: `npm run lint`

### 設定内容

```json
{
  "extends": "next/core-web-vitals"
}
```

### カバー範囲

- React Hooksのルール
- Next.js固有のベストプラクティス
- アクセシビリティ基本ルール
- パフォーマンス最適化

---

## TypeScript設定

### 原則

- **厳格な型チェック**: `tsconfig.json`
- **型安全性を最優先**

### 主要設定

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "useUnknownInCatchVariables": true
  }
}
```

### 各設定の効果

- **strict**: すべての厳格オプションを有効化
- **noImplicitAny**: 暗黙のany型を禁止
- **strictNullChecks**: null/undefinedの厳密チェック
- **useUnknownInCatchVariables**: catch句の型をunknownに

---

## インポート順序

### 原則

**パスエイリアスを使用し、相対パスでのimportは禁止**

### 順序ルール

1. 外部ライブラリ
2. 内部モジュール（パスエイリアス使用）

### 正しい例

```typescript
// 1. 外部ライブラリ
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';

// 2. 内部モジュール（パスエイリアス使用）
import { Constants } from '@const/general';
import { Photo, AiResult } from '@type/photo';
import { handlePhotoProcessing } from '@/utils/photoProcessingHandler';
import { formatPrompt } from '@/utils/formatPrompt';
```

### 禁止事項

**相対パス（`./`, `../`）でのimportは禁止**

```typescript
// 禁止
import { formatPrompt } from './formatPrompt';
import { helper } from '../helpers';
import { Photo } from '../../types/photo';

// 正しい
import { formatPrompt } from '@/utils/formatPrompt';
import { helper } from '@/helpers';
import { Photo } from '@type/photo';
```

### 理由

- ファイル移動時の変更が最小限
- インポート元の場所が一目で分かる
- 同一ディレクトリ内でも統一性を保つ

### パスエイリアス一覧

| エイリアス | 実パス | 用途 |
|-----------|--------|------|
| `@/` | `app/src/` | ソースコード |
| `@type/` | `app/types/` | 型定義 |
| `@const/` | `app/constants/` | 定数 |
| `@client/` | `app/clients/` | 外部サービスクライアント |
| `@config/` | `app/configs/` | 設定ファイル |

---

## フォーマット実行

### コミット前

変更ファイルをすべてフォーマットしてからコミット。

```bash
# フォーマット実行
npm run fmt

# 差分確認
git diff

# コミット
git add .
git commit -m "[AI-DEV] update: feature description"
```

---

## コメント方針

### 原則

**コメント禁止** - TypeScriptの型システムとコードで意図を表現する。

### 許可される例外

1. **ツール制御コメント**: `istanbul ignore`, `@ts-expect-error`, `eslint-disable` 等
2. **業務ロジック分岐説明**: ドメイン固有の分岐理由（日本語、5行以内）

### 禁止されるコメント

- JSDocコメント（`/** ... */`）
- 処理説明コメント
- TODO/FIXMEコメント
- セクション区切りコメント（`// ===`）

### 代替手法

コメントの代わりに以下を使用：
- **命名改善**: 変数名・関数名で意図を表現
- **関数分割**: 複雑なロジックは名前付き関数に抽出
- **定数化**: マジックナンバーは定数名で根拠を表現
- **型定義**: 複雑なデータ構造は型で表現

詳細は [comment-policy.md](./comment-policy.md) を参照。

---

## 定数管理

### 原則

- **マジックナンバー・マジック文字列は禁止**
- **定数名は意味を明確に表現する**
- **`as const` を付与**（オブジェクト・配列定数）

### 命名規則

**UPPER_SNAKE_CASE** を使用。

### 定義パターン

```typescript
export const DOWNLOAD_CONFIG = {
  MAX_RETRIES: 3,
  TIMEOUT_MS: 30000,
  CHUNK_SIZE: 1024 * 1024,
} as const;

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_FAILED: 'AUTH_FAILED',
} as const;
```

### 禁止パターン

```typescript
// 禁止: マジックナンバー
await sleep(3000);

// 正しい
await sleep(DOWNLOAD_CONFIG.TIMEOUT_MS);
```

詳細は [constants.md](./constants.md) を参照。

---

## エラーハンドリング

### 原則

**`catch (error: unknown)` を必ず使用する**

### 基本パターン

```typescript
try {
  await operation();
} catch (error: unknown) {
  if (error instanceof Error) {
    logger.error('Operation failed', { error: error.message });
    throw error;
  }
  throw new Error(`Unknown error: ${String(error)}`);
}
```

### 禁止パターン

```typescript
// 禁止: any型
catch (error: any) { }

// 禁止: 型ガードなし
catch (error: unknown) {
  console.log(error.message); // エラー
}

// 禁止: エラー無視
catch (error: unknown) {
  // 何もしない
}
```

### パターン選択

| パターン | 使用場面 |
|---------|---------|
| 再スロー | ユーティリティ関数、上位でまとめて処理 |
| null返却 | オプショナル値、フォールバック可能な場合 |
| カスタムレスポンス | APIハンドラー |

詳細は [error-handling.md](./error-handling.md) を参照。

---

## ロギング

### 原則

- **loggerとLogContextを使用、`console.log`等は禁止**
- **構造化ロギング**: 固定メッセージ + LogContextオブジェクト

### LogContext型

```typescript
type LogContext = Record<string, string | number | boolean | null | undefined>;
```

### ログレベル

| レベル | 使用場面 |
|-------|---------|
| info | 通常の操作フロー（処理開始・完了） |
| warn | 異常だが処理継続可能（リトライ、フォールバック） |
| error | エラー発生（例外、処理失敗） |

### 基本パターン

```typescript
// 情報ログ
logger.info('Download started', { fileName, fileSize });

// 警告ログ
logger.warn('Retrying download', { attempt: 2, maxRetries: 3 });

// エラーログ
logger.error('Download failed', { error: error.message, fileName });
```

### 禁止パターン

```typescript
// 禁止: console使用
console.log('Processing started');

// 禁止: 可変データの文字列埋め込み
logger.info(`Processing ${fileName}`);

// 正しい
logger.info('Processing file', { fileName });
```

### 機密情報

パスワード・APIキー・トークン等のログ出力は禁止。

詳細は [logging.md](./logging.md) を参照。

---

## まとめ

- **命名規則**: ファイル名（kebab-case）、変数（camelCase）、型・クラス（PascalCase）、定数（UPPER_SNAKE_CASE）
- **Prettier**: 自動フォーマット（80文字、シングルクォート、セミコロン、2スペース）
- **TypeScript**: 厳格な型チェック
- **インポート**: パスエイリアス必須、相対パス禁止
- **コメント**: 原則禁止、ツール制御と業務ロジック分岐のみ例外
- **定数**: UPPER_SNAKE_CASE、`as const`、マジックナンバー禁止
- **エラー**: `catch (error: unknown)` + 型ガード必須
- **ロギング**: loggerとLogContext使用、console禁止、構造化ロギング