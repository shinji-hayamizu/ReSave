import { test, expect } from '@playwright/test';

test.describe('タグ管理フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tags');
    const url = page.url();
    if (url.includes('/login')) {
      test.skip(true, '認証が必要です（auth.setupが成功している必要があります）');
    }
  });

  test.describe('タグ管理画面', () => {
    test('タグ一覧ページが表示される', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'タグ管理' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'タグ追加' })).toBeVisible();
    });

    test('タグがない場合に空状態メッセージが表示される', async ({ page }) => {
      // ページロード完了を待つ
      await page.waitForSelector('[data-testid="tag-item"], h3:has-text("タグがありません")', { timeout: 10000 }).catch(() => {});

      const tagItems = page.locator('[data-testid="tag-item"]');
      const tagCount = await tagItems.count();

      if (tagCount === 0) {
        await expect(page.getByText('タグがありません')).toBeVisible();
      }
    });

    test('タグ追加ボタンでモーダルが開く', async ({ page }) => {
      await page.getByRole('button', { name: 'タグ追加' }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'タグを追加' })).toBeVisible();
      await expect(page.getByLabel('タグ名')).toBeVisible();
      await expect(page.getByText('色')).toBeVisible();
    });

    test('タグ作成モーダル: 空のタグ名では保存ボタンが無効', async ({ page }) => {
      await page.getByRole('button', { name: 'タグ追加' }).click();

      await expect(page.getByRole('button', { name: '保存' })).toBeDisabled();
    });

    test('タグ作成モーダル: 文字数カウンターが表示される', async ({ page }) => {
      await page.getByRole('button', { name: 'タグ追加' }).click();
      await page.getByLabel('タグ名').fill('テスト');

      await expect(page.getByText('3/30')).toBeVisible();
    });

    test('タグ作成モーダル: 色選択が機能する', async ({ page }) => {
      await page.getByRole('button', { name: 'タグ追加' }).click();

      const colorButtons = page.locator('[data-testid="color-button"]');
      await expect(colorButtons).toHaveCount(8);

      await colorButtons.nth(2).click();
      await expect(colorButtons.nth(2)).toHaveAttribute('data-selected', 'true');
    });

    test('タグ作成モーダル: キャンセルでモーダルが閉じる', async ({ page }) => {
      await page.getByRole('button', { name: 'タグ追加' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByRole('button', { name: 'キャンセル' }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('タグ作成モーダル: ESCキーでモーダルが閉じる', async ({ page }) => {
      await page.getByRole('button', { name: 'タグ追加' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('タグアイテム: 編集ボタンと削除ボタンが表示される', async ({ page }) => {
      const tagItems = page.locator('[data-testid="tag-item"]');
      const tagCount = await tagItems.count();

      if (tagCount > 0) {
        const tagItem = tagItems.first();
        await expect(tagItem.getByRole('button', { name: '編集' })).toBeVisible();
        await expect(tagItem.getByRole('button', { name: '削除' })).toBeVisible();
      }
    });

    test('タグ編集モーダル: 既存のデータが入力されている', async ({ page }) => {
      const tagItems = page.locator('[data-testid="tag-item"]');
      const tagCount = await tagItems.count();

      if (tagCount > 0) {
        const editButton = tagItems.first().getByRole('button', { name: '編集' });
        await editButton.click();

        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'タグを編集' })).toBeVisible();
        await expect(page.getByLabel('タグ名')).not.toHaveValue('');
      }
    });

    test('タグ削除確認モーダル: 警告メッセージが表示される', async ({ page }) => {
      const tagItems = page.locator('[data-testid="tag-item"]');
      const tagCount = await tagItems.count();

      if (tagCount > 0) {
        const deleteButton = tagItems.first().getByRole('button', { name: '削除' });
        await deleteButton.click();

        await expect(page.getByRole('alertdialog')).toBeVisible();
        await expect(page.getByText('紐付いているカードは削除されません')).toBeVisible();
        await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible();
        await expect(page.getByRole('button', { name: '削除する' })).toBeVisible();
      }
    });
  });
});
