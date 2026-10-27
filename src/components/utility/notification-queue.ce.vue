<!-- 通知队列：复用单条 notification 的语义与暂停计时，队列负责容量、去重和并列堆叠。 -->
<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, ref, toRaw, useAttrs, useHost, watch } from "vue";
import { freezeLeaveLayout, presenceTransition, restoreLeaveLayout } from "../../utils/motion.js";
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
// 无 id 的对象仍按对象身份保留节点；原始值用类型和值组成稳定 key。
const anonymousKeys = new WeakMap();
let anonymousSequence = 0;
function itemKey(item) {
  const key = item && typeof item === 'object'
    ? item[props.dedupeKey] ?? item.id ?? item.key
    : item;
  if (key != null) return key;
  if (item === null || typeof item !== 'object') return `${typeof item}:${String(item)}`;
  const raw = toRaw(item);
  if (!anonymousKeys.has(raw)) anonymousKeys.set(raw, Symbol(`notice-${++anonymousSequence}`));
  return anonymousKeys.get(raw);
}
function normalize(items) {
  const capacity = Math.max(0, Math.floor(Number(props.capacity) || 0));
  if (!capacity) return [];
  const seen = new Set();
  return items.filter((item) => {
    if (item == null || (typeof item === 'object' && item.open === false)) return false;
    const key = itemKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
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
  const key = itemKey(item);
  (props.service || (serviceMode.value ? ownedService : null))?.dismiss?.(item.id);
  const next = localItems.value.filter(candidate => itemKey(candidate) !== key);
  localItems.value = next;
  emit("update:items", next);
  emit("dismiss", item, reason);
  emit("close", item, reason);
}
function notificationProps(item) {
  const isObject = item && typeof item === 'object';
  const { id, key, open, ...rest } = isObject ? item : { message: String(item ?? '') };
  return {
    ...rest,
    position: props.position,
    open: true,
    // 队列独占进出场；内层关闭时保留内容，由外层在原位退场后卸载。
    stacked: true,
  };
}
function beforeLeave(element) {
  const rect = element.getBoundingClientRect();
  const parentRect = element.parentElement.getBoundingClientRect();
  freezeLeaveLayout(element);
  // 底部队列收缩时顶边会移动；从底边冻结才能让旧通知仍在原屏幕位置退场。
  if (props.position.startsWith('bottom')) {
    element.style.top = 'auto';
    element.style.bottom = `${parentRect.bottom - rect.bottom}px`;
  }
}

// 队列在屏幕边缘，整列通知的进出场方向就是这一侧。
const slideDirection = computed(() => {
  if (props.position.includes("right")) return "right";
  if (props.position.includes("left")) return "left";
  return props.position.startsWith("bottom") ? "down" : "up";
});
</script>
<template>
  <div v-bind="forwardedAttrs" class="kima-notification-queue" :class="[`kima-notification-queue--${position}`, `kima-notification-queue--slide-${slideDirection}`]">
    <TransitionGroup name="kima-notification-queue" tag="div" class="kima-notification-queue__stack" v-bind="{ ...presenceTransition, onBeforeLeave: beforeLeave, onBeforeEnter: restoreLeaveLayout, onLeaveCancelled: restoreLeaveLayout }">
      <div v-for="item in queue" :key="itemKey(item)" class="kima-notification-queue__item">
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
  position: relative;
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

.kima-notification-queue-move {
  transition: transform var(--kima-duration-slower) var(--kima-curve-emphasized);
}

.kima-notification-queue-leave-active {
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
  .kima-notification-queue .kima-notification-queue-enter-from,
  .kima-notification-queue .kima-notification-queue-leave-to {
    transform: none;
  }
}
</style>
