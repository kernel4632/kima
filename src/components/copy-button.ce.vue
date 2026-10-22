<!-- 通用复制动作：文本可来自 text/value 或默认插槽；只通过事件报告结果，不假设全局通知服务。 -->
<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, ref, useAttrs, useHost } from "vue";
import { presenceTransition } from "../utils/motion.js";
import KimaButton from "./button.ce.vue";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  text: { type: String, default: "" },
  value: { type: String, default: "" },
  label: { type: String, default: "复制" },
  successLabel: { type: String, default: "已复制" },
  errorLabel: { type: String, default: "复制失败" },
  timeout: { type: Number, default: 1800 },
  variant: { type: String, default: "text" },
});
const emit = defineEmits(["copy", "copy-error"]);
const attrs = useAttrs();
const host = getCurrentInstance()?.ce ? useHost() : null;
const copied = ref(false);
const failed = ref(false);
let timer;
const content = computed(() => props.text || props.value || (host?.textContent || "").trim());
const status = computed(() => failed.value ? props.errorLabel : copied.value ? props.successLabel : "");
async function copy() {
  if (!content.value) { failed.value = true; emit("copy-error", new Error("No text to copy")); return; }
  failed.value = false;
  try {
    await navigator.clipboard.writeText(content.value);
    copied.value = true;
    emit("copy", content.value);
    clearTimeout(timer);
    timer = setTimeout(() => { copied.value = false; }, Math.max(0, props.timeout));
  } catch (reason) {
    failed.value = true;
    emit("copy-error", reason);
  }
}
onBeforeUnmount(() => clearTimeout(timer));
</script>
<template>
  <span class="kima-copy-button" :aria-label="attrs['aria-label'] || undefined">
    <KimaButton v-bind="attrs" :variant="variant" :aria-label="attrs['aria-label'] || label" @click="copy"><span class="kima-copy-button__visual"><Transition name="kima-fade" v-bind="presenceTransition"><span :key="copied ? 'copied' : 'idle'">{{ copied ? successLabel : label }}</span></Transition></span></KimaButton>
    <span class="kima-copy-button__status" role="status" aria-live="polite">{{ status }}</span>
  </span>
</template>
<style scoped lang="scss">
.kima-copy-button { display: inline-flex; align-items: center; gap: var(--kima-space-2); font-family: var(--kima-font-family); }
.kima-copy-button__visual { display: grid; > span { grid-area: 1 / 1; } }
.kima-copy-button__status { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
</style>
