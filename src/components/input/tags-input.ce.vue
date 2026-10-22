<!-- 标签输入：Enter/分隔符添加，空输入 Backspace 删除末项，去重与上限，按同名字段逐项提交。
调用示例：
  <kima-tags-input label="关键词" name="tags" :max="5" />
-->
<script setup>
import { computed, ref, watchEffect } from "vue";
import { presenceTransition } from "../../utils/motion.js";
import KimaButton from "../core/button.ce.vue";
import { useInputAttrs, useInputState } from "../../utils/input-state.js";
import { useRipple } from "../../utils/ripple.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: String,
  name: String,
  disabled: Boolean,
  readonly: Boolean,
  required: Boolean,
  placeholder: { type: String, default: "输入后按回车" },
  max: { type: Number, default: Infinity },
  separator: { type: String, default: "," },
});
const emit = defineEmits(["update:modelValue", "change", "reject"]);
const root = ref(null);
const input = ref(null);
const draft = ref("");
let composing = false;
const { attrs, controlAttrs } = useInputAttrs();
const { local, update } = useInputState(props, emit, root, (v) => Array.isArray(v) ? [...new Set(v.map(String))] : [], () => { draft.value = ""; composing = false; });
useRipple(root);
const full = computed(() => local.value.length >= props.max);
const tagTransition = {
  ...presenceTransition,
  onBeforeLeave(element) {
    presenceTransition.onBeforeLeave(element);
    Object.assign(element.style, { left: `${element.offsetLeft}px`, top: `${element.offsetTop}px`, width: `${element.offsetWidth}px`, height: `${element.offsetHeight}px`, boxSizing: "border-box" });
  },
  onBeforeEnter(element) {
    presenceTransition.onBeforeEnter(element);
    for (const property of ["left", "top", "width", "height", "box-sizing"]) element.style.removeProperty(property);
  },
};
// 草稿不是已确认的标签，不能用草稿绕过组的必填约束。
watchEffect(() => {
  input.value?.setCustomValidity(props.required && !props.disabled && !local.value.length ? "请至少添加一个标签" : "");
}, { flush: "post" });
function add(text = draft.value) {
  if (props.disabled || props.readonly || composing) return;
  const values = props.separator ? text.split(props.separator) : [text];
  const next = [...local.value];
  for (const raw of values) {
    const value = raw.trim();
    if (!value) continue;
    if (next.includes(value) || next.length >= props.max) { emit("reject", value); continue; }
    next.push(value);
  }
  if (next.length !== local.value.length) update(next);
  draft.value = "";
}
function remove(index) {
  if (props.disabled || props.readonly) return;
  update(local.value.filter((_, i) => i !== index));
  input.value?.focus();
}
function onKey(event) {
  if (props.disabled || props.readonly) return;
  if (composing || event.isComposing) {
    if (event.key === "Enter") event.preventDefault();
    return;
  }
  if (event.key === "Enter" || (props.separator.length === 1 && event.key === props.separator)) { event.preventDefault(); add(); }
  if (event.key === "Backspace" && !draft.value && local.value.length) { event.preventDefault(); remove(local.value.length - 1); }
}
function onPaste(event) {
  const text = event.clipboardData?.getData("text");
  if (!props.separator || !text?.includes(props.separator) || composing || props.disabled || props.readonly) return;
  event.preventDefault();
  add(draft.value + text);
}
defineExpose({ focus: () => input.value?.focus() });
</script>
<template>
  <div ref="root" :class="['kima-tags-input', attrs.class]" :style="attrs.style" :aria-disabled="disabled || undefined">
    <TransitionGroup name="kima-list" v-bind="tagTransition">
    <span v-for="(tag, index) in local" :key="tag" class="kima-tags-input__tag">
      <span>{{ tag }}</span>
      <KimaButton v-if="!readonly" variant="text" :disabled="disabled" :aria-label="`移除 ${tag}`" @click="remove(index)">×</KimaButton>
    </span>
    </TransitionGroup>
    <input v-for="tag in local" :key="tag" type="hidden" :name="name" :value="tag" :disabled="disabled" />
    <input ref="input" v-bind="controlAttrs" v-model="draft" type="text" :aria-label="controlAttrs['aria-label'] || label" :disabled="disabled" :readonly="readonly || full" :required="required && !local.length" :placeholder="full ? '' : placeholder" @keydown="onKey" @paste="onPaste" @input.stop @change.stop @compositionstart="composing = true" @compositionend="composing = false" />
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/input" as *;
.kima-tags-input {
  @include input-root;
  @include input-surface;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--kima-space-2);
  padding: var(--kima-space-2);
  > input:not([type="hidden"]) { @include input-control; flex: 1; width: 8em; }
  &__tag { display: inline-flex; align-items: center; gap: var(--kima-space-1); padding-inline-start: var(--kima-space-3); border-radius: var(--kima-radius-full); background: var(--kima-color-primary-container); color: var(--kima-color-on-primary-container); }
}
.kima-tags-input__tag.kima-list-leave-active { position: absolute; }
</style>
