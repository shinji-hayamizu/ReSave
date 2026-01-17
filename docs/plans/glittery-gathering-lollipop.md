# UIテスト品質向上 + subAgent化 計画

## 目標
1. 全11画面のE2Eテスト自動化（現在35.6% → 100%）
2. subAgent（スキル）として実行可能にする

## 現状分析

| 項目 | 状況 |
|------|------|
| 全画面数 | 11画面 |
| 実行中テスト | 16件（認証不要画面のみ） |
| スキップ中 | 29件（認証必要画面） |
| テストなし画面 | 3画面（パスワード更新、統計、設定） |
| **テスト実行率** | **35.6%** |

### 最大の課題
**認証が必要な画面のテストが全てスキップ状態**
- 原因: テスト用認証情報・セッション管理が未整備
- 解決策: Playwright storageState を使用

---

## 実装計画

### Phase 1: 認証テスト環境整備（必須）

#### 1.1 テスト用認証セットアップファイル作成
```
apps/web/e2e/
├── auth.setup.ts        # 認証セットアップ（新規）
├── .auth/               # 認証状態保存ディレクトリ（新規）
│   └── user.json        # storageState保存先
└── playwright.config.ts # 更新
```

#### 1.2 playwright.config.ts 更新
- `projects` にsetup projectを追加
- 認証済みprojectを追加（storageState使用）

#### 1.3 環境変数設定
- `TEST_USER_EMAIL` / `TEST_USER_PASSWORD` をCI/ローカル両対応

### Phase 2: スキップ中テストの有効化（29テスト）

| ファイル | テスト数 | 対象画面 |
|---------|---------|---------|
| cards.spec.ts | 16 | ホーム、カード新規作成、カード編集 |
| tags.spec.ts | 18 | タグ管理 |
| ui-regression.spec.ts | 9 | UI回帰テスト |

- `test.skip` を削除
- 認証済みprojectで実行するように変更

### Phase 3: テストなし画面のテスト追加（3画面）

| 画面 | 優先度 | テスト内容 |
|------|--------|----------|
| 統計 `/stats` | 高 | 本日サマリー表示、チャート表示 |
| 設定 `/settings` | 中 | 各設定セクション表示 |
| パスワード更新 `/update-password` | 低 | フォーム表示、バリデーション |

### Phase 4: スキル化（subAgent対応）

#### 4.1 スキルファイル作成
```
.claude/skills/e2e-test-all/
└── SKILL.md
```

#### 4.2 スキル設計
```yaml
name: e2e-test-all
description: 全画面E2Eテスト実行。UIテストを一括実行、テスト失敗時の修正提案を行う。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, TodoWrite
```

#### 4.3 機能
- 全テスト実行 (`pnpm test:e2e`)
- 失敗テストの分析・修正提案
- スクリーンショット取得・比較（オプション）

---

## ファイル変更一覧

| ファイル | 変更内容 |
|---------|---------|
| `apps/web/playwright.config.ts` | setup project追加、storageState設定 |
| `apps/web/e2e/auth.setup.ts` | 新規: 認証セットアップ |
| `apps/web/e2e/cards.spec.ts` | test.skip削除、認証project使用 |
| `apps/web/e2e/tags.spec.ts` | test.skip削除、認証project使用 |
| `apps/web/e2e/ui-regression.spec.ts` | test.skip削除、認証project使用 |
| `apps/web/e2e/stats.spec.ts` | 新規: 統計画面テスト |
| `apps/web/e2e/settings.spec.ts` | 新規: 設定画面テスト |
| `.claude/skills/e2e-test-all/SKILL.md` | 新規: スキル定義 |
| `.gitignore` | `.auth/` 追加 |

---

## 実行コマンド（完成後）

```bash
# 全テスト実行
pnpm test:e2e

# スキル経由で実行
/e2e-test-all

# 特定画面のみ
/e2e-test-all --grep "統計"
```

---

## 期待される成果

| 指標 | Before | After |
|------|--------|-------|
| テスト実行率 | 35.6% | 100% |
| 実行中テスト | 16件 | 60件以上 |
| テストカバー画面 | 8/11 | 11/11 |
| スキル化 | なし | あり |

---

## 確認済み事項

- [x] **テスト用アカウント**: 既に存在する
- [x] **Visual Regression**: 追加する（スクリーンショット比較）
- [x] **CI対応**: 今は不要（ローカル実行のみ）

---

## 詳細実装手順

### Step 1: playwright.config.ts 更新
```typescript
// 追加内容
projects: [
  { name: 'setup', testMatch: /auth\.setup\.ts/ },
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      storageState: 'e2e/.auth/user.json',
    },
    dependencies: ['setup'],
  },
]
```

### Step 2: auth.setup.ts 作成
```typescript
import { test as setup, expect } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('メールアドレス').fill(process.env.TEST_USER_EMAIL!);
  await page.getByLabel('パスワード').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await expect(page).toHaveURL('/');
  await page.context().storageState({ path: authFile });
});
```

### Step 3: Visual Regression テスト追加
```typescript
// 各画面のスナップショットテスト
test('ホーム画面のスナップショット', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('home.png', {
    maxDiffPixels: 100,
  });
});
```

### Step 4: スキル定義（e2e-test-all/SKILL.md）
```yaml
name: e2e-test-all
description: 全画面E2Eテスト実行・失敗時の修正提案
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, TodoWrite
```

---

## 新規作成ファイル

1. `apps/web/e2e/auth.setup.ts` - 認証セットアップ
2. `apps/web/e2e/stats.spec.ts` - 統計画面テスト
3. `apps/web/e2e/settings.spec.ts` - 設定画面テスト
4. `apps/web/e2e/visual.spec.ts` - Visual Regressionテスト
5. `.claude/skills/e2e-test-all/SKILL.md` - スキル定義

## 更新ファイル

1. `apps/web/playwright.config.ts` - setup project追加
2. `apps/web/e2e/cards.spec.ts` - test.skip削除
3. `apps/web/e2e/tags.spec.ts` - test.skip削除
4. `apps/web/e2e/ui-regression.spec.ts` - test.skip削除
5. `apps/web/.gitignore` - `.auth/`, `test-results/` 追加
