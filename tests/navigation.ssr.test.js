// 独立 SSR 回归：node --test tests/navigation.ssr.test.js
import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

const slugs = ["collapsible", "breadcrumb", "breadcrumb-item"];
test("all navigation components SSR safely", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
  const { componentPaths } = await server.ssrLoadModule('/src/component-paths.js');
  try {
    const modules = {};
    for (const slug of slugs) modules[slug] = (await server.ssrLoadModule(componentPaths[slug])).default;
    for (const slug of slugs) {
      const html = await renderToString(createSSRApp({ render: () => h(modules[slug], { id: `ssr-${slug}` }) }));
      assert.ok(html.includes(`kima-${slug}`), slug);
    }
  } finally { await server.close(); }
});
