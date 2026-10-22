import "/src/elements.js";
import "/src/styles/_tokens.scss";
import "./interaction-fixture.scss";
import { createApp, h, nextTick, ref } from "vue";
import InteractionExamples from "/src/site/interaction-examples.vue";
import { applyPalette } from "/src/utils/theme.js";
const root = document.getElementById("fixture");
let app;
window.interactionFixture = {
  async mount(html, properties = {}) {
    app?.unmount(); app = undefined;
    const template = document.createElement("template"); template.innerHTML = html;
    for (const [id, values] of Object.entries(properties)) Object.assign(template.content.getElementById(id), values);
    root.replaceChildren(template.content);
    await nextTick(); await nextTick();
  },
  async example(slug, theme = "dark") {
    app?.unmount(); root.replaceChildren();
    applyPalette("#61afef", { isDark: theme === "dark", variant: "tonal-spot" });
    document.documentElement.dataset.kimaTheme = theme;
    const current = ref(slug); window.interactionSlug = current;
    app = createApp({ render: () => h(InteractionExamples, { component: current.value }) });
    app.mount(root); await nextTick(); await nextTick();
  },
};
const query = new URLSearchParams(location.search);
if (query.has("component")) await window.interactionFixture.example(query.get("component"), query.get("theme") || "dark");
document.documentElement.dataset.ready = "true";
