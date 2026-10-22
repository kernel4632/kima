<!-- 复选组：多个原生 checkbox，同名多值提交；required 表示至少选择一项，而非强制全选。
调用示例：
  <kima-checkbox-group label="兴趣" name="interests" :options="options" required />
-->
<script setup>
import { computed, ref } from "vue";
import { useInputAttrs, useInputState } from "../utils/input-state.js";
import { useRipple } from "../utils/ripple.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
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
const { local, update } = useInputState(props, emit, root, (v) => Array.isArray(v) ? v : []);
const items = computed(() => props.options.map((o) => typeof o === "object" ? o : { value: o, label: String(o) }));
const firstEnabled = computed(() => items.value.findIndex((o) => !o.disabled));
const hasSelection = computed(() => items.value.some((o) => !o.disabled && local.value.includes(o.value)));
useRipple(root);
function toggle(value, checked) { update(checked ? [...local.value, value] : local.value.filter((v) => v !== value)); }
</script>
<template>
  <fieldset ref="root" v-bind="controlAttrs" :class="['kima-checkbox-group', attrs.class]" :style="attrs.style" :aria-label="controlAttrs['aria-label'] || label" :aria-orientation="orientation" :disabled="disabled" :aria-disabled="disabled || undefined">
    <label v-for="(item, index) in items" :key="item.value" class="kima-checkbox-group__item" :aria-disabled="disabled || item.disabled || undefined" :class="{ 'kima-checkbox-group__item--disabled': disabled || item.disabled }">
      <input type="checkbox" :name="name" :value="item.value" :checked="local.includes(item.value)" :disabled="disabled || item.disabled" :required="required && !hasSelection && index === firstEnabled" @input.stop @change.stop="toggle(item.value, $event.target.checked)" />
      <span>{{ item.label }}</span>
    </label>
  </fieldset>
</template>
<style scoped lang="scss">
@use "../styles/input" as *;
@use "../styles/mixins" as *;
.kima-checkbox-group {
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
    @include kima-ripple-host;
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
  input { width: 24px; height: 24px; margin: 0; accent-color: var(--kima-color-primary); cursor: inherit; }
}
</style>
