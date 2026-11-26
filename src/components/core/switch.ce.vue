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

/* 位置由布局决定，不由 Motion 决定：轨道 justify-content 未选 flex-start、
 * 选中 flex-end，flex 自己把拇指推到精确的终点（永远贴住内缘，无硬编码位移）。
 * Motion 只做"从旧位置滑到新位置"的 FLIP 补偿（layout 属性量测前后位置差），
 * 终点仍是布局值，永远不会超出轨道被 overflow 裁圆。 */

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
        <!-- 拇指位置由布局决定（轨道 justify-content 切端点），Motion 的 layout
             属性做 FLIP 位移：量测切换前后的位置差并补弹簧动画，终点永远是
             布局的精确值。data-state 绑定 localValue：状态变化驱动本组件
             re-render，Motion 才会重测布局（静态子节点不触发 onUpdated）。
             尺寸（28→32，按压 36）交给 CSS 过渡——宽度若走弹簧，
             过冲会把布局终点一起顶出轨道，被 overflow 裁成月牙。 -->
        <motion.span class="kima-switch__thumb" layout :data-state="localValue ? 'checked' : 'unchecked'">
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
   * 选中时整块切成主色。底色仍走 CSS 过渡（颜色不适合弹簧）。
   * 拇指的水平端点由 justify-content 决定：未选贴左、选中贴右——
   * 布局自己算终点，Motion 的 layout 只补"从旧位滑到新位"的位移。 */
  &__track {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: flex-start;
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

  &--checked &__track {
    justify-content: flex-end;
  }

/* 拇指：水平端点由布局（justify-content）定；Motion 的 layout 量差补位移。
 * 尺寸变化（28→32 选中、36 按压）走 CSS 过渡：宽度走弹簧会过冲，
 * 连布局终点一起顶出轨道，被 overflow 裁成月牙。 */
  &__thumb {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin: 0;
    border-radius: var(--kima-radius-full);
    background: var(--kima-color-on-surface-variant);
    transition:
      width var(--kima-duration-effects) var(--kima-curve-standard),
      height var(--kima-duration-effects) var(--kima-curve-standard),
      background-color var(--kima-duration-effects) var(--kima-curve-standard);
  }

  &--checked &__thumb {
    width: 32px;
    height: 32px;
  }

  /* 按住撑满轨道：形变代替缩放表达"抓住了"（横向控件缩放会连轨道一起沉）。 */
  &__input:active ~ .kima-switch__control &__thumb {
    width: 36px;
    height: 36px;
    transition-duration: var(--kima-duration-fast);
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
