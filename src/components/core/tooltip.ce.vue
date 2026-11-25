<!--
提示框：行为层全由 Reka Tooltip 承担（悬停/聚焦触发、Esc 关闭、延迟、aria 描述管理、
视口碰撞翻转），KIMA 只保留皮肤和 Motion 进出场。
position 支持的取值映射到 Reka 的 side；旧值不变。
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
import { Comment, computed, ref, useAttrs, useId, useSlots, watch } from "vue";import { TooltipRoot, TooltipTrigger, TooltipPortal, TooltipContent, TooltipProvider } from "reka-ui";
import { AnimatePresence, motion } from "motion-v";
import { useNativeSlots } from "../../utils/native-slots.js";

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
const root = ref(null);
const tooltipId = `kima-tooltip-${useId()}`;
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);

/* Reka 的真实开关状态（受控与非受控都从这读）：内部渲染由此驱动，
 * 我们不再自己判断"该不该显示"。 */
const hasSlotContent = computed(() => slots.content?.().some((vnode) => {
  if (vnode.type === Comment) return false;
  return typeof vnode.children !== "string" || vnode.children.trim().length > 0;
}) || hasNativeSlot("content"));
const hasContent = computed(() => Boolean(props.text.trim()) || hasSlotContent.value);
const disabledOrEmpty = computed(() => props.disabled || !hasContent.value);

const shown = ref(false);
function syncShown(value) {
  shown.value = disabledOrEmpty.value ? false : value;
}
watch(disabledOrEmpty, (off) => { if (off) shown.value = false; });

/* 旧 position 名直接当 Reka 的 side 用；delay 毫秒→Reka 的秒。 */
const side = computed(() => ["top", "right", "bottom", "left"].includes(props.position) ? props.position : "bottom");
const delayMs = computed(() => Math.max(0, Number.isFinite(props.delay) ? props.delay : 0));

const triggerAttrs = computed(() => ({
  "aria-describedby": tooltipId,
}));
</script>

<template>
  <TooltipProvider :delay-duration="delayMs" :skip-delay-duration="100">
    <TooltipRoot :open="disabledOrEmpty ? false : open" @update:open="syncShown">
      <span
        ref="root"
        v-bind="forwardedAttrs"
        class="kima-tooltip"
        :class="{ 'kima-tooltip--disabled': disabled }"
      >
        <TooltipTrigger as-child>
          <span class="kima-tooltip__trigger">
            <slot
              name="trigger"
              :trigger-attrs="triggerAttrs"
              :attrs="triggerAttrs"
              :open="open ?? false"
            >
              <slot />
            </slot>
          </span>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent as-child :side="side" :side-offset="8" :collision-padding="8" avoid-collisions hide-when-detached>
            <AnimatePresence>
              <motion.span
                v-if="shown"
                :id="tooltipId"
                class="kima-tooltip__content"
                role="tooltip"
                :initial="{ opacity: 0, scale: 0.96 }"
                :animate="{ opacity: 1, scale: 1 }"
                :exit="{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }"
                :transition="{ type: 'spring', stiffness: 500, damping: 32 }"
              >
                <slot name="content">{{ text }}</slot>
              </motion.span>
            </AnimatePresence>
          </TooltipContent>
        </TooltipPortal>
      </span>
    </TooltipRoot>
  </TooltipProvider>
</template>

<style scoped lang="scss">
.kima-tooltip {
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

/* 定位由 Reka Popper 内联接管；这里只剩视觉。 */
.kima-tooltip__content {
  z-index: 20;
  display: block;
  width: max-content;
  max-width: min(320px, calc(100vw - 24px));
  padding: var(--kima-space-2) var(--kima-space-3);
  border-radius: var(--kima-radius-s);
  color: var(--kima-color-on-surface);
  /* 弹层是实色：它是浮在内容之上的一层，必须挡住背后，不能透。 */
  background: var(--kima-color-popup);
  box-shadow: var(--kima-elevation-3);
  font-size: var(--kima-font-size-label-medium);
  line-height: var(--kima-line-height-normal);
  white-space: normal;
  pointer-events: none;
}
</style>
