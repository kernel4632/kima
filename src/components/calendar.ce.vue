<!-- Local YYYY-MM-DD or null. Inline month grid; viewDate is the first day of the visible month.
Range highlighting is presentational (rangeStart/rangeEnd); selection remains a single date. -->
<script setup>
import { computed, nextTick, ref, useId, watch, watchEffect } from "vue";
import { useInputState } from "../utils/input-state.js";
import { civilDate, dateKey, formatDate, monthKey, normalizeDate, parseDate, shiftDay, shiftMonth, todayKey } from "../utils/local-date.js";
import { useContentMotion } from "../utils/content-motion.js";
import { useRipple } from "../utils/ripple.js";
const props = defineProps({
  modelValue: { type: String, default: null }, viewDate: String,
  min: String, max: String, disabledDates: { type: Array, default: () => [] },
  firstDay: { type: Number, default: 1 }, locale: { type: String, default: "zh-CN" },
  label: { type: String, default: "日历" }, name: String, required: Boolean, disabled: Boolean,
  rangeStart: String, rangeEnd: String, hideNavigation: Boolean, rangeMode: Boolean,
});
const emit = defineEmits(["update:modelValue", "change", "update:viewDate"]);
const root = ref(null), native = ref(null), grid = ref(null);
const { local, update } = useInputState(props, emit, root, normalizeDate);
useRipple(root);
const id = `kima-calendar-${useId()}`;
const today = ref(todayKey());
const month = ref(monthKey(normalizeDate(props.viewDate) || local.value || today.value));
const focusDate = ref(local.value || today.value);
const weekStart = computed(() => ((Math.floor(props.firstDay) % 7) + 7) % 7);
function blocked(value) { return props.disabled || Boolean((normalizeDate(props.min) && value < props.min) || (normalizeDate(props.max) && value > props.max) || props.disabledDates.includes(value)); }
const days = computed(() => {
  const first = parseDate(month.value);
  const lead = (first.getDay() - weekStart.value + 7) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const value = shiftDay(month.value, index - lead);
    return { value, day: Number(value.slice(-2)), outside: value.slice(0, 7) !== month.value.slice(0, 7), disabled: blocked(value) };
  });
});
const weeks = computed(() => Array.from({ length: 6 }, (_, index) => days.value.slice(index * 7, index * 7 + 7)));
useContentMotion(grid, () => month.value);
const title = computed(() => formatDate(month.value, props.locale, { month: "long", year: "numeric" }));
const weekdays = computed(() => Array.from({ length: 7 }, (_, index) => formatDate(dateKey(civilDate(2023, 0, 1 + weekStart.value + index)), props.locale, { weekday: "short" })));
const tabDate = computed(() => days.value.find(day => day.value === focusDate.value && !day.disabled)?.value || days.value.find(day => !day.outside && !day.disabled)?.value || days.value.find(day => !day.disabled)?.value);
watch(() => props.viewDate, value => { if (normalizeDate(value)) month.value = monthKey(value); });
watch(() => props.modelValue, value => { if (normalizeDate(value)) { focusDate.value = value; if (!props.viewDate) month.value = monthKey(value); } });
watchEffect(() => { native.value?.setCustomValidity(local.value && blocked(local.value) ? "日期不可用" : ""); }, { flush: "post" });
function setMonth(value) { month.value = monthKey(value); emit("update:viewDate", month.value); }
function canNavigate(delta) { const target = shiftMonth(month.value, delta), end = shiftDay(shiftMonth(target, 1), -1); return !(props.min && end < props.min || props.max && target > props.max); }
function navigate(delta) { if (!props.disabled && canNavigate(delta)) setMonth(shiftMonth(month.value, delta)); }
async function focus(value, direction = 1) {
  if (props.min && value < props.min) value = props.min;
  if (props.max && value > props.max) value = props.max;
  for (let count = 0; count < 3660 && blocked(value); count += 1) {
    const next = shiftDay(value, direction);
    if (props.min && next < props.min || props.max && next > props.max) return;
    value = next;
  }
  if (blocked(value)) return;
  focusDate.value = value;
  if (value.slice(0, 7) !== month.value.slice(0, 7)) setMonth(value);
  await nextTick(); root.value?.querySelector(`[data-date="${value}"]`)?.focus();
}
function keydown(event, day) {
  if (event.isComposing) return;
  const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  let target;
  if (event.key in moves) target = shiftDay(day.value, moves[event.key]);
  else if (["PageUp", "PageDown"].includes(event.key)) target = shiftMonth(day.value, (event.key === "PageUp" ? -1 : 1) * (event.shiftKey ? 12 : 1));
  else if (["Home", "End"].includes(event.key)) { const offset = (parseDate(day.value).getDay() - weekStart.value + 7) % 7; target = shiftDay(day.value, event.key === "Home" ? -offset : 6 - offset); }
  if (target) { event.preventDefault(); focus(target, target < day.value ? -1 : 1); }
}
function select(day) { if (day.disabled) return; focusDate.value = day.value; update(day.value); }
defineExpose({ focus: () => focus(tabDate.value || month.value), navigate });
</script>
<template>
  <section ref="root" class="kima-calendar" :aria-label="label">
    <header class="kima-calendar__head">
      <button v-if="!hideNavigation" class="kima-calendar__nav" type="button" aria-label="上一月" :disabled="disabled || !canNavigate(-1)" @click="navigate(-1)">‹</button>
      <h2 :id="id" aria-live="polite">{{ title }}</h2>
      <button v-if="!hideNavigation" class="kima-calendar__nav" type="button" aria-label="下一月" :disabled="disabled || !canNavigate(1)" @click="navigate(1)">›</button>
    </header>
    <div ref="grid" role="grid" :aria-labelledby="id" class="kima-calendar__grid">
      <div role="row" class="kima-calendar__row"><span v-for="(weekday,index) in weekdays" :key="index" role="columnheader">{{ weekday }}</span></div>
      <div v-for="(week,index) in weeks" :key="index" role="row" class="kima-calendar__row">
        <div v-for="day in week" :key="day.value" role="gridcell" :aria-selected="(!rangeMode && day.value === local) || day.value === rangeStart || day.value === rangeEnd || Boolean(rangeStart && rangeEnd && day.value >= rangeStart && day.value <= rangeEnd)">
          <button type="button" :data-date="day.value" :aria-label="formatDate(day.value,locale,{dateStyle:'full'})" :aria-current="day.value === today ? 'date' : undefined" :disabled="day.disabled" :tabindex="day.value === tabDate ? 0 : -1" :class="['kima-calendar__day', { 'is-outside':day.outside, 'is-today':day.value===today, 'is-selected':(!rangeMode && day.value===local) || day.value===rangeStart || day.value===rangeEnd, 'is-range':rangeStart && rangeEnd && day.value>=rangeStart && day.value<=rangeEnd }]" @focus="focusDate = day.value" @click="select(day)" @keydown="keydown($event,day)">{{ day.day }}</button>
        </div>
      </div>
    </div>
    <input ref="native" class="kima-calendar__native" type="text" :name="name" :value="local || ''" :required="required" :disabled="disabled" tabindex="-1" aria-hidden="true" @input.stop @invalid.prevent="focus(tabDate || month)">
  </section>
</template>
<style scoped lang="scss">
@use "../styles/advanced-input" as *;
@use "../styles/mixins" as *;
.kima-calendar {
  @include advanced-root; display:grid; gap:var(--kima-space-2); width:100%; max-width:380px;
  &__head { display:flex; align-items:center; justify-content:space-between; gap:var(--kima-space-2); h2 { flex:1; text-align:center; margin:0; font-size:var(--kima-font-size-title-small); } }
  &__nav { @include advanced-action; width:var(--kima-touch-target); padding:0; font-size:var(--kima-font-size-title-large); }
  &__grid { display:grid; gap:var(--kima-space-1); }
  &__row { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:2px; text-align:center; > span { font-size:var(--kima-font-size-label-small); padding-block:var(--kima-space-2); color:var(--kima-color-on-surface-variant); } }
  &__day { @include kima-motion-colors; @include kima-focus-ring; width:100%; aspect-ratio:1; min-height:40px; padding:0; border:0; border-radius:var(--kima-radius-full); background:var(--kima-color-transparent); color:inherit; font:inherit; cursor:pointer;
    &:hover:not(:disabled) { background:var(--kima-color-layer-3); }
    &.is-outside { color:var(--kima-color-on-surface-variant); }
    &.is-today { box-shadow:inset 0 0 0 1px var(--kima-color-primary); }
    &.is-range { background:var(--kima-color-primary-container); color:var(--kima-color-on-primary-container); &:hover:not(:disabled){background:var(--kima-color-primary-container-hover);} }
    &.is-selected { background:var(--kima-color-primary); color:var(--kima-color-on-primary); }
    &:disabled { opacity:var(--kima-opacity-disabled); cursor:not-allowed; }
  }
  &__native { @include advanced-native; }
}
</style>
