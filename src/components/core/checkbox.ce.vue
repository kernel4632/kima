<!--
复选框：提供可参与表单提交的原生 checkbox，视觉与 table 勾选列同款（Hugeicons 整图标：SquareIcon 空框 / CheckmarkSquare02Icon 实心勾 / MinusSignSquareIcon 半选）。
标签由组件渲染（跟文本框不同）：复选框的说明文字就贴在方框右边，位置是它造型的一部分，
交给页面排版反而要每个调用点自己算对齐。可访问名由原生 input 通过包住它的 label 提供。
调用示例：
  <kima-checkbox v-model="accepted" label="接受条款" name="accepted" required></kima-checkbox>
  <kima-checkbox :model-value="true" label="已完成" indeterminate></kima-checkbox>
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import KimaIcon from "./icon.ce.vue";
import { CheckmarkSquare02Icon, MinusSignSquareIcon, SquareIcon } from "@hugeicons/core-free-icons";
import { useNativeSlots } from "../../utils/native-slots.js";
import { useRipple } from "../../utils/ripple.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  indeterminate: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  name: { type: String, default: undefined },
  value: { type: String, default: "on" },
  label: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "change"]);
const attrs = useAttrs();
const root = ref(null);
const control = ref(null);
const input = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const localValue = ref(props.modelValue || attrs.checked === "" || attrs.checked === true);
const localIndeterminate = ref(props.indeterminate);
let resetValue;
let resetIndeterminate;
let ownerDocument;

// 涟漪落在方框外围那圈光环上，不是方框里——方框才 24px，裁进去几乎看不见。
useRipple(control);

// 外部值变化时同步显示；用户点击后先由本地值保证控件立即响应。
watch(
  () => props.modelValue,
  (value) => {
    localValue.value = value;
  },
);

// indeterminate 是 DOM 属性，不是可以可靠绑定的 HTML 属性。
watch(() => props.indeterminate, (value) => { localIndeterminate.value = value; });

// 原生 change 是复选框提交新状态的边界，两个事件都发送最新布尔值。
function handleChange(event) {
  localValue.value = event.target.checked;
  localIndeterminate.value = event.target.indeterminate;
  emit("update:modelValue", localValue.value);
  emit("change", localValue.value);
}

function handleReset(event) {
  if (event.target !== input.value.form) return;
  queueMicrotask(() => {
    if (event.defaultPrevented || !input.value) return;
    const changed = localValue.value !== resetValue;
    localValue.value = resetValue;
    localIndeterminate.value = resetIndeterminate;
    input.value.checked = resetValue;
    input.value.indeterminate = resetIndeterminate;
    if (changed) emit("update:modelValue", resetValue);
  });
}

onMounted(() => {
  resetValue = localValue.value;
  resetIndeterminate = localIndeterminate.value;
  input.value.defaultChecked = resetValue;
  ownerDocument = input.value.ownerDocument;
  ownerDocument.addEventListener("reset", handleReset, true);
});
onBeforeUnmount(() => ownerDocument.removeEventListener("reset", handleReset, true));
</script>

<template>
  <label
    ref="root"
    class="kima-checkbox"
    :class="{
      'kima-checkbox--checked': localValue,
      'kima-checkbox--indeterminate': localIndeterminate,
      'kima-checkbox--disabled': disabled,
    }"
  >
    <input
      ref="input"
      v-bind="forwardedAttrs"
      class="kima-checkbox__input"
      type="checkbox"
      :checked="localValue"
      :indeterminate.prop="localIndeterminate"
      :disabled="disabled"
      :required="required"
      :name="name"
      :value="value"
      @input.stop
      @change.stop="handleChange"
    />
    <span ref="control" class="kima-checkbox__control" aria-hidden="true">
      <span class="kima-checkbox__box">
        <KimaIcon class="kima-checkbox__mark kima-checkbox__mark--tick" :icon="CheckmarkSquare02Icon" :size="24" />
        <KimaIcon class="kima-checkbox__mark kima-checkbox__mark--dash" :icon="MinusSignSquareIcon" :size="24" />
        <KimaIcon class="kima-checkbox__mark kima-checkbox__mark--empty" :icon="SquareIcon" :size="24" />
      </span>
    </span>
    <span v-if="label || $slots.default || hasNativeSlot('default')" class="kima-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;

.kima-checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--kima-space-2);
  color: var(--kima-color-on-surface);
  font-size: var(--kima-font-size-body-large);
  cursor: pointer;
  user-select: none;
  @include kima-motion-colors;

  &__input {
    position: absolute;
    inset: 0;
    /* 盖在视觉层之上，整块复选框才都点得动。
     * 状态层把它的子元素提到 z-index 2，输入框必须比那个更高，
     * 否则点在方框上时会被方框接走。 */
    z-index: 3;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: inherit;
  }

  /* 光环：方框只有 24px，手指和鼠标都嫌小，所以外面套一圈 40px 的圆形区域。
   * 它同时也是悬停、按下、涟漪的落点——反馈出现在手指周围的圆圈里，
   * 而不是硬挤进那个小方框。 */
  &__control {
    position: relative;
    display: inline-flex;
    flex: 0 0 auto;
    width: 40px;
    height: 40px;
    align-items: center;
    justify-content: center;
    border-radius: var(--kima-radius-full);

    /* M3E state-layer 同构（CheckboxElement.ts + StateLayerElement）：
     * 40px 圆形光圈，hover/focus 分态色——未选 = onSurface 8% / 选中 = primary 8%
     * （官方 m3e-checkbox-unselected/selected-hover-color），
     * 色彩渐变 200ms（官方 short4）。此前恒用 currentColor，选中后光圈跟文字走
     * 而官方是 primary 独立光圈（用户指认"m3e 的 hover 一圈更好"）。 */
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: var(--kima-radius-full);
      background: var(--kima-color-on-surface);
      opacity: 0;
      pointer-events: none;
      transition: background-color var(--kima-duration-effects) var(--kima-curve-standard),
        opacity var(--kima-duration-effects) var(--kima-curve-standard);
    }

    &:hover:not(:disabled):not([aria-disabled="true"])::after {
      opacity: 0.08; /* M3 state-layer hover 档（官方 8%），checkbox 光圈比全库轻状态层亮一档 */
    }

    /* 选中/半选态：光圈换 primary（官方 --m3e-checkbox-selected-hover-color = primary）。 */
    /* 选中/半选态：光圈换 primary（官方 --m3e-checkbox-selected-hover-color = primary）。
     * 状态类在宿主上，用后代选择器从宿主态驱动 control 光圈。 */
    .kima-checkbox--checked &::after,
    .kima-checkbox--indeterminate &::after {
      background: var(--kima-color-primary);
    }

    /* 输入聚焦时光圈也亮（官方 focus-opacity 10%）——input 是 control 的前置兄弟。 */
    .kima-checkbox__input:focus-visible + &::after {
      opacity: 0.1;
    }

    @include kima-ripple-host;
  }

  /* 方框：整图标方案（与 table 勾选列同款视觉）。
   * 空框是 SquareIcon 线稿、选中是 CheckmarkSquare02Icon 实心勾、半选是 MinusSignSquareIcon，
   * 三个图标叠在同一格，由类切换显隐——勾选弹出动画保留（独立场景勾选是主交互）。
   * 未选框用 on-surface-variant（官方 fg-secondary 64.7% 灰档）而非 border-primary：
   * 边框灰 #5f5e59 在深底上线条密度太低、会被误读为禁用（用户实测反馈），
   * 交互控件的造型线应比"分隔线"亮一档。 */
  &__box {
    position: relative;
    display: block;
    width: 24px;
    height: 24px;
    color: var(--kima-color-on-surface-variant);
    @include kima-press(var(--kima-press-scale-sm));
  }

  /* 勾与半选横杠：与 table 同款 Hugeicons 整图标，跟全库其他图标同一套线条。
   * 用 spring-snappy 弹出来，让"选中了"这个动作有个看得见的落点。 */
  &__mark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    transition: transform var(--kima-duration-medium) var(--kima-spring-snappy);
  }

  &__mark--empty {
    transform: translate(-50%, -50%) scale(1);
    transition: transform var(--kima-duration-fast) var(--kima-curve-standard);
  }

  &__label {
    min-width: 0;
    line-height: 1.4;
  }

  /* 勾选时图标换成实心勾、颜色切 base——table 同款：图标自带底，不再手绘边框填色。 */
  &--checked,
  &--indeterminate {
    .kima-checkbox__mark--empty {
      transform: translate(-50%, -50%) scale(0);
    }
  }

  &--checked {
    color: var(--kima-color-primary);

    .kima-checkbox__mark--tick {
      transform: translate(-50%, -50%) scale(1);
    }
  }

  &--indeterminate {
    color: var(--kima-color-primary);

    .kima-checkbox__mark--dash {
      transform: translate(-50%, -50%) scale(1);
    }
  }

  /* 悬停图标提亮到 base（table 同款 hover 反馈）。 */
  &:hover:not(.kima-checkbox--disabled) .kima-checkbox__box {
    color: var(--kima-color-on-surface);
  }

  /* 键盘聚焦时方框外一圈主色；鼠标点击不出焦点环。 */
  &__input:focus-visible + .kima-checkbox__control {
    outline: var(--kima-focus-ring-width) solid var(--kima-color-focus-ring);
    outline-offset: var(--kima-focus-ring-offset);
  }

  /* 禁用只是降低存在感，也不再响应悬停和按下（那会让人以为还能点）。 */
  &--disabled {
    color: var(--kima-color-on-surface-variant);
    cursor: not-allowed;

    .kima-checkbox__control {
      pointer-events: none;
    }

    .kima-checkbox__control,
    .kima-checkbox__box {
      opacity: var(--kima-opacity-disabled);
    }
  }
}
@media (prefers-reduced-motion: reduce) {
  .kima-checkbox__mark { transition: none; }
}
</style>
