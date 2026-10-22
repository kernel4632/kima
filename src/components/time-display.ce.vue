<!-- 日历时间格式化：带时区/时刻的输入按 locale/timeZone 用 Intl.DateTimeFormat 输出；纯日期和纯时间按 UTC 固定格式化，避免日历日期或墙上时间被时区跨日。相对时间请用 relative-time，本组件不创建计时器。调用示例：<kima-time-display value="2026-06-01T09:30" mode="datetime" time-zone="Asia/Shanghai" /> -->
<script setup>
import { computed } from 'vue';
import { useNavigationRoot } from '../utils/navigation.js';
import { choice } from '../utils/foundation.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ value: { type: [String, Number, Date], default: null }, mode: { type: String, default: 'datetime' }, locale: { type: [String, Array], default: undefined }, timeZone: { type: String, default: '' }, dateStyle: { type: String, default: 'medium' }, timeStyle: { type: String, default: 'short' }, fallback: { type: String, default: '时间不可用' } });
const { root, forwardedAttrs } = useNavigationRoot();
const renderMode = computed(() => choice(props.mode, ['date', 'time', 'datetime'], 'datetime'));
function parse(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : { date: new Date(value.getTime()), kind: 'instant' };
  if (typeof value === 'number') return Number.isFinite(value) ? { date: new Date(value), kind: 'instant' } : null;
  if (typeof value !== 'string' || !value.trim()) return null;
  const text = value.trim();
  let match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (match) {
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? { date, kind: 'date', text } : null;
  }
  match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(text);
  if (match) {
    const [hour, minute, second] = [Number(match[1]), Number(match[2]), Number(match[3] || 0)];
    if (hour > 23 || minute > 59 || second > 59) return null;
    return { date: new Date(Date.UTC(2000, 0, 1, hour, minute, second)), kind: 'time', text };
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : { date, kind: 'instant' };
}
const parsed = computed(() => parse(props.value));
const date = computed(() => parsed.value?.date || null);
const options = computed(() => {
  const styles = ['full', 'long', 'medium', 'short'];
  const result = {};
  if (renderMode.value !== 'time') result.dateStyle = choice(props.dateStyle, styles, 'medium');
  if (renderMode.value !== 'date') result.timeStyle = choice(props.timeStyle, styles, 'short');
  // 纯日期/纯时间没有时区：固定按 UTC 输出，保证日历值不因宿主时区跨日。
  if (parsed.value && parsed.value.kind !== 'instant') result.timeZone = 'UTC';
  else if (props.timeZone) result.timeZone = props.timeZone;
  return result;
});
function formatter(locale) {
  const resolved = locale || props.locale;
  try { return new Intl.DateTimeFormat(resolved, options.value); }
  catch { const safe = { ...options.value }; delete safe.timeZone; try { return new Intl.DateTimeFormat(resolved, safe); } catch { return null; } }
}
const text = computed(() => {
  if (!date.value) return props.fallback;
  const format = formatter(undefined) || formatter('en-GB');
  if (format) return format.format(date.value);
  return renderMode.value === 'time' ? date.value.toISOString().slice(11, 16) : date.value.toISOString().slice(0, 10);
});
const dateTime = computed(() => {
  if (!date.value || (renderMode.value === 'time' && parsed.value.kind !== 'instant')) return undefined;
  // 纯日期的机器可读值保持 YYYY-MM-DD，不制造一个可能被解读成时刻的午夜时间戳。
  if (parsed.value.kind === 'date' && renderMode.value === 'date') return parsed.value.text;
  return date.value.toISOString();
});
</script>
<template><time ref="root" v-bind="forwardedAttrs" class="kima-time-display" :datetime="dateTime">{{ text }}</time></template>
<style scoped lang="scss">
.kima-time-display {
  display: inline;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
</style>
