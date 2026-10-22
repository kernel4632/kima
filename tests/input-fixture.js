// 仅输入扩展测试使用，不改动公共 fixture 或现有测试文件。
import { createApp, h, ref } from "vue";
import Examples from "../src/site/input-examples.vue";
export function mountInputExamples() {
  // 测试宿主不加载站点基础样式，显式使用与默认深色 token 配对的背景。
  document.body.style.background = "var(--kima-color-surface)";
  document.body.style.color = "var(--kima-color-on-surface)";
  document.body.style.fontFamily = "var(--kima-font-family)";
  const slug = ref("textarea");
  const app = createApp({ render: () => h(Examples, { component: slug.value }) });
  app.mount(document.getElementById("fixture"));
  window.demoSlug = slug;
  window.demoApp = app;
}
