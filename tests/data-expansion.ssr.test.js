import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

const slugs = ["infinite-scroll", "virtual-table", "virtual-tree", "image-preview", "notification-queue", "relative-time", "ring-progress", "copy-button", "long-text"];
test("data expansion components render safely in SSR and relative time creates no timer", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
  const { componentPaths } = await server.ssrLoadModule('/src/component-paths.js');
  try {
    const modules = {};
    for (const slug of slugs) modules[slug] = (await server.ssrLoadModule(componentPaths[slug])).default;
    for (const slug of slugs) {
      const html = await renderToString(createSSRApp({ render: () => h(modules[slug], { id: `ssr-${slug}` }) }));
      assert.match(html, new RegExp(`kima-${slug.replace("-", "\\-")}`), slug);
    }
    let timers = 0;
    const original = globalThis.setInterval;
    try {
      globalThis.setInterval = () => { timers += 1; return 0; };
      const html = await renderToString(createSSRApp({ render: () => h(modules["relative-time"], { date: Date.now() - 60000, locale: "zh-CN" }) }));
      assert.match(html, /<time/);
      assert.equal(timers, 0);
    } finally { globalThis.setInterval = original; }
  } finally { await server.close(); }
});
