import { test, expect } from '@playwright/test';

test.describe('統計画面', () => {
  test('ページヘッダーが表示される', async ({ page }) => {
    await page.goto('/stats');

    await expect(page.getByRole('heading', { name: '統計' })).toBeVisible();
    await expect(page.getByText('学習の進捗を確認しましょう')).toBeVisible();
  });

  test('本日サマリーセクションが表示される', async ({ page }) => {
    await page.goto('/stats');

    await expect(page.getByText('本日の学習')).toBeVisible();
  });

  test('期間タブが表示される', async ({ page }) => {
    await page.goto('/stats');

    await expect(page.getByRole('tab', { name: /本日|今日/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /週間|7日/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /月間|30日/ })).toBeVisible();
  });

  test('期間タブの切り替えが機能する', async ({ page }) => {
    await page.goto('/stats');

    const weekTab = page.getByRole('tab', { name: /週間|7日/ });
    await weekTab.click();
    await expect(weekTab).toHaveAttribute('data-state', 'active');
  });

  test('累計統計セクションが表示される', async ({ page }) => {
    await page.goto('/stats');

    await expect(page.getByText(/累計|合計/)).toBeVisible();
  });

  test('日別チャートセクションが表示される', async ({ page }) => {
    await page.goto('/stats');

    const chartContainer = page.locator('[data-testid="daily-stats-chart"]');
    await expect(chartContainer).toBeVisible();
  });
});
