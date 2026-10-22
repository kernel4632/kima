// 独立 SSR 回归：node --test tests/display.ssr.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

const slugs = ["avatar", "avatar-group", "image", "skeleton", "spinner", "alert", "result", "descriptions", "list", "timeline", "statistic", "countdown", "kbd", "blockquote", "highlight", "aspect-ratio"];
test("all display components SSR safely; countdown schedules no timer or finish", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
  try {
    const modules = {};
    for (const slug of slugs) modules[slug] = (await server.ssrLoadModule(`/src/components/${slug}.ce.vue`)).default;
    for (const slug of slugs) {
      const html = await renderToString(createSSRApp({ render: () => h(modules[slug], { id: `ssr-${slug}` }) }));
      assert.ok(html.includes(`kima-${slug}`), slug);
    }
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
