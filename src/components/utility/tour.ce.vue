<!-- 原生模态导览：selector/Element 目标，目标丢失留在当前步并允许跳过；退出恢复启动焦点。 -->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import KimaButton from '../core/button.ce.vue';
import { useInteractionRoot, useInteractionModel } from '../../utils/interaction.js';
import { prefersReducedMotion } from '../../utils/motion.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ open: Boolean, steps: { type: Array, default: () => [] }, modelValue: { type: Number, default: 0 }, label: { type: String, default: '功能导览' } });
const emit = defineEmits(['update:open', 'update:modelValue', 'step', 'target-missing', 'finish', 'close']);
const { root, forwardedAttrs } = useInteractionRoot();
const [visible, setVisible] = useInteractionModel(props, 'open', emit);
const [index, setIndex] = useInteractionModel(props, 'modelValue', emit);
const dialog = ref(null), box = ref(null), missing = ref(false), viewport = ref({ width: 1024, height: 768 });
const step = computed(() => props.steps[index.value] || {});
let previousFocus, observer, frame, mounted = false, lastTarget, lastMissing;
function target() { try { const value = step.value.target; const result = typeof value === 'string' ? root.value.ownerDocument.querySelector(value) : value; return result?.isConnected && result.getClientRects().length ? result : null; } catch { return null; } }
function measure() {
  if (!visible.value || !root.value) return;
  viewport.value = { width: innerWidth, height: innerHeight };
  const element = target();
  missing.value = !element;
  if (!element) { box.value = null; if (lastMissing !== index.value) { lastMissing = index.value; emit('target-missing', index.value, step.value.target); } return; }
  lastMissing = undefined;
  const rect = element.getBoundingClientRect();
  box.value = { left: Math.max(0, rect.left - 6), top: Math.max(0, rect.top - 6), right: Math.min(innerWidth, rect.right + 6), bottom: Math.min(innerHeight, rect.bottom + 6) };
}
function schedule() { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); }
async function locate(scroll = true) {
  if (!mounted || !visible.value) return;
  const element = target();
  if (scroll && element && element !== lastTarget) element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: prefersReducedMotion(root.value) ? 'instant' : 'smooth' });
  lastTarget = element; measure(); emit('step', index.value);
  await nextTick(); dialog.value?.querySelector('[data-tour-primary]')?.focus();
}
function close(reason = 'close') { if (!visible.value) return; setVisible(false); emit('close', reason); }
function next() { if (index.value >= props.steps.length - 1) { emit('finish'); close('finish'); } else setIndex(index.value + 1); }
function prev() { if (index.value > 0) setIndex(index.value - 1); }
function keyboard(event) {
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close('escape'); }
  if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); prev(); }
  if (event.key === 'Tab') { const buttons = [...dialog.value.querySelectorAll('button:not(:disabled)')]; const current = buttons.indexOf(document.activeElement); if (event.shiftKey && current <= 0) { event.preventDefault(); buttons.at(-1)?.focus(); } else if (!event.shiftKey && current === buttons.length - 1) { event.preventDefault(); buttons[0]?.focus(); } }
}
const panelStyle = computed(() => { const width = Math.min(360, viewport.value.width - 32); const left = box.value ? Math.min(Math.max(16, box.value.left), viewport.value.width - width - 16) : (viewport.value.width - width) / 2; const top = box.value ? box.value.bottom + 16 : viewport.value.height / 2 - 100; return { width: `${width}px`, left: `${left}px`, top: `${Math.max(16, Math.min(top, viewport.value.height - 280))}px` }; });
const masks = computed(() => { const b = box.value, v = viewport.value; return b ? [{ left: 0, top: 0, width: v.width, height: b.top }, { left: 0, top: b.bottom, width: v.width, height: Math.max(0, v.height - b.bottom) }, { left: 0, top: b.top, width: b.left, height: Math.max(0, b.bottom - b.top) }, { left: b.right, top: b.top, width: Math.max(0, v.width - b.right), height: Math.max(0, b.bottom - b.top) }] : [{ left: 0, top: 0, width: v.width, height: v.height }]; });
async function sync() {
  if (!mounted) return;
  if (visible.value) { if (!dialog.value.open) { previousFocus = document.activeElement; dialog.value.showModal(); } await locate(); }
  else { if (dialog.value.open) dialog.value.close(); if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); previousFocus = null; lastTarget = null; }
}
watch(visible, sync, { flush: 'post' });
watch([index, () => props.steps], () => locate(), { deep: true, flush: 'post' });
onMounted(() => { mounted = true; document.addEventListener('scroll', schedule, true); window.addEventListener('resize', schedule); observer = new MutationObserver(schedule); observer.observe(document.body, { childList: true, subtree: true }); sync(); });
onBeforeUnmount(() => { mounted = false; observer?.disconnect(); cancelAnimationFrame(frame); document.removeEventListener('scroll', schedule, true); window.removeEventListener('resize', schedule); if (dialog.value?.open) dialog.value.close(); if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true }); });
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-tour"><dialog ref="dialog" class="kima-tour__dialog" :aria-label="label" @keydown="keyboard" @cancel.prevent.stop="close('escape')"><div v-for="(mask, n) in masks" :key="n" class="kima-tour__mask" :style="Object.fromEntries(Object.entries(mask).map(([key, value]) => [key, `${value}px`]))" aria-hidden="true"/><div v-if="box" class="kima-tour__spotlight" :style="{ left: `${box.left}px`, top: `${box.top}px`, width: `${Math.max(0, box.right - box.left)}px`, height: `${Math.max(0, box.bottom - box.top)}px` }" aria-hidden="true"/><section class="kima-tour__panel" :style="panelStyle"><p>{{ index + 1 }} / {{ steps.length }}</p><h2>{{ step.title || label }}</h2><p>{{ step.description }}</p><p v-if="missing" role="status">未找到目标，可继续下一步或退出。</p><div class="kima-tour__actions"><KimaButton variant="text" @click="close('button')">退出</KimaButton><KimaButton v-if="index > 0" variant="tonal" @click="prev">上一步</KimaButton><KimaButton data-tour-primary @click="next">{{ index >= steps.length - 1 ? '完成' : '下一步' }}</KimaButton></div></section></dialog></div></template>
<style scoped lang="scss">
@use '../../styles/mixins' as *;
.kima-tour { font-family: var(--kima-font-family); color: var(--kima-color-on-surface); &__dialog { position: fixed; inset: 0; width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; color: inherit; background: var(--kima-color-transparent); transition: opacity var(--kima-duration-medium), display var(--kima-duration-medium) allow-discrete, overlay var(--kima-duration-medium) allow-discrete; &::backdrop { background: var(--kima-color-transparent); } &:not([open]) { opacity: 0; } @starting-style { &[open] { opacity: 0; } } } &__mask { position: fixed; background: color-mix(in srgb, var(--kima-color-scrim) var(--kima-scrim-opacity), transparent); backdrop-filter: blur(var(--kima-backdrop-blur)); pointer-events: auto; } &__spotlight { position: fixed; outline: 3px solid var(--kima-color-primary); border-radius: var(--kima-radius-s); pointer-events: none; transition: top var(--kima-duration-medium) var(--kima-curve-emphasized), left var(--kima-duration-medium) var(--kima-curve-emphasized), width var(--kima-duration-medium), height var(--kima-duration-medium); } &__panel { @include kima-popup; position: fixed; box-sizing: border-box; max-height: calc(100vh - 32px); overflow: auto; padding: var(--kima-space-5); border-radius: var(--kima-radius-xl); h2 { margin: var(--kima-space-2) 0; } } &__actions { display: flex; flex-wrap: wrap; gap: var(--kima-space-2); } }
@media (prefers-reduced-motion: reduce) { .kima-tour__dialog, .kima-tour__spotlight { transition: none; } }
</style>
