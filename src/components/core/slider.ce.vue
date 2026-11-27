<!--
滑块：行为层保留原生 range（键盘、拖动、表单、无障碍），输入框透明覆盖在
视觉层之上；视觉层按 M3E Slider 源码一比一翻译
（github.com/matraic/m3e packages/web/src/slider，SliderElement.ts 逐函数照抄）。

官方算法（#updateDimensions / #pointFromValue / #translate / #updateTicks / #updateTickOverlap，
全部 JS 像素计算，非 CSS 百分比）：
  pos(v) = (size − thumbSize) × (v − min) / (max − min)          ← thumb 左缘
  thumb.transform = translate(pos, 0)
  单 thumb 轨道变量：
    active-track-size = pos
    inactive-after-offset = pos + thumbSize
    inactive-after-size = size − pos − thumbSize
  ticks：min +（跨零）0 + max；discrete 且 step>1 全量；
    tick.transform = translate(pos(tick.value), 0)
    active = tick.value < lowerValue
    hidden = |pos(tick) − pos(thumb)| < thumbSize / 2

尺寸档（extra-small 默认 / small / medium / large / extra-large）：
官方 :host 状态类切换 track 高度与总高，KIMA 用 prop size + data-size 属性同构。

结构（官方 render() 同构）：
  base > track（inactive.start + active + inactive.end）+ ticks + thumb 容器
  thumb > touch(48 命中) + wrapper(handle 4px 竖条 + label 气泡)
组件不画标签；label 属性落到 range 的 aria-label。
调用示例：
  <kima-slider v-model="volume" label="音量" name="volume"></kima-slider>
  <kima-slider v-model="rate" label="速率" size="medium" discrete :step="10" show-value></kima-slider>
-->
<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  // M3E SliderSize：官方五档（extra-small 默认）。
  size: { type: String, default: "extra-small" },
  // M3E discrete：离散模式（step > 1 渲染全量刻度点）。
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
const base = ref(null);
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

watch(
  [() => props.modelValue, () => props.min, () => props.max],
  () => { localValue.value = clampValue(props.modelValue); updateDimensions(); },
);

/* ============ 官方 #updateCachedDimensions / #updateDimensions 一比一 ============
 * 官方是像素测量（clientWidth / thumb clientWidth）+ JS 写 CSS 变量与 transform。
 * KIMA 同构：ResizeObserver 追踪 base 宽度（#cachedSize），thumb 宽从 token 推
 * （wrapper = handle 4 + padding 6×2 = 16，官方 #cachedThumbSize = thumb clientWidth）。 */
const cachedSize = ref(0); // base 宽
const cachedThumbSize = 16; // thumb 容器宽（wrapper 4 + 2×6）

// 官方 #pointFromValue 一比一：(size − thumbSize) × (value − min) / (max − min)
function pointFromValue(value) {
  return (cachedSize.value - cachedThumbSize) * ((value - sliderMin.value) / (sliderMax.value - sliderMin.value));
}

// 官方 #updateDimensions 单 thumb 段一比一。
const thumbPos = ref(0);
const activeTrackSize = ref(0);
const inactiveAfterOffset = ref(0);
const inactiveAfterSize = ref(0);

function updateDimensions() {
  if (!cachedSize.value) return;
  const lowerValue = localValue.value;
  const lowerPos = pointFromValue(lowerValue);
  thumbPos.value = lowerPos;
  activeTrackSize.value = lowerPos;
  inactiveAfterOffset.value = lowerPos + cachedThumbSize;
  inactiveAfterSize.value = cachedSize.value - lowerPos - cachedThumbSize;
}

// 官方 #updateTicks + #updateTickOverlap 一比一。
const ticks = ref([]);
function updateTicks() {
  const list = [];
  if (props.discrete && props.step > 1) {
    for (let i = sliderMin.value; i <= sliderMax.value; i += props.step) list.push({ value: i });
  } else {
    list.push({ value: sliderMin.value });
    if (sliderMin.value < 0 && sliderMax.value > 0) list.push({ value: 0 });
    list.push({ value: sliderMax.value });
  }
  const thumbHalfWidth = cachedThumbSize / 2;
  ticks.value = list.map((tick) => {
    const tickPos = pointFromValue(tick.value);
    const thumbPosition = pointFromValue(localValue.value);
    return {
      value: tick.value,
      pos: tickPos,
      active: tick.value < localValue.value,
      hidden: Math.abs(tickPos - thumbPosition) < thumbHalfWidth,
    };
  });
}

let resizeObserver;
onMounted(() => {
  const form = input.value?.form;
  if (form) {
    resetValue = localValue.value;
    ownerDocument = form.ownerDocument;
    ownerDocument.addEventListener("reset", handleReset, true);
  }
  // 官方 ResizeObserver（#resizeController）→ 尺寸变化重算全部位置。
  resizeObserver = new ResizeObserver(() => {
    cachedSize.value = base.value?.clientWidth ?? 0;
    updateDimensions();
    updateTicks();
  });
  if (base.value) resizeObserver.observe(base.value);
  nextTick(() => {
    cachedSize.value = base.value?.clientWidth ?? 0;
    updateDimensions();
    updateTicks();
  });
});
onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  ownerDocument?.removeEventListener("reset", handleReset, true);
});

// 官方 @value-change → #updateDimensions 同步轨道与 tick。
watch(localValue, () => { updateDimensions(); updateTicks(); });

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
</script>

<template>
  <label
    class="kima-slider"
    :class="['kima-slider--' + (['extra-small', 'small', 'medium', 'large', 'extra-large'].includes(size) ? size : 'extra-small'), { 'kima-slider--disabled': disabled }]"
    :data-size="size"
  >
    <!-- 官方 render() 同构：base > track 三段 + ticks + thumb。
         轨道变量由 JS 像素计算注入（官方 #updateDimensions 同款）。 -->
    <span ref="base" class="kima-slider__base" aria-hidden="true">
      <span class="kima-slider__track">
        <span class="kima-slider__track-inactive kima-slider__track-inactive--start" />
        <span
          class="kima-slider__track-active"
          :style="{ '--_slider-active-track-size': activeTrackSize + 'px' }"
        />
        <span
          class="kima-slider__track-inactive kima-slider__track-inactive--end"
          :style="{
            '--_slider-inactive-track-after-offset': inactiveAfterOffset + 'px',
            '--_slider-inactive-track-after-size': inactiveAfterSize + 'px',
          }"
        />
      </span>
      <!-- 官方 .ticks + #renderTick：transform = translate(pos, 0)。 -->
      <span class="kima-slider__ticks">
        <span
          v-for="tick in ticks"
          :key="tick.value"
          class="kima-slider__tick"
          :class="{ 'kima-slider__tick--active': tick.active, 'kima-slider__tick--hidden': tick.hidden }"
          :style="{ transform: `translate(${tick.pos}px, 0)` }"
        />
      </span>
      <!-- 官方 thumb：transform = translate(pos, 0)（JS 像素，非百分比居中）。 -->
      <span
        class="kima-slider__thumb"
        :class="{ 'kima-slider__thumb--dragging': dragging }"
        :style="{ transform: `translate(${thumbPos}px, 0)` }"
      >
        <span class="kima-slider__touch" />
        <span class="kima-slider__wrapper">
          <span class="kima-slider__handle" />
          <span v-if="showValue" class="kima-slider__label">{{ localValue }}</span>
        </span>
      </span>
    </span>
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
    <span v-if="showValue" class="kima-slider__header">
      <output class="kima-slider__value">{{ localValue }}</output>
    </span>
  </label>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;

/* ============ M3E Slider 源码翻译（不发明，只映射 token 色） ============
 * SliderElement.ts / SliderThumbElement.ts 逐函数照抄：
 * 结构、尺寸档、位置算法、tick 逻辑全部官方；KIMA 只换颜色 token。 */

.kima-slider {
  display: block;
  width: 100%;
  color: var(--kima-color-on-surface);
  position: relative;
  /* 官方 :host 尺寸档（extra-small 默认 44；small 44 / medium 52 / large 68 / extra-large 96 由下档）。 */
  min-height: var(--kima-slider-height, 44px);

  &--small { --kima-slider-height: 44px; }
  &--medium { --kima-slider-height: 52px; }
  &--large { --kima-slider-height: 68px; }

  &--disabled {
    cursor: not-allowed;
  }

  &__base {
    display: block;
    position: relative;
    width: 100%;
    height: var(--kima-slider-height, 44px);
  }

  /* 官方 .track（contain + relative + flex 1）。 */
  &__track {
    contain: layout style paint;
    position: absolute;
    /* 官方 extra-small track 16px（其他档位由 --kima-slider-track-height-<size> 驱动，此处先 extra-small 基准）。 */
    top: calc((var(--kima-slider-height, 44px) - var(--kima-slider-track-height)) / 2);
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

  /* 官方 .track-inactive.start：单 thumb 时无 start 段（size 0）。 */
  &__track-inactive--start {
    width: 0;
    background: var(--kima-color-surface-container-highest);
    border-radius: var(--kima-radius-m) 0 0 var(--kima-radius-m);
  }

  /* 官方 .track-active：margin-inline-start = --_slider-active-track-offset（单 thumb 为 0）；
   * width = --_slider-active-track-size（JS 注入）。 */
  &__track-active {
    margin-inline-start: var(--_slider-active-track-offset, 0px);
    width: var(--_slider-active-track-size, 0px);
    border-radius: var(--kima-radius-m) 0 0 var(--kima-radius-m);
    background: var(--kima-color-primary);
  }

  /* 官方 .track-inactive.end：margin-inline-start = after-offset、width = after-size（JS 注入）。 */
  &__track-inactive--end {
    margin-inline-start: var(--_slider-inactive-track-after-offset, 0px);
    width: var(--_slider-inactive-track-after-size, 0px);
    border-radius: 0 var(--kima-radius-m) var(--kima-radius-m) 0;
    background: var(--kima-color-surface-container-highest);
  }

  /* 官方 .ticks：absolute、高 = tick 4px、在 track 内垂直居中（官方 top 由 track 高度布局给）。 */
  &__ticks {
    position: absolute;
    width: 100%;
    height: var(--kima-slider-tick-size);
    top: calc((var(--kima-slider-height, 44px) - var(--kima-slider-tick-size)) / 2);
    overflow: visible;
    pointer-events: none;
  }

  /* 官方 .tick：position absolute + JS transform 定位（#renderTick 一比一）；
   * 官方 CSS 里 tick 的 inset-inline-start 是 tick-size + tick-size/2（中心补偿），
   * KIMA translate 直接用官方 pos 公式，不改。 */
  &__tick {
    position: absolute;
    top: 0;
    inset-inline-start: calc(var(--kima-slider-tick-size) + var(--kima-slider-tick-size) / 2);
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

  /* 官方 thumb（SliderThumbElement.ts :host）：absolute、top/bottom 0、
   * left 由 JS transform 承担（不再 CSS 百分比）。 */
  &__thumb {
    display: block;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    border-radius: var(--kima-radius-full);
    outline: none;
  }

  /* 官方 .touch：48px 命中区。 */
  &__touch {
    position: absolute;
    height: 48px;
    left: 0;
    right: 0;
    touch-action: none;
  }

  /* 官方 .base（thumb 内）：inline-flex 居中。 */
  &__wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    position: relative;
    height: 100%;
    width: calc(var(--kima-slider-handle-width) + var(--kima-slider-thumb-padding) * 2);
    border-radius: inherit;
  }

  /* 官方 .handle：4px 竖条、满圆、primary；active/focus 变 2px。 */
  &__handle {
    height: 100%;
    width: var(--kima-slider-handle-width);
    border-radius: inherit;
    background: var(--kima-color-primary);
    transition: width var(--kima-duration-effects) var(--kima-curve-standard);
  }

  /* 官方 :host(:is(:active, :focus-visible)) .handle → 2px。 */
  &__thumb--dragging .kima-slider__handle,
  &:has(.kima-slider__input:focus-visible) .kima-slider__handle {
    width: var(--kima-slider-handle-pressed-width);
  }

  /* 官方 .label：inverse 底气泡。 */
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
    top: calc(-1 * 44px - 4px);
    inset-inline-start: -100%;
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

  &__thumb--dragging .kima-slider__label {
    visibility: visible;
    opacity: 1;
    transform: scale(1);
  }

  /* 行为层：原生 range 透明覆盖。 */
  &__input {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
    }

    &:focus-visible {
      outline: var(--kima-focus-ring-width) solid var(--kima-color-focus-ring);
      outline-offset: var(--kima-focus-ring-offset);
    }
  }

  /* 官方 disabled 公式：active = onSurface 38% / inactive = onSurface 12%。 */
  &--disabled {
    .kima-slider__track-active { background: color-mix(in srgb, var(--kima-color-on-surface) 38%, transparent); }
    .kima-slider__track-inactive { background: color-mix(in srgb, var(--kima-color-on-surface) 12%, transparent); }
    .kima-slider__handle { background: color-mix(in srgb, var(--kima-color-on-surface) 38%, transparent); }
  }

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
