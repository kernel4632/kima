<!--
抽屉：从底部或侧边滑入的弹层，Vaul 式体验——背景变暗模糊、面板滑入、拖拽关闭。
行为层全由 Reka Drawer 承担（emilkowal.ski 的 vaul 移植）：拖拽跟手、吸附档位、
Escape、滚动锁、焦点陷阱。KIMA 只保留皮肤。
title 沿用原生属性，作为 attrs 读取，不声明同名组件 prop。

调用示例：
  // 底部抽屉（默认）
  <kima-drawer v-model:open="open" title="操作">
    <p>在这里放内容。</p>
    <template #footer>
      <kima-button @click="open = false">完成</kima-button>
    </template>
  </kima-drawer>

  // 右侧抽屉
  <kima-drawer v-model:open="open" placement="right" title="详情">...</kima-drawer>

  // 带吸附点的底部抽屉：给几档高度，拖到哪就近吸到哪
  <kima-drawer v-model:open="open" title="操作" :snap-points="[0.4, 0.9]">...</kima-drawer>

placement 可选值：bottom（默认）| left | right
底部抽屉抓住把手往下拖可以关闭；侧抽屉向各自的屏幕外方向拖也能关闭。
-->
<script setup>
import { computed, ref, useAttrs, useId } from "vue";
import {
  DrawerRoot, DrawerPortal, DrawerOverlay, DrawerContent, DrawerHandle, DrawerTitle,
  DrawerDescription, DrawerClose, DrawerViewport,
} from "reka-ui";
import KimaIcon from "./icon.ce.vue";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  // 抽屉从哪侧滑入。bottom 适合操作菜单，left/right 适合导航和详情。
  placement: {
    type: String,
    default: "bottom",
  },
  description: {
    type: String,
    default: "",
  },
  closeOnEscape: {
    type: Boolean,
    default: true,
  },
  // 点击背景遮罩是否关闭。底部抽屉默认 true，重要的确认操作可以设 false。
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
  // 底部抽屉的多档高度，按视口高度的比例给，例如 [0.4, 0.9]。
  // 只对底部抽屉生效；侧抽屉是全高的，没有档位可言。
  snapPoints: {
    type: Array,
    default: () => [],
  },
  // 当前档位（比例值）。不传就自己管；传了就听调用方的，配合 v-model:active-snap-point。
  activeSnapPoint: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(["update:open", "close", "update:activeSnapPoint"]);
const attrs = useAttrs();
const { hasNativeSlot } = useNativeSlots(null);
const localSnap = ref(null);

const placement = computed(() => {
  const valid = ["bottom", "left", "right"];
  return valid.includes(props.placement) ? props.placement : "bottom";
});

/* 拖拽关闭的方向 = 出屏方向：底部往下、左侧往左、右侧往右。 */
const swipeDirection = computed(() =>
  placement.value === "bottom" ? "down" : placement.value === "left" ? "left" : "right",
);

/* Reka 的 update:open 只带一个布尔；KIMA 的 close 事件带原因（escape/backdrop/swipe/button）。
 * Escape 和遮罩点击在这里还原原因，拖拽关闭由 Reka 内部发 open=false。 */
function onOpenChange(open) {
  if (!open) emit("close", "close");
  emit("update:open", open);
}
function onEscapeKeydown(event) {
  if (!props.closeOnEscape) event.preventDefault();
  else onOpenChange(false), emit("close", "escape");
}
function onPointerDownOutside(event) {
  if (!props.closeOnBackdrop) event.preventDefault();
  else emit("close", "backdrop");
}
function onSnapChange(point) {
  localSnap.value = point;
  emit("update:activeSnapPoint", point);
}

const dialogId = useId();
const titleId = `kima-drawer-title-${dialogId}`;
const descriptionId = `kima-drawer-description-${dialogId}`;
</script>

<template>
  <DrawerRoot
    :open="open"
    :snap-points="placement === 'bottom' && snapPoints.length ? snapPoints : undefined"
    :snap-point="activeSnapPoint ?? undefined"
    :default-snap-point="placement === 'bottom' && snapPoints.length ? snapPoints[0] : undefined"
    :swipe-direction="swipeDirection"
    :modal="true"
    @update:open="onOpenChange"
    @update:snap-point="onSnapChange"
  >
    <DrawerPortal>
      <DrawerOverlay
        v-if="true"
        class="kima-drawer__backdrop"
      />
      <DrawerContent
        class="kima-drawer"
        :class="`kima-drawer--${placement}`"
        :aria-labelledby="attrs.title ? titleId : attrs['aria-labelledby']"
        :aria-describedby="[attrs['aria-describedby'], description ? descriptionId : undefined].filter(Boolean).join(' ') || undefined"
        @escape-key-down="onEscapeKeydown"
        @pointer-down-outside="onPointerDownOutside"
      >
        <div class="kima-drawer__panel" v-bind="{ ...attrs, title: undefined, id: undefined }">
          <!-- 底部抽屉顶部的拖拽把手：视觉上是一条短横，实际命中区更大。
               Reka 的 DrawerHandle 承担拖拽起手与关闭判定。 -->
          <DrawerHandle v-if="placement === 'bottom'" class="kima-drawer__handle" />

          <header
            v-if="attrs.title || $slots.header || hasNativeSlot('header')"
            class="kima-drawer__header"
          >
            <div class="kima-drawer__heading">
              <DrawerTitle v-if="attrs.title" :id="titleId" class="kima-drawer__title">{{ attrs.title }}</DrawerTitle>
              <div v-if="$slots.header || hasNativeSlot('header')" class="kima-drawer__header-slot">
                <slot name="header" />
              </div>
            </div>
            <DrawerClose class="kima-drawer__close" aria-label="关闭" @select="emit('close', 'button')">
              <KimaIcon :icon="Cancel01Icon" :size="20" color="currentColor" />
            </DrawerClose>
          </header>

          <DrawerViewport
            v-if="description || $slots.default || hasNativeSlot('default')"
            class="kima-drawer__body"
          >
            <DrawerDescription v-if="description" :id="descriptionId" class="kima-drawer__description">{{ description }}</DrawerDescription>
            <slot />
          </DrawerViewport>
          <footer v-if="$slots.footer || hasNativeSlot('footer')" class="kima-drawer__footer">
            <slot name="footer" />
          </footer>
        </div>
      </DrawerContent>
    </DrawerPortal>
  </DrawerRoot>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;

/* ---- 遮罩 ---- dim + 模糊：聚焦到面板，背后内容退为背景。 */
.kima-drawer__backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  border: 0;
  background: color-mix(in srgb, var(--kima-color-scrim) var(--kima-scrim-opacity), transparent);
  /* 模糊 + 饱和度补回：透出的才是"后面的颜色"，不是一层灰塑料。 */
  backdrop-filter: var(--kima-backdrop-filter);
}

.kima-drawer {
  position: fixed;
  inset: 0;
  z-index: 51;
  display: grid;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  /* 全屏层只裁切屏外面板，不承担滚动；正文在面板内部滚动。 */
  overflow: clip;
  /* Reka 把拖拽位移/吸附档位写成 CSS 变量，且注册为不继承——
   * 消费必须在它写入的同一元素（content）上，位移的是里面的面板：
   * 底部抽屉 = 吸档偏移 + 拖拽 Y；侧抽屉只吃各自方向的拖拽。 */
  &.kima-drawer--bottom {
    translate: 0px calc(var(--drawer-snap-point-offset, 0px) + var(--drawer-swipe-movement-y, 0px));
  }
  &.kima-drawer--right {
    translate: calc(-1 * var(--drawer-swipe-movement-x, 0px)) 0px;
  }
  &.kima-drawer--left {
    translate: var(--drawer-swipe-movement-x, 0px) 0px;
  }
  transition: translate var(--kima-duration-slow) var(--kima-curve-emphasized);
}

.kima-drawer__panel {
  /* 侧抽屉面板最大宽 420。 */
  --kima-drawer-max-width: 420px;

  box-sizing: border-box;
  display: flex;
  width: 100%;
  min-width: 0;
  flex-direction: column;
  /* 面板是弹层：实色底，必须挡住背后内容。 */
  background: var(--kima-color-popup);
  box-shadow: var(--kima-elevation-4);
}

.kima-drawer--bottom .kima-drawer__panel {
  justify-self: center;
  align-self: end;
  width: min(640px, 100%);
  max-height: 92vh;
  border-radius: var(--kima-radius-xl) var(--kima-radius-xl) 0 0;
}

.kima-drawer--right .kima-drawer__panel {
  justify-self: end;
  height: 100%;
  width: min(var(--kima-drawer-max-width), 90vw);
  border-radius: var(--kima-radius-xl) 0 0 var(--kima-radius-xl);
}

.kima-drawer--left .kima-drawer__panel {
  justify-self: start;
  height: 100%;
  width: min(var(--kima-drawer-max-width), 90vw);
  border-radius: 0 var(--kima-radius-xl) var(--kima-radius-xl) 0;
}

/* 拖拽把手：短横视觉 + 更大的命中区。 */
.kima-drawer__handle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--kima-space-2) 0 var(--kima-space-1);
  cursor: grab;
  touch-action: none;

  &::before {
    content: "";
    width: 36px;
    height: 4px;
    border-radius: var(--kima-radius-full);
    background: var(--kima-color-outline);
  }
}

.kima-drawer__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--kima-space-3);
  padding: var(--kima-space-2) var(--kima-space-6) 0;
}

.kima-drawer__heading {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: var(--kima-space-1);
}

.kima-drawer__title {
  margin: 0;
  font-size: var(--kima-font-size-title-medium);
  line-height: var(--kima-line-height-tight);
}

.kima-drawer__close {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: var(--kima-radius-full);
  color: var(--kima-color-on-surface-variant);
  background: transparent;
  cursor: pointer;

  &:hover { background: var(--kima-color-layer-3); }
  &:focus-visible { outline: var(--kima-focus-ring-width) solid var(--kima-color-primary); outline-offset: var(--kima-focus-ring-offset); }
}

.kima-drawer__body {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: var(--kima-space-3);
  padding: var(--kima-space-4) var(--kima-space-6);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.kima-drawer__description {
  margin: 0;
  color: var(--kima-color-on-surface-variant);
}

.kima-drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--kima-space-2);
  padding: var(--kima-space-3) var(--kima-space-6) var(--kima-space-5);
}
</style>
