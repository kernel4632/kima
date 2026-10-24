// 只注册冒烟需要的三个入口，不编译完整组件库。
import { defineCustomElement } from "vue";
import Button from "../src/components/core/button.ce.vue";
import Dialog from "../src/components/core/dialog.ce.vue";
import Select from "../src/components/core/select.ce.vue";

for (const [tag, component] of Object.entries({ "kima-button": Button, "kima-dialog": Dialog, "kima-select": Select })) {
  if (!customElements.get(tag)) customElements.define(tag, defineCustomElement(component, { shadowRoot: false }));
}

const root = document.getElementById("fixture");
const events = [];
window.smoke = {
  events,
  mount(html, properties = {}) {
    events.length = 0;
    root.innerHTML = html;
    for (const [id, values] of Object.entries(properties)) Object.assign(root.querySelector(`#${id}`), values);
    for (const host of root.querySelectorAll("*")) {
      if (!host.tagName.startsWith("KIMA-")) continue;
      host.addEventListener("click", (event) => {
        if (event.currentTarget === host) events.push({ id: host.id, type: "click", mouseEvent: event instanceof MouseEvent });
      });
    }
  },
};
document.documentElement.dataset.ready = "true";
