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

/* 官方 Grok toggle 风格：轨道透明底 + 1px toggle-border 边框；选中 = toggle-selected
 * 半透明 wash 底（深色白 24% / 浅色黑 8%）+ 边框微亮；拇指永远是 base 实色圆 + 轻阴影。
 * 与 shadcn 实色轨道翻转不同——官方设置页就是"边框轨道 + wash 选中 + 实色拇指"。
 * 几何保持触摸档 44×26 满圆，拇指 20。 */
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
    /* 触摸档：44×26 满圆，44px 是触摸目标下限。 */
    width: 44px;
    height: 26px;
    box-sizing: border-box;
    padding: 0;
    /* 官方几何：无 padding，1px 边框是轨道造型（toggle-border），focus 时换 accent。 */
    border: 1px solid var(--kima-color-toggle-border);
    border-radius: var(--kima-radius-full);
    /* 官方模式：轨道本身透明，选中感靠 wash 底 + 拇指位移。 */
    background: transparent;
    transition: background-color var(--kima-duration-effects) var(--kima-curve-standard), border-color var(--kima-duration-effects) var(--kima-curve-standard);
    outline: none;

    &:focus-visible {
      border-color: var(--kima-color-focus-ring);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--kima-color-accent) 30%, transparent);
    }

    /* Reka 的 data-state 与 Radix 同名。选中 = 官方 toggle-selected wash 底 + 边框微亮。 */
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
    /* 触摸档拇指 20：44 轨道 - 20 拇指 = 20px 可动区间，两端视觉留白各 2px
     * 由 margin（静态左留白）+ 位移公式（100% - 4px）共同构成。 */
    width: 20px;
    height: 20px;
    margin-inline-start: 2px;
    border-radius: var(--kima-radius-full);
    /* 官方模式：拇指永远是 base 实色圆（选中/未选同色），带轻阴影。 */
    background: var(--kima-color-primary);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    transition: transform var(--kima-duration-effects) var(--kima-curve-standard);

    /* 位移 = 拇指自身宽的 100% 减去两端留白（2px 起点 + 2px 终点补差）：相对自身百分比，零硬编码。 */
    &[data-state="checked"] {
      transform: translateX(calc(100% - 4px));
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
