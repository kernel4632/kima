<!--
开关：用原生 checkbox 承担表单和辅助技术语义，再用 60×36 的轨道显示状态。
形状和顺序跟复选框保持一致：控件在左、说明文字在右，外面的圆形光环承载悬停与涟漪。
调用示例：
  <kima-switch v-model="enabled" name="enabled">启用同步</kima-switch>
  <kima-switch :model-value="true" disabled>已锁定</kima-switch>
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import KimaIcon from "./icon.ce.vue";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { useNativeSlots } from "../utils/native-slots.js";
import { useRipple } from "../utils/ripple.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  name: { type: String, default: undefined },
  value: { type: String, default: "on" },
});

const emit = defineEmits(["update:modelValue", "change"]);
const attrs = useAttrs();
const root = ref(null);
const control = ref(null);
const input = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const localValue = ref(props.modelValue || attrs.checked === "" || attrs.checked === true);
let resetValue;
let ownerDocument;

// 涟漪落在轨道外面那圈光环上；轨道本身要裁剪滑块，不能兼作涟漪宿主。
useRipple(control);

// 本地状态让没有立即回写 modelValue 的 Web Component 仍能完成点击反馈。
watch(
  () => props.modelValue,
  (value) => {
    localValue.value = value;
  },
);

// 原生 change 是开关状态完成切换的边界。
function handleChange(event) {
  localValue.value = event.target.checked;
  emit("update:modelValue", localValue.value);
  emit("change", localValue.value);
}

function handleReset(event) {
  if (event.target !== input.value.form) return;
  queueMicrotask(() => {
    if (event.defaultPrevented || !input.value) return;
    const changed = localValue.value !== resetValue;
    localValue.value = resetValue;
    input.value.checked = resetValue;
    if (changed) emit("update:modelValue", resetValue);
  });
}

onMounted(() => {
  resetValue = localValue.value;
  input.value.defaultChecked = resetValue;
  ownerDocument = input.value.ownerDocument;
  ownerDocument.addEventListener("reset", handleReset, true);
});
onBeforeUnmount(() => ownerDocument.removeEventListener("reset", handleReset, true));
</script>

<template>
  <label
    ref="root"
    class="kima-switch"
    :class="{ 'kima-switch--checked': localValue, 'kima-switch--disabled': disabled }"
  >
    <input
      ref="input"
      v-bind="forwardedAttrs"
      class="kima-switch__input"
      type="checkbox"
      role="switch"
      :checked="localValue"
      :disabled="disabled"
      :required="required"
      :name="name"
      :value="value"
      @input.stop
      @change.stop="handleChange"
    />
    <span ref="control" class="kima-switch__control" aria-hidden="true">
      <span class="kima-switch__track">
        <span class="kima-switch__thumb">
          <KimaIcon class="kima-switch__check" :icon="Tick02Icon" :size="16" />
        </span>
      </span>
    </span>
    <span v-if="$slots.default || hasNativeSlot('default')" class="kima-switch__label">
      <slot />
    </span>
  </label>
</template>

<style scoped lang="scss">
@use "../styles/mixins" as *;

.kima-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--kima-space-2);
  color: var(--kima-color-on-surface);
  font-size: var(--kima-font-size-body-large);
  cursor: pointer;
  user-select: none;

  &__input {
    position: absolute;
    inset: 0;
    /* 盖在视觉层之上，整块开关才都点得动。
     * 状态层把它的子元素提到 z-index 2，输入框必须比那个更高，
     * 否则点是点得动，但落在轨道上时会被轨道接走。 */
    z-index: 3;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: inherit;
  }

  /* 光环：给轨道外面留一圈落点，悬停、按下、涟漪都长在这里。
   * 轨道自己裁剪滑块，不能同时当涟漪宿主。 */
  &__control {
    position: relative;
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border-radius: var(--kima-radius-full);

    @include kima-state-layer;
    @include kima-ripple-host;
  }

  &__label {
    min-width: 0;
    line-height: 1.4;
  }

  /* 轨道：未选中是一圈描边（开关的范围靠它表达，是造型不是装饰），
   * 选中时整块切成主色。 */
  &__track {
    box-sizing: border-box;
    position: relative;
    display: block;
    flex: 0 0 var(--kima-switch-track-width);
    width: var(--kima-switch-track-width);
    height: var(--kima-switch-track-height);
    border: var(--kima-switch-outline-width) solid var(--kima-color-outline);
    border-radius: var(--kima-radius-full);
    background: var(--kima-color-transparent);
    transition:
      background-color var(--kima-duration-effects) var(--kima-curve-standard),
      border-color var(--kima-duration-effects) var(--kima-curve-standard);
  }

  /* 滑块：未选中 28，选中 32，按下再撑到轨道边缘。
   * 位置按"轨道内边距减去描边"算，选中时贴右边。 */
  &__thumb {
    box-sizing: border-box;
    position: absolute;
    top: 50%;
    /* 绝对定位的 left 从轨道"边框内侧"算起，所以这里减掉描边宽度，
     * 未选中的滑块才会和选中时一样离外缘 4px。 */
    left: 2px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--kima-switch-thumb-size);
    height: var(--kima-switch-thumb-size);
    border-radius: var(--kima-radius-full);
    background: var(--kima-color-on-surface-variant);
    transform: translateY(-50%);
    /* 位置和尺寸都用强调曲线：滑块"滑过去"的过程本身就是状态变化的说明。 */
    transition:
      left var(--kima-duration-slow) var(--kima-curve-emphasized),
      width var(--kima-duration-medium) var(--kima-curve-emphasized),
      height var(--kima-duration-medium) var(--kima-curve-emphasized),
      background-color var(--kima-duration-effects) var(--kima-curve-standard);
  }

  &__check {
    color: var(--kima-color-primary);
    opacity: 0;
    transition: opacity var(--kima-duration-effects) var(--kima-curve-standard);
  }

  &--checked &__track {
    border-color: var(--kima-color-primary);
    background: var(--kima-color-primary);

    .kima-switch__thumb {
      left: calc(100% - var(--kima-switch-thumb-selected) - 2px);
      width: var(--kima-switch-thumb-selected);
      height: var(--kima-switch-thumb-selected);
      background: var(--kima-color-on-primary);
    }

    .kima-switch__check {
      opacity: 1;
    }
  }

  /* 按下时滑块横向撑长——和 M3 一样，用形变而不是缩放表示"按住了"。
   * 开关是横向控件，缩放会连轨道一起变小，看起来像整块沉下去。 */
  &__input:active ~ .kima-switch__control &__track &__thumb {
    width: var(--kima-switch-thumb-pressed);
  }

  &__input:focus-visible ~ .kima-switch__control {
    outline: var(--kima-focus-ring-width) solid var(--kima-color-primary);
    outline-offset: var(--kima-focus-ring-offset);
  }

  /* 禁用只是降低存在感，也不再响应悬停和按下。 */
  &--disabled {
    color: var(--kima-color-on-surface-variant);
    cursor: not-allowed;

    .kima-switch__control {
      pointer-events: none;
    }

    .kima-switch__control,
    .kima-switch__track {
      opacity: var(--kima-opacity-disabled);
    }
  }
}
@media (prefers-reduced-motion: reduce) {
  .kima-switch__track, .kima-switch__thumb, .kima-switch__check { transition: none; }
}
</style>
