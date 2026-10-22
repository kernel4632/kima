/* Register KIMA light-DOM elements and install their component styles once.
 * Usage: import "@kernel4632/kima/elements";
 * Native HTML: <script type="module" src="./dist/kima-elements.js"></script>
 *              <kima-button type="submit">Save</kima-button>
 * Only tokens and component CSS are installed; the host page keeps its own reset.
 */
import { defineCustomElement } from "vue";
import tokens from "./styles/_tokens.scss?inline";

const components = import.meta.glob("./components/**/*.ce.vue", { eager: true, import: "default" });
const elements = Object.fromEntries(Object.entries(components).map(([path, component]) => [
  `kima-${path.split("/").pop().replace(/\.ce\.vue$/, "")}`,
  component,
]));

if (typeof document !== "undefined" && typeof customElements !== "undefined") {
  // Vue only injects .ce.vue styles into shadow roots; light DOM shares one stylesheet.
  if (!document.getElementById("kima-component-styles")) {
    const style = document.createElement("style");
    style.id = "kima-component-styles";
    const componentStyles = Object.values(elements).flatMap((component) => component.styles || []).join("\n");
    style.textContent = `${tokens}\n${componentStyles}`;
    document.head.append(style);
  }

  let nextElementId = 0;
  for (const [tagName, component] of Object.entries(elements)) {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, defineCustomElement(component, {
        shadowRoot: false,
        styles: undefined,
        configureApp(app) {
          // Each custom element has its own Vue app; keep useId unique across hosts.
          app.config.idPrefix = `${tagName}-${nextElementId++}`;
        },
      }));
    }
  }
}

export { elements };
