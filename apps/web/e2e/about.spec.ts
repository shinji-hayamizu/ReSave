import { test, expect } from '@playwright/test';

test.describe('ReSaveについてページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about');
    const url = page.url();
    if (url.includes('/login')) {
      test.skip(true, '認証が必要です（auth.setupが成功している必要があります）');
    }
  });

  test.describe('ページ構造', () => {
    test('ページタイトルが表示される', async ({ page }) => {
      await expect(page.getByText('ReSaveについて')).toBeVisible();
    });

    test('説明テキストが表示される', async ({ page }) => {
      await expect(page.getByText('アプリの概要と使い方')).toBeVisible();
    });
  });

  test.describe('アプリ情報セクション', () => {
    test('「アプリ情報」見出しが表示される', async ({ page }) => {
      await expect(page.getByText('アプリ情報')).toBeVisible();
    });

    test('アプリ名「ReSave」が表示される', async ({ page }) => {
      await expect(page.getByText('アプリ名')).toBeVisible();
      await expect(page.getByText('ReSave').first()).toBeVisible();
    });

    test('バージョン「1.0.0」が表示される', async ({ page }) => {
      await expect(page.getByText('バージョン')).toBeVisible();
      await expect(page.getByText('1.0.0')).toBeVisible();
    });
  });

  test.describe('忘却曲線セクション', () => {
    test('「忘却曲線と間隔反復学習」見出しが表示される', async ({ page }) => {
      await expect(page.getByText('忘却曲線と間隔反復学習')).toBeVisible();
    });
  });

  test.describe('復習スケジュールセクション', () => {
    test('「復習スケジュール」見出しが表示される', async ({ page }) => {
      await expect(page.getByText('復習スケジュール')).toBeVisible();
    });

    test('間隔バッジが表示される', async ({ page }) => {
      await expect(page.getByText('1日後', { exact: true })).toBeVisible();
      await expect(page.getByText('3日後', { exact: true })).toBeVisible();
      await expect(page.getByText('7日後', { exact: true })).toBeVisible();
      await expect(page.getByText('14日後', { exact: true })).toBeVisible();
      await expect(page.getByText('30日後', { exact: true })).toBeVisible();
      await expect(page.getByText('180日後', { exact: true })).toBeVisible();
    });

    test('OK評価の説明が表示される', async ({ page }) => {
      await expect(page.getByText('次の間隔へ進みます')).toBeVisible();
    });

    test('Again評価の説明が表示される', async ({ page }) => {
      await expect(page.getByText('最初の間隔（1日後）からやり直します')).toBeVisible();
    });

    test('Remembered評価の説明が表示される', async ({ page }) => {
      await expect(page.getByText('復習完了として学習キューから外れます')).toBeVisible();
    });
  });

  test.describe('使い方ガイドセクション', () => {
    test('「使い方ガイド」見出しが表示される', async ({ page }) => {
      await expect(page.getByText('使い方ガイド')).toBeVisible();
    });

    test('ステップ1「カードを作成する」が表示される', async ({ page }) => {
      await expect(page.getByText('1. カードを作成する')).toBeVisible();
    });

    test('ステップ2「タグで整理する」が表示される', async ({ page }) => {
      await expect(page.getByText('2. タグで整理する')).toBeVisible();
    });

    test('ステップ3「毎日復習する」が表示される', async ({ page }) => {
      await expect(page.getByText('3. 毎日復習する')).toBeVisible();
    });

    test('ステップ4「継続する」が表示される', async ({ page }) => {
      await expect(page.getByText('4. 継続する')).toBeVisible();
    });
  });
});
