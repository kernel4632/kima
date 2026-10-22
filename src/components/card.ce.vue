<!--
卡片：提供表面、描边和抬升三种容器样式，也支持可点击和分区插槽。
可点击的卡片和按钮一样有状态层、焦点环、涟漪和按下回弹。
调用示例：
  <kima-card variant="outlined" clickable aria-label="打开账户设置" @click="openSettings">
    <template #header><h2>账户设置</h2></template>
    <p>管理登录方式和通知偏好。</p>
    <template #footer><button type="button">查看详情</button></template>
  </kima-card>
-->
<script setup>
import { computed, ref, useAttrs } from "vue";
import { useNativeSlots } from "../utils/native-slots.js";
import { useRipple } from "../utils/ripple.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  variant: {
    type: String,
    default: "surface",
  },
  clickable: Boolean,
  disabled: Boolean,
});

const attrs = useAttrs();
const root = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);

// 可点击时整块亮一下。
// useRipple 内部会检查宿主有没有套 kima-ripple-host，没套就不亮，
// 所以这里直接调用即可，不用在这里再判断一次可点击性。
useRipple(root);

const cardVariant = computed(() => {
  const variants = ["surface", "outlined", "elevated"];
  return variants.includes(props.variant) ? props.variant : "surface";
});

function activate(event) {
  if (!props.clickable || props.disabled) return;
  // Slotted controls own their actions, including custom elements with shadow roots.
  const path = event.composedPath();
  const cardIndex = path.indexOf(event.currentTarget);
  if (path.slice(0, cardIndex).some((element) => element.matches?.("button, a, input, select, textarea, label, summary, [role='button'], [role='switch'], [role='checkbox'], [contenteditable], [tabindex]"))) {
    event.stopPropagation();
    return;
  }
}

function handleKeydown(event) {
  if (!props.clickable || props.disabled || event.target !== event.currentTarget || event.isComposing || event.repeat) return;

  if (event.key === "Enter") {
    event.preventDefault();
    event.currentTarget.click();
  } else if (event.key === " ") {
    event.preventDefault();
  }
}

function handleKeyup(event) {
  if (!props.clickable || props.disabled || event.target !== event.currentTarget || event.isComposing || event.key !== " ") return;
  event.preventDefault();
  event.currentTarget.click();
}
</script>

<template>
  <article
    class="kima-card"
    :class="[
      `kima-card--${cardVariant}`,
      {
        'kima-card--clickable': clickable,
        'kima-card--disabled': disabled,
      },
    ]"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable && !disabled ? 0 : undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    ref="root"
    v-bind="forwardedAttrs"
    @click="activate"
    @keydown="handleKeydown"
    @keyup="handleKeyup"
  >
    <header v-if="$slots.header || hasNativeSlot('header')" class="kima-card__header"><slot name="header" /></header>
    <div v-if="$slots.default || hasNativeSlot('default')" class="kima-card__body"><slot /></div>
    <footer v-if="$slots.footer || hasNativeSlot('footer')" class="kima-card__footer"><slot name="footer" /></footer>
  </article>
</template>

<style scoped lang="scss">
@use "../styles/mixins" as *;

.kima-card {
  box-sizing: border-box;
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--kima-space-m);
  padding: var(--kima-space-m);
  border: 0;
  border-radius: var(--kima-radius-m);
  color: var(--kima-color-on-surface);
  background: var(--kima-color-layer-2);
  font-family: var(--kima-font-family);
  transition:
    background-color var(--kima-duration-effects) var(--kima-curve-standard),
    border-color var(--kima-duration-effects) var(--kima-curve-standard),
    box-shadow var(--kima-duration-effects) var(--kima-curve-standard),
    opacity var(--kima-duration-effects) var(--kima-curve-standard),
    transform 320ms var(--kima-spring-gentle);
}

/* 描边卡片：透明底 + 一圈描边。线是这个变体的造型，不是用来分层次的。 */
.kima-card--outlined {
  background: var(--kima-color-transparent);
  border: var(--kima-outline-width) solid var(--kima-color-outline-variant);
}

.kima-card--elevated {
  background: var(--kima-color-layer-3);
  box-shadow: var(--kima-shadow-2);
}

/* 可点击的卡片和按钮用同一套反馈：状态层、焦点环、涟漪、按下回弹。
 * 这样"点得动的东西"在全库表现一致，不用各自记一套。 */
.kima-card--clickable {
  cursor: pointer;

  @include kima-state-layer;
  @include kima-focus-ring;
  @include kima-ripple-host;
  @include kima-press;
  // 保留按下回弹的同时，不能让 mixin 覆盖抬升/描边/禁用过渡。
  transition:
    transform 320ms var(--kima-spring-gentle),
    background-color var(--kima-duration-effects) var(--kima-curve-standard),
    color var(--kima-duration-effects) var(--kima-curve-standard),
    border-color var(--kima-duration-effects) var(--kima-curve-standard),
    box-shadow var(--kima-duration-effects) var(--kima-curve-standard),
    opacity var(--kima-duration-effects) var(--kima-curve-standard);
}

/* 不可点击的卡片只是降低了存在感，不缩放（那会让人以为能点）。 */
.kima-card--disabled {
  cursor: not-allowed;
  opacity: var(--kima-opacity-disabled);
}

.kima-card__header,
.kima-card__footer {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--kima-space-s);
}

/* DMS 标题：字号 Medium 14、字重 Medium、颜色 accent（primary）。 */
.kima-card__header {
  font-size: var(--kima-font-size-medium);
  font-weight: var(--kima-font-weight-medium);
  color: var(--kima-color-primary);
}

.kima-card__body {
  min-width: 0;
}

.kima-card__footer {
  justify-content: flex-end;
}
@media (prefers-reduced-motion: reduce) {
  .kima-card, .kima-card--clickable:active:not([aria-disabled="true"]) { transform: none; transition-duration: 1ms; }
}
</style>
