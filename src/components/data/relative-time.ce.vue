<!-- 相对时间：仅在客户端按 updateInterval 更新；SSR 使用稳定的初始文本，不创建计时器。 -->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  date: { type: [String, Number, Date], default: null },
  time: { type: [String, Number, Date], default: null },
  locale: { type: [String, Array], default: undefined },
  updateInterval: { type: Number, default: 60000 },
  numeric: { type: String, default: "always" },
  addSuffix: { type: Boolean, default: true },
});
const attrs = useAttrs();
const now = ref(Date.now());
let timer;
const target = computed(() => props.time ?? props.date);
const timestamp = computed(() => {
  const value = target.value instanceof Date ? target.value.getTime() : new Date(target.value).getTime();
  return Number.isFinite(value) ? value : NaN;
});
const text = computed(() => {
  if (!Number.isFinite(timestamp.value)) return "无效时间";
  const seconds = Math.round((timestamp.value - now.value) / 1000);
  const abs = Math.abs(seconds);
  const units = [[31536000, "year"], [2592000, "month"], [604800, "week"], [86400, "day"], [3600, "hour"], [60, "minute"], [1, "second"]];
  const [size, unit] = units.find(([value]) => abs >= value) || [1, "second"];
  const value = Math.round(seconds / size);
  try {
    return new Intl.RelativeTimeFormat(props.locale, { numeric: props.numeric, style: "long" }).format(value, unit);
  } catch {
    return `${value} ${unit}${Math.abs(value) === 1 ? "" : "s"}${props.addSuffix ? "" : ""}`;
  }
});
const iso = computed(() => Number.isFinite(timestamp.value) ? new Date(timestamp.value).toISOString() : undefined);
onMounted(() => {
  now.value = Date.now();
  const interval = Number(props.updateInterval);
  if (interval > 0 && Number.isFinite(interval)) timer = setInterval(() => { now.value = Date.now(); }, interval);
});
onBeforeUnmount(() => clearInterval(timer));
</script>
<template><time v-bind="attrs" class="kima-relative-time" :datetime="iso">{{ text }}</time></template>
<style scoped lang="scss">
.kima-relative-time { color: var(--kima-color-on-surface-variant); font-family: var(--kima-font-family); font-size: var(--kima-font-size-sm); }
</style>
