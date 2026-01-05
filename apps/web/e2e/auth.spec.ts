import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  test('未認証時: ホーム画面アクセスでログイン画面へリダイレクト', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('ログイン', { exact: true }).first()).toBeVisible();
  });

  test('未認証時: 設定画面アクセスでログイン画面へリダイレクト', async ({ page }) => {
    await page.goto('/settings');

    await expect(page).toHaveURL(/\/login/);
  });

  test('未認証時: タグ画面アクセスでログイン画面へリダイレクト', async ({ page }) => {
    await page.goto('/tags');

    await expect(page).toHaveURL(/\/login/);
  });

  test('未認証時: 統計画面アクセスでログイン画面へリダイレクト', async ({ page }) => {
    await page.goto('/stats');

    await expect(page).toHaveURL(/\/login/);
  });

  test('ログイン画面: フォーム要素が表示される', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード')).toBeVisible();
    await expect(page.getByRole('button', { name: 'ログイン' })).toBeVisible();
    await expect(page.getByRole('link', { name: '新規登録' })).toBeVisible();
  });

  test('ログイン画面: 空フォーム送信時にバリデーションエラー', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByText('メールアドレスを入力してください')).toBeVisible();
    await expect(page.getByText('パスワードを入力してください')).toBeVisible();
  });

  test('ログイン画面: 無効なメール形式でバリデーションエラー', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('メールアドレス').fill('invalid-email');
    await page.getByLabel('パスワード').fill('password123');
    await page.getByRole('button', { name: 'ログイン' }).click();

    await expect(page.getByText('有効なメールアドレスを入力してください')).toBeVisible();
  });

  test('新規登録画面: フォーム要素が表示される', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByLabel('パスワード', { exact: true })).toBeVisible();
    await expect(page.getByLabel('パスワード（確認）')).toBeVisible();
    await expect(page.getByRole('button', { name: '新規登録' })).toBeVisible();
  });

  test('新規登録画面: パスワード不一致でバリデーションエラー', async ({ page }) => {
    await page.goto('/signup');

    await page.getByLabel('メールアドレス').fill('test@example.com');
    await page.getByLabel('パスワード', { exact: true }).fill('Password123!');
    await page.getByLabel('パスワード（確認）').fill('DifferentPassword123!');
    await page.getByRole('button', { name: '新規登録' }).click();

    await expect(page.getByText('パスワードが一致しません')).toBeVisible();
  });

  test('パスワードリセット画面: フォーム要素が表示される', async ({ page }) => {
    await page.goto('/reset-password');

    await expect(page.getByLabel('メールアドレス')).toBeVisible();
    await expect(page.getByRole('button', { name: '送信' })).toBeVisible();
    await expect(page.getByText('ログインに戻る')).toBeVisible();
  });

  test('ログイン画面から新規登録画面へ遷移', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: '新規登録' }).click();

    await expect(page).toHaveURL(/\/signup/);
  });

  test('ログイン画面からパスワードリセット画面へ遷移', async ({ page }) => {
    await page.goto('/login');

    await page.getByText('パスワードを忘れた方').click();

    await expect(page).toHaveURL(/\/reset-password/);
  });
});
