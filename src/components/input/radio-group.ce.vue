<!-- 单选组：M3E radio-group 官方源码逐行复刻（matraic/m3e RadioElement.ts + RadioGroupElement.ts
  + PseudoRadioElement.ts + StateLayer/FocusRing/Ripple 三原语 + State/Motion/DensityToken）。
  行为层保留原生 radio（键盘箭头游标、表单、分组 aria 由浏览器与组件 onKey 负责）；
  视觉层按官方结构：40px 圆形场地（state layer + focus ring + ripple + 48 touch + 20px SVG 图标）。
  调用示例：
  <kima-radio-group label="配送方式" name="delivery" :options="options" required />
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useId } from "vue";
import { useInputAttrs, useInputState } from "../../utils/input-state.js";
import KimaIcon from "../core/icon.ce.vue";
defineOptions({ inheritAttrs: false });
const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  options: { type: Array, default: () => [] },
  label: String,
  name: String,
  disabled: Boolean,
  required: Boolean,
  orientation: { type: String, default: "vertical" },
});
const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null);
/* 每个组独立 mask id：SVG id 全局，同页多组共用会互相覆盖。useId 保证 SSR/客户端一致。 */
const uid = useId();
/* 官方 RadioGroupElement 的 observedAttributes 末尾正好只多了 "aria-invalid"（116 行）：
 * 组的无效态要能运行时变化（表单校验后标红），所以这里同样单独盯这个属性。
 * 自定义元素模式下宿主属性运行时改动不会触发 attrs 重渲染，只能自己观察；
 * Vue 组件模式下属性落在 fieldset 上，盯 fieldset 即可（挂载后 tracked 接管）。 */
const ariaInvalid = ref(undefined);
const tracked = ref(false);
const resolvedInvalid = computed(() => tracked.value ? ariaInvalid.value : (controlAttrs.value["aria-invalid"] ?? undefined));
let mutations;
onMounted(() => {
  const host = root.value?.parentElement?.tagName === "KIMA-RADIO-GROUP" ? root.value.parentElement : root.value;
  ariaInvalid.value = host?.getAttribute("aria-invalid") ?? undefined;
  tracked.value = true;
  mutations = new MutationObserver(() => {
    ariaInvalid.value = host?.getAttribute("aria-invalid") ?? undefined;
  });
  mutations.observe(host, { attributes: true, attributeFilter: ["aria-invalid"] });
});
onBeforeUnmount(() => mutations?.disconnect());
const { attrs, controlAttrs } = useInputAttrs();
const items = computed(() => props.options.map((o) => typeof o === "object" ? o : { value: o, label: String(o) }));
const { local, update } = useInputState(props, emit, root);
const activeIndex = computed(() => {
  const index = items.value.findIndex((o) => o.value === local.value && !o.disabled);
  return index < 0 ? items.value.findIndex((o) => !o.disabled) : index;
});
function onKey(event) {
  if (props.disabled || !["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const enabled = [...root.value.querySelectorAll('input[type="radio"]:not(:disabled)')];
  if (!enabled.length) return;
  const rtl = getComputedStyle(root.value).direction === "rtl";
  const backwards = event.key === "ArrowUp" || event.key === (rtl ? "ArrowRight" : "ArrowLeft");
  const current = enabled.indexOf(event.target);
  const index = event.key === "Home" ? 0 : event.key === "End" ? enabled.length - 1 : (current + (backwards ? -1 : 1) + enabled.length) % enabled.length;
  enabled[index].focus();
  enabled[index].click();
}

/* ============ 涟漪（RippleElement.ts 53-106 + 169-218 + 282-290 逐行） ============
 * 官方 radio 的 ripple：场地 = .base（inset 0、overflow hidden、圆角继承 = 40px 圆）；
 * 每次 show 新建一个 .ripple 节点，centered → 直径取场地对角线（40px 圆 = √(40²+40²) = 56.57px，
 * 官网实测 56.5625）、blur 20px、opacity 10%、enter 450ms linear scale(0)→scale(4)，
 * 播完转 persistent（停在 scale 4）；松手后加 exit（350ms cubic-bezier(0,0,.2,.1) 淡出）再摘除；
 * 最小按压 225ms（PressedController.minPressedDuration 默认档，官方 radio 显式传 225）。 */
const PRESSED_MIN = 225;
function rippleAt(item) {
  const host = item.querySelector(".kima-radio-group__ripple");
  if (!host) return;
  const base = item.querySelector(".kima-radio-group__base");
  const bounds = base.getBoundingClientRect();
  const size = Math.hypot(bounds.width, bounds.height);
  const wave = document.createElement("span");
  wave.className = "kima-radio-group__ripple-wave";
  wave.style.width = `${size}px`;
  wave.style.height = `${size}px`;
  wave.style.marginLeft = `${-size / 2}px`;
  wave.style.marginTop = `${-size / 2}px`;
  wave.addEventListener("animationend", () => wave.classList.add("pressed"), { once: true });
  host.append(wave);
  const started = performance.now();
  const release = () => {
    const wait = Math.max(0, PRESSED_MIN - (performance.now() - started));
    setTimeout(() => {
      if (!wave.isConnected) return;
      wave.classList.add("exit");
      wave.addEventListener("transitionend", () => wave.remove(), { once: true });
    }, wait);
  };
  window.addEventListener("pointerup", release, { once: true });
  window.addEventListener("pointercancel", release, { once: true });
}
function pressRadio(event) {
  if (props.disabled || event.button > 0) return;
  const item = event.target.closest?.(".kima-radio-group__item");
  if (!item || item.classList.contains("kima-radio-group__item--disabled")) return;
  rippleAt(item);
}
</script>
<template>
  <fieldset ref="root" v-bind="controlAttrs" :class="['kima-radio-group', attrs.class]" :style="attrs.style" role="radiogroup" :aria-label="controlAttrs['aria-label'] || label" :aria-required="required || undefined" :aria-orientation="orientation" :aria-invalid="resolvedInvalid" :disabled="disabled" :aria-disabled="disabled || undefined" @keydown="onKey" @pointerdown="pressRadio">
    <label v-for="(item, index) in items" :key="item.value" class="kima-radio-group__item" :class="{ 'kima-radio-group__item--disabled': disabled || item.disabled }">
      <input class="kima-radio-group__input" type="radio" :name="name" :value="item.value" :checked="local === item.value" :disabled="disabled || item.disabled" :required="required" :tabindex="index === activeIndex ? 0 : -1" @input.stop @change.stop="update(item.value)" />
      <!-- 官方 render() 同构：base > state-layer + focus-ring + ripple + touch + wrapper(icon)。 -->
      <span class="kima-radio-group__base">
        <span class="kima-radio-group__state-layer" aria-hidden="true"></span>
        <span class="kima-radio-group__focus-ring" aria-hidden="true"><span class="kima-radio-group__outline"></span></span>
        <span class="kima-radio-group__ripple" aria-hidden="true"></span>
        <span class="kima-radio-group__touch" aria-hidden="true"></span>
        <span class="kima-radio-group__wrapper" aria-hidden="true">
          <!-- RadioElement.ts 331-338 逐字：mask 挖掉 r8，留 r10 外环；inner 圆 r5（选中点直径 10）。 -->
          <svg viewBox="0 0 20 20">
            <mask :id="`${uid}-cutout-${index}`">
              <rect width="100%" height="100%" fill="white"></rect>
              <circle cx="10" cy="10" r="8" fill="black"></circle>
            </mask>
            <circle class="kima-radio-group__outer" cx="10" cy="10" r="10" :mask="`url(#${uid}-cutout-${index})`"></circle>
            <circle class="kima-radio-group__inner" cx="10" cy="10" r="5"></circle>
          </svg>
        </span>
      </span>
      <slot name="option" :item="item" :selected="local === item.value" :disabled="disabled || item.disabled">
        <span class="kima-radio-group__copy">
          <KimaIcon v-if="item.icon" :icon="item.icon" :size="20" aria-hidden="true" />
          <span class="kima-radio-group__label">{{ item.label }}<small v-if="item.description">{{ item.description }}</small></span>
        </span>
      </slot>
    </label>
  </fieldset>
</template>
<style scoped lang="scss">
@use "../../styles/mixins" as *;

/* RadioGroupElement.ts 120-127：:host { display: inline-flex }。KIMA 增 orientation 档：
 * 官方示例是单行（四个 label 并排），vertical 保留旧 API 的整列排法。 */
.kima-radio-group {
  box-sizing: border-box;
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-body-large);
  line-height: 1.4;

  &[aria-orientation="horizontal"] {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  &[aria-disabled="true"] {
    cursor: not-allowed;
  }

  /* 官方 :host 的 -webkit-tap-highlight / touch-callout / user-select 三件套。 */
  &__item {
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    -webkit-touch-callout: none;
    user-select: none;
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    color: inherit;

    &--disabled {
      cursor: default;
      /* Labelled.ts 96-97：禁用标签整行 color = onSurface 38%。 */
      color: var(--kima-radio-disabled-icon-color);
    }
  }

  /* 原生 radio：保留键盘/表单/分组语义，视觉隐藏但整块 label 可点（官方自绘点击面等价）。 */
  &__input {
    position: absolute;
    inset: 0;
    z-index: 3;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: inherit;
  }

  /* .base（RadioElement 169-180）：40px 圆场地，实际尺寸扣 density：calc(40 + max(-3, scale) * 4)。 */
  &__base {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    box-sizing: border-box;
    width: calc(var(--kima-radio-container-size, 40px) + calc(max(-3, var(--kima-radio-density-scale, 0)) * var(--kima-radio-density-size, 4px)));
    height: calc(var(--kima-radio-container-size, 40px) + calc(max(-3, var(--kima-radio-density-scale, 0)) * var(--kima-radio-density-size, 4px)));
    border-radius: 50%;
    contain: layout style;
    color: var(--kima-radio-unselected-icon-color);
    /* 官方把三态色写在 .base 的 --m3e-state-layer-*-color / --m3e-ripple-color 上
     * （RadioElement 199-210）：未选 onSurface，选中 primary。这里同构，
     * state layer 与涟漪共用同一条自定义属性，选中只改变量不改规则。
     * 官方 base 无过渡：选中换色是瞬时（官网实测 transition 0s）。 */
    --kima-radio-state-color: var(--kima-color-on-surface);
  }

  /* .touch（181-186）：48×48 命中区，视觉小、命中大。 */
  &__touch {
    position: absolute;
    width: var(--kima-radio-touch-target, 48px);
    height: var(--kima-radio-touch-target, 48px);
    margin: auto;
  }

  /* .wrapper（187-192）：20px 图标。 */
  &__wrapper {
    box-sizing: border-box;
    pointer-events: none;
    position: relative;
    width: var(--kima-radio-icon-size, 20px);
    height: var(--kima-radio-icon-size, 20px);
    line-height: 0;
  }

  &__wrapper svg {
    display: block;
    width: 100%;
    height: 100%;
  }

  /* .circle（193-195）：fill: currentColor。 */
  &__outer,
  &__inner {
    fill: currentColor;
  }

  /* RadioElement 196-198：未选中时内圈只改 opacity，无过渡（官网实测 0s）。 */
  &__inner {
    opacity: 0;
  }

  &__copy {
    flex: none;
  }

  /* 选中配色（RadioElement 205-210）：primary。 */
  &__item:has(> .kima-radio-group__input:checked) &__base {
    color: var(--kima-radio-selected-icon-color);
    --kima-radio-state-color: var(--kima-color-primary);
  }

  &__item:has(> .kima-radio-group__input:checked) &__inner {
    opacity: 1;
  }

  /* 禁用 base：onSurface 38%（RadioElement 211-213）。官方这条写在 [checked] 之后靠源序取胜；
   * KIMA 的选中规则带 :has() 权重更高，所以补一条同权重的禁用+选中（官网实测禁用恒 38%）。 */
  &__item--disabled &__base,
  &__item--disabled:has(> .kima-radio-group__input:checked) &__base {
    color: var(--kima-radio-disabled-icon-color);
  }

  /* ---- state layer（StateLayerElement 57-78 + StateLayerToken 逐行）----
   * 40px 圆、background-color 过渡 medium1 250ms + standard；hover 8% / focus 10%，
   * 色彩取基地变量（未选 onSurface / 选中 primary / 无效 error，官方 RadioElement 199-218）。
   * hover 由宿主 label 驱动（官方 HoverController 显式 observe(labels)）：鼠标停在文字上
   * 光圈也亮；绑 base 自身 :hover 的话文字区就灭灯——checkbox 第 N 轮修过的同一个坑。 */
  &__state-layer {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background-color: transparent;
    transition: background-color var(--kima-radio-state-duration, 250ms) var(--kima-curve-standard);
  }

  &__item:not(.kima-radio-group__item--disabled):hover &__base &__state-layer {
    background-color: color-mix(in srgb, var(--kima-radio-state-color) calc(var(--kima-radio-state-hover-opacity, 0.08) * 100%), transparent);
  }

  &__item:has(> .kima-radio-group__input:focus-visible) &__base &__state-layer {
    background-color: color-mix(in srgb, var(--kima-radio-state-color) calc(var(--kima-radio-state-focus-opacity, 0.1) * 100%), transparent);
  }

  /* 禁用：state layer / focus ring / ripple 官方 disabled 属性直接摘掉（RadioElement 321-323）。 */
  &__item--disabled &__base &__state-layer {
    background-color: transparent;
  }

  /* 无效态（RadioGroupElement 188-193：组的 aria-invalid 反射到每个 radio）：
   * state layer / 涟漪 / 图标全部换 error（RadioElement 214-219）。官方源序 invalid 在
   * checked 之后；KIMA 的 checked 规则带 :has() 权重更高，所以显式补一条选中+无效。 */
  &[aria-invalid="true"] &__base,
  &[aria-invalid="true"] &__item:has(> .kima-radio-group__input:checked) &__base {
    color: var(--kima-color-error);
    --kima-radio-state-color: var(--kima-color-error);
  }

  /* ---- focus ring（FocusRingElement 66-108 + FocusRingToken 逐行）----
   * 3px、offset 2px、long2 = 500ms、grow-shrink 到 2 倍（50% 处 outline-width 6px）。 */
  &__focus-ring {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    outline: none;
  }

  &__outline {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    z-index: 1;
    outline-color: var(--kima-radio-focus-ring-color, var(--kima-color-focus-ring));
    outline-width: var(--kima-radio-focus-ring-thickness, 3px);
    outline-offset: var(--kima-radio-focus-ring-offset, 2px);
    visibility: visible;
  }

  &__item:has(> .kima-radio-group__input:focus-visible) &__outline {
    outline-style: solid;
    animation: kima-radio-ring-grow-shrink var(--kima-radio-focus-ring-duration, 500ms);
  }

  /* ---- ripple 场地（RippleElement 53-75 的 :host）----
   * absolute inset 0、overflow hidden、圆角继承。 */
  &__ripple {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    overflow: hidden;
    pointer-events: none;
    z-index: 1;
  }

  /* wave 是 JS 动态插入的节点（官方 show() 也每次新建），没有 data-v 标记，
   * 样式必须用 :deep 下发——与 utils/ripple.js 的 .kima-ripple 同理。 */
  :deep(.kima-radio-group__ripple-wave) {
    display: block;
    position: absolute;
    top: 50%;
    left: 50%;
    border-radius: 50%;
    filter: blur(var(--kima-radio-ripple-blur, 20px));
    background-color: var(--kima-radio-state-color, currentColor);
    opacity: var(--kima-radio-ripple-opacity, 0.1);
    pointer-events: none;
    transform: scale(0);
    will-change: transform, opacity;
    animation: kima-radio-ripple var(--kima-radio-ripple-enter-duration, 450ms) linear;
  }

  :deep(.kima-radio-group__ripple-wave.pressed) {
    transform: scale(4);
  }

  :deep(.kima-radio-group__ripple-wave.exit) {
    transition: opacity var(--kima-radio-ripple-exit-duration, 350ms) cubic-bezier(0, 0, 0.2, 0.1);
    opacity: 0;
  }

  /* ---- 文案（官方 label 无内边距、无行底洗色；文字紧接 40px 场地）---- */
  &__copy {
    display: inline-flex;
    align-items: center;
    gap: var(--kima-space-1);
    min-width: 0;
  }

  &__label {
    display: inline;
    min-width: 0;

    small {
      display: block;
      color: var(--kima-color-on-surface-variant);
      font-size: var(--kima-font-size-body-small);
    }
  }
}

@keyframes kima-radio-ripple {
  to {
    transform: scale(4);
  }
}

@keyframes kima-radio-ring-grow-shrink {
  50% {
    outline-width: calc(var(--kima-radio-focus-ring-thickness, 3px) * var(--kima-radio-focus-ring-growth, 2));
  }
}

@media (prefers-reduced-motion: reduce) {
  .kima-radio-group__state-layer {
    transition: none;
  }

  :deep(.kima-radio-group__ripple-wave) {
    transform: scale(4);
    animation-duration: 90ms;
  }

  :deep(.kima-radio-group__ripple-wave.exit) {
    transition-duration: 10ms;
  }

  .kima-radio-group__outline {
    animation: none !important;
  }
}

@media (forced-colors: active) {
  .kima-radio-group__item,
  .kima-radio-group__base {
    color: CanvasText;
  }

  .kima-radio-group__item--disabled,
  .kima-radio-group__item--disabled .kima-radio-group__base {
    color: GrayText;
  }

  .kima-radio-group__outline {
    outline-color: Highlight;
  }

  .kima-radio-group__ripple {
    display: none;
  }
}
</style>
