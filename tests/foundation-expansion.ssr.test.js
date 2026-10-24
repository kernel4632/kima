import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';

const samples = [
  ['grid', { columns: { base: 1, sm: 2 }, gap: 3, areas: ['head head', 'side main'] }, { head: () => 'Head', side: () => 'Side', main: () => 'Main' }],
  ['flex', { direction: 'column', gap: 2 }, { default: () => 'Flex content' }],
  ['field-group', { legend: '联系', hint: '至少一项', required: true }, { default: () => h('input', { name: 'mail' }) }],
  ['input-group', { label: '预算' }, { default: () => h('input', { name: 'amount' }) }],
  ['page-header', { heading: '成员', description: '管理成员' }, { actions: () => 'Action' }],
  ['banner', { heading: '维护', variant: 'warning', closable: true }, { default: () => '今晚维护' }],
  ['error-state', { heading: '加载失败', description: '请重试', code: 'NETWORK' }, { default: () => '补充信息' }],
  ['typography', { type: 'heading', level: 2, size: 'headline-medium' }, { default: () => '语义标题' }],
  ['time-display', { value: '2026-06-01T01:30:00Z', mode: 'datetime', locale: 'en-GB', timeZone: 'UTC' }, {}],
];

test('foundation components SSR render without browser globals', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const { componentPaths } = await server.ssrLoadModule('/src/component-paths.js');
  try {
    for (const [slug, props, slots] of samples) {
      const Component = (await server.ssrLoadModule(componentPaths[slug])).default;
      const html = await renderToString(createSSRApp({ render: () => h(Component, props, slots) }));
      assert.ok(html.includes(`kima-${slug}`), slug);
      if (slug === 'field-group') {
        assert.match(html, /<fieldset[^>]*class="kima-field-group"/);
        assert.match(html, /<legend[^>]*class="kima-field-group__legend"/);
        assert.match(html, /至少一项/);
      }
      if (slug === 'banner') assert.match(html, /role="alert"/);
      if (slug === 'error-state') assert.match(html, /加载失败/);
      if (slug === 'typography') assert.match(html, /<h2[^>]*class="kima-typography/);
      if (slug === 'time-display') {
        assert.match(html, /datetime="2026-06-01T01:30:00.000Z"/);
        assert.match(html, /01:30/);
      }
      if (slug === 'grid') assert.match(html, /grid-template-areas/);
    }
  } finally {
    await server.close();
  }
});

test('SSR time display is deterministic with explicit zone and safe on invalid input', async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const { componentPaths } = await server.ssrLoadModule('/src/component-paths.js');
  try {
    const Component = (await server.ssrLoadModule(componentPaths['time-display'])).default;
    const render = (props) => renderToString(createSSRApp({ render: () => h(Component, props) }));
    const date = await render({ value: '2026-06-01', mode: 'date', locale: 'en-GB', timeZone: 'UTC', dateStyle: 'full' });
    assert.match(date, /Monday,? 1 June 2026/);
    const invalid = await render({ value: 'invalid', mode: 'datetime', timeZone: 'UTC' });
    assert.match(invalid, /时间不可用/);
    assert.doesNotMatch(invalid, /datetime="/);
    const badZone = await render({ value: '2026-06-01T01:30:00Z', mode: 'time', locale: 'en-GB', timeZone: 'Mars/Olympus' });
    assert.doesNotMatch(badZone, /时间不可用/);
  } finally {
    await server.close();
  }
});

test('error-state never invokes its retry handler during SSR', async () => {
  let calls = 0;
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const { componentPaths } = await server.ssrLoadModule('/src/component-paths.js');
  try {
    const Component = (await server.ssrLoadModule(componentPaths['error-state'])).default;
    const html = await renderToString(createSSRApp({ render: () => h(Component, { heading: '失败', retryHandler: () => { calls += 1; } }) }));
    assert.equal(calls, 0);
    assert.match(html, /重试/);
    assert.match(html, /aria-live="assertive"/);
  } finally {
    await server.close();
  }
});
