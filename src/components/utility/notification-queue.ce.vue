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
  return { ...rest, position: props.position, open: true };
}
</script>
<template>
  <div v-bind="forwardedAttrs" class="kima-notification-queue" :class="`kima-notification-queue--${position}`" aria-live="polite">
    <TransitionGroup name="kima-popup" tag="div" class="kima-notification-queue__stack" v-bind="presenceTransition">
      <div v-for="(item, index) in queue" :key="itemKey(item, index)" class="kima-notification-queue__item">
        <KimaNotification v-bind="notificationProps(item)" @close="remove(item, $event)" />
      </div>
    </TransitionGroup>
  </div>
</template>
<style scoped lang="scss">
.kima-notification-queue { position: fixed; z-index: 1100; width: min(420px, calc(100vw - 32px)); pointer-events: none; font-family: var(--kima-font-family); }
.kima-notification-queue--top, .kima-notification-queue--top-center, .kima-notification-queue--top-left, .kima-notification-queue--top-right { top: var(--kima-space-4); }
.kima-notification-queue--bottom, .kima-notification-queue--bottom-center, .kima-notification-queue--bottom-left, .kima-notification-queue--bottom-right { bottom: var(--kima-space-4); }
.kima-notification-queue--top, .kima-notification-queue--bottom, .kima-notification-queue--top-center, .kima-notification-queue--bottom-center { left: 50%; transform: translateX(-50%); }
.kima-notification-queue--top-left, .kima-notification-queue--bottom-left { left: var(--kima-space-4); }
.kima-notification-queue--top-right, .kima-notification-queue--bottom-right { right: var(--kima-space-4); }
.kima-notification-queue__stack { display: grid; gap: var(--kima-space-3); pointer-events: none; }
.kima-notification-queue__item { min-width: 0; }
.kima-notification-queue__item[inert] { pointer-events: none; }
.kima-notification-queue__item[inert] :deep(.kima-notification) { pointer-events: none; }
.kima-notification-queue :deep(.kima-notification) { position: relative; inset: auto; width: 100%; max-width: 100%; transform: none !important; pointer-events: auto; }
@media (prefers-reduced-motion: reduce) { .kima-notification-queue { transition: none; } }
</style>
