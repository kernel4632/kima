import { chromium } from '@playwright/test';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/#/gallery', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const results = {};
  // 对话框
  await page.locator('button:has-text("新建项目")').first().click();
  await page.waitForTimeout(800);
  results.dialog = await page.evaluate(() => !!document.querySelector('dialog.kima-dialog[open]'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  // 抽屉
  await page.locator('button:has-text("筛选")').first().click();
  await page.waitForTimeout(800);
  results.drawer = await page.evaluate(() => !!document.querySelector('dialog.kima-drawer[open]'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  // 命令面板
  await page.locator('button:has-text("搜索…")').first().click();
  await page.waitForTimeout(800);
  results.command = await page.evaluate(() => !!document.querySelector('dialog[open]'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  // 通知
  await page.locator('button:has-text("保存设置")').first().click();
  await page.waitForTimeout(800);
  results.notification = await page.evaluate(() => !!document.querySelector('.kima-notification, [class*="notification"]'));
  console.log('INTERACTIONS:', JSON.stringify(results));
  await browser.close();
})().catch((e) => { console.error('SCRIPT FAIL', e.message); process.exit(1); });
