import { test, expect } from '@playwright/test';

test.describe('カード学習フロー', () => {
  test.describe('ホーム画面', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      const url = page.url();
      if (url.includes('/login')) {
        test.skip(true, '認証が必要です（auth.setupが成功している必要があります）');
      }
    });

    test('クイック入力フォームが表示される', async ({ page }) => {
      await expect(page.getByPlaceholder('覚えたいこと')).toBeVisible();
      await expect(page.getByPlaceholder('答え（任意）')).toBeVisible();
    });

    test('クイック入力: 空の状態でボタンが無効', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeDisabled();
    });

    test('クイック入力: 入力後にボタンが有効化', async ({ page }) => {
      await page.getByPlaceholder('覚えたいこと').fill('テスト問題');

      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeEnabled();
    });

    test('タブ切り替えが機能する', async ({ page }) => {
      await expect(page.getByText('未学習')).toBeVisible();
      await expect(page.getByText('復習中')).toBeVisible();
      await expect(page.getByText('完了')).toBeVisible();

      await page.getByText('復習中').first().click();
      await expect(page.getByText('復習中').first().locator('..')).toHaveClass(/border-b-primary/);
    });

    test('カードリストが表示される', async ({ page }) => {
      const cardList = page.locator('[data-testid="card-list"]');
      const emptyState = page.getByText('カードなし');

      const hasCards = await cardList.count() > 0;
      const hasEmptyState = await emptyState.count() > 0;

      expect(hasCards || hasEmptyState).toBe(true);
    });

    test('学習カード: 答えを見るボタンで答えが表示される', async ({ page }) => {
      const cardCount = await page.locator('[data-testid="study-card"]').count();

      if (cardCount > 0) {
        const showAnswerButton = page.getByRole('button', { name: '答えを見る' }).first();
        const hasButton = await showAnswerButton.count() > 0;

        if (hasButton) {
          await showAnswerButton.click();
          await expect(page.getByText('答えを隠す').first()).toBeVisible();
        }
      }
    });

    test('学習カード: 評価ボタンが表示される', async ({ page }) => {
      const cardCount = await page.locator('[data-testid="study-card"]').count();

      if (cardCount > 0) {
        await expect(page.getByRole('button', { name: /OK/ }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: /覚えた/ }).first()).toBeVisible();
      }
    });
  });

  test.describe('カード編集ダイアログ', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      const url = page.url();
      if (url.includes('/login')) {
        test.skip(true, '認証が必要です（auth.setupが成功している必要があります）');
      }
    });

    test('詳細入力ボタンでダイアログが開く', async ({ page }) => {
      const detailButton = page.locator('button[title="詳細入力"]');
      await detailButton.click();

      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('ダイアログでカードを作成できる', async ({ page }) => {
      await page.locator('button[title="詳細入力"]').click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      await dialog.getByLabel('テキスト').fill('詳細入力テスト問題');
      await dialog.getByLabel('隠しテキスト').fill('詳細入力テスト答え');

      await dialog.getByRole('button', { name: '保存' }).click();

      await expect(page.getByText('カードを追加しました')).toBeVisible();
    });
  });
});
