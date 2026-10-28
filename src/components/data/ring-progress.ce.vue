<!-- 环形进度：SVG 只表达进度数据，不使用硬编码颜色；不确定状态在减少动效时退化为静态语义环。 -->
<script setup>
import { computed, getCurrentInstance, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  size: { type: [Number, String], default: 96 },
  strokeWidth: { type: [Number, String], default: 6 },
  indeterminate: Boolean,
  label: { type: String, default: "进度" },
  showValue: Boolean,
});
const attrs = useAttrs();
const isCustomElement = Boolean(getCurrentInstance()?.ce);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const safeMax = computed(() => Number.isFinite(props.max) && props.max > 0 ? props.max : 100);
const safeValue = computed(() => Number.isFinite(props.value) ? Math.max(0, Math.min(safeMax.value, props.value)) : 0);
const percent = computed(() => safeValue.value / safeMax.value);
const dimension = computed(() => Math.max(32, Number(props.size) || 96));
// 画布使用实际size：尺寸、线宽、半径和周长始终处于同一坐标系。
// 线宽是几何输入，必须与半径共用同一个数，不能只在CSS里改描边。
const width = computed(() => Math.min(dimension.value - 2, Math.max(2, Number(props.strokeWidth) || 6)));
const radius = computed(() => (dimension.value - width.value) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const dashOffset = computed(() => circumference.value * (1 - percent.value));
</script>
<template>
  <div v-bind="forwardedAttrs" class="kima-ring-progress" :style="{ width: `${dimension}px`, height: `${dimension}px` }" role="progressbar" :aria-label="attrs['aria-label'] || label" :aria-valuemin="indeterminate ? undefined : 0" :aria-valuemax="indeterminate ? undefined : safeMax" :aria-valuenow="indeterminate ? undefined : safeValue" :aria-busy="indeterminate || undefined">
    <svg class="kima-ring-progress__svg" :viewBox="`0 0 ${dimension} ${dimension}`" aria-hidden="true">
      <circle class="kima-ring-progress__track" :cx="dimension / 2" :cy="dimension / 2" :r="radius" :stroke-width="width" />
      <circle class="kima-ring-progress__value" :class="{ 'kima-ring-progress__value--indeterminate': indeterminate }" :cx="dimension / 2" :cy="dimension / 2" :r="radius" :stroke-width="width" :stroke-dasharray="circumference" :stroke-dashoffset="indeterminate ? circumference * .7 : dashOffset" />
    </svg>
    <span v-if="showValue && !indeterminate" class="kima-ring-progress__label">{{ Math.round(percent * 100) }}%</span>
    <span v-else-if="indeterminate" class="kima-ring-progress__label" role="status">加载中</span>
  </div>
</template>
<style scoped lang="scss">
.kima-ring-progress { position: relative; display: inline-grid; place-items: center; color: var(--kima-color-primary); font-family: var(--kima-font-family); }
.kima-ring-progress__svg { width: 100%; height: 100%; overflow: visible; transform: rotate(-90deg); }
.kima-ring-progress__track, .kima-ring-progress__value { fill: none; stroke-linecap: round; }
.kima-ring-progress__track { stroke: var(--kima-color-layer-3); }
.kima-ring-progress__value { stroke: currentColor; transition: stroke-dashoffset var(--kima-duration-medium) var(--kima-curve-standard); }
.kima-ring-progress__value--indeterminate { animation: kima-ring-progress-spin 1.3s linear infinite; }
.kima-ring-progress__label { position: absolute; color: var(--kima-color-on-surface); font-size: var(--kima-font-size-label-medium); }
@keyframes kima-ring-progress-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .kima-ring-progress__value { transition: none; } .kima-ring-progress__value--indeterminate { animation: none; stroke-dashoffset: 0; } }
</style>
