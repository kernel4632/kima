/* 注册 KIMA 自定义元素：light DOM、样式只注入一次。
 * /elements（全量）和 /elements/core（core 档）共用这一份逻辑，
 * 避免两个入口各写一遍"取 tag、注入样式、defineCustomElement"。
 */
import { defineCustomElement } from "vue";
import tokens from "../styles/_tokens.scss?inline";

const STYLE_ID = "kima-component-styles";
const injected = new Set();

function styleNode() {
  let node = document.getElementById(STYLE_ID);
  if (!node) {
    node = document.createElement("style");
    node.id = STYLE_ID;
    node.textContent = tokens;
    document.head.append(node);
  }
  return node;
}

/* 一个页面可能先加载 core 入口、再补注册 extras：样式按组件累加，不整块重写。 */
function injectStyles(components) {
  const css = components
    .filter((component) => component && !injected.has(component))
    .map((component) => {
      injected.add(component);
      return (component.styles || []).join("\n");
    })
    .filter(Boolean)
    .join("\n");
  if (css) styleNode().textContent += `\n${css}`;
}

/** slug → 组件对象；返回 kima-<slug> → 组件对象的注册表。 */
export function defineKimaElements(bySlug) {
  const elements = Object.fromEntries(
    Object.entries(bySlug).map(([slug, component]) => [`kima-${slug}`, component]),
  );
  if (typeof document === "undefined" || typeof customElements === "undefined") return elements;
  injectStyles(Object.values(elements));
  let nextElementId = 0;
  for (const [tagName, component] of Object.entries(elements)) {
    if (customElements.get(tagName)) continue;
    customElements.define(tagName, defineCustomElement(component, {
      shadowRoot: false,
      styles: undefined,
      configureApp(app) {
        // Each custom element has its own Vue app; keep useId unique across hosts.
        app.config.idPrefix = `${tagName}-${nextElementId++}`;
      },
    }));
  }
  return elements;
}
