/* Register every KIMA light-DOM element and install their component styles once.
 * Usage: import "@kernel4632/kima/elements";
 * Native HTML: <script type="module" src="./dist/kima-elements.js"></script>
 *              <kima-button type="submit">Save</kima-button>
 * Only tokens and component CSS are installed; the host page keeps its own reset.
 *
 * 这是全量入口（145 个）。只想要日常控件时用 "@kernel4632/kima/elements/core"，
 * 它按 src/component-tiers.js 的 core 档注册，体积小得多。
 */
import { defineKimaElements } from "./utils/register-elements.js";

const components = import.meta.glob("./components/**/*.ce.vue", { eager: true, import: "default" });
const bySlug = Object.fromEntries(Object.entries(components).map(([path, component]) => [
  path.split("/").pop().replace(/\.ce\.vue$/, ""),
  component,
]));

export const elements = defineKimaElements(bySlug);
