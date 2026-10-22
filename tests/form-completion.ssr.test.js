import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

const samples = {
  "datetime-range-picker": ["2026-01-01T09:00", "2026-01-01T10:00"],
  "period-picker": ["2026-01", "2026-02"],
  "date-field": "2026-01-01",
  "time-field": "09:00",
  "time-select": "09:00",
  "dynamic-input": [{ id: "row-1", value: "x" }],
  "masked-input": "2026-01-01",
  "json-input": '{"ok":true}',
  "angle-slider": 45,
  "upload-manager": [],
};

test("form completion components render in SSR without browser globals", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
  const { componentPaths } = await server.ssrLoadModule('/src/component-paths.js');
  try {
    for (const [slug, modelValue] of Object.entries(samples)) {
      const component = (await server.ssrLoadModule(componentPaths[slug])).default;
      const html = await renderToString(createSSRApp({ render: () => h(component, { name: "field", modelValue }) }));
      assert.match(html, new RegExp(`kima-${slug.replaceAll("-", "\\-")}`), slug);
    }
  } finally {
    await server.close();
  }
});

test("form-completion examples server render without touching document", async () => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: "custom" });
  const { componentPaths } = await server.ssrLoadModule('/src/component-paths.js');
  try {
    const example = (await server.ssrLoadModule("/src/site/form-completion-examples.vue")).default;
    for (const slug of ["date-field", "upload-manager", "form", "color-picker"]) {
      const html = await renderToString(createSSRApp({ render: () => h(example, { component: slug }) }));
      assert.match(html, /kima-form-completion-example/);
    }
  } finally {
    await server.close();
  }
});
