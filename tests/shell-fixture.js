import '../src/elements.js';
import { createApp, nextTick } from 'vue';
import ShellExamples from '../src/site/shell-examples.vue';
import ShellModelFixture from './shell-model-fixture.vue';
import { applyPalette } from '../src/utils/theme.js';
let app;
const root = document.getElementById('fixture');
document.body.style.cssText = 'margin:0;padding:24px;background:var(--kima-color-surface);color:var(--kima-color-on-surface);font-family:var(--kima-font-family)';
window.shellFixture = {
  async mount(html, properties = {}) { app?.unmount(); app = null; root.innerHTML = html; for (const [id, props] of Object.entries(properties)) Object.assign(document.getElementById(id), props); await nextTick(); await nextTick(); },
  async example(component) { applyPalette('#ffffff', {isDark: document.documentElement.dataset.theme !== 'light'}); app?.unmount(); root.innerHTML = ''; app = createApp(ShellExamples, {component}); app.mount(root); await nextTick(); },
  async model() { app?.unmount(); root.innerHTML = ''; app = createApp(ShellModelFixture); app.mount(root); await nextTick(); },
};
document.documentElement.dataset.ready = 'true';
