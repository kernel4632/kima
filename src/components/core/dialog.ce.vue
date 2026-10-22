<!--
对话框：使用原生 modal dialog 管理背景隔离、焦点和多层弹窗。
title 沿用原生属性，作为 attrs 读取，不声明同名组件 prop。
调用示例：
  <kima-dialog v-model:open="dialogOpen" title="删除项目" description="此操作无法撤销">
    <p>确定要继续吗？</p>
    <template #footer><button type="button" @click="dialogOpen = false">取消</button></template>
  </kima-dialog>
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from "vue";
import KimaIcon from "./icon.ce.vue";
import KimaButton from "./button.ce.vue";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    default: "",
  },
  closeOnEscape: {
    type: Boolean,
    default: true,
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
  size: {
    type: String,
    default: "medium",
  },
});

const emit = defineEmits(["update:open", "close"]);
const attrs = useAttrs();
const dialog = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(dialog);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const localOpen = ref(props.open);

const dialogSize = computed(() => {
  const sizes = ["small", "medium", "large"];
  return sizes.includes(props.size) ? props.size : "medium";
});
const dialogId = useId();
const titleId = `kima-dialog-title-${dialogId}`;
const descriptionId = `kima-dialog-description-${dialogId}`;

function close(reason = "close") {
  if (!localOpen.value) return;
  localOpen.value = false;
  if (dialog.value?.open) dialog.value.close();
  emit("update:open", false);
  emit("close", reason);
}

function syncDialog() {
  if (!dialog.value) return;
  // The browser owns the focus return target; no deferred callback can read a cleared ref.
  if (localOpen.value && !dialog.value.open) dialog.value.showModal();
  else if (!localOpen.value && dialog.value.open) dialog.value.close();
}

function handleCancel(event) {
  event.preventDefault();
  if (props.closeOnEscape) close("escape");
}

function handleNativeClose() {
  // 卸载时原生 close 事件可能在 ref 清空之后才到，这里不能直接读 dialog.value。
  if (dialog.value && !dialog.value.open) close("native");
}

function handleKeydown(event) {
  if (event.key !== "Tab" || !dialog.value) return;
  const focusable = [...dialog.value.querySelectorAll(
    "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])",
  )];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

watch(() => props.open, (open) => { localOpen.value = open; });
watch(localOpen, syncDialog, { flush: "post" });
onMounted(syncDialog);
onBeforeUnmount(() => { if (dialog.value?.open) dialog.value.close(); });
</script>

<template>
  <dialog
    ref="dialog"
    v-bind="forwardedAttrs"
    :title="undefined"
    class="kima-dialog"
    :aria-labelledby="attrs.title ? titleId : attrs['aria-labelledby']"
    :aria-describedby="[attrs['aria-describedby'], description ? descriptionId : undefined].filter(Boolean).join(' ') || undefined"
    @cancel.stop="handleCancel"
    @close.stop="handleNativeClose"
    @keydown="handleKeydown"
    @click.self="closeOnBackdrop && close('backdrop')"
  >
    <div class="kima-dialog__positioner">
      <section
        class="kima-dialog__panel"
        :class="`kima-dialog__panel--${dialogSize}`"
      >
        <header v-if="attrs.title || $slots.header || hasNativeSlot('header')" class="kima-dialog__header">
          <div class="kima-dialog__heading">
            <h2 v-if="attrs.title" :id="titleId" class="kima-dialog__title">{{ attrs.title }}</h2>
            <div v-if="$slots.header || hasNativeSlot('header')" class="kima-dialog__header-slot"><slot name="header" /></div>
          </div>
          <KimaButton variant="text" class="kima-dialog__close" aria-label="关闭对话框" @click="close('button')">
            <KimaIcon :icon="Cancel01Icon" :size="20" color="currentColor" />
          </KimaButton>
        </header>

        <p v-if="description" :id="descriptionId" class="kima-dialog__description">{{ description }}</p>
        <div v-if="$slots.default || hasNativeSlot('default')" class="kima-dialog__body"><slot /></div>
        <footer v-if="$slots.footer || hasNativeSlot('footer')" class="kima-dialog__footer"><slot name="footer" /></footer>
      </section>
    </div>
  </dialog>
</template>

<style scoped lang="scss">
.kima-dialog {
  box-sizing: border-box;
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 16px;
  border: 0;
  background: var(--kima-color-transparent);
  place-items: center;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  /* 原生 dialog 的开关是 display 切换，普通 transition 追不到；
   * 用 @starting-style + allow-discrete 才能让"打开"这一帧也有过渡。 */
  transition:
    opacity var(--kima-duration-medium) var(--kima-curve-emphasized),
    display var(--kima-duration-medium) allow-discrete,
    overlay var(--kima-duration-medium) allow-discrete;

  &[open] { display: grid; }

  &::backdrop {
    /* dim + 模糊：聚焦到面板，背后内容退为背景。
     * 遮罩暗度走 token，和抽屉同一个来源，全库弹层不会各暗各的。 */
    background: color-mix(in srgb, var(--kima-color-scrim) var(--kima-scrim-opacity), transparent);
    backdrop-filter: blur(var(--kima-backdrop-blur));
    /* 遮罩只改透明度（底色从头到尾不变），所以只需过渡 opacity，跟面板同一时长。 */
    transition: opacity var(--kima-duration-medium) var(--kima-curve-emphasized);
    opacity: 1;
  }

  /* 打开前的起点：面板和遮罩都从透明开始。 */
  @starting-style {
    &[open] {
      opacity: 0;
    }

    &[open]::backdrop {
      opacity: 0;
    }
  }

  /* 关闭（open 属性被移除）时，display 会立刻变 none；
   * 这条把关闭也纳入离散过渡，面板有机会淡出。 */
  &:not([open]) {
    opacity: 0;
  }

  /* 关闭时遮罩要跟着淡出。
   * 缺了这一条时：::backdrop 的 opacity 恒为 1，关闭时它不参与任何过渡，
   * 一直停在满不透明，直到 display 变成 none 那一帧整块消失——看起来就是"唰一下没了"。
   * dialog 的 overlay allow-discrete 保证这 200ms 里遮罩还活着，来得及播完。 */
  &:not([open])::backdrop {
    opacity: 0;
  }
}

.kima-dialog__positioner {
  position: relative;
  z-index: 1;
  display: flex;
  width: min(100%, 920px);
  max-height: 100%;
  justify-content: center;
  pointer-events: none;
}

.kima-dialog__panel {
  box-sizing: border-box;
  width: 100%;
  max-height: 100%;
  overflow: auto;
  padding: 24px;
  border: 0;
  border-radius: 28px;
  /* 弹层是实色：它是浮在内容之上的一层，必须挡住背后，不能透。 */
  background: var(--kima-color-popup-large);
  box-shadow: var(--kima-elevation-4);
  outline: none;
  pointer-events: auto;
  /* 面板自己再给一点缩放：整层淡入 + 面板轻微放大，比只淡入更像"弹出来"。 */
  transition:
    opacity var(--kima-duration-medium) var(--kima-curve-emphasized),
    scale var(--kima-duration-medium) var(--kima-curve-emphasized);

  .kima-dialog:not([open]) & { opacity: 0; scale: 0.96; }

  @starting-style {
    opacity: 0;
    scale: 0.96;
  }

  &--small {
    max-width: 420px;
  }

  &--medium {
    max-width: 640px;
  }

  &--large {
    max-width: 920px;
  }
}

.kima-dialog__header,
.kima-dialog__footer {
  display: flex;
  align-items: center;
  gap: var(--kima-space-3);
}

.kima-dialog__header {
  justify-content: space-between;
}

.kima-dialog__heading {
  min-width: 0;
}

.kima-dialog__title {
  margin: 0;
  color: var(--kima-color-on-surface);
  font-size: var(--kima-font-size-xl);
  font-weight: var(--kima-font-weight-bold);
  line-height: 1.25;
}

.kima-dialog__header-slot {
  margin-top: var(--kima-space-2);
}

.kima-dialog__close {
  display: inline-flex;
  flex: 0 0 40px;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  padding: 0;
  border: 0;
  border-radius: var(--kima-radius-full);
  color: var(--kima-color-on-surface-variant);
  background: var(--kima-color-transparent);
  cursor: pointer;
  /* 保留基础按钮回弹，同时过渡关闭入口的颜色。 */
  transition:
    transform 320ms var(--kima-spring-gentle),
    background-color var(--kima-duration-effects) var(--kima-curve-standard),
    color var(--kima-duration-effects) var(--kima-curve-standard);
}

.kima-dialog__close:hover {
  color: var(--kima-color-on-surface);
  background: var(--kima-color-layer-3);
}

.kima-dialog__close:focus-visible,
.kima-dialog__panel:focus-visible {
  outline: 2px solid var(--kima-color-primary);
  outline-offset: 2px;
}

.kima-dialog__description,
.kima-dialog__body {
  margin: var(--kima-space-5) 0 0;
}

.kima-dialog__description {
  color: var(--kima-color-on-surface-variant);
  line-height: 1.5;
}

.kima-dialog__body {
  min-width: 0;
}

.kima-dialog__footer {
  justify-content: flex-end;
  margin-top: var(--kima-space-6);
}

@media (prefers-reduced-motion: reduce) {
  .kima-dialog,
  .kima-dialog::backdrop,
  .kima-dialog__panel {
    transition-duration: 1ms;
  }
  .kima-dialog__panel { scale: 1; }
  .kima-dialog:not([open]) .kima-dialog__panel { scale: 1; }
}

@media (max-width: 600px) {
  .kima-dialog {
    padding: 12px;
  }

  .kima-dialog__panel {
    padding: 20px;
  }
}
</style>
