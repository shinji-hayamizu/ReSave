import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.describe('認証不要画面', () => {
    test('ログイン画面のスナップショット', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('login.png', {
        maxDiffPixels: 100,
        fullPage: true,
      });
    });

    test('新規登録画面のスナップショット', async ({ page }) => {
      await page.goto('/signup');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('signup.png', {
        maxDiffPixels: 100,
        fullPage: true,
      });
    });

    test('パスワードリセット画面のスナップショット', async ({ page }) => {
      await page.goto('/reset-password');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('reset-password.png', {
        maxDiffPixels: 100,
        fullPage: true,
      });
    });
  });

  test.describe('認証必要画面', () => {
    test('ホーム画面のスナップショット', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('home.png', {
        maxDiffPixels: 100,
        fullPage: true,
      });
    });

    test('タグ管理画面のスナップショット', async ({ page }) => {
      await page.goto('/tags');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('tags.png', {
        maxDiffPixels: 100,
        fullPage: true,
      });
    });

    test('統計画面のスナップショット', async ({ page }) => {
      await page.goto('/stats');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('stats.png', {
        maxDiffPixels: 100,
        fullPage: true,
      });
    });

    test('設定画面のスナップショット', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('settings.png', {
        maxDiffPixels: 100,
        fullPage: true,
      });
    });

    test('カード新規作成画面のスナップショット', async ({ page }) => {
      await page.goto('/cards/new');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot('cards-new.png', {
        maxDiffPixels: 100,
        fullPage: true,
      });
    });
  });
});
