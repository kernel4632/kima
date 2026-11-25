<!--
开关：原生 checkbox 承担表单和辅助技术语义（reset/required/读屏全部原生可靠），
60×36 轨道显示状态。拇指滑动用 Motion 弹簧驱动：物理参数（刚度/阻尼）代替缓动曲线，
快速来回拨动时弹簧带着速度衔接，不会像 CSS transition 那样每次都从头起跑。
调用示例：
  <kima-switch v-model="enabled" name="enabled">启用同步</kima-switch>
  <kima-switch :model-value="true" disabled>已锁定</kima-switch>
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import { motion } from "motion-v";
import KimaIcon from "./icon.ce.vue";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { useNativeSlots } from "../../utils/native-slots.js";
import { useRipple } from "../../utils/ripple.js";

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

// 拇指的弹簧参数：硬弹簧，短促到位带一丝过冲——开关是"啪嗒"的控件，
// 弹簧太软会显得迟疑。x 是位移、size 是按压形变，都交给 Motion。
const thumbSpring = { type: "spring", stiffness: 500, damping: 30 };

// 未选中：x=0（左端）。选中：x = 轨道宽 - 拇指选中间隙差，用百分比容器算位移。
// 位移量 = 轨道内宽(60-2×2) - 拇指选中宽(32) - 两端间隙(2×2) = 20px。
const thumbX = computed(() => (localValue.value ? 20 : 0));
// 选中瞬间拇指放大到 32（未选中 28）；按住时撑到 36。
const pressed = ref(false);
const thumbSize = computed(() => (pressed.value ? 36 : localValue.value ? 32 : 28));

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
      @pointerdown="pressed = true"
      @pointerup="pressed = false"
      @pointercancel="pressed = false"
    />
    <span ref="control" class="kima-switch__control" aria-hidden="true">
      <span class="kima-switch__track">
        <!-- 拇指交给 Motion：x 位移和尺寸都走弹簧，快速连拨时速度自然衔接。 -->
        <motion.span
          class="kima-switch__thumb"
          :animate="{ x: thumbX, width: thumbSize, height: thumbSize }"
          :transition="thumbSpring"
        >
          <KimaIcon class="kima-switch__check" :icon="Tick02Icon" :size="16" />
        </motion.span>
      </span>
    </span>
    <span v-if="$slots.default || hasNativeSlot('default')" class="kima-switch__label">
      <slot />
    </span>
  </label>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;

.kima-switch {
  /* 开关造型参数：轨道 60×36，拇指 28（选中 32，按压 36），描边 2。 */
  --kima-switch-track-width: 60px;
  --kima-switch-track-height: 36px;

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
   * 选中时整块切成主色。底色仍走 CSS 过渡（颜色不适合弹簧）。 */
  &__track {
    box-sizing: border-box;
    display: flex;
    /* 垂直居中交给 flex：transform 整个让给 Motion（它写 translateX 时会整体覆盖，
     * 之前用 translateY(-50%) 居中就被它清掉，拇指整个掉到下半格）。 */
    align-items: center;
    flex: 0 0 var(--kima-switch-track-width);
    width: var(--kima-switch-track-width);
    height: var(--kima-switch-track-height);
    padding-inline: 2px;
    border: 2px solid var(--kima-color-outline);
    border-radius: var(--kima-radius-full);
    background: transparent;
    overflow: hidden;
    transition:
      background-color var(--kima-duration-effects) var(--kima-curve-standard),
      border-color var(--kima-duration-effects) var(--kima-curve-standard);
  }

  /* 拇指：几何全部交给 Motion（x/width/height 走弹簧），CSS 只管颜色。
   * 垂直居中由轨道的 flex 承担；x=0 未选中贴左，x=20 选中贴右。 */
  &__thumb {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    border-radius: var(--kima-radius-full);
    background: var(--kima-color-on-surface-variant);
    will-change: transform;
  }

  &__check {
    color: var(--kima-color-on-surface);
    opacity: 0;
    transition: opacity var(--kima-duration-effects) var(--kima-curve-standard);
  }

  &--checked &__track {
    border-color: var(--kima-color-primary);
    background: var(--kima-color-primary);
  }

  &--checked &__thumb {
    background: var(--kima-color-on-primary);
  }

  &--checked &__check {
    opacity: 1;
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
  /* Motion 内部遵守 useReducedMotion（MotionConfig 的 reducedMotion="user" 默认），
   * 弹簧会自动退化为瞬时；这里兜底清掉 CSS 侧的过渡。 */
  .kima-switch__track, .kima-switch__check { transition: none; }
}
</style>
