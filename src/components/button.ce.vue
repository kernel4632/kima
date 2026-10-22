<!--
按钮：KIMA 的主操作控件。默认药丸形，点击有涟漪和按下回弹。
调用示例：
  <kima-button variant="filled" type="submit">保存</kima-button>
  <kima-button variant="tonal" :loading="saving">继续</kima-button>
  <kima-button shape="square"><template #leading>...</template>添加</kima-button>
-->
<script setup>
import { computed, ref, useAttrs } from "vue";
import { useNativeSlots } from "../utils/native-slots.js";
import { useRipple } from "../utils/ripple.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  variant: {
    type: String,
    default: "filled",
  },
  // DMS DankButton 默认形状 round（药丸），square 为方形。
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
@use "../styles/mixins" as *;

.kima-button {
  /* DMS DankButton：最小宽 58、高 40、内边距 16、内容间距 8、字号 14 中等。 */
  min-width: var(--kima-button-min-width);
  min-height: var(--kima-button-height-s);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--kima-space-s);
  padding: 0 var(--kima-space-l);
  border: 0;
  /* square 用 M 12；round 用整高药丸。 */
  border-radius: var(--kima-radius-m);
  box-sizing: border-box;
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-label-large);
  font-weight: var(--kima-font-weight-semi-bold);
  line-height: 1;
  color: var(--kima-color-on-primary);
  background: var(--kima-color-primary);
  cursor: pointer;
  user-select: none;

  @include kima-state-layer;
  @include kima-focus-ring;
  @include kima-ripple-host;
  @include kima-press;

  &--round {
    border-radius: var(--kima-radius-full);
  }

  /* DMS 禁用：填充分支用 onSurface_12 底 + onSurface_38 字。 */
  &:disabled {
    cursor: not-allowed;
  }

  &--filled:disabled,
  &--tonal:disabled {
    color: var(--kima-color-on-surface-38);
    background: var(--kima-color-on-surface-12);
  }

  /* 柔和按钮：主色染过的浅底，比主操作弱一档，但一眼看得出是主色系。 */
  &--tonal {
    color: var(--kima-color-primary);
    background: var(--kima-color-primary-soft);
  }

  /* 描边按钮：透明底 + 一圈可见的描边。
   * 这里的线是它这个变体的造型本身，不是用来分层次的——
   * 「不用边框分层次」说的是不拿线去切割版面，别把造型线也一起去掉。 */
  &--outlined {
    color: var(--kima-color-primary);
    background: var(--kima-color-transparent);
    border: var(--kima-outline-width) solid var(--kima-color-outline);
  }

  /* 文字按钮：完全不上底，只靠文字色，最弱的一档。 */
  &--text {
    color: var(--kima-color-primary);
    background: var(--kima-color-transparent);
  }

  &--outlined:disabled,
  &--text:disabled {
    color: var(--kima-color-on-surface-38);
  }

  &__label,
  &__slot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
    border-right-color: var(--kima-color-transparent);
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
