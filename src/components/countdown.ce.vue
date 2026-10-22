<!-- 倒计时：value 是截止时间戳/ISO 日期；每次目标到时只触发一次 finish。SSR 输出占位，不启动计时器。调用示例：<kima-countdown :value="deadline" label="距离结束" @finish="onFinish" /> -->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import { useNativeSlots } from "../utils/native-slots.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  value: { type: [Number, String, Date], default: undefined },
  label: { type: String, default: "倒计时" },
  showDays: Boolean,
});
const emit = defineEmits(["finish"]);
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement } = useNativeSlots(root);
const remaining = ref(null);
const target = computed(() => {
  if (props.value == null || props.value === "") return NaN;
  return props.value instanceof Date ? props.value.getTime() : typeof props.value === "number" ? props.value : Date.parse(props.value);
});
let mounted = false;
let timer = null;
let finished = false;
function clearTimer() { if (timer !== null) clearTimeout(timer); timer = null; }
function tick() {
  clearTimer();
  if (!mounted || !Number.isFinite(target.value)) { remaining.value = null; return; }
  const difference = Math.max(0, target.value - Date.now());
  remaining.value = Math.ceil(difference / 1000);
  if (difference === 0) { if (!finished) { finished = true; emit("finish"); } return; }
  timer = setTimeout(tick, Math.min(250, difference));
}
watch(target, () => { finished = false; if (mounted) tick(); });
onMounted(() => { mounted = true; tick(); });
onBeforeUnmount(() => { mounted = false; clearTimer(); });
const parts = computed(() => {
  const seconds = remaining.value ?? 0;
  return { days: Math.floor(seconds / 86400), hours: props.showDays ? Math.floor(seconds / 3600) % 24 : Math.floor(seconds / 3600), minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60 };
});
const pad = (value) => String(value).padStart(2, "0");
const formatted = computed(() => remaining.value === null ? "--:--:--" : `${props.showDays ? parts.value.days + '天 ' : ''}${pad(parts.value.hours)}:${pad(parts.value.minutes)}:${pad(parts.value.seconds)}`);
</script>
<template>
  <div ref="root" v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }" class="kima-countdown">
    <div v-if="label" class="kima-countdown__label">{{ label }}</div>
    <div class="kima-countdown__value" role="timer" :aria-label="label" aria-live="off"><slot :remaining="remaining" :formatted="formatted" :days="parts.days" :hours="parts.hours" :minutes="parts.minutes" :seconds="parts.seconds">{{ formatted }}</slot></div>
  </div>
</template>
<style scoped lang="scss">
@use "../styles/display" as *;
.kima-countdown {
  @include display-panel;
  &__label { margin-bottom: var(--kima-space-3); color: var(--kima-color-on-surface-variant); }
  &__value { font-size: var(--kima-font-size-headline-medium); line-height: var(--kima-line-height-tight); font-variant-numeric: tabular-nums; }
}
</style>
