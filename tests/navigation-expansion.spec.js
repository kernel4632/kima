import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const slugs = ["accordion", "collapsible", "breadcrumb", "link", "stepper", "navigation-menu", "anchor", "back-top", "splitter", "scroll-area", "toolbar", "visually-hidden", "overflow-list", "carousel"];
const mount = (page, html, properties = {}) => page.evaluate(([html, properties]) => window.navigationFixture.mount(html, properties), [html, properties]);
test.beforeEach(async ({ page }) => { await page.goto('/tests/navigation-fixture.html'); await expect(page.locator('html')).toHaveAttribute('data-ready', 'true'); });

test('fourteen registrations and extractable API metadata', async ({ page }) => {
  expect(await page.evaluate((slugs) => slugs.every((s) => customElements.get(`kima-${s}`)), slugs)).toBe(true);
  const catalog = await page.evaluate(async () => (await import('/src/site/navigation-catalog.js')).navigationCatalog);
  expect(Object.keys(catalog)).toEqual(slugs);
  const docs = await page.evaluate(async () => (await import('/@id/virtual:kima-docs')).default);
  for (const slug of slugs) { const doc = docs.find((entry) => entry.slug === slug); expect(doc.attributes.length).toBeGreaterThan(0); expect(doc.examples).toContain(`<kima-${slug}`); }
  for (const slug of ['accordion', 'stepper', 'navigation-menu', 'anchor', 'splitter', 'carousel']) expect(docs.find((d) => d.slug === slug).events).toContain('update:modelValue');
});

test('all components avoid duplicate host ids', async ({ page }) => {
  await mount(page, slugs.map((slug, i) => `<kima-${slug} id="probe-${i}"></kima-${slug}>`).join(''));
  for (let i = 0; i < slugs.length; i++) expect(await page.locator(`[id="probe-${i}"]`).count()).toBe(1);
});

test('collapsible native content controlled resync disabled keyboard and controls id', async ({ page }) => {
  await mount(page, '<kima-collapsible id="c" label="高级设置"><p>原生内容</p><span slot="trigger">展开偏好</span></kima-collapsible>');
  const button = page.getByRole('button', { name: '展开偏好' });
  await expect(page.getByText('原生内容')).toBeHidden();
  await button.focus(); await button.press('Enter');
  await expect(button).toHaveAttribute('aria-expanded', 'true'); await expect(page.getByText('原生内容')).toBeVisible();
  const controls = await button.getAttribute('aria-controls'); expect(controls).toBeTruthy(); await expect(page.locator(`[id="${controls}"]`)).toHaveCount(1);
  await page.evaluate(() => { document.getElementById('c').open = true; });
  await page.evaluate(() => { document.getElementById('c').open = false; });
  await expect(page.getByText('原生内容')).toBeHidden();
  await page.evaluate(() => { document.getElementById('c').disabled = true; }); await expect(button).toBeDisabled();
});

const accordionItems = [{ value: 'a', label: '第一项', content: '第一正文' }, { value: 'b', label: '已禁用', disabled: true }, { value: 'c', label: '第三项', content: '第三正文' }];
test('accordion single multiple native panel slots roving keyboard and external updates', async ({ page }) => {
  await mount(page, '<kima-accordion id="a"><p slot="panel-a">自定义第一正文</p></kima-accordion>', { a: { items: accordionItems } });
  const first = page.getByRole('button', { name: /第一项/ }); const last = page.getByRole('button', { name: /第三项/ });
  await first.focus(); await first.press('Enter'); await expect(page.getByText('自定义第一正文')).toBeVisible();
  await first.press('ArrowDown'); await expect(last).toBeFocused(); await last.press('Enter');
  await expect(first).toHaveAttribute('aria-expanded', 'false'); await expect(last).toHaveAttribute('aria-expanded', 'true');
  for (const button of [first, last]) {
    const controls = await button.getAttribute('aria-controls'); const panel = page.locator(`[id="${controls}"]`);
    await expect(panel).toHaveCount(1);
    expect(await button.getAttribute('id')).toBe(await panel.getAttribute('aria-labelledby'));
  }
  await page.evaluate(() => { const host = document.getElementById('a'); host.multiple = true; host.modelValue = ['a', 'c']; });
  await expect(first).toHaveAttribute('aria-expanded', 'true'); await expect(last).toHaveAttribute('aria-expanded', 'true');
  await page.evaluate(() => { document.getElementById('a').modelValue = []; }); await expect(first).toHaveAttribute('aria-expanded', 'false');
});

test('breadcrumb ordered current path and real links', async ({ page }) => {
  await mount(page, '<kima-breadcrumb id="b"></kima-breadcrumb>', { b: { items: [{ label: '首页', href: '#home' }, { label: '项目', href: '#project' }] } });
  await expect(page.getByRole('navigation', { name: '面包屑导航' })).toBeVisible(); await expect(page.locator('#b ol > li')).toHaveCount(2);
  await page.getByRole('link', { name: '首页' }).click(); await expect(page).toHaveURL(/#home$/); await expect(page.locator('#b [aria-current=page]')).toHaveText('项目');
});

test('link real navigation blank safety disabled no activation and ripple', async ({ page }) => {
  await mount(page, '<kima-link id="l" href="#destination">查看详情</kima-link><kima-link id="d" href="#bad" disabled>禁用链接</kima-link><kima-link id="blank" href="https://reka-ui.com" target="_blank">文档</kima-link>');
  await expect(page.locator('#blank a')).toHaveAttribute('rel', /noopener/); await expect(page.locator('#d a')).not.toHaveAttribute('href');
  await page.locator('#d a').dispatchEvent('click'); expect(page.url()).not.toContain('#bad');
  const link = page.getByRole('link', { name: '查看详情' }); await link.focus(); await link.press('Enter'); await expect(page).toHaveURL(/#destination$/);
  await link.dispatchEvent('pointerdown', { button: 0 }); await expect(page.locator('#l .kima-ripple')).toHaveCount(1);
});

test('stepper linear constraints current state and external sync', async ({ page }) => {
  await mount(page, '<kima-stepper id="s" linear></kima-stepper>', { s: { items: [{ label: '信息' }, { label: '配置' }, { label: '发布' }] } });
  await expect(page.getByRole('button', { name: /发布/ })).toBeDisabled(); await page.getByRole('button', { name: /配置/ }).click();
  await expect(page.locator('#s [aria-current=step]')).toContainText('配置'); await expect(page.locator('#s li').first()).toHaveAttribute('data-state', 'complete');
  await page.evaluate(() => { document.getElementById('s').modelValue = 2; }); await expect(page.locator('#s [aria-current=step]')).toContainText('发布');
});

test('navigation menu real href current item disabled and responsive layout', async ({ page }) => {
  await mount(page, '<kima-navigation-menu id="n"></kima-navigation-menu>', { n: { items: [{ value: 'one', label: '概览', href: '#one' }, { value: 'two', label: '设计', href: '#two' }, { label: '禁用', href: '#no', disabled: true }], modelValue: 'one' } });
  await page.getByRole('link', { name: '设计' }).click(); await expect(page).toHaveURL(/#two$/); await expect(page.locator('#n [aria-current]')).toHaveText('设计');
  await page.evaluate(() => { document.getElementById('n').modelValue = 'one'; }); await expect(page.locator('#n [aria-current]')).toHaveText('概览');
  await page.setViewportSize({ width: 390, height: 850 }); expect(await page.locator('#n ul').evaluate((el) => getComputedStyle(el).flexDirection)).toBe('column');
});

test('anchor tracks user scrolling and keyboard navigation with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(page, '<kima-anchor id="a" target="#reader" offset="0"></kima-anchor><div id="reader" style="height:220px;overflow:auto"><section id="s1" style="height:300px">第一章正文</section><section id="s2" style="height:300px">第二章正文</section><section id="s3" style="height:300px">第三章正文</section></div>', { a: { items: [{ label: '第一章', href: '#s1' }, { label: '第二章', href: '#s2' }, { label: '第三章', href: '#s3' }] } });
  await expect(page.locator('#a [aria-current=location]')).toHaveText('第一章');
  await page.locator('#reader').evaluate((el) => { el.scrollTop = 310; }); await expect(page.locator('#a [aria-current=location]')).toHaveText('第二章');
  const third = page.getByRole('link', { name: '第三章' }); await third.focus(); await third.press('Enter'); await expect(page.locator('#a [aria-current=location]')).toHaveText('第三章');
  expect(await page.locator('#reader').evaluate((el) => el.scrollTop)).toBeGreaterThanOrEqual(590);
});

test('back top threshold keyboard reduced motion and target changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(page, '<div id="reader" style="height:180px;overflow:auto"><div style="height:1200px">长内容</div></div><kima-back-top id="top" target="#reader" threshold="100"></kima-back-top>');
  const button = page.getByRole('button', { name: '返回顶部' }); await expect(button).toBeHidden();
  await page.locator('#reader').evaluate((el) => { el.scrollTop = 300; }); await expect(button).toBeVisible(); await button.focus(); await button.press('Enter');
  await expect.poll(() => page.locator('#reader').evaluate((el) => el.scrollTop)).toBe(0); await expect(button).toBeHidden();
  await page.evaluate(() => { document.getElementById('top').target = '#missing'; }); await expect(button).toBeHidden();
});

test('splitter keyboard clamps min max and resynchronizes externally', async ({ page }) => {
  await mount(page, '<kima-splitter id="s" min="20" max="70"><span slot="first">左侧</span><span slot="second">右侧</span></kima-splitter>');
  const handle = page.getByRole('separator'); await expect(page.getByText('左侧')).toBeVisible(); await handle.focus(); await handle.press('End'); await expect(handle).toHaveAttribute('aria-valuenow', '70');
  await handle.press('ArrowRight'); await expect(handle).toHaveAttribute('aria-valuenow', '70'); await handle.press('Home'); await expect(handle).toHaveAttribute('aria-valuenow', '20');
  await page.evaluate(() => { document.getElementById('s').modelValue = 55; }); await expect(handle).toHaveAttribute('aria-valuenow', '55');
  await page.evaluate(() => { document.getElementById('s').disabled = true; }); await handle.dispatchEvent('keydown', { key: 'End' }); await expect(handle).toHaveAttribute('aria-valuenow', '55');
});

test('splitter pointer capture drag outside handle and vertical keyboard', async ({ page, isMobile }) => {
  await mount(page, '<kima-splitter id="s"><div slot="first">左侧</div><div slot="second">右侧</div></kima-splitter>');
  const handle = page.getByRole('separator'); const box = await handle.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + 150, box.y + 60); await page.mouse.up();
  expect(Number(await handle.getAttribute('aria-valuenow'))).toBeGreaterThan(40);
  await page.evaluate(() => { document.getElementById('s').orientation = 'vertical'; }); await expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
  await handle.focus(); await handle.press('Home'); await handle.press('ArrowDown'); await expect(handle).toHaveAttribute('aria-valuenow', '20');
});

test('scroll area has accessible region max dimensions and keyboard scrolling', async ({ page }) => {
  await mount(page, '<kima-scroll-area id="s" label="更新日志" max-height="180"><div style="height:1400px">完整日志</div></kima-scroll-area>');
  const area = page.getByRole('region', { name: '更新日志' }); await expect(area).toHaveAttribute('tabindex', '0');
  expect((await area.boundingBox()).height).toBeLessThanOrEqual(180); await area.focus(); await area.press('PageDown'); await expect.poll(() => area.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.evaluate(() => { document.getElementById('s').maxHeight = 240; }); expect((await area.boundingBox()).height).toBe(240);
});

test('toolbar roving focus skips disabled native and nested CE controls and updates dynamically', async ({ page }) => {
  await mount(page, '<kima-toolbar id="t" label="编辑"><kima-button>保存</kima-button><button disabled>禁用</button><button id="preview">预览</button><a href="#publish">发布</a></kima-toolbar>');
  const first = page.getByRole('button', { name: '保存' }); const preview = page.getByRole('button', { name: '预览' });
  await expect(first).toHaveAttribute('tabindex', '0'); await expect(preview).toHaveAttribute('tabindex', '-1'); await first.focus(); await first.press('ArrowRight'); await expect(preview).toBeFocused(); await preview.press('End'); await expect(page.getByRole('link', { name: '发布' })).toBeFocused();
  await page.getByRole('link').press('Home'); await expect(first).toBeFocused();
  await page.evaluate(() => { document.getElementById('preview').disabled = true; }); await first.press('ArrowRight'); await expect(page.getByRole('link')).toBeFocused();
});

test('visually hidden provides accessible description and focusable skip content', async ({ page }) => {
  await mount(page, '<button aria-describedby="help">分享</button><kima-visually-hidden id="help">只读访问权限</kima-visually-hidden><kima-visually-hidden id="skip" focusable><a href="#main">跳到正文</a></kima-visually-hidden>');
  await expect(page.getByRole('button')).toHaveAccessibleDescription('只读访问权限'); expect((await page.locator('#help span').boundingBox()).width).toBe(1);
  const skip = page.getByRole('link', { name: '跳到正文' }); await skip.focus(); expect((await page.locator('#skip span').boundingBox()).width).toBeGreaterThan(1);
});

test('overflow list keyboard expansion native item slot and external state', async ({ page }) => {
  await mount(page, '<kima-overflow-list id="o" max="2"><a slot="item-2" href="#three">原生第三项</a></kima-overflow-list>', { o: { items: ['第一', '第二', '第三', '第四'] } });
  await expect(page.getByText('原生第三项')).toBeHidden(); const expand = page.getByRole('button', { name: '展开其余 2 项' }); await expand.focus(); await expand.press('Enter');
  await expect(page.getByText('原生第三项')).toBeVisible(); await expect(page.getByRole('button', { name: '收起列表' })).toHaveAttribute('aria-expanded', 'true');
  await page.evaluate(() => { document.getElementById('o').expanded = true; }); await page.evaluate(() => { document.getElementById('o').expanded = false; }); await expect(page.getByText('原生第三项')).toBeHidden();
});

test('carousel keyboard buttons count native slide slot no autoplay and disabled', async ({ page }) => {
  await mount(page, '<kima-carousel id="c"><p slot="slide-1">原生第二张</p></kima-carousel>', { c: { items: [{ title: '第一张' }, { title: '第二张' }, { title: '第三张' }] } });
  const region = page.getByRole('region', { name: '内容轮播' }); await expect(page.locator('#c output')).toHaveText('1 / 3'); await expect(page.getByRole('button', { name: '上一张' })).toBeDisabled();
  await region.focus(); await region.press('ArrowRight'); await expect(page.getByText('原生第二张')).toBeVisible(); await expect(page.locator('#c output')).toHaveText('2 / 3');
  await page.getByRole('button', { name: '下一张' }).click(); await expect(page.locator('#c output')).toHaveText('3 / 3'); await expect(page.getByRole('button', { name: '下一张' })).toBeDisabled();
  await page.waitForTimeout(1200); await expect(page.locator('#c output')).toHaveText('3 / 3');
  await page.evaluate(() => { document.getElementById('c').modelValue = 0; }); await expect(page.locator('#c output')).toHaveText('1 / 3');
  await page.evaluate(() => { document.getElementById('c').disabled = true; }); await region.press('End'); await expect(page.locator('#c output')).toHaveText('1 / 3');
});

test('native model events synchronize properties without echo loops', async ({ page }) => {
  await mount(page, '<kima-overflow-list id="o" max="1"></kima-overflow-list>', { o: { items: ['一', '二'] } });
  await page.evaluate(() => { window.navigationEvents = []; document.getElementById('o').addEventListener('update:expanded', (event) => window.navigationEvents.push(event.detail)); });
  await page.getByRole('button', { name: '展开其余 1 项' }).click();
  expect(await page.evaluate(() => document.getElementById('o').expanded)).toBe(true);
  expect(await page.evaluate(() => window.navigationEvents)).toEqual([[true]]);
  await page.evaluate(() => { document.getElementById('o').expanded = false; });
  await expect(page.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  expect(await page.evaluate(() => window.navigationEvents)).toEqual([[true]]);
});

test('native scroll-area host works as back-top target', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await mount(page, '<kima-scroll-area id="r" max-height="180"><div style="height:900px">长文</div></kima-scroll-area><kima-back-top id="b" target="#r" threshold="50"></kima-back-top>');
  await page.locator('#r .kima-scroll-area').evaluate((el) => { el.scrollTop = 200; });
  await expect(page.getByRole('button', { name: '返回顶部' })).toBeVisible();
  await page.getByRole('button', { name: '返回顶部' }).click();
  await expect.poll(() => page.locator('#r .kima-scroll-area').evaluate((el) => el.scrollTop)).toBe(0);
});

test('Vue model updates feed back into splitter and carousel', async ({ page }) => {
  await page.evaluate(() => window.navigationFixture.example('splitter'));
  const handle = page.getByRole('separator'); await handle.focus(); await handle.press('End');
  await expect(page.locator('output')).toHaveText('左侧比例：75%');
  await page.evaluate(() => window.navigationFixture.example('collapsible'));
  await page.getByRole('button', { name: '从外部关闭' }).click(); await expect(page.getByText('单独控制这一块内容，不影响其他折叠区域。')).toBeHidden();
  await page.getByRole('button', { name: '从外部展开' }).click(); await expect(page.getByText('单独控制这一块内容，不影响其他折叠区域。')).toBeVisible();
  await page.evaluate(() => window.navigationFixture.example('carousel'));
  await page.getByRole('button', { name: '下一张' }).click(); await expect(page.locator('output')).toHaveText('2 / 3');
});

test('standalone built CE entry runs without source components', async ({ page }) => {
  await page.goto('/tests/navigation-fixture.html');
  const result = await page.evaluate(async () => {
    const frame = document.createElement('iframe'); document.body.append(frame);
    const doc = frame.contentDocument;
    doc.open(); doc.write('<!doctype html><html><body><kima-carousel id="built"></kima-carousel><script type="module">import "/dist/kima-elements.js"; const el = document.getElementById("built"); el.items = [{ title: "独立入口第一张" }, { title: "独立入口第二张" }]; window.ready = true;<\/script></body></html>'); doc.close();
    return true;
  });
  expect(result).toBe(true);
  const frame = page.frameLocator('iframe'); await expect(frame.getByRole('heading', { name: '独立入口第一张' })).toBeVisible();
  await frame.getByRole('button', { name: '下一张' }).click(); await expect(frame.getByRole('heading', { name: '独立入口第二张' })).toBeVisible();
  expect(await frame.locator('p').count()).toBe(0);
});

for (const theme of ['dark', 'light']) test(`Vue examples ${theme}: fourteen isolated demos without errors or overflow`, async ({ page }, testInfo) => {
  const errors = []; page.on('pageerror', (error) => errors.push(error.message));
  await mkdir('shots/navigation-expansion', { recursive: true });
  for (const slug of slugs) {
    await page.evaluate(([slug, theme]) => window.navigationFixture.example(slug, theme), [slug, theme]);
    await expect(page.locator('article.kima-gallery__demo')).toHaveCount(1); await expect(page.locator('article h2')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (slug === 'back-top') { await page.locator('#navigation-long-reader').evaluate((el) => { el.scrollTop = 300; }); await expect(page.getByRole('button', { name: '返回顶部' })).toBeVisible(); }
    await page.screenshot({ path: `shots/navigation-expansion/${slug}-${theme}-${testInfo.project.name}.png`, fullPage: true });
  }
  expect(errors).toEqual([]);
});
