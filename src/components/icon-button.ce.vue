<!--
图标按钮：为单个图标提供可访问的原生按钮行为和 KIMA 的外观，几何照 DMS 的 DankIconButton 对齐。
默认外观 standard（透明底、图标用 onSurfaceVariant）；尺寸 s 40、m 56。
调用示例：
  <kima-icon-button aria-label="搜索" title="搜索" />
  <kima-icon-button aria-label="设置" variant="outlined" :icon="Settings01Icon" />
  <kima-icon-button aria-label="收藏" variant="filled" :icon="HeartIcon" />
  <kima-icon-button aria-label="自定义动作"><MyIcon /></kima-icon-button>
-->
<script setup>
import { computed, getCurrentInstance, ref, useAttrs } from "vue";
import KimaIcon from "./icon.ce.vue";
import { Settings01Icon } from "@hugeicons/core-free-icons";
import { useRipple } from "../utils/ripple.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  icon: {
    type: [Object, Array],
    default: null,
  },
  label: {
    type: String,
    default: "",
  },
  variant: {
    type: String,
    default: "standard",
  },
  size: {
    type: String,
    default: "default",
  },
  disabled: Boolean,
  loading: Boolean,
  type: {
    type: String,
    default: "button",
  },
});

const attrs = useAttrs();
const root = ref(null);
const isCustomElement = Boolean(getCurrentInstance()?.ce);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);

// 点击时整块亮一下。
useRipple(root);

// standard 是 DMS 的默认外观，text 作为等价别名保留。
const buttonVariant = computed(() => {
  const variants = ["standard", "filled", "tonal", "outlined", "text"];
  return variants.includes(props.variant) ? props.variant : "standard";
});

const buttonSize = computed(() => {
  const sizes = ["small", "default", "large"];
  return sizes.includes(props.size) ? props.size : "default";
});

// Native ariaLabel/title remain browser attributes rather than conflicting CE props.
function accessibleLabel() {
  return props.label || attrs["aria-label"] || attrs.ariaLabel || attrs.title || "图标按钮";
}
const buttonIcon = computed(() => props.icon || Settings01Icon);
// DMS DankIconButton iconSize 固定为 iconSize 24；small 是 KIMA 附带档位，取 20。
const iconSize = computed(() => ({ small: 20, default: 24, large: 24 })[buttonSize.value]);

</script>

<template>
  <button
    ref="root"
    v-bind="forwardedAttrs"
    class="kima-icon-button"
    :class="[
      `kima-icon-button--${buttonVariant}`,
      `kima-icon-button--${buttonSize}`,
    ]"
    :type="type"
    :disabled="disabled || loading"
    :aria-label="accessibleLabel()"
    :aria-busy="loading || undefined"
    :title="attrs.title || accessibleLabel()"
  >
    <span class="kima-icon-button__visual" aria-hidden="true">
      <Transition name="kima-fade"><span v-if="loading" key="spinner" class="kima-icon-button__spinner"></span><span v-else key="icon" class="kima-icon-button__icon"><slot><KimaIcon :icon="buttonIcon" :size="iconSize" /></slot></span></Transition>
    </span>
  </button>
</template>

<style scoped lang="scss">
@use "../styles/mixins" as *;

.kima-icon-button {
  /* DMS DankIconButton：s 档 40×40、图标 24、横向留白 8、整圆。 */
  width: var(--kima-button-height-s);
  height: var(--kima-button-height-s);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  border-radius: var(--kima-radius-full);
  box-sizing: border-box;
  font-family: var(--kima-font-family);
  /* standard 外观：透明底，图标用 onSurfaceVariant。 */
  color: var(--kima-color-on-surface-variant);
  background: var(--kima-color-transparent);
  cursor: pointer;
  user-select: none;

  @include kima-state-layer;
  @include kima-focus-ring;
  @include kima-ripple-host;
  @include kima-press;

  /* DMS 禁用：图标降到 onSurface_38。 */
  &:disabled {
    color: var(--kima-color-on-surface-38);
    cursor: not-allowed;
  }

  &--small {
    width: var(--kima-button-height-xs);
    height: var(--kima-button-height-xs);
  }

  /* DMS m 档 56×56，图标仍为 24。 */
  &--large {
    width: var(--kima-button-height-m);
    height: var(--kima-button-height-m);
  }

  &--filled {
    color: var(--kima-color-on-primary);
    background: var(--kima-color-primary);
  }

  &--filled:disabled {
    color: var(--kima-color-on-surface-38);
    background: var(--kima-color-on-surface-12);
  }

  /* 柔和档：主色染过的浅底，跟描边档的灰底区分开。 */
  &--tonal {
    color: var(--kima-color-primary);
    background: var(--kima-color-primary-soft);
  }

  &--tonal:disabled {
    color: var(--kima-color-on-surface-38);
    background: var(--kima-color-on-surface-12);
  }

  /* 描边档：透明底 + 一圈可见的描边。
   * 线是这个变体的造型，不是用来分层次的，不要当成"多余的边框"删掉。 */
  &--outlined {
    color: var(--kima-color-on-surface);
    background: var(--kima-color-transparent);
    border: var(--kima-outline-width) solid var(--kima-color-outline);
  }

  &__visual { display: grid; place-items: center; }
  &__visual > * { grid-area: 1 / 1; }

  &__icon,
  &__spinner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  /* DMS DankSpinner：直径取图标，描边 2，转一圈 1568ms。 */
  &__spinner {
    width: 24px;
    height: 24px;
    border: 2px solid currentColor;
    border-right-color: var(--kima-color-transparent);
    border-radius: var(--kima-radius-full);
    animation: kima-icon-button-spin var(--kima-spinner-duration) linear infinite;
  }

  &--small .kima-icon-button__spinner {
    width: 20px;
    height: 20px;
  }
}

@keyframes kima-icon-button-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
