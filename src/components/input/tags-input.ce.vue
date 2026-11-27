<!-- 标签输入：Enter/分隔符添加，空输入 Backspace 删除末项，去重与上限，按同名字段逐项提交。
调用示例：
  <kima-tags-input label="关键词" name="tags" :max="5" />
-->
<script setup>
import { computed, ref, watchEffect } from "vue";
import { useContentMotion } from "../../utils/content-motion.js";
import { presenceTransition } from "../../utils/motion.js";
import { useInputAttrs, useInputState } from "../../utils/input-state.js";
import { useRipple } from "../../utils/ripple.js";
import KimaIcon from "../core/icon.ce.vue";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
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
useContentMotion(root, () => local.value);
const full = computed(() => local.value.length >= props.max);
const tagTransition = {
  ...presenceTransition,
  onBeforeLeave(element) {
    const parent = element.parentElement;
    presenceTransition.onBeforeLeave(element);
    const rect = element.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
    Object.assign(element.style, { position: "absolute", left: `${rect.left - parentRect.left + parent.scrollLeft}px`, top: `${rect.top - parentRect.top + parent.scrollTop}px`, width: `${rect.width}px`, height: `${rect.height}px`, margin: "0", boxSizing: "border-box" });
    presenceTransition.onBeforeLeave(element);
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
      <KimaIcon v-if="!readonly" class="kima-tags-input__tag-remove" :icon="Cancel01Icon" :size="14" role="button" tabindex="0" :disabled="disabled" :aria-label="`移除 ${tag}`" @click="remove(index)" @keydown.enter.prevent="remove(index)" />
    </span>
    </TransitionGroup>
    <input v-for="tag in local" :key="tag" type="hidden" :name="name" :value="tag" :disabled="disabled" />
    <input ref="input" v-bind="controlAttrs" v-model="draft" type="text" :aria-label="controlAttrs['aria-label'] || label" :disabled="disabled" :readonly="readonly || full" :required="required && !local.length" :placeholder="full ? '' : placeholder" @keydown="onKey" @paste="onPaste" @input.stop @change.stop @compositionstart="composing = true" @compositionend="composing = false" />
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/mixins" as *;
.kima-tags-input {
  box-sizing: border-box;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-body-large);
  font-weight: var(--kima-font-weight-semi-bold);
  &[aria-disabled="true"] { opacity: var(--kima-opacity-disabled); }
  @include kima-field-skin;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--kima-space-2);
  padding: var(--kima-space-2);
  /* 剩余一小段宽度不能当作编辑区：不足8em就换到下一行，不只露出一个占位字。 */
  > input:not([type="hidden"]) { box-sizing: border-box;
  min-width: 0;
  min-height: var(--kima-field-height);
  padding: var(--kima-space-3) var(--kima-field-padding);
  border: 0;
  outline: 0;
  border-radius: inherit;
  color: inherit;
  background: transparent;
  font: inherit;
  &::placeholder { color: var(--kima-color-on-surface-variant); }
  &:disabled { cursor: not-allowed; } flex: 1 1 8em; width: 8em; min-width: min(8em, 100%); max-width: 100%; padding-inline: var(--kima-space-2); }
  /* 标签左右同 padding（此前右 padding 0，靠按钮 margin 撑，readonly 无按钮时文字贴边）。
   * 高度锁 28（field-height 的一半弱）：文字行盒 22.4 上下各 2.8，与左右 12 形成官方
   * token 的紧凑节奏。 */
  &__tag {
    display: inline-flex; align-items: center; gap: var(--kima-space-1);
    min-height: 28px;
    padding-inline: var(--kima-space-3);
    border-radius: var(--kima-radius-full);
    background: var(--kima-color-accent-secondary);
    color: var(--kima-color-on-accent-secondary);
  }

  /* 移除钮：Hugeicons Cancel01Icon 14px，与库内清除钮同族。
   * 视觉盒与图标同宽（无额外留白）——× 墨迹到标签右缘 = padding 12，与文字左边 12 对称
   * （此前 28px 盒 + 右 padding 12 实测墨迹右边距 19，上下也因 em 盒不对称偏沉）。
   * 44 触摸命中靠透明外扩，不靠视觉盒。 */
  &__tag-remove {
    flex: 0 0 auto;
    display: inline-flex;
    width: 14px;
    height: 14px;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: var(--kima-radius-full);
    color: inherit;
    background: transparent;
    cursor: pointer;
    position: relative;
    transition: color var(--kima-duration-effects) var(--kima-curve-standard);

    /* 44 命中：视觉 14 + 透明外扩。hover 光圈落在外扩前的 28px 视觉区（更醒目的热区提示）。 */
    &::before { content: ""; position: absolute; inset: -8px; border-radius: var(--kima-radius-full); background: transparent; transition: background-color var(--kima-duration-effects) var(--kima-curve-standard); }
    &::after { content: ""; position: absolute; inset: -15px; }

    &:hover::before { background: var(--kima-color-wash-hover); }

    &:focus-visible { outline: var(--kima-focus-ring-width) solid var(--kima-color-focus-ring); outline-offset: var(--kima-focus-ring-offset); }

    &:disabled { cursor: not-allowed; }
  }
}
/* 退场标签脱离排版：FLIP 重排时它不再占位，其余标签平滑补位（_tokens.scss 的 kima-list 管过渡）。
 * 这是动画期特例——absolute 只活在退场那 200ms，不是布局手段。 */
.kima-tags-input__tag.kima-list-leave-active { position: absolute; inset-inline-start: var(--kima-space-2); }
</style>
