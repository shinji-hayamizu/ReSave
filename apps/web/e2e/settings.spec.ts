import { test, expect } from '@playwright/test';

test.describe('設定画面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    const url = page.url();
    if (url.includes('/login')) {
      test.skip(true, '認証が必要です（auth.setupが成功している必要があります）');
    }
  });

  test('ページヘッダーが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '設定' })).toBeVisible();
    await expect(page.getByText('アプリの設定とアカウントを管理')).toBeVisible();
  });

  test('通知設定セクションが表示される', async ({ page }) => {
    await expect(page.getByText('通知設定').first()).toBeVisible();
    await expect(page.getByText('プッシュ通知とリマインダーの設定')).toBeVisible();
  });

  test('アカウント設定セクションが表示される', async ({ page }) => {
    await expect(page.getByText('アカウント設定')).toBeVisible();
    await expect(page.getByText('アカウント情報を管理')).toBeVisible();
  });

  test('メールアドレスが表示される', async ({ page }) => {
    await expect(page.getByText('メールアドレス')).toBeVisible();
  });

  test('ログアウトボタンが表示される', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible();
  });
});
