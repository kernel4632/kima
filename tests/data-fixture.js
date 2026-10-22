import { createApp, h, nextTick, ref } from "vue";
import DataExamples from "/src/site/data-examples.vue";
import "/src/styles/_tokens.scss";
import { applyPalette } from "/src/utils/theme.js";

export async function mountDataExamples(slug = "table") {
  window.dataApp?.unmount();
  applyPalette("#61afef", { isDark: true, variant: "tonal-spot" });
  document.documentElement.dataset.kimaTheme = "dark";
  const root = document.getElementById("fixture"); root.replaceChildren();
  const component = ref(slug); window.dataSlug = component;
  window.dataApp = createApp({ render: () => h(DataExamples, { component: component.value }) });
  window.dataApp.mount(root); await nextTick();
}
