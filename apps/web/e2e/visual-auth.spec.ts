import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests - 認証必要画面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const url = page.url();
    if (url.includes('/login')) {
      test.skip(true, '認証が必要です（auth.setupが成功している必要があります）');
    }
  });

  test('ホーム画面のスナップショット', async ({ page }) => {
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

    // データによりページ高さが変化するためviewportのみ比較
    await expect(page).toHaveScreenshot('stats.png', {
      maxDiffPixelRatio: 0.05,
      fullPage: false,
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
