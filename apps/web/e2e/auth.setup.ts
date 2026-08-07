import { test as setup, expect } from '@playwright/test';

const STORAGE_STATE = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables are required.\n' +
        'Set them in apps/web/.env.local or export before running tests.'
    );
  }

  await page.goto('/login');

  await page.getByLabel('メールアドレス').fill(email);
  await page.getByLabel('パスワード').fill(password);
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();

  await expect(page).toHaveURL('/home', { timeout: 10000 });

  await page.context().storageState({ path: STORAGE_STATE });
});
