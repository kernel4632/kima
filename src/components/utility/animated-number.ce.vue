<!-- rAF 数值补间：变化从当前帧开始；读屏始终获得准确目标值。 -->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { prefersReducedMotion } from '../../utils/motion.js';
import { useInteractionRoot } from '../../utils/interaction.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ value: { type: Number, default: 0 }, duration: { type: Number, default: 600 }, precision: { type: Number, default: 0 }, locale: { type: String, default: 'zh-CN' } });
const emit = defineEmits(['finish']);
const { root, forwardedAttrs } = useInteractionRoot();
const finite = value => Number.isFinite(value) ? value : 0;
const current = ref(finite(props.value));
let frame = 0, mounted = false, media;
const format = value => new Intl.NumberFormat(props.locale, { minimumFractionDigits: Math.max(0, Math.min(20, props.precision)), maximumFractionDigits: Math.max(0, Math.min(20, props.precision)) }).format(value);
const display = computed(() => format(current.value));
function animate() {
  cancelAnimationFrame(frame);
  const to = finite(props.value), from = current.value;
  if (!mounted || prefersReducedMotion(root.value) || props.duration <= 0) { current.value = to; emit('finish', to); return; }
  const start = performance.now();
  function tick(now) {
    const progress = Math.min(1, (now - start) / props.duration);
    current.value = progress === 1 ? to : from + (to - from) * (1 - (1 - progress) ** 3);
    if (progress < 1) frame = requestAnimationFrame(tick);
    else { frame = 0; emit('finish', to); }
  }
  frame = requestAnimationFrame(tick);
}
watch(() => props.value, () => { if (mounted) animate(); else current.value = finite(props.value); });
function reduced(event) { if (event.matches) { cancelAnimationFrame(frame); current.value = finite(props.value); } }
onMounted(() => { mounted = true; media = matchMedia('(prefers-reduced-motion: reduce)'); media.addEventListener('change', reduced); });
onBeforeUnmount(() => { mounted = false; cancelAnimationFrame(frame); media?.removeEventListener('change', reduced); });
</script>
<template><span ref="root" v-bind="forwardedAttrs" class="kima-animated-number" :aria-label="format(finite(value))"><span aria-hidden="true">{{ display }}</span></span></template>
<style scoped lang="scss">.kima-animated-number { font-family: var(--kima-font-family); font-variant-numeric: tabular-nums; color: var(--kima-color-on-surface); }</style>
