import '/src/elements.js';
import '/src/styles/_tokens.scss';
import { createApp, h, nextTick, ref } from 'vue';
import Examples from '../src/site/utility-examples.vue';
import { createNotifications } from '../src/utils/notifications.js';
import { applyPalette } from '../src/utils/theme.js';
const root = document.getElementById('fixture');
let app;
window.utility = {
  createNotifications,
  async mount(html, properties = {}) {
    app?.unmount(); app = null;
    const template = document.createElement('template'); template.innerHTML = html;
    for (const [id, props] of Object.entries(properties)) Object.assign(template.content.getElementById(id), props);
    root.replaceChildren(template.content); await nextTick(); await nextTick();
  },
  async examples(slug) { app?.unmount(); root.replaceChildren(); const component = ref(slug); app = createApp({ render: () => h(Examples, { component: component.value }) }); app.mount(root); window.utilitySlug = component; await nextTick(); },
  async theme(mode) { document.documentElement.style.colorScheme = mode; await applyPalette('#61afef', { isDark: mode === 'dark' }); },
};
document.body.style.cssText = 'margin:16px;background:var(--kima-color-surface);color:var(--kima-color-on-surface);font-family:var(--kima-font-family)';
document.documentElement.dataset.ready = 'true';
