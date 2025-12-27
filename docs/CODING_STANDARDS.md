# コーディング規約

AI_Linkage_PoCプロジェクトにおけるコーディング規約を定義します。
この規約は **必ず遵守** してください。

開発環境構築・ワークフローについては [DEVELOPMENT.md](DEVELOPMENT.md) を参照してください。

---

## 目次

1. [命名規則](#1-命名規則)
2. [コードスタイル](#2-コードスタイル)
3. [型安全性](#3-型安全性)
4. [エラーハンドリング](#4-エラーハンドリング)
5. [ロギング規約](#5-ロギング規約)
6. [型定義管理](#6-型定義管理)
7. [定数管理](#7-定数管理)
8. [コメント方針](#8-コメント方針)
9. [パスエイリアス](#9-パスエイリアス)
10. [開発アンチパターン](#10-開発アンチパターン)
11. [チェックリスト](#11-チェックリスト)

---

## 1. 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| ファイル・ディレクトリ | camelCase | `photoProcessor.ts`, `generatePrompt/` |
| 型定義 | PascalCase | `RequestBody`, `AiResult`, `Photo` |
| 定数 | UPPER_SNAKE_CASE | `AI_TYPE`, `RATE_LIMITS` |
| 変数・関数 | camelCase | `handlePhotoProcessing`, `angleStates` |
| クラス | PascalCase | `PhotoProcessor`, `ContextCacheManager` |

**詳細**: [guides/NAMING_CONVENTIONS.md](/docs/guides/NAMING_CONVENTIONS.md)

---

## 2. コードスタイル

### ツール設定

- **Prettier**: コードフォーマット自動化（`npm run fmt`）
  - 設定ファイル: `app/.prettierrc`
  - printWidth: 80, singleQuote: true, semi: true
- **ESLint**: Next.js Core Web Vitals設定（`.eslintrc.json`）
- **TypeScript**: 厳格な型チェック（`tsconfig.json`）

### インポート順序

**パスエイリアスを使用し、相対パス（`./`, `../`）でのimportは禁止**

1. 外部ライブラリ
2. 内部モジュール（パスエイリアス使用）

**詳細**: [guides/CODE_STYLE.md](/docs/guides/CODE_STYLE.md)

---

## 3. 型安全性

### 原則

- **`any` 型の使用は原則禁止**
- 型推論を活用し、明示的な型指定は必要最小限に
- 外部ライブラリの型不足は `app/types/` で補完

### 代替手法

- `unknown` + 型ガード
- ジェネリクス
- ユニオン型

**詳細**: [guides/TYPE_SAFETY.md](/docs/guides/TYPE_SAFETY.md)

---

## 4. エラーハンドリング

### 原則

- **`catch (error: unknown)` を必ず使用**
- 型ガードでエラーの型を安全に絞り込む
- すべてのエラーをロガーで記録

### 基本パターン

```typescript
try {
  await operation();
} catch (error: unknown) {
  if (error instanceof Error) {
    logger.error('Operation failed', error);
  }
  throw error;
}
```

**詳細**: [guides/ERROR_HANDLING.md](/docs/guides/ERROR_HANDLING.md)

---

## 5. ロギング規約

### 原則

- **console.log/error/warn等の直接使用禁止**
- **必ず `@/utils/logger` を使用**
- 構造化データとしてコンテキストを記録
- 機密情報のログ出力禁止

### ログレベル

- **info**: 通常の操作フロー
- **warn**: 異常だが処理継続可能
- **error**: エラー発生

### 基本パターン

```typescript
import { logger } from '@/utils/logger';

logger.info('Processing started', { taskId: '123' });
logger.warn('Retrying request', { attempt: 2 });
logger.error('Operation failed', error, { taskId: '123' });
```

**詳細**: [guides/LOGGING.md](/docs/guides/LOGGING.md)

---

## 6. 型定義管理

### 原則

- **すべての型定義は `app/types/` に配置する**
- 型定義は責務ごとにファイル分割する（例: `photo.ts`, `asset.ts`, `cache.ts`, `config.ts`）
- 外部ライブラリ依存型も `app/types/` に配置する

### 禁止事項

- 機能固有ディレクトリ（`utils/`, `src/`など）での型定義
- 複数の責務が混在した型定義ファイル
- `app/types/` 以外での型定義ファイル作成

---

## 7. 定数管理

### 原則

- **すべての定数は `app/constants/general.ts` の `Constants` モジュール内で管理する**
- マジックナンバー・マジック文字列は禁止

### パターン

```typescript
// app/constants/general.ts
export module Constants {
  export const AI_TYPE = {
    GPT_4O: 'gpt-4o',
    GEMINI_2_FLASH: 'gemini-2.0-flash',
  } as const;
}
```

**詳細**: [guides/CONSTANTS.md](/docs/guides/CONSTANTS.md)

---

## 8. コメント方針

### 原則

**コードは自己説明的であるべきです。JSDoc、処理説明、TODOコメント等は禁止。**

### 許可される2種類のコメント

#### 1. ツール制御コメント

テストカバレッジツール、リンター等の制御に技術的に必須なコメント。

```typescript
/* istanbul ignore next - only executed in non-test environments */
if (process.env.NODE_ENV !== 'test') {
  await new Promise(resolve => setTimeout(resolve, delay));
}
```

#### 2. 業務ロジック分岐説明

電力会社別・設備種別のドメイン知識を含む業務ルール分岐の説明（最小限）。

```typescript
// HEPCO用の画角処理
if (angleLabel.startsWith('POWER_POLE_HEPCO_')) {
  return getPowerPoleHepco(angleLabel, photosGroup);
}
```

**詳細**: [guides/COMMENT_POLICY.md](/docs/guides/COMMENT_POLICY.md)

---

## 9. パスエイリアス

プロジェクトでは以下のパスエイリアスを使用します：

| エイリアス | 実パス | 用途 |
|-----------|--------|------|
| `@/` | `app/src/` | ソースコード |
| `@type/` | `app/types/` | 型定義 |
| `@const/` | `app/constants/` | 定数 |
| `@client/` | `app/clients/` | 外部サービスクライアント |
| `@config/` | `app/configs/` | 設定ファイル |

### 使用例

```typescript
import { Photo, AiResult } from '@type/photo';
import { Constants } from '@const/general';
import { generatePrompt } from '@/utils/generatePrompt';
```

---

## 10. 開発アンチパターン

以下のアンチパターンを避けてください：

- **Pre-parsing antipattern**: 早期解析で柔軟性低下
- **マジック値の散在**: 可読性・保守性低下
- **責務の混在**: ファイル肥大化
- **早すぎる抽象化**: 複雑化（Rule of Three）
- **神オブジェクト**: 保守性低下

**詳細**: [guides/ANTI_PATTERNS.md](/docs/guides/ANTI_PATTERNS.md)

---

## 11. チェックリスト

新規コードを追加する際は、以下を確認してください：

- [ ] 命名規則に従っているか（[guides/NAMING_CONVENTIONS.md](/docs/guides/NAMING_CONVENTIONS.md)）
- [ ] `any` 型を使用していないか（[guides/TYPE_SAFETY.md](/docs/guides/TYPE_SAFETY.md)）
- [ ] `catch (error: unknown)` を使用しているか（[guides/ERROR_HANDLING.md](/docs/guides/ERROR_HANDLING.md)）
- [ ] `@/utils/logger` を使用しているか（[guides/LOGGING.md](/docs/guides/LOGGING.md)）
- [ ] 型定義は `app/types/` に配置しているか
- [ ] 定数は `app/constants/general.ts` の `Constants` モジュールに追加しているか
- [ ] パスエイリアスを正しく使用しているか（相対パス禁止）
- [ ] マジックナンバー・マジック文字列がないか（[guides/CONSTANTS.md](/docs/guides/CONSTANTS.md)）
- [ ] インポート順序は正しいか（外部→内部）
- [ ] テスト・コミット・ドキュメントは規約に従っているか（[DEVELOPMENT.md](/docs/DEVELOPMENT.md)）
- [ ] 開発アンチパターンを避けているか（[guides/ANTI_PATTERNS.md](/docs/guides/ANTI_PATTERNS.md)）
- [ ] 禁止されたコメントを使用していないか（[guides/COMMENT_POLICY.md](/docs/guides/COMMENT_POLICY.md)）

---

この規約に従うことで、コードの一貫性が保たれ、保守性が大幅に向上します。
