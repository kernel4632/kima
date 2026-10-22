// No browser needed: node --test tests/notification.ssr.test.js.
import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

test("SSR of an open notification does not schedule a close timer", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
  const { componentPaths } = await server.ssrLoadModule('/src/component-paths.js');
  const setTimeoutOriginal = globalThis.setTimeout;
  const timers = [];
  try {
    const { default: Notification } = await server.ssrLoadModule(componentPaths['notification']);
    const { createSSRApp, h } = await import("vue");
    const { renderToString } = await import("vue/server-renderer");
    globalThis.setTimeout = (...args) => {
      timers.push(args);
      return setTimeoutOriginal(...args);
    };
    const html = await renderToString(createSSRApp({ render: () => h(Notification, { open: true, heading: "SSR notice", duration: 12345 }) }));
    assert.match(html, /SSR notice/);
    assert.equal(timers.filter(([, duration]) => duration === 12345).length, 0);
  } finally {
    globalThis.setTimeout = setTimeoutOriginal;
    await server.close();
  }
});
