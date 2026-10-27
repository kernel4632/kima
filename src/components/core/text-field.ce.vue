<!--
文本框：只管输入本身——输入、清除、密码显示、说明与错误文字。
视觉标签不由组件渲染：「昵称」这种字是一段普通排版文字，使用者写在自己的布局里就行，
组件也就不必去猜它该待在哪、该怎么对齐。可访问名仍然可以用 label 属性给，
它会落到内部输入框的 aria-label 上，读屏照样念得出来。
输入区域是一块有底色的平面，跟卡片一样靠底色认出来，不画描边。
调用示例：
  <kima-text-field label="邮箱" name="email" required></kima-text-field>
  <kima-text-field v-model="password" type="password" clearable></kima-text-field>
  <kima-text-field label="备注" hint="最多 200 字"></kima-text-field>
-->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from "vue";
import { useContentMotion } from "../../utils/content-motion.js";
import { collapseTransition, presenceTransition } from "../../utils/motion.js";
import { useRipple } from "../../utils/ripple.js";
import KimaIcon from "./icon.ce.vue";
import {
  Cancel01Icon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  // 可访问名：不渲染成可见文字，只落到内部输入框的 aria-label 上。
  label: {
    type: String,
    default: "",
  },
  hint: {
    type: String,
    default: "",
  },
  error: {
    type: String,
    default: "",
  },
  modelValue: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "text",
  },
  name: String,
  required: Boolean,
  disabled: Boolean,
  readonly: Boolean,
  placeholder: {
    type: String,
    default: "",
  },
  clearable: Boolean,
});

const emit = defineEmits(["update:modelValue", "change"]);
const attrs = useAttrs();
const baseId = useId();
const input = ref(null);
const control = ref(null);
useRipple(control);
const passwordVisible = ref(false);
const localValue = ref(props.modelValue);
let composing = false;
let resetValue;
let ownerDocument;

// 说明和错误文字靠 id 关联到输入框，读屏时会跟着一起念。
const hintId = `kima-text-field-${baseId}-hint`;
const errorId = `kima-text-field-${baseId}-error`;
const hasError = computed(() => props.error.length > 0);
const canClear = computed(
  () => props.clearable && localValue.value.length > 0 && !props.readonly,
);
const actualType = computed(() =>
  props.type === "password" && passwordVisible.value ? "text" : props.type,
);

function describedBy() {
  const ids = [];
  if (props.error) ids.push(errorId);
  else if (props.hint) ids.push(hintId);
  if (attrs["aria-describedby"]) ids.push(attrs["aria-describedby"]);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

// 组件不画标签，所以可访问名按这个顺序取：调用方的 aria-label > label 属性 > 占位符。
function inputAriaLabel() {
  return attrs["aria-label"] || attrs.ariaLabel || props.label || props.placeholder || undefined;
}

function inputAttrs() {
  const forwarded = { ...attrs };
  delete forwarded.id;
  delete forwarded.class;
  delete forwarded.style;
  delete forwarded["aria-describedby"];
  delete forwarded["aria-label"];
  delete forwarded.ariaLabel;
  return forwarded;
}

watch(
  () => props.modelValue,
  (value) => {
    // 外部值变化时更新本地输入；用户逐字输入不依赖父组件回写。
    if (value !== localValue.value) localValue.value = value;
  },
);

function handleInput(event) {
  if (composing || event.isComposing || event.target.value === localValue.value) return;
  localValue.value = event.target.value;
  emit("update:modelValue", localValue.value);
}

function handleChange() {
  emit("change", localValue.value);
}

function clearValue() {
  if (props.disabled || props.readonly || !localValue.value) return;
  localValue.value = "";
  emit("update:modelValue", localValue.value);
  emit("change", localValue.value);
  nextTick(() => input.value?.focus());
}

function focus() {
  input.value?.focus();
}

defineExpose({ focus });

// Reset to the mounted default, not the last user edit; reset does not emit change.
function handleReset(event) {
  if (event.target !== input.value.form) return;
  queueMicrotask(() => {
    if (event.defaultPrevented || !input.value) return;
    composing = false;
    const changed = localValue.value !== resetValue;
    localValue.value = resetValue;
    input.value.value = resetValue;
    if (changed) emit("update:modelValue", resetValue);
  });
}

const messageWrap = ref(null);
useContentMotion(messageWrap, () => [props.error || props.hint, Boolean(props.error)]);

onMounted(() => {
  resetValue = localValue.value;
  input.value.defaultValue = resetValue;
  ownerDocument = input.value.ownerDocument;
  ownerDocument.addEventListener("reset", handleReset, true);
});
onBeforeUnmount(() => ownerDocument.removeEventListener("reset", handleReset, true));
</script>

<template>
  <div
    class="kima-text-field"
    :class="[
      {
        'kima-text-field--error': hasError,
        'kima-text-field--disabled': disabled,
        'kima-text-field--readonly': readonly,
      },
      attrs.class,
    ]"
    :style="attrs.style"
  >
    <div ref="control" class="kima-text-field__control" :aria-disabled="disabled || undefined">
      <input
        ref="input"
        v-bind="inputAttrs()"
        :name="name"
        :type="actualType"
        :value="localValue"
        :required="required"
        :disabled="disabled"
        :readonly="readonly"
        :placeholder="placeholder"
        :aria-label="inputAriaLabel()"
        :aria-describedby="describedBy()"
        :aria-invalid="hasError || undefined"
        :aria-required="required || undefined"
        @input.stop="handleInput"
        @compositionstart="composing = true"
        @compositionend="composing = false; handleInput($event)"
        @change.stop="handleChange"
      />

      <div v-if="type === 'password'" class="kima-text-field__actions">
        <button
          class="kima-text-field__action"
          type="button"
          :aria-label="passwordVisible ? '隐藏密码' : '显示密码'"
          :disabled="disabled"
          @click="passwordVisible = !passwordVisible"
        >
          <KimaIcon
            :icon="passwordVisible ? ViewOffIcon : ViewIcon"
            :size="18"
            color="currentColor"
          />
        </button>
        <Transition name="kima-fade" v-bind="presenceTransition">
        <button
          v-if="canClear"
          class="kima-text-field__action"
          type="button"
          aria-label="清除内容"
          :disabled="disabled"
          @click="clearValue"
        >
          <KimaIcon :icon="Cancel01Icon" :size="18" color="currentColor" />
        </button>
        </Transition>
      </div>
      <Transition v-else name="kima-fade" v-bind="presenceTransition">
      <button
        v-if="canClear"
        class="kima-text-field__action kima-text-field__action--clear"
        type="button"
        aria-label="清除内容"
        :disabled="disabled"
        @click="clearValue"
      >
        <KimaIcon :icon="Cancel01Icon" :size="18" color="currentColor" />
      </button>
      </Transition>
    </div>

    <Transition :css="false" v-bind="{ ...collapseTransition, ...presenceTransition }">
      <div ref="messageWrap" v-show="error || hint" class="kima-text-field__message-wrap" :inert="!(error || hint)" :aria-hidden="!(error || hint) || undefined">
        <p v-if="error || hint" :key="`${error ? 'error' : 'hint'}:${error || hint}`" class="kima-text-field__message" :class="{ 'kima-text-field__message--error': !!error }" :id="error ? errorId : hintId" :role="error ? 'alert' : undefined">{{ error || hint }}</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;
.kima-text-field {
  display: block;
  width: 100%;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);

  /* 输入区域是一块有底色的平面，跟卡片一样靠底色认出层次，不画描边——
   * 线是用来切版面的，不该拿来圈一个输入框。
   * 聚焦时叠上一圈主色（用 inset 阴影，不占位置也不会把元素撑大），
   * 告诉键盘操作的人现在落在哪个框里。 */
  &__control {
    @include kima-state-layer;
    @include kima-ripple-host;
    display: flex;
    align-items: center;
    height: var(--kima-field-height);
    box-sizing: border-box;
    border-radius: var(--kima-radius-m);
    background: var(--kima-color-layer-2);
    transition:
      background-color var(--kima-duration-effects) var(--kima-curve-standard),
      box-shadow var(--kima-duration-effects) var(--kima-curve-standard);
  }

  &__control:focus-within {
    background: var(--kima-color-layer-3);
    box-shadow: inset 0 0 0 var(--kima-outline-width-focused) var(--kima-color-primary);
  }

  /* 出错不是"描一圈红"，而是这块底本身换成了危险容器的颜色，
   * 一眼能看出这个框和别人不一样。 */
  &--error &__control {
    background: var(--kima-color-error-container);
    box-shadow: none;
  }

  &--error &__control:focus-within {
    background: var(--kima-color-error-container);
    box-shadow: inset 0 0 0 var(--kima-outline-width-focused) var(--kima-color-error);
  }

  &--disabled {
    opacity: var(--kima-opacity-disabled);
  }

  /* 输入框铺满剩下的宽度，右侧的按钮组各占各的位置，自动排开。 */
  &__control input {
    @include kima-motion-colors;
    flex: 1 1 auto;
    min-width: 0;
    height: 100%;
    box-sizing: border-box;
    padding: 0 var(--kima-field-padding);
    border: 0;
    outline: 0;
    color: var(--kima-color-on-surface);
    background: var(--kima-color-transparent);
    font: inherit;
    font-size: var(--kima-font-size-body-large);
  }

  /* 错误底是浅红，文字得跟着换成这套红底上的颜色才看得清。 */
  &--error &__control input {
    color: var(--kima-color-on-error-container);
  }

  &__control input::placeholder {
    color: var(--kima-color-on-surface-variant);
    opacity: 1;
  }

  &--error &__control input::placeholder {
    color: var(--kima-color-on-error-container);
    opacity: 0.7;
  }

  /* 右侧按钮组是输入框后面的并排项，不用绝对定位去猜坐标。 */
  &__actions {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: var(--kima-space-1);
    margin-right: var(--kima-space-1);
  }

  &__action {
    @include kima-motion-colors;
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: var(--kima-radius-full);
    color: var(--kima-color-on-surface-variant);
    background: var(--kima-color-transparent);
    cursor: pointer;

    &:hover:not(:disabled) {
      color: var(--kima-color-primary);
      background: color-mix(in srgb, var(--kima-color-primary) 12%, var(--kima-color-transparent));
    }

    &:focus-visible {
      outline: 2px solid var(--kima-color-primary);
      outline-offset: 1px;
    }

    &:disabled {
      cursor: not-allowed;
    }
  }

  /* 错误底上的按钮也跟着换危险色，不然红底配蓝色图标很跳。 */
  &--error &__action:hover:not(:disabled) {
    color: var(--kima-color-error);
    background: color-mix(in srgb, var(--kima-color-error) 12%, var(--kima-color-transparent));
  }

  /* 单独一个清除按钮（非密码型）也是并排的一项，跟按钮组同一档右边距。 */
  &__action--clear {
    margin-right: var(--kima-space-1);
  }

  &__message-wrap { display: grid; }
  &__message {
    grid-area: 1 / 1;
    min-height: 1.2em;
    /* 上边挨着输入框一段小间距，左右缩进跟输入文字对齐。 */
    margin: var(--kima-space-1) var(--kima-field-padding) 0;
    color: var(--kima-color-on-surface-variant);
    font-size: var(--kima-font-size-small);
    line-height: 1.2;
  }

  &__message--error {
    color: var(--kima-color-error);
  }
}
</style>