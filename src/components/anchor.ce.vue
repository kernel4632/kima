<!-- 页内目录：真实锚点、滚动跟踪当前章节，支持独立滚动容器与减少动效。
调用示例：
  <kima-anchor :items="[{ href: '#overview', label: '概览' }]" :offset="24" />
-->
<script setup>
import { onMounted, onBeforeUnmount, watch } from "vue";
import KimaLink from "./link.ce.vue";
import { scrollBehavior, scrollTarget, useNavigationModel, useNavigationRoot } from "../utils/navigation.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: { type: String, default: "" }, items: { type: Array, default: () => [] }, target: { type: [String, Object], default: "" }, offset: { type: Number, default: 24 }, smooth: { type: Boolean, default: true }, disabled: Boolean, label: { type: String, default: "页内目录" } });
const emit = defineEmits(["update:modelValue", "change", "navigate"]);
const { root, forwardedAttrs } = useNavigationRoot();
const [local, update] = useNavigationModel(props, "modelValue", emit);
let container;
let resizeObserver;
let mutationObserver;
let frame;
let mounted = false;
function section(href) { if (!href?.startsWith("#")) return null; try { return document.getElementById(decodeURIComponent(href.slice(1))); } catch { return null; } }
function sections() { return props.items.filter((item) => !item.disabled).map((item) => ({ item, element: section(item.href) })).filter(({ element }) => element && (container === window || container?.contains(element))); }
function track() {
  frame = undefined;
  if (!container) return;
  const entries = sections();
  if (!entries.length) return;
  const top = container === window ? 0 : container.getBoundingClientRect().top + container.clientTop;
  let active = entries[0];
  for (const entry of entries) { if (entry.element.getBoundingClientRect().top <= top + props.offset + 1) active = entry; }
  const scrollTop = container === window ? window.scrollY : container.scrollTop;
  const height = container === window ? window.innerHeight : container.clientHeight;
  const total = container === window ? document.documentElement.scrollHeight : container.scrollHeight;
  if (scrollTop > 0 && scrollTop + height >= total - 2) active = entries.at(-1);
  update(active.item.href);
}
function schedule() { if (!frame) frame = requestAnimationFrame(track); }
function navigate(item, event) {
  if (props.disabled || item.disabled || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
  const element = section(item.href);
  if (!element || !container) return;
  event.preventDefault();
  const top = container === window ? 0 : container.getBoundingClientRect().top + container.clientTop;
  const scrollTop = container === window ? window.scrollY : container.scrollTop;
  container.scrollTo({ top: scrollTop + element.getBoundingClientRect().top - top - props.offset, behavior: scrollBehavior(props.smooth) });
  update(item.href);
  emit("navigate", item.href);
}
function disconnect() { container?.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); resizeObserver?.disconnect(); mutationObserver?.disconnect(); if (frame) cancelAnimationFrame(frame); frame = undefined; }
function connect() {
  disconnect(); container = scrollTarget(props.target);
  container?.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  resizeObserver = new ResizeObserver(schedule);
  for (const { element } of sections()) resizeObserver.observe(element);
  mutationObserver = new MutationObserver(schedule);
  mutationObserver.observe(container === window ? document.body : container || root.value, { childList: true, subtree: true });
  schedule();
}
onMounted(() => { mounted = true; connect(); });
watch(() => [props.target, props.items, props.offset], () => { if (mounted) connect(); }, { deep: true, flush: "post" });
onBeforeUnmount(disconnect);
</script>
<template><nav ref="root" v-bind="forwardedAttrs" class="kima-anchor" :aria-label="label"><ol><li v-for="(item, index) in items" :key="item.href ?? index"><KimaLink :href="item.href" :disabled="disabled || item.disabled" :underline="false" :current="local === item.href ? 'location' : false" @navigate="navigate(item, $event)">{{ item.label }}</KimaLink></li></ol><slot /></nav></template>
<style scoped lang="scss">
@use "../styles/navigation" as *;
.kima-anchor { @include navigation-surface; ol { display: grid; gap: var(--kima-space-2); margin: 0; padding: 0; list-style: none; } :deep(.kima-link) { width: 100%; } }
</style>
