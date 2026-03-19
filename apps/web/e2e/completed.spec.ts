import { test, expect } from '@playwright/test';

test.describe('完了ページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cards/completed');
    const url = page.url();
    if (url.includes('/login')) {
      test.skip(true, '認証が必要です');
    }
  });

  test('ページヘッダーに「完了」が表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '完了' })).toBeVisible();
    await expect(page.getByText('学習が完了したカード')).toBeVisible();
  });

  test('完了カードがない場合に空状態が表示される', async ({ page }) => {
    const hasCards = await page.locator('[data-testid="card-list"]').count() > 0;

    if (!hasCards) {
      await expect(page.getByText('完了済みカードなし')).toBeVisible();
    }
  });
});

test.describe('ナビゲーション - 完了メニュー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const url = page.url();
    if (url.includes('/login')) {
      test.skip(true, '認証が必要です');
    }
  });

  test('デスクトップ: サイドバーに「完了」メニュー項目が表示される', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    const completedLink = page.locator('a[href="/cards/completed"]');
    await expect(completedLink).toBeVisible();
    await expect(completedLink).toContainText('完了');
  });

  test('デスクトップ: サイドバーから完了ページに遷移できる', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.locator('a[href="/cards/completed"]').click();
    await page.waitForURL('/cards/completed');

    await expect(page.getByRole('heading', { name: '完了' })).toBeVisible();
  });

  test('モバイル: ボトムナビに「完了」メニュー項目が表示される', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const nav = page.locator('nav');
    const completedLink = nav.locator('a[href="/cards/completed"]');
    await expect(completedLink).toBeVisible();
    await expect(completedLink).toContainText('完了');
  });

  test('モバイル: ボトムナビから完了ページに遷移できる', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const nav = page.locator('nav');
    await nav.locator('a[href="/cards/completed"]').click();
    await page.waitForURL('/cards/completed');

    await expect(page.getByRole('heading', { name: '完了' })).toBeVisible();
  });
});
