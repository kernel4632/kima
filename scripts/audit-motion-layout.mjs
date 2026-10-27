/* 手动中间帧审查，不改生产组件、不进入 pnpm test。
 * 先启动开发站，再运行 node scripts/audit-motion-layout.mjs [baseURL]。
 * 在真实布局中触发变化，将浏览器动画冻结于 0/50/95%，记录几何及截图。
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = process.argv[2] || 'http://127.0.0.1:5188';
const output = resolve('shots/motion-layout-audit');
await mkdir(output, { recursive: true });
const long = '这一段较长的说明用于检查换行、布局宽度和切换过程中的坐标连续性。'.repeat(8);
const items = [{ id: 'a', title: 'Alpha', description: long }, { id: 'b', title: 'Beta', description: '短说明' }, { id: 'c', title: 'Gamma', description: '第三项' }];
const table = { columns: [{ key: 'name', label: '名称', width: 180 }, { key: 'description', label: '说明' }], rows: [{ id: 'a', name: 'Alpha', description: long }, { id: 'b', name: 'Beta', description: '短说明' }, { id: 'c', name: 'Gamma', description: '第三项' }] };
const cases = [
  { name: 'carousel', html: '<kima-carousel id="subject"></kima-carousel>', props: { items: [{ title: 'Alpha', content: long }, { title: 'Beta', content: '短内容' }] }, action: () => document.querySelector('#subject button[aria-label="下一张"]').click() },
  { name: 'tabs', html: '<div id="subject"></div>', props: {}, setup: async () => {
    const { createApp, h, ref } = await import('/node_modules/.vite/deps/vue.js');
    const { default: Tabs } = await import('/src/components/core/tabs.ce.vue');
    const selected = ref('a');
    window.auditSwitchTab = (value = 'b') => { selected.value = value; };
    window.auditApp = createApp({ render: () => h(Tabs, { id: 'subject', modelValue: selected.value, items: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }] }, { panel: ({ index }) => h('div', [h('h3', index ? 'Beta' : 'Alpha'), h('p', index ? '短内容' : '很长的面板说明。'.repeat(80))]) }) });
    const mount = document.createElement('div'); document.getElementById('subject').replaceWith(mount); window.auditApp.mount(mount);
  }, action: () => window.auditSwitchTab() },
  { name: 'date-picker', html: '<kima-date-picker id="subject"></kima-date-picker>', props: { modelValue: '2026-10-15' }, setup: () => document.querySelector('#subject .kima-date-picker__trigger').click(), action: () => document.querySelectorAll('#subject .kima-date-picker__nav')[1].click() },
  { name: 'table-remove', html: '<kima-table id="subject"></kima-table>', props: table, action: () => { const host = document.getElementById('subject'); host.rows = host.rows.slice(1); } },
  { name: 'table-loading', html: '<kima-table id="subject"></kima-table>', props: table, action: () => { document.getElementById('subject').loading = true; } },
  { name: 'table-expand', html: '<kima-table id="subject"><p slot="expanded">'+long+'</p></kima-table>', props: { ...table, expandable: true }, action: () => document.querySelector('#subject .kima-table__expand-button').click() },
  { name: 'editable', html: '<kima-editable id="subject"></kima-editable>', props: { modelValue: 'Alpha' }, action: () => document.querySelector('#subject .kima-editable__display').click() },
  { name: 'skeleton', html: '<kima-skeleton id="subject"><p>真实内容只有一行</p></kima-skeleton>', props: { loading: true, rows: 6, animated: false }, action: () => { document.getElementById('subject').loading = false; } },
  { name: 'field-message', html: '<kima-field id="subject"><kima-text-field label="邮箱"></kima-text-field></kima-field>', props: { hint: long }, action: () => { document.getElementById('subject').error = '短错误'; } },
  { name: 'text-field-message', html: '<kima-text-field id="subject"></kima-text-field>', props: { label: '邮箱', hint: long }, action: () => { document.getElementById('subject').error = '短错误'; } },
  { name: 'textarea-message', html: '<kima-textarea id="subject"></kima-textarea>', props: { label: '备注', hint: long }, action: () => { document.getElementById('subject').error = '短错误'; } },
  { name: 'list-remove', html: '<kima-list id="subject"></kima-list>', props: { items }, action: () => { const host = document.getElementById('subject'); host.items = host.items.slice(1); } },
  { name: 'timeline-remove', html: '<kima-timeline id="subject"></kima-timeline>', props: { items }, action: () => { const host = document.getElementById('subject'); host.items = host.items.slice(1); } },
  { name: 'dynamic-input-remove', html: '<kima-dynamic-input id="subject"></kima-dynamic-input>', props: { modelValue: [{ id: 'a', title: 'Alpha' }, { id: 'b', title: 'Beta' }, { id: 'c', title: 'Gamma' }] }, action: () => document.querySelector('#subject button[aria-label="移除第1项"]').click() },
  { name: 'tag-group-remove', html: '<kima-tag-group id="subject"></kima-tag-group>', props: { removable: true, items: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma' }] }, action: () => document.querySelector('#subject button[aria-label="移除 Alpha"]').click() },
  { name: 'tags-input-remove', html: '<kima-tags-input id="subject"></kima-tags-input>', props: { modelValue: ['Alpha', 'Beta', 'Gamma'] }, action: () => document.querySelector('#subject button[aria-label="移除 Alpha"]').click() },
  { name: 'pagination', html: '<kima-pagination id="subject"></kima-pagination>', props: { total: 400, pageSize: 10, modelValue: 4 }, action: () => { document.getElementById('subject').modelValue = 12; } },
  { name: 'stepper', html: '<kima-stepper id="subject"></kima-stepper>', props: { modelValue: 0, items: [{ label: 'Alpha' }, { label: 'Beta' }, { label: 'Gamma' }] }, action: () => { document.getElementById('subject').modelValue = 1; } },
  { name: 'long-text-collapse', html: '<kima-long-text id="subject"></kima-long-text>', props: { text: long, lines: 2, expanded: true }, action: () => document.querySelector('#subject button').click() },
  { name: 'accordion-close', html: '<kima-accordion id="subject"></kima-accordion>', props: { modelValue: 'a', items: [{ value: 'a', label: 'Alpha', content: long }, { value: 'b', label: 'Beta', content: '短内容' }] }, action: () => document.querySelector('#subject button').click() },
  { name: 'collapsible-close', html: '<kima-collapsible id="subject"><p>'+long+'</p></kima-collapsible>', props: { open: true, label: '展开' }, action: () => document.querySelector('#subject button').click() },
  { name: 'infinite-scroll', html: '<kima-infinite-scroll id="subject"></kima-infinite-scroll>', props: { observe: false }, setup: () => { document.getElementById('subject').loadMore = () => new Promise(resolve => { window.finishLoad = resolve; }); }, action: () => document.querySelector('#subject button').click() },
  { name: 'rich-text-link', html: '<kima-rich-text-editor id="subject"></kima-rich-text-editor>', props: { modelValue: '<p>Alpha</p>' }, action: () => document.querySelector('#subject button[aria-label="链接"]').click() },
  { name: 'file-upload-remove', html: '<kima-file-upload id="subject" multiple></kima-file-upload>', props: {}, setup: () => { document.getElementById('subject').modelValue = [new File(['A'], 'Alpha.pdf'), new File(['B'], 'Beta.pdf')]; }, action: () => document.querySelector('#subject button[aria-label="移除 Alpha.pdf"]').click() },
  { name: 'progress-group-remove', html: '<kima-progress-group id="subject"></kima-progress-group>', props: { tasks: [{ id: 'a', label: 'Alpha', value: 40 }, { id: 'b', label: 'Beta', value: 80 }, { id: 'c', label: 'Gamma', value: 50 }] }, action: () => { const h = document.getElementById('subject'); h.tasks = h.tasks.slice(1); } },
  { name: 'avatar-group-remove', html: '<kima-avatar-group id="subject"></kima-avatar-group>', props: { items: [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }, { id: 'c', name: 'Gamma' }] }, action: () => { const h = document.getElementById('subject'); h.items = h.items.slice(1); } },
  { name: 'multi-select-remove', html: '<kima-multi-select id="subject"></kima-multi-select>', props: { modelValue: ['a', 'b', 'c'], items: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }, { value: 'c', label: 'Gamma' }] }, action: () => document.querySelector('#subject button[aria-label="移除 Alpha"]').click() },
  { name: 'notification-queue-remove', html: '<kima-notification-queue id="subject"></kima-notification-queue>', props: { items: [{ id: 'a', title: 'Alpha', message: '第一条', duration: 0 }, { id: 'b', title: 'Beta', message: '第二条', duration: 0 }] }, action: () => { const h = document.getElementById('subject'); h.items = h.items.slice(1); } },
  { name: 'cascader-column', html: '<kima-cascader id="subject"></kima-cascader>', props: { options: [{ value: 'a', label: 'Alpha', children: [{ value: 'b', label: 'Beta' }] }, { value: 'z', label: 'Gamma' }] }, setup: () => document.querySelector('#subject .kima-cascader__trigger').click(), action: () => document.querySelector('#subject .kima-cascader__option').click() },
  { name: 'upload-manager-remove', html: '<kima-upload-manager id="subject"></kima-upload-manager>', props: {}, setup: () => { document.getElementById('subject').modelValue = [{ id: 'a', file: new File(['A'], 'Alpha.pdf'), status: 'success', progress: 100 }, { id: 'b', file: new File(['B'], 'Beta.pdf'), status: 'success', progress: 100 }]; }, action: () => document.querySelector('#subject .kima-upload-manager__actions button[aria-label="移除 Alpha.pdf"]').click() },
  { name: 'button-loading', html: '<kima-button id="subject">保存内容</kima-button>', props: {}, action: () => { document.getElementById('subject').loading = true; } },
];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
const reportPath = resolve(output, process.argv[3] ? 'report-targeted.json' : 'report.json');
const report = [];
async function measure() {
  return page.evaluate(() => {
    window.auditIds ||= new WeakMap(); window.auditSequence ||= 0;
    const rect = node => { const r = node.getBoundingClientRect(); return { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) }; };
    const subject = document.getElementById('subject');
    const nodes = [subject, ...subject.querySelectorAll('*'), document.getElementById('after')].filter(node => {
      const style = getComputedStyle(node), r = node.getBoundingClientRect();
      return r.width && r.height && style.display !== 'none' && !node.matches('svg,svg *,input[type=hidden],.kima-ripple,[class$="__native"]');
    });
    return nodes.map(node => {
      if (!window.auditIds.has(node)) window.auditIds.set(node, ++window.auditSequence);
      const style = getComputedStyle(node);
      return { id: window.auditIds.get(node), tag: node.tagName, class: typeof node.className === 'string' ? node.className : '', text: (node.textContent || '').replace(/\s+/g, ' ').slice(0, 65), ...rect(node), position: style.position, transform: style.transform, opacity: style.opacity, boxSizing: style.boxSizing, offsetParent: node.offsetParent?.className || node.offsetParent?.tagName };
    });
  });
}
try {
  for (const width of [640, 280]) for (const example of cases.filter(example => !process.argv[3] || new RegExp(process.argv[3]).test(example.name))) {
    const result = { name: example.name, width, frames: {}, errors: [] };
    const error = cause => result.errors.push(cause.message);
    page.on('pageerror', error);
    try {
      await page.goto(base + '/tests/fixture.html', { waitUntil: 'networkidle' });
      await page.addStyleTag({ content: `body{margin:40px;background:var(--kima-color-surface);color:var(--kima-color-on-surface);font-family:var(--kima-font-family)}#fixture{position:relative;box-sizing:content-box;padding:24px;width:${width}px;max-width:none;margin-top:48px;display:block;background:var(--kima-color-layer-1)}#subject{display:block;width:100%}#after{margin:20px 0 0;padding:8px;background:var(--kima-color-layer-2)}:root{--kima-duration-medium:1000ms;--kima-duration-effects:1000ms;--kima-duration-slow:1000ms}` });
      await page.evaluate(({ html, props }) => window.fixture.mount(html + '<div id="after">后续内容位置标记</div>', { subject: props }), { html: example.html, props: example.props });
      if (example.setup) { await page.evaluate(example.setup); await page.waitForTimeout(1100); }
      await page.waitForTimeout(150);
      result.frames.before = await measure();
      await page.screenshot({ path: resolve(output, `${example.name}-${width}-before.png`) });
      await page.evaluate(example.action);
      result.animationCount = await page.evaluate(async () => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        window.auditAnimations = document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity);
        for (const animation of window.auditAnimations) { animation.pause(); animation.currentTime = 0; }
        return window.auditAnimations.length;
      });
      for (const fraction of [0, 0.5, 0.95]) {
        await page.evaluate(fraction => {
          for (const a of window.auditAnimations) a.currentTime = Number(a.effect.getTiming().duration) * fraction;
        }, fraction);
        result.frames[String(fraction)] = await measure();
        await page.screenshot({ path: resolve(output, `${example.name}-${width}-${fraction}.png`) });
      }
      await page.evaluate(() => { for (const a of window.auditAnimations) { try { a.finish(); } catch {} } });
      // Vue 的 CSS transition 清理还有基于真实时钟的超时兜底；finish() 不一定触发所有子组件的 end 事件。
      await page.waitForTimeout(1150);
      result.frames.after = await measure();
      await page.screenshot({ path: resolve(output, `${example.name}-${width}-after.png`) });
      result.initialJumps = result.frames.before.flatMap(before => {
        const start = result.frames['0'].find(node => node.id === before.id);
        if (!start) return [];
        const dx = start.x - before.x, dy = start.y - before.y, dw = start.w - before.w, dh = start.h - before.h;
        if (Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dw), Math.abs(dh)) <= 5) return [];
        return [{ class: before.class, text: before.text, dx, dy, dw, dh, positionBefore: before.position, positionStart: start.position, offsetParent: start.offsetParent }];
      });
      const marker = phase => result.frames[phase].find(n => n.text === '后续内容位置标记');
      result.marker = Object.fromEntries(['before', '0', '0.5', '0.95', 'after'].map(phase => [phase, marker(phase)?.y]));
      console.log(JSON.stringify({ name: example.name, width, animations: result.animationCount, jumps: result.initialJumps.length, marker: result.marker, errors: result.errors }));
      if (['carousel', 'tabs', 'long-text-collapse'].includes(example.name)) {
        result.interruption = await page.evaluate(async name => {
          const host = document.getElementById('subject');
          const target = host.querySelector(name === 'carousel' ? '.kima-carousel__viewport' : name === 'tabs' ? '.kima-tabs__panels' : '.kima-long-text__content');
          const update = large => {
            if (name === 'tabs') window.auditSwitchTab(large ? 'a' : 'b');
            else if (name === 'carousel') host.modelValue = large ? 0 : 1;
            else host.querySelector('button').click();
          };
          const tick = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const box = () => ({ h: target.getBoundingClientRect().height, overflow: target.style.overflow, marker: document.getElementById('after').getBoundingClientRect().y });
          const short = box();
          update(true); await tick();
          const first = target.getAnimations().find(a => a.effect.getKeyframes().some(frame => frame.height));
          if (!first) return { error: 'No height animation' };
          first.pause(); first.currentTime = Number(first.effect.getTiming().duration) * 0.35;
          const beforeReverse = box();
          update(false); await tick();
          const afterReverse = box();
          const animations = target.getAnimations();
          for (const a of animations) { a.pause(); a.currentTime = Number(a.effect.getTiming().duration) * 0.95; }
          const nearEnd = box();
          return { short, beforeReverse, afterReverse, nearEnd, reusedOldHeightAnimation: animations.includes(first), keyframes: animations.map(a => a.effect.getKeyframes()) };
        }, example.name);
        await page.screenshot({ path: resolve(output, `${example.name}-${width}-interrupted-95.png`) });
        await page.evaluate(() => { for (const a of document.getAnimations()) if (a.effect.getTiming().iterations !== Infinity) { try { a.finish(); } catch {} } });
        await page.waitForTimeout(1150);
        result.interruption.afterCleanup = await page.evaluate(name => {
          const target = document.querySelector(name === 'carousel' ? '.kima-carousel__viewport' : name === 'tabs' ? '.kima-tabs__panels' : '.kima-long-text__content');
          return { h: target.getBoundingClientRect().height, overflow: target.style.overflow, marker: document.getElementById('after').getBoundingClientRect().y };
        }, example.name);
        console.log('interruption', example.name, width, JSON.stringify(result.interruption));
      }
    } catch (cause) { result.fatal = String(cause.stack || cause); console.error(example.name, width, cause.message); }
    page.off('pageerror', error);
    report.push(result);
    await writeFile(reportPath, JSON.stringify(report, null, 2));
  }
} finally { await browser.close(); }
