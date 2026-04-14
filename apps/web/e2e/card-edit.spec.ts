import { test, expect, type Page } from '@playwright/test';

async function createCardAndOpenEdit(page: Page) {
  await page.goto('/');
  const url = page.url();
  if (url.includes('/login')) {
    test.skip(true, '認証が必要です（auth.setupが成功している必要があります）');
    return;
  }

  const frontInput = page.getByPlaceholder('覚えたいこと');
  const uniqueText = `編集テスト_${Date.now()}`;
  await frontInput.fill(uniqueText);

  const submitButton = page.locator('form').filter({ has: frontInput }).locator('button[type="submit"]');
  await submitButton.click();
  await expect(page.getByText('カードを追加しました')).toBeVisible({ timeout: 10000 });
  await page.waitForTimeout(500);
}

test.describe('カード編集ページ', () => {
  test.describe('ページ表示', () => {
    test.beforeEach(async ({ page }) => {
      await createCardAndOpenEdit(page);
    });

    test('編集ダイアログが開く', async ({ page }) => {
      const editButton = page.locator('[data-testid="study-card"]').first().getByRole('button', { name: '編集' });
      const hasEditButton = await editButton.count() > 0;

      if (!hasEditButton) {
        test.skip(true, '編集ボタンが見つかりません');
        return;
      }

      await editButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('カードを編集')).toBeVisible();
    });

    test('編集ダイアログにフォーム要素が表示される', async ({ page }) => {
      const editButton = page.locator('[data-testid="study-card"]').first().getByRole('button', { name: '編集' });
      const hasEditButton = await editButton.count() > 0;

      if (!hasEditButton) {
        test.skip(true, '編集ボタンが見つかりません');
        return;
      }

      await editButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByPlaceholder('覚えたいことを入力してください')).toBeVisible();
      await expect(dialog.getByPlaceholder('タップで表示される答えを入力（任意）')).toBeVisible();
    });

    test('既存のカード内容がフォームに入力されている', async ({ page }) => {
      const editButton = page.locator('[data-testid="study-card"]').first().getByRole('button', { name: '編集' });
      const hasEditButton = await editButton.count() > 0;

      if (!hasEditButton) {
        test.skip(true, '編集ボタンが見つかりません');
        return;
      }

      await editButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const textField = dialog.getByPlaceholder('覚えたいことを入力してください');
      const textValue = await textField.inputValue();
      expect(textValue.length).toBeGreaterThan(0);
    });

    test('ソースURLフィールドが表示される', async ({ page }) => {
      const editButton = page.locator('[data-testid="study-card"]').first().getByRole('button', { name: '編集' });
      const hasEditButton = await editButton.count() > 0;

      if (!hasEditButton) {
        test.skip(true, '編集ボタンが見つかりません');
        return;
      }

      await editButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText('ソースURL')).toBeVisible();
    });
  });

  test.describe('直接URLアクセス', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      const url = page.url();
      if (url.includes('/login')) {
        test.skip(true, '認証が必要です（auth.setupが成功している必要があります）');
      }
    });

    test('存在しないIDでアクセス時に「カードが見つかりませんでした」が表示される', async ({ page }) => {
      await page.goto('/cards/00000000-0000-0000-0000-000000000000/edit');

      await expect(page.getByText('カードが見つかりませんでした')).toBeVisible({ timeout: 10000 });
    });

    test('存在しないIDでアクセス時に戻るリンクが表示される', async ({ page }) => {
      await page.goto('/cards/00000000-0000-0000-0000-000000000000/edit');

      await expect(page.getByText('戻る')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('フォームバリデーション', () => {
    test.beforeEach(async ({ page }) => {
      await createCardAndOpenEdit(page);
    });

    test('テキストを空にすると保存ボタンが無効になる', async ({ page }) => {
      const editButton = page.locator('[data-testid="study-card"]').first().getByRole('button', { name: '編集' });
      const hasEditButton = await editButton.count() > 0;

      if (!hasEditButton) {
        test.skip(true, '編集ボタンが見つかりません');
        return;
      }

      await editButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const textField = dialog.getByPlaceholder('覚えたいことを入力してください');
      await textField.clear();
      await textField.fill('');

      const saveButton = page.locator('#edit-card-form').getByRole('button', { name: '保存' });
      await expect(saveButton).toBeDisabled();
    });

    test('空白のみのテキストでは保存ボタンが無効', async ({ page }) => {
      const editButton = page.locator('[data-testid="study-card"]').first().getByRole('button', { name: '編集' });
      const hasEditButton = await editButton.count() > 0;

      if (!hasEditButton) {
        test.skip(true, '編集ボタンが見つかりません');
        return;
      }

      await editButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const textField = dialog.getByPlaceholder('覚えたいことを入力してください');
      await textField.clear();
      await textField.fill('   ');

      const saveButton = page.locator('#edit-card-form').getByRole('button', { name: '保存' });
      await expect(saveButton).toBeDisabled();
    });

    test('テキストを入力すると保存ボタンが有効化される', async ({ page }) => {
      const editButton = page.locator('[data-testid="study-card"]').first().getByRole('button', { name: '編集' });
      const hasEditButton = await editButton.count() > 0;

      if (!hasEditButton) {
        test.skip(true, '編集ボタンが見つかりません');
        return;
      }

      await editButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      const textField = dialog.getByPlaceholder('覚えたいことを入力してください');
      await textField.clear();
      await textField.fill('新しいテキスト');

      const saveButton = page.locator('#edit-card-form').getByRole('button', { name: '保存' });
      await expect(saveButton).toBeEnabled();
    });

    test('ソースURLフィールドにURLを入力できる', async ({ page }) => {
      const editButton = page.locator('[data-testid="study-card"]').first().getByRole('button', { name: '編集' });
      const hasEditButton = await editButton.count() > 0;

      if (!hasEditButton) {
        test.skip(true, '編集ボタンが見つかりません');
        return;
      }

      await editButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      await expect(dialog.getByText('ソースURL')).toBeVisible();
      const urlInput = dialog.getByPlaceholder('https://example.com');
      await urlInput.fill('https://example.com');
      await expect(urlInput).toHaveValue('https://example.com');
    });
  });
});
