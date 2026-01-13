import { test, expect } from '@playwright/test';

test.describe('ホーム画面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 認証済みの場合はホーム画面、未認証の場合はログイン画面にリダイレクト
    // ログイン画面にリダイレクトされた場合はテストをスキップ
    const url = page.url();
    if (url.includes('/login')) {
      test.skip(true, '認証が必要です（auth.setupが成功している必要があります）');
    }
  });

  test.describe('ページ構造', () => {
    test('必須要素が表示される', async ({ page }) => {
      // クイック入力フォーム
      await expect(page.getByPlaceholder('覚えたいこと')).toBeVisible();
      await expect(page.getByPlaceholder('答え（任意）')).toBeVisible();

      // タブ
      await expect(page.getByText('未学習')).toBeVisible();
      await expect(page.getByText('復習中')).toBeVisible();
      await expect(page.getByText('完了')).toBeVisible();
    });

    test('デフォルトで未学習タブがアクティブ', async ({ page }) => {
      const dueTab = page.getByText('未学習').first();
      await expect(dueTab).toBeVisible();
      // アクティブタブはprimary色のボーダーを持つ
      await expect(dueTab.locator('..')).toHaveClass(/border-b-primary/);
    });
  });

  test.describe('クイック入力フォーム', () => {
    test('問題のみ入力でカード追加可能', async ({ page }) => {
      const frontInput = page.getByPlaceholder('覚えたいこと');
      const submitButton = page.locator('button[type="submit"]');

      // 初期状態ではボタンが無効
      await expect(submitButton).toBeDisabled();

      // 問題を入力
      await frontInput.fill('テスト問題');

      // ボタンが有効化される
      await expect(submitButton).toBeEnabled();
    });

    test('問題と答え両方入力でカード追加可能', async ({ page }) => {
      const frontInput = page.getByPlaceholder('覚えたいこと');
      const backInput = page.getByPlaceholder('答え（任意）');
      const submitButton = page.locator('button[type="submit"]');

      await frontInput.fill('テスト問題');
      await backInput.fill('テスト答え');

      await expect(submitButton).toBeEnabled();
    });

    test('空白のみの入力ではボタンが無効', async ({ page }) => {
      const frontInput = page.getByPlaceholder('覚えたいこと');
      const submitButton = page.locator('button[type="submit"]');

      await frontInput.fill('   ');

      await expect(submitButton).toBeDisabled();
    });

    test('クリアボタンで入力をリセット', async ({ page }) => {
      const frontInput = page.getByPlaceholder('覚えたいこと');

      await frontInput.fill('テスト問題');

      // クリアボタンをクリック
      const clearButton = page.locator('button[title="クリア"]').first();
      await clearButton.click();

      await expect(frontInput).toHaveValue('');
    });

    test('詳細入力ボタンでダイアログが開く', async ({ page }) => {
      const detailButton = page.locator('button[title="詳細入力"]');

      await detailButton.click();

      // ダイアログが開く
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('カード追加成功時にトーストが表示される', async ({ page }) => {
      const frontInput = page.getByPlaceholder('覚えたいこと');
      const submitButton = page.locator('button[type="submit"]');

      await frontInput.fill('新しいカード');
      await submitButton.click();

      // 成功トーストを確認
      await expect(page.getByText('カードを追加しました')).toBeVisible();

      // 入力がクリアされる
      await expect(frontInput).toHaveValue('');
    });
  });

  test.describe('タブ切り替え', () => {
    test('復習中タブに切り替え', async ({ page }) => {
      const learningTab = page.getByText('復習中').first();

      await learningTab.click();

      await expect(learningTab.locator('..')).toHaveClass(/border-b-primary/);
    });

    test('完了タブに切り替え', async ({ page }) => {
      const completedTab = page.getByText('完了').first();

      await completedTab.click();

      await expect(completedTab.locator('..')).toHaveClass(/border-b-primary/);
    });

    test('タブ間を往復', async ({ page }) => {
      const dueTab = page.getByText('未学習').first();
      const learningTab = page.getByText('復習中').first();
      const completedTab = page.getByText('完了').first();

      await learningTab.click();
      await expect(learningTab.locator('..')).toHaveClass(/border-b-primary/);

      await completedTab.click();
      await expect(completedTab.locator('..')).toHaveClass(/border-b-primary/);

      await dueTab.click();
      await expect(dueTab.locator('..')).toHaveClass(/border-b-primary/);
    });
  });

  test.describe('空状態', () => {
    test('カードがない場合に空状態メッセージが表示される', async ({ page }) => {
      // 空状態の場合のメッセージを確認
      const emptyMessage = page.getByText('新しいカードを追加して学習を始めましょう');

      // 空状態メッセージが表示されるか、カードが表示されるかのいずれか
      const hasCards = await page.locator('[data-testid="study-card"]').count() > 0;

      if (!hasCards) {
        await expect(emptyMessage).toBeVisible();
      }
    });
  });

  test.describe('カード操作', () => {
    test('カードが存在する場合、評価ボタンが表示される', async ({ page }) => {
      // カードが存在する場合のみテスト
      const cardCount = await page.locator('[data-testid="study-card"]').count();

      if (cardCount > 0) {
        await expect(page.getByRole('button', { name: /OK/ }).first()).toBeVisible();
        await expect(page.getByRole('button', { name: /覚えた/ }).first()).toBeVisible();
      }
    });

    test('答えを見る/隠すが切り替わる', async ({ page }) => {
      const cardCount = await page.locator('[data-testid="study-card"]').count();

      if (cardCount > 0) {
        const showAnswerButton = page.getByRole('button', { name: '答えを見る' }).first();

        // 答えが存在するカードの場合
        const hasShowAnswerButton = await showAnswerButton.count() > 0;
        if (hasShowAnswerButton) {
          await showAnswerButton.click();
          await expect(page.getByRole('button', { name: '答えを隠す' }).first()).toBeVisible();
        }
      }
    });
  });

  test.describe('レスポンシブ', () => {
    test('モバイルビューでも正常に表示される', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.getByPlaceholder('覚えたいこと')).toBeVisible();
      await expect(page.getByText('未学習')).toBeVisible();
    });

    test('タブレットビューでも正常に表示される', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.getByPlaceholder('覚えたいこと')).toBeVisible();
      await expect(page.getByText('未学習')).toBeVisible();
    });
  });
});

test.describe('カード追加フロー', () => {
  test('新しいカードを追加して未学習タブに表示される', async ({ page }) => {
    await page.goto('/');
    if (page.url().includes('/login')) {
      test.skip(true, '認証が必要です');
    }

    const frontInput = page.getByPlaceholder('覚えたいこと');
    const backInput = page.getByPlaceholder('答え（任意）');
    const submitButton = page.locator('button[type="submit"]');

    const uniqueQuestion = `E2Eテスト問題_${Date.now()}`;
    const uniqueAnswer = `E2Eテスト答え_${Date.now()}`;

    await frontInput.fill(uniqueQuestion);
    await backInput.fill(uniqueAnswer);
    await submitButton.click();

    // 成功トースト
    await expect(page.getByText('カードを追加しました')).toBeVisible();

    // 未学習タブに追加されたカードが表示される
    await expect(page.getByText(uniqueQuestion)).toBeVisible();
  });
});

test.describe('詳細入力ダイアログ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    if (page.url().includes('/login')) {
      test.skip(true, '認証が必要です');
    }
  });

  test('ダイアログでカードを作成', async ({ page }) => {

    // 詳細入力ボタンをクリック
    await page.locator('button[title="詳細入力"]').click();

    // ダイアログが開く
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // ダイアログ内のフォームに入力
    await dialog.getByLabel('テキスト').fill('詳細入力テスト問題');
    await dialog.getByLabel('隠しテキスト').fill('詳細入力テスト答え');

    // 保存
    await dialog.getByRole('button', { name: '保存' }).click();

    // 成功トースト
    await expect(page.getByText('カードを追加しました')).toBeVisible();
  });

  test('ダイアログをキャンセル', async ({ page }) => {
    // 問題を入力してから詳細入力を開く
    await page.getByPlaceholder('覚えたいこと').fill('テスト');
    await page.locator('button[title="詳細入力"]').click();

    // ダイアログが開く
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // キャンセル
    await dialog.getByRole('button', { name: 'キャンセル' }).click();

    // ダイアログが閉じる
    await expect(dialog).not.toBeVisible();

    // 入力がクリアされる
    await expect(page.getByPlaceholder('覚えたいこと')).toHaveValue('');
  });
});
