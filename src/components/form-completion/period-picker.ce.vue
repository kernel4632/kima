<script setup>
import { computed, ref, watch, watchEffect } from "vue";
import { useInputState } from "../../utils/input-state.js";
import { useRipple } from "../../utils/ripple.js";
const props = defineProps({ modelValue: { type: [String, Array], default: null }, mode: { type: String, default: "month" }, range: Boolean, name: String, startName: String, endName: String, label: { type: String, default: "期间" }, required: Boolean, disabled: Boolean, min: String, max: String });
const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null), rangeInputs = ref([]);
const pattern = computed(() => props.mode === "year" ? /^\d{4}$/ : /^\d{4}-(0[1-9]|1[0-2])$/);
function normalize(v) { if (props.range) return [valid(v?.[0]) ? v[0] : null, valid(v?.[1]) ? v[1] : null]; return valid(v) ? v : null; }
function valid(v) { return typeof v === "string" && pattern.value.test(v) ? v : null; }
const { local, update } = useInputState(props, emit, root, normalize);
useRipple(root);
watch(() => [props.mode, props.range], () => update(props.range ? [null, null] : null, false));
const type = computed(() => props.mode === "year" ? "number" : "month");
const names = computed(() => [props.startName || (props.name ? `${props.name}[start]` : undefined), props.endName || (props.name ? `${props.name}[end]` : undefined)]);
const error = computed(() => props.range && local.value[0] && local.value[1] && local.value[0] > local.value[1] ? "结束期间不能早于开始期间" : "");
watchEffect(() => { for (const input of rangeInputs.value) input?.setCustomValidity(error.value); }, { flush: "post" });
function edit(index, value) { if (!props.range) update(valid(value)); else { const next = [...local.value]; next[index] = valid(value); update(next); } }
const minYear = computed(() => props.mode === "year" ? Number(String(props.min || "0001").slice(0, 4)) : undefined);
const maxYear = computed(() => props.mode === "year" ? Number(String(props.max || "9999").slice(0, 4)) : undefined);
</script>
<template>
  <div ref="root" class="kima-period-picker" role="group" :aria-label="label">
    <template v-if="range"><input :ref="el => rangeInputs[0] = el" class="kima-period-picker__input" :type="type" :aria-label="`${label}开始`" :name="local[0] ? names[0] : undefined" :value="local[0] || ''" :min="min" :max="local[1] || max" :minlength="mode==='year'?4:undefined" :maxlength="mode==='year'?4:undefined" :required="required" :disabled="disabled" @input.stop="edit(0,$event.target.value)" @change.stop><span aria-hidden="true">→</span><input :ref="el => rangeInputs[1] = el" class="kima-period-picker__input" :type="type" :aria-label="`${label}结束`" :name="local[1] ? names[1] : undefined" :value="local[1] || ''" :min="local[0] || min" :max="max" :minlength="mode==='year'?4:undefined" :maxlength="mode==='year'?4:undefined" :required="required" :disabled="disabled" @input.stop="edit(1,$event.target.value)" @change.stop></template>
    <input v-else class="kima-period-picker__input" :type="type" :aria-label="label" :name="local ? name : undefined" :value="local || ''" :min="min" :max="max" :minlength="mode==='year'?4:undefined" :maxlength="mode==='year'?4:undefined" :required="required" :disabled="disabled" @input.stop="edit(0,$event.target.value)" @change.stop>
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/mixins" as *;
.kima-period-picker { box-sizing: border-box;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-body-large);
  font-weight: var(--kima-font-weight-semi-bold);
  &[aria-disabled="true"] { opacity: var(--kima-opacity-disabled); }
  min-width: 0; display:flex; flex-wrap:wrap; align-items:center; gap:var(--kima-space-2); &__input { @include kima-layer(2);
  @include kima-state-layer;
  @include kima-ripple-host;
  border-radius: var(--kima-radius-m);
  transition: background-color var(--kima-duration-effects) var(--kima-curve-standard), box-shadow var(--kima-duration-effects) var(--kima-curve-standard);
  &:focus-within {
    background: var(--kima-color-layer-3);
    box-shadow: inset 0 0 0 var(--kima-outline-width-focused) var(--kima-color-primary);
  }
  box-sizing: border-box;
  min-width: 0;
  min-height: var(--kima-field-height);
  padding: var(--kima-space-3) var(--kima-field-padding);
  border: 0;
  outline: 0;
  color: inherit;
  font: inherit;
  &::placeholder { color: var(--kima-color-on-surface-variant); }
  &:disabled { cursor: not-allowed; }
  width: 100%; border-radius: var(--kima-radius-m); background: var(--kima-color-layer-2); &:focus-visible { outline: var(--kima-focus-ring-width) solid var(--kima-color-primary); outline-offset: -2px; } flex:1; min-width:160px; } p { flex-basis:100%; margin:0; color:var(--kima-color-error); } }
</style>
