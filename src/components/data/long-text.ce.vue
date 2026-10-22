<!-- 长文本：按真实布局折叠行数；ResizeObserver 重新判断是否溢出，完整文本始终存在于可访问展开内容。 -->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useHost, getCurrentInstance, watch } from "vue";
import KimaButton from "../core/button.ce.vue";
import { useContentMotion } from "../../utils/content-motion.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  text: { type: String, default: "" },
  lines: { type: Number, default: 3 },
  expanded: Boolean,
  expandLabel: { type: String, default: "展开全文" },
  collapseLabel: { type: String, default: "收起全文" },
});
const emit = defineEmits(["update:expanded", "expand", "collapse"]);
const attrs = useAttrs();
const host = getCurrentInstance()?.ce ? useHost() : null;
const root = ref(null);
const content = ref(null);
const localExpanded = ref(props.expanded);
useContentMotion(content, () => localExpanded.value);
watch(() => props.expanded, value => { localExpanded.value = value; });
const overflowing = ref(false);
let observer;
const safeLines = computed(() => Math.max(1, Math.floor(Number(props.lines) || 1)));
const forwardedAttrs = computed(() => host ? { ...attrs, id: undefined } : attrs);
function measure() {
  if (!content.value) return;
  const style = getComputedStyle(content.value);
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.5;
  overflowing.value = content.value.scrollHeight > lineHeight * safeLines.value + 1;
}
function toggle() {
  localExpanded.value = !localExpanded.value;
  emit("update:expanded", localExpanded.value);
  emit(localExpanded.value ? "expand" : "collapse");
  nextTick(measure);
}
watch([() => props.text, () => props.lines], () => nextTick(measure));
onMounted(() => { measure(); if (typeof ResizeObserver !== "undefined") { observer = new ResizeObserver(measure); observer.observe(content.value); } });
onBeforeUnmount(() => observer?.disconnect());
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-long-text">
    <p ref="content" class="kima-long-text__content" :class="{ 'kima-long-text__content--clamped': !localExpanded }" :style="{ '--kima-long-text-lines': safeLines }">{{ text || (host ? host.textContent : "") }}</p>
    <KimaButton v-if="overflowing || localExpanded" variant="text" :aria-expanded="localExpanded" @click="toggle">{{ localExpanded ? collapseLabel : expandLabel }}</KimaButton>
  </div>
</template>
<style scoped lang="scss">
.kima-long-text { min-width: 0; color: var(--kima-color-on-surface); font-family: var(--kima-font-family); }
.kima-long-text__content { margin: 0; overflow-wrap: anywhere; line-height: var(--kima-line-height-normal); }
.kima-long-text__content--clamped { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: var(--kima-long-text-lines); overflow: hidden; }
</style>
