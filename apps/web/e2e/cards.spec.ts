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

      await page.getByText('復習中').first().click();
      await expect(page.getByText('復習中').first().locator('..')).toHaveClass(/border-b-current/);
    });

    test('カードリストが表示される', async ({ page }) => {
      // スケルトンが消えるまで待つ（ロード完了）
      await page.waitForFunction(() => {
        return document.querySelector('[data-testid="study-card"]') !== null ||
               document.querySelector('h2') !== null;
      }, { timeout: 10000 }).catch(() => {});

      const studyCards = page.locator('[data-testid="study-card"]');
      const cardTitle = page.getByText('カードなし');
      const emptyMessage = page.getByText('新しいカードを追加して学習を始めましょう');

      const hasCards = await studyCards.count() > 0;
      const hasTitle = await cardTitle.count() > 0;
      const hasEmptyMessage = await emptyMessage.count() > 0;

      expect(hasCards || hasTitle || hasEmptyMessage).toBe(true);
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
      const detailBtn = page.locator('button[title="詳細入力"]');
      if (await detailBtn.count() === 0) {
        test.skip(true, 'モバイルビューでは詳細入力ボタンが非表示');
        return;
      }
      await detailBtn.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const frontInput = dialog.getByPlaceholder('覚えたいことを入力してください');
      await frontInput.click();
      await frontInput.fill('詳細入力テスト問題');
      await expect(dialog.getByRole('button', { name: '保存' }).first()).toBeEnabled({ timeout: 5000 });

      await dialog.getByRole('button', { name: '保存' }).first().click();

      // ダイアログが閉じれば保存成功
      await expect(dialog).not.toBeVisible({ timeout: 10000 });
    });
  });
});
