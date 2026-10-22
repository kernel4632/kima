<!-- Two native range controls. modelValue=[lower,upper]; endpoints collide (never swap).
Two names: startName/endName, or name[start]/name[end]. Range is always populated; required is informational. -->
<script setup>
import { computed, ref, watch } from "vue";
import { useInputState } from "../../utils/input-state.js";
const props = defineProps({ modelValue: { type: Array, default: () => [25,75] }, min: { type: Number, default: 0 }, max: { type: Number, default: 100 }, step: { type: Number, default: 1 }, name: String, startName: String, endName: String, label: { type: String, default: "范围" }, startLabel: { type: String, default: "下限" }, endLabel: { type: String, default: "上限" }, disabled: Boolean, required: Boolean });
const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null);
const minimum = computed(() => Number.isFinite(props.min) ? props.min : 0);
const maximum = computed(() => Math.max(minimum.value, Number.isFinite(props.max) ? props.max : minimum.value + 100));
const stepValue = computed(() => Number.isFinite(props.step) && props.step > 0 ? props.step : 1);
function snap(value, fallback) { const numeric = Number(value); const bounded = Math.max(minimum.value, Math.min(maximum.value, Number.isFinite(numeric) ? numeric : fallback)); const rounded = minimum.value + Math.round((bounded - minimum.value) / stepValue.value) * stepValue.value; const last = minimum.value + Math.floor((maximum.value - minimum.value) / stepValue.value + 1e-9) * stepValue.value; return Number(Math.max(minimum.value, Math.min(last, rounded)).toFixed(10)); }
function normalize(value) { const a = snap(value?.[0], minimum.value), b = snap(value?.[1], maximum.value); return a <= b ? [a,b] : [b,a]; }
const { local, update } = useInputState(props, emit, root, normalize);
watch([minimum, maximum, stepValue], () => { local.value = normalize(local.value); });
function input(index,event) {
  const next = [...local.value], value = snap(event.target.value, minimum.value);
  next[index] = index === 0 ? Math.min(value,next[1]) : Math.max(value,next[0]);
  event.target.value = String(next[index]);
  update(next, false);
}
const fill = computed(() => { const span = maximum.value - minimum.value || 1; return { '--kima-range-start': `${(local.value[0]-minimum.value)/span*100}%`, '--kima-range-end': `${(local.value[1]-minimum.value)/span*100}%` }; });
</script>
<template>
  <div ref="root" class="kima-range-slider" role="group" :aria-label="label" :aria-disabled="disabled || undefined" :style="fill">
    <output class="kima-range-slider__values">{{ local[0] }} – {{ local[1] }}</output>
    <div class="kima-range-slider__tracks">
      <input v-for="(value,index) in local" :key="index" class="kima-range-slider__input" type="range" :value="value" :min="minimum" :max="maximum" :step="stepValue" :disabled="disabled" :name="index===0 ? startName || (name ? `${name}[start]` : undefined) : endName || (name ? `${name}[end]` : undefined)" :aria-label="index===0 ? startLabel : endLabel" :aria-valuemin="index===0 ? minimum : local[0]" :aria-valuemax="index===0 ? local[1] : maximum" :style="{zIndex:index===0 && local[0]===maximum ? 3 : index+1}" @input.stop="input(index,$event)" @change.stop="emit('change',[...local])">
    </div>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/advanced-input" as *;
.kima-range-slider { @include advanced-root; display:grid; gap:var(--kima-space-2); width:100%;
  &__values { text-align:end; color:var(--kima-color-on-surface-variant); font-variant-numeric:tabular-nums; }
  &__tracks { position:relative; height:var(--kima-touch-target); &::before {content:"";position:absolute;inset-block:calc((var(--kima-touch-target) - var(--kima-slider-track-height))/2);inset-inline:0;border-radius:var(--kima-radius-full);background:linear-gradient(to right,var(--kima-color-track) 0 var(--kima-range-start),var(--kima-color-primary) var(--kima-range-start) var(--kima-range-end),var(--kima-color-track) var(--kima-range-end) 100%);} }
  &__input { position:absolute; inset:0; width:100%; height:100%; margin:0; appearance:none; background:var(--kima-color-transparent); pointer-events:none;
    &::-webkit-slider-runnable-track {height:var(--kima-slider-track-height);background:var(--kima-color-transparent);}
    &::-webkit-slider-thumb {appearance:none;width:var(--kima-slider-handle-width);height:var(--kima-slider-handle-height);margin-top:calc((var(--kima-slider-track-height) - var(--kima-slider-handle-height))/2);border:0;border-radius:var(--kima-radius-full);background:var(--kima-color-primary);pointer-events:auto;cursor:ew-resize;}
    &::-moz-range-track {height:var(--kima-slider-track-height);background:var(--kima-color-transparent);}
    &::-moz-range-thumb {width:var(--kima-slider-handle-width);height:var(--kima-slider-handle-height);border:0;border-radius:var(--kima-radius-full);background:var(--kima-color-primary);pointer-events:auto;cursor:ew-resize;}
    &:focus-visible {outline:var(--kima-focus-ring-width) solid var(--kima-color-primary);outline-offset:var(--kima-focus-ring-offset);}
    &:disabled {pointer-events:none;}
  }
  &[aria-disabled="true"] {opacity:var(--kima-opacity-disabled);}
}
</style>
