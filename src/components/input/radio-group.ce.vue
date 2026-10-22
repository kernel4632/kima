<!-- 单选组：原生 radio 提交与校验，方向键循环选择并跳过禁用项。
调用示例：
  <kima-radio-group label="配送方式" name="delivery" :options="options" required />
-->
<script setup>
import { computed, ref } from "vue";
import { useInputAttrs, useInputState } from "../../utils/input-state.js";
import { useRipple } from "../../utils/ripple.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  options: { type: Array, default: () => [] },
  label: String,
  name: String,
  disabled: Boolean,
  required: Boolean,
  orientation: { type: String, default: "vertical" },
});
const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null);
const { attrs, controlAttrs } = useInputAttrs();
const items = computed(() => props.options.map((o) => typeof o === "object" ? o : { value: o, label: String(o) }));
const { local, update } = useInputState(props, emit, root);
useRipple(root);
const activeIndex = computed(() => {
  const index = items.value.findIndex((o) => o.value === local.value && !o.disabled);
  return index < 0 ? items.value.findIndex((o) => !o.disabled) : index;
});
function onKey(event) {
  if (props.disabled || !["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const enabled = [...root.value.querySelectorAll('input[type="radio"]:not(:disabled)')];
  if (!enabled.length) return;
  const rtl = getComputedStyle(root.value).direction === "rtl";
  const backwards = event.key === "ArrowUp" || event.key === (rtl ? "ArrowRight" : "ArrowLeft");
  const current = enabled.indexOf(event.target);
  const index = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : (current + (backwards ? -1 : 1) + enabled.length) % enabled.length;
  enabled[index].focus();
  enabled[index].click();
}
</script>
<template>
  <fieldset ref="root" v-bind="controlAttrs" :class="['kima-radio-group', attrs.class]" :style="attrs.style" role="radiogroup" :aria-label="controlAttrs['aria-label'] || label" :aria-required="required || undefined" :aria-orientation="orientation" :disabled="disabled" :aria-disabled="disabled || undefined" @keydown="onKey">
    <label v-for="(item, index) in items" :key="item.value" class="kima-radio-group__item" :class="{ 'kima-radio-group__item--disabled': item.disabled }">
      <input type="radio" :name="name" :value="item.value" :checked="local === item.value" :disabled="disabled || item.disabled" :required="required" :tabindex="index === activeIndex ? 0 : -1" @input.stop @change.stop="update(item.value)" />
      <span>{{ item.label }}</span>
    </label>
  </fieldset>
</template>
<style scoped lang="scss">
@use "../../styles/input" as *;
@use "../../styles/mixins" as *;
.kima-radio-group {
  @include input-root;
  @include kima-ripple-host;
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--kima-space-2);
  &[aria-orientation="horizontal"] { flex-direction: row; flex-wrap: wrap; }
  &__item {
    @include kima-state-layer;
    @include kima-motion-colors;
    display: inline-flex;
    align-items: center;
    gap: var(--kima-space-3);
    min-height: var(--kima-field-height);
    padding: 0 var(--kima-space-3);
    border-radius: var(--kima-radius-m);
    cursor: pointer;
    &:has(input:checked) { background: var(--kima-color-primary-container); color: var(--kima-color-on-primary-container); }
    &:has(input:focus-visible) { outline: var(--kima-focus-ring-width) solid var(--kima-color-primary); outline-offset: calc(-1 * var(--kima-focus-ring-width)); }
    &--disabled { opacity: var(--kima-opacity-disabled); cursor: not-allowed; }
  }
  input { appearance: none; width: 24px; height: 24px; flex-shrink: 0; margin: 0; border: 2px solid var(--kima-color-outline); border-radius: var(--kima-radius-full); outline: 0; cursor: inherit; }
  input { @include kima-motion-colors; transition-property: border-width, border-color, background-color; }
  input:checked { border: 7px solid var(--kima-color-primary); background: var(--kima-color-on-primary); }
}
</style>
