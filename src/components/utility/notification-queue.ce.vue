<!-- 通知队列：复用单条 notification 的语义与暂停计时，队列负责容量、去重和并列堆叠。 -->
<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, ref, useAttrs, useHost, watch } from "vue";
import { presenceTransition } from "../../utils/motion.js";
import { createNotifications } from "../../utils/notifications.js";
import KimaNotification from "../core/notification.ce.vue";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  items: { type: Array, default: () => [] },
  service: { type: Object, default: null },
  capacity: { type: Number, default: 3 },
  dedupeKey: { type: String, default: "id" },
  position: { type: String, default: "top-right" },
});
const emit = defineEmits(["update:items", "dismiss", "close"]);
const attrs = useAttrs();
const host = getCurrentInstance()?.ce ? useHost() : null;
const localItems = ref([]);
const ownedService = createNotifications({ capacity: props.capacity });
const serviceMode = ref(false);
function publicService() {
  if (props.service) return props.service;
  if (!serviceMode.value) { serviceMode.value = true; unsubscribe?.(); unsubscribe = ownedService.subscribe(items => { localItems.value = normalize(items); }); }
  return ownedService;
}
defineExpose({ push: item => publicService().push(item), update: (id, patch) => publicService().update(id, patch), dismiss: id => publicService().dismiss(id), clear: () => publicService().clear() });
const forwardedAttrs = computed(() => host ? { ...attrs, id: undefined } : attrs);
function itemKey(item, index) { return item?.[props.dedupeKey] ?? item?.id ?? item?.key ?? index; }
function normalize(items) {
  const capacity = Math.max(0, Math.floor(Number(props.capacity) || 0));
  if (!capacity) return [];
  const seen = new Set();
  return items.filter((item, index) => {
    const key = itemKey(item, index);
    if (seen.has(key)) return false;
    seen.add(key);
    return item && item.open !== false;
  }).slice(-capacity);
}
let unsubscribe;
watch(() => props.service, (service) => {
  unsubscribe?.();
  const activeService = service || (serviceMode.value ? ownedService : null);
  unsubscribe = activeService?.subscribe?.((items) => { localItems.value = normalize(items); });
  if (!activeService) localItems.value = normalize(props.items);
}, { immediate: true });
watch(() => [props.items, props.capacity], () => { ownedService.setCapacity(props.capacity); localItems.value = normalize(props.service?.snapshot?.() || (serviceMode.value ? ownedService.snapshot() : props.items)); }, { immediate: true, deep: true });
onBeforeUnmount(() => unsubscribe?.());
const queue = computed(() => localItems.value);
function remove(item, reason = "close") {
  const key = itemKey(item, 0);
  (props.service || (serviceMode.value ? ownedService : null))?.dismiss?.(item.id);
  const next = localItems.value.filter((candidate, index) => itemKey(candidate, index) !== key);
  localItems.value = next;
  emit("update:items", next);
  emit("dismiss", item, reason);
  emit("close", item, reason);
}
function notificationProps(item) {
  const { id, key, open, ...rest } = item || {};
  return {
    ...rest,
    position: props.position,
    open: true,
    // 队列负责堆叠定位与进出场位移；通知保持 open 常挂载，
    // 内层 Transition 不参与进出（slide 仅保留给独立使用的通知）。
    stacked: true,
  };
}
// 队列在屏幕边缘，整列通知的进出场方向就是这一侧。
const slideDirection = computed(() => {
  if (props.position.includes("right")) return "right";
  if (props.position.includes("left")) return "left";
  return props.position.startsWith("bottom") ? "down" : "up";
});
</script>
<template>
  <div v-bind="forwardedAttrs" class="kima-notification-queue" :class="[`kima-notification-queue--${position}`, `kima-notification-queue--slide-${slideDirection}`]" aria-live="polite">
    <TransitionGroup name="kima-notification-queue" tag="div" class="kima-notification-queue__stack" v-bind="presenceTransition">
      <!-- key 必须稳定：用 index 做 key 时删一条会让其余项整体换 key，move 补位动画失效。 -->
      <div v-for="(item, index) in queue" :key="item.id ?? itemKey(item, index)" class="kima-notification-queue__item">
        <KimaNotification v-bind="notificationProps(item)" @close="remove(item, $event)" />
      </div>
    </TransitionGroup>
  </div>
</template>
<style scoped lang="scss">
.kima-notification-queue { position: fixed; z-index: 1100; width: min(420px, calc(100vw - 32px)); pointer-events: none; font-family: var(--kima-font-family); }
/* 进出场位移的方向类挂在队列根节点上，避免让单条通知和队列各自推导一遍位置。 */
.kima-notification-queue--top, .kima-notification-queue--top-center, .kima-notification-queue--top-left, .kima-notification-queue--top-right { top: var(--kima-space-4); }
.kima-notification-queue--bottom, .kima-notification-queue--bottom-center, .kima-notification-queue--bottom-left, .kima-notification-queue--bottom-right { bottom: var(--kima-space-4); }
.kima-notification-queue--top, .kima-notification-queue--bottom, .kima-notification-queue--top-center, .kima-notification-queue--bottom-center { left: 50%; transform: translateX(-50%); }
.kima-notification-queue--top-left, .kima-notification-queue--bottom-left { left: var(--kima-space-4); }
.kima-notification-queue--top-right, .kima-notification-queue--bottom-right { right: var(--kima-space-4); }
.kima-notification-queue--slide-right .kima-notification-queue-enter-from,
.kima-notification-queue--slide-right .kima-notification-queue-leave-to { transform: translateX(calc(100% + 24px)); }
.kima-notification-queue--slide-left .kima-notification-queue-enter-from,
.kima-notification-queue--slide-left .kima-notification-queue-leave-to { transform: translateX(calc(-100% - 24px)); }
.kima-notification-queue--slide-up .kima-notification-queue-enter-from,
.kima-notification-queue--slide-up .kima-notification-queue-leave-to { transform: translateY(calc(-100% - 24px)); }
.kima-notification-queue--slide-down .kima-notification-queue-enter-from,
.kima-notification-queue--slide-down .kima-notification-queue-leave-to { transform: translateY(calc(100% + 24px)); }
.kima-notification-queue__stack {
  display: grid;
  gap: var(--kima-space-3);
  pointer-events: none;
}

.kima-notification-queue__item {
  min-width: 0;
}

/* 通知的堆叠布局已由通知自身的 --stacked 类承担，队列不再反改子组件样式。 */

/* TransitionGroup：新通知从边缘滑入，移除的通知从边缘滑出，其余卡片补位滑移。
 * 位移方向由容器上的 --slide-* 修饰类给出（见上方映射），item 是真正动画的元素。 */
.kima-notification-queue__item.kima-notification-queue-enter-active,
.kima-notification-queue__item.kima-notification-queue-leave-active {
  transition: opacity var(--kima-duration-medium) var(--kima-curve-emphasized), transform var(--kima-duration-medium) var(--kima-curve-emphasized);
}

.kima-notification-queue__item.kima-notification-queue-leave-active {
  /* 退场脱离排版，补位滑移立即开始，高度不会等淡出结束才塌。 */
  position: absolute;
  inset-inline: 0;
  pointer-events: none;
}

.kima-notification-queue__item.kima-notification-queue-enter-from,
.kima-notification-queue__item.kima-notification-queue-leave-to {
  opacity: 0;
}


@media (prefers-reduced-motion: reduce) {
  .kima-notification-queue__item.kima-notification-queue-enter-active,
  .kima-notification-queue__item.kima-notification-queue-leave-active,
  .kima-notification-queue__item.kima-notification-queue-move {
    transition-duration: 1ms;
  }
}
</style>
