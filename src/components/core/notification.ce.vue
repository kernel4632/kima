<!--
通知：显示短消息、状态和可选操作，负责自动关闭、手动关闭和关闭时的事件通知。
duration 单位是毫秒；0 表示保持显示。close 事件传出 button 或 timeout。
heading 是标题属性；Vue 的 title 透传属性也支持，避免覆盖 HTMLElement.title。
挂载后才开始计时；鼠标停留或焦点在通知内部时暂停，离开后继续剩余时间。
position 支持 top/bottom 和 top-left/top-center/top-right/bottom-left/bottom-center/bottom-right。
调用示例：
  <kima-notification v-model:open="noticeOpen" title="保存成功" message="项目已保存" variant="success" />
  <kima-notification v-model:open="noticeOpen" title="需要确认" message="请检查表单" variant="warning" :duration="0" closable>
    <template #action><button type="button">查看</button></template>
  </kima-notification>
-->
<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch, useAttrs, useHost, useId } from "vue";
import KimaIcon from "./icon.ce.vue";
import { presenceTransition } from "../../utils/motion.js";
import {
  Alert02Icon,
  AlertCircleIcon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  heading: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    default: "",
  },
  variant: {
    type: String,
    default: "neutral",
  },
  duration: {
    type: Number,
    default: 5000,
  },
  closable: {
    type: Boolean,
    default: true,
  },
  position: {
    type: String,
    default: "top-right",
  },
  // 换掉按 variant 自动配的图标。原生用法传不了对象，走默认的语义图标即可。
  icon: {
    type: [Object, Array],
    default: null,
  },
});

const emit = defineEmits(["update:open", "close"]);
const attrs = useAttrs();
const host = getCurrentInstance().ce ? useHost() : null;
const localOpen = ref(props.open);
const baseId = useId();
const titleId = `kima-notification-${baseId}-title`;
const messageId = `kima-notification-${baseId}-message`;
let closeTimer = null;
let mounted = false;
let remaining = 0;
let startedAt = 0;
let hovered = false;
let focused = false;

const notificationVariant = computed(() => {
  const variants = ["neutral", "info", "success", "warning", "danger"];
  return variants.includes(props.variant) ? props.variant : "neutral";
});
const notificationPosition = computed(() => {
  const positions = ["top", "top-left", "top-center", "top-right", "bottom", "bottom-left", "bottom-center", "bottom-right"];
  return positions.includes(props.position) ? props.position : "top-right";
});
const notificationRole = computed(() => ["warning", "danger"].includes(notificationVariant.value) ? "alert" : "status");
const notificationLive = computed(() => notificationRole.value === "alert" ? "assertive" : "polite");
const durationMs = computed(() => Number.isFinite(props.duration) ? Math.max(0, props.duration) : 0);

// 每种语义配一个图标：状态不靠颜色单独承担（色盲用户看形状也能分出来）。
// neutral 不给图标——"普通消息"没有语义，硬塞一个反而像有话说。
const variantIcons = {
  info: InformationCircleIcon,
  success: CheckmarkCircle02Icon,
  warning: Alert02Icon,
  danger: AlertCircleIcon,
};
const notificationIcon = computed(() => props.icon ?? variantIcons[notificationVariant.value] ?? null);

// --- 关闭计时器：重开、修改时长和卸载都取消旧计时 ---
function clearCloseTimer() {
  if (closeTimer === null) return;
  clearTimeout(closeTimer);
  closeTimer = null;
}

function close(reason = "close") {
  if (!localOpen.value) return;
  clearCloseTimer();
  localOpen.value = false; // 同一次打开只发送一次关闭事件。
  emit("update:open", false);
  emit("close", reason);
}

function startCloseTimer() {
  clearCloseTimer();
  if (!mounted || !localOpen.value || durationMs.value === 0 || hovered || focused) return;
  startedAt = Date.now();
  closeTimer = setTimeout(() => {
    closeTimer = null;
    close("timeout");
  }, remaining);
}

function pauseTimer() {
  if (closeTimer === null) return;
  remaining = Math.max(0, remaining - (Date.now() - startedAt));
  clearCloseTimer();
}

function handleHover(inside) {
  hovered = inside;
  if (inside) pauseTimer();
  else startCloseTimer();
}

function handleFocus(event) {
  focused = event.type === "focusin" || event.currentTarget.contains(event.relatedTarget);
  if (focused) pauseTimer();
  else startCloseTimer();
}

// --- 外部打开状态同步；没有 v-model 时也能自行关闭 ---
watch(() => props.open, (open) => { localOpen.value = open; });
watch(
  [localOpen, durationMs],
  ([open]) => {
    remaining = durationMs.value;
    if (open) startCloseTimer();
    else {
      clearCloseTimer();
      hovered = false;
      focused = false;
    }
  },
  { immediate: true },
);

onMounted(() => {
  mounted = true;
  remaining = durationMs.value;
  startCloseTimer();
});
onBeforeUnmount(() => {
  mounted = false;
  clearCloseTimer();
});
</script>

<template>
  <!-- 通知自带一套滑入过渡（见下方 style 说明）：从它所在的那一侧滑进来。 -->
  <Transition name="kima-notification" v-bind="presenceTransition">
    <div
      v-if="localOpen"
      v-bind="{ ...attrs, id: host ? undefined : attrs.id, title: undefined }"
      class="kima-notification"
      :class="[`kima-notification--${notificationVariant}`, `kima-notification--${notificationPosition}`]"
      :role="notificationRole"
      :aria-live="notificationLive"
      aria-atomic="true"
      :aria-labelledby="heading || attrs.title ? titleId : undefined"
      :aria-describedby="message ? messageId : undefined"
      @mouseenter="handleHover(true)"
      @mouseleave="handleHover(false)"
      @focusin="handleFocus"
      @focusout="handleFocus"
    >
      <!-- 三栏横向排：图标 / 正文 / 关闭按钮。
       * 图标和关闭按钮都是 flex: none，只有正文会被压窄——
       * 长消息换行时它们不会被挤扁或推出容器。 -->
      <span v-if="notificationIcon" class="kima-notification__icon" aria-hidden="true">
        <KimaIcon :icon="notificationIcon" :size="22" />
      </span>

      <div class="kima-notification__copy">
        <strong v-if="heading || attrs.title" :id="titleId" class="kima-notification__title">{{ heading || attrs.title }}</strong>
        <span v-if="message" :id="messageId" class="kima-notification__message">{{ message }}</span>
        <!-- 操作按钮单独换行、跟正文左对齐；不跟关闭按钮抢同一行。 -->
        <div v-if="$slots.action || host" class="kima-notification__action"><slot name="action" /></div>
      </div>

      <button
        v-if="closable"
        class="kima-notification__close"
        type="button"
        aria-label="关闭通知"
        title="关闭通知"
        @click="close('button')"
      >
        <KimaIcon :icon="Cancel01Icon" :size="18" aria-hidden="true" />
      </button>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;
/* ---- 出场：从所在的那一侧滑进来 ----
 * 通知是从屏幕边缘来的，横向位移比通用弹层的"原地放大"更贴合它的来处。
 * 退场短、进场长：进场要让人看清是什么，退场别挡着看别的。
 * 通用 .kima-popup 只做淡入，这里额外加位移，所以自带一套。 */
.kima-notification-enter-active {
  transition:
    opacity var(--kima-duration-medium) var(--kima-curve-emphasized),
    transform var(--kima-duration-medium) var(--kima-curve-emphasized);
}

.kima-notification-leave-active {
  pointer-events: none;
  transition:
    opacity var(--kima-duration-fast) var(--kima-curve-standard),
    transform var(--kima-duration-fast) var(--kima-curve-standard);
}

.kima-notification-enter-from,
.kima-notification-leave-to {
  opacity: 0;
}

/* 右边来的从右边滑入，左边来的从左边滑入，居中的从上面/下面滑入。 */
.kima-notification--top-right.kima-notification-enter-from,
.kima-notification--top-right.kima-notification-leave-to,
.kima-notification--bottom-right.kima-notification-enter-from,
.kima-notification--bottom-right.kima-notification-leave-to {
  transform: translateX(calc(100% + 24px));
}

.kima-notification--top-left.kima-notification-enter-from,
.kima-notification--top-left.kima-notification-leave-to,
.kima-notification--bottom-left.kima-notification-enter-from,
.kima-notification--bottom-left.kima-notification-leave-to {
  transform: translateX(calc(-100% - 24px));
}

.kima-notification--top.kima-notification-enter-from,
.kima-notification--top-center.kima-notification-enter-from,
.kima-notification--top.kima-notification-leave-to,
.kima-notification--top-center.kima-notification-leave-to {
  transform: translateX(-50%) translateY(calc(-100% - 24px));
}

.kima-notification--bottom.kima-notification-enter-from,
.kima-notification--bottom-center.kima-notification-enter-from,
.kima-notification--bottom.kima-notification-leave-to,
.kima-notification--bottom-center.kima-notification-leave-to {
  transform: translateX(-50%) translateY(calc(100% + 24px));
}

.kima-notification {
  box-sizing: border-box;
  position: fixed;
  z-index: 1100;
  /* 三栏横排：图标 / 正文 / 关闭。正文吃掉剩余宽度，另两栏固定不缩。 */
  display: flex;
  align-items: flex-start;
  gap: var(--kima-space-3);
  width: min(420px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  overflow: auto;
  padding: var(--kima-space-4);
  border: 0;
  border-radius: var(--kima-radius-l);
  color: var(--kima-color-on-surface);
  /* 弹层是实色：浮在内容之上，必须挡住背后。 */
  background: var(--kima-color-popup);
  box-shadow: var(--kima-elevation-4);
  font-family: var(--kima-font-family);
}

/* 语义图标：跟首行文字对齐（不是跟整块对齐），文字行高 1.3 时视觉最正。 */
.kima-notification__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: calc(var(--kima-font-size-md) * 1.3);
  opacity: 0.9;
}

.kima-notification--top,
.kima-notification--top-center,
.kima-notification--top-left,
.kima-notification--top-right {
  top: var(--kima-space-4);
}

.kima-notification--bottom,
.kima-notification--bottom-center,
.kima-notification--bottom-left,
.kima-notification--bottom-right {
  bottom: var(--kima-space-4);
}

.kima-notification--top,
.kima-notification--bottom {
  left: 50%;
  transform: translateX(-50%);
}

.kima-notification--top-center,
.kima-notification--bottom-center {
  left: 50%;
  transform: translateX(-50%);
}

.kima-notification--top-left,
.kima-notification--bottom-left {
  left: var(--kima-space-4);
}

.kima-notification--top-right,
.kima-notification--bottom-right {
  right: var(--kima-space-4);
}

/* 变体只有两种做法，都必须是实色：
 * 信息类用容器的实色底（容器色本来就是不透明的色板角色）；
 * 语义类用固定的语义色（成功绿 / 警告橙 / 危险红），不跟种子变。
 * 之前 warning 用 layer-2 当底——那是半透明的叠层，通知浮在页面上会透出背后内容。 */
.kima-notification--info {
  color: var(--kima-color-on-primary-container);
  background: var(--kima-color-primary-container);
}

.kima-notification--warning {
  color: var(--kima-color-on-warning);
  background: var(--kima-color-warning);
}

.kima-notification--success {
  color: var(--kima-color-on-success);
  background: var(--kima-color-success);
}

.kima-notification--danger {
  color: var(--kima-color-on-danger);
  background: var(--kima-color-danger);
}

/* 正文吃掉剩余宽度；min-width: 0 才能让它真的被压窄而不是撑破容器。 */
.kima-notification__copy {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  flex-direction: column;
  gap: var(--kima-space-1);
  overflow-wrap: anywhere;
}

.kima-notification__title {
  font-size: var(--kima-font-size-md);
  font-weight: var(--kima-font-weight-bold);
  line-height: 1.3;
}

.kima-notification__message {
  font-size: var(--kima-font-size-sm);
  line-height: 1.45;
}

.kima-notification__action {
  display: flex;
  flex-wrap: wrap;
  margin-top: var(--kima-space-2);
  gap: var(--kima-space-2);
}

.kima-notification__action:empty {
  display: none;
}

.kima-notification__close {
  display: inline-flex;
  flex: none;
  width: 32px;
  height: 32px;
  /* 往上提一点：图标栏高是按首行文字算的 20 来 px，32 的按钮不提起会显得整体偏低。 */
  margin: calc((var(--kima-font-size-md) * 1.3 - 32px) / 2) calc(var(--kima-space-1) * -1) 0 0;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--kima-radius-full);
  color: inherit;
  background: var(--kima-color-transparent);
  cursor: pointer;
  @include kima-state-layer;
  @include kima-focus-ring;
  @include kima-ripple-host;
  /* 关闭按钮是"亮起来"的反馈，跟选项行一样要有过程。 */
  transition: background-color var(--kima-duration-effects) var(--kima-curve-standard);
}

.kima-notification__close:hover {
  background: color-mix(in srgb, currentColor 12%, var(--kima-color-transparent));
}

@media (prefers-reduced-motion: reduce) {
  .kima-notification__close {
    transition: none;
  }

  /* 关掉位移动画，只留最短的淡入淡出。 */
  .kima-notification-enter-active,
  .kima-notification-leave-active {
    transition-duration: 1ms;
  }

  .kima-notification-enter-from,
  .kima-notification-leave-to {
    transform: none;
  }
  .kima-notification--top,
  .kima-notification--top-center,
  .kima-notification--bottom,
  .kima-notification--bottom-center {
    transform: translateX(-50%);
  }
}

@media (max-width: 600px) {
  .kima-notification--top,
  .kima-notification--top-left,
  .kima-notification--top-center,
  .kima-notification--top-right {
    top: var(--kima-space-3);
  }

  .kima-notification--bottom,
  .kima-notification--bottom-left,
  .kima-notification--bottom-center,
  .kima-notification--bottom-right {
    bottom: var(--kima-space-3);
  }

  .kima-notification--top-left,
  .kima-notification--bottom-left {
    left: var(--kima-space-3);
  }

  .kima-notification--top-right,
  .kima-notification--bottom-right {
    right: var(--kima-space-3);
  }
}
</style>
