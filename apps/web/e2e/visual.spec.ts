import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests - 認証不要画面', () => {
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
