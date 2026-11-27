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
/* M3 Switch（M3E 源码 matraic/m3e 逐项复刻，SwitchToken/TrackStyle/HandleStyle/StateLayerStyle）：
 * 轨道 52×32、2px outline 边框；未选 = surface-container-highest 实色底（不是透明！）+ outline 边框；
 * 选中 = primary 实色 + 边框透明。
 * 球：未选 16px 贴左（inline-start = outline + pressed 28 − with-icon 24 = 6px 偏移，不是居中）；
 * 选中 24px 贴右（52 − 24 − outline×3 = 22px）；按压 28px（真尺寸变化，非缩放）。
 * 球色：未选 outline 灰、选中 on-primary、hover on-surface-variant、按压 on-surface-variant。
 * 光晕 = 40px state layer 圆随球移动（hover 8% / focus 10% / pressed 10%）。 */
.kima-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--kima-space-2);
  /* 触摸命中：label 竖向 padding 补到 44（32 轨道 + 2×6），视觉行高不变。 */
  padding-block: calc((var(--kima-touch-target) - var(--kima-switch-height)) / 2);
  color: var(--kima-color-on-surface);
  font-size: var(--kima-font-size-body-medium);
  cursor: pointer;
  user-select: none;

  &__track {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    position: relative;
    /* M3E trackWidth/trackHeight：52×32。 */
    width: var(--kima-switch-width);
    height: var(--kima-switch-height);
    box-sizing: border-box;
    padding: 0;
    /* M3E：2px outline 边框；选中态边框透明。 */
    border: var(--kima-switch-outline) solid var(--kima-color-outline);
    border-radius: var(--kima-radius-full);
    /* M3E：未选底 = surfaceContainerHighest 实色（浅灰面）。 */
    background: var(--kima-color-surface-container-highest);
    transition: background-color var(--kima-duration-effects) var(--kima-curve-standard),
      border-color var(--kima-duration-effects) var(--kima-curve-standard);
    outline: none;

    &[data-state="checked"] {
      border-color: transparent;
      background: var(--kima-color-primary);
    }

    /* M3E 状态层（用户指认的光晕）：40px 圆跟球移动，浮在球后。 */
    &::before {
      content: "";
      position: absolute;
      top: calc(50% - var(--kima-switch-state-layer) / 2);
      /* 球心 = 未选偏移 6 + 球半宽；选中 = 偏移 travel+6 + 球半宽。层左缘 = 球心 − 层半宽。 */
      left: calc(6px + var(--kima-switch-thumb) / 2 - var(--kima-switch-state-layer) / 2);
      width: var(--kima-switch-state-layer);
      height: var(--kima-switch-state-layer);
      border-radius: var(--kima-radius-full);
      background: var(--kima-color-on-surface);
      opacity: 0;
      transition: left var(--kima-duration-spring) var(--kima-ease-spring),
        opacity var(--kima-duration-effects) var(--kima-curve-standard);
      pointer-events: none;
    }

    &:hover:not(:disabled) {
      &::before { opacity: 0.08; }
    }

    &:focus-visible {
      &::before { opacity: 0.1; }
    }

    &:active:not(:disabled)::before {
      opacity: 0.1;
    }

    &:disabled {
      cursor: not-allowed;
      /* M3E disabled：未选 = onSurface 12% 底 + onSurface 12% 边框；选中 = onSurface 12% 底。 */
      background: color-mix(in srgb, var(--kima-color-on-surface) 12%, transparent);
      border-color: color-mix(in srgb, var(--kima-color-on-surface) 12%, transparent);

      &[data-state="checked"] {
        background: color-mix(in srgb, var(--kima-color-on-surface) 12%, transparent);
        border-color: transparent;
      }
    }
  }

  &__thumb {
    display: block;
    pointer-events: none;
    /* M3E handle 精确几何：
     * 未选 16px 贴左（M3E inline-start = outline 2 + pressed 28 − icon 24 = 6px 偏移）；
     * 选中 24px 贴右（52 − 24 − outline 6 = 22px 位移）；按压 28px。
     * 宽高/位移全部独立 transition——M3E 用 spring fast spatial（位移）+ fast effects（尺寸）。 */
    width: var(--kima-switch-thumb);
    height: var(--kima-switch-thumb);
    margin-inline-start: 6px;
    border-radius: var(--kima-radius-full);
    /* M3E：未选球 = outline 色；选中球 = on-primary；按压球 = on-surface-variant。 */
    background: var(--kima-color-outline);
    transition:
      margin-inline-start var(--kima-duration-spring) var(--kima-ease-spring),
      width var(--kima-duration-spring) var(--kima-ease-spring),
      height var(--kima-duration-spring) var(--kima-ease-spring),
      background-color var(--kima-duration-effects) var(--kima-curve-standard);

    /* M3E 按压：球真尺寸 28px（不是缩放）。 */
    .kima-switch__track:active:not(:disabled) & {
      width: var(--kima-switch-thumb-pressed);
      height: var(--kima-switch-thumb-pressed);
      background: var(--kima-color-on-surface-variant);
    }

    .kima-switch__track:hover:not(:disabled) & {
      background: var(--kima-color-on-surface-variant);
    }

    &[data-state="checked"] {
      width: var(--kima-switch-thumb-checked);
      height: var(--kima-switch-thumb-checked);
      /* M3E 选中贴右：位移 = 轨道 52 − 球 24 − outline×3(6) − 未选偏移 6 = 22px。 */
      margin-inline-start: var(--kima-switch-travel);
      background: var(--kima-color-on-primary);
    }

    &[data-state="unchecked"] {
      margin-inline-start: 6px;
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
