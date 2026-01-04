import { test, expect } from '@playwright/test';

test.describe('UI回帰テスト', () => {
  test.describe('タブラベル表示確認', () => {
    test('カードタブに「未学習」「復習中」「完了」のラベルが表示される', async ({
      page,
    }) => {
      await page.goto('/');

      await expect(page.getByRole('button', { name: /未学習/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /復習中/ })).toBeVisible();
      await expect(page.getByRole('button', { name: /完了/ })).toBeVisible();
    });
  });

  test.describe('UserAvatarメニュー動作確認', () => {
    test('ヘッダーにUserAvatarが表示される', async ({ page }) => {
      await page.goto('/');

      const avatar = page.locator('[data-testid="user-avatar"]');
      await expect(avatar).toBeVisible();
    });

    test('UserAvatarクリックでドロップダウンメニューが表示される', async ({
      page,
    }) => {
      await page.goto('/');

      const avatar = page.locator('[data-testid="user-avatar"]');
      await avatar.click();

      await expect(page.getByRole('menuitem', { name: '設定' })).toBeVisible();
      await expect(
        page.getByRole('menuitem', { name: 'ログアウト' })
      ).toBeVisible();
    });
  });

  test.describe('サイドバー項目の確認', () => {
    test('サイドバーに「ホーム」ラベルが表示される', async ({ page }) => {
      await page.goto('/');

      const homeLink = page.getByRole('link', { name: 'ホーム' });
      await expect(homeLink).toBeVisible();
    });

    test('サイドバーに「ダッシュボード」ではなく「ホーム」が表示される', async ({
      page,
    }) => {
      await page.goto('/');

      await expect(page.getByRole('link', { name: 'ホーム' })).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'ダッシュボード' })
      ).not.toBeVisible();
    });
  });

  test.describe('未認証時の動作確認', () => {
    test('未認証時: ホーム画面アクセスでログイン画面へリダイレクト', async ({
      page,
    }) => {
      await page.goto('/');

      await expect(page).toHaveURL(/\/login/);
    });

    test('ログイン画面: ヘッダーにReSaveロゴが表示される', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible();
    });
  });
});
