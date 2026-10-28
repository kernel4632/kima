<!-- 整星评分：原生 radio 组，键盘方向键评分，支持只读、清空与原生必填校验。
调用示例：
  <kima-rating label="满意度" name="rating" :max="5" clearable />
-->
<script setup>
import { computed, ref } from "vue";
import KimaIcon from "../core/icon.ce.vue";
import KimaButton from "../core/button.ce.vue";
import { StarIcon } from "@hugeicons/core-free-icons";
import { useInputAttrs, useInputState } from "../../utils/input-state.js";
import { useRipple } from "../../utils/ripple.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({
  modelValue: { type: Number, default: 0 },
  label: { type: String, default: "评分" },
  name: String,
  max: { type: Number, default: 5 },
  disabled: Boolean,
  readonly: Boolean,
  required: Boolean,
  clearable: Boolean,
});
const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null);
const count = computed(() => Math.max(1, Math.min(20, Math.floor(props.max) || 5)));
const { attrs, controlAttrs } = useInputAttrs();
const { local, update } = useInputState(props, emit, root, (v) => Math.min(count.value, Math.max(0, Math.round(v) || 0)));
useRipple(root);
function onKey(event) {
  if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End", " "].includes(event.key)) return;
  if (props.readonly || props.disabled) { event.preventDefault(); return; }
  if (event.key === " ") return;
  event.preventDefault();
  const rtl = getComputedStyle(root.value).direction === "rtl";
  const increase = event.key === "ArrowUp" || event.key === (rtl ? "ArrowLeft" : "ArrowRight");
  const value = event.key === "Home" ? 1 : event.key === "End" ? count.value : Math.max(1, Math.min(count.value, local.value + (increase ? 1 : -1)));
  update(value);
  root.value.querySelectorAll('input[type="radio"]')[value - 1]?.focus();
}
</script>
<template>
  <div :class="['kima-rating-wrap', attrs.class]" :style="attrs.style">
    <div ref="root" v-bind="controlAttrs" class="kima-rating" role="radiogroup" :aria-label="controlAttrs['aria-label'] || label" :aria-required="required || undefined" :aria-disabled="disabled || undefined" :aria-readonly="readonly || undefined" @keydown="onKey">
      <label v-for="value in count" :key="value" class="kima-rating__star" :class="{ 'kima-rating__star--filled': value <= local }">
        <input type="radio" :name="name" :value="value" :checked="value === local" :aria-label="`${value} / ${count}`" :disabled="disabled" :required="required" :tabindex="value === (local || 1) ? 0 : -1" :aria-readonly="readonly || undefined" @click="readonly && $event.preventDefault()" @input.stop @change.stop="update(value)" />
        <KimaIcon :icon="StarIcon" :size="28" class="kima-rating__icon" aria-hidden="true" />
      </label>
    </div>
    <KimaButton v-if="clearable && !readonly" variant="text" :disabled="disabled || !local" aria-label="清除评分" @click="update(0)">清除</KimaButton>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/input" as *;
@use "../../styles/mixins" as *;
.kima-rating-wrap { @include input-root; display: inline-flex; flex-wrap: wrap; align-items: center; gap: var(--kima-space-2); }
.kima-rating {
  @include kima-ripple-host;
  display: inline-flex;
  border-radius: var(--kima-radius-m);
  &[aria-disabled="true"] { opacity: var(--kima-opacity-disabled); }
  &__star {
    @include kima-state-layer;
    @include kima-motion-colors;
    display: grid;
    place-items: center;
    min-width: 44px;
    min-height: var(--kima-touch-target);
    border-radius: var(--kima-radius-m);
    color: var(--kima-color-on-surface-variant);
    cursor: pointer;
    /* 值由星形本身表达；保留48px热区，不把评分画成连片的分段按钮。 */
    &--filled { color: var(--kima-color-primary); }
    &--filled :deep(.kima-rating__icon) { fill: var(--kima-color-primary); }
    &:has(input:focus-visible) { outline: var(--kima-focus-ring-width) solid var(--kima-color-primary); outline-offset: calc(-1 * var(--kima-focus-ring-width)); }
    input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; z-index: 3; cursor: inherit; }
  }
}
</style>
