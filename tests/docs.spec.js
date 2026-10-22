/* 正式展示站回归：导航、组件自身交互、手机抽屉和源码覆盖。
 * pnpm exec playwright test tests/docs.spec.js
 */
import { expect, test } from '@playwright/test';
import { readdir } from 'node:fs/promises';
const components = (await readdir(new URL('../src/components/', import.meta.url))).filter((file) => file.endsWith('.ce.vue')).map((file) => file.replace('.ce.vue', ''));

test('文档站首页使用 KIMA 控件，组件路径可直达和刷新', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText('让交互，自然发生。');
  await expect(page.locator('.kima-docs__search .kima-text-field__control')).toBeVisible();
  await page.getByRole('button', { name: '探索组件', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Button');
  await expect(page.locator('.kima-docs__canvas .kima-button').first()).toBeVisible();
  await page.reload();
  await expect(page.locator('h1')).toHaveText('Button');
  await page.getByRole('tab', { name: '示例源码', exact: true }).click();
  await expect(page.locator('#preview pre')).toContainText('kima-button');
  await expect(page.locator('#properties table')).toContainText('String');
  await expect(page.locator('#properties table')).toContainText('filled');
  await page.getByRole('button', { name: '查看完整组件源码', exact: true }).click();
  await expect(page.locator('#properties pre')).toContainText('defineProps');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('搜索与移动导航可用，主题切换作用于真实组件', async ({ page, isMobile }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: '搜索组件' }).fill('抽屉');
  if (isMobile) await page.getByRole('button', { name: '打开文档导航' }).click();
  const navigation = isMobile ? page.locator('dialog[open]') : page.locator('.kima-docs__sidebar');
  await navigation.getByRole('button', { name: 'Drawer 抽屉', exact: true }).click();
  await expect(page.locator('h1')).toHaveText('Drawer');
  await page.locator('.kima-docs__canvas').getByRole('button', { name: '右侧抽屉', exact: true }).click();
  const drawer = page.locator('dialog[open]');
  await expect(drawer).toContainText('右侧抽屉');
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.getByRole('button', { name: '切换浅色', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-kima-theme', 'light');
});

test('每个源码组件都有独立文档及可见预览', async ({ page }) => {
  test.setTimeout(180000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const slug of components) {
    await page.goto(`/#/components/${slug}`);
    await expect(page.locator('.kima-docs__canvas')).toBeVisible();
    const demo = page.locator('.kima-examples .kima-gallery__demo:visible');
    if (slug === 'icon') await expect(page.locator('.kima-examples .kima-icon').first()).toBeVisible();
    else await expect(demo).toHaveCount(1);
    await expect(page.locator('#properties')).toContainText('属性参考');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${slug} 不应撑开页面`).toBe(true);
  }
  expect(errors).toEqual([]);
});
