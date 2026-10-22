<!--
滑块：保留原生 range 的键盘、拖动和表单能力，轨道和手柄用 KIMA 的 token 画。
组件不画标签（和文本框、选择器一致）：可见的「音量」由使用者自己排版，
label 属性只落到内部 range 的 aria-label 上。
show-value 显示的当前值属于控件自身状态，不是标签，仍然由组件画——
它要跟着滑块一起动，交给外部排版就同步不上了。
调用示例：
  <kima-slider v-model="volume" label="音量" show-value name="volume"></kima-slider>
  <kima-slider :model-value="25" :min="0" :max="50" label="范围"></kima-slider>
-->
<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
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

const fill = computed(() => {
  const range = sliderMax.value - sliderMin.value;
  if (range <= 0) return "0%";
  const ratio = (localValue.value - sliderMin.value) / range;
  return `${Math.max(0, Math.min(1, ratio)) * 100}%`;
});

// input 事件用于连续同步，原生 change 事件用于提交一次完整改动。
function handleInput(event) {
  localValue.value = clampValue(event.target.value);
  emit("update:modelValue", localValue.value);
}

function handleChange(event) {
  localValue.value = clampValue(event.target.value);
  emit("change", localValue.value);
}

function handleReset(event) {
  if (event.target !== input.value.form) return;
  queueMicrotask(() => {
    if (event.defaultPrevented || !input.value) return;
    const nextValue = clampValue(resetValue);
    const changed = localValue.value !== nextValue;
    localValue.value = nextValue;
    input.value.value = String(nextValue);
    if (changed) emit("update:modelValue", nextValue);
  });
}

onMounted(() => {
  // The native range applies min/max/step before the mounted default is captured.
  localValue.value = clampValue(input.value.valueAsNumber);
  resetValue = localValue.value;
  input.value.defaultValue = String(resetValue);
  ownerDocument = input.value.ownerDocument;
  ownerDocument.addEventListener("reset", handleReset, true);
});
onBeforeUnmount(() => ownerDocument.removeEventListener("reset", handleReset, true));
</script>

<template>
  <label
    class="kima-slider"
    :class="{ 'kima-slider--disabled': disabled }"
  >
    <span v-if="showValue" class="kima-slider__header">
      <output class="kima-slider__value">{{ localValue }}</output>
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
      :style="{ '--kima-slider-fill': fill }"
      @input.stop="handleInput"
      @change.stop="handleChange"
    />
  </label>
</template>

<style scoped lang="scss">
.kima-slider {
  display: block;
  width: 100%;
  color: var(--kima-color-on-surface);

  /* 当前值只在 show-value 时出现，贴在右上方。
   * 它跟着滑块动，所以由组件画；左边留给使用者自己排的标签。 */
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

  &__input {
    /* 每一档颜色只在这里定义一次，轨道和手柄都引它，
     * 禁用时只改这两个变量，不用给每一条伪元素各写一遍。 */
    --kima-slider-fill-color: var(--kima-color-primary);
    --kima-slider-track-color: var(--kima-color-track);

    display: block;
    width: 100%;
    /* 控件高 = 手柄 36 + 上下各留 2，保证手柄不贴到别人的边。 */
    height: calc(var(--kima-slider-handle-height) + 4px);
    margin: 0;
    appearance: none;
    background: var(--kima-color-transparent);
    cursor: pointer;

    /* 轨道是线：填充部分用主色，未填充部分是一层中性色。
     * 这条线是滑块的造型本身，删了就看不出"能拖到哪"。 */
    &::-webkit-slider-runnable-track {
      height: var(--kima-slider-track-height);
      border-radius: var(--kima-radius-s);
      background: linear-gradient(
        to right,
        var(--kima-slider-fill-color) 0 var(--kima-slider-fill),
        var(--kima-slider-track-color) var(--kima-slider-fill) 100%
      );
    }

    /* 手柄是一根竖条，比轨道高，两端露出来才好抓。
     * 悬停时加宽一点，是"抓住了"的反馈；宽度过渡要能看见。 */
    &::-webkit-slider-thumb {
      width: var(--kima-slider-handle-width);
      height: var(--kima-slider-handle-height);
      margin-top: calc((var(--kima-slider-track-height) - var(--kima-slider-handle-height)) / 2);
      appearance: none;
      border: 0;
      border-radius: var(--kima-radius-full);
      background: var(--kima-slider-fill-color);
      transition: width var(--kima-duration-effects) var(--kima-curve-standard);
    }

    &:hover:not(:disabled)::-webkit-slider-thumb {
      width: calc(var(--kima-slider-handle-width) + 4px);
    }

    &::-moz-range-track {
      height: var(--kima-slider-track-height);
      border-radius: var(--kima-radius-s);
      background: var(--kima-slider-track-color);
    }

    &::-moz-range-progress {
      height: var(--kima-slider-track-height);
      border-radius: var(--kima-radius-s);
      background: var(--kima-slider-fill-color);
    }

    &::-moz-range-thumb {
      width: var(--kima-slider-handle-width);
      height: var(--kima-slider-handle-height);
      border: 0;
      border-radius: var(--kima-radius-full);
      background: var(--kima-slider-fill-color);
      transition: width var(--kima-duration-effects) var(--kima-curve-standard);
    }

    &:hover:not(:disabled)::-moz-range-thumb {
      width: calc(var(--kima-slider-handle-width) + 4px);
    }

    /* 焦点环套在整个控件上，比只套 20px 高的轨道更容易被看见。 */
    &:focus-visible {
      outline: var(--kima-focus-ring-width) solid var(--kima-color-primary);
      outline-offset: var(--kima-focus-ring-offset);
    }

    /* 禁用：填充和未填充都降成中性灰，看起来像"这条现在不能动"。 */
    &:disabled {
      --kima-slider-fill-color: var(--kima-color-on-surface-38);
      --kima-slider-track-color: var(--kima-color-on-surface-12);

      cursor: not-allowed;
    }
  }

  &--disabled &__value {
    color: var(--kima-color-on-surface-38);
  }
}
@media (prefers-reduced-motion: reduce) {
  .kima-slider__input::-webkit-slider-thumb { transition: none; }
  .kima-slider__input::-moz-range-thumb { transition: none; }
}
</style>
