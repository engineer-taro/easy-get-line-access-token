import { test, expect } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

test('アクセストークン取得', async ({ page }) => {
  checkSettingEnv();
  await page.goto(process.env.LIFF_URL || '');

  await expect(page).toHaveTitle(/LINE Login/, { timeout: 15000 });

  await page
    .getByPlaceholder('メールアドレス')
    .fill(process.env.LINE_MAIL_ADDRESS || '');
  await page
    .getByPlaceholder('パスワード')
    .fill(process.env.LINE_PASSWORD || '');

  await page.click('text=ログイン');

  await page.waitForLoadState('networkidle');
  const friendRecommendation = await page.getByText(' 許可が必要な項目 ');
  if ((await friendRecommendation.count()) > 0) {
    throw new Error(
      '初回の友達登録画面が表示されているため、手動で許可したのちに再度実行してください'
    );
  }

  const context = await page.context().storageState({ path: './state.json' });
  let accessToken = '';
  context.origins.forEach((origin) => {
    origin.localStorage?.forEach((item) => {
      if (item.name.includes('accessToken')) {
        accessToken = item.value;
      }
    });
  });
  console.log(accessToken);
});

const checkSettingEnv = () => {
  if (!process.env.LIFF_URL) {
    throw new Error('環境変数 LIFF_URL が設定されていません');
  }
  if (!process.env.LINE_MAIL_ADDRESS) {
    throw new Error('環境変数 LINE_MAIL_ADDRESS が設定されていません');
  }
  if (!process.env.LINE_PASSWORD) {
    throw new Error('環境変数 LINE_PASSWORD が設定されていません');
  }
};
