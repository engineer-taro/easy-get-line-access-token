import dotenv from 'dotenv';
import fs from 'fs';
import { test, Page } from '@playwright/test';

dotenv.config();
const STATE_FILE_PATH = './state.json';

type FirstPageType = 'AUTO_LOGIN' | 'MAIL_ADDRESS_LOGIN' | 'LIFF_APP';

test('アクセストークン取得', async ({ browser }) => {
  checkSettingEnv();

  const page = fs.existsSync(STATE_FILE_PATH)
    ? await browser.newPage({ storageState: STATE_FILE_PATH })
    : await browser.newPage();

  await page.goto(process.env.LIFF_URL || '');

  await page.waitForLoadState('networkidle');

  const firstPageType = await identifyFirstPage({ url: page.url(), page });

  await login({ firstPageType, page });

  // Cookie, LocalStorage の反映待ち
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  const context = await page.context().storageState({ path: STATE_FILE_PATH });
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

// 最初に遷移するページの判別を行う
const identifyFirstPage = async ({
  url,
  page,
}: {
  url: string;
  page: Page;
}): Promise<FirstPageType> => {
  if (url.includes('https://access.line.me/oauth2/v2.1/login')) {
    // NOTE: メールアドレス入力不要のログイン画面の判定をプロフィールアバターの有無で行う
    if ((await page.locator('.profile-avatar').count()) > 0) {
      return 'AUTO_LOGIN';
    }
    return 'MAIL_ADDRESS_LOGIN';
  }

  if (url.includes('https://access.line.me/oauth2/v2.1/noauto-login')) {
    return 'MAIL_ADDRESS_LOGIN';
  }

  return 'LIFF_APP';
};

const login = async ({
  firstPageType,
  page,
}: {
  firstPageType: FirstPageType;
  page: Page;
}) => {
  switch (firstPageType) {
    case 'AUTO_LOGIN':
      await page.click('button:has-text("ログイン")');
      break;
    case 'MAIL_ADDRESS_LOGIN':
      await page
        .getByPlaceholder('メールアドレス')
        .fill(process.env.LINE_MAIL_ADDRESS || '');
      await page
        .getByPlaceholder('パスワード')
        .fill(process.env.LINE_PASSWORD || '');
      await page.click('text=ログイン');
      await page.waitForLoadState('networkidle');
      if ((await page.getByText(' 許可が必要な項目 ').count()) > 0) {
        throw new Error(
          '初回の友達登録画面が表示されているため、手動で許可したのちに再度実行してください'
        );
      }
      break;
    case 'LIFF_APP':
      // LIFFの画面に遷移する場合はログイン処理不要
      break;
    default:
      throw new Error('不明なページタイプです');
  }
};
