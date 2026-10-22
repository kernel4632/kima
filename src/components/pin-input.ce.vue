<!-- 验证码输入：单个原生文本框承载选区、粘贴、自动填充与表单，等宽字符分格显示。
调用示例：
  <kima-pin-input label="验证码" name="otp" :length="6" required />
-->
<script setup>
import { computed, ref, watch } from "vue";
import { useInputAttrs, useInputState } from "../utils/input-state.js";
import { useRipple } from "../utils/ripple.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({
  modelValue: { type: String, default: "" },
  label: { type: String, default: "验证码" },
  name: String,
  length: { type: Number, default: 6 },
  type: { type: String, default: "numeric" },
  masked: Boolean,
  disabled: Boolean,
  readonly: Boolean,
  required: Boolean,
});
const emit = defineEmits(["update:modelValue", "change", "complete"]);
const root = ref(null);
const input = ref(null);
let composing = false;
const size = computed(() => Math.max(1, Math.min(12, Math.floor(props.length) || 6)));
function clean(value) {
  const text = String(value ?? "");
  return (props.type === "numeric" ? text.replace(/[^0-9]/g, "") : text.replace(/[^a-z0-9]/gi, "").toUpperCase()).slice(0, size.value);
}
const { attrs, controlAttrs } = useInputAttrs();
const { local, update } = useInputState(props, emit, root, clean, (v) => { composing = false; if (input.value) input.value.value = v; });
useRipple(root);
watch([size, () => props.type], () => { local.value = clean(local.value); });
function onInput(event) {
  if (composing || event.isComposing) return;
  const value = clean(event.target.value);
  const old = local.value;
  if (value !== old) update(value, false);
  event.target.value = value;
  if (value.length === size.value && value !== old) emit("complete", value);
}
function onPaste(event) {
  if (props.disabled || props.readonly || composing) return;
  event.preventDefault();
  const element = input.value;
  const pasted = clean(event.clipboardData.getData("text"));
  const start = element.selectionStart ?? local.value.length;
  const end = element.selectionEnd ?? start;
  const value = clean(local.value.slice(0, start) + pasted + local.value.slice(end));
  const old = local.value;
  update(value, false);
  element.value = value;
  element.setSelectionRange(Math.min(value.length, start + pasted.length), Math.min(value.length, start + pasted.length));
  if (value.length === size.value && value !== old) emit("complete", value);
}
defineExpose({ focus: () => input.value?.focus() });
</script>
<template>
  <div ref="root" :class="['kima-pin-input', attrs.class]" :style="[attrs.style, { '--kima-pin-length': size }]" :aria-disabled="disabled || undefined">
    <span class="kima-pin-input__cells" aria-hidden="true"><span v-for="index in size" :key="index" class="kima-pin-input__cell" /></span>
    <input ref="input" v-bind="controlAttrs" :type="masked ? 'password' : 'text'" :value="local" :aria-label="controlAttrs['aria-label'] || label" :name="name" :disabled="disabled" :readonly="readonly" :required="required" :minlength="size" :maxlength="size" :pattern="type === 'numeric' ? `[0-9]{${size}}` : `[A-Za-z0-9]{${size}}`" :inputmode="type === 'numeric' ? 'numeric' : 'text'" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" @input.stop="onInput" @paste="onPaste" @change.stop="emit('change', local)" @compositionstart="composing = true" @compositionend="composing = false; onInput($event)" />
  </div>
</template>
<style scoped lang="scss">
@use "../styles/input" as *;
@use "../styles/mixins" as *;
.kima-pin-input {
  @include input-root;
  @include input-surface;
  @include kima-motion-colors;
  display: inline-grid;
  font-size: var(--kima-font-size-title-large);
  width: calc(var(--kima-pin-length) * 2.5ch);
  max-width: 100%;
  background: var(--kima-color-transparent);
  &__cells { display: grid; grid-template-columns: repeat(var(--kima-pin-length), 1fr); gap: var(--kima-space-1); grid-area: 1 / 1; pointer-events: none; }
  &__cell { @include kima-motion-colors; background: var(--kima-color-layer-2); border-radius: var(--kima-radius-s); }
  input { @include input-control; grid-area: 1 / 1; width: 100%; font-size: inherit; letter-spacing: 1.5ch; padding-inline: 0.75ch 0; }
}
</style>
