<!-- 复选组：多个原生 checkbox，同名多值提交；required 表示至少选择一项，而非强制全选。
调用示例：
  <kima-checkbox-group label="兴趣" name="interests" :options="options" required />
-->
<script setup>
import { computed, ref } from "vue";
import { CheckmarkSquare02Icon, MinusSignSquareIcon, SquareIcon } from "@hugeicons/core-free-icons";
import KimaIcon from "../core/icon.ce.vue";
import { useInputAttrs, useInputState } from "../../utils/input-state.js";
import { useRipple } from "../../utils/ripple.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, default: () => [] },
  label: String,
  name: String,
  disabled: Boolean,
  required: Boolean,
  orientation: { type: String, default: "vertical" },
});
const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null);
const { attrs, controlAttrs } = useInputAttrs();
const { local, update } = useInputState(props, emit, root, (v) => Array.isArray(v) ? v : []);
const items = computed(() => props.options.map((o) => typeof o === "object" ? o : { value: o, label: String(o) }));
const firstEnabled = computed(() => items.value.findIndex((o) => !o.disabled));
const hasSelection = computed(() => items.value.some((o) => !o.disabled && local.value.includes(o.value)));
useRipple(root);
function toggle(value, checked) { update(checked ? [...local.value, value] : local.value.filter((v) => v !== value)); }
</script>
<template>
  <fieldset ref="root" v-bind="controlAttrs" :class="['kima-checkbox-group', attrs.class]" :style="attrs.style" :aria-label="controlAttrs['aria-label'] || label" :aria-orientation="orientation" :disabled="disabled" :aria-disabled="disabled || undefined">
    <label v-for="(item, index) in items" :key="item.value" class="kima-checkbox-group__item" data-kima-ripple-host :aria-disabled="disabled || item.disabled || undefined" :class="{ 'kima-checkbox-group__item--disabled': disabled || item.disabled }">
      <!-- 原生 input 只留语义和整块的点击面，方框和勾都是自己画的：
           accent-color 画出来的是系统复选框，深浅主题下都跟库里的方框对不上。 -->
      <input class="kima-checkbox-group__input" type="checkbox" :name="name" :value="item.value" :checked="local.includes(item.value)" :disabled="disabled || item.disabled" :required="required && !hasSelection && index === firstEnabled" @input.stop @change.stop="toggle(item.value, $event.target.checked)" />
      <span class="kima-checkbox-group__box" aria-hidden="true">
        <KimaIcon class="kima-checkbox-group__mark kima-checkbox-group__mark--tick" :icon="CheckmarkSquare02Icon" :size="24" />
        <KimaIcon class="kima-checkbox-group__mark kima-checkbox-group__mark--dash" :icon="MinusSignSquareIcon" :size="24" />
        <KimaIcon class="kima-checkbox-group__mark kima-checkbox-group__mark--empty" :icon="SquareIcon" :size="24" />
      </span>
      <span class="kima-checkbox-group__label">{{ item.label }}</span>
    </label>
  </fieldset>
</template>
<style scoped lang="scss">
@use "../../styles/mixins" as *;
.kima-checkbox-group {
  box-sizing: border-box;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-body-large);
  font-weight: var(--kima-font-weight-semi-bold);
  &[aria-disabled="true"] { opacity: var(--kima-opacity-disabled); }
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--kima-space-2);
  &[aria-orientation="horizontal"] { flex-direction: row; flex-wrap: wrap; }
  &__item {
    @include kima-state-layer;
    @include kima-motion-colors;
    /* 涟漪场地在选项自己身上（data-kima-ripple-host），不在组级。 */
    @include kima-ripple-host;
    display: inline-flex;
    align-items: center;
    gap: var(--kima-space-3);
    min-height: var(--kima-field-height);
    padding: 0 var(--kima-space-3);
    border-radius: var(--kima-radius-m);
    cursor: pointer;
    &:has(input:checked) { background: var(--kima-color-accent-secondary); color: var(--kima-color-on-accent-secondary); }
    &:has(input:focus-visible) { outline: var(--kima-focus-ring-width) solid var(--kima-color-focus-ring); outline-offset: calc(-1 * var(--kima-focus-ring-width)); }
    &--disabled { opacity: var(--kima-opacity-disabled); cursor: not-allowed; }
  }

  /* 输入框铺满整行，点哪儿都能勾上；它本身透明，视觉全交给方框。 */
  &__input { position: absolute; inset: 0; z-index: 3; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: inherit; }

  /* 方框：整图标方案（与独立 checkbox / table 勾选列同款视觉）。
   * 空框 SquareIcon 线稿、选中实心勾、颜色跟随行的选中态。 */
  &__box {
    position: relative;
    display: block;
    flex: 0 0 auto;
    width: 24px;
    height: 24px;
    color: var(--kima-color-outline);
    transition: color var(--kima-duration-effects) var(--kima-curve-standard);
  }

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

  &__item:has(input:checked) &__box,
  &__item:has(input:indeterminate) &__box {
    color: var(--kima-color-primary);

    .kima-checkbox-group__mark--empty {
      transform: translate(-50%, -50%) scale(0);
    }
  }
  &__item:has(input:checked) &__mark--tick { transform: translate(-50%, -50%) scale(1); }
  &__item:has(input:indeterminate) &__mark--dash { transform: translate(-50%, -50%) scale(1); }

  &__item:hover:not(.kima-checkbox-group__item--disabled) &__box {
    color: var(--kima-color-on-surface);
  }

  &__label { min-width: 0; line-height: 1.4; }
}
</style>
