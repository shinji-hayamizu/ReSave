import { test, expect } from '@playwright/test';

test.describe('UI回帰テスト', () => {
  test.describe('タブラベル表示確認', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      const url = page.url();
      if (url.includes('/login')) {
        test.skip(true, '認証が必要です（auth.setupが成功している必要があります）');
      }
    });

    test('カードタブに「未学習」「復習中」「完了」のラベルが表示される', async ({
      page,
    }) => {
      await expect(page.getByText('未学習')).toBeVisible();
      await expect(page.getByText('復習中')).toBeVisible();
      await expect(page.getByText('完了')).toBeVisible();
    });
  });

  test.describe('サイドバー項目の確認', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      const url = page.url();
      if (url.includes('/login')) {
        test.skip(true, '認証が必要です（auth.setupが成功している必要があります）');
      }
    });

    test('サイドバーに「ホーム」ラベルが表示される', async ({ page }) => {
      const homeLink = page.getByRole('link', { name: 'ホーム' });
      await expect(homeLink).toBeVisible();
    });

    test('サイドバーに「ダッシュボード」ではなく「ホーム」が表示される', async ({
      page,
    }) => {
      await expect(page.getByRole('link', { name: 'ホーム' })).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'ダッシュボード' })
      ).not.toBeVisible();
    });
  });

  test.describe('ホーム画面の動作確認', () => {
    test('認証済み: ホーム画面が表示される', async ({
      page,
    }) => {
      await page.goto('/');

      await expect(page.getByPlaceholder('覚えたいこと')).toBeVisible();
    });

    test('ログイン画面: ヘッダーにログイン見出しが表示される', async ({ page }) => {
      await page.goto('/login');
      // 認証済みの場合はホームへリダイレクトされるため、どちらでも可
      const url = page.url();
      if (url.includes('/login')) {
        // CardTitleはdiv要素のためgetByTextを使用
        await expect(page.getByText('ログイン', { exact: true }).first()).toBeVisible();
      } else {
        // リダイレクト先（ホーム）でタブが表示されることを確認
        await expect(page.getByText('未学習')).toBeVisible();
      }
    });
  });
});
