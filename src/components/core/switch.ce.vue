<!--
开关：行为层全由 Reka Switch 承担（键盘、表单 input、aria），几何与配色缝合 shadcn v4 官方 Switch：
拇指位移用 translate-x 百分比（相对拇指自身宽），天然自适应尺寸、零硬编码像素；
尺寸沿用 shadcn（轨道 32×18.4、拇指 16），整体比 KIMA 旧版（60×36）更精致，符合 shadcn 手感。
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

/* 几何缝合 shadcn v4 Switch：轨道 32×18.4 满圆、透明边框（同 border-transparent 占位）、
 * 拇指 16 满圆。位移 translate-x(calc(100% - 2px)) 相对拇指自身宽——
 * 百分比位移天然自适应，不存在硬编码像素，任何尺寸都不需要重算。 */
.kima-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--kima-space-2);
  color: var(--kima-color-on-surface);
  font-size: var(--kima-font-size-body-medium);
  cursor: pointer;
  user-select: none;

  &__track {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    /* 触摸档：44×26 满圆（shadcn 几何等比放大），
     * 44px 是触摸目标下限，26 保证拇指上下留白。 */
    width: 44px;
    height: 26px;
    box-sizing: border-box;
    /* 官方几何：无 padding。1px 透明边框是 focus 时换色的占位（shadcn 同款 border-transparent）。
     * 拇指的左右留白全靠位移公式里的 -2px，上下留白靠轨道高度富余。 */
    padding: 0;
    border: 1px solid transparent;
    border-radius: var(--kima-radius-full);
    /* shadcn：未选 input 灰 / 选中 primary；过渡全量（背景 150ms） */
    background: var(--kima-color-outline-variant);
    transition: background-color var(--kima-duration-effects) var(--kima-curve-standard);
    outline: none;

    &:focus-visible {
      border-color: var(--kima-color-primary);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--kima-color-primary) 30%, transparent);
    }

    /* Reka 的 data-state 与 Radix 同名，选择器直接对应 shadcn 的 data-[state=checked]。 */
    &[data-state="checked"] {
      background: var(--kima-color-primary);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  &__thumb {
    display: block;
    /* 触摸档拇指 22：44 轨道 - 22 拇指 = 22px 可动区间。
     * 两端视觉留白各 2px 由 margin（静态左留白）+ 位移公式（100% - 6px）共同构成：
     * 起点 = 2(margin)，终点 = 2 + 22-6 = 18 → 占位 18..40，两侧各留 2px。 */
    width: 22px;
    height: 22px;
    margin-inline-start: 2px;
    border-radius: var(--kima-radius-full);
    /* shadcn 拇指配色：未选背景色（深浅两套对调），选中主色对文字 */
    background: var(--kima-color-surface-container-highest);
    box-shadow: 0 1px 2px oklch(0 0 0 / 0.2);
    transition: transform var(--kima-duration-effects) var(--kima-curve-standard), background-color var(--kima-duration-effects) var(--kima-curve-standard);

    /* 位移 = 拇指自身宽的 100% 减去两端留白（2px 起点 + 2px 终点补差）：相对自身百分比，零硬编码。 */
    &[data-state="checked"] {
      transform: translateX(calc(100% - 6px));
      background: var(--kima-color-on-primary);
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
