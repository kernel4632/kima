<!-- modelValue: [start,end], each YYYY-MM-DD|null. First pick -> [date,null]; second pick sorts endpoints.
Incomplete endpoints are omitted from FormData, but both native date inputs still participate in required validation. -->
<script setup>
import { computed, ref, watchEffect } from "vue";
import KimaCalendar from "./calendar.ce.vue";
import KimaButton from "./button.ce.vue";
import { useInputState } from "../utils/input-state.js";
import { monthKey, normalizeDate, shiftDay, shiftMonth, todayKey } from "../utils/local-date.js";
import { useRipple } from "../utils/ripple.js";
const props = defineProps({
  modelValue: { type: Array, default: () => [null, null] },
  name: String, startName: String, endName: String,
  startLabel: { type: String, default: "开始日期" }, endLabel: { type: String, default: "结束日期" },
  min: String, max: String, disabledDates: { type: Array, default: () => [] },
  required: Boolean, disabled: Boolean, locale: { type: String, default: "zh-CN" }, firstDay: { type: Number, default: 1 },
});
const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null), startInput = ref(null), endInput = ref(null);
function normalize(value) { return [normalizeDate(value?.[0]), normalizeDate(value?.[1])]; }
const { local, update } = useInputState(props, emit, root, normalize);
useRipple(root);
const month = ref(monthKey(local.value[0] || todayKey()));
const nextMonth = computed(() => shiftMonth(month.value, 1));
const names = computed(() => [props.startName || (props.name ? `${props.name}[start]` : undefined), props.endName || (props.name ? `${props.name}[end]` : undefined)]);
const rangeError = computed(() => {
  const [start, end] = local.value;
  if (start && end && end < start) return "结束日期不能早于开始日期";
  if (start && end && props.disabledDates.some(date => date >= start && date <= end)) return "范围包含不可用日期";
  if (start && props.disabledDates.includes(start) || end && props.disabledDates.includes(end)) return "日期不可用";
  return "";
});
watchEffect(() => { startInput.value?.setCustomValidity(rangeError.value); endInput.value?.setCustomValidity(rangeError.value); }, { flush: "post" });
function pick(value) {
  if (!normalizeDate(value)) return;
  const [start, end] = local.value;
  update(!start || end ? [value, null] : value < start ? [value, start] : [start, value]);
}
function type(index, value) { const next = [...local.value]; next[index] = normalizeDate(value); update(next); if (index === 0 && next[0]) month.value = monthKey(next[0]); }
function canNavigate(delta) { const target = shiftMonth(month.value, delta), last = shiftDay(shiftMonth(target,2),-1); return !(props.min && last < props.min || props.max && target > props.max); }
function navigate(delta) { if(canNavigate(delta)) month.value = shiftMonth(month.value, delta); }
function changeSecond(value) { month.value = shiftMonth(value, -1); }
</script>
<template>
  <div ref="root" class="kima-date-range-picker" role="group" aria-label="日期范围" :aria-disabled="disabled || undefined">
    <div class="kima-date-range-picker__fields">
      <input ref="startInput" class="kima-date-range-picker__input" type="date" :aria-label="startLabel" :name="local[0] ? names[0] : undefined" :value="local[0] || ''" :min="min" :max="max" :required="required" :disabled="disabled" @input.stop="type(0,$event.target.value)" @change.stop>
      <span aria-hidden="true">→</span>
      <input ref="endInput" class="kima-date-range-picker__input" type="date" :aria-label="endLabel" :name="local[1] ? names[1] : undefined" :value="local[1] || ''" :min="local[0] || min" :max="max" :required="required" :disabled="disabled" @input.stop="type(1,$event.target.value)" @change.stop>
    </div>
    <div class="kima-date-range-picker__navigation"><KimaButton variant="text" :disabled="disabled || !canNavigate(-1)" @click="navigate(-1)">上一月</KimaButton><KimaButton variant="text" :disabled="disabled || !canNavigate(1)" @click="navigate(1)">下一月</KimaButton><KimaButton variant="text" :disabled="disabled || !local.some(Boolean)" @click="update([null,null])">清空范围</KimaButton></div>
    <div class="kima-date-range-picker__months">
      <KimaCalendar :view-date="month" :model-value="null" :range-start="local[0]" :range-end="local[1]" :min="min" :max="max" :disabled-dates="disabledDates" :disabled="disabled" :first-day="firstDay" :locale="locale" range-mode hide-navigation @update:model-value="pick" @update:view-date="month = $event" />
      <KimaCalendar :view-date="nextMonth" :model-value="null" :range-start="local[0]" :range-end="local[1]" :min="min" :max="max" :disabled-dates="disabledDates" :disabled="disabled" :first-day="firstDay" :locale="locale" range-mode hide-navigation @update:model-value="pick" @update:view-date="changeSecond" />
    </div>
    <p v-if="rangeError" role="alert">{{ rangeError }}</p>
    <span class="kima-date-range-picker__status" role="status">{{ local[0] && !local[1] ? '请选择结束日期' : '' }}</span>
  </div>
</template>
<style scoped lang="scss">
@use "../styles/advanced-input" as *;
.kima-date-range-picker { @include advanced-root; display:grid; gap:var(--kima-space-3); max-width:800px;
  &__fields { display:flex; align-items:center; gap:var(--kima-space-2); min-width:0; }
  &__input { @include advanced-field; flex:1; min-width:0; }
  &__navigation { display:flex; flex-wrap:wrap; gap:var(--kima-space-2); }
  &__months { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:var(--kima-space-4); }
  p { margin:0; color:var(--kima-color-error); }
  &__status { color:var(--kima-color-on-surface-variant); font-size:var(--kima-font-size-label-medium); }
}
@media(max-width:640px) { .kima-date-range-picker__months {grid-template-columns:1fr;} .kima-date-range-picker__fields {flex-wrap:wrap; > input {flex-basis:100%;} > span {display:none;} } }
</style>
