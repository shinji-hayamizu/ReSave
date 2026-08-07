import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('ランディングページ', () => {
  test('未認証時: / にアクセスするとLPが表示される', async ({ page }) => {
    // Given: 未認証状態（デフォルト）

    // When: トップページにアクセス
    await page.goto('/');

    // Then: LPのままでリダイレクトされない
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/忘却曲線に基づいた/)).toBeVisible();
  });

  test('ヒーローセクションのキャッチコピーが表示される', async ({ page }) => {
    // Given: 未認証状態

    // When: トップページにアクセス
    await page.goto('/');

    // Then: キャッチコピーが表示される
    await expect(page.getByText(/忘却曲線に基づいた/)).toBeVisible();
    await expect(page.getByText(/記憶に残る学習カード/)).toBeVisible();
  });

  test('無料で始めるボタンが /signup へ遷移する', async ({ page }) => {
    // Given: LP表示状態

    // When: 無料で始めるリンクをクリック
    await page.goto('/');
    await page.getByRole('link', { name: /無料で始める/ }).first().click();

    // Then: 新規登録ページへ遷移する
    await expect(page).toHaveURL(/\/signup/);
  });

  test('ログインリンクが /login へ遷移する', async ({ page }) => {
    // Given: LP表示状態

    // When: ログインリンクをクリック
    await page.goto('/');
    await page.getByRole('link', { name: /ログイン/ }).first().click();

    // Then: ログインページへ遷移する
    await expect(page).toHaveURL(/\/login/);
  });

  test('特徴セクションの3つのカードが表示される', async ({ page }) => {
    // Given: LP表示状態

    // When: トップページにアクセス
    await page.goto('/');

    // Then: 3つの特徴カードが表示される
    await expect(page.getByText('科学的な復習タイミング')).toBeVisible();
    await expect(page.getByText('URLも一緒に保存')).toBeVisible();
    await expect(page.getByText('シンプルな操作性')).toBeVisible();
  });

  test('使い方セクションの3ステップが表示される', async ({ page }) => {
    // Given: LP表示状態

    // When: トップページにアクセス
    await page.goto('/');

    // Then: 3ステップが表示される
    await expect(page.getByText('カードを作成する')).toBeVisible();
    await expect(page.getByText('毎日の復習をこなす')).toBeVisible();
    await expect(page.getByText('記憶に定着させる')).toBeVisible();
  });

  test('CTAセクションの無料登録するボタンが /signup へ遷移する', async ({ page }) => {
    // Given: LP表示状態

    // When: CTAの無料登録するリンクをクリック
    await page.goto('/');
    await page.getByRole('link', { name: '無料登録する' }).click();

    // Then: 新規登録ページへ遷移する
    await expect(page).toHaveURL(/\/signup/);
  });

  test('ログイン画面にLPへ戻るロゴが表示される', async ({ page }) => {
    // Given: ログイン画面

    // When: ログイン画面にアクセス
    await page.goto('/login');

    // Then: ReSaveロゴがLPへのリンクとして表示される
    const logoLink = page.getByRole('link', { name: 'ReSave' });
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toHaveAttribute('href', '/');
  });

  test('新規登録画面にLPへ戻るロゴが表示される', async ({ page }) => {
    // Given: 新規登録画面

    // When: 新規登録画面にアクセス
    await page.goto('/signup');

    // Then: ReSaveロゴがLPへのリンクとして表示される
    const logoLink = page.getByRole('link', { name: 'ReSave' });
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toHaveAttribute('href', '/');
  });

  test('ログイン画面のReSaveロゴクリックでLPへ遷移する', async ({ page }) => {
    // Given: ログイン画面

    // When: ReSaveロゴをクリック
    await page.goto('/login');
    await page.getByRole('link', { name: 'ReSave' }).click();

    // Then: LPへ遷移する
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/忘却曲線に基づいた/)).toBeVisible();
  });
});
