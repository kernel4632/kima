// 原生自定义元素挂载与独立 Vue 示例入口，避免依赖父级 fixture。
import '/src/elements.js';
import '/src/styles/_tokens.scss';
import { createApp, h, nextTick } from 'vue';
import Examples from '../src/site/foundation-examples.vue';
import { applyPalette } from '../src/utils/theme.js';

const root = document.getElementById('fixture');
const eventNames = ['update:open', 'dismiss', 'restore', 'validity-change', 'retry', 'recovered', 'error', 'reset'];
const events = [];
let app;

window.foundation = {
  events,
  async mount(html, properties = {}) {
    app?.unmount();
    app = null;
    events.length = 0;
    const template = document.createElement('template');
    template.innerHTML = html;
    for (const [id, values] of Object.entries(properties)) Object.assign(template.content.getElementById(id), values);
    for (const host of template.content.querySelectorAll('*')) {
      if (!host.tagName.startsWith('KIMA-')) continue;
      for (const type of eventNames) host.addEventListener(type, (event) => events.push({ id: host.id, type, detail: event.detail }));
    }
    root.replaceChildren(template.content);
    await nextTick();
    await nextTick();
  },
  async examples(slug) {
    app?.unmount();
    root.replaceChildren();
    app = createApp({ render: () => h(Examples, { component: slug }) });
    app.mount(root);
    await nextTick();
    await nextTick();
  },
  async theme(mode) {
    document.documentElement.style.colorScheme = mode;
    await applyPalette('#61afef', { isDark: mode === 'dark' });
  },
};
document.body.style.cssText = 'margin:16px;background:var(--kima-color-surface);color:var(--kima-color-on-surface);font-family:var(--kima-font-family)';
document.documentElement.dataset.ready = 'true';
