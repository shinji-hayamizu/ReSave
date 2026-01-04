import { test, expect } from '@playwright/test';

test.describe('スプラッシュ画面', () => {
  test('スプラッシュ画面が表示される', async ({ page }) => {
    await page.goto('/splash');

    await expect(page.getByText('ReSave')).toBeVisible();
    await expect(page.getByText('- 記憶を科学する -')).toBeVisible();
  });

  test('スプラッシュ画面にローディング表示がある', async ({ page }) => {
    await page.goto('/splash');

    await expect(page.getByText('読み込み中...')).toBeVisible();
  });

  test('未認証時: スプラッシュ画面からログイン画面へ自動遷移', async ({
    page,
  }) => {
    await page.goto('/splash');

    await expect(page.getByText('ReSave')).toBeVisible();

    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
