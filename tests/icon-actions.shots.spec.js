/* 图标化操作的定向交互和视觉验收：仅由 pnpm shots 运行，不增加日常 smoke 耗时。 */
import { expect, test } from '@playwright/test';

async function iconButton(button) {
  await expect(button).toBeVisible();
  await expect(button.locator('svg')).toHaveCount(1);
  expect((await button.textContent()).trim()).toBe('');
  const box = await button.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(40);
  expect(box.height).toBe(box.width);
}

async function fixture(page, html, properties) {
  await page.goto('/tests/fixture.html', { waitUntil: 'networkidle' });
  await page.evaluate(({ html, properties }) => window.fixture.mount(html, properties), { html, properties });
}

async function demoShot(page, demo, path) {
  // 从文档顶部截取组件的页面坐标，不让 sticky 站点页头遮住组件顶部。
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }));
  const clip = await demo.boundingBox();
  await page.screenshot({ path, clip, fullPage: true, scale: 'css' });
}

test('图标操作：编辑器保留搜索、格式、链接、历史与只读禁用', async ({ page }) => {
  await fixture(page, '<kima-code-editor id="source"></kima-code-editor><kima-rich-text-editor id="rich"></kima-rich-text-editor>', {
    source: { modelValue: 'const initial = 1;', label: 'Source' },
    rich: { modelValue: '<p>Initial document</p>', label: 'Document' },
  });
  const source = page.locator('#source');
  for (const name of ['查找', '撤销', '重做']) await iconButton(source.getByRole('button', { name, exact: true }));
  const find = source.getByRole('button', { name: '查找', exact: true });
  await find.focus();
  await expect(source.getByRole('tooltip')).toHaveText('查找');
  await find.press('Escape');
  await expect(source.getByRole('tooltip')).toBeHidden();
  const code = source.locator('.cm-content');
  await code.fill('const changed = 2;');
  await find.click();
  const search = source.locator('.cm-search input[name="search"]');
  await expect(search).toBeVisible();
  await search.fill('changed');
  await search.press('Escape');
  await source.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(code).toHaveText('const initial = 1;');
  await source.getByRole('button', { name: '重做', exact: true }).click();
  await expect(code).toHaveText('const changed = 2;');
  await page.evaluate(() => { document.getElementById('source').readonly = true; });
  await expect(source.getByRole('button', { name: '查找', exact: true })).toBeEnabled();
  await expect(source.getByRole('button', { name: '撤销', exact: true })).toBeDisabled();
  await page.evaluate(() => { document.getElementById('source').disabled = true; });
  await expect(find).toBeDisabled();

  const rich = page.locator('#rich');
  for (const name of ['粗体', '斜体', '标题', '无序列表', '有序列表', '链接', '撤销', '重做']) {
    await iconButton(rich.getByRole('button', { name, exact: true }));
  }
  await expect(rich.getByRole('button', { name: '撤销', exact: true })).toBeDisabled();
  const editor = rich.getByRole('textbox', { name: 'Document', exact: true });
  await editor.fill('Icon toolbar');
  await editor.press('ControlOrMeta+a');
  const bold = rich.getByRole('button', { name: '粗体', exact: true });
  await bold.click();
  await expect(editor.locator('strong')).toHaveText('Icon toolbar');
  await expect(bold).toHaveAttribute('aria-pressed', 'true');
  await expect(bold).toHaveClass(/kima-icon-button--tonal/);
  await rich.getByRole('button', { name: '撤销', exact: true }).click();
  await expect(editor.locator('strong')).toHaveCount(0);
  await rich.getByRole('button', { name: '重做', exact: true }).click();
  await expect(editor.locator('strong')).toHaveText('Icon toolbar');
  await editor.press('ControlOrMeta+a');
  await rich.getByRole('button', { name: '链接', exact: true }).click();
  await expect(rich.getByRole('button', { name: '链接', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await rich.getByRole('textbox', { name: '链接地址', exact: true }).fill('https://example.com/icons');
  await rich.getByRole('button', { name: '应用链接', exact: true }).click();
  await expect(editor.locator('a')).toHaveAttribute('href', 'https://example.com/icons');
  await page.evaluate(() => { document.getElementById('rich').readonly = true; });
  await expect(bold).toBeDisabled();
  await expect(rich.getByRole('button', { name: '链接', exact: true })).toBeDisabled();
});

test('图标操作：动态字段排序边界和文件移除保留表单值', async ({ page }) => {
  await fixture(page, '<kima-dynamic-input id="rows"></kima-dynamic-input><form id="files-form"><kima-file-upload id="files" name="attachments" multiple></kima-file-upload></form>', {
    rows: { modelValue: [{ id: 'a', key: 'Alpha' }, { id: 'b', key: 'Beta' }], min: 1 },
  });
  const rows = page.locator('#rows');
  await iconButton(rows.getByRole('button', { name: '移除第1项', exact: true }));
  await expect(rows.getByRole('button', { name: '字段列表上移第1项', exact: true })).toBeDisabled();
  await expect(rows.getByRole('button', { name: '字段列表下移第2项', exact: true })).toBeDisabled();
  await rows.getByRole('button', { name: '字段列表下移第1项', exact: true }).click();
  await expect(rows.locator('.kima-dynamic-input__row').first().locator('output')).toContainText('Beta');
  await rows.getByRole('button', { name: '字段列表上移第2项', exact: true }).click();
  await expect(rows.locator('.kima-dynamic-input__row').first().locator('output')).toContainText('Alpha');
  await rows.getByRole('button', { name: '移除第1项', exact: true }).click();
  await expect(rows.locator('.kima-dynamic-input__row')).toHaveCount(1);
  await expect(rows.getByRole('button', { name: '移除第1项', exact: true })).toBeDisabled();
  await rows.getByRole('button', { name: '添加字段', exact: true }).click();
  await expect(rows.locator('.kima-dynamic-input__row')).toHaveCount(2);
  await page.evaluate(() => { document.getElementById('rows').disabled = true; });
  for (const button of await rows.getByRole('button').all()) await expect(button).toBeDisabled();

  const files = page.locator('#files');
  await files.locator('input[type=file]').setInputFiles([
    { name: 'alpha.txt', mimeType: 'text/plain', buffer: Buffer.from('Alpha') },
    { name: 'beta.txt', mimeType: 'text/plain', buffer: Buffer.from('Beta') },
  ]);
  const remove = files.getByRole('button', { name: '移除 alpha.txt', exact: true });
  await iconButton(remove);
  await remove.focus();
  await expect(files.getByRole('tooltip')).toHaveText('移除文件');
  await remove.press('Enter');
  await expect(files.getByRole('button', { name: '移除 alpha.txt', exact: true })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => [...new FormData(document.getElementById('files-form')).values()].map(file => file.name))).toEqual(['beta.txt']);
  await page.evaluate(() => { document.getElementById('files').disabled = true; });
  await expect(files.getByRole('button', { name: '移除 beta.txt', exact: true })).toBeDisabled();
});

test('图标操作：轮播方向、侧栏折叠、抽屉焦点与日志状态导出', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await fixture(page, '<kima-carousel id="carousel"></kima-carousel><kima-sidebar id="side"></kima-sidebar><kima-app-shell id="shell"><h2 slot="header">Workspace</h2><p slot="sidebar">Navigation</p><p slot="main">Content</p></kima-app-shell><kima-log-viewer id="log"></kima-log-viewer>', {
    carousel: { items: [{ title: 'One', content: 'First' }, { title: 'Two', content: 'Second' }] },
    side: { items: [{ value: 'home', label: 'Home', href: '#home' }] },
    log: { lines: Array.from({ length: 40 }, (_, i) => `INFO line ${i}`) },
  });
  const carousel = page.locator('#carousel');
  const next = carousel.getByRole('button', { name: '下一张', exact: true });
  const prev = carousel.getByRole('button', { name: '上一张', exact: true });
  await iconButton(next);
  await expect(prev).toBeDisabled();
  await next.click();
  await expect(carousel.locator('output')).toHaveText('2 / 2');
  await expect(next).toBeDisabled();
  await prev.click();
  await page.evaluate(() => { document.getElementById('carousel').dir = 'rtl'; });
  await carousel.locator('section').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(carousel.locator('output')).toHaveText('2 / 2');
  await page.evaluate(() => { document.getElementById('carousel').disabled = true; });
  await expect(prev).toBeDisabled();
  const side = page.locator('#side');
  const fold = side.getByRole('button', { name: '折叠侧栏', exact: true });
  await iconButton(fold);
  await fold.click();
  await expect(side.getByRole('button', { name: '展开侧栏', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await side.getByRole('button', { name: '展开侧栏', exact: true }).click();
  await expect(side.getByRole('button', { name: '折叠侧栏', exact: true })).toHaveAttribute('aria-expanded', 'true');
  const shell = page.locator('#shell');
  await expect(shell.getByRole('button', { name: '打开导航', exact: true })).toHaveCount(0);
  await page.setViewportSize({ width: 320, height: 700 });
  for (const host of [side, shell]) {
    const toggle = host.getByRole('button', { name: '打开导航', exact: true });
    await iconButton(toggle);
    await toggle.focus();
    await toggle.press('Enter');
    await expect(host.getByRole('dialog')).toBeVisible();
    await expect(host.getByRole('button', { name: '关闭导航', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(host.locator('dialog[open]')).toHaveCount(0);
    await expect(host.getByRole('button', { name: '打开导航', exact: true })).toBeFocused();
  }
  const log = page.locator('#log');
  const pause = log.getByRole('button', { name: '暂停跟尾', exact: true });
  await iconButton(pause);
  await pause.click();
  await expect(log.getByRole('status')).toHaveText('已暂停跟尾');
  await expect(log.getByRole('log')).toHaveAttribute('aria-live', 'off');
  await log.getByRole('button', { name: '恢复跟尾', exact: true }).click();
  await expect(log.getByRole('status')).toHaveText('跟随最新');
  await expect(log.getByRole('log')).toHaveAttribute('aria-live', 'polite');
  const downloadEvent = page.waitForEvent('download');
  await log.getByRole('button', { name: '导出日志', exact: true }).click();
  expect((await downloadEvent).suggestedFilename()).toBe('kima-log.txt');
  expect(await page.evaluate(() => window.fixture.events.find(event => event.type === 'export')?.detail[0])).toContain('INFO line 39');
});

for (const slug of ['code-editor', 'rich-text-editor', 'dynamic-input', 'file-upload', 'carousel', 'sidebar', 'app-shell', 'log-viewer']) {
  test(`图标按钮截图：${slug} 深浅主题与窄屏`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/#/components/${slug}`, { waitUntil: 'networkidle' });
    const demo = page.locator('.kima-examples .kima-gallery__demo:visible');
    await expect(demo).toHaveCount(1);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (slug === 'file-upload') {
      await demo.locator('input[type=file]').setInputFiles({ name: 'project-notes-with-a-long-filename.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 KIMA') });
      await expect(demo.getByRole('button', { name: '移除 project-notes-with-a-long-filename.pdf', exact: true })).toBeVisible();
    }
    for (const theme of ['dark', 'light']) {
      const toggle = page.getByRole('button', { name: theme === 'dark' ? '切换深色' : '切换浅色', exact: true });
      if (await toggle.count()) await toggle.click();
      await page.waitForTimeout(350);
      await demoShot(page, demo, `shots/icon-actions/${slug}-${theme}.png`);
    }
    await page.setViewportSize({ width: 320, height: 700 });
    await demo.scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
    await demoShot(page, demo, `shots/icon-actions/${slug}-mobile.png`);
    for (const button of await demo.locator('.kima-icon-button:visible').all()) {
      const box = await button.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(320);
    }
    if (slug === 'sidebar' || slug === 'app-shell') {
      await demo.getByRole('button', { name: '打开导航', exact: true }).click();
      const dialog = demo.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await page.waitForTimeout(350);
      await page.screenshot({ path: `shots/icon-actions/${slug}-mobile-open.png`, scale: 'css' });
      await page.keyboard.press('Escape');
      await expect(demo.locator('dialog[open]')).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}
