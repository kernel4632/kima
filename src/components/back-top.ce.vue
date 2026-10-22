<!-- 返回顶部：按滚动阈值显隐，可使用键盘，平滑滚动尊重减少动效。
调用示例：
  <kima-back-top target="#reader" :threshold="200" />
-->
<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import KimaButton from "./button.ce.vue";
import { scrollBehavior, scrollTarget, useNavigationRoot } from "../utils/navigation.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ target: { type: [String, Object], default: "" }, threshold: { type: Number, default: 240 }, smooth: { type: Boolean, default: true }, fixed: { type: Boolean, default: true }, disabled: Boolean, label: { type: String, default: "返回顶部" } });
const emit = defineEmits(["click", "visibility-change"]);
const { root, forwardedAttrs } = useNavigationRoot();
const visible = ref(false);
let container;
function track() { const next = Boolean(container && (container === window ? window.scrollY : container.scrollTop) >= Math.max(0, props.threshold)); if (next !== visible.value) { visible.value = next; emit("visibility-change", next); } }
function connect() { container?.removeEventListener("scroll", track); container = scrollTarget(props.target); container?.addEventListener("scroll", track, { passive: true }); track(); }
function back(event) { if (props.disabled) return; container?.scrollTo({ top: 0, behavior: scrollBehavior(props.smooth) }); emit("click", event); }
onMounted(connect);
watch(() => props.target, connect, { flush: "post" });
watch(() => props.threshold, track);
onBeforeUnmount(() => container?.removeEventListener("scroll", track));
</script>
<template><Transition name="kima-content"><div v-show="visible" ref="root" v-bind="forwardedAttrs" class="kima-back-top" :class="{ 'kima-back-top--fixed': fixed }" :inert="!visible" :aria-hidden="!visible"><KimaButton :disabled="disabled" @click="back"><slot>{{ label }}</slot></KimaButton></div></Transition></template>
<style scoped lang="scss">
@use "../styles/navigation" as *;
.kima-back-top { @include navigation-root; &--fixed { position: fixed; inset-inline-end: var(--kima-space-6); bottom: var(--kima-space-6); z-index: var(--kima-z-popover, 50); } }
</style>
