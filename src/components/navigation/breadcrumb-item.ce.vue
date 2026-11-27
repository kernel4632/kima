<!--
  面包屑项：M3E BreadcrumbItemElement.ts（259 行）+ BreadcrumbItemButtonElement.ts（273 行）
  逐行翻译。官方的 BreadcrumbItemButton 是 @internal 元素（不公开导出），KIMA 同样
  内联进本文件——模块边界与官方 index.ts 一致（只导出 breadcrumb / breadcrumb-item）。

  官方架构决策（照搬，非近似）：
    1. item 宿主 role="listitem"（Role mixin），内部 button 宿主再挂
       link / button / 无 role 三态（#updateRole 逐行：current → 无 role；
       href → link；其余 → button）。
    2. current 项不渲染伪链接 / touch——「当前位置」不是交互件（官方 render 的
       nothing 分支）。current && href 时点击吞掉默认导航（官方 #handleClick）。
    3. current 属性 = aria-current 全六值（page/step/location/date/time/true），
       非法值回落 null（官方 willUpdate 校验）；容器自动给末项写 current="page"。
    4. 分隔符画在 item 尾端（不是 item 之间），current 项不画
       （官方 #renderSeparator：nothing | .separator[aria-hidden] > svg）。
       官方 SVG 是 Material Symbols chevron_right 编译产物 → KIMA 用 Hugeicons
       ChevronRightIcon（官方 Grok chunk 明文 ChevronRightSmIcon 同形，见
       docs/grok-component-reference.md 八）。
    5. icon-only 判定：默认插槽仅一个元素且渲染盒 ≤28×28（官方 isIconOnly 逐行）；
       icon-only 时收缩为方形（宽=容器高），item-label 落 aria-label。
    6. 单行省略：官方 m3e-text-overflow 内联（flex:1 + min-width:0 + ellipsis，
       TextOverflowElement :host/.base 逐行）。
    7. 键盘激活：space/Enter 合成 click（官方 KeyboardClick mixin 逐行）。
    8. 禁用：aria-disabled + 移出 tab 序（官方 Disabled+Focusable mixins 逐行）。

  官网实测对表（2026-11-27，全部为 computed 运行值）：
    item 容器高 40（--m3e-breadcrumb-item-container-height 默认 40px）；
    字号 14 / 字重 500 / 行高 20 / 字距 0.1px；内距 0 12（space150）；
    圆角 9999（full 药丸）；图标 20px（--m3e-breadcrumb-item-icon-size）、gap 8（space100）；
    分隔符 24×24（--m3e-breadcrumb-separator-icon-size）、容器 min-width 8；
    链接色 primary、current 色 on-surface、icon-only 色 on-surface-variant；
    touch 命中 48px 高 × max(48px, 100%)；禁用色 on-surface 38%。
    密度档（--md-sys-density-scale -3..0）：28 / 32 / 36 / 40px。

  调用示例：
    <kima-breadcrumb-item href="/docs" target="_blank" rel="noopener">文档</kima-breadcrumb-item>
    <kima-breadcrumb-item item-label="首页"><kima-icon :icon="HomeIcon" /></kima-breadcrumb-item>
-->
<script setup>
import { computed, getCurrentInstance, inject, onBeforeUnmount, onMounted, ref, useAttrs, useHost, watch } from "vue";
import { ChevronRightIcon } from "@hugeicons/core-free-icons";
import KimaIcon from "../core/icon.ce.vue";
import { useRipple } from "../../utils/ripple.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  /* 官方 item-label：内部按钮的可访问名（icon-only 项必给）。 */
  itemLabel: { type: String, default: "" },
  /* 官方 disabled。 */
  disabled: { type: Boolean, default: false },
  /* 官方 current：BreadcrumbItemCurrent | null，非法值回落 null（willUpdate 逐行）。 */
  current: { type: String, default: null },
  /* 官方 href / target / rel / download（LinkButton mixin）。 */
  href: { type: String, default: "" },
  target: { type: String, default: "" },
  rel: { type: String, default: "" },
  download: { type: String, default: null },
});
const attrs = useAttrs();
const isCustomElement = Boolean(getCurrentInstance()?.ce);
const host = isCustomElement ? useHost() : null;
const forwardedAttrs = computed(() => (isCustomElement ? { ...attrs, id: undefined } : attrs));

const CURRENT_VALUES = { page: true, step: true, location: true, date: true, time: true, true: true };
/* 官方 isBreadcrumbItemCurrent 逐行。 */
function isCurrentValue(value) {
  return value != null && Object.hasOwn(CURRENT_VALUES, value);
}

/* 官方 willUpdate：非法 current 回落 null（props 通道）。 */
const currentAttr = computed(() => (isCurrentValue(props.current) ? props.current : null));

/* DOM 通道：容器把 current 写在宿主 data-current 属性上（官方容器 setAttribute
 * "current"；KIMA 用 data-current 避免与 props.current 属性入口冲突）。
 * props.current 未传时从宿主属性读——两通道合流。
 * CE：宿主即 kima-breadcrumb-item 元素；Vue：v-bind 把 data-current 落在 <li> 根上
 * （forwardedAttrs），此时 root（<li>）即载体。 */
const domCurrent = ref(null);
const effectiveCurrent = computed(() => currentAttr.value || domCurrent.value);
const isCurrent = computed(() => effectiveCurrent.value != null);

const root = ref(null);
let attrObserver = null;
function currentCarrier() {
  return isCustomElement ? host : root.value;
}
function readDomCurrent() {
  const v = currentCarrier()?.getAttribute("data-current");
  const next = isCurrentValue(v) ? v : null;
  if (next !== domCurrent.value) domCurrent.value = next;
}
onMounted(() => {
  readDomCurrent();
  attrObserver = new MutationObserver(readDomCurrent);
  const carrier = currentCarrier();
  if (carrier) attrObserver.observe(carrier, { attributes: true, attributeFilter: ["data-current"] });
});
onBeforeUnmount(() => attrObserver?.disconnect());
onBeforeUnmount(() => iconObserver?.disconnect());

/* 官方 update() 的 role/tabindex 管理（#updateRole + Disabled + Focusable 逐行）：
 * current → 无 role 无 tabindex；href → link；其余 → button，tabindex 0。 */
const role = computed(() => {
  if (isCurrent.value) return null;
  if (props.href) return "link";
  return "button";
});
const tabIndex = computed(() => (isCurrent.value || props.disabled ? undefined : 0));

/* ---------- 官方 KeyboardClick mixin（逐行）----------
 * space / Enter keyup 合成 click；disabled 拦截；focusout 清态。 */
const buttonRoot = ref(null);
const baseRoot = ref(null);
let keyPressed = false;
/* 涟漪亮层落在 __base 场地上（ripple-host mixin 挂在那层，见样式注释）。 */
useRipple(baseRoot);
function onKeyDown(e) {
  if (e.target !== e.currentTarget || props.disabled) {
    keyPressed = false;
    return;
  }
  if (e.key === " " || e.key === "Enter") keyPressed = true;
}
function onKeyUp(e) {
  if (e.target !== e.currentTarget || props.disabled || !keyPressed) {
    keyPressed = false;
    return;
  }
  keyPressed = false;
  /* 合成 click 不受信任（trusted=false），与官方注释一致。 */
  buttonRoot.value?.dispatchEvent(
    new MouseEvent("click", { cancelable: true, bubbles: true, composed: true }),
  );
}

/* 官方 #handleClick：current && href 时吞掉默认导航。 */
function onClick(e) {
  if (isCurrent.value && props.href) {
    e.preventDefault();
  }
}

/* 官方 renderPseudoLink（LinkButton mixin）：真 <a> 全铺（all:unset + 四边 0 + z-1），
 * tabindex=-1、aria-hidden，把原生链接语义/中键/右键交给浏览器。
 * disabled 或无 href 不渲染；右键（button 2）不 preventDefault（官方 #handleLinkPointerDown），
 * 让浏览器上下文菜单接管。 */
const pseudoLink = computed(() => (!props.disabled && props.href ? props.href : null));
/* 官方 safeRel 语义：_blank 自动补 noopener noreferrer（KIMA link 同规则）。 */
const safeRel = computed(() =>
  [...new Set(`${props.rel} ${props.target === "_blank" ? "noopener noreferrer" : ""}`.split(/\s+/).filter(Boolean))].join(" ") || undefined,
);
function onPseudoLinkPointerDown(e) {
  if (e.button !== 2) e.preventDefault();
}
function onPseudoLinkFocus(e) {
  e.target.blur();
  buttonRoot.value?.focus();
}

/* ---------- icon-only 判定（官方 isIconOnly + #handleSlotChange 逐行）----------
 * 官方量默认插槽的 assignedElements：仅一个元素且渲染盒 ≤28×28 即 icon-only。
 * 两条路：CE 模式投影内容在 .__overflow 里（slot 物理迁移）；Vue 模式同位。
 * 挂载后量一次；观察投影容器 childList（只在内容增删时重量，值不变不写 ref）。 */
const isIconOnly = ref(false);
function measureIconOnly() {
  const overflow = root.value?.querySelector(".kima-breadcrumb-item-button__overflow");
  if (!overflow) return;
  const nodes = [...overflow.children].filter((n) => n.tagName.toLowerCase() !== "template");
  const single = nodes.length === 1 ? nodes[0] : null;
  const next = single ? single.getBoundingClientRect().width <= 28 && single.getBoundingClientRect().height <= 28 : false;
  if (next !== isIconOnly.value) isIconOnly.value = next;
}
let iconObserver = null;
onMounted(() => {
  measureIconOnly();
  iconObserver = new MutationObserver(measureIconOnly);
  iconObserver.observe(root.value, { childList: true, subtree: true });
});

/* ---------- 自定义分隔符（官方 _setSeparator 逐行）----------
 * 官方容器把 separator slot 内容克隆进每个 item（cloneNode + part="separator"）。
 * 双通道：Vue 模式经 provide/inject 拿容器 #separator 插槽的 vnode（天然"每项一份"）；
 * CE 模式容器把宿主 separator 节点的 outerHTML 写进 item（setSeparator 通道）。
 * 空回落默认 chevron。等值不下发：容器 observer 会在 item 重渲染时重复调用。 */
const injectedSeparator = inject("kimaBreadcrumbSeparator", () => null);
const customSeparatorHtml = ref(null);
function setSeparator(nodes) {
  if ((nodes || null) === customSeparatorHtml.value) return;
  customSeparatorHtml.value = nodes || null;
}
defineExpose({ setSeparator });
</script>

<template>
  <li ref="root" v-bind="forwardedAttrs" class="kima-breadcrumb-item" :class="{ 'kima-breadcrumb-item--current': isCurrent }" role="listitem">
    <!-- 官方 BreadcrumbItemElement render() 同构：.base > item-button + separator。 -->
    <div class="kima-breadcrumb-item__base">
      <div
        ref="buttonRoot"
        class="kima-breadcrumb-item-button"
        :class="{ 'kima-breadcrumb-item-button--icon-only': isIconOnly, 'kima-breadcrumb-item-button--current': isCurrent }"
        :role="role || undefined"
        :tabindex="tabIndex"
        :aria-disabled="disabled && !isCurrent ? 'true' : undefined"
        :aria-label="itemLabel || undefined"
        @click="onClick"
        @keydown="onKeyDown"
        @keyup="onKeyUp"
      >
        <!-- 官方 .base[aria-current]：current 值透传到内容包裹层。 -->
        <div ref="baseRoot" class="kima-breadcrumb-item-button__base" :aria-current="effectiveCurrent || undefined">
          <!-- 官方 nothing 分支：current 不渲染伪链接与 touch。 -->
          <a
            v-if="pseudoLink && !isCurrent"
            class="kima-breadcrumb-item-button__pseudo-link"
            :href="pseudoLink"
            :target="target || undefined"
            :rel="safeRel"
            :download="download ?? undefined"
            tabindex="-1"
            aria-hidden="true"
            @pointerdown="onPseudoLinkPointerDown"
            @focus="onPseudoLinkFocus"
          ></a>
          <!-- 图标槽（官方 slot name="icon"，aria-hidden，flex none）。 -->
          <span class="kima-breadcrumb-item-button__icon" aria-hidden="true"><slot name="icon"></slot></span>
          <!-- 官方 m3e-text-overflow 内联：flex:1 + min-width:0 + ellipsis。 -->
          <span class="kima-breadcrumb-item-button__overflow"><slot></slot></span>
          <div v-if="!isCurrent" class="kima-breadcrumb-item-button__touch" aria-hidden="true"></div>
        </div>
      </div>
      <!-- 官方 #renderSeparator：current 不画分隔符。 -->
      <div v-if="!isCurrent" class="kima-breadcrumb-item__separator" aria-hidden="true">
        <template v-if="injectedSeparator()">
          <template v-for="(node, i) in injectedSeparator()" :key="i">
            <component :is="node" v-if="typeof node === 'object'" />
            <span v-else class="kima-breadcrumb-item__separator-custom" v-html="node"></span>
          </template>
        </template>
        <span v-else-if="customSeparatorHtml" class="kima-breadcrumb-item__separator-custom" v-html="customSeparatorHtml"></span>
        <KimaIcon v-else :icon="ChevronRightIcon" class="kima-breadcrumb-item__separator-icon" :size="24" />
      </div>
    </div>
  </li>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;

/* ============ BreadcrumbItemElement.ts :host / .base（103-136 逐行）============ */
.kima-breadcrumb-item {
  display: block;
  min-width: 0;
}
.kima-breadcrumb-item[hidden] {
  display: none;
}
.kima-breadcrumb-item__base {
  display: flex; /* 官方 .base */
  align-items: center;
  height: 100%;
}
/* 官方 :host(:not(:--icon-only)[current]) { min-width: 0 }：current 且非 icon-only
 * 允许被压到 0（省略号收尾的前提；官方实测 280px 挤压下 current 项收到 0 宽，
 * 前面的链接项保持完整——min-width:0 只给 current，非 current 靠内容撑）。
 * KIMA 结构差异：flex item 是宿主 kima-breadcrumb-item（display:block），
 * min-width:0 必须落在宿主上才参与 ol 的 flex 收缩——规则在本文件末尾的非 scoped 块。 */
.kima-breadcrumb-item--current:not(.kima-breadcrumb-item--icon-only) .kima-breadcrumb-item__base,
.kima-breadcrumb-item--current:not(.kima-breadcrumb-item--icon-only) .kima-breadcrumb-item-button,
.kima-breadcrumb-item--current:not(.kima-breadcrumb-item--icon-only) .kima-breadcrumb-item-button .kima-breadcrumb-item-button__base {
  min-width: 0;
}

/* 官方 .button { flex: 1 1 auto }。 */
.kima-breadcrumb-item-button {
  flex: 1 1 auto;
}

/* 分隔符容器（官方 .separator）：flex none、min-width 8、图标 24px。 */
.kima-breadcrumb-item__separator {
  flex: none;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 8px;
  color: var(--kima-breadcrumb-item-separator-color, var(--kima-color-on-surface));
}

/* ============ BreadcrumbItemButtonElement.ts styles（33-174 逐行）============
 * :host → .kima-breadcrumb-item-button；:state(--icon-only) → --icon-only 修饰类；
 * :host([current]) → --current 修饰类；:host(:disabled) → [aria-disabled="true"]。 */
.kima-breadcrumb-item-button {
  display: block;
  outline: none;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}
.kima-breadcrumb-item-button[hidden] {
  display: none;
}
.kima-breadcrumb-item-button__base {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  /* 官方 border-radius: var(--m3e-breadcrumb-item-shape, shape.corner.full)。 */
  border-radius: var(--kima-breadcrumb-item-shape, var(--kima-radius-full));
  /* 官方 height: calc(container-height + density.calc(-3))：官网实测默认 40px。 */
  height: var(--kima-breadcrumb-item-container-height, 40px);
  /* 官方 column-gap: var(--m3e-breadcrumb-item-icon-label-space, space100=8px)。 */
  column-gap: var(--kima-breadcrumb-item-icon-label-space, var(--kima-space-2));
  box-sizing: border-box;
  min-width: 0;
}
/* 官方 ::slotted([slot=icon])：font-size 20px、flex none（::slotted 需 :deep）。 */
.kima-breadcrumb-item-button__icon {
  font-size: var(--kima-breadcrumb-item-icon-size, 20px);
  display: inline-flex;
  flex: none;
}
:deep(.kima-breadcrumb-item-button__icon > *) {
  font-size: inherit !important;
  flex: none;
}

/* icon-only：收缩方形（宽=容器高），图标色 on-surface-variant。 */
.kima-breadcrumb-item-button--icon-only .kima-breadcrumb-item-button__base {
  width: var(--kima-breadcrumb-item-container-height, 40px);
  /* 官方 padding-inline: var(--m3e-breadcrumb-item-icon-padding-inline, 0px)。 */
  padding-inline: var(--kima-breadcrumb-item-icon-padding-inline, 0px);
}
.kima-breadcrumb-item-button--icon-only:not(.kima-breadcrumb-item-button--current):not([aria-disabled="true"]) .kima-breadcrumb-item-button__base {
  /* 官方 --m3e-breadcrumb-item-icon-color, onSurfaceVariant。 */
  color: var(--kima-breadcrumb-item-icon-color, var(--kima-color-on-surface-variant));
}

/* 非 icon-only 的排版（官方 typescale.standard.label.large 编译值：14/500/20/0.1px）。 */
.kima-breadcrumb-item-button:not(.kima-breadcrumb-item-button--icon-only) .kima-breadcrumb-item-button__base {
  font-family: var(--kima-font-family);
  font-size: var(--kima-breadcrumb-item-label-font-size, var(--kima-font-size-label-medium));
  font-weight: var(--kima-breadcrumb-item-label-font-weight, var(--kima-font-weight-medium));
  line-height: var(--kima-breadcrumb-item-label-line-height, 20px);
  letter-spacing: var(--kima-breadcrumb-item-label-tracking, 0.1px);
  /* 官方 padding-inline: var(--m3e-breadcrumb-item-label-padding-inline, space150=12px)。 */
  padding-inline: var(--kima-breadcrumb-item-label-padding-inline, 12px);
}
.kima-breadcrumb-item-button:not(.kima-breadcrumb-item-button--icon-only):not(.kima-breadcrumb-item-button--current):not([aria-disabled="true"]) .kima-breadcrumb-item-button__base {
  /* 官方 --m3e-breadcrumb-item-label-color, color.primary。 */
  color: var(--kima-breadcrumb-item-label-color, var(--kima-color-primary));
}

/* KIMA 交互反馈（AGENTS.md 分配规则：按钮类 = 状态层 + 焦点环 + 涟漪）。
 * 官方 state-layer/focus-ring/ripple 原语在此同栖到 __base。
 * icon-only 的状态层用 on-surface（官方 icon-hover-state-layer-color 默认 onSurface），
 * label 项用 primary（官方 label-hover-state-layer-color 默认 primary）——
 * 状态层 mixin 取 currentColor，即各分支的文字色，与官方逐档对应。 */
.kima-breadcrumb-item-button:not(.kima-breadcrumb-item-button--current):not([aria-disabled="true"]) .kima-breadcrumb-item-button__base {
  @include kima-state-layer;
  @include kima-focus-ring;
  @include kima-ripple-host;
  cursor: pointer;
  user-select: none;
  transition: color var(--kima-duration-effects) var(--kima-curve-standard);
}

/* current：on-surface 色、无交互（官方 :host([current]) .base）。 */
.kima-breadcrumb-item-button--current .kima-breadcrumb-item-button__base {
  /* 官方 --m3e-breadcrumb-item-last-color, onSurface。 */
  color: var(--kima-breadcrumb-item-last-color, var(--kima-color-on-surface));
  cursor: default;
}

/* 禁用：官方 color-mix(on-surface 38%, transparent) + aria-disabled。 */
.kima-breadcrumb-item-button[aria-disabled="true"]:not(.kima-breadcrumb-item-button--current) .kima-breadcrumb-item-button__base {
  color: color-mix(
    in srgb,
    var(--kima-breadcrumb-item-disabled-color, var(--kima-color-on-surface))
      var(--kima-breadcrumb-item-disabled-opacity, 38%),
    transparent
  );
  cursor: not-allowed;
}

/* 官方 .touch：绝对铺底 48px 命中区，宽 max(48px, 100%)。
 * 选择器前缀复用状态层那组 :not() ——kima-state-layer 的 `> *` 会给 __base 全部
 * 直接子代强设 position:relative + z-2（mixin 结构，官方 state-layer 原语无此规则），
 * 官方 touch 是 absolute 铺底；特异性必须压过 mixin 展开组，源序也在其后。 */
.kima-breadcrumb-item-button:not(.kima-breadcrumb-item-button--current):not([aria-disabled="true"]) .kima-breadcrumb-item-button__base > .kima-breadcrumb-item-button__touch {
  position: absolute;
  height: 48px;
  width: max(48px, 100%);
  margin: auto;
  z-index: 0;
  pointer-events: none;
}

/* 官方伪链接：all:unset + 四边铺满（把原生链接行为交给浏览器）。
 * 同 touch：前缀复用状态层选择器组压过 `> *` 的 z-2 提升与 position 强设
 * （官方无 `> *` 规则，伪链接 z-1 即最上层收点击）。 */
.kima-breadcrumb-item-button:not(.kima-breadcrumb-item-button--current):not([aria-disabled="true"]) .kima-breadcrumb-item-button__base > .kima-breadcrumb-item-button__pseudo-link {
  all: unset;
  display: block;
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  z-index: 3;
}

/* 官方 m3e-text-overflow 内联（TextOverflowElement :host/.base 逐行）。
 * 官方结构是 slot > .base span 承担 ellipsis；KIMA slot 投影可能是裸文本
 * （无包裹元素），截断属性直接放 __overflow 自身，两层职责合一。 */
.kima-breadcrumb-item-button__overflow {
  flex: 1 1 auto;
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 官方 @media (forced-colors: active)（164-173 逐行）。 */
@media (forced-colors: active) {
  .kima-breadcrumb-item-button:not(.kima-breadcrumb-item-button--current):not([aria-disabled="true"]) .kima-breadcrumb-item-button__base {
    color: LinkText;
    outline: 1px solid LinkText;
  }
  .kima-breadcrumb-item-button[aria-disabled="true"] .kima-breadcrumb-item-button__base {
    color: GrayText;
  }
}
</style>

<style lang="scss">
/* ============ 宿主元素规则（非 scoped）============
 * 官方 :host 直接落在宿主上；KIMA 的 flex item 是宿主 kima-breadcrumb-item
 * （display:block）。参与容器 ol 的 flex 收缩的 min-width 必须写在宿主层。
 * 先例：_tokens.scss 的 kima-tabs/kima-card 全局块。
 * 收缩模型（官方 280px 实测同构）：
 *   非 current 项 min-width 卡在 min-content（文字整行），压力不落在它们身上；
 *   current 项 min-width: 0 放行 → 全部收缩压力由 current 项吃下（可收到 0）。 */
kima-breadcrumb-item {
  display: block;
}
kima-breadcrumb-item[hidden] {
  display: none;
}
/* 官方 :host(:not(:--icon-only)[current]) { min-width: 0 }。
 * icon-only 的宿主态不可见（:state() 是 Lit 专享；icon-only 项 min-content 是
 * 40px 方块，几乎不可压，宿主层不再排除）。 */
kima-breadcrumb-item[data-current] {
  min-width: 0;
}
</style>
