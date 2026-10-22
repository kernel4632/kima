import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const names = ['grid', 'flex', 'stack', 'field-group', 'input-group', 'page-header', 'banner', 'error-state', 'typography', 'mark', 'time-display'];

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/foundation-fixture.html');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
});
const mount = (page, html, properties = {}) => page.evaluate(({ html, properties }) => window.foundation.mount(html, properties), { html, properties });
const events = (page) => page.evaluate(() => window.foundation.events);

test('field group links one hint to every real control and aggregates required validity', async ({ page }) => {
  await mount(page, '<form><kima-field-group id="group" legend="通知方式" hint="至少填写一种联系方式" required><kima-text-field label="邮箱" name="mail"></kima-text-field><kima-text-field label="电话" name="phone"></kima-text-field></kima-field-group></form>');
  const group = page.locator('#group .kima-field-group');
  const inputs = page.locator('#group input');
  await expect(page.locator('#group legend')).toContainText('通知方式');
  await expect(page.locator('#group .kima-field-group__required')).toHaveText('必填');
  await expect(inputs).toHaveCount(2);
  const described = await inputs.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-describedby')));
  expect(described[0]).toBeTruthy();
  expect(described[1]).toBe(described[0]);
  await expect(group).toHaveAttribute('data-valid', 'false');
  await inputs.nth(0).fill('member@example.com');
  await expect(group).toHaveAttribute('data-valid', 'true');
  await inputs.nth(0).fill('');
  await expect(group).toHaveAttribute('data-valid', 'false');
  await page.evaluate(() => { document.getElementById('group').error = '请修正联系方式'; });
  await expect(inputs.nth(0)).toHaveAttribute('aria-invalid', 'true');
  const withError = await inputs.nth(0).getAttribute('aria-describedby');
  expect(withError).not.toBe(described[0]);
  await page.evaluate(() => { document.getElementById('group').error = ''; });
  await expect(inputs.nth(0)).not.toHaveAttribute('aria-invalid');
  const aggregated = await page.evaluate(() => document.getElementById('group').validate());
  expect(aggregated.valid).toBe(false);
  expect(await page.evaluate(() => window.foundation.events.some((event) => event.id === 'group' && event.type === 'validity-change'))).toBe(true);
});

test('input group decorates a real control without a second surface or visible label', async ({ page }) => {
  await mount(page, '<label>预算<kima-input-group id="ig" label="预算金额"><span slot="prefix">¥</span><kima-text-field label="预算金额" name="budget" placeholder="0.00"></kima-text-field><span slot="suffix">元</span></kima-input-group></label>');
  await expect(page.getByRole('group', { name: '预算金额' })).toBeVisible();
  await expect(page.locator('#ig .kima-input-group__decoration--prefix')).toHaveText('¥');
  await expect(page.locator('#ig .kima-input-group__decoration--suffix')).toHaveText('元');
  await expect(page.getByRole('textbox', { name: '预算金额' })).toHaveCount(1);
  await expect(page.locator('#ig .kima-input-group')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  expect(await page.locator('#ig label').count()).toBe(0);
});

test('grid responds to column and gap tokens and projects named areas in visual/focus order', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 900 });
  await mount(page, '<kima-grid id="grid"><div>1</div><div>2</div><div>3</div></kima-grid>', { grid: { columns: { base: 1, sm: 2, md: 3 }, gap: { base: 2, md: 6 } } });
  const grid = page.locator('#grid .kima-grid');
  const count = () => grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length);
  await expect.poll(count).toBe(1);
  await expect(grid).toHaveCSS('gap', '8px');
  await page.setViewportSize({ width: 720, height: 900 });
  await expect.poll(count).toBe(2);
  await expect(grid).toHaveCSS('gap', '8px');
  await page.setViewportSize({ width: 1100, height: 900 });
  await expect.poll(count).toBe(3);
  await expect(grid).toHaveCSS('gap', '24px');
  await page.evaluate(() => { document.getElementById('grid').columns = 'invalid'; document.getElementById('grid').gap = 'invalid'; });
  await expect.poll(count).toBe(1);
  await expect(grid).toHaveCSS('gap', '16px');

  await mount(page, '<kima-grid id="areas" gap="2"><button slot="main" id="main">Main</button><button slot="side" id="side">Side</button><button slot="head" id="head">Head</button></kima-grid>', { areas: { areas: ['head head', 'side main'] } });
  await expect(page.locator('#areas .kima-grid__cell')).toHaveCount(3);
  const areaGrid = page.locator('#areas .kima-grid');
  const template = await areaGrid.evaluate((element) => getComputedStyle(element).gridTemplateAreas);
  expect(template).toContain('head head');
  expect(template).toContain('side main');
  expect(await areaGrid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean).length)).toBe(2);
  await page.locator('#head').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#side')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#main')).toBeFocused();
  await expect(page.locator('#areas .kima-grid')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
});

test('flex and stack clamp enumerations and map alignment plus responsive gaps', async ({ page }) => {
  await mount(page, '<kima-flex id="flex" direction="column" wrap="nowrap" gap="3" align="center" justify="space-between"><span>A</span><span>B</span></kima-flex><kima-stack id="stack" gap="2" align="end"><span>A</span><span>B</span></kima-stack>');
  const flex = page.locator('#flex .kima-flex');
  const stack = page.locator('#stack .kima-stack');
  await expect(flex).toHaveCSS('flex-direction', 'column');
  await expect(flex).toHaveCSS('flex-wrap', 'nowrap');
  await expect(flex).toHaveCSS('gap', '12px');
  await expect(flex).toHaveCSS('align-items', 'center');
  await expect(flex).toHaveCSS('justify-content', 'space-between');
  await expect(stack).toHaveCSS('flex-direction', 'column');
  await expect(stack).toHaveCSS('align-items', 'flex-end');
  await expect(stack).toHaveCSS('gap', '8px');
  await expect(flex).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(stack).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await page.evaluate(() => { document.getElementById('flex').direction = 'diagonal'; document.getElementById('flex').justify = 'bogus'; document.getElementById('stack').direction = 'horizontal'; });
  await expect(flex).toHaveCSS('flex-direction', 'row');
  await expect(flex).toHaveCSS('justify-content', 'flex-start');
  await expect(stack).toHaveCSS('flex-direction', 'row');
});

test('page header exposes semantic heading, breadcrumb and keyboard-reachable actions', async ({ page }) => {
  await mount(page, '<kima-page-header id="header" heading="成员" description="管理成员与邀请" level="2"><a slot="breadcrumbs" href="#workspace">工作区</a><kima-button slot="actions" id="invite">邀请成员</kima-button><p>补充说明</p></kima-page-header>');
  await expect(page.getByRole('heading', { level: 2, name: '成员' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: '面包屑' })).toContainText('工作区');
  await expect(page.getByRole('button', { name: '邀请成员' })).toBeVisible();
  await expect(page.getByText('补充说明')).toBeVisible();
  expect(await page.locator('#header label').count()).toBe(0);
  await page.getByRole('link', { name: '工作区' }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '邀请成员' })).toBeFocused();
  await page.evaluate(() => { document.getElementById('header').level = 9; });
  await expect(page.locator('#header h6')).toHaveText('成员');
});

test('banner dismisses by keyboard, restores explicitly and respects reduced motion', async ({ page }) => {
  await mount(page, '<kima-banner id="banner" heading="计划维护" variant="warning" closable>今晚 22:00 恢复写入。</kima-banner>');
  const clip = page.locator('#banner .kima-banner__clip');
  await expect(page.getByRole('alert')).toContainText('计划维护');
  await expect(page.getByText('今晚 22:00 恢复写入。')).toBeVisible();
  const close = page.getByRole('button', { name: '关闭横幅' });
  await close.focus();
  await page.keyboard.press('Enter');
  await expect(clip).toHaveAttribute('aria-hidden', 'true');
  expect((await events(page)).some((event) => event.id === 'banner' && event.type === 'dismiss')).toBe(true);
  await page.evaluate(() => document.getElementById('banner').restore());
  await expect(clip).not.toHaveAttribute('aria-hidden', 'true');
  await expect(page.getByRole('alert')).toContainText('计划维护');
  expect((await events(page)).some((event) => event.id === 'banner' && event.type === 'restore')).toBe(true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: '关闭横幅' }).click();
  await expect(clip).toBeHidden();
});

test('error state keeps async failure visible, resets on route key and reports recovery', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.evaluate(async () => {
    await window.foundation.mount('<kima-error-state id="recovery" heading="成员列表加载失败"><span slot="fallback">路由恢复说明</span></kima-error-state>');
    const element = document.getElementById('recovery');
    element.retryHandler = () => {
      window.retryCalls = (window.retryCalls || 0) + 1;
      return new Promise((resolve, reject) => { window.resolveRetry = resolve; window.rejectRetry = reject; });
    };
  });
  await expect(page.getByRole('alert')).toContainText('成员列表加载失败');
  await expect(page.getByText('路由恢复说明')).toBeVisible();
  const retry = page.locator('#recovery .kima-error-state__actions button');
  await retry.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.retryCalls)).toBe(1);
  await page.evaluate(() => window.rejectRetry(new Error('服务器不可用')));
  await expect(page.getByText('重试失败：服务器不可用')).toBeVisible();
  await page.evaluate(() => { document.getElementById('recovery').resetKey = 'route-second'; });
  await expect(page.getByText('重试失败：服务器不可用')).toHaveCount(0);
  await retry.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.retryCalls)).toBe(2);
  await page.evaluate(() => window.resolveRetry());
  await expect(page.getByText('已尝试 1 次')).toBeVisible();
  const recorded = await events(page);
  expect(recorded.some((event) => event.id === 'recovery' && event.type === 'recovered')).toBe(true);
  await page.evaluate(() => document.getElementById('recovery').reset());
  await expect(page.getByText('已尝试 1 次')).toHaveCount(0);
  expect((await events(page)).some((event) => event.id === 'recovery' && event.type === 'reset')).toBe(true);
  expect(errors).toEqual([]);
});

test('error state ignores an older retry that resolves after the route key resets', async ({ page }) => {
  await page.evaluate(async () => {
    await window.foundation.mount('<kima-error-state id="stale" heading="成员列表加载失败"></kima-error-state>');
    const element = document.getElementById('stale');
    element.retryHandler = () => new Promise((resolve) => { window.retryResolvers.push(resolve); });
    window.retryResolvers = [];
  });
  const retry = page.locator('#stale .kima-error-state__actions button');
  await retry.click();
  await expect.poll(() => page.evaluate(() => window.retryResolvers.length)).toBe(1);
  await page.evaluate(() => { document.getElementById('stale').resetKey = 'route-next'; });
  await page.evaluate(() => window.retryResolvers[0]());
  await expect(page.getByText('已尝试 1 次')).toHaveCount(0);
  expect((await events(page)).some((event) => event.id === 'stale' && event.type === 'recovered')).toBe(false);
  await retry.click();
  await expect.poll(() => page.evaluate(() => window.retryResolvers.length)).toBe(2);
  await page.evaluate(() => window.retryResolvers[1]());
  await expect(page.getByText('已尝试 1 次')).toBeVisible();
  expect((await events(page)).filter((event) => event.id === 'stale' && event.type === 'recovered')).toHaveLength(1);
});

test('typography emits native semantics with token-limited size and color', async ({ page }) => {
  await mount(page, '<kima-typography id="heading" type="heading" level="3">标题</kima-typography><kima-typography id="body" type="body" size="bogus" color="danger">正文</kima-typography><kima-typography id="caption" type="caption">说明</kima-typography>');
  const heading = page.locator('#heading .kima-typography');
  const body = page.locator('#body .kima-typography');
  const caption = page.locator('#caption .kima-typography');
  await expect(heading).toHaveJSProperty('tagName', 'H3');
  await expect(heading).toHaveCSS('font-size', '28px');
  await expect(body).toHaveJSProperty('tagName', 'P');
  await expect(body).toHaveCSS('font-size', '16px');
  await expect(caption).toHaveJSProperty('tagName', 'SMALL');
  await expect(caption).toHaveCSS('font-size', '14px');
  const colors = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--kima-color-error)';
    document.body.append(probe);
    const token = getComputedStyle(probe).color;
    probe.remove();
    return { actual: getComputedStyle(document.querySelector('#body .kima-typography')).color, token };
  });
  expect(colors.actual).toBe(colors.token);
  expect(await page.locator('.kima-typography label').count()).toBe(0);
});

test('mark stays a native literal wrapper, never parses HTML and keeps slot structure', async ({ page }) => {
  await mount(page, '<kima-mark id="literal"></kima-mark><kima-mark id="slotted" tone="error">行内 <em>强调</em></kima-mark>');
  const literal = page.locator('#literal mark');
  await page.evaluate(() => { document.getElementById('literal').text = '<img src=x onerror="window.xss=1">'; });
  await expect(literal).toHaveJSProperty('tagName', 'MARK');
  await expect(literal).toHaveText('<img src=x onerror="window.xss=1">');
  expect(await page.locator('#literal img').count()).toBe(0);
  expect(await page.evaluate(() => window.xss)).toBeUndefined();
  await expect(page.locator('#slotted mark')).toHaveCount(1);
  await expect(page.locator('#slotted em')).toHaveText('强调');
  await expect(page.locator('#slotted mark')).toHaveClass(/kima-mark--error/);
  const background = await page.locator('#slotted mark').evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(background).not.toBe('rgba(0, 0, 0, 0)');
});

test('time display localizes with explicit locale and time zone and falls back safely', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mount(page, '<kima-time-display id="datetime" value="2026-06-01T01:30:00Z" mode="datetime" locale="en-GB" time-zone="UTC" date-style="full" time-style="short"></kima-time-display><kima-time-display id="date" value="2026-06-01" mode="date" locale="en-GB" time-zone="Pacific/Kiritimati" date-style="full"></kima-time-display><kima-time-display id="time" value="09:30" mode="time" locale="en-GB" time-zone="UTC" time-style="short"></kima-time-display>');
  const expected = await page.evaluate(() => ({
    datetime: new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'short', timeZone: 'UTC' }).format(new Date('2026-06-01T01:30:00Z')),
    date: new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 5, 1))),
    time: new Intl.DateTimeFormat('en-GB', { timeStyle: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2000, 0, 1, 9, 30))),
  }));
  const datetime = page.locator('#datetime .kima-time-display');
  await expect(datetime).toHaveText(expected.datetime);
  await expect(datetime).toHaveAttribute('datetime', '2026-06-01T01:30:00.000Z');
  await expect(page.locator('#date .kima-time-display')).toHaveText(expected.date);
  await expect(page.locator('#time .kima-time-display')).toHaveText(expected.time);
  await page.evaluate(() => { document.getElementById('datetime').value = 'not-a-date'; });
  await expect(datetime).toHaveText('时间不可用');
  await expect(datetime).not.toHaveAttribute('datetime');
  await page.evaluate(() => { const element = document.getElementById('datetime'); element.value = '2026-06-01T01:30:00Z'; element.timeZone = 'Mars/Olympus'; });
  await expect(datetime).not.toHaveText('时间不可用');
  await page.evaluate(() => { document.getElementById('datetime').locale = 'en_US_INVALID'; });
  await expect(datetime).not.toHaveText('时间不可用');
  expect(errors).toEqual([]);
});

test('metadata exposes every new component props and declared events', async ({ page }) => {
  const entries = await page.evaluate(async () => (await import('/@id/__x00__kima-docs')).default);
  for (const slug of names) {
    const entry = entries.find((item) => item.slug === slug);
    expect(entry, slug).toBeTruthy();
    expect(entry.attributes.length, slug).toBeGreaterThan(0);
  }
  const propsOf = (slug) => entries.find((item) => item.slug === slug).attributes.map((attribute) => attribute.name);
  expect(propsOf('grid')).toEqual(expect.arrayContaining(['columns', 'gap', 'areas', 'align']));
  expect(propsOf('page-header')).toEqual(expect.arrayContaining(['heading', 'description', 'level']));
  expect(propsOf('field-group')).toEqual(expect.arrayContaining(['legend', 'hint', 'error', 'required']));
  expect(propsOf('banner')).toEqual(expect.arrayContaining(['open', 'variant', 'closable', 'dismissLabel']));
  expect(propsOf('error-state')).toEqual(expect.arrayContaining(['retryHandler', 'resetKey', 'retryLabel']));
  expect(propsOf('time-display')).toEqual(expect.arrayContaining(['timeZone', 'dateStyle', 'timeStyle']));
  for (const slug of ['field-group', 'banner', 'error-state']) {
    const entry = entries.find((item) => item.slug === slug);
    expect(entry.events.length, slug).toBeGreaterThan(0);
  }
});

test('isolated examples mount one article, both themes stay error-free and capture screenshots', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await mkdir('shots/foundation-expansion', { recursive: true });
  for (const slug of names) {
    await page.evaluate((name) => window.foundation.examples(name), slug);
    await expect(page.locator('article.kima-gallery__demo')).toHaveCount(1);
    await expect(page.locator('article')).toHaveAttribute('data-foundation', slug);
  }
  for (const mode of ['light', 'dark']) {
    await page.evaluate((value) => window.foundation.theme(value), mode);
    for (const slug of names) {
      await page.evaluate((name) => window.foundation.examples(name), slug);
      await page.screenshot({ path: `shots/foundation-expansion/${info.project.name}-${mode}-${slug}.png`, fullPage: true, animations: 'disabled' });
    }
  }
  expect(errors).toEqual([]);
});
