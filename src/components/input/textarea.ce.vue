<!-- 多行输入：即时输入与输入法提交，错误/说明、清除、自动高度及原生表单重置。 -->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import KimaIcon from "../core/icon.ce.vue";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { collapseTransition, presenceTransition } from "../../utils/motion.js";
import { useInputAttrs, useInputState } from "../../utils/input-state.js";
import { useRipple } from "../../utils/ripple.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({
  modelValue: { type: String, default: "" },
  label: String,
  name: String,
  disabled: Boolean,
  readonly: Boolean,
  required: Boolean,
  placeholder: String,
  rows: { type: Number, default: 4 },
  minlength: Number,
  maxlength: Number,
  showCount: Boolean,
  error: { type: String, default: "" },
  hint: { type: String, default: "" },
  clearable: Boolean,
  autoResize: Boolean,
  resize: { type: String, default: "vertical" },
});
const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null);
const input = ref(null);
const id = `kima-textarea-${useId()}`;
let composing = false;
const { attrs, controlAttrs } = useInputAttrs();
const { local, update } = useInputState(props, emit, root, (v) => v ?? "", (value) => {
  composing = false;
  if (input.value) input.value.value = value;
  nextTick(resizeInput);
});
useRipple(root);
const resizeMode = computed(() => props.autoResize ? "none" : ["none", "vertical", "horizontal", "both"].includes(props.resize) ? props.resize : "vertical");
const canClear = computed(() => props.clearable && !!local.value && !props.readonly);
const describedBy = computed(() => [props.error ? `${id}-error` : props.hint ? `${id}-hint` : "", controlAttrs.value["aria-describedby"]].filter(Boolean).join(" ") || undefined);
function resizeInput() {
  const element = input.value;
  if (!element) return;
  element.style.height = "";
  if (!props.autoResize) return;
  // Layout is synchronous with typing, never animated. Respect the native rows minimum.
  const minimum = element.clientHeight;
  const style = element.ownerDocument.defaultView.getComputedStyle(element);
  const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
  element.style.height = `${Math.max(minimum, element.scrollHeight) + border}px`;
}
watch([local, () => props.rows, () => props.autoResize], () => nextTick(resizeInput), { immediate: true, flush: "post" });
let sizeObserver;
onMounted(() => {
  const Observer = input.value.ownerDocument.defaultView.ResizeObserver;
  if (!Observer) return;
  let width = input.value.getBoundingClientRect().width;
  sizeObserver = new Observer(() => {
    const nextWidth = input.value?.getBoundingClientRect().width;
    if (nextWidth == null || Math.abs(nextWidth - width) < 0.5) return;
    width = nextWidth;
    resizeInput();
  });
  sizeObserver.observe(input.value);
});
onBeforeUnmount(() => sizeObserver?.disconnect());
function onInput(event) {
  if (!composing && !event.isComposing && event.target.value !== local.value) update(event.target.value, false);
  resizeInput();
}
function clearValue() {
  if (props.disabled || props.readonly || !local.value) return;
  update("");
  nextTick(() => { resizeInput(); input.value?.focus(); });
}
defineExpose({ focus: () => input.value?.focus() });
</script>
<template>
  <div :class="['kima-textarea', { 'kima-textarea--error': !!error }, attrs.class]" :style="attrs.style" :aria-disabled="disabled || undefined">
    <div ref="root" class="kima-textarea__surface" :aria-disabled="disabled || undefined">
      <textarea ref="input" v-bind="controlAttrs" :value="local" :aria-label="controlAttrs['aria-label'] || label" :aria-invalid="!!error || controlAttrs['aria-invalid']" :aria-describedby="describedBy" :name="name" :disabled="disabled" :readonly="readonly" :required="required" :placeholder="placeholder" :rows="rows" :minlength="minlength" :maxlength="maxlength" :style="{ resize: resizeMode }" @input.stop="onInput" @change.stop="emit('change', local)" @compositionstart="composing = true" @compositionend="composing = false; onInput($event)" />
      <Transition name="kima-fade" v-bind="presenceTransition">
        <button v-if="canClear" class="kima-textarea__clear" type="button" aria-label="清除内容" :disabled="disabled" @click="clearValue"><KimaIcon :icon="Cancel01Icon" :size="18" aria-hidden="true" /></button>
      </Transition>
    </div>
    <Transition :css="false" v-bind="{ ...collapseTransition, ...presenceTransition }">
      <div v-show="error || hint" class="kima-textarea__message-wrap" :inert="!(error || hint)" :aria-hidden="!(error || hint) || undefined">
        <Transition name="kima-fade" v-bind="presenceTransition">
          <p v-if="error || hint" :id="`${id}-${error ? 'error' : 'hint'}`" :key="`${error ? 'error' : 'hint'}:${error || hint}`" class="kima-textarea__message" :class="{ 'kima-textarea__message--error': !!error }" :role="error ? 'alert' : undefined">{{ error || hint }}</p>
        </Transition>
      </div>
    </Transition>
    <p v-if="showCount" class="kima-textarea__count">{{ local.length }}<template v-if="maxlength != null"> / {{ maxlength }}</template></p>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/input" as *;
@use "../../styles/mixins" as *;
.kima-textarea {
  @include input-root;
  &__surface { @include input-surface; display: flex; align-items: flex-start; }
  textarea { @include input-control; @include kima-motion-colors; display: block; flex: 1 1 auto; width: 100%; line-height: 1.6; }
  &__clear { @include kima-state-layer; @include kima-focus-ring; @include kima-motion-colors; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 32px; width: 32px; height: 32px; margin: var(--kima-space-3) var(--kima-space-2) 0 0; padding: 0; border: 0; border-radius: var(--kima-radius-full); color: inherit; background: var(--kima-color-transparent); cursor: pointer; }
  &__message-wrap { display: grid; }
  &__message { @include input-message; grid-area: 1 / 1; &--error { color: var(--kima-color-error); } }
  &__count { @include input-message; text-align: end; }
  &--error &__surface { background: var(--kima-color-error-container); color: var(--kima-color-on-error-container); &:focus-within { box-shadow: inset 0 0 0 var(--kima-outline-width-focused) var(--kima-color-error); } }
  &--error textarea::placeholder { color: var(--kima-color-on-error-container); }
}
</style>
