/* 正式文档站截图：pnpm shots。截图不提交，供视觉验收。 */
import { expect, test } from '@playwright/test';

test('文档站桌面深浅主题与组件页', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('h1')).toBeVisible();
  await page.screenshot({ path: 'shots/docs-home-dark.png', scale: 'css' });
  await page.getByRole('button', { name: '切换浅色', exact: true }).click();
  await page.waitForTimeout(300); // 等待 token 配色和状态层过渡结束，不拍主题中间帧。
  await page.screenshot({ path: 'shots/docs-home-light.png', scale: 'css' });
  await page.goto('/#/components/button', { waitUntil: 'networkidle' });
  await expect(page.locator('.kima-docs__canvas .kima-button').first()).toBeVisible();
  await page.screenshot({ path: 'shots/docs-button-light.png', scale: 'css' });
  await page.goto('/#/components/table', { waitUntil: 'networkidle' });
  await expect(page.locator('.kima-docs__canvas table')).toBeVisible();
  await page.screenshot({ path: 'shots/docs-table.png', scale: 'css' });
});

test('代码块深浅主题与窄屏', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (text) => {
        if (window.rejectCopy) throw new Error('Clipboard denied');
        window.copiedCode = text;
      },
    } });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/#/components/code-block', { waitUntil: 'networkidle' });
  const block = page.locator('.kima-docs__canvas .kima-code-block').first();
  await expect(block).toBeVisible();
  const wrap = block.getByRole('button', { name: '自动换行', exact: true });
  const copy = block.getByRole('button', { name: '复制代码', exact: true });
  await expect(wrap.locator('svg')).toHaveCount(1);
  await expect(copy.locator('svg')).toHaveCount(1);
  expect(await copy.textContent()).toBe('');
  await page.screenshot({ path: 'shots/code-block-dark.png', scale: 'css' });
  await block.screenshot({ path: 'shots/code-block-icons-dark.png', scale: 'css' });
  await wrap.focus();
  await expect(block.getByRole('tooltip')).toHaveText('开启自动换行');
  await wrap.press('Space');
  await expect(wrap).toHaveAttribute('aria-pressed', 'true');
  await expect(block).toHaveClass(/kima-code-block--wrap/);
  await wrap.press('Escape');
  await expect(block.getByRole('tooltip')).toBeHidden();
  const before = await copy.boundingBox();
  const copyIcon = await copy.locator('svg').innerHTML();
  await copy.focus();
  await copy.press('Enter');
  await expect(block.getByRole('status')).toHaveText('已复制');
  await expect(copy).toHaveAttribute('title', '已复制');
  await expect.poll(() => copy.locator('svg').innerHTML()).not.toBe(copyIcon);
  expect(await page.evaluate(() => window.copiedCode)).toContain('applyPalette');
  const after = await copy.boundingBox();
  expect(after.width).toBe(before.width);
  expect(after.height).toBe(before.height);
  await block.screenshot({ path: 'shots/code-block-icons-copied.png', scale: 'css' });
  await copy.press('Escape');
  await page.getByRole('button', { name: '切换浅色', exact: true }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'shots/code-block-light.png', scale: 'css' });
  await block.screenshot({ path: 'shots/code-block-icons-light.png', scale: 'css' });
  await page.setViewportSize({ width: 320, height: 700 });
  await page.locator('#preview').scrollIntoViewIfNeeded();
  await expect(wrap).toBeInViewport();
  await expect(copy).toBeInViewport();
  await page.screenshot({ path: 'shots/code-block-mobile.png', scale: 'css' });
  await block.screenshot({ path: 'shots/code-block-icons-mobile.png', scale: 'css' });
  await page.evaluate(() => { window.rejectCopy = true; });
  await copy.focus();
  await copy.press('Enter');
  await expect(block.getByRole('status')).toHaveText('复制失败，请选择代码手动复制');
  await expect(copy).toBeEnabled();
  await copy.press('Escape');
  await block.screenshot({ path: 'shots/code-block-icons-copy-error.png', scale: 'css' });

  // 同样的内置图标按钮必须在原生自定义元素接入下保留行为及事件。
  await page.goto('/tests/fixture.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => window.fixture.mount('<kima-code-block id="code"></kima-code-block>', { code: { code: 'const native = true;', language: 'javascript' } }));
  await page.getByRole('button', { name: '复制代码', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('已复制');
  expect(await page.evaluate(() => window.fixture.events.filter(event => event.type === 'copy'))).toEqual([
    expect.objectContaining({ id: 'code', detail: ['const native = true;'] }),
  ]);
  await page.evaluate(() => { document.getElementById('code').copyable = false; document.getElementById('code').wrap = true; });
  await expect(page.getByRole('button', { name: '复制代码', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '自动换行', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('新增分组在正式文档站的深浅与窄屏效果', async ({ page }) => {
  for (const slug of ['radio-group', 'alert', 'accordion', 'multi-select']) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/#/components/${slug}`, { waitUntil: 'networkidle' });
    await expect(page.locator('.kima-docs__canvas .kima-gallery__demo')).toBeVisible();
    const switchDark = page.getByRole('button', { name: '切换深色', exact: true });
    if (await switchDark.count()) await switchDark.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `shots/expansion-${slug}-dark.png`, scale: 'css' });
    await page.getByRole('button', { name: '切换浅色', exact: true }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `shots/expansion-${slug}-light.png`, scale: 'css' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#preview').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `shots/expansion-${slug}-mobile.png`, scale: 'css' });
  }
});

test('文档站窄屏导航', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'shots/docs-mobile.png', scale: 'css' });
  await page.getByRole('button', { name: '打开文档导航' }).click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.screenshot({ path: 'shots/docs-mobile-navigation.png', scale: 'css' });
});

test('最终145关键组件正式站截图：日期、上传、虚拟表格、编辑器、图表、菜单与移动端', async ({ page }) => {
  async function settle() {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(350);
  }
  async function setTheme(theme) {
    const button = page.getByRole('button', { name: theme === 'dark' ? '切换深色' : '切换浅色', exact: true });
    if (await button.count()) await button.click();
    await page.waitForTimeout(350);
  }
  const cases = [
    ['date-range-picker', 'date-range-picker'],
    ['calendar', 'calendar'],
    ['file-upload', 'file-upload'],
    ['virtual-table', 'virtual-table'],
    ['rich-text-editor', 'rich-text-editor'],
    ['chart', 'chart'],
    ['menu', 'menu'],
    ['navigation-menu', 'navigation-menu'],
  ];
  for (const [slug, name] of cases) {
    await page.goto(`/#/components/${slug}`, { waitUntil: 'networkidle' });
    await expect(page.locator('.kima-docs__canvas')).toBeVisible();
    await expect(page.locator('.kima-examples .kima-gallery__demo:visible')).toHaveCount(1);
    await setTheme('dark');
    await settle();
    await page.screenshot({ path: `shots/final-145/${name}-desktop-dark.png`, scale: 'css' });
    await setTheme('light');
    await settle();
    await page.screenshot({ path: `shots/final-145/${name}-desktop-light.png`, scale: 'css' });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/components/navigation-menu', { waitUntil: 'networkidle' });
  await expect(page.locator('.kima-examples .kima-gallery__demo:visible')).toHaveCount(1);
  await setTheme('light');
  await settle();
  await page.locator('#preview').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'shots/final-145/menus-mobile.png', scale: 'css' });
  await page.goto('/', { waitUntil: 'networkidle' });
  await settle();
  await page.screenshot({ path: 'shots/final-145/docs-mobile-settled.png', scale: 'css' });
});
