<!-- CSS sticky 服从最近滚动祖先及父容器边界；观察尺寸/滚动只通知状态，不用 fixed 逃逸。 -->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useInteractionRoot } from '../../utils/interaction.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ placement: { type: String, default: 'top' }, offset: { type: Number, default: 0 }, disabled: Boolean });
const emit = defineEmits(['change']);
const { root, forwardedAttrs } = useInteractionRoot();
const affixed = ref(false);
const style = computed(() => ({ position: props.disabled ? 'relative' : 'sticky', top: props.placement === 'bottom' ? 'auto' : `${props.offset}px`, bottom: props.placement === 'bottom' ? `${props.offset}px` : 'auto' }));
let observer, doc;
function measure() {
  if (!root.value) return;
  let parent = root.value.parentElement, viewport = { top: 0, bottom: innerHeight };
  while (parent) { if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(parent).overflowY)) { const rect = parent.getBoundingClientRect(); viewport = { top: rect.top + parent.clientTop, bottom: rect.top + parent.clientTop + parent.clientHeight }; break; } parent = parent.parentElement; }
  const rect = root.value.getBoundingClientRect();
  const next = !props.disabled && Math.abs(props.placement === 'bottom' ? rect.bottom - viewport.bottom + props.offset : rect.top - viewport.top - props.offset) < 1;
  if (next !== affixed.value) { affixed.value = next; emit('change', next); }
}
onMounted(() => { doc = root.value.ownerDocument; doc.addEventListener('scroll', measure, true); window.addEventListener('resize', measure); observer = new ResizeObserver(measure); observer.observe(root.value); if (root.value.parentElement) observer.observe(root.value.parentElement); measure(); });
watch(() => [props.offset, props.placement, props.disabled], measure, { flush: 'post' });
onBeforeUnmount(() => { observer?.disconnect(); doc?.removeEventListener('scroll', measure, true); if (doc) window.removeEventListener('resize', measure); });
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-affix" :style="style" :data-affixed="affixed"><slot/></div></template>
<style scoped lang="scss">
// CE 宿主不建立额外包含块；选择器只匹配宿主，避免内联 style 透传给内部 sticky。
:global(kima-affix) { display: contents; }
.kima-affix { z-index: 10; align-self: flex-start; color: var(--kima-color-on-surface); font-family: var(--kima-font-family); }
</style>
