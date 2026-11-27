<!--
滑块：行为层保留原生 range（键盘、拖动、表单、无障碍），输入框透明覆盖在
视觉层之上；视觉层按 M3E Slider 一比一同构复刻
（github.com/matraic/m3e packages/web/src/slider，SliderElement.ts + SliderThumbElement.ts）。
结构翻译（M3E render() → KIMA）：
  .base > .track > (.track-inactive.start + .track-active + .track-inactive.end)
        + .thumb 容器 > (.touch + .wrapper > .handle)
原生 input 伪元素做不出 M3E 的分段轨道（active 左圆右直不对称圆角）与
独立 thumb（4px 竖条、按压变 2px 细），所以视觉层是兄弟 DOM 而非伪元素。
组件不画标签：label 属性只落到内部 range 的 aria-label 上；
show-value 的当前值气泡（M3E .label 同构：inverse 底、拖动时浮现）。
调用示例：
  <kima-slider v-model="volume" label="音量" name="volume"></kima-slider>
  <kima-slider :model-value="25" :min="0" :max="50" label="范围" show-value></kima-slider>
-->
<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  // M3E discrete：离散模式（step > 1 时按步长渲染全量刻度点）。
  discrete: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: false },
  name: { type: String, default: undefined },
  label: { type: String, default: "" },
  showValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "change"]);
const attrs = useAttrs();
const isCustomElement = Boolean(getCurrentInstance()?.ce);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const input = ref(null);
const dragging = ref(false);
let resetValue;
let ownerDocument;

const sliderMin = computed(() => Number.isFinite(props.min) ? props.min : 0);
const sliderMax = computed(() => Number.isFinite(props.max) ? Math.max(sliderMin.value, props.max) : sliderMin.value + 100);

function clampValue(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return sliderMin.value;
  return Math.max(sliderMin.value, Math.min(sliderMax.value, numericValue));
}

const localValue = ref(clampValue(props.modelValue));

// 外部值变化时同步；拖动过程中先更新本地值，保证原生控件不等待父组件回写。
watch(
  [() => props.modelValue, () => props.min, () => props.max],
  () => { localValue.value = clampValue(props.modelValue); },
);

// M3E 的 fill 是 thumb 中心百分比；视觉层的 active 轨道按它定位。
const fill = computed(() => {
  const range = sliderMax.value - sliderMin.value;
  if (range <= 0) return 0;
  return Math.max(0, Math.min(1, (localValue.value - sliderMin.value) / range));
});

// M3E #updateTicks 一比一（SliderElement.ts）：
// - continuous（默认）：min + （跨零时）0 + max 三个端点 tick
// - discrete 且 step > 1：min→max 按 step 全量
// - active = tick 值 < 当前 thumb 值（在 active 轨道覆盖内）
// - hidden = tick 与 thumb 容器重叠（视觉避让）
const ticks = computed(() => {
  const list = [];
  if (props.discrete && props.step > 1) {
    for (let i = sliderMin.value; i <= sliderMax.value; i += props.step) {
      list.push({ value: i });
    }
  } else {
    list.push({ value: sliderMin.value });
    if (sliderMin.value < 0 && sliderMax.value > 0) list.push({ value: 0 });
    list.push({ value: sliderMax.value });
  }
  return list.map((tick) => {
    const pct = (tick.value - sliderMin.value) / Math.max(sliderMax.value - sliderMin.value, 1);
    return {
      value: tick.value,
      active: tick.value < localValue.value,
      // 与 thumb 容器（16px）重叠则隐藏：中心距 fill 小于 thumb-gap 半宽。
      hidden: Math.abs(pct - fill.value) * 100 < 100 * 8 / 1000 && Math.abs(tick.value - localValue.value) <= props.step,
    };
  });
});

// input 事件用于连续同步，原生 change 事件用于提交一次完整改动。
function handleInput(event) {
  localValue.value = clampValue(event.target.value);
  emit("update:modelValue", localValue.value);
}
function handleChange(event) {
  localValue.value = clampValue(event.target.value);
  emit("update:modelValue", localValue.value);
  emit("change", localValue.value);
}
function handleReset() {
  localValue.value = clampValue(resetValue);
  emit("update:modelValue", localValue.value);
}
function handlePointerDown() {
  dragging.value = true;
}
function handlePointerUp() {
  dragging.value = false;
}

onMounted(() => {
  const form = input.value?.form;
  if (form) {
    resetValue = localValue.value;
    ownerDocument = form.ownerDocument;
    ownerDocument.addEventListener("reset", handleReset, true);
  }
});
onBeforeUnmount(() => ownerDocument?.removeEventListener("reset", handleReset, true));
</script>

<template>
  <label
    class="kima-slider"
    :class="{ 'kima-slider--disabled': disabled }"
  >
    <!-- 视觉层：M3E 同构（.base > .track 三段 + .thumb > .handle）。
         拖动中（--dragging）时 thumb handle 变细 + 数值气泡浮现。
         thumb-left / active-width 挂在 base 上：track-active 与 thumb 是兄弟，
         变量必须放在共同祖先才能两边都读到。 -->
    <span
      class="kima-slider__base"
      aria-hidden="true"
      :style="{
        '--kima-slider-thumb-left': `${fill * 100}%`,
        '--kima-slider-active-width': `${fill * 100}%`,
      }"
    >
      <span class="kima-slider__track">
        <span class="kima-slider__track-inactive kima-slider__track-inactive--start" />
        <span class="kima-slider__track-active" />
        <span class="kima-slider__track-inactive kima-slider__track-inactive--end" />
      </span>
      <!-- M3E .ticks 一比一：刻度点层（4px 圆点，track 内垂直居中）。 -->
      <span class="kima-slider__ticks">
        <span
          v-for="tick in ticks"
          :key="tick.value"
          class="kima-slider__tick"
          :class="{ 'kima-slider__tick--active': tick.active, 'kima-slider__tick--hidden': tick.hidden }"
          :style="{ left: `${(tick.value - sliderMin) / Math.max(sliderMax - sliderMin, 1) * 100}%` }"
        />
      </span>
      <span
        class="kima-slider__thumb"
        :class="{ 'kima-slider__thumb--dragging': dragging }"
      >
        <span class="kima-slider__touch" />
        <span class="kima-slider__wrapper">
          <span class="kima-slider__handle" />
          <!-- M3E .label 同构：inverse 底数值气泡，拖动时浮现。 -->
          <span v-if="showValue" class="kima-slider__label">{{ localValue }}</span>
        </span>
      </span>
    </span>
    <!-- 行为层：原生 range 透明覆盖整个 base（视觉层不拦截指针）。 -->
    <input
      ref="input"
      v-bind="forwardedAttrs"
      class="kima-slider__input"
      type="range"
      :value="localValue"
      :min="sliderMin"
      :max="sliderMax"
      :step="step"
      :disabled="disabled"
      :required="required"
      :name="name"
      :aria-label="label || undefined"
      @input.stop="handleInput"
      @change.stop="handleChange"
      @pointerdown="handlePointerDown"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerUp"
    />
    <!-- 静态数值（非气泡模式）：贴右上，跟 M3E 文档站的 value 展示同位。 -->
    <span v-if="showValue" class="kima-slider__header">
      <output class="kima-slider__value">{{ localValue }}</output>
    </span>
  </label>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;

/* ============ M3E Slider 一比一复刻（源码翻译） ============
 * SliderElement.ts：host 44px 高（extra-small 档）、track 16px、三段轨道
 *   （inactive start / active / inactive end，不对称圆角）。
 * SliderThumbElement.ts：thumb 容器 absolute、wrapper 16px（handle 4 + padding 6×2）、
 *   handle 4px 竖条满圆 primary 色、active/focus 变 2px 细、touch 48px 命中。
 * token 映射：primary → --kima-color-primary、secondaryContainer → surface-container-highest、
 *   onSurface 12%/38% → KIMA disabled 公式、inverseSurface → surface-container-highest。 */

.kima-slider {
  display: block;
  width: 100%;
  color: var(--kima-color-on-surface);
  position: relative;
  /* M3E :host extra-small 档总高 44。 */
  min-height: var(--kima-slider-total-height);

  &--disabled {
    cursor: not-allowed;
  }

  /* ---- base（M3E .base）：视觉容器，input 覆盖其上 ---- */
  &__base {
    display: block;
    position: relative;
    width: 100%;
    height: var(--kima-slider-total-height);
    /* M3E :host(:not([disabled])) cursor pointer——指针礼仪由覆盖的 input 提供。 */
  }

  /* ---- track（M3E .track）：16px 高的场地 ---- */
  &__track {
    contain: layout style paint;
    position: absolute;
    top: calc((var(--kima-slider-total-height) - var(--kima-slider-track-height)) / 2);
    left: 0;
    right: 0;
    height: var(--kima-slider-track-height);
  }

  &__track-inactive,
  &__track-active {
    contain: layout style paint;
    position: absolute;
    height: 100%;
  }

  /* M3E .track-inactive.start：secondaryContainer 色，start 端 8px 圆角（smallStart）。 */
  &__track-inactive--start {
    width: var(--kima-slider-active-width, 0%);
    /* start 段在 thumb 中心左侧：右端被 active 接管，只圆左端。 */
    border-radius: var(--kima-radius-m) 0 0 var(--kima-radius-m);
    background: var(--kima-color-surface-container-highest);
  }

  /* M3E .track-active：primary 色、左圆右直（active 段右端被 thumb 的 handle 接管）。 */
  &__track-active {
    /* active 段从 thumb 中心向左铺满（M3E 由 JS 算 width/offset，KIMA 用 thumb-left 定位）。 */
    left: 0;
    /* M3E 官方实测：active 终点 = thumb 容器左缘（中心 − 容器半宽 8px），
     * 不是 thumb 中心——thumb 两侧与轨道有 16px 断开（官方 value=50 时
     * active 到 92 而非 100，inactive-end 从 108 起）。 */
    width: calc(var(--kima-slider-active-width, 0%) - var(--kima-slider-thumb-gap));
    border-radius: var(--kima-radius-m) 0 0 var(--kima-radius-m);
    background: var(--kima-color-primary);
  }

  /* M3E .track-inactive.end：secondaryContainer，end 端圆角。 */
  &__track-inactive--end {
    left: calc(var(--kima-slider-active-width, 0%) + var(--kima-slider-thumb-gap));
    right: 0;
    border-radius: 0 var(--kima-radius-m) var(--kima-radius-m) 0;
    background: var(--kima-color-surface-container-highest);
  }

  /* ---- thumb（M3E m3e-slider-thumb 容器）----
   * absolute、left 由 thumb-left（fill 百分比）驱动；
   * wrapper 16px 宽（handle 4 + padding 6×2），高 100%（44）。 */
  /* M3E .ticks/.tick 一比一（SliderElement.ts）：刻度点层。
   * 4px 满圆点、层高 4、在 16px 轨道内垂直居中（top 偏移 (16−4)/2 = 6）。
   * active tick = onPrimary（在 active 轨道上）；hidden = 与 thumb 重叠避让。 */
  &__ticks {
    position: absolute;
    width: 100%;
    height: var(--kima-slider-tick-size);
    top: calc((var(--kima-slider-track-height) - var(--kima-slider-tick-size)) / 2);
    overflow: visible;
    pointer-events: none;
  }

  &__tick {
    position: absolute;
    top: 0;
    /* 居中补偿：tick 以 left 百分比定位，translate -50% 让圆心对刻度值。 */
    translate: -50% 0;
    width: var(--kima-slider-tick-size);
    height: var(--kima-slider-tick-size);
    border-radius: var(--kima-radius-full);
    background: var(--kima-color-surface-container-highest);

    &--active {
      background: var(--kima-color-on-primary);
    }

    &--hidden {
      visibility: hidden;
    }
  }

  &__thumb {
    position: absolute;
    top: 0;
    bottom: 0;
    left: var(--kima-slider-thumb-left, 0%);
    /* 位移 -50%：thumb 左缘对准 thumb-left，让中心对齐百分比（M3E 同款居中锚定）。 */
    translate: -50% 0;
  }

  /* M3E .touch：48px 命中区。 */
  &__touch {
    position: absolute;
    height: 48px;
    left: 0;
    right: 0;
    touch-action: none;
  }

  /* M3E .wrapper：视觉 thumb 的定位容器，16×44。 */
  &__wrapper {
    display: inline-flex;
    justify-content: center;
    height: 100%;
    border-radius: inherit;
    width: calc(var(--kima-slider-handle-width) + var(--kima-slider-thumb-padding) * 2);
    position: relative;
  }

  /* M3E .handle：4px 竖条、满圆、primary；active/focus 变 2px（thumb-pressed-width）。 */
  &__handle {
    height: 100%;
    width: var(--kima-slider-handle-width);
    border-radius: var(--kima-radius-full);
    background: var(--kima-color-primary);
    transition: width var(--kima-duration-effects) var(--kima-curve-standard);
  }

  /* M3E :host(:is(:active, :focus-visible)) .handle → 2px 细条。
   * KIMA：拖动态由 --dragging 类驱动；聚焦态从宿主 label 感知（:has），
   * 避免 scoped 兄弟链断选（~ * 在 data-v 作用域下不可靠）。 */
  &__thumb--dragging .kima-slider__handle,
  &:has(.kima-slider__input:focus-visible) .kima-slider__handle {
    width: var(--kima-slider-handle-pressed-width);
  }

  /* M3E .label：数值气泡，inverse 底、拖动时浮现（scale 0→1）。 */
  &__label {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    visibility: var(--kima-slider-label-visibility, hidden);
    opacity: var(--kima-slider-label-opacity, 0);
    transform: var(--kima-slider-label-transform, scale(0));
    transition:
      opacity var(--kima-duration-effects) var(--kima-curve-standard),
      transform var(--kima-duration-effects) var(--kima-curve-standard),
      visibility var(--kima-duration-effects) var(--kima-curve-standard) allow-discrete;
    width: 48px;
    height: 44px;
    top: calc(-1 * var(--kima-slider-label-height, 44px) - var(--kima-slider-label-margin, 4px));
    inset-inline-start: calc(-1 * 100%);
    border-radius: var(--kima-radius-full);
    background: var(--kima-color-surface-container-highest);
    color: var(--kima-color-on-surface);
    font-size: var(--kima-font-size-label-medium);
    font-weight: var(--kima-font-weight-semi-bold);
    line-height: 1;
  }

  @starting-style {
    .kima-slider__label {
      opacity: 0;
      transform: scale(0);
    }
  }

  /* 拖动时气泡浮现（M3E 由 --active 状态驱动）。 */
  &__thumb--dragging .kima-slider__label {
    visibility: visible;
    opacity: 1;
    transform: scale(1);
  }

  /* ---- 行为层：原生 range 透明覆盖 ---- */
  &__input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
    /* 原生 thumb 的命中区即整个输入区——不需要原生视觉。 */

    &:disabled {
      cursor: not-allowed;
    }

    /* 焦点环套整个控件（视觉层 DOM 在下方，环画在 input 上覆盖整个场地）。 */
    &:focus-visible {
      outline: var(--kima-focus-ring-width) solid var(--kima-color-focus-ring);
      outline-offset: var(--kima-focus-ring-offset);
    }
  }

  /* ---- 禁用（M3E disabled 公式）：active = onSurface 38% / inactive = onSurface 12% ---- */
  &--disabled {
    .kima-slider__track-active { background: color-mix(in srgb, var(--kima-color-on-surface) 38%, transparent); }
    .kima-slider__track-inactive { background: color-mix(in srgb, var(--kima-color-on-surface) 12%, transparent); }
    .kima-slider__handle { background: color-mix(in srgb, var(--kima-color-on-surface) 38%, transparent); }
  }

  /* ---- 静态数值头（show-value 非气泡模式） ---- */
  &__header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: var(--kima-space-1);
  }

  &__value {
    color: var(--kima-color-on-surface-variant);
    font-size: var(--kima-font-size-label-large);
    font-variant-numeric: tabular-nums;
    line-height: 1.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kima-slider__handle,
  .kima-slider__label {
    transition: none;
  }
}
</style>
