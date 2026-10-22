<!--
提示框：在鼠标悬停或键盘聚焦触发器时显示说明，也支持由 open 属性控制显示状态。
调用示例：
  <kima-tooltip text="保存当前内容">
    <template #trigger="{ triggerAttrs }">
      <button type="button" v-bind="triggerAttrs">保存</button>
    </template>
  </kima-tooltip>
  <kima-tooltip position="top" :open="showHint">
    <template #trigger><span>账户状态</span></template>
    <template #content>当前账户已验证</template>
  </kima-tooltip>
-->
<script setup>
import { Comment, computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, useSlots, watch } from "vue";
import { useNativeSlots } from "../utils/native-slots.js";
import { presenceTransition } from "../utils/motion.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  text: {
    type: String,
    default: "",
  },
  position: {
    type: String,
    default: "bottom",
  },
  open: {
    type: Boolean,
    default: undefined,
  },
  delay: {
    type: Number,
    default: 500,
  },
  disabled: Boolean,
});

const slots = useSlots();
const attrs = useAttrs();
const localOpen = ref(false);
const root = ref(null);
const triggerRoot = ref(null);
const hovered = ref(false);
const focused = ref(false);
const dismissed = ref(false);
const tooltipId = `kima-tooltip-${useId()}`;
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
let openTimer = null;
let describedElement = null;
let ownerDocument;

const controlled = computed(() => props.open !== undefined);
const hasSlotContent = computed(() => slots.content?.().some((vnode) => {
  if (vnode.type === Comment) return false;
  return typeof vnode.children !== "string" || vnode.children.trim().length > 0;
}) || hasNativeSlot("content"));
const hasContent = computed(() => Boolean(props.text.trim()) || hasSlotContent.value);
const tooltipOpen = computed(() => {
  if (props.disabled || dismissed.value || !hasContent.value) return false;
  return controlled.value ? props.open : localOpen.value;
});
const tooltipPosition = computed(() => {
  const positions = ["top", "right", "bottom", "left"];
  return positions.includes(props.position) ? props.position : "bottom";
});
const tooltipDelay = computed(() => Math.max(0, Number.isFinite(props.delay) ? props.delay : 0));
const triggerAttrs = computed(() => ({
  "aria-describedby": tooltipOpen.value ? tooltipId : undefined,
}));

function clearOpenTimer() {
  if (openTimer === null) return;
  clearTimeout(openTimer);
  openTimer = null;
}

function rememberDescription(element) {
  if (!element || typeof element.setAttribute !== "function") return;
  if (describedElement === element) return;

  restoreDescription();
  describedElement = element;
  const existing = (element.getAttribute("aria-describedby") || "").split(/\s+/).filter((value) => value && value !== tooltipId);
  const descriptions = [...existing, tooltipId].join(" ");
  element.setAttribute("aria-describedby", descriptions);
}

function restoreDescription() {
  if (!describedElement) return;
  // Remove only our id, preserving descriptions changed by the consumer while open.
  const existing = (describedElement.getAttribute("aria-describedby") || "").split(/\s+/).filter((value) => value && value !== tooltipId);
  if (existing.length === 0) describedElement.removeAttribute("aria-describedby");
  else describedElement.setAttribute("aria-describedby", existing.join(" "));
  describedElement = null;
}

function hideTooltip() {
  clearOpenTimer();
  localOpen.value = false;
}

function showTooltip(immediate = false) {
  dismissed.value = false;
  if (controlled.value || props.disabled || !hasContent.value) return;
  clearOpenTimer();
  if (immediate || tooltipDelay.value === 0) {
    localOpen.value = true;
    return;
  }
  openTimer = setTimeout(() => {
    localOpen.value = true;
    openTimer = null;
  }, tooltipDelay.value);
}

function handleMouseenter() {
  hovered.value = true;
  showTooltip(focused.value);
}

function handleMouseleave() {
  hovered.value = false;
  if (!focused.value) hideTooltip();
}

function handleFocusin(event) {
  focused.value = true;
  showTooltip(true);
  if (tooltipOpen.value) rememberDescription(event.target);
}

function handleFocusout(event) {
  if (event.currentTarget?.contains(event.relatedTarget)) return;
  focused.value = false;
  if (!hovered.value) hideTooltip();
}

function handleEscape(event) {
  if (event.key !== "Escape" || event.isComposing || (!tooltipOpen.value && openTimer === null)) return;
  event.preventDefault();
  event.stopPropagation();
  dismissed.value = true;
  hideTooltip();
}

watch(() => props.open, () => { dismissed.value = false; });
watch([() => props.disabled, hasContent], () => {
  if (props.disabled || !hasContent.value) hideTooltip();
});

watch(tooltipOpen, (open) => {
  if (!open) {
    restoreDescription();
    return;
  }
  nextTick(() => {
    if (!tooltipOpen.value) return;
    const target = triggerRoot.value?.querySelector("button, a, input, select, textarea, [tabindex]:not([tabindex='-1'])");
    if (target) rememberDescription(target);
  });
}, { immediate: true });

onMounted(() => {
  ownerDocument = triggerRoot.value.ownerDocument;
  ownerDocument.addEventListener("keydown", handleEscape);
  if (tooltipOpen.value) {
    nextTick(() => {
      if (!tooltipOpen.value) return;
      const target = triggerRoot.value?.querySelector("button, a, input, select, textarea, [tabindex]:not([tabindex='-1'])");
      if (target) rememberDescription(target);
    });
  }
});

onBeforeUnmount(() => {
  ownerDocument.removeEventListener("keydown", handleEscape);
  clearOpenTimer();
  restoreDescription();
});
</script>

<template>
  <span
    ref="root"
    v-bind="forwardedAttrs"
    class="kima-tooltip"
    :class="{ 'kima-tooltip--open': tooltipOpen, 'kima-tooltip--disabled': disabled }"
    @mouseenter="handleMouseenter"
    @mouseleave="handleMouseleave"
    @focusin="handleFocusin"
    @focusout="handleFocusout"
  >
    <span
      ref="triggerRoot"
      class="kima-tooltip__trigger"
      :aria-describedby="tooltipOpen ? tooltipId : undefined"
    >
      <slot
        name="trigger"
        :trigger-attrs="triggerAttrs"
        :attrs="triggerAttrs"
        :open="tooltipOpen"
      >
        <slot />
      </slot>
    </span>

    <!-- 出场/退场走全库共用的 kima-popup 过渡（定义在 _tokens.scss）。 -->
    <Transition name="kima-popup" v-bind="presenceTransition">
      <span
        v-if="tooltipOpen"
        :id="tooltipId"
        class="kima-tooltip__content"
        :class="`kima-tooltip__content--${tooltipPosition}`"
        role="tooltip"
      >
        <slot name="content">{{ text }}</slot>
      </span>
    </Transition>
  </span>
</template>

<style scoped lang="scss">
.kima-tooltip {
  position: relative;
  display: inline-flex;
  max-width: 100%;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
}

.kima-tooltip--disabled {
  cursor: default;
  opacity: var(--kima-opacity-disabled);
}

.kima-tooltip__trigger {
  display: inline-flex;
  min-width: 0;
  max-width: 100%;
}

.kima-tooltip__content {
  position: absolute;
  z-index: 20;
  width: max-content;
  max-width: min(320px, calc(100vw - 24px));
  padding: var(--kima-space-2) var(--kima-space-3);
  border-radius: 4px;
  color: var(--kima-color-on-surface);
  /* 弹层是实色：它是浮在内容之上的一层，必须挡住背后，不能透。 */
  background: var(--kima-color-popup);
  box-shadow: var(--kima-elevation-3);
  font-size: var(--kima-font-size-sm);
  line-height: 1.4;
  white-space: normal;
  pointer-events: none;
}

.kima-tooltip__content--bottom {
  top: calc(100% + var(--kima-space-2));
  left: 50%;
  transform: translateX(-50%);
}

.kima-tooltip__content--top {
  bottom: calc(100% + var(--kima-space-2));
  left: 50%;
  transform: translateX(-50%);
}

.kima-tooltip__content--right {
  top: 50%;
  left: calc(100% + var(--kima-space-2));
  transform: translateY(-50%);
}

.kima-tooltip__content--left {
  top: 50%;
  right: calc(100% + var(--kima-space-2));
  transform: translateY(-50%);
}

</style>
