---
description: 結合テスト・E2Eテスト・全体動作確認
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, WebSearch, WebFetch
---

# Phase 5-A: 結合テスト・動作確認

## 前提
以下が完了済みであること:
- 全機能の実装（Phase 4）
- 開発環境で各機能が個別に動作確認済み

---

## 参照ドキュメント（必須読み込み）
- `docs/requirements/business-requirements.md`
- `docs/requirements/functions/_index.md`（画面遷移図）
- `docs/requirements/architecture.md`（テスト設計セクション）

## あなたの役割
QAエンジニア兼フロントエンドエンジニア。
ユーザー視点でのテストと品質保証を行う。

## 実行方法
このタスクは **ultrathink** で実行すること。

---

## Step 1: テスト計画の確認

### 1.1 テスト対象の確認

| カテゴリ | テスト対象 | 優先度 |
|---------|----------|-------|
| 認証 | ログイン、登録、ログアウト、パスワードリセット | P0 |
| コア機能 | [主要機能1], [主要機能2], [主要機能3] | P0 |
| 補助機能 | [補助機能1], [補助機能2] | P1 |
| 管理機能 | 管理画面（該当する場合） | P1 |

### 1.2 テストピラミッド確認

| 種別 | 目標比率 | ツール | 状態 |
|-----|---------|-------|------|
| ユニットテスト | 70% | Vitest | 完了/未完了 |
| コンポーネントテスト | 20% | Testing Library | 完了/未完了 |
| E2Eテスト | 10% | Playwright | 完了/未完了 |

---

## Step 2: E2Eテスト環境構築

### 2.1 Playwright インストール

```bash
pnpm add -D @playwright/test
npx playwright install
```

### 2.2 設定ファイル

#### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 2.3 テストユーティリティ

#### e2e/fixtures/auth.ts
```typescript
import { test as base, expect } from '@playwright/test'

// テストユーザー情報
export const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
}

// 認証済み状態のフィクスチャ
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // ログイン
    await page.goto('/login')
    await page.fill('input[type="email"]', TEST_USER.email)
    await page.fill('input[type="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('/')

    await use(page)
  },
})

export { expect }
```

---

## Step 3: E2Eテストシナリオ

### 3.1 認証フロー

#### e2e/auth.spec.ts
```typescript
import { test, expect } from '@playwright/test'

test.describe('認証フロー', () => {
  test('新規登録 -> ログイン -> ログアウト', async ({ page }) => {
    // 新規登録
    await page.goto('/signup')
    await page.fill('input[type="email"]', 'newuser@example.com')
    await page.fill('input[id="password"]', 'password123')
    await page.fill('input[id="confirmPassword"]', 'password123')
    await page.click('button[type="submit"]')

    // ダッシュボードにリダイレクト
    await expect(page).toHaveURL('/')

    // ログアウト
    await page.click('[data-testid="logout-button"]')
    await expect(page).toHaveURL('/login')
  })

  test('未認証ユーザーは保護されたページにアクセスできない', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('無効な認証情報でエラー表示', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=メールアドレスまたはパスワードが正しくありません')).toBeVisible()
  })
})
```

### 3.2 コア機能フロー

#### e2e/[feature].spec.ts
```typescript
import { test, expect } from './fixtures/auth'

test.describe('[機能名]フロー', () => {
  test('作成 -> 一覧表示 -> 編集 -> 削除', async ({ authenticatedPage: page }) => {
    // 一覧ページへ移動
    await page.goto('/[resources]')

    // 新規作成
    await page.click('text=新規作成')
    await page.fill('input[name="field1"]', 'テストデータ')
    await page.click('button[type="submit"]')

    // 一覧に表示されることを確認
    await expect(page.locator('text=テストデータ')).toBeVisible()

    // 編集
    await page.click('[data-testid="edit-button"]')
    await page.fill('input[name="field1"]', '編集後データ')
    await page.click('button[type="submit"]')

    // 編集が反映されることを確認
    await expect(page.locator('text=編集後データ')).toBeVisible()

    // 削除
    await page.click('[data-testid="delete-button"]')
    await page.click('text=削除する')

    // 一覧から消えることを確認
    await expect(page.locator('text=編集後データ')).not.toBeVisible()
  })
})
```

### 3.3 クロスファンクションテスト

#### e2e/integration.spec.ts
```typescript
import { test, expect } from './fixtures/auth'

test.describe('機能間連携', () => {
  test('完全なユーザーフロー', async ({ authenticatedPage: page }) => {
    // [機能1] でデータ作成
    await page.goto('/[feature1]')
    await page.click('text=新規作成')
    await page.fill('input[name="name"]', 'テスト項目')
    await page.click('button[type="submit"]')

    // [機能2] で連携確認
    await page.goto('/[feature2]')
    await expect(page.locator('text=テスト項目')).toBeVisible()

    // [機能3] で最終確認
    await page.goto('/[feature3]')
    await expect(page.locator('[data-testid="summary"]')).toContainText('テスト項目')
  })
})
```

---

## Step 4: テスト実行

### 4.1 ユニットテスト

```bash
pnpm test
pnpm test:coverage
```

### 4.2 E2Eテスト

```bash
# ヘッドレスモード
pnpm exec playwright test

# UIモード（デバッグ用）
pnpm exec playwright test --ui

# 特定のテストのみ
pnpm exec playwright test auth.spec.ts
```

### 4.3 カバレッジ確認

```bash
# カバレッジレポート生成
pnpm test:coverage

# 目標
# - Lines: 80%以上
# - Functions: 80%以上
# - Branches: 70%以上
```

---

## Step 5: 手動テスト

### 5.1 画面遷移テスト

functions/_index.md の画面遷移図に沿って、全画面を確認:

| No | 画面 | 遷移元 | 遷移先 | 確認 |
|----|-----|-------|-------|-----|
| 1 | ログイン | - | ダッシュボード | [ ] |
| 2 | ダッシュボード | ログイン | [機能1] | [ ] |
| 3 | [機能1] | ダッシュボード | [機能1詳細] | [ ] |
| ... | ... | ... | ... | [ ] |

### 5.2 レスポンシブテスト

| デバイス | 画面幅 | 確認項目 | 状態 |
|---------|-------|---------|-----|
| Desktop | 1920px | 全画面表示 | [ ] |
| Laptop | 1366px | 全画面表示 | [ ] |
| Tablet | 768px | レイアウト切替 | [ ] |
| Mobile | 375px | モバイルナビ | [ ] |

### 5.3 ブラウザテスト

| ブラウザ | バージョン | 確認 |
|---------|----------|-----|
| Chrome | 最新 | [ ] |
| Safari | 最新 | [ ] |
| Firefox | 最新 | [ ] |
| Edge | 最新 | [ ] |

---

## Step 6: バグ修正

### 6.1 バグトラッキング

発見したバグを記録:

| ID | 画面 | 重要度 | 説明 | 状態 |
|----|-----|-------|-----|-----|
| BUG-001 | ... | P0/P1/P2 | ... | Open/Fixed |

### 6.2 修正作業

優先度順にバグを修正:

1. **P0（ブロッカー）**: 即時対応
2. **P1（重要）**: リリース前に対応
3. **P2（軽微）**: リリース後対応可

---

## Step 7: UI微調整

### 7.1 視覚的確認

- [ ] フォントサイズ・行間が適切
- [ ] 色のコントラストが十分
- [ ] アイコンのサイズが統一
- [ ] 余白・間隔が統一
- [ ] ローディング表示が適切
- [ ] エラー表示が分かりやすい

### 7.2 アクセシビリティ

- [ ] キーボードナビゲーション可能
- [ ] フォーカス状態が視認できる
- [ ] alt属性が設定されている
- [ ] aria-label が適切
- [ ] 色だけに依存していない

### 7.3 Lighthouse スコア

```bash
# 開発サーバーでLighthouse実行
# Chrome DevTools > Lighthouse タブ

# 目標スコア
# - Performance: 80以上
# - Accessibility: 90以上
# - Best Practices: 90以上
# - SEO: 80以上
```

---

## Step 8: テスト結果サマリー

### 8.1 テストカバレッジ

| 種別 | 目標 | 実績 | 状態 |
|-----|-----|-----|-----|
| Lines | 80% | X% | [ ] |
| Functions | 80% | X% | [ ] |
| Branches | 70% | X% | [ ] |

### 8.2 E2Eテスト結果

| シナリオ | 件数 | パス | 失敗 |
|---------|-----|-----|-----|
| 認証 | X | X | X |
| [機能1] | X | X | X |
| [機能2] | X | X | X |
| 統合 | X | X | X |
| **合計** | X | X | X |

### 8.3 未解決バグ

| 重要度 | 件数 | 対応方針 |
|-------|-----|---------|
| P0 | X | リリース前に修正必須 |
| P1 | X | リリース前に修正必須 |
| P2 | X | リリース後対応可 |

---

## 完了条件

- [ ] ユニットテストのカバレッジが目標を達成
- [ ] E2Eテストが全てパス
- [ ] 手動テストが完了
- [ ] P0/P1バグが全て修正済み
- [ ] レスポンシブ対応が確認済み
- [ ] アクセシビリティが確認済み
- [ ] Lighthouseスコアが目標を達成

---

## 完了後のアクション

```
## 結合テスト・動作確認が完了しました

### テスト結果サマリー
| 項目 | 結果 |
|-----|------|
| ユニットテスト | X/X パス (カバレッジ X%) |
| E2Eテスト | X/X パス |
| 手動テスト | 完了 |
| バグ修正 | P0: X件, P1: X件 修正済み |

### 品質指標
| 指標 | 目標 | 実績 |
|-----|-----|-----|
| テストカバレッジ | 80% | X% |
| Lighthouse Performance | 80 | X |
| Lighthouse Accessibility | 90 | X |

### 残タスク
- [ ] P2バグ X件（リリース後対応）

リリース準備が整いました。
次のステップ: `/phase-5-release/deploy`
```

---

## 次のステップ
`/phase-5-release/deploy` - デプロイ・運用準備
