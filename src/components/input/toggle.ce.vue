<!-- 按压切换按钮：aria-pressed 语义，适合工具栏格式开关；不是 switch 的状态轨道。
调用示例：
  <kima-toggle v-model="bold" label="粗体" name="bold">粗体</kima-toggle>
-->
<script setup>
import { ref } from "vue";
import { useInputAttrs, useInputState } from "../../utils/input-state.js";
import { useNativeSlots } from "../../utils/native-slots.js";
import { useRipple } from "../../utils/ripple.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  label: String,
  name: String,
  value: { type: String, default: "on" },
  disabled: Boolean,
});
const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null);
const { attrs, controlAttrs } = useInputAttrs();
useNativeSlots(root);
const { local, update } = useInputState(props, emit, root, Boolean);
useRipple(root);
</script>
<template>
  <span :class="['kima-toggle-wrap', attrs.class]" :style="attrs.style">
    <button ref="root" v-bind="controlAttrs" class="kima-toggle" type="button" :aria-label="controlAttrs['aria-label'] || label" :aria-pressed="local" :disabled="disabled" @click="update(!local)"><slot>{{ label }}</slot></button>
    <input v-if="local && name" type="hidden" :name="name" :value="value" :disabled="disabled" />
  </span>
</template>
<style scoped lang="scss">
@use "../../styles/input" as *;
@use "../../styles/mixins" as *;
.kima-toggle {
  @include input-root;
  @include kima-layer(2);
  @include kima-state-layer;
  @include kima-motion-colors;
  @include kima-focus-ring;
  @include kima-ripple-host;
  @include kima-press;
  @include kima-disabled;
  min-height: var(--kima-field-height);
  padding: var(--kima-space-3) var(--kima-space-5);
  border-radius: var(--kima-radius-full);
  cursor: pointer;
  &[aria-pressed="true"] { background: var(--kima-color-primary-container); color: var(--kima-color-on-primary-container); }
  &[aria-pressed="true"]:hover:not(:disabled) { background: var(--kima-color-primary-container-hover); }
}
</style>
