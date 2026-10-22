<!-- 原生选择器：系统弹出菜单与移动端滚轮，区别于自绘 select，支持 multiple 与原生校验。
调用示例：
  <kima-native-select label="地区" name="region" :options="regions" required />
-->
<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { useInputAttrs, useInputState } from "../utils/input-state.js";
import { useRipple } from "../utils/ripple.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({
  modelValue: { type: [String, Number, Array], default: "" },
  options: { type: Array, default: () => [] },
  label: String,
  name: String,
  placeholder: { type: String, default: "请选择" },
  multiple: Boolean,
  size: Number,
  disabled: Boolean,
  required: Boolean,
});
const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null);
const input = ref(null);
const { attrs, controlAttrs } = useInputAttrs();
const items = computed(() => props.options.map((o) => typeof o === "object" ? o : { value: o, label: String(o) }));
const { local, update } = useInputState(props, emit, root, (v) => props.multiple ? Array.isArray(v) ? v : [] : v ?? "", () => nextTick(syncSelection));
useRipple(root);
function syncSelection() {
  if (!input.value) return;
  for (const option of input.value.options) option.selected = props.multiple ? local.value.some((v) => String(v) === option.value) : String(local.value) === option.value;
}
watch([local, items, () => props.multiple], () => nextTick(syncSelection), { immediate: true, deep: true });
function onChange(event) {
  const values = [...event.target.selectedOptions].map((option) => items.value.find((item) => String(item.value) === option.value)?.value ?? option.value);
  update(props.multiple ? values : values[0] ?? "");
}
defineExpose({ focus: () => input.value?.focus() });
</script>
<template>
  <div ref="root" :class="['kima-native-select', attrs.class]" :style="attrs.style" :aria-disabled="disabled || undefined">
    <select ref="input" v-bind="controlAttrs" :aria-label="controlAttrs['aria-label'] || label" :name="name" :disabled="disabled" :required="required" :multiple="multiple" :size="size" @input.stop @change.stop="onChange">
      <option v-if="!multiple && placeholder" value="">{{ placeholder }}</option>
      <option v-for="item in items" :key="item.value" :value="item.value" :disabled="item.disabled">{{ item.label }}</option>
    </select>
  </div>
</template>
<style scoped lang="scss">
@use "../styles/input" as *;
@use "../styles/mixins" as *;
.kima-native-select {
  @include input-root;
  @include input-surface;
  @include kima-motion-colors;
  select { @include input-control; width: 100%; cursor: pointer; }
  option { color: var(--kima-color-on-surface); background: var(--kima-color-popup); }
}
</style>
