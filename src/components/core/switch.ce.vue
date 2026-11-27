<!--
开关：行为层 Reka Switch（键盘/表单/aria），结构层一比一复刻 M3E Switch
（github.com/matraic/m3e，packages/web/src/switch 全套源码翻译）。
DOM 结构与 M3E 官方完全同构：
  track > touch(48 命中区) + handle(定位容器) > state-layer + base > 图标
球 = handle::before（M3E 同款伪元素方案，尺寸/位移公式逐行翻译 SwitchHandleStyle.ts）。
皮肤色走 KIMA token（Grok 官方语义），映射 M3E 的 SwitchToken 四态色。
44 触摸命中：M3E 用 .touch 48px 区，此处同构保留。
label 属性只落到内部输入的 aria-label 上，可见标签由使用者自己排版。
调用示例：
  <kima-switch v-model="enabled" name="enabled">启用同步</kima-switch>
  <kima-switch :model-value="true" disabled>已锁定</kima-switch>
-->
<script setup>
import { computed, getCurrentInstance, ref, useAttrs } from "vue";
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
      <!-- M3E 同构：touch 命中区 + handle 定位容器 -->
      <span class="kima-switch__touch" aria-hidden="true" />
      <SwitchThumb class="kima-switch__handle" aria-hidden="true">
        <span class="kima-switch__state-layer" aria-hidden="true" />
        <span class="kima-switch__base" aria-hidden="true" />
      </SwitchThumb>
    </SwitchRoot>
    <span v-if="$slots.default || hasNativeSlot('default')" class="kima-switch__label">
      <slot />
    </span>
  </label>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;

/* ============ M3E Switch 一比一复刻（源码逐行翻译） ============
 * 参照 github.com/matraic/m3e packages/web/src/switch：
 *   SwitchStyle.ts（host 基础）+ SwitchTrackStyle.ts（轨道四态）
 *   + SwitchHandleStyle.ts（球几何公式）+ SwitchStateLayerStyle.ts（光晕层）
 *   + SwitchToken.ts（全部默认值，本库换成 KIMA token 映射）。
 * token 对照（M3E 默认 → KIMA）：
 *   track 52×32 / outline 2px / 球 16/24(选中)/28(按压) / state-layer 40
 *   surfaceContainerHighest → --kima-color-surface-container-highest
 *   outline → --kima-color-outline / primary → --kima-color-primary
 *   onPrimary → --kima-color-on-primary / onSurfaceVariant → --kima-color-on-surface-variant */

.kima-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--kima-space-2);
  color: var(--kima-color-on-surface);
  font-size: var(--kima-font-size-body-medium);
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &--disabled {
    cursor: not-allowed;

    .kima-switch__label {
      opacity: 0.5;
    }
  }

  &__label {
    min-width: 0;
    line-height: 1.4;
  }

  /* ---- track（SwitchTrackStyle.ts）----
   * 52×32 胶囊；未选 = surface-container-highest 底 + outline 2px 边框；
   * 选中 = primary 实色 + 边框透明；按压/聚焦/hover 各有底色档；
   * disabled = onSurface 12%（M3E disabledTrackOpacity）。 */
  &__track {
    display: block;
    position: relative;
    box-sizing: border-box;
    width: var(--kima-switch-width);
    height: var(--kima-switch-height);
    border-radius: var(--kima-radius-full);
    border: var(--kima-switch-outline) solid var(--kima-color-outline);
    background: var(--kima-color-surface-container-highest);
    outline: none;
    /* 官方 SwitchTrackStyle.ts 20-22：background-color short4 + easing.standard（200ms 档）。 */
    transition: background-color var(--kima-motion-short4) var(--kima-motion-easing-standard),
      border-color var(--kima-motion-short4) var(--kima-motion-easing-standard);

    /* 选中：边框透明（M3E :host([checked]) .track） */
    &[data-state="checked"] {
      border-color: transparent;
      background: var(--kima-color-primary);
    }

    /* hover：M3E 分选/未选两档底色（selected 保持 primary / unselected 保持灰面），
     * 球变色在 handle 段。M3E 轨道 hover 换色由 token 组合，这里保持主档不变。 */
    &:hover:not(:disabled) {
      /* M3E unselectedHoverTrackColor = surfaceContainerHighest（同默认） */
      &[data-state="unchecked"] {
        background: var(--kima-color-surface-container-highest);
        border-color: var(--kima-color-outline);
      }
    }

    &:disabled {
      cursor: not-allowed;
      /* M3E disabled：onSurface 12% 底；未选另有 12% 边框 */
      background: color-mix(in srgb, var(--kima-color-on-surface) 12%, transparent);
      border-color: color-mix(in srgb, var(--kima-color-on-surface) 12%, transparent);

      &[data-state="checked"] {
        border-color: transparent;
      }
    }
  }

  /* ---- touch（SwitchStyle.ts .touch）：48px 命中区，撑满轨道宽 ---- */
  &__touch {
    position: absolute;
    height: 48px;
    left: 0;
    right: 0;
    pointer-events: none;
  }

  /* ---- handle（SwitchHandleStyle.ts）----
   * M3E 的 handle 是 inset:0 的定位容器，球是 ::before 伪元素：
   *   left:0 top:50%；width = 100% − clipL − clipR；height = --handle-height
   *   transform = translateX(clipL) translateY(-50%)
   * 位置由三个 CSS 变量驱动（每态重算，公式在下方逐态翻译）。 */
  &__handle {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    /* M3E 变量系统（--_switch-handle-*），默认 = 未选档 */
    --handle-inline-start: calc(
      var(--kima-switch-outline) + var(--kima-switch-thumb-pressed) - var(--kima-switch-thumb-checked)
    );
    --handle-inline-end: calc(
      var(--kima-switch-width) - 2 * var(--kima-switch-outline) - var(--kima-switch-thumb) -
      var(--kima-switch-outline) - var(--kima-switch-thumb-pressed) + var(--kima-switch-thumb-checked)
    );
    --handle-height: var(--kima-switch-thumb);

    /* 球 = handle::before（M3E 一比一）。
     * 动效逐行照抄 SwitchHandleStyle.ts 37-50：
     *   background-color: short4(200ms) + easing.standard —— 色彩渐变
     *   transform / width: --_switch-handle-position-effect 变量——
     *     非按压 = spring.fastSpatial（350ms c-b(0.27,1.06,0.18,1) 带过冲），
     *     按压中 = spring.fastEffects（150ms c-b(0.31,0.94,0.34,1) 更快）
     *   height: spring.fastEffects（150ms 恒定）
     * 此前用 400ms ease-spring 无过冲统一曲线——官方是三槽分速 + 过冲，手感差异的根因。 */
    --handle-position-effect: var(--kima-spring-fast-spatial);

    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      width: calc(100% - var(--handle-inline-start) - var(--handle-inline-end));
      height: var(--handle-height);
      transform: translateX(var(--handle-inline-start)) translateY(-50%);
      border-radius: var(--kima-radius-full);
      /* 未选球色 = outline（M3E unselectedHandleColor） */
      background: var(--kima-color-outline);
      transition:
        background-color var(--kima-motion-short4) var(--kima-motion-easing-standard),
        transform var(--handle-position-effect),
        width var(--handle-position-effect),
        height var(--kima-spring-fast-effects);
    }

    /* 按压中（M3E .track.pressed .handle）：position-effect 切 fastEffects——
     * 按住时位移/宽度变快（150ms），松手回到 fastSpatial（350ms 过冲弹回）。 */
    .kima-switch__track:active:not(:disabled) & {
      --handle-position-effect: var(--kima-spring-fast-effects);
    }

    /* 选中档（M3E :host([checked]) .track:not(.pressed) .handle）：
     * start = trackWidth − selectedHandle − outline×3；end = outline；height = selected */
    &[data-state="checked"] {
      --handle-inline-start: calc(
        var(--kima-switch-width) - var(--kima-switch-thumb-checked) - 3 * var(--kima-switch-outline)
      );
      --handle-inline-end: var(--kima-switch-outline);
      --handle-height: var(--kima-switch-thumb-checked);

      &::before {
        background: var(--kima-color-on-primary);
      }
    }

    /* 按压档（M3E .track.pressed）：未选 start=0 / 选中 end=0，height=pressed 28 */
    .kima-switch__track:active:not(:disabled) & {
      --handle-height: var(--kima-switch-thumb-pressed);

      &[data-state="unchecked"] {
        --handle-inline-start: 0px;
        --handle-inline-end: calc(
          var(--kima-switch-width) - 2 * var(--kima-switch-outline) - var(--kima-switch-thumb-pressed)
        );
      }

      &[data-state="checked"] {
        --handle-inline-start: calc(
          var(--kima-switch-width) - var(--kima-switch-thumb-pressed) - 2 * var(--kima-switch-outline)
        );
        --handle-inline-end: 0px;
      }

      /* M3E 按压球色 = onSurfaceVariant */
      &::before {
        background: var(--kima-color-on-surface-variant);
      }
    }

    /* hover 球色（M3E unselectedHoverHandleColor / selectedHoverHandleColor） */
    .kima-switch__track:hover:not(:disabled) & {
      &[data-state="unchecked"]::before {
        background: var(--kima-color-on-surface-variant);
      }

      &[data-state="checked"]::before {
        background: color-mix(in srgb, var(--kima-color-on-primary) 82%, var(--kima-color-primary));
      }
    }
  }

  /* ---- state-layer（SwitchStateLayerStyle.ts）----
   * 40px 圆，inset-inline-start = 50% + (start−end)/2 − size/2，
   * 跟随 handle 变量 → 球心对齐；hover/focus 透明度由 M3E 的 state-layer 组件驱动，
   * 此处用 opacity 档实现。 */
  &__state-layer {
    position: absolute;
    width: var(--kima-switch-state-layer);
    height: var(--kima-switch-state-layer);
    border-radius: var(--kima-radius-full);
    inset-inline-start: calc(
      50% + (var(--handle-inline-start) - var(--handle-inline-end)) / 2 -
      var(--kima-switch-state-layer) / 2
    );
    top: calc(50% - var(--kima-switch-state-layer) / 2);
    background: var(--kima-color-on-surface);
    opacity: 0;
    /* 官方 SwitchStateLayerStyle.ts 24：位置 = spring.fastEffects（150ms）。
     * opacity 由 state-layer 组件的 hover/focus 控制器驱动（淡入淡出）。 */
    transition: inset-inline-start var(--kima-spring-fast-effects),
      opacity var(--kima-motion-short4) var(--kima-motion-easing-standard);
    pointer-events: none;
  }

  .kima-switch__track:hover:not(:disabled) &__state-layer { opacity: 0.08; }
  .kima-switch__track:focus-visible &__state-layer { opacity: 0.1; }
  .kima-switch__track:active:not(:disabled) &__state-layer { opacity: 0.1; }

  /* ---- base（SwitchStyle.ts .base）：grid 居中容器，M3E 放图标；我们 icons=none 留空壳 ---- */
  &__base {
    display: grid;
    place-items: center;
    grid-area: 1 / 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kima-switch__handle::before,
  .kima-switch__state-layer {
    transition: none;
  }
}
</style>
