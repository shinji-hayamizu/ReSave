import { test, expect } from '@playwright/test';

test.describe('タグ管理フロー', () => {
  test.describe('タグ画面アクセス', () => {
    test('未認証時: タグ画面アクセスでログイン画面へリダイレクト', async ({ page }) => {
      await page.goto('/tags');

      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('タグ管理画面（認証必要）', () => {
    test.skip('タグ一覧ページが表示される', async ({ page }) => {
      await page.goto('/tags');

      await expect(page.getByRole('heading', { name: 'タグ管理' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'タグ追加' })).toBeVisible();
    });

    test.skip('タグがない場合に空状態メッセージが表示される', async ({ page }) => {
      await page.goto('/tags');

      await expect(page.getByText('タグがありません')).toBeVisible();
    });

    test.skip('タグ追加ボタンでモーダルが開く', async ({ page }) => {
      await page.goto('/tags');

      await page.getByRole('button', { name: 'タグ追加' }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'タグを追加' })).toBeVisible();
      await expect(page.getByLabel('タグ名')).toBeVisible();
      await expect(page.getByText('色')).toBeVisible();
    });

    test.skip('タグ作成モーダル: 空のタグ名でエラー', async ({ page }) => {
      await page.goto('/tags');

      await page.getByRole('button', { name: 'タグ追加' }).click();
      await page.getByRole('button', { name: '保存' }).click();

      await expect(page.getByText('タグ名を入力してください')).toBeVisible();
    });

    test.skip('タグ作成モーダル: 文字数カウンターが表示される', async ({ page }) => {
      await page.goto('/tags');

      await page.getByRole('button', { name: 'タグ追加' }).click();
      await page.getByLabel('タグ名').fill('テスト');

      await expect(page.getByText('3/30')).toBeVisible();
    });

    test.skip('タグ作成モーダル: 色選択が機能する', async ({ page }) => {
      await page.goto('/tags');

      await page.getByRole('button', { name: 'タグ追加' }).click();

      const colorButtons = page.locator('[data-testid="color-button"]');
      await expect(colorButtons).toHaveCount(8);

      await colorButtons.nth(2).click();
      await expect(colorButtons.nth(2)).toHaveAttribute('data-selected', 'true');
    });

    test.skip('タグ作成モーダル: キャンセルでモーダルが閉じる', async ({ page }) => {
      await page.goto('/tags');

      await page.getByRole('button', { name: 'タグ追加' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.getByRole('button', { name: 'キャンセル' }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test.skip('タグ作成モーダル: ESCキーでモーダルが閉じる', async ({ page }) => {
      await page.goto('/tags');

      await page.getByRole('button', { name: 'タグ追加' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test.skip('タグアイテム: 編集ボタンと削除ボタンが表示される', async ({ page }) => {
      await page.goto('/tags');

      const tagItem = page.locator('[data-testid="tag-item"]').first();
      await expect(tagItem.getByRole('button', { name: '編集' })).toBeVisible();
      await expect(tagItem.getByRole('button', { name: '削除' })).toBeVisible();
    });

    test.skip('タグ編集モーダル: 既存のデータが入力されている', async ({ page }) => {
      await page.goto('/tags');

      const editButton = page.locator('[data-testid="tag-item"]').first().getByRole('button', { name: '編集' });
      await editButton.click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'タグを編集' })).toBeVisible();
      await expect(page.getByLabel('タグ名')).not.toHaveValue('');
    });

    test.skip('タグ削除確認モーダル: 警告メッセージが表示される', async ({ page }) => {
      await page.goto('/tags');

      const deleteButton = page.locator('[data-testid="tag-item"]').first().getByRole('button', { name: '削除' });
      await deleteButton.click();

      await expect(page.getByRole('alertdialog')).toBeVisible();
      await expect(page.getByText('カードは削除されません')).toBeVisible();
      await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible();
      await expect(page.getByRole('button', { name: '削除' })).toBeVisible();
    });
  });
});
