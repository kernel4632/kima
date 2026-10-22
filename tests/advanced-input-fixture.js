import { createApp, h, ref } from "vue";
import Examples from "../src/site/advanced-input-examples.vue";
export function mountAdvancedInputExamples() {
  document.body.style.background = "var(--kima-color-surface)";
  document.body.style.color = "var(--kima-color-on-surface)";
  const component = ref("range-slider");
  const app = createApp({ render: () => h(Examples, { component: component.value }) });
  app.mount(document.getElementById("fixture"));
  window.advancedInputSlug = component;
  window.advancedInputApp = app;
}
