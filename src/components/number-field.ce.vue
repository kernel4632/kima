<!-- 数值输入：原生 spinbutton 与增减按钮，空值为 null，保留浏览器 min/max/step 校验。
调用示例：
  <kima-number-field label="数量" name="quantity" :min="0" :max="10" :step="0.5" />
-->
<script setup>
import { ref } from "vue";
import KimaButton from "./button.ce.vue";
import { useInputAttrs, useInputState } from "../utils/input-state.js";
import { useRipple } from "../utils/ripple.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({
  modelValue: { type: Number, default: null },
  label: String,
  name: String,
  disabled: Boolean,
  readonly: Boolean,
  required: Boolean,
  min: Number,
  max: Number,
  step: { type: [Number, String], default: 1 },
  placeholder: String,
});
const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null);
const input = ref(null);
const { attrs, controlAttrs } = useInputAttrs();
const { local, update } = useInputState(props, emit, root, (v) => Number.isFinite(v) ? v : null, (v) => { if (input.value) input.value.value = v ?? ""; });
useRipple(root);
function onInput(event) { update(Number.isFinite(event.target.valueAsNumber) ? event.target.valueAsNumber : null, false); }
function stepBy(direction) {
  if (props.disabled || props.readonly) return;
  // 原生 stepUp/stepDown 同时处理步长基点、小数精度与上下限。
  if (props.step === "any") {
    const value = Math.min(props.max ?? Infinity, Math.max(props.min ?? -Infinity, (local.value ?? 0) + direction));
    input.value.value = value;
  } else if (direction > 0) input.value.stepUp();
  else input.value.stepDown();
  update(input.value.valueAsNumber);
  input.value.focus();
}
defineExpose({ focus: () => input.value?.focus() });
</script>
<template>
  <div ref="root" :class="['kima-number-field', attrs.class]" :style="attrs.style" :aria-disabled="disabled || undefined">
    <KimaButton variant="text" :disabled="disabled || readonly || (min != null && local != null && local <= min)" aria-label="减少" @click="stepBy(-1)">−</KimaButton>
    <input ref="input" v-bind="controlAttrs" type="number" :aria-label="controlAttrs['aria-label'] || label" :name="name" :value="local ?? ''" :min="min" :max="max" :step="step" :required="required" :disabled="disabled" :readonly="readonly" :placeholder="placeholder" @input.stop="onInput" @change.stop="emit('change', local)" />
    <KimaButton variant="text" :disabled="disabled || readonly || (max != null && local != null && local >= max)" aria-label="增加" @click="stepBy(1)">+</KimaButton>
  </div>
</template>
<style scoped lang="scss">
@use "../styles/input" as *;
@use "../styles/mixins" as *;
.kima-number-field {
  @include input-root;
  @include input-surface;
  @include kima-motion-colors;
  display: flex;
  align-items: center;
  gap: var(--kima-space-1);
  padding: 0 var(--kima-space-1);
  input { @include input-control; flex: 1; width: 100%; text-align: center; appearance: textfield; }
  input::-webkit-inner-spin-button { appearance: none; }
}
</style>
