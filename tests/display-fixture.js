// 展示组独立 Vue 入口，不修改共享 fixture。
import { createApp, h, nextTick, ref } from "vue";
import DisplayExamples from "/src/site/display-examples.vue";
import "/src/styles/_tokens.scss";
import "./display-fixture.scss";
import { applyPalette } from "/src/utils/theme.js";

export async function mountDisplayExamples(slug = "avatar") {
  window.displayApp?.unmount();
  applyPalette("#61afef", { isDark: true, variant: "tonal-spot" });
  document.documentElement.dataset.kimaTheme = "dark";
  const root = document.getElementById("fixture");
  root.replaceChildren();
  const component = ref(slug);
  const app = createApp({ render: () => h(DisplayExamples, { component: component.value }) });
  window.displaySlug = component;
  window.displayApp = app;
  app.mount(root);
  await nextTick();
}
