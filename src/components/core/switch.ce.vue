<!--
开关：行为层全由 Reka Switch 承担（键盘、表单 input、aria），皮肤按 Grok App 的
M3 Switch 规格复刻（用户解包指认：App 是 Compose + Material 3 组件——
thumb 尺寸随状态变化：未选 16px 缩小 / 选中 24px 放大；
未选轨道 = outline 边框 + 透明底，选中 = primary 实色；球带外层光晕）。
52×32 轨道（M3 档）；44 触摸命中由 label 竖向 padding 补足。
此前 44×24 是官方 web cookie-consent 档——用户裁决以 App 观感为准。
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

/* 官方 Grok web switch 一比一（chunk 1eqhhq8j5i595.js 全站唯一 switch 类串）：
 * 轨道 peer inline-flex h-6 w-11 rounded-full border-2 border-transparent transition-colors
 *   底色 c ? "bg-primary hover:opacity-90" : "bg-primary/20 hover:opacity-90"
 *   focus-visible ring-2 ring-offset-2 ring-primary/30；disabled opacity-50
 * 拇指 pointer-events-none size-5 rounded-full bg-[var(--cookie-consent-surface)]
 *   = 页面底色（--background → 深色近黑/浅色近白，与 primary 反色）+ shadow-lg
 *   transition-transform duration-150 ease-out；位移 translate-x-5 / translate-x-0
 * 注意：官方 --toggle-border/--toggle-selected 无任何 switch 消费者（JS 唯一引用
 * 是设置行 border-b 分隔线），此前两轮的「边框轨道」是误读，已废弃。 */
.kima-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--kima-space-2);
  /* 触摸命中：官方用伪元素外扩（见 docs/grok-component-reference.md 六）。
   * 这里 label 竖向 padding 补到 44 命中（24 轨道 + 2×10 padding），视觉行高不变。 */
  padding-block: calc((var(--kima-touch-target) - var(--kima-switch-height)) / 2);
  color: var(--kima-color-on-surface);
  font-size: var(--kima-font-size-body-medium);
  cursor: pointer;
  user-select: none;

  &__track {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    /* M3 Switch（Grok App Compose 规格，用户解包指认）：52×32 胶囊。 */
    width: var(--kima-switch-width);
    height: var(--kima-switch-height);
    box-sizing: border-box;
    padding: 0;
    /* M3：未选轨道 = outline 色边框造型 + 透明底；选中 = primary 实色 + primary 边框。 */
    border: 2px solid var(--kima-color-on-surface-variant);
    border-radius: var(--kima-radius-full);
    background: transparent;
    transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), border-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
    outline: none;

    &:focus-visible {
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--kima-color-primary) 30%, transparent),
        0 0 0 4px var(--kima-color-surface);
    }

    &[data-state="checked"] {
      background: var(--kima-color-primary);
      border-color: var(--kima-color-primary);
    }

    &:hover:not(:disabled) {
      opacity: 0.9;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  &__thumb {
    display: block;
    pointer-events: none;
    /* M3 Switch 精确规格（用户指认 App 开关：未选球缩小、选中球放大）：
     * 未选 thumb 16px 居中收拢；选中 thumb 24px 撑满内距。
     * 宽高与位移同槽过渡，球"长大着滑过去"。 */
    width: var(--kima-switch-thumb);
    height: var(--kima-switch-thumb);
    border-radius: var(--kima-radius-full);
    /* M3：未选球 = on-surface-variant 灰；选中球 = on-primary（primary 轨道反色）。 */
    background: var(--kima-color-on-surface-variant);
    /* 外层光晕（用户指认"外层有一个光晕"）：大柔焦外晕 + 近距锐影。 */
    box-shadow: 0 0 30px -5px rgba(0, 0, 0, 0.35), 0 0 8px -3px rgba(0, 0, 0, 0.3);
    transition:
      transform 150ms var(--kima-curve-standard),
      width 200ms var(--kima-curve-standard),
      height 200ms var(--kima-curve-standard),
      background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);

    /* 按住轨道时球额外隆起 ~8%（M3 pressed 手感）。 */
    .kima-switch__track:active & {
      scale: 1.08;
    }

    &[data-state="checked"] {
      width: var(--kima-switch-thumb-checked);
      height: var(--kima-switch-thumb-checked);
      transform: translateX(var(--kima-switch-travel));
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
