<!-- 字段辅助容器：无可见标签。把 hint/error 与插槽内的真实控件关联，保留子控件已有描述和错误。
调用示例：
  <kima-field hint="请输入工作邮箱" error=""><kima-text-field label="邮箱" name="email" /></kima-field>
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import { useContentMotion } from "../../utils/content-motion.js";
import { useNativeSlots } from "../../utils/native-slots.js";
import { collapseTransition, presenceTransition } from "../../utils/motion.js";
const props = defineProps({ hint: { type: String, default: "" }, error: { type: String, default: "" } });
const root = ref(null);
useNativeSlots(root);
const id = `kima-field-${useId()}`;
const message = computed(() => props.error || props.hint);
const messageWrap = ref(null);
useContentMotion(messageWrap, () => [message.value, Boolean(props.error)]);
// Keep the last visible message intact while its wrapper collapses.
const displayedMessage = ref(message.value);
const displayedError = ref(Boolean(props.error));
watch([message, () => props.error], ([text, error]) => {
  if (text) { displayedMessage.value = text; displayedError.value = Boolean(error); }
});
const markedInvalid = new Set();
const described = new Set();
let observer;
function controls() {
  return [...root.value.querySelectorAll('input:not([type="hidden"]),textarea,select,button[role="combobox"],[role="radiogroup"]')].filter((el) => el.closest(".kima-field") === root.value);
}
function reconcile() {
  if (!root.value) return;
  for (const element of controls()) {
    const ids = (element.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean).filter((value) => value !== id);
    if (message.value) { ids.push(id); described.add(element); }
    const next = ids.join(" ");
    if ((element.getAttribute("aria-describedby") || "") !== next) {
      if (next) element.setAttribute("aria-describedby", next);
      else element.removeAttribute("aria-describedby");
    }
    if (props.error && !element.hasAttribute("aria-invalid")) { element.setAttribute("aria-invalid", "true"); markedInvalid.add(element); }
    if (!props.error && markedInvalid.has(element)) { element.removeAttribute("aria-invalid"); markedInvalid.delete(element); }
  }
}
watch(message, reconcile, { flush: "post" });
watch(() => props.error, reconcile, { flush: "post" });
onMounted(() => {
  reconcile();
  observer = new MutationObserver(reconcile);
  observer.observe(root.value, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-describedby", "aria-invalid"] });
});
onBeforeUnmount(() => {
  observer?.disconnect();
  for (const element of described) {
    const ids = (element.getAttribute("aria-describedby") || "").split(/\s+/).filter((value) => value && value !== id);
    if (ids.length) element.setAttribute("aria-describedby", ids.join(" "));
    else element.removeAttribute("aria-describedby");
  }
  for (const element of markedInvalid) element.removeAttribute("aria-invalid");
});
</script>
<template>
  <div ref="root" class="kima-field">
    <slot />
    <Transition :css="false" v-bind="collapseTransition">
      <div ref="messageWrap" v-show="message" :id="id" class="kima-field__messages" :inert="!message" :aria-hidden="!message || undefined">
        <p :key="`${displayedError}:${displayedMessage}`" class="kima-field__message" :role="displayedError ? 'alert' : undefined">{{ displayedMessage }}</p>
      </div>
    </Transition>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/input" as *;
@use "../../styles/mixins" as *;
.kima-field { @include input-root; display: block; min-width: 0; &__messages { display: grid; } &__message { @include input-message; grid-area: 1 / 1; margin: 0; padding-top: var(--kima-space-2); } }
</style>
