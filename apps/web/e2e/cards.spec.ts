import { test, expect } from '@playwright/test';

test.describe('カード学習フロー', () => {
  test.describe('ホーム画面', () => {
    test('クイック入力フォームが表示される', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByPlaceholder('問題を入力')).toBeVisible();
      await expect(page.getByPlaceholder('答えを入力')).toBeVisible();
      await expect(page.getByRole('button', { name: 'カードを追加' })).toBeVisible();
    });

    test('クイック入力: 空の状態でボタンが無効', async ({ page }) => {
      await page.goto('/');

      const submitButton = page.getByRole('button', { name: 'カードを追加' });
      await expect(submitButton).toBeDisabled();
    });

    test('クイック入力: 入力後にボタンが有効化', async ({ page }) => {
      await page.goto('/');

      await page.getByPlaceholder('問題を入力').fill('テスト問題');
      await page.getByPlaceholder('答えを入力').fill('テスト答え');

      const submitButton = page.getByRole('button', { name: 'カードを追加' });
      await expect(submitButton).toBeEnabled();
    });

    test('タブ切り替えが機能する', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByRole('tab', { name: /未学習/ })).toBeVisible();
      await expect(page.getByRole('tab', { name: /復習中/ })).toBeVisible();
      await expect(page.getByRole('tab', { name: /完了/ })).toBeVisible();

      await page.getByRole('tab', { name: /復習中/ }).click();
      await expect(page.getByRole('tab', { name: /復習中/ })).toHaveAttribute('data-state', 'active');
    });

    test('カードリストが表示される', async ({ page }) => {
      await page.goto('/');

      const cardList = page.locator('[data-testid="card-list"]');
      await expect(cardList).toBeVisible();
    });

    test('学習カード: 答えを見るボタンで答えが表示される', async ({ page }) => {
      await page.goto('/');

      const showAnswerButton = page.getByRole('button', { name: '答えを見る' }).first();
      await showAnswerButton.click();

      await expect(page.getByText('答えを隠す').first()).toBeVisible();
    });

    test('学習カード: 評価ボタンが表示される', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByRole('button', { name: /OK/ }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /覚えた/ }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /もう一度/ }).first()).toBeVisible();
    });
  });

  test.describe('カード編集画面', () => {
    test('カード編集フォームが表示される', async ({ page }) => {
      await page.goto('/cards/test-id/edit');

      await expect(page.getByLabel('テキスト')).toBeVisible();
      await expect(page.getByLabel('隠しテキスト')).toBeVisible();
      await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
    });

    test('削除ボタンが表示される', async ({ page }) => {
      await page.goto('/cards/test-id/edit');

      await expect(page.getByRole('button', { name: '削除' })).toBeVisible();
    });

    test('削除確認ダイアログが表示される', async ({ page }) => {
      await page.goto('/cards/test-id/edit');

      await page.getByRole('button', { name: '削除' }).click();

      await expect(page.getByText('本当に削除しますか')).toBeVisible();
      await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible();
      await expect(page.getByRole('button', { name: '削除する' })).toBeVisible();
    });
  });
});
