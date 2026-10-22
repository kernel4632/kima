<!--
日期选择器：弹出月历，用一个隐藏的原生输入框参与表单提交与必填校验。
值统一是 ISO 字符串 YYYY-MM-DD 或 null，方便直接存后端，不用再做时区换算。
所有日期都由“年月日本地数字”算出，不用 Date 字符串解析，因此不会跨时区偏移。
Vue 用 v-model 和 v-model:open 同步状态；原生 HTML 直接写属性即可。
表单重置会回到挂载时的值；清除选择返回 null。
调用示例：
   <kima-date-picker name="birthday" label="生日" required></kima-date-picker>
   <kima-date-picker v-model="day" v-model:open="pickerOpen" min="2024-01-01" max="2024-12-31"
     first-day="1" locale="en-GB" clearable placeholder="选择日期" />
-->
<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useHost, useId, watch } from "vue";
import KimaIcon from "./icon.ce.vue";
import { ArrowLeft01Icon, ArrowRight01Icon, Calendar01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { useRipple } from "../../utils/ripple.js";

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const host = getCurrentInstance()?.ce ? useHost() : null;

const props = defineProps({
  modelValue: {
    type: String,
    default: null,
  },
  min: {
    type: String,
    default: null,
  },
  max: {
    type: String,
    default: null,
  },
  open: Boolean,
  label: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Select date",
  },
  name: String,
  disabled: Boolean,
  required: Boolean,
  clearable: Boolean,
  firstDay: {
    type: Number,
    default: 1,
  },
  locale: {
    type: String,
    default: "en-GB",
  },
  // 允许调用方直接给 7 个星期名，顺序按 firstDay 排列。
  weekdays: {
    type: Array,
    default: null,
  },
  previousMonthLabel: {
    type: String,
    default: "Previous month",
  },
  nextMonthLabel: {
    type: String,
    default: "Next month",
  },
  clearLabel: {
    type: String,
    default: "Clear date",
  },
});

const emit = defineEmits(["update:modelValue", "change", "update:open"]);

const root = ref(null);
const trigger = ref(null);
const nativeInput = ref(null);
// 整块场地（__control）是"点得动的东西"，按下时整块亮一下。
const control = ref(null);
useRipple(control);
const localValue = ref(props.modelValue);
const localOpen = ref(false);
const viewYear = ref(new Date().getFullYear());
const viewMonth = ref(new Date().getMonth());
const focusedIso = ref("");
const todayKey = ref("");
let ownerDocument;
let initialValue;

const baseId = `kima-date-picker-${useId()}`;
const triggerId = `${baseId}-trigger`;
const gridId = `${baseId}-grid`;
const titleId = `${baseId}-title`;

// --- 日期和 ISO 互转：全部走本地年月日，避免 Date 字符串解析带来时区偏移 ---
function pad(number) {
  return String(number).padStart(2, "0");
}

function toIso(year, monthIndex, day) {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

function fromIso(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, monthIndex: month - 1, day };
}

function localDate(iso) {
  const { year, monthIndex, day } = fromIso(iso);
  return new Date(year, monthIndex, day);
}

function todayIso() {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
}

function shiftIso(iso, days) {
  const date = localDate(iso);
  date.setDate(date.getDate() + days);
  return toIso(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function monthStartIso(year, monthIndex) {
  const date = new Date(year, monthIndex, 1);
  return toIso(date.getFullYear(), date.getMonth(), 1);
}

function monthEndIso(year, monthIndex) {
  const date = new Date(year, monthIndex + 1, 0);
  return toIso(date.getFullYear(), date.getMonth(), date.getDate());
}

// 越界的焦点被拉到最近的合法日期上，避免键盘走到选不了的格子里。
function clampToBounds(iso) {
  if (props.min && iso < props.min) return props.min;
  if (props.max && iso > props.max) return props.max;
  return iso;
}

// --- 语言：locale 来自调用方，拼错会抛错，所以在这里换回默认语言一次 ---
function safeFormatter(options) {
  try {
    return new Intl.DateTimeFormat(props.locale || "en-GB", options);
  } catch {
    return new Intl.DateTimeFormat("en-GB", options);
  }
}

const monthFormatter = computed(() => safeFormatter({ year: "numeric", month: "long" }));
const weekdayFormatter = computed(() => safeFormatter({ weekday: "short" }));
const dayFormatter = computed(() => safeFormatter({ year: "numeric", month: "long", day: "numeric" }));

const displayText = computed(() => (localValue.value ? dayFormatter.value.format(localDate(localValue.value)) : props.placeholder));
const monthTitle = computed(() => monthFormatter.value.format(new Date(viewYear.value, viewMonth.value, 1)));

const weekdayLabels = computed(() => {
  if (props.weekdays?.length === 7) return props.weekdays;
  const names = [];
  // 2024-01-07 是周日，往后取 7 天就得到固定的一整周，不受运行时的今天影响。
  for (let index = 0; index < 7; index += 1) {
    names.push(weekdayFormatter.value.format(new Date(2024, 0, 7 + index)));
  }
  const shift = props.firstDay === 0 ? 0 : 1;
  return names.slice(shift).concat(names.slice(0, shift));
});

const gridDays = computed(() => {
  const firstOfMonth = new Date(viewYear.value, viewMonth.value, 1);
  // firstDay 0 表示周日开头，算出当月第一天要向前退几格。
  const lead = (firstOfMonth.getDay() - (props.firstDay === 0 ? 0 : 1) + 7) % 7;
  const cells = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(viewYear.value, viewMonth.value, 1 - lead + index);
    const iso = toIso(date.getFullYear(), date.getMonth(), date.getDate());
    cells.push({
      iso,
      day: date.getDate(),
      outside: date.getMonth() !== viewMonth.value,
      disabled: (props.min && iso < props.min) || (props.max && iso > props.max),
      label: dayFormatter.value.format(date),
    });
  }
  return cells;
});

const weeks = computed(() => Array.from({ length: 6 }, (_, week) => gridDays.value.slice(week * 7, week * 7 + 7)));
// 上个月还剩一天可用就允许翻过去，只有整月都在范围外才禁用。
const canGoPrevious = computed(() => !props.min || monthEndIso(viewYear.value, viewMonth.value - 1) >= props.min);
// 上个月还剩一天可用就允许翻过去，只有整月都在范围外才禁用。
const canGoNext = computed(() => !props.max || monthStartIso(viewYear.value, viewMonth.value + 1) <= props.max);

// --- 打开和关闭：不管调用方有没有回写 open 属性，界面都能自己开合 ---
function showCalendar(notify) {
  if (props.disabled) return;
  todayKey.value = todayIso();
  // 打开时优先落在已选的日期上，其次是今天，最后是范围里最近的一天。
  focusedIso.value = clampToBounds(localValue.value || todayKey.value);
  const focus = fromIso(focusedIso.value);
  viewYear.value = focus.year;
  viewMonth.value = focus.monthIndex;
  localOpen.value = true;
  if (notify) emit("update:open", true);
  nextTick(focusFocusedDay);
}

function hideCalendar(notify, returnFocus) {
  if (!localOpen.value) return;
  localOpen.value = false;
  if (notify) emit("update:open", false);
  if (returnFocus) nextTick(() => trigger.value?.focus());
}

function toggleCalendar() {
  if (localOpen.value) hideCalendar(true, true);
  else showCalendar(true);
}

function activateGrid(element) {
  element.inert = false;
  element.removeAttribute("aria-hidden");
  element.id = gridId;
  element.querySelectorAll("[data-date]").forEach((node) => { node.id = `${gridId}-day-${node.dataset.date}`; });
}

function retireGrid(element) {
  // 旧月份在退场时仍在 DOM 中；立即移除焦点与重复日期 id。
  element.inert = true;
  element.setAttribute("aria-hidden", "true");
  element.removeAttribute("id");
  element.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
}

function focusFocusedDay() {
  if (!localOpen.value || !focusedIso.value) return;
  root.value?.querySelector(`#${gridId}-day-${focusedIso.value}`)?.focus();
}

// --- 提交一次选择；重复选择同一天不重复发出 change ---
function updateValue(iso) {
  if (props.disabled || iso === localValue.value) return;
  localValue.value = iso;
  emit("update:modelValue", iso);
  emit("change", iso);
}

function selectDay(day) {
  if (day.disabled) return;
  focusedIso.value = day.iso;
  updateValue(day.iso);
  hideCalendar(true, true);
}

function clearValue() {
  updateValue(null);
  hideCalendar(true, true);
}

function resetValue(event) {
  // 原生 reset 可以被取消，等默认动作跑完再把显示值和提交值一起还原。
  queueMicrotask(() => {
    if (event.defaultPrevented) return;
    const changed = localValue.value !== initialValue;
    localValue.value = initialValue;
    if (nativeInput.value) nativeInput.value.value = initialValue || "";
    focusedIso.value = clampToBounds(initialValue || todayIso());
    if (changed) emit("update:modelValue", localValue.value);
  });
}

function handleInvalid(event) {
  event.preventDefault();
  nextTick(() => trigger.value?.focus());
}

// --- 键盘：焦点按天移动，跨月时同步翻到对应月份 ---
function moveFocus(targetIso) {
  const clamped = clampToBounds(targetIso);
  const next = fromIso(clamped);
  focusedIso.value = clamped;
  viewYear.value = next.year;
  viewMonth.value = next.monthIndex;
  nextTick(focusFocusedDay);
}

function changeMonth(step) {
  const date = new Date(viewYear.value, viewMonth.value + step, 1);
  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  viewYear.value = year;
  viewMonth.value = monthIndex;
  // 焦点跟着翻页走，同一天号落到新月份，不存在的日号取该月最后一天。
  const current = fromIso(focusedIso.value);
  const day = Math.min(current.day, daysInMonth(year, monthIndex));
  moveFocus(clampToBounds(toIso(year, monthIndex, day)));
}

function handleTriggerKeydown(event) {
  if (props.disabled || !["ArrowDown", "ArrowUp", "PageUp", "PageDown"].includes(event.key)) return;
  event.preventDefault();
  showCalendar(true);
}

function handleGridKeydown(event) {
  if (event.isComposing) return;
  if (event.key === "Escape") {
    event.preventDefault();
    hideCalendar(true, true);
    return;
  }
  // Enter 和空格由原生按钮自己激活，这里只处理换日和翻页。
  if (!event.target.closest(".kima-date-picker__day")) return;
  const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  let target = null;
  if (event.key in moves) target = shiftIso(focusedIso.value, moves[event.key]);
  else if (event.key === "PageUp" || event.key === "PageDown") {
    const step = event.key === "PageUp" ? -1 : 1;
    const date = new Date(viewYear.value, viewMonth.value + step, 1);
    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const current = fromIso(focusedIso.value);
    target = toIso(year, monthIndex, Math.min(current.day, daysInMonth(year, monthIndex)));
  } else if (event.key === "Home" || event.key === "End") {
    const weekday = localDate(focusedIso.value).getDay();
    const start = props.firstDay === 0 ? 0 : 1;
    const offset = (weekday - start + 7) % 7;
    target = event.key === "Home" ? shiftIso(focusedIso.value, -offset) : shiftIso(focusedIso.value, 6 - offset);
  }
  if (!target) return;
  event.preventDefault();
  moveFocus(target);
}

function handleOutside(event) {
  if (localOpen.value && !event.composedPath().includes(root.value)) hideCalendar(false, false);
}

watch(() => props.modelValue, (value) => {
  localValue.value = value;
});

watch(() => props.open, (open) => {
  if (open) showCalendar(false);
  else hideCalendar(false, false);
}, { immediate: true });

watch(() => props.disabled, (disabled) => { if (disabled) hideCalendar(false, false); });

onMounted(() => {
  initialValue = props.modelValue;
  todayKey.value = todayIso();
  ownerDocument = root.value.ownerDocument;
  ownerDocument.addEventListener("pointerdown", handleOutside);
  ownerDocument.addEventListener("focusin", handleOutside);
  nativeInput.value.form?.addEventListener("reset", resetValue);
});

onBeforeUnmount(() => {
  ownerDocument.removeEventListener("pointerdown", handleOutside);
  ownerDocument.removeEventListener("focusin", handleOutside);
});
</script>

<template>
  <div ref="root" v-bind="{ ...attrs, id: host ? undefined : attrs.id }" class="kima-date-picker" :class="{ 'kima-date-picker--open': localOpen, 'kima-date-picker--disabled': disabled }">
    <div ref="control" class="kima-date-picker__control" :aria-disabled="disabled || undefined">
      <button
        :id="triggerId"
        ref="trigger"
        class="kima-date-picker__trigger"
        type="button"
        role="combobox"
        aria-haspopup="grid"
        :aria-expanded="localOpen"
        :aria-controls="gridId"
        :aria-label="attrs['aria-label'] || attrs.ariaLabel || label || placeholder"
        :aria-required="required || undefined"
        :disabled="disabled"
        @click="toggleCalendar"
        @keydown="handleTriggerKeydown"
      >
        <span class="kima-date-picker__trigger-label" :class="{ 'kima-date-picker__trigger-label--placeholder': !localValue }">
          {{ displayText }}
        </span>
        <KimaIcon class="kima-date-picker__icon" :icon="Calendar01Icon" :size="20" aria-hidden="true" />
      </button>
      <Transition name="kima-fade"><button
        v-if="clearable && localValue"
        class="kima-date-picker__clear"
        type="button"
        :aria-label="clearLabel"
        :title="clearLabel"
        :disabled="disabled"
        @click.stop="clearValue"
      >
        <KimaIcon :icon="Cancel01Icon" :size="18" aria-hidden="true" />
      </button></Transition>
    </div>

    <!-- 隐藏输入框带着真实 ISO 值：原生表单能读到它，必填校验也能在这里触发。 -->
    <input
      ref="nativeInput"
      class="kima-date-picker__native"
      type="text"
      :name="name"
      :value="localValue || ''"
      :required="required"
      :disabled="disabled"
      tabindex="-1"
      aria-hidden="true"
      @input.stop
      @change.stop
      @invalid="handleInvalid"
    >

    <!-- 出场/退场走全库共用的 kima-popup 过渡（定义在 _tokens.scss）。 -->
    <Transition name="kima-popup" @before-enter="(element) => { element.inert = false; element.removeAttribute('aria-hidden'); }" @before-leave="(element) => { element.inert = true; element.setAttribute('aria-hidden', 'true'); }">
      <div v-if="localOpen" class="kima-date-picker__popup" @keydown="handleGridKeydown">
        <div class="kima-date-picker__head">
          <button
            class="kima-date-picker__nav"
            type="button"
            :aria-label="previousMonthLabel"
            :title="previousMonthLabel"
            :disabled="disabled || !canGoPrevious"
            @click="changeMonth(-1)"
          >
            <KimaIcon :icon="ArrowLeft01Icon" :size="18" aria-hidden="true" />
          </button>
          <span :id="titleId" class="kima-date-picker__month"><Transition name="kima-fade" mode="out-in"><span :key="monthTitle">{{ monthTitle }}</span></Transition></span>
          <button
            class="kima-date-picker__nav"
            type="button"
            :aria-label="nextMonthLabel"
            :title="nextMonthLabel"
            :disabled="disabled || !canGoNext"
            @click="changeMonth(1)"
          >
            <KimaIcon :icon="ArrowRight01Icon" :size="18" aria-hidden="true" />
          </button>
        </div>

        <Transition name="kima-fade" @before-enter="activateGrid" @before-leave="retireGrid">
        <div :id="gridId" :key="`${viewYear}-${viewMonth}`" class="kima-date-picker__grid" role="grid" :aria-labelledby="titleId">
          <div class="kima-date-picker__row" role="row">
            <span
              v-for="(weekday, index) in weekdayLabels"
              :key="index"
              class="kima-date-picker__weekday"
              role="columnheader"
            >{{ weekday }}</span>
          </div>
          <div v-for="(week, weekIndex) in weeks" :key="weekIndex" class="kima-date-picker__row" role="row">
            <div
              v-for="day in week"
              :key="day.iso"
              class="kima-date-picker__cell"
              role="gridcell"
              :aria-selected="day.iso === localValue"
            >
              <button
                :id="`${gridId}-day-${day.iso}`"
                :data-date="day.iso"
                class="kima-date-picker__day"
                :class="{
                  'kima-date-picker__day--outside': day.outside,
                  'kima-date-picker__day--today': day.iso === todayKey,
                  'kima-date-picker__day--selected': day.iso === localValue,
                }"
                type="button"
                :aria-label="day.label"
                :aria-current="day.iso === todayKey ? 'date' : undefined"
                :disabled="day.disabled"
                :tabindex="day.iso === focusedIso ? 0 : -1"
                @click="selectDay(day)"
              >{{ day.day }}</button>
            </div>
          </div>
        </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;

.kima-date-picker {
  position: relative;
  display: inline-flex;
  width: 100%;
  max-width: 320px;
  min-width: 0;
  flex-direction: column;
  gap: var(--kima-space-1);
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
}

/* 控件是一块完整的场地：触发器、日期图标、清除按钮都是场地里的排布项。
 * 谁在谁就占自己那一格，多一个少一个由 flex 自动重排——
 * 不用绝对定位去猜坐标，也就不会出现图标叠在一起的情况。 */
.kima-date-picker__control {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--kima-space-1);
  height: var(--kima-field-height);
  box-sizing: border-box;
  padding-right: var(--kima-space-2);
  border-radius: var(--kima-radius-m);
  background: var(--kima-color-layer-2);
  transition:
    background-color var(--kima-duration-effects) var(--kima-curve-standard),
    box-shadow var(--kima-duration-effects) var(--kima-curve-standard),
    opacity var(--kima-duration-effects) var(--kima-curve-standard);

  /* 点得动的东西都要有反馈：状态层、焦点环、涟漪，选择器只给这三样。
   * 不接按下回弹：点它是"展开面板"，触发器要一直停在打开状态，
   * 弹簧缩小再弹回的动势跟面板展开方向拧着，反而像点歪了。 */
  @include kima-state-layer;
  @include kima-ripple-host;

  &:hover:not([aria-disabled="true"]),
  .kima-date-picker--open & {
    background: var(--kima-color-layer-3);
  }

  /* 聚焦提示是一条内阴影：不占位置，也不会把元素撑大。
   * 焦点落在触发器或清除按钮上都算"停在这个框里"，所以用 focus-within。 */
  &:focus-within {
    box-shadow: inset 0 0 0 var(--kima-outline-width-focused) var(--kima-color-primary);
  }

  /* 打开日历时焦点在网格里，触发器不用再画第二圈线。 */
  .kima-date-picker--open &:focus-within {
    box-shadow: none;
  }

  .kima-date-picker--disabled & {
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }
}

/* 触发器是场地里"占满剩余宽度"的一项：文字在左，日期图标在右。
 * 底色和圆角在 __control 上，它自己不再画框。 */
.kima-date-picker__trigger {
  box-sizing: border-box;
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  align-items: center;
  justify-content: space-between;
  gap: var(--kima-space-3);
  padding: 0 0 0 var(--kima-field-padding);
  border: 0;
  color: var(--kima-color-on-surface);
  background: var(--kima-color-transparent);
  font: inherit;
  font-size: var(--kima-font-size-body-large);
  text-align: left;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }
}

.kima-date-picker__trigger-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kima-date-picker__trigger-label--placeholder {
  color: var(--kima-color-on-surface-variant);
}

.kima-date-picker__icon {
  flex: 0 0 auto;
  /* 单独放着时离右边缘 16px，跟旁边的清除按钮留出一个字的空。 */
  margin-right: var(--kima-space-2);
  color: var(--kima-color-on-surface-variant);
}

/* 清除按钮是场地里的普通一项，占 28px 的圆角格，谁也不压着谁。 */
.kima-date-picker__clear {
  flex: 0 0 auto;
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--kima-radius-full);
  color: var(--kima-color-on-surface-variant);
  background: var(--kima-color-transparent);
  cursor: pointer;
  @include kima-motion-colors;

  &:hover:not(:disabled),
  &:focus-visible {
    color: var(--kima-color-primary);
    background: var(--kima-color-layer-3);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.kima-date-picker__native {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  border: 0;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.kima-date-picker__popup {
  box-sizing: border-box;
  position: absolute;
  z-index: 20;
  top: calc(100% + var(--kima-space-2));
  left: 0;
  width: max(100%, 268px);
  padding: var(--kima-space-2);
  border: 0;
  border-radius: var(--kima-radius-md);
  /* 弹层是实色：它是浮在内容之上的一层，必须挡住背后，不能透。 */
  background: var(--kima-color-popup);
  box-shadow: var(--kima-elevation-3);
}

.kima-date-picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--kima-space-2);
  padding: 0 var(--kima-space-1) var(--kima-space-2);
}

.kima-date-picker__month {
  font-size: var(--kima-font-size-md);
  font-weight: var(--kima-font-weight-medium);
  text-align: center;
}

.kima-date-picker__nav {
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--kima-radius-full);
  color: var(--kima-color-on-surface-variant);
  background: var(--kima-color-transparent);
  cursor: pointer;
  @include kima-motion-colors;

  &:hover:not(:disabled) {
    color: var(--kima-color-primary);
    background: var(--kima-color-layer-3);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: 1px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }
}

// 翻月时旧网格只淡出，不再占据第二份高度，也不再接收点击。
.kima-date-picker__grid.kima-fade-leave-active { position: absolute; inset-inline: var(--kima-space-2); pointer-events: none; }

.kima-date-picker__grid {
  display: grid;
  gap: 2px;
}

.kima-date-picker__row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.kima-date-picker__weekday {
  padding: var(--kima-space-1) 0;
  color: var(--kima-color-on-surface-variant);
  font-size: var(--kima-font-size-xs);
  font-weight: var(--kima-font-weight-medium);
  text-align: center;
}

.kima-date-picker__cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.kima-date-picker__day {
  display: inline-flex;
  width: 100%;
  aspect-ratio: 1;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--kima-radius-full);
  color: var(--kima-color-on-surface);
  background: var(--kima-color-transparent);
  font: inherit;
  font-size: var(--kima-font-size-md);
  cursor: pointer;
  @include kima-motion-colors;

  &:hover:not(:disabled) {
    background: var(--kima-color-layer-3);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: -2px;
  }

  &--outside {
    color: var(--kima-color-on-surface-variant);
    opacity: var(--kima-opacity-disabled);
  }

  &--today:not(.kima-date-picker__day--selected) {
    color: var(--kima-color-primary);
    box-shadow: inset 0 0 0 1px var(--kima-color-primary);
  }

  &--selected,
  &--selected:hover:not(:disabled) {
    color: var(--kima-color-on-primary);
    background: var(--kima-color-primary);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
    pointer-events: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kima-date-picker__trigger,
  .kima-date-picker__day,
  .kima-date-picker__nav {
    transition: none;
  }
}
</style>
