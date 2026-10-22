import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const mount = (page, html, properties = {}) => page.evaluate(([html, properties]) => window.shellFixture.mount(html, properties), [html, properties]);
const set = (page, id, props) => page.evaluate(([id, props]) => Object.assign(document.getElementById(id), props), [id, props]);
const actions = [{value:'sub',label:'更多',children:[{value:'deep',label:'格式',children:[{value:'png',label:'PNG'},{value:'bad',label:'禁用格式',disabled:true}]}]}, {value:'flag',label:'标记',type:'checkbox'}, {value:'a',label:'模式 A',type:'radio',group:'mode'}, {value:'b',label:'模式 B',type:'radio',group:'mode'}, {value:'off',label:'不可用',disabled:true}];
const nav = [{value:'guide',label:'指南',href:'#guide',children:[{value:'start',label:'开始',href:'#start'}, {value:'disabled',label:'不可访问',href:'#bad',disabled:true}]}];
test.beforeEach(async ({page}) => { await page.goto('/tests/shell-fixture.html'); await expect(page.locator('html')).toHaveAttribute('data-ready', 'true'); });

test('six public entries and parseable props/events with no internal entries', async ({page}) => {
  const docs = await page.evaluate(async () => (await import('/@id/virtual:kima-docs')).default);
  for (const slug of ['sidebar','app-shell','config-provider','masonry','marquee','gradient-text']) { expect(docs.find((d) => d.slug === slug)?.attributes.length).toBeGreaterThan(0); expect(await page.evaluate((s) => !!customElements.get(`kima-${s}`), slug)).toBe(true); }
  expect(docs.some((d) => d.slug === 'menu-items')).toBe(false);
});

for (const kind of ['menu','context-menu','menubar']) {
  test(`${kind} nested keyboard focus return checkbox radio disabled and external map`, async ({page}) => {
    await mount(page, `<kima-${kind} id="m"></kima-${kind}>`, {m: kind === 'menubar' ? {menus:[{value:'file',label:'文件',items:actions}]} : {items:actions}});
    if (kind === 'menu') await page.getByRole('button', {name:'选择项目'}).click();
    else if (kind === 'menubar') await page.getByRole('menuitem', {name:'文件',exact:true}).click();
    else { await page.locator('.kima-context-menu__trigger').focus(); await page.keyboard.press('Shift+F10'); }
    const more = page.getByRole('menuitem', {name:'更多',exact:true});
    await more.focus(); await more.press('ArrowRight');
    const format = page.getByRole('menuitem', {name:'格式',exact:true}); await expect(format).toBeVisible(); await format.focus(); await format.press('ArrowRight');
    await expect(page.getByRole(kind === 'menu' ? 'menuitemradio' : 'menuitem', {name:'禁用格式',exact:true})).toHaveAttribute('aria-disabled','true');
    const png = page.getByRole(kind === 'menu' ? 'menuitemradio' : 'menuitem', {name:'PNG',exact:true}); await expect(png).toBeVisible(); await png.focus(); await png.press('ArrowLeft'); await expect(format).toBeFocused();
    await format.press('ArrowLeft'); await expect(more).toBeFocused();
    const flag = page.getByRole('menuitemcheckbox', {name:'标记'}); await flag.click(); await expect(flag).toHaveAttribute('aria-checked','true');
    await page.getByRole('menuitemradio', {name:'模式 A'}).click(); await page.getByRole('menuitemradio', {name:'模式 B'}).click(); await expect(page.getByRole('menuitemradio', {name:'模式 A'})).toHaveAttribute('aria-checked','false'); await expect(page.getByRole('menuitemradio', {name:'模式 B'})).toHaveAttribute('aria-checked','true');
    expect(await page.locator('#m').evaluate((el) => el.checked)).toEqual({flag:true, mode:'b'});
    await set(page,'m',{checked:{flag:false,mode:'a'}}); await expect(flag).toHaveAttribute('aria-checked','false');
    await flag.focus(); await flag.press('Escape'); await expect(page.getByRole('menu')).toHaveCount(0);
  });
}

test('touch activation and mouse hover delay open submenu with multiple instances', async ({page,isMobile}) => {
  await mount(page,'<kima-menu id="m" label="第一"></kima-menu><kima-menu id="n" label="第二"></kima-menu>', {m:{items:actions},n:{items:actions}});
  await page.getByRole('button',{name:'第一'}).click();
  const more = page.getByRole('menuitem',{name:'更多',exact:true});
  if (isMobile) await more.tap(); else { await more.hover(); await expect(more).toHaveAttribute('aria-expanded','false'); }
  await expect(more).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'第二'}).click(); await expect(page.getByRole('button',{name:'第一'})).toHaveAttribute('aria-expanded','false');
  const ids = await page.locator('[id]').evaluateAll((els) => els.map((el) => el.id)); expect(new Set(ids).size).toBe(ids.length);
});

test('nested menu Escape inside native modal only dismisses current layer', async ({page}) => {
  await mount(page,'<dialog id="dialog"><kima-menu id="m"></kima-menu></dialog>',{m:{items:actions}});
  await page.locator('#dialog').evaluate((el) => el.showModal());
  await page.getByRole('button',{name:'选择项目'}).click();
  const more = page.getByRole('menuitem',{name:'更多',exact:true}); await more.focus(); await more.press('ArrowRight');
  const format = page.getByRole('menuitem',{name:'格式',exact:true}); await format.focus(); await format.press('Escape');
  await expect(page.locator('#dialog')).toHaveAttribute('open',''); await expect(more).toBeFocused();
  await more.press('Escape'); await expect(page.locator('#dialog')).toHaveAttribute('open',''); await expect(page.getByRole('button',{name:'选择项目'})).toBeFocused();
});

test('Vue controlled values respect rejected updates and inherited injection', async ({page}) => {
  await page.evaluate(() => window.shellFixture.model());
  const flag = page.getByRole('menuitemcheckbox',{name:'标记'}); await flag.click(); await expect(flag).toHaveAttribute('aria-checked','false');
  await page.getByRole('button',{name:'允许更新'}).click(); await flag.click(); await expect(flag).toHaveAttribute('aria-checked','true');
  await expect(page.getByRole('complementary',{name:'Sidebar',exact:true})).toHaveCount(1);
});

test('nested navigation active descendants links expanded model and keyboard', async ({page}) => {
  await mount(page,'<kima-navigation-menu id="n" orientation="vertical"></kima-navigation-menu>',{n:{items:nav,modelValue:'start'}});
  await expect(page.getByRole('link',{name:'开始',exact:true})).toBeVisible(); await expect(page.getByRole('link',{name:'开始',exact:true})).toHaveAttribute('aria-current','page');
  await expect(page.locator('#n li[data-active]')).toHaveCount(2); await expect(page.getByText('不可访问', {exact:true})).not.toHaveAttribute('href');
  const collapse = page.getByRole('button',{name:'收起 指南'}); await collapse.click(); await expect(page.getByRole('link',{name:'开始',exact:true})).toBeHidden();
  await set(page,'n',{expanded:['guide']}); const start = page.getByRole('link',{name:'开始',exact:true}); await expect(start).toBeVisible(); await start.click(); await expect(page).toHaveURL(/#start$/);
  await start.press('Home'); await expect(page.getByRole('link',{name:'指南',exact:true})).toBeFocused();
});

test('collapse has intermediate height fast reversal and reduced-motion ends immediately', async ({page}) => {
  await mount(page,'<kima-navigation-menu id="n"></kima-navigation-menu>',{n:{items:nav}});
  const expand = page.getByRole('button',{name:'展开 指南'}); const panel = page.locator(`#${await expand.getAttribute('aria-controls')}`);
  await expand.evaluate((el) => el.click()); await page.waitForTimeout(60);
  const intermediate = await panel.evaluate((el) => ({height:el.getBoundingClientRect().height, natural:el.scrollHeight, animations:el.getAnimations().length})); expect(intermediate.animations).toBeGreaterThan(0); expect(intermediate.height).toBeGreaterThan(0); expect(intermediate.height).toBeLessThan(intermediate.natural);
  await page.getByRole('button',{name:'收起 指南'}).evaluate((el) => el.click()); await page.waitForTimeout(30); await page.getByRole('button',{name:'展开 指南'}).evaluate((el) => el.click()); await expect(panel).toBeVisible(); await expect(panel).not.toHaveAttribute('inert');
  await page.emulateMedia({reducedMotion:'reduce'}); await page.getByRole('button',{name:'收起 指南'}).click(); await expect(panel).toBeHidden(); expect(await panel.evaluate((el) => el.getAnimations().length)).toBe(0);
});

test('sidebar collapse persistence href slots and responsive drawer restoration', async ({page}) => {
  await mount(page,'<kima-sidebar id="s" storage-key="shell-sidebar" breakpoint="500"><strong slot="header">团队</strong><span slot="footer">设置</span></kima-sidebar>',{s:{items:nav}});
  if (page.viewportSize().width > 500) { await expect(page.getByText('团队',{exact:true})).toBeVisible(); await expect(page.getByText('设置',{exact:true})).toBeVisible(); }
  if (page.viewportSize().width > 500) { await page.getByRole('button',{name:'折叠侧栏'}).click(); expect(await page.evaluate(() => localStorage.getItem('shell-sidebar'))).toBe('true'); await set(page,'s',{collapsed:false}); }
  await page.setViewportSize({width:390,height:850}); const trigger = page.getByRole('button',{name:'打开导航'}); await trigger.click(); await expect(page.getByRole('dialog')).toBeVisible(); await expect(page.getByText('团队',{exact:true})).toBeVisible(); await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
});

test('app shell named native slots skip link and mobile modal', async ({page}) => {
  await mount(page,'<kima-app-shell id="s"><h2 slot="header">工作区</h2><a href="#home" slot="sidebar">首页</a><p slot="main">正文内容</p><p slot="footer">页脚内容</p></kima-app-shell>');
  await expect(page.locator('#s main')).toHaveText('正文内容'); await expect(page.locator('#s footer')).toHaveText('页脚内容'); const skip = page.getByRole('link',{name:'跳到正文'}); await skip.focus(); await skip.press('Enter'); await expect(page.locator('#s main')).toBeFocused();
  await page.setViewportSize({width:390,height:850}); await page.getByRole('button',{name:'打开导航'}).click(); await expect(page.getByRole('dialog')).toBeVisible(); await expect(page.getByRole('link',{name:'首页'})).toBeVisible();
});

test('nested config CE scopes theme locale dir and motion remain local and observable', async ({page}) => {
  const before = await page.locator('html').getAttribute('style');
  await mount(page,'<kima-config-provider id="outer" theme="light" seed="#61afef" variant="tonal-spot" locale="en-US" direction="rtl" reduced-motion="reduce"><kima-sidebar id="a" breakpoint="0"></kima-sidebar><kima-config-provider id="inner" theme="dark" locale="zh-CN" direction="ltr"><kima-sidebar id="b" breakpoint="0"></kima-sidebar></kima-config-provider><kima-marquee id="m" animated><a href="#x">可访问文本</a></kima-marquee></kima-config-provider>');
  await expect(page.locator('#a aside')).toHaveAttribute('aria-label','Sidebar'); await expect(page.locator('#b aside')).toHaveAttribute('aria-label','侧栏');
  expect(await page.locator('#outer > .kima-config-provider').evaluate((el) => getComputedStyle(el).direction)).toBe('rtl');
  const colors = await page.evaluate(() => ['#outer > div','#inner > div'].map((s) => getComputedStyle(document.querySelector(s)).getPropertyValue('--kima-color-primary'))); expect(colors[0]).not.toBe(colors[1]); expect(await page.locator('html').getAttribute('style')).toBe(before);
  await expect(page.locator('#m .kima-marquee__track--moving')).toHaveCount(0);
  await set(page,'outer',{locale:'zh-CN'}); await expect(page.locator('#a aside')).toHaveAttribute('aria-label','侧栏');
});

test('masonry actual resize image load column-major focus and dynamic children', async ({page}) => {
  await mount(page,'<div style="width:700px;max-width:100%" id="container"><kima-masonry id="m"><a href="#a">第一</a><a href="#b">第二</a><a href="#c">第三</a><img id="image" alt="示例"></kima-masonry></div>',{m:{columns:{base:1,sm:2,lg:3}}});
  const area = page.locator('.kima-masonry'); await expect(area).toHaveAttribute('data-flow','column-major');
  await page.locator('#container').evaluate((el) => el.style.width='300px'); await expect.poll(() => area.evaluate((el) => getComputedStyle(el).columnCount)).toBe('1');
  await page.getByRole('link',{name:'第一'}).focus(); await page.keyboard.press('Tab'); await expect(page.getByRole('link',{name:'第二'})).toBeFocused();
  await page.locator('#image').evaluate((el) => el.src='data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"></svg>'); await expect.poll(() => page.locator('#image').evaluate((el) => el.naturalHeight)).toBe(200);
});

test('marquee static default opt-in pause focus reduced and inert duplicates', async ({page}) => {
  await mount(page,'<kima-marquee id="m"><a id="original" href="#news">更新</a><button>操作</button></kima-marquee>');
  await expect(page.locator('.kima-marquee__track--moving')).toHaveCount(0); await set(page,'m',{animated:true}); await expect(page.locator('.kima-marquee__track--moving')).toHaveCount(1);
  await expect(page.locator('[id="original"]')).toHaveCount(1); await expect(page.locator('.kima-marquee__group[inert]')).toHaveAttribute('aria-hidden','true');
  const original = page.locator('#original'); await original.focus(); expect(await page.locator('.kima-marquee__track').evaluate((el) => getComputedStyle(el).animationPlayState)).toBe('paused');
  await page.getByRole('button',{name:'暂停滚动'}).click(); await expect(page.getByRole('button',{name:'继续滚动'})).toHaveAttribute('aria-pressed','true');
  await page.emulateMedia({reducedMotion:'reduce'}); await expect(page.locator('.kima-marquee__track--moving')).toHaveCount(0);
});

test('search menu retains keyboard selection escape and outside focus', async ({page}) => {
  await mount(page, '<kima-menu id="m" searchable></kima-menu><button id="outside">外部</button>', {m:{items:[{value:'a',label:'Alpha'},{value:'b',label:'Beta',disabled:true},{value:'c',label:'Gamma'}]}});
  await page.getByRole('button',{name:'选择项目'}).click(); const input = page.getByRole('searchbox'); await expect(input).toBeFocused(); await input.fill('gam'); await input.press('Enter'); await expect(page.getByRole('button',{name:'Gamma'})).toBeVisible();
  await page.getByRole('button',{name:'Gamma'}).click(); await input.press('Escape'); await expect(page.getByRole('menu')).toHaveCount(0);
  await page.getByRole('button',{name:'Gamma'}).click(); await page.locator('#outside').click(); await expect(page.locator('#outside')).toBeFocused();
});

test('app shell nested native sidebar survives responsive remount', async ({page}) => {
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await mount(page,'<kima-app-shell id="shell"><strong slot="header">团队工作区</strong><kima-sidebar id="side" slot="sidebar" breakpoint="0"><b slot="header">导航标题</b></kima-sidebar><p slot="main">主要内容</p></kima-app-shell>',{side:{items:nav}});
  await page.setViewportSize({width:1000,height:800}); await expect(page.getByText('导航标题',{exact:true})).toBeVisible();
  await page.setViewportSize({width:390,height:800}); await page.getByRole('button',{name:'打开导航'}).click(); await expect(page.getByText('导航标题',{exact:true})).toBeVisible(); await page.keyboard.press('Escape');
  await page.setViewportSize({width:1000,height:800}); await expect(page.getByText('导航标题',{exact:true})).toBeVisible(); expect(errors).toEqual([]);
});

test('screenshots six examples light dark and reduced gradient fallback', async ({page}, info) => {
  await mkdir('shots/shell-expansion',{recursive:true});
  for (const theme of ['dark','light']) for (const component of ['sidebar','app-shell','config-provider','masonry','marquee','gradient-text']) {
    await page.evaluate(([component,theme]) => { document.documentElement.dataset.theme=theme; return window.shellFixture.example(component); },[component,theme]);
    await expect(page.locator('article.kima-gallery__demo')).toHaveCount(1); await page.screenshot({path:`shots/shell-expansion/${component}-${theme}-${info.project.name}.png`,fullPage:true});
  }
  await mount(page,'<kima-gradient-text animated>可读标题</kima-gradient-text>'); await page.emulateMedia({reducedMotion:'reduce'}); expect(await page.locator('.kima-gradient-text').evaluate((el) => getComputedStyle(el).animationName)).toBe('none'); await page.emulateMedia({forcedColors:'active'}); expect(await page.locator('.kima-gradient-text').evaluate((el) => getComputedStyle(el).backgroundImage)).toBe('none');
});

