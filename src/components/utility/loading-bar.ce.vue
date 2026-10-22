<!-- start 返回幂等释放函数；finish 每次结束一个任务，error 清空全部；重入撤销旧退场。 -->
<script setup>
import { onBeforeUnmount, ref } from 'vue';
import { presenceTransition } from '../../utils/motion.js';
import { useInteractionRoot } from '../../utils/interaction.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ label: { type: String, default: '加载进度' }, finishDelay: { type: Number, default: 250 } });
const emit = defineEmits(['start', 'finish', 'error', 'change']);
const { root, forwardedAttrs } = useInteractionRoot();
const count = ref(0), progress = ref(0), visible = ref(false), failed = ref(false);
let interval, timer, generation = 0;
function clear() { clearInterval(interval); clearTimeout(timer); }
function start() {
  clearTimeout(timer); failed.value = false;
  if (!count.value) { generation++; progress.value = 8; clearInterval(interval); interval = setInterval(() => { progress.value += (90 - progress.value) * 0.08; }, 200); }
  count.value++; visible.value = true; emit('start', count.value); emit('change', count.value);
  const epoch = generation; let released = false;
  return () => { if (!released && epoch === generation) { released = true; finish(); } };
}
function complete(error) {
  clear(); progress.value = 100; failed.value = error; const epoch = ++generation;
  timer = setTimeout(() => { if (epoch === generation && !count.value) visible.value = false; }, Math.max(0, props.finishDelay));
}
function finish() { if (!count.value) return; count.value--; emit('change', count.value); if (!count.value) { complete(false); emit('finish'); } }
function error(message = '加载失败') { count.value = 0; complete(true); emit('change', 0); emit('error', message); }
onBeforeUnmount(() => { generation++; clear(); });
defineExpose({ start, finish, error, count });
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-loading-bar" :aria-busy="count > 0"><span class="kima-loading-bar__status" role="status">{{ failed ? '加载失败' : count ? `${label}：${count} 项` : '' }}</span><Transition name="kima-fade" v-bind="presenceTransition"><div v-if="visible" class="kima-loading-bar__track" role="progressbar" :aria-label="label" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="count ? undefined : 100"><div class="kima-loading-bar__fill" :class="{ 'kima-loading-bar__fill--error': failed }" :style="{ width: `${progress}%` }"/></div></Transition></div></template>
<style scoped lang="scss">
@use '../../styles/interaction' as *;
.kima-loading-bar { width: 100%; &__track { height: 5px; overflow: hidden; border-radius: var(--kima-radius-full); background: var(--kima-color-layer-2); } &__fill { height: 100%; background: var(--kima-color-primary); transition: width var(--kima-duration-medium) var(--kima-curve-standard), background-color var(--kima-duration-effects); &--error { background: var(--kima-color-error); } } &__status { @include interaction-native; } }
@media (prefers-reduced-motion: reduce) { .kima-loading-bar__fill { transition: none; } }
</style>
