// Mount native elements without echoing events, or a real Vue SFC via mountVue().
import "/src/elements.js";
import { createApp, nextTick } from "vue";
import VueFixture from "./vue-fixture.vue";

const root = document.getElementById("fixture");
let app;
const events = [];
const eventNames = ["click", "change", "update:modelValue", "update:open", "update:activeSnapPoint", "close", "sort-change", "row-click", "filter-change", "cell-edit", "expand", "copy", "copy-error", "load", "error"];

window.fixture = {
  events,
  async mount(html, properties = {}) {
    app?.unmount();
    app = undefined;
    events.length = 0;
    const template = document.createElement("template");
    template.innerHTML = html;
    for (const [id, values] of Object.entries(properties)) {
      Object.assign(template.content.getElementById(id), values);
    }
    for (const host of template.content.querySelectorAll("*")) {
      if (!host.tagName.startsWith("KIMA-")) continue;
      for (const type of eventNames) {
        host.addEventListener(type, (event) => {
          if (event.currentTarget !== host) return;
          events.push({ id: host.id, type, detail: event.detail, mouseEvent: event instanceof MouseEvent });
        });
      }
    }
    root.replaceChildren(template.content);
    await nextTick();
    await nextTick();
  },
  async mountVue() {
    app?.unmount();
    root.replaceChildren();
    events.length = 0;
    app = createApp(VueFixture);
    app.mount(root);
    await nextTick();
  },
};
document.documentElement.dataset.ready = "true";
