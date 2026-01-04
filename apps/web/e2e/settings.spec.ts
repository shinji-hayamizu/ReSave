import { test, expect } from '@playwright/test';

test.describe('設定画面', () => {
  test('ページヘッダーが表示される', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByRole('heading', { name: '設定' })).toBeVisible();
    await expect(page.getByText('アプリの設定とアカウントを管理')).toBeVisible();
  });

  test('学習設定セクションが表示される', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByText('学習設定')).toBeVisible();
  });

  test('通知設定セクションが表示される', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByText('通知設定')).toBeVisible();
  });

  test('アカウント設定セクションが表示される', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByText('アカウント設定')).toBeVisible();
  });

  test('データ管理セクションが表示される', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByText('データ管理')).toBeVisible();
  });

  test('アプリ情報セクションが表示される', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByText('アプリ情報')).toBeVisible();
  });

  test('ログアウトボタンが表示される', async ({ page }) => {
    await page.goto('/settings');

    await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible();
  });
});
