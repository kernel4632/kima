// 独立 SSR 回归：node --test tests/display.ssr.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

const slugs = ["avatar", "avatar-group", "image", "skeleton", "spinner", "alert", "result", "descriptions", "list", "timeline", "statistic", "countdown", "blockquote", "highlight"];
test("all display components SSR safely; countdown schedules no timer or finish", async () => {
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
    let timerCount = 0;
    let finishes = 0;
    const timeout = globalThis.setTimeout;
    const interval = globalThis.setInterval;
    try {
      globalThis.setTimeout = () => { timerCount++; return 0; };
      globalThis.setInterval = () => { timerCount++; return 0; };
      const html = await renderToString(createSSRApp({ render: () => h(modules.countdown, { value: Date.now() - 1000, onFinish: () => finishes++ }) }));
      assert.match(html, /--:--:--/);
      assert.equal(timerCount, 0);
      assert.equal(finishes, 0);
    } finally {
      globalThis.setTimeout = timeout;
      globalThis.setInterval = interval;
    }
    const safe = await renderToString(createSSRApp({ render: () => h(modules.highlight, { text: '<script>alert(1)</script>', keywords: 'script' }) }));
    assert.ok(!safe.includes('<script>'));
    assert.match(safe, /</);
  } finally { await server.close(); }
});
