<!--
开关：行为层全由 Reka Switch 承担（键盘、表单 input、aria），皮肤按 Grok 官方 web toggle 一比一：
44×24 胶囊（官方类 w-11 h-6，chunk 1eqhhq8j5i595.js 明文）+ toggle-border 1px 边框
+ 选中 toggle-selected 半透明 wash 底 + 20px base 实色拇指滑移（官方 size-5/translate-x-5，
KIMA 用 inset token 公式，视觉行程 18px）。过渡 transform 150ms ease-out（官方 duration-150）。
label 竖向 padding 补足 44 触摸命中（视觉行高不变）。证据链见 docs/grok-component-reference.md。
label 属性只落到内部输入的 aria-label 上，可见标签由使用者自己排版。
调用示例：
  <kima-switch v-model="enabled" name="enabled">启用同步</kima-switch>
  <kima-switch :model-value="true" disabled>已锁定</kima-switch>
-->
<script setup>
import { computed, getCurrentInstance, useAttrs } from "vue";
import { SwitchRoot, SwitchThumb } from "reka-ui";
import { useNativeSlots } from "../../utils/native-slots.js";

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
const { hasNativeSlot, isCustomElement } = useNativeSlots(null);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);

function handleChange(value) {
  emit("update:modelValue", value);
  emit("change", value);
}
</script>

<template>
  <label
    class="kima-switch"
    :class="{ 'kima-switch--disabled': disabled }"
  >
    <SwitchRoot
      v-bind="forwardedAttrs"
      class="kima-switch__track"
      :model-value="modelValue"
      :disabled="disabled"
      :required="required"
      :name="name"
      :value="value"
      :aria-label="attrs['aria-label'] || attrs.ariaLabel || undefined"
      @update:model-value="handleChange"
    >
      <SwitchThumb class="kima-switch__thumb" />
    </SwitchRoot>
    <span v-if="$slots.default || hasNativeSlot('default')" class="kima-switch__label">
      <slot />
    </span>
  </label>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;

/* 官方 Grok web toggle 一比一：44×24 胶囊轨道（官方 w-11 h-6）+ toggle-border 1px 边框
 * + 选中 toggle-selected 半透明 wash 底 + 20px base 实色拇指滑移（官方 size-5）。
 * 官方没有实色轨道翻转——选中感 = wash 底变深 + 拇指从左滑到右。
 * Reka SwitchRoot 行为层（data-state）不动，只改皮肤几何与动画。 */
.kima-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--kima-space-2);
  /* 触摸命中：官方用伪元素外扩（见 docs/grok-component-reference.md 六）。
   * 这里 label 竖向 padding 补到 44 命中（28 轨道 + 2×8 padding），视觉行高不变。 */
  padding-block: calc((var(--kima-touch-target) - var(--kima-switch-height)) / 2);
  color: var(--kima-color-on-surface);
  font-size: var(--kima-font-size-body-medium);
  cursor: pointer;
  user-select: none;

  &__track {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    /* 官方 web 规格：44×24 胶囊（w-11 h-6）；触摸命中由 label 竖向 padding 补足 44。 */
    width: var(--kima-switch-width);
    height: var(--kima-switch-height);
    box-sizing: border-box;
    padding: 0;
    /* 轨道造型：1px toggle-border 边框 + 透明底；focus 时边框换 accent。 */
    border: 1px solid var(--kima-color-toggle-border);
    border-radius: var(--kima-radius-full);
    background: transparent;
    transition: background-color var(--kima-duration-fast) var(--kima-curve-standard), border-color var(--kima-duration-fast) var(--kima-curve-standard);
    outline: none;

    &:focus-visible {
      border-color: var(--kima-color-focus-ring);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--kima-color-accent) 30%, transparent);
    }

    /* 选中 = 官方 toggle-selected wash 底（深白 24% / 浅黑 8%）+ 边框微亮。 */
    &[data-state="checked"] {
      background: var(--kima-color-toggle-selected);
      border-color: color-mix(in srgb, var(--kima-color-on-surface) 30%, var(--kima-color-toggle-border));
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  &__thumb {
    display: block;
    /* 官方 web 实测：thumb size-5 = 20px、位移 translate-x-5 = 20px、
     * transition-transform duration-150 ease-out。两端内距 2px 由 margin 承担。
     * 行程 = 轨道 44 − 2×1px 边框 − 拇指 20 − 2×2 内距 = 18px ≈ 官方 20px
     * （官方 border-2 占位无视觉差，行程取 token 公式）。 */
    width: var(--kima-switch-thumb);
    height: var(--kima-switch-thumb);
    margin-inline-start: var(--kima-switch-inset);
    border-radius: var(--kima-radius-full);
    /* 官方模式：拇指恒 base 实色（选中/未选同色）+ shadow-lg 轻阴影。 */
    background: var(--kima-color-primary);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transition: transform 150ms ease-out;

    &[data-state="checked"] {
      transform: translateX(calc(var(--kima-switch-width) - 2px - var(--kima-switch-thumb) - 2 * var(--kima-switch-inset)));
    }

    &[data-state="unchecked"] {
      transform: translateX(0);
    }
  }

  &__label {
    min-width: 0;
    line-height: 1.4;
  }

  &--disabled {
    cursor: not-allowed;

    .kima-switch__label {
      opacity: 0.5;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .kima-switch__track,
  .kima-switch__thumb {
    transition: none;
  }
}
</style>
