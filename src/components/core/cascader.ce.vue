<!--
级联选择器：按层级展示 options，并用 modelValue 保存从根到当前项的 value 路径。
options 格式为 { value, label, children, disabled }；children 缺失时按叶子项处理，适合异步补充数据。
本地上游参考只有 DankDropdown、DankListView 和 DankListItem，没有 Cascader 或 Combobox 控件。
原生表单只提交路径最后一个 value；对象会按 String(value) 提交，复杂路径请在 Vue 事件中读取完整数组。
Vue 用 v-model 和 v-model:open 同步状态；调用示例：
  <kima-cascader v-model="path" name="category" label="分类" :options="categories" clearable />
  <kima-cascader v-model="path" v-model:open="open" :options="categories" required />
-->
<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs, useHost, useId, watch } from "vue";
import KimaIcon from "./icon.ce.vue";
import { ArrowDown01Icon, ArrowRight01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { useRipple } from "../../utils/ripple.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  options: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "请选择",
  },
  name: String,
  required: Boolean,
  disabled: Boolean,
  clearable: Boolean,
  open: Boolean,
});

const emit = defineEmits(["update:modelValue", "change", "update:open"]);
const attrs = useAttrs();
const host = getCurrentInstance()?.ce ? useHost() : null;
const forwardedAttrs = computed(() => host ? { ...attrs, id: undefined } : attrs);

const root = ref(null);
const trigger = ref(null);
const nativeInput = ref(null);
// 整块场地（__control）是"点得动的东西"，按下时整块亮一下。
const control = ref(null);
useRipple(control);
const optionElements = ref([]);
const localPath = shallowRef(Array.isArray(props.modelValue) ? [...props.modelValue] : []);
const localOpen = ref(props.open && !props.disabled);
const activeColumn = ref(0);
const activeIndexes = ref([]);
const baseId = `kima-cascader-${useId()}`;
const triggerId = `${baseId}-trigger`;
const listboxId = `${baseId}-listbox`;
const inputId = `${baseId}-native`;
let ownerDocument;
let form;
let initialPath = [];
let resetTimer;
let restoreFocus = true;

const columns = computed(() => {
  const result = [];
  let items = Array.isArray(props.options) ? props.options : [];

  for (let column = 0; ; column += 1) {
    result.push(items);
    const selected = items.find((item) => Object.is(item?.value, localPath.value[column]));
    const children = Array.isArray(selected?.children) ? selected.children : [];
    if (!selected || children.length === 0) break;
    items = children;
  }

  return result;
});

const selectedItems = computed(() => {
  const result = [];
  let items = Array.isArray(props.options) ? props.options : [];

  for (let column = 0; column < localPath.value.length; column += 1) {
    const item = items.find((candidate) => Object.is(candidate?.value, localPath.value[column]));
    if (!item) break;
    result.push(item);
    items = Array.isArray(item.children) ? item.children : [];
  }

  return result;
});

const displayLabel = computed(() => selectedItems.value.map((item) => item.label).join(" / "));
const nativeValue = computed(() => localPath.value.length ? String(localPath.value[localPath.value.length - 1]) : "");
const activeId = computed(() => {
  const index = activeIndexes.value[activeColumn.value];
  return localOpen.value && Number.isInteger(index) && index >= 0
    ? `${listboxId}-${activeColumn.value}-option-${index}`
    : undefined;
});

function pathEquals(left, right) {
  return left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
}

function enabledIndexes(items) {
  return items.flatMap((item, index) => item?.disabled ? [] : [index]);
}

function firstEnabledIndex(items) {
  return enabledIndexes(items)[0] ?? -1;
}

function lastEnabledIndex(items) {
  const indexes = enabledIndexes(items);
  return indexes[indexes.length - 1] ?? -1;
}

function selectedIndex(items, column) {
  const index = items.findIndex((item) => Object.is(item?.value, localPath.value[column]) && !item.disabled);
  return index >= 0 ? index : firstEnabledIndex(items);
}

function setOptionRef(element, column, index) {
  if (!optionElements.value[column]) optionElements.value[column] = [];
  if (element) optionElements.value[column][index] = element;
  else delete optionElements.value[column][index];
}

function focusOption(column, index) {
  const item = columns.value[column]?.[index];
  if (!item || item.disabled) return;
  activeColumn.value = column;
  activeIndexes.value[column] = index;
  nextTick(() => optionElements.value[column]?.[index]?.scrollIntoView({ block: "nearest", inline: "nearest" }));
}

function initializeActive() {
  activeIndexes.value = columns.value.map((items, column) => selectedIndex(items, column));
  activeColumn.value = Math.max(0, columns.value.length - 1);
}

function moveActive(step) {
  const items = columns.value[activeColumn.value] || [];
  const indexes = enabledIndexes(items);
  if (!indexes.length) return;
  const current = indexes.indexOf(activeIndexes.value[activeColumn.value]);
  const next = current < 0 ? (step > 0 ? 0 : indexes.length - 1) : (current + step + indexes.length) % indexes.length;
  focusOption(activeColumn.value, indexes[next]);
}

function updateValue(path) {
  if (props.disabled || pathEquals(path, localPath.value)) return false;
  localPath.value = [...path];
  emit("update:modelValue", localPath.value);
  emit("change", localPath.value);
  return true;
}

function selectItem(item, column) {
  if (props.disabled || item?.disabled) return;
  const nextPath = localPath.value.slice(0, column);
  nextPath.push(item.value);
  updateValue(nextPath);

  const children = Array.isArray(item.children) ? item.children : [];
  if (children.length) {
    activeColumn.value = Math.min(column + 1, columns.value.length - 1);
    activeIndexes.value[activeColumn.value] = firstEnabledIndex(children);
    nextTick(() => focusOption(activeColumn.value, activeIndexes.value[activeColumn.value]));
    return;
  }

  closeCascader(true);
}

function openCascader() {
  if (props.disabled || localOpen.value) return;
  localOpen.value = true;
  initializeActive();
  emit("update:open", true);
  nextTick(() => trigger.value?.focus());
}

function closeCascader(returnFocus = true) {
  if (!localOpen.value) return;
  restoreFocus = returnFocus;
  localOpen.value = false;
  emit("update:open", false);
}

function toggleCascader() {
  if (localOpen.value) closeCascader(true);
  else openCascader();
}

function clearValue() {
  updateValue([]);
  closeCascader(true);
  nextTick(() => trigger.value?.focus());
}

function handleKeydown(event) {
  if (props.disabled || event.isComposing) return;
  if (event.key === "Tab") {
    closeCascader(false);
    return;
  }
  if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End", "Enter", " ", "Escape"].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();

  if (event.key === "Escape") {
    closeCascader(true);
    return;
  }

  if (!localOpen.value) {
    openCascader();
    if (event.key === "ArrowUp" || event.key === "ArrowLeft" || event.key === "End") {
      nextTick(() => focusOption(activeColumn.value, lastEnabledIndex(columns.value[activeColumn.value] || [])));
    } else if (event.key === "Home") {
      nextTick(() => focusOption(activeColumn.value, firstEnabledIndex(columns.value[activeColumn.value] || [])));
    }
    return;
  }

  const items = columns.value[activeColumn.value] || [];
  if (event.key === "ArrowDown") moveActive(1);
  else if (event.key === "ArrowUp") moveActive(-1);
  else if (event.key === "Home") focusOption(activeColumn.value, firstEnabledIndex(items));
  else if (event.key === "End") focusOption(activeColumn.value, lastEnabledIndex(items));
  else if (event.key === "ArrowLeft") {
    if (activeColumn.value > 0) focusOption(activeColumn.value - 1, activeIndexes.value[activeColumn.value - 1]);
  } else if (event.key === "ArrowRight") {
    const item = items[activeIndexes.value[activeColumn.value]];
    const children = Array.isArray(item?.children) ? item.children : [];
    if (children.length) selectItem(item, activeColumn.value);
  } else {
    const item = items[activeIndexes.value[activeColumn.value]];
    if (item) selectItem(item, activeColumn.value);
  }
}

function handleOutside(event) {
  if (localOpen.value && !event.composedPath().includes(root.value)) closeCascader(false);
}

function handleInvalid(event) {
  event.preventDefault();
  nextTick(() => trigger.value?.focus());
}

function handleReset(event) {
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    if (event.defaultPrevented) return;
    const nextPath = [...initialPath];
    const changed = !pathEquals(localPath.value, nextPath);
    localPath.value = nextPath;
    closeCascader(false);
    if (nativeInput.value) nativeInput.value.value = nextPath.length ? String(nextPath[nextPath.length - 1]) : "";
    if (changed) emit("update:modelValue", localPath.value);
  }, 0);
}

watch(() => props.modelValue, (value) => {
  localPath.value = Array.isArray(value) ? [...value] : [];
});
watch(() => props.open, (open) => {
  localOpen.value = open && !props.disabled;
  if (localOpen.value) initializeActive();
});
watch(() => props.disabled, (disabled) => { if (disabled) closeCascader(false); });
watch(columns, initializeActive, { deep: true });
watch(localOpen, (open, wasOpen) => {
  if (open) initializeActive();
  else if (wasOpen && restoreFocus) nextTick(() => trigger.value?.focus());
  restoreFocus = true;
}, { immediate: true });

onMounted(() => {
  initialPath = [...localPath.value];
  form = nativeInput.value?.form;
  form?.addEventListener("reset", handleReset);
  ownerDocument = root.value.ownerDocument;
  ownerDocument.addEventListener("pointerdown", handleOutside, true);
  ownerDocument.addEventListener("focusin", handleOutside, true);
});

onBeforeUnmount(() => {
  clearTimeout(resetTimer);
  form?.removeEventListener("reset", handleReset);
  ownerDocument?.removeEventListener("pointerdown", handleOutside, true);
  ownerDocument?.removeEventListener("focusin", handleOutside, true);
});
</script>

<template>
  <div
    ref="root"
    v-bind="forwardedAttrs"
    class="kima-cascader"
    :class="{ 'kima-cascader--open': localOpen, 'kima-cascader--disabled': disabled }"
  >
    <div ref="control" class="kima-cascader__control" :aria-disabled="disabled || undefined">
      <button
        :id="triggerId"
        ref="trigger"
        class="kima-cascader__trigger"
        type="button"
        role="combobox"
        :disabled="disabled"
        :aria-expanded="localOpen"
        :aria-controls="listboxId"
        aria-haspopup="listbox"
        :aria-label="attrs['aria-label'] || attrs.ariaLabel || label || undefined"
        :aria-required="required || undefined"
        :aria-activedescendant="activeId"
        @click="toggleCascader"
        @keydown="handleKeydown"
      >
        <span class="kima-cascader__trigger-label" :class="{ 'kima-cascader__trigger-label--placeholder': !displayLabel }">
          {{ displayLabel || placeholder }}
        </span>
        <KimaIcon class="kima-cascader__arrow" :icon="ArrowDown01Icon" :size="20" aria-hidden="true" />
      </button>
      <Transition name="kima-fade"><button
        v-if="clearable && localPath.length"
        class="kima-cascader__clear"
        type="button"
        aria-label="清除选择"
        title="清除选择"
        :disabled="disabled"
        @click.stop="clearValue"
      >
        <KimaIcon :icon="Cancel01Icon" :size="18" aria-hidden="true" />
      </button></Transition>
    </div>

    <input
      ref="nativeInput"
      class="kima-cascader__native"
      type="text"
      :id="inputId"
      :name="name"
      :value="nativeValue"
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
      <div v-if="localOpen" :id="listboxId" class="kima-cascader__popup" role="group" :aria-labelledby="triggerId" @keydown="handleKeydown">
        <TransitionGroup name="kima-list" tag="div" class="kima-cascader__columns" @before-leave="(element) => { element.inert = true; element.setAttribute('aria-hidden', 'true'); }">
        <div v-for="(items, column) in columns" :key="column" class="kima-cascader__column" role="listbox" :aria-label="`第 ${column + 1} 级`">
          <div
            v-for="(item, index) in items"
            :id="`${listboxId}-${column}-option-${index}`"
            :key="index"
            :ref="(element) => setOptionRef(element, column, index)"
            class="kima-cascader__option"
            :class="{
              'kima-cascader__option--active': column === activeColumn && index === activeIndexes[column],
              'kima-cascader__option--selected': Object.is(item.value, localPath[column]),
            }"
            role="option"
            :aria-selected="Object.is(item.value, localPath[column])"
            :aria-disabled="item.disabled || undefined"
            tabindex="-1"
            @pointerdown.prevent
            @click="selectItem(item, column)"
          >
            <span class="kima-cascader__option-label">{{ item.label }}</span>
            <KimaIcon v-if="Array.isArray(item.children) && item.children.length" :icon="ArrowRight01Icon" :size="18" aria-hidden="true" />
          </div>
          <div v-if="items.length === 0" class="kima-cascader__empty" role="status">暂无选项</div>
        </div>
        </TransitionGroup>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;

.kima-cascader {
  position: relative;
  display: inline-flex;
  width: 100%;
  max-width: 480px;
  min-width: 0;
  flex-direction: column;
  gap: var(--kima-space-1);
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
}
/* 控件是一块完整的场地：触发器、箭头、清除按钮都是场地里的排布项。
 * 谁在谁就占自己那一格，多一个少一个由 flex 自动重排——
 * 不用绝对定位去猜坐标，也就不会出现图标叠在一起的情况。 */
.kima-cascader__control {
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
  .kima-cascader--open & {
    background: var(--kima-color-layer-3);
  }

  /* 聚焦提示是一条内阴影：不占位置，也不会把元素撑大。
   * 焦点落在触发器或清除按钮上都算"停在这个框里"，所以用 focus-within。 */
  &:focus-within {
    box-shadow: inset 0 0 0 var(--kima-outline-width-focused) var(--kima-color-primary);
  }

  /* 打开的下拉仍要有"我停在这个框上"的提示，但不用第二圈线：
   * 底色已经升了一档，这就够了。 */
  .kima-cascader--open &:focus-within {
    box-shadow: none;
  }

  .kima-cascader--disabled & {
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }
}

/* 触发器是场地里"占满剩余宽度"的一项：文字在左，箭头在右。
 * 底色和圆角在 __control 上，它自己不再画框。 */
.kima-cascader__trigger {
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

.kima-cascader__trigger-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  pointer-events: none;
}

.kima-cascader__trigger-label--placeholder {
  color: var(--kima-color-on-surface-variant);
}

.kima-cascader__arrow {
  flex: 0 0 auto;
  /* 单独放着时离右边缘 16px，跟旁边的清除按钮留出一个字的空。 */
  margin-right: var(--kima-space-2);
  color: var(--kima-color-on-surface-variant);
  pointer-events: none;
  transition: transform var(--kima-duration-fast) var(--kima-ease-standard);
}

.kima-cascader--open .kima-cascader__arrow {
  transform: rotate(180deg);
}

/* 清除按钮是场地里的普通一项，占 28px 的圆角格，谁也不压着谁。 */
.kima-cascader__clear {
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

.kima-cascader__native {
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

.kima-cascader__popup {
  box-sizing: border-box;
  position: absolute;
  z-index: 20;
  top: calc(100% + var(--kima-space-2));
  left: 0;
  display: flex;
  max-width: min(720px, 100vw);
  max-height: min(360px, 50vh);
  overflow: auto;
  padding: var(--kima-space-2);
  border: 0;
  border-radius: var(--kima-radius-md);
  /* 弹层是实色：它是浮在内容之上的一层，必须挡住背后，不能透。 */
  background: var(--kima-color-popup);
  box-shadow: var(--kima-elevation-3);
}

.kima-cascader__columns { position: relative; display: flex; }

.kima-cascader__column {
  display: grid;
  min-width: 176px;
  max-height: 320px;
  align-content: start;
  gap: var(--kima-space-1);
  padding: 0 var(--kima-space-1);
  overflow-y: auto;
}

.kima-cascader__column + .kima-cascader__column {
  border-left: 1px solid var(--kima-color-outline);
}

.kima-cascader__option {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  gap: var(--kima-space-3);
  padding: var(--kima-space-2) var(--kima-space-3);
  border-radius: var(--kima-radius-sm);
  color: var(--kima-color-on-surface);
  cursor: pointer;
  /* 悬停/高亮是"亮起来"，得看得见过程：底色和文字色都过渡，不瞬切。 */
  transition:
    background-color var(--kima-duration-effects) var(--kima-curve-standard),
    color var(--kima-duration-effects) var(--kima-curve-standard);

  &:hover,
  &--active {
    background: var(--kima-color-layer-3);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: -2px;
  }

  /* 选中项是"容器色底"，文字必须配 on-primary-container：
   * 容器色在浅色主题下本身就是浅底，用 primary 当文字色就成了浅字浅底，看不清。 */
  &--selected {
    color: var(--kima-color-on-primary-container);
    background: var(--kima-color-primary-container);
  }

  /* 选中项被悬停或键盘高亮时，底色从容器色派生，不落回通用悬停色：
   * 换回 layer-3 会让"容器文字 + 深灰底"配成一对，对比度就掉了。 */
  &--selected:hover,
  &--selected.kima-cascader__option--active {
    background: var(--kima-color-primary-container-hover);
  }

  &[aria-disabled="true"] {
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }
}

.kima-cascader__option-label {
  min-width: 0;
  overflow-wrap: anywhere;
}

.kima-cascader__option > svg {
  flex: 0 0 auto;
}

.kima-cascader__empty {
  padding: var(--kima-space-3);
  color: var(--kima-color-on-surface-variant);
  font-size: var(--kima-font-size-sm);
  text-align: center;
}

@media (max-width: 560px) {
  .kima-cascader__popup {
    right: 0;
    max-width: none;
  }

  .kima-cascader__column {
    min-width: 152px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kima-cascader__arrow,
  .kima-cascader__option {
    transition: none;
  }
}
</style>
