// 独立 SSR 回归：node --test tests/display.ssr.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

const slugs = ["avatar", "avatar-group", "image", "skeleton", "spinner", "alert", "result", "descriptions", "list", "timeline", "blockquote", "highlight"];
test("all display components SSR safely", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
  const { componentPaths } = await server.ssrLoadModule('/src/component-paths.js');
  try {
    const modules = {};
    for (const slug of slugs) modules[slug] = (await server.ssrLoadModule(componentPaths[slug])).default;
    for (const slug of slugs) {
      const html = await renderToString(createSSRApp({ render: () => h(modules[slug], { id: `ssr-${slug}` }) }));
      assert.ok(html.includes(`kima-${slug}`), slug);
    }
    const timeline = await renderToString(createSSRApp({ render: () => h(modules.timeline, {
      label: '发布进程', items: [{ title: '设计完成', time: '09:00', datetime: '2026-05-18T09:00:00+08:00' }, { title: '待发布' }],
    }, { item: ({ item, index }) => h('span', { 'data-event-index': index }, item.title) }) }));
    assert.match(timeline, /<ol[^>]*aria-label="发布进程"/);
    assert.equal((timeline.match(/<li\b/g) || []).length, 2);
    assert.ok(!timeline.includes('kima-timeline__items'), '时间线不能在 ol 与 li 之间插入 div');
    assert.match(timeline, /data-event-index="1">待发布/);
    const safe = await renderToString(createSSRApp({ render: () => h(modules.highlight, { text: '<script>alert(1)</script>', keywords: 'script' }) }));
    assert.ok(!safe.includes('<script>'));
    assert.match(safe, /</);
  } finally { await server.close(); }
});
