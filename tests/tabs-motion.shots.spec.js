import { expect, test } from '@playwright/test';

async function mountTabs(page, { width = 640, dir = 'ltr', orientation = 'horizontal', longLabels = false, theme = 'dark' } = {}) {
  await page.setViewportSize({ width: Math.max(width + 48, 360), height: 900 });
  await page.goto('/tests/fixture.html', { waitUntil: 'networkidle' });
  await page.evaluate(async ({ width, dir, orientation, longLabels, theme }) => {
    const { createApp, h, ref, nextTick } = await import('/node_modules/.vite/deps/vue.js');
    const { default: Tabs } = await import('/src/components/core/tabs.ce.vue');
    const { applyPalette } = await import('/src/utils/theme.js');
    applyPalette('#61afef', { isDark: theme === 'dark' });
    document.documentElement.dir = dir;
    document.body.style.cssText = 'margin:24px;background:var(--kima-color-surface);color:var(--kima-color-on-surface)';
    const mount = document.getElementById('fixture');
    mount.style.cssText = `display:flex;align-items:center;flex-direction:column;width:${width}px;gap:16px`;
    const selected = ref('a');
    const drafts = ref(['', '', '', '']);
    const items = ref([
      { value: 'a', label: longLabels ? '当前工作项目与详细信息'.repeat(3) : '概览' },
      { value: 'disabled', label: '不可用', disabled: true },
      { value: 'b', label: longLabels ? '最近的交互与更新记录'.repeat(3) : '记录' },
      { value: 'c', label: '配置' },
    ]);
    const app = createApp({ render: () => h(Tabs, {
      id: 'tabs', modelValue: selected.value, 'onUpdate:modelValue': value => { selected.value = value; },
      items: items.value, orientation,
    }, { panel: ({ index }) => h('div', { style: `height:${index === 0 ? 320 : 96}px` }, [
      h('p', index === 0 ? '详细内容与任务说明' : '短面板'),
      h('input', {
        'aria-label': `面板输入${index}`,
        value: drafts.value[index],
        onInput: event => { drafts.value[index] = event.target.value; },
        style: 'max-width:100%;box-sizing:border-box',
      }),
    ]) }) });
    app.mount(mount);
    window.tabsHarness = { selected, items, app };
    await nextTick();
  }, { width, dir, orientation, longLabels, theme });
}

async function freeze(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    for (const animation of document.getAnimations()) { animation.pause(); animation.currentTime = 0; }
  });
}
async function progress(page, fraction) {
  await page.evaluate(fraction => {
    for (const animation of document.getAnimations()) animation.currentTime = Number(animation.effect.getTiming().duration) * fraction;
  }, fraction);
}
async function panelsBox(page) {
  return page.locator('.kima-tabs__panels').evaluate(node => {
    const r = node.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
}

test('标签页回归：Vue 居中场地内占满宽度且长标签不撑出页面', async ({ page }) => {
  for (const orientation of ['horizontal', 'vertical']) {
    await mountTabs(page, { width: 280, longLabels: true, orientation });
    const geometry = await page.locator('#tabs').evaluate(node => ({
      root: node.getBoundingClientRect().width,
      parent: node.parentElement.getBoundingClientRect().width,
      page: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      list: node.querySelector('[role=tablist]').getBoundingClientRect().width,
      panel: node.querySelector('.kima-tabs__panels').getBoundingClientRect().width,
    }));
    expect(geometry.root).toBeCloseTo(geometry.parent, 0);
    expect(geometry.page).toBeLessThanOrEqual(geometry.viewport);
    expect(geometry.list).toBeLessThanOrEqual(280);
    expect(geometry.panel).toBeGreaterThanOrEqual(120);
  }
});

test('标签页回归：RTL 方向键按视觉移动并跳过禁用项', async ({ page }) => {
  await mountTabs(page, { dir: 'rtl' });
  const tabs = page.getByRole('tab');
  await tabs.nth(0).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(tabs.nth(2)).toBeFocused();
  await expect(tabs.nth(2)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(0)).toBeFocused();
  await page.keyboard.press('End');
  await expect(tabs.nth(3)).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tabs.nth(0)).toBeFocused();
});

for (const theme of ['dark', 'light']) {
  test(`标签页回归：${theme} 原位切换高度连续且面板状态保留`, async ({ page }) => {
    await mountTabs(page, { theme });
    await page.addStyleTag({ content: '#tabs{--kima-duration-medium:1000ms;--kima-duration-effects:1000ms;--kima-duration-slow:1000ms}' });
    await page.getByRole('textbox', { name: '面板输入0' }).fill('保留草稿');
    const before = await panelsBox(page);
    await page.getByRole('tab', { name: '记录', exact: true }).evaluate(node => node.click());
    await freeze(page);
    const start = await panelsBox(page);
    expect(Math.abs(start.height - before.height)).toBeLessThan(1);
    const leaving = page.locator('.kima-tabs__panel.kima-content-leave-active');
    await expect(leaving).toHaveAttribute('aria-hidden', 'true');
    expect(await leaving.evaluate(node => node.inert)).toBe(true);
    const leaveRect = await leaving.boundingBox();
    expect(Math.abs(leaveRect.width - before.width)).toBeLessThan(1);
    await progress(page, 0.5);
    const middle = await panelsBox(page);
    expect(middle.height).toBeLessThan(before.height);
    expect(middle.height).toBeGreaterThan(96);
    expect(middle.width).toBeCloseTo(before.width, 0);
    await page.screenshot({ path: `shots/tabs-motion/${theme}-middle.png`, scale: 'css' });
    await page.evaluate(() => { for (const animation of document.getAnimations()) animation.finish(); });
    await expect(page.getByRole('tabpanel')).toHaveCount(1);
    await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-hidden', 'false').catch(async () => {
      expect(await page.getByRole('tabpanel').evaluate(node => node.inert)).toBe(false);
    });
    await page.getByRole('tab', { name: '概览', exact: true }).evaluate(node => node.click());
    await page.evaluate(() => { for (const animation of document.getAnimations()) animation.finish(); });
    await expect(page.getByRole('textbox', { name: '面板输入0' })).toHaveValue('保留草稿');
    await page.screenshot({ path: `shots/tabs-motion/${theme}-after.png`, scale: 'css' });
  });
}

test('标签页回归：缩短途中反向从当前高度继续', async ({ page }) => {
  await mountTabs(page);
  await page.addStyleTag({ content: '#tabs{--kima-duration-medium:1000ms;--kima-duration-effects:1000ms}' });
  const initial = await panelsBox(page);
  await page.getByRole('tab', { name: '记录', exact: true }).evaluate(node => node.click());
  await freeze(page);
  await progress(page, 0.35);
  const beforeReverse = await panelsBox(page);
  await page.getByRole('tab', { name: '概览', exact: true }).evaluate(node => node.click());
  await freeze(page);
  const afterReverse = await panelsBox(page);
  expect(Math.abs(afterReverse.height - beforeReverse.height)).toBeLessThan(1);
  await progress(page, 0.95);
  expect((await panelsBox(page)).height).toBeGreaterThan(beforeReverse.height);
  await page.evaluate(() => { for (const animation of document.getAnimations()) animation.finish(); });
  await expect.poll(async () => (await panelsBox(page)).height).toBeCloseTo(initial.height, 0);
});
