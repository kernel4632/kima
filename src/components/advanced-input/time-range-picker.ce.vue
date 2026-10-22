<!-- HH:mm local civil time. step is minutes. Overnight end<=start is next day; equal endpoints=24h.
Without allowOvernight: same-day only, equal endpoints=0h. min/max bound EACH endpoint, not a wrapping daily window. -->
<script setup>
import { computed, ref, watchEffect } from "vue";
import { useInputState } from "../../utils/input-state.js";
import { timeMinutes } from "../../utils/local-date.js";
import { useRipple } from "../../utils/ripple.js";
const props = defineProps({ modelValue: { type: Array, default: () => [null,null] }, name: String, startName: String, endName: String, startLabel: { type: String, default: "开始时间" }, endLabel: { type: String, default: "结束时间" }, min: String, max: String, step: { type: Number, default: 1 }, required: Boolean, disabled: Boolean, allowOvernight: { type: Boolean, default: true } });
const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null), startInput = ref(null), endInput = ref(null);
const normalize = value => [timeMinutes(value?.[0]) !== null ? value[0] : null, timeMinutes(value?.[1]) !== null ? value[1] : null];
const { local, update } = useInputState(props, emit, root, normalize);
useRipple(root);
const interval = computed(() => {
  const start = timeMinutes(local.value[0]), end = timeMinutes(local.value[1]);
  if (start === null || end === null) return null;
  return end - start + (props.allowOvernight && end <= start ? 1440 : 0);
});
const error = computed(() => interval.value !== null && interval.value < 0 ? "结束时间不能早于开始时间" : "");
const safeStep = computed(() => Math.max(1, Number.isFinite(props.step) ? Math.floor(props.step) : 1) * 60);
watchEffect(() => { endInput.value?.setCustomValidity(error.value); }, { flush: "post" });
function type(index, value) { const next = [...local.value]; next[index] = value || null; update(next); }
defineExpose({ getInterval: () => interval.value });
</script>
<template>
  <div ref="root" class="kima-time-range-picker" role="group" aria-label="时间范围" :aria-disabled="disabled || undefined">
    <input ref="startInput" class="kima-time-range-picker__input" type="time" :value="local[0] || ''" :aria-label="startLabel" :name="local[0] ? startName || (name ? `${name}[start]` : undefined) : undefined" :min="min" :max="max" :step="safeStep" :required="required" :disabled="disabled" @input.stop="type(0,$event.target.value)" @change.stop>
    <span aria-hidden="true">→</span>
    <input ref="endInput" class="kima-time-range-picker__input" type="time" :value="local[1] || ''" :aria-label="endLabel" :name="local[1] ? endName || (name ? `${name}[end]` : undefined) : undefined" :min="min" :max="max" :step="safeStep" :required="required" :disabled="disabled" @input.stop="type(1,$event.target.value)" @change.stop>
    <output v-if="interval !== null" :role="error ? 'alert' : 'status'">{{ error || `${Math.floor(interval / 60)}h ${interval % 60}m${allowOvernight && local[1] <= local[0] ? ' · 次日结束' : ''}` }}</output>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/advanced-input" as *;
.kima-time-range-picker { @include advanced-root; display:flex; flex-wrap:wrap; gap:var(--kima-space-2); align-items:center;
  &__input { @include advanced-field; flex:1; min-width:120px; }
  output { flex-basis:100%; color:var(--kima-color-on-surface-variant); &[role="alert"]{color:var(--kima-color-error);} }
}
</style>
