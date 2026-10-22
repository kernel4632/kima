<!-- 区域加载遮罩：保留原内容/表单节点，loading 时区域 aria-busy，blocking 时仅隔离本区域内容；结束恢复交互与原焦点。
不修改调用方原有 inert/disabled，隔离使用独立包装；非 blocking 可用于后台刷新。
调用示例：<kima-loading-overlay :loading="saving" label="正在保存"><form>...</form></kima-loading-overlay>
-->
<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import { presenceTransition } from "../../utils/motion.js";
import KimaSpinner from "../display/spinner.ce.vue";
import { useInteractionRoot } from "../../utils/interaction.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ loading: Boolean, blocking: { type: Boolean, default: true }, label: { type: String, default: "正在加载，请稍候" } });
const emit = defineEmits(["after-load"]);
const { root, forwardedAttrs } = useInteractionRoot();
const content = ref(null);
const status = ref(null);
let previousFocus;
function rememberFocus(event) { if (content.value?.contains(event.target)) previousFocus = event.target; }
watch(() => props.loading && props.blocking, async (blocked, wasBlocked) => {
  const doc = root.value?.ownerDocument;
  const active = doc?.activeElement;
  if (blocked) {
    if (active && content.value?.contains(active)) previousFocus = active;
    // light DOM CE 更新会先移动插槽节点；focusin 留下原来的实际控件。
    if (previousFocus && (active === doc.body || content.value?.contains(active))) { await nextTick(); if (props.loading && props.blocking) status.value?.focus({ preventScroll: true }); }
  } else if (wasBlocked) {
    const restore = !active || active === doc.body || active === status.value || active?.classList.contains("kima-loading-overlay__mask");
    await nextTick();
    if (props.loading && props.blocking) return;
    if (previousFocus?.isConnected && restore) previousFocus.focus({ preventScroll: true });
    previousFocus = null;
  }
}, { flush: "pre" });
watch(() => props.loading, (value, previous) => { if (previous && !value) emit("after-load"); });
onBeforeUnmount(() => { previousFocus = null; });
</script>
<template>
  <section ref="root" v-bind="forwardedAttrs" class="kima-loading-overlay" :aria-busy="loading" :aria-label="forwardedAttrs['aria-label'] || label">
    <div ref="content" class="kima-loading-overlay__content" :inert="loading && blocking" @focusin="rememberFocus"><slot /></div>
    <Transition name="kima-fade" v-bind="presenceTransition"><div v-if="loading" ref="status" class="kima-loading-overlay__mask" :class="{ 'kima-loading-overlay__mask--passive': !blocking }" role="status" aria-live="polite" tabindex="-1"><div class="kima-loading-overlay__status"><KimaSpinner decorative /><span>{{ label }}</span><slot name="status" /></div></div></Transition>
  </section>
</template>
<style scoped lang="scss">
@use "../../styles/interaction" as *;
@use "../../styles/mixins" as *;
.kima-loading-overlay { @include interaction-root; position: relative; border-radius: var(--kima-radius-m); min-height: 140px; &__content { min-height: inherit; } &__mask { position: absolute; z-index: 5; inset: 0; display: grid; place-items: center; padding: var(--kima-space-4); border-radius: inherit; background: var(--kima-color-layer-3); backdrop-filter: blur(6px); outline: none; &--passive { pointer-events: none; } } &__status { @include kima-popup; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: var(--kima-space-3); padding: var(--kima-space-4); border-radius: var(--kima-radius-l); } }
</style>
