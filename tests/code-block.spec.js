/* 代码块的原生入口、安全展示、复制与窄屏阅读行为。 */
import { expect, test } from '@playwright/test';

async function mount(page, code, properties = {}) {
  await page.goto('/tests/fixture.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  await page.evaluate(({ code, properties }) => window.fixture.mount('<kima-code-block id="code"></kima-code-block>', { code: { code, ...properties } }), { code, properties });
}

function displayedCode(page) {
  return page.locator('#code .kima-code-block__text').evaluateAll((nodes) => nodes.map((node) => node.textContent.replace(/\u200b/g, '')).join('\n'));
}

test('代码按原文安全展示，行号不进入代码且原生属性可更新', async ({ page }) => {
  const code = '<img src=x onerror="window.injected=true">\n<script>window.injected=true</script>\n\nconst text = "<hello>&";';
  await mount(page, code, { language: 'html', filename: 'demo.html', lineNumbers: true });
  expect(await displayedCode(page)).toBe(code);
  await expect(page.locator('#code img, #code script')).toHaveCount(0);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
  await expect(page.locator('#code .kima-code-block__number')).toHaveCount(4);
  await expect(page.locator('#code .hljs-tag').first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'demo.html' })).toBeVisible();
  await expect(page.locator('[id="code"]')).toHaveCount(1);
  await page.evaluate(() => Object.assign(document.getElementById('code'), { language: 'unknown', code: '<b>plain & safe</b>\n' }));
  await expect(page.locator('#code .hljs-tag')).toHaveCount(0);
  expect(await displayedCode(page)).toBe('<b>plain & safe</b>\n');
  await expect(page.locator('#code b')).toHaveCount(0);
});

test('多行注释保留跨行着色，换行按钮和键盘滚动区域可用', async ({ page }) => {
  await mount(page, '/* first\n   second */\nconst long = "' + '长代码'.repeat(100) + '";', { language: 'js', lineNumbers: true });
  await expect(page.locator('#code .kima-code-block__line').nth(0).locator('.hljs-comment')).toHaveText('/* first');
  await expect(page.locator('#code .kima-code-block__line').nth(1).locator('.hljs-comment')).toHaveText('   second */');
  const viewport = page.locator('#code pre');
  expect(await viewport.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await viewport.focus();
  await expect(viewport).toBeFocused();
  await expect(viewport).toHaveCSS('outline-style', 'solid');
  const wrap = page.getByRole('button', { name: '换行', exact: true });
  await wrap.click();
  await expect(wrap).toHaveAttribute('aria-pressed', 'true');
  expect(await viewport.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  await page.evaluate(() => { document.getElementById('code').wrap = true; });
  await page.evaluate(() => { document.getElementById('code').wrap = false; });
  await expect(wrap).toHaveAttribute('aria-pressed', 'false');
});

test('复制原始代码一次并反馈成功，复制被拒绝时提供手动操作说明', async ({ page }) => {
  await page.addInitScript(() => {
    window.copied = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => {
      if (window.rejectCopy) throw new Error('Not allowed');
      window.copied.push(text);
    } } });
  });
  const code = 'const name = "KIMA";\n\n// 原始换行\n';
  await mount(page, code, { language: 'javascript', lineNumbers: true });
  await page.evaluate(() => {
    window.copyEvents = [];
    const host = document.getElementById('code');
    host.addEventListener('copy', (event) => window.copyEvents.push(event.detail));
    host.addEventListener('copy-error', () => { window.copyErrors = (window.copyErrors || 0) + 1; });
  });
  const button = page.getByRole('button', { name: '复制代码', exact: true });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveText('已复制');
  expect(await page.evaluate(() => window.copied)).toEqual([code]);
  expect(await page.evaluate(() => window.copyEvents)).toEqual([[code]]);
  await page.evaluate(() => { window.rejectCopy = true; });
  await button.click();
  await expect(page.getByRole('status')).toHaveText('复制失败，请选择代码手动复制');
  expect(await page.evaluate(() => window.copyErrors)).toBe(1);
  await page.evaluate(() => { document.getElementById('code').copyable = false; });
  await expect(button).toHaveCount(0);
});

test('文档站复用代码块，Vue 示例着色可见且页面无横向溢出', async ({ page }) => {
  await page.goto('/#/installation');
  await expect(page.locator('.kima-docs__section .kima-code-block')).toHaveCount(3);
  await expect(page.locator('.kima-code-block__filename')).toHaveText('App.vue');
  await expect(page.locator('.kima-code-block .hljs-keyword').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
