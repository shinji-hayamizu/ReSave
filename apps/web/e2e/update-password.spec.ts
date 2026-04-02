import { test, expect } from '@playwright/test';

test.describe('パスワード更新ページ', () => {
  test.describe('ページ表示', () => {
    test('フォーム要素が表示される', async ({ page }) => {
      await page.goto('/update-password');

      await expect(page.getByText('新しいパスワードを設定')).toBeVisible();
      await expect(page.getByLabel('新しいパスワード')).toBeVisible();
      await expect(page.getByLabel('パスワード（確認）')).toBeVisible();
      await expect(page.getByRole('button', { name: 'パスワードを更新' })).toBeVisible();
    });

    test('ページ説明テキストが表示される', async ({ page }) => {
      await page.goto('/update-password');

      await expect(page.getByText('新しいパスワードを入力してください')).toBeVisible();
    });
  });

  test.describe('バリデーション', () => {
    test('空フォーム送信時にバリデーションエラーが表示される', async ({ page }) => {
      await page.goto('/update-password');

      await page.getByRole('button', { name: 'パスワードを更新' }).click();

      await expect(page.getByText('パスワードは8文字以上で入力してください').first()).toBeVisible();
      await expect(page.getByText('パスワード（確認）を入力してください')).toBeVisible();
    });

    test('パスワード不一致でエラーが表示される', async ({ page }) => {
      await page.goto('/update-password');

      await page.getByLabel('新しいパスワード').fill('Password123');
      await page.getByLabel('パスワード（確認）').fill('DifferentPassword456');
      await page.getByRole('button', { name: 'パスワードを更新' }).click();

      await expect(page.getByText('パスワードが一致しません')).toBeVisible();
    });

    test('8文字未満でバリデーションエラーが表示される', async ({ page }) => {
      await page.goto('/update-password');

      await page.getByLabel('新しいパスワード').fill('Pass1');
      await page.getByLabel('パスワード（確認）').fill('Pass1');
      await page.getByRole('button', { name: 'パスワードを更新' }).click();

      await expect(page.getByText('パスワードは8文字以上で入力してください')).toBeVisible();
    });

    test('英字なしでバリデーションエラーが表示される', async ({ page }) => {
      await page.goto('/update-password');

      await page.getByLabel('新しいパスワード').fill('12345678');
      await page.getByLabel('パスワード（確認）').fill('12345678');
      await page.getByRole('button', { name: 'パスワードを更新' }).click();

      await expect(page.getByText('パスワードは英字と数字を含める必要があります')).toBeVisible();
    });

    test('数字なしでバリデーションエラーが表示される', async ({ page }) => {
      await page.goto('/update-password');

      await page.getByLabel('新しいパスワード').fill('PasswordOnly');
      await page.getByLabel('パスワード（確認）').fill('PasswordOnly');
      await page.getByRole('button', { name: 'パスワードを更新' }).click();

      await expect(page.getByText('パスワードは英字と数字を含める必要があります')).toBeVisible();
    });

    test('パスワードの要件がフォームに表示される', async ({ page }) => {
      await page.goto('/update-password');

      await expect(page.getByText('8文字以上、英字と数字を含む')).toBeVisible();
    });
  });
});
