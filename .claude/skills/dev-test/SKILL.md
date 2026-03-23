---
name: dev:test
description: |
  ReSaveの変更に関連するテストを実行するスキル。
  変更ファイルを自動検知して関連テストを特定し実行する。
  --all で全テスト、--e2e でE2Eも実行。
allowed-tools: Bash, Glob
---

# テスト実行スキル

変更ファイルを検知して関連テストを自動で実行する。

## 引数

- `--all`: 全テストを実行（変更ファイルの検知をスキップ）
- `--e2e`: E2Eテストも実行（デフォルトは省略）
- `--skip-typecheck`: TypeCheckをスキップ

## フロー

### Step 1: 変更ファイルを特定

```bash
git diff --name-only HEAD
git diff --name-only --cached
```

`--all` 引数の場合はこのステップをスキップ。

### Step 2: テストファイルを推定

変更ファイルのパスからテストファイルを推定する。

**パスのマッピング規則:**
```
apps/web/src/<path>/<file>.ts
→ apps/web/src/__tests__/<path>/<file>.test.ts
または
apps/web/src/<path>/__tests__/<file>.test.ts
```

**例:**
```
apps/web/src/hooks/useHomeCards.ts
→ apps/web/src/hooks/__tests__/useHomeCards.test.ts

apps/web/src/actions/cards.ts
→ apps/web/src/actions/__tests__/cards.test.ts
または apps/web/src/__tests__/actions/cards.test.ts

apps/web/src/app/(main)/page.tsx
→ apps/web/src/app/(main)/__tests__/page.test.tsx
```

存在するテストファイルのみを実行対象とする（Globで確認）。

### Step 3: TypeCheck実行

```bash
cd apps/web && npx tsc --noEmit 2>&1
```

**既知の既存TSエラーは無視する（失敗扱いにしない）:**
- テストファイルの `RefObject` キャスト関連
- `matchMedia` モック関連
- `afterEach` import 関連

エラーが既存4件を超えた場合のみ失敗として報告する。

`--skip-typecheck` 引数の場合はこのステップをスキップ。

### Step 4: Unit test実行

**対象テストファイルがある場合:**
```bash
cd apps/web && pnpm test -- --run <テストファイルパス>
```

**`--all` の場合:**
```bash
cd apps/web && pnpm test -- --run
```

**既知の既存失敗テストは無視する:**
- `src/__tests__/validations/tag.test.ts` の7件（カラーバリデーションスキーマ不一致）

### Step 5: E2Eテスト実行（オプション）

`--e2e` 引数がある場合のみ実行:

```bash
cd apps/web && pnpm test:e2e
```

### Step 6: 結果報告

以下の形式で結果を表示する:

```
テスト結果:
| 項目        | 結果   | 詳細                    |
|------------|--------|------------------------|
| TypeCheck  | PASS   | エラーなし               |
| Unit test  | PASS   | 12 passed, 0 failed    |
| E2E test   | SKIP   | --e2e 引数なし           |
```

失敗がある場合はエラー内容を表示する。

## 注意事項

- `apps/web` ディレクトリで実行することを前提とする
- テストファイルが見つからない場合は全テストを実行するか確認する
