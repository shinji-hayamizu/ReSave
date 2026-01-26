import { test, expect } from '@playwright/test';

test.describe('統計画面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/stats');
    const url = page.url();
    if (url.includes('/login')) {
      test.skip(true, '認証が必要です（auth.setupが成功している必要があります）');
    }
  });

  test('ページヘッダーが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '統計' })).toBeVisible();
    await expect(page.getByText('学習の進捗を確認しましょう')).toBeVisible();
  });

  test('本日サマリーセクションが表示される', async ({ page }) => {
    await expect(page.getByText('今日の学習')).toBeVisible();
  });

  test('期間タブが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: '今日' })).toBeVisible();
    await expect(page.getByRole('button', { name: '週間' })).toBeVisible();
    await expect(page.getByRole('button', { name: '月間' })).toBeVisible();
  });

  test('期間タブの切り替えが機能する', async ({ page }) => {
    const weekTab = page.getByRole('button', { name: '週間' });
    await weekTab.click();

    await expect(weekTab).toHaveClass(/bg-background/);
  });

  test('累計統計セクションが表示される', async ({ page }) => {
    await expect(page.getByText('累計統計')).toBeVisible();
  });

  test('日別チャートセクションが表示される', async ({ page }) => {
    const chartContainer = page.locator('[data-testid="daily-stats-chart"]');
    await expect(chartContainer).toBeVisible();
  });
});
