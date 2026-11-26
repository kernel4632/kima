<!--
按钮：KIMA 的主操作控件。默认药丸形，点击有涟漪和按下回弹。
调用示例：
  <kima-button variant="filled" type="submit">保存</kima-button>
  <kima-button variant="tonal" :loading="saving">继续</kima-button>
  <kima-button shape="square"><template #leading>...</template>添加</kima-button>
-->
<script setup>
import { computed, ref, useAttrs } from "vue";
import { useNativeSlots } from "../../utils/native-slots.js";
import { useRipple } from "../../utils/ripple.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  variant: {
    type: String,
    default: "filled",
  },
  // 默认形状 round（药丸），square 为方形。
  shape: {
    type: String,
    default: "round",
  },
  // 旧属性，等价于 shape="round"。
  round: Boolean,
  disabled: Boolean,
  loading: Boolean,
  type: {
    type: String,
    default: "button",
  },
});

const attrs = useAttrs();
const root = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);

// 点击时整块亮一下。
useRipple(root);

const buttonVariant = computed(() => {
  const variants = ["filled", "tonal", "outlined", "text"];
  return variants.includes(props.variant) ? props.variant : "filled";
});

const isRound = computed(() => props.round || props.shape !== "square");

</script>

<template>
  <button
    ref="root"
    v-bind="forwardedAttrs"
    class="kima-button"
    :class="[
      `kima-button--${buttonVariant}`,
      { 'kima-button--round': isRound },
    ]"
    :type="type"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <Transition name="kima-fade" mode="out-in">
      <span v-if="loading" key="loading" class="kima-button__indicator" aria-hidden="true"><span class="kima-button__spinner" /></span>
      <span v-else-if="$slots.leading || hasNativeSlot('leading')" key="leading" class="kima-button__slot kima-button__slot--leading"><slot name="leading" /></span>
    </Transition>
    <span class="kima-button__label"><slot /></span>
    <span v-if="$slots.trailing || hasNativeSlot('trailing')" class="kima-button__slot kima-button__slot--trailing">
      <slot name="trailing" />
    </span>
  </button>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;

.kima-button {
  /* 官方 Button CVA 对齐（docs/grok-component-reference.md 七）：
   * 尺寸 h-10(40) 主力档、圆角 rounded-xl(12)（lg/xl/2xl 档统一 12）、
   * 过渡 transition-colors duration-100、行高 1.4。 */
  min-width: var(--kima-button-min-width);
  min-height: var(--kima-button-height-s);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--kima-space-2);
  padding: 0 var(--kima-space-4);
  border: 0;
  /* 官方按钮圆角档：sm/md 档 rounded-lg(8)、lg+ 档 rounded-xl(12)——radius-control(10) 是菜单项/输入框档。 */
  border-radius: var(--kima-radius-lg);
  box-sizing: border-box;
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-label-large);
  font-weight: var(--kima-font-weight-semi-bold);
  line-height: 1.4;
  color: var(--kima-color-on-primary);
  background: var(--kima-color-primary);
  cursor: pointer;
  user-select: none;

  @include kima-state-layer;
  @include kima-focus-ring;
  @include kima-ripple-host;
  @include kima-press(var(--kima-press-scale-md));
  /* 官方按钮过渡：transition-colors duration-100（覆盖 motion-colors 的 150ms 通用档）。 */
  transition:
    transform var(--kima-duration-spring) var(--kima-ease-spring),
    background-color 100ms var(--kima-curve-standard),
    color 100ms var(--kima-curve-standard);

  &--round {
    border-radius: var(--kima-radius-full);
  }

  /* 官方 primary：hover/active 用 bg-primary-hover/active 档（token 已备）。 */
  &:hover:not(:disabled):not([aria-disabled="true"]) {
    background: var(--kima-color-primary-hover);
  }

  &:active:not(:disabled):not([aria-disabled="true"]) {
    background: var(--kima-color-primary-active);
  }

  /* 禁用：填充分支用 onSurface 12% 底 + 38% 字。 */
  &:disabled {
    cursor: not-allowed;
  }

  &--filled:disabled,
  &--tonal:disabled {
    color: color-mix(in srgb, var(--kima-color-on-surface) 38%, transparent);
    background: color-mix(in srgb, var(--kima-color-on-surface) 12%, transparent);
  }

  /* 柔和按钮 = 官方 muted 变体：secondary 填充底 + base 文字 + hover/active 洗色档。 */
  &--tonal {
    color: var(--kima-color-primary);
    background: var(--kima-color-primary-soft);

    &:hover:not(:disabled):not([aria-disabled="true"]) {
      background: var(--kima-color-wash-active);
    }

    &:active:not(:disabled):not([aria-disabled="true"]) {
      background: var(--kima-color-wash-selected);
    }
  }

  /* 描边按钮：透明底 + border-l2 一圈描边 + hover 洗色（官方 outline）。 */
  &--outlined {
    color: var(--kima-color-primary);
    background: transparent;
    border: var(--kima-outline-width) solid var(--kima-color-outline);

    &:hover:not(:disabled):not([aria-disabled="true"]) {
      background: var(--kima-color-wash-hover);
    }

    &:active:not(:disabled):not([aria-disabled="true"]) {
      background: var(--kima-color-wash-active);
    }
  }

  /* 文字按钮 = 官方 ghost：次级文字 + hover 洗色 + hover 文字提亮 base。 */
  &--text {
    color: var(--kima-color-on-surface-variant);
    background: transparent;

    &:hover:not(:disabled):not([aria-disabled="true"]) {
      color: var(--kima-color-on-surface);
      background: var(--kima-color-wash-hover);
    }

    &:active:not(:disabled):not([aria-disabled="true"]) {
      background: var(--kima-color-wash-active);
    }
  }

  &--outlined:disabled,
  &--text:disabled {
    color: color-mix(in srgb, var(--kima-color-on-surface) 38%, transparent);
  }

  &__label,
  &__slot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    /* default slot 里可以混排 icon 和文字（如"搜索 / Ctrl K"触发器）：
     * inline-flex 无 gap 时它们会贴叠，这里统一给出行内间距。 */
    gap: var(--kima-space-2);
  }

  &__label {
    min-width: 0;
    white-space: nowrap;
  }

  &__indicator { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 20px; }

  /* 淡入作用于外壳，旋转作用于内圈，避免两个动效抢同一属性。 */
  &__spinner {
    width: 20px;
    height: 20px;
    flex: 0 0 20px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: var(--kima-radius-full);
    animation: kima-button-spin var(--kima-spinner-duration) linear infinite;
  }
}

@keyframes kima-button-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .kima-button, .kima-button:active:not(:disabled) { transform: none; transition-duration: 1ms; }
  .kima-button__spinner { animation: none; }
}
</style>
