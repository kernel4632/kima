<script setup>
import { computed, ref, watchEffect } from "vue";
import { normalizeDatetime } from "../utils/local-date.js";
import { useInputState } from "../utils/input-state.js";
import { useRipple } from "../utils/ripple.js";
const props = defineProps({ modelValue: { type: Array, default: () => [null, null] }, name: String, startName: String, endName: String, startLabel: { type: String, default: "开始日期时间" }, endLabel: { type: String, default: "结束日期时间" }, min: String, max: String, step: { type: Number, default: 60 }, required: Boolean, disabled: Boolean });
const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null), start = ref(null), end = ref(null);
const normalize = value => [normalizeDatetime(value?.[0]), normalizeDatetime(value?.[1])];
const { local, update } = useInputState(props, emit, root, normalize);
useRipple(root);
const names = computed(() => [props.startName || (props.name ? `${props.name}[start]` : undefined), props.endName || (props.name ? `${props.name}[end]` : undefined)]);
const error = computed(() => local.value[0] && local.value[1] && local.value[1] < local.value[0] ? "结束日期时间不能早于开始日期时间" : "");
const safeStep = computed(() => Number.isFinite(props.step) && props.step > 0 ? props.step : 60);
watchEffect(() => { start.value?.setCustomValidity(error.value); end.value?.setCustomValidity(error.value); }, { flush: "post" });
function edit(index, value) { const next = [...local.value]; next[index] = normalizeDatetime(value); update(next); }
</script>
<template>
  <div ref="root" class="kima-datetime-range-picker" role="group" aria-label="日期时间范围">
    <input ref="start" class="kima-datetime-range-picker__input" type="datetime-local" :aria-label="startLabel" :name="local[0] ? names[0] : undefined" :value="local[0] || ''" :min="min" :max="max" :step="safeStep" :required="required" :disabled="disabled" @input.stop="edit(0,$event.target.value)" @change.stop>
    <span aria-hidden="true">→</span>
    <input ref="end" class="kima-datetime-range-picker__input" type="datetime-local" :aria-label="endLabel" :name="local[1] ? names[1] : undefined" :value="local[1] || ''" :min="min" :max="max" :step="safeStep" :required="required" :disabled="disabled" @input.stop="edit(1,$event.target.value)" @change.stop>
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>
<style scoped lang="scss">
@use "../styles/advanced-input" as *;
.kima-datetime-range-picker { @include advanced-root; display:flex; flex-wrap:wrap; align-items:center; gap:var(--kima-space-2); &__input { @include advanced-field; flex:1; min-width:220px; } p { flex-basis:100%; margin:0; color:var(--kima-color-error); } }
</style>
