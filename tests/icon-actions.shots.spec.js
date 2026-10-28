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
  await page.addStyleTag({ content: '.kima-carousel-forward-enter-active,.kima-carousel-forward-leave-active,.kima-carousel-backward-enter-active,.kima-carousel-backward-leave-active{transition-duration:1000ms!important}' });
  const viewport = carousel.locator('.kima-carousel__viewport');
  const origin = await viewport.boundingBox();
  await next.click();
  await expect(carousel.locator('output')).toHaveText('2 / 2');
  const forward = await carousel.locator('.kima-carousel__slide').evaluateAll(nodes => nodes.map(node => ({ text: node.textContent.trim(), transform: getComputedStyle(node).transform, position: getComputedStyle(node).position, width: node.getBoundingClientRect().width })));
  const enteringForward = forward.find(node => node.text.includes('Second'));
  const leavingForward = forward.find(node => node.text.includes('First'));
  expect(enteringForward.transform).toMatch(/^matrix\(/);
  expect(Number(enteringForward.transform.split(',')[4])).toBeGreaterThan(0);
  expect(leavingForward.position).toBe('absolute');
  expect(enteringForward.width).toBe(leavingForward.width);
  expect(enteringForward.width).toBeLessThanOrEqual(origin.width);
  await expect(next).toBeDisabled();
  await prev.click();
  await expect(carousel.locator('output')).toHaveText('1 / 2');
  const backward = await carousel.locator('.kima-carousel__slide').evaluateAll(nodes => nodes.map(node => ({ text: node.textContent.trim(), transform: getComputedStyle(node).transform, position: getComputedStyle(node).position })));
  const enteringBackward = backward.find(node => node.text.includes('First'));
  const leavingBackward = backward.find(node => node.text.includes('Second'));
  expect(Number(enteringBackward.transform.split(',')[4])).toBeLessThan(0);
  expect(leavingBackward.position).toBe('absolute');
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

test('图标操作：轮播快速反向切换取消旧方向动画', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await fixture(page, '<kima-carousel id="carousel"></kima-carousel>', {
    carousel: {
      items: [
        { title: 'One', content: 'First' },
        { title: 'Two', content: 'Second' },
        { title: 'Three', content: 'Third' },
      ],
    },
  });
  await page.addStyleTag({ content: '.kima-carousel-forward-enter-active,.kima-carousel-forward-leave-active,.kima-carousel-backward-enter-active,.kima-carousel-backward-leave-active{transition-duration:1000ms!important}' });
  const carousel = page.locator('#carousel');
  const next = carousel.getByRole('button', { name: '下一张', exact: true });
  const prev = carousel.getByRole('button', { name: '上一张', exact: true });
  await next.click();
  await page.waitForTimeout(120);
  await prev.click();
  await expect(carousel.locator('output')).toHaveText('1 / 3');
  const interrupted = await carousel.locator('.kima-carousel__slide').evaluateAll(nodes => nodes.map(node => ({
    text: node.textContent.trim(),
    classes: [...node.classList],
    transform: getComputedStyle(node).transform,
    position: getComputedStyle(node).position,
    animations: node.getAnimations().map(animation => animation.animationName ?? animation.transitionProperty ?? ''),
  })));
  expect(interrupted).toHaveLength(2);
  const entering = interrupted.find(node => node.text.includes('First'));
  const leaving = interrupted.find(node => node.text.includes('Second'));
  expect(entering.classes).toContain('kima-carousel-backward-enter-active');
  expect(entering.transform).toMatch(/^matrix\(/);
  expect(Number(entering.transform.split(',')[4])).toBeLessThan(0);
  expect(leaving.position).toBe('absolute');
  expect(leaving.animations.every(name => name === '' || name.includes('transform') || name.includes('opacity'))).toBe(true);
  await page.waitForTimeout(1100);
  await expect(carousel.locator('.kima-carousel__slide')).toHaveCount(1);
  await expect(carousel.locator('.kima-carousel__slide')).toContainText('First');
});

test('图标操作：通知队列堆叠、补位与边缘进出场', async ({ page }) => {
  await page.setViewportSize({ width: 720, height: 520 });
  await fixture(page, '<kima-notification-queue id="queue" position="top-right"></kima-notification-queue>', {
    queue: { items: [
      { id: 'a', heading: '同步完成', message: '第一条', variant: 'success', duration: 0 },
      { id: 'b', heading: '新消息', message: '第二条', variant: 'info', duration: 0 },
      { id: 'c', heading: '警告', message: '第三条', variant: 'warning', duration: 0 },
    ] },
  });
  const queue = page.locator('#queue');
  const items = queue.locator('.kima-notification-queue__item');
  await expect(items).toHaveCount(3);
  const initial = await items.evaluateAll(nodes => nodes.map(node => {
    const rect = node.getBoundingClientRect();
    return { text: node.textContent.trim(), x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }));
  expect(initial[0].x).toBe(initial[1].x);
  expect(initial[1].x).toBe(initial[2].x);
  expect(initial[1].y - initial[0].y).toBeGreaterThan(0);
  expect(initial[2].y - initial[1].y).toBe(initial[1].y - initial[0].y);
  expect(initial[0].width).toBe(initial[1].width);
  const alignment = await items.first().evaluate(node => {
    const icon = node.querySelector('.kima-notification__icon')?.getBoundingClientRect();
    const title = node.querySelector('.kima-notification__title')?.getBoundingClientRect();
    const close = node.querySelector('.kima-notification__close')?.getBoundingClientRect();
    return {
      iconCenter: icon ? icon.top + icon.height / 2 : null,
      titleCenter: title ? title.top + title.height / 2 : null,
      closeCenter: close ? close.top + close.height / 2 : null,
    };
  });
  expect(alignment.iconCenter).not.toBeNull();
  expect(alignment.titleCenter).not.toBeNull();
  expect(alignment.closeCenter).not.toBeNull();
  expect(Math.abs(alignment.iconCenter - alignment.titleCenter)).toBeLessThanOrEqual(2);
  expect(Math.abs(alignment.closeCenter - alignment.titleCenter)).toBeLessThanOrEqual(2);
  await page.addStyleTag({ content: '#queue{--kima-duration-medium:1000ms;--kima-duration-slower:1000ms}' });
  const secondClose = items.nth(1).locator('.kima-notification__close');
  await secondClose.click();
  const leavingLocator = items.filter({ hasText: '第二条' });
  await expect(leavingLocator).toHaveClass(/kima-notification-queue-leave-active/);
  await leavingLocator.evaluate(node => {
    for (const animation of node.getAnimations()) {
      if (animation instanceof CSSTransition) {
        animation.pause();
        animation.currentTime = 120;
      }
    }
  });
  const leaving = await items.evaluateAll(nodes => nodes.map(node => ({
    text: node.textContent.trim(),
    classes: [...node.classList],
    transform: getComputedStyle(node).transform,
    position: getComputedStyle(node).position,
    transitions: node.getAnimations().map(animation => animation.transitionProperty ?? ''),
  })));
  const leavingItem = leaving.find(item => item.text.includes('第二条'));
  expect(leavingItem.classes).toContain('kima-notification-queue-leave-active');
  expect(leavingItem.position).toBe('absolute');
  expect(leavingItem.transform).toMatch(/^matrix\(/);
  expect(Number(leavingItem.transform.split(',')[4])).toBeGreaterThan(0);
  expect(leavingItem.transitions).toContain('transform');
  await expect(items).toHaveCount(3);
  await leavingLocator.evaluate(node => {
    for (const animation of node.getAnimations()) if (animation instanceof CSSTransition) animation.finish();
  });
  await expect(items).toHaveCount(2);
  const settled = await items.evaluateAll(nodes => nodes.map(node => node.textContent.trim()));
  expect(settled).toEqual(expect.arrayContaining(['同步完成第一条', '警告第三条']));
  const enterItems = queue.locator('.kima-notification-queue__item');
  await page.evaluate(() => { document.getElementById('queue').items = []; });
  await expect(enterItems).toHaveCount(0);
  await page.evaluate(() => { document.getElementById('queue').items = [{ id: 'x', heading: '进场', message: '中间帧', variant: 'info', duration: 0 }]; });
  const enteringLocator = enterItems.first();
  await expect(enteringLocator).toHaveClass(/kima-notification-queue-enter-active/);
  await enteringLocator.evaluate(node => {
    for (const animation of node.getAnimations()) {
      if (animation instanceof CSSTransition) {
        animation.pause();
        animation.currentTime = 60;
      }
    }
  });
  const entering = await enteringLocator.evaluate(node => ({
    classes: [...node.classList],
    transform: getComputedStyle(node).transform,
    transitions: node.getAnimations().map(animation => animation.transitionProperty ?? ''),
  }));
  expect(entering.classes).toContain('kima-notification-queue-enter-active');
  expect(entering.transform).toMatch(/^matrix\(/);
  expect(Number(entering.transform.split(',')[4])).toBeGreaterThan(0);
  expect(entering.transitions).toContain('transform');
  await enteringLocator.evaluate(node => {
    for (const animation of node.getAnimations()) if (animation instanceof CSSTransition) animation.finish();
  });
  await expect(enterItems).toHaveCount(1);
});

test('图标操作：通知队列位置、窄屏安全边距、RTL 与容量挤出', async ({ page }) => {
  const noticeItems = [
    { id: 'a', heading: 'A', message: '第一条', variant: 'info', duration: 0 },
    { id: 'b', heading: 'B', message: '第二条', variant: 'success', duration: 0 },
    { id: 'c', heading: 'C', message: '第三条', variant: 'warning', duration: 0 },
  ];
  async function mountQueue(position, items = noticeItems, capacity = 3) {
    await fixture(page, '<kima-notification-queue id="queue"></kima-notification-queue>', {
      queue: { position, items, capacity },
    });
    return page.locator('#queue');
  }
  async function queueBox(queue) {
    return queue.locator('.kima-notification-queue').evaluate(node => {
      const rect = node.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
  }

  await page.setViewportSize({ width: 720, height: 520 });
  let queue;
  let box;
  for (const position of ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']) {
    queue = await mountQueue(position, noticeItems.slice(0, 1));
    await page.waitForTimeout(250);
    const box = await queueBox(queue);
    if (position.endsWith('left')) expect(Math.abs(box.x - 16)).toBeLessThanOrEqual(1);
    else if (position.endsWith('right')) expect(Math.abs(box.x + box.width - 704)).toBeLessThanOrEqual(1);
    else expect(box.x + box.width / 2).toBeCloseTo(360, 0);
    if (position.startsWith('top')) expect(Math.abs(box.y - 16)).toBeLessThanOrEqual(1);
    else expect(Math.abs(box.y + box.height - 504)).toBeLessThanOrEqual(1);
  }

  await page.setViewportSize({ width: 320, height: 700 });
  queue = await mountQueue('top-right', noticeItems.slice(0, 1));
  box = await queueBox(queue);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(320);
  await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
  await page.evaluate(() => { document.getElementById('queue').items = []; });
  await page.waitForTimeout(300);
  await page.evaluate(() => { document.getElementById('queue').items = [{ id: 'rtl', heading: 'RTL', message: '从物理右侧进入', variant: 'info', duration: 0 }]; });
  await page.waitForTimeout(60);
  const rtlEntering = await queue.locator('.kima-notification-queue__item').evaluate(node => ({
    transform: getComputedStyle(node).transform,
    classes: [...node.classList],
  }));
  expect(rtlEntering.classes).toContain('kima-notification-queue-enter-active');
  expect(Number(rtlEntering.transform.split(',')[4])).toBeGreaterThan(0);
  await page.evaluate(() => { document.documentElement.dir = 'ltr'; });

  await page.setViewportSize({ width: 720, height: 520 });
  queue = await mountQueue('top-right', noticeItems.slice(0, 2), 2);
  const items = queue.locator('.kima-notification-queue__item');
  await expect(items).toHaveCount(2);
  await page.evaluate(() => {
    document.getElementById('queue').items = [
      { id: 'a', heading: 'A', message: '第一条', variant: 'info', duration: 0 },
      { id: 'b', heading: 'B', message: '第二条', variant: 'success', duration: 0 },
      { id: 'c', heading: 'C', message: '第三条', variant: 'warning', duration: 0 },
    ];
  });
  await page.waitForTimeout(60);
  const capacityFrame = await items.evaluateAll(nodes => nodes.map(node => ({
    text: node.textContent.trim(),
    classes: [...node.classList],
    position: getComputedStyle(node).position,
  })));
  expect(capacityFrame).toHaveLength(3);
  expect(capacityFrame.find(item => item.text.includes('第一条')).classes).toContain('kima-notification-queue-leave-active');
  expect(capacityFrame.find(item => item.text.includes('第一条')).position).toBe('absolute');
  await page.waitForTimeout(700);
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText('第二条');
  await expect(items.nth(1)).toContainText('第三条');
});

test('图标操作：通知服务去重更新保留队列节点', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('/#/components/notification-queue', { waitUntil: 'networkidle' });
  const demo = page.locator('.kima-examples .kima-gallery__demo:visible');
  await expect(demo).toHaveCount(1);
  const push = demo.getByRole('button', { name: '推送 / 去重', exact: true });
  await push.click();
  const notice = page.locator('.kima-notification-queue__item');
  await expect(notice).toHaveCount(1);
  await expect(notice).toContainText('项目已保存');
  await page.waitForTimeout(700);
  await notice.evaluate(node => { window.__kimaDedupeNode = node; });
  await push.click();
  await expect(notice).toHaveCount(1);
  const updateState = await notice.evaluate(node => ({
    sameNode: node === window.__kimaDedupeNode,
    classes: [...node.classList],
    transitions: node.getAnimations().map(animation => animation.transitionProperty ?? ''),
    text: node.textContent,
  }));
  expect(updateState.sameNode).toBe(true);
  expect(updateState.classes).not.toContain('kima-notification-queue-enter-active');
  expect(updateState.classes).not.toContain('kima-notification-queue-leave-active');
  expect(updateState.transitions).toEqual([]);
  expect(updateState.text).toContain('项目已保存');
  await demo.getByRole('button', { name: '清空通知', exact: true }).click();
  await expect(notice).toHaveCount(0);
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
