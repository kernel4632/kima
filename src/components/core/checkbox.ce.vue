<!--
复选框：提供可参与表单提交的原生 checkbox，并显示 KIMA 的选中状态。
标签由组件渲染（跟文本框不同）：复选框的说明文字就贴在方框右边，位置是它造型的一部分，
交给页面排版反而要每个调用点自己算对齐。可访问名由原生 input 通过包住它的 label 提供。
调用示例：
  <kima-checkbox v-model="accepted" label="接受条款" name="accepted" required></kima-checkbox>
  <kima-checkbox :model-value="true" label="已完成" indeterminate></kima-checkbox>
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import KimaIcon from "./icon.ce.vue";
import { MinusSignIcon, Tick02Icon } from "@hugeicons/core-free-icons";
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
        <KimaIcon class="kima-checkbox__mark kima-checkbox__mark--tick" :icon="Tick02Icon" :size="20" />
        <KimaIcon class="kima-checkbox__mark kima-checkbox__mark--dash" :icon="MinusSignIcon" :size="20" />
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

    @include kima-state-layer;
    @include kima-ripple-host;
  }

  /* 方框：未选中是一圈描边（框的范围要靠它表达，是造型不是装饰），
   * 选中时整块切成主色。 */
  &__box {
    box-sizing: border-box;
    position: relative;
    display: block;
    width: 24px;
    height: 24px;
    border: 2px solid var(--kima-color-outline);
    border-radius: var(--kima-radius-xs);
    /* 用长写属性：状态切换只改 background-color，过渡才真的跑起来。 */
    background-color: var(--kima-color-transparent);
    transition:
      background-color var(--kima-duration-effects) var(--kima-curve-standard),
      border-color var(--kima-duration-effects) var(--kima-curve-standard);
  }

  /* 勾与半选横杠直接用 Hugeicons 图标：跟全库其他图标同一套线条，
   * 线头圆润、比例固定。手拼两条边框做勾会变成宽 V，线条也跟图标库对不上。
   * 用 spring-snappy 弹出来，让"选中了"这个动作有个看得见的落点。 */
  &__mark {
    position: absolute;
    top: 50%;
    left: 50%;
    color: var(--kima-color-on-primary);
    transform: translate(-50%, -50%) scale(0);
    transition: transform var(--kima-duration-medium) var(--kima-spring-snappy);
  }

  &__label {
    min-width: 0;
    line-height: 1.4;
  }

  /* 勾选时整块换成主色，不靠描边加粗表示状态。 */
  &--checked,
  &--indeterminate {
    .kima-checkbox__box {
      border-color: var(--kima-color-primary);
      background-color: var(--kima-color-primary);
    }
  }

  &--checked .kima-checkbox__mark--tick {
    transform: translate(-50%, -50%) scale(1);
  }

  /* 半选用横杠，和勾区分开：看不出"部分选中"和"全选"的区别才是问题。
   * 原生 indeterminate 可以和 checked 并存，所以半选规则写在后面，压过勾。
   * 两个图标一个缩进一个缩出，同一时长，切换是平滑的。 */
  &--indeterminate .kima-checkbox__mark--tick {
    transform: translate(-50%, -50%) scale(0);
  }

  &--indeterminate .kima-checkbox__mark--dash {
    transform: translate(-50%, -50%) scale(1);
  }

  /* 键盘聚焦时方框外一圈主色；鼠标点击不出焦点环。 */
  &__input:focus-visible + .kima-checkbox__control {
    outline: var(--kima-focus-ring-width) solid var(--kima-color-primary);
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
