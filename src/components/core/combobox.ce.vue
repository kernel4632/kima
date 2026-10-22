<!--
组合框：用 items { value, label, disabled, description } 提供可输入、可过滤的单选框。
modelValue 保存选中 value；freeSolo 为 true 时，输入的自由文本也会成为 modelValue。
本地上游参考只有 DankDropdown、DankListView 和 DankListItem，没有 Cascader 或 Combobox 控件。
原生表单提交 modelValue；对象会按 String(value) 提交。input 表示当前文字，change 只在确认值变化后发送一次。
Vue 用 v-model 和 v-model:open 同步状态；调用示例：
  <kima-combobox v-model="country" name="country" label="国家" :items="countries" searchable clearable />
  <kima-combobox v-model="tag" :items="tags" free-solo searchable @input="onText" />
-->
<script setup>
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs, useHost, useId, watch } from "vue";
import KimaIcon from "./icon.ce.vue";
import { useRemoteOptions } from "../../utils/remote-options.js";
import { ArrowDown01Icon, Cancel01Icon, Search01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { useRipple } from "../../utils/ripple.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: null,
  },
  items: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "请选择或输入",
  },
  name: String,
  required: Boolean,
  disabled: Boolean,
  clearable: Boolean,
  searchable: {
    type: Boolean,
    default: true,
  },
  open: Boolean,
  freeSolo: Boolean,
  loader: { type: Function, default: undefined },
  debounce: { type: Number, default: 200 },
  retry: { type: Number, default: 0 },
});

const emit = defineEmits(["input", "update:modelValue", "change", "update:open", "options-loading", "options-load", "options-error"]);
const attrs = useAttrs();
const host = getCurrentInstance()?.ce ? useHost() : null;
const forwardedAttrs = computed(() => host ? { ...attrs, id: undefined } : attrs);

const root = ref(null);
const control = ref(null);
useRipple(control);
const input = ref(null);
const nativeInput = ref(null);
const optionElements = ref([]);
const query = ref("");
const activeIndex = ref(-1);
const localValue = shallowRef(props.modelValue);
const committedValue = shallowRef(props.modelValue);
const localOpen = ref(props.open && !props.disabled);
const baseId = `kima-combobox-${useId()}`;
const inputId = `${baseId}-input`;
const listboxId = `${baseId}-listbox`;
let ownerDocument;
let form;
let initialValue;
let restoreFocus = true;

const remoteLoader = computed(() => props.loader);
const remoteQuery = computed(() => query.value);
const { items: remoteItems, loading: remoteLoading, error: remoteError, retry: retryRemote } = useRemoteOptions(remoteLoader, remoteQuery, computed(() => props.debounce), computed(() => props.retry), emit);
const optionItems = computed(() => typeof props.loader === "function" ? remoteItems.value : props.items);
const selectedItem = computed(() => optionItems.value.find((item) => Object.is(item?.value, localValue.value)) || null);
const visibleItems = computed(() => {
  const text = props.searchable ? query.value.trim().toLocaleLowerCase() : "";
  if (typeof props.loader === "function" || !text) return optionItems.value;
  return optionItems.value.filter((item) => `${item?.label || ""} ${item?.description || ""}`.toLocaleLowerCase().includes(text));
});
const nativeValue = computed(() => localValue.value === null || localValue.value === undefined ? "" : String(localValue.value));
const activeId = computed(() => localOpen.value && activeIndex.value >= 0 ? `${listboxId}-option-${activeIndex.value}` : undefined);
const canClear = computed(() => props.clearable && (localValue.value !== null && localValue.value !== undefined && localValue.value !== "" || query.value.length > 0));

function setOptionRef(element, index) {
  if (element) optionElements.value[index] = element;
  else delete optionElements.value[index];
}

function enabledIndexes() {
  return visibleItems.value.flatMap((item, index) => item?.disabled ? [] : [index]);
}

function firstEnabledIndex() {
  return enabledIndexes()[0] ?? -1;
}

function lastEnabledIndex() {
  const indexes = enabledIndexes();
  return indexes[indexes.length - 1] ?? -1;
}

function selectedVisibleIndex() {
  const index = visibleItems.value.findIndex((item) => Object.is(item?.value, localValue.value) && !item.disabled);
  return index >= 0 ? index : firstEnabledIndex();
}

function setActive(index, focus = false) {
  if (index < 0 || !visibleItems.value[index] || visibleItems.value[index].disabled) return;
  activeIndex.value = index;
  nextTick(() => {
    if (focus) optionElements.value[index]?.focus();
    optionElements.value[index]?.scrollIntoView({ block: "nearest" });
  });
}

function moveActive(step) {
  const indexes = enabledIndexes();
  if (!indexes.length) return;
  const current = indexes.indexOf(activeIndex.value);
  const next = current < 0 ? (step > 0 ? 0 : indexes.length - 1) : (current + step + indexes.length) % indexes.length;
  setActive(indexes[next]);
}

function emitCommittedChange(value) {
  if (Object.is(value, committedValue.value)) return;
  committedValue.value = value;
  emit("change", value);
}

function setModelValue(value, commit = false) {
  if (!Object.is(value, localValue.value)) {
    localValue.value = value;
    emit("update:modelValue", value);
  }
  if (commit) emitCommittedChange(value);
}

function selectedText() {
  return selectedItem.value ? selectedItem.value.label : "";
}

function openCombobox() {
  if (props.disabled || localOpen.value) return;
  localOpen.value = true;
  activeIndex.value = selectedVisibleIndex();
  emit("update:open", true);
}

function closeCombobox(returnFocus = true) {
  if (!localOpen.value) return;
  restoreFocus = returnFocus;
  localOpen.value = false;
  emit("update:open", false);
}

function commitInput() {
  if (props.freeSolo) {
    const value = query.value === "" ? null : query.value;
    setModelValue(value);
    emitCommittedChange(value);
  } else {
    query.value = selectedText();
  }
}

function selectItem(item) {
  if (props.disabled || item?.disabled) return;
  query.value = item.label;
  setModelValue(item.value, true);
  closeCombobox(true);
}

function selectActive() {
  const item = visibleItems.value[activeIndex.value];
  if (item) selectItem(item);
  else if (props.freeSolo) {
    commitInput();
    closeCombobox(true);
  }
}

function clearValue() {
  query.value = "";
  setModelValue(null, true);
  closeCombobox(true);
  nextTick(() => input.value?.focus());
}

function handleInput(event) {
  if (props.disabled) return;
  query.value = event.target.value;
  emit("input", query.value);
  if (!localOpen.value) openCombobox();
  if (props.freeSolo) setModelValue(query.value === "" ? null : query.value);
}

function handleKeydown(event) {
  if (props.disabled || event.isComposing) return;
  if (event.key === "Tab") {
    commitInput();
    closeCombobox(false);
    return;
  }
  if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape"].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();

  if (event.key === "Escape") {
    query.value = selectedText();
    closeCombobox(true);
    return;
  }
  if (!localOpen.value) {
    openCombobox();
    if (event.key === "ArrowUp" || event.key === "End") nextTick(() => setActive(lastEnabledIndex()));
    else if (event.key === "Home") nextTick(() => setActive(firstEnabledIndex()));
    return;
  }
  if (event.key === "ArrowDown") moveActive(1);
  else if (event.key === "ArrowUp") moveActive(-1);
  else if (event.key === "Home") setActive(firstEnabledIndex());
  else if (event.key === "End") setActive(lastEnabledIndex());
  else selectActive();
}

function handleOutside(event) {
  if (!localOpen.value || event.composedPath().includes(root.value)) return;
  commitInput();
  closeCombobox(false);
}

function handleInvalid(event) {
  event.preventDefault();
  nextTick(() => input.value?.focus());
}

function handleReset(event) {
  queueMicrotask(() => {
    if (event.defaultPrevented) return;
    const changed = !Object.is(localValue.value, initialValue);
    localValue.value = initialValue;
    committedValue.value = initialValue;
    query.value = optionItems.value.find((item) => Object.is(item?.value, initialValue))?.label || (props.freeSolo && initialValue != null ? String(initialValue) : "");
    closeCombobox(false);
    if (nativeInput.value) nativeInput.value.value = initialValue == null ? "" : String(initialValue);
    if (changed) emit("update:modelValue", initialValue);
  });
}

watch(() => props.modelValue, (value) => {
  localValue.value = value;
  committedValue.value = value;
  query.value = optionItems.value.find((item) => Object.is(item?.value, value))?.label || (props.freeSolo && value != null ? String(value) : "");
});
watch(() => props.items, () => {
  if (!localOpen.value) query.value = selectedText();
}, { deep: true });
watch(() => props.open, (open) => {
  localOpen.value = open && !props.disabled;
  if (localOpen.value) activeIndex.value = selectedVisibleIndex();
});
watch(() => props.disabled, (disabled) => { if (disabled) closeCombobox(false); });
watch(visibleItems, () => {
  activeIndex.value = selectedVisibleIndex();
});
watch(localOpen, (open, wasOpen) => {
  if (open) nextTick(() => input.value?.focus());
  else if (wasOpen && restoreFocus) nextTick(() => input.value?.focus());
  restoreFocus = true;
}, { immediate: true });

onMounted(() => {
  initialValue = localValue.value;
  query.value = selectedText() || (props.freeSolo && initialValue != null ? String(initialValue) : "");
  form = nativeInput.value?.form;
  form?.addEventListener("reset", handleReset);
  ownerDocument = root.value.ownerDocument;
  ownerDocument.addEventListener("pointerdown", handleOutside);
  ownerDocument.addEventListener("focusin", handleOutside);
});

onBeforeUnmount(() => {
  form?.removeEventListener("reset", handleReset);
  ownerDocument?.removeEventListener("pointerdown", handleOutside);
  ownerDocument?.removeEventListener("focusin", handleOutside);
});
</script>

<template>
  <div
    ref="root"
    v-bind="forwardedAttrs"
    class="kima-combobox"
    :class="{ 'kima-combobox--open': localOpen, 'kima-combobox--disabled': disabled }"
  >
    <div ref="control" class="kima-combobox__control" :aria-disabled="disabled || undefined">
      <KimaIcon v-if="searchable" class="kima-combobox__search-icon" :icon="Search01Icon" :size="18" aria-hidden="true" />
      <input
        :id="inputId"
        ref="input"
        class="kima-combobox__input"
        type="text"
        role="combobox"
        :value="query"
        :placeholder="placeholder"
        :readonly="!searchable"
        :disabled="disabled"
        :aria-expanded="localOpen"
        :aria-controls="listboxId"
        aria-haspopup="listbox"
        aria-autocomplete="list"
        :aria-label="attrs['aria-label'] || attrs.ariaLabel || label || undefined"
        :aria-required="required || undefined"
        :aria-activedescendant="activeId"
        @focus="openCombobox"
        @click="openCombobox"
        @input.stop="handleInput"
        @change.stop="commitInput"
        @keydown="handleKeydown"
      >
      <Transition name="kima-fade"><button
        v-if="canClear"
        class="kima-combobox__clear"
        type="button"
        aria-label="清除输入"
        title="清除输入"
        :disabled="disabled"
        @click="clearValue"
      >
        <KimaIcon :icon="Cancel01Icon" :size="18" aria-hidden="true" />
      </button></Transition>
      <button class="kima-combobox__toggle" type="button" :disabled="disabled" aria-label="显示选项" @mousedown.prevent @click="localOpen ? closeCombobox(true) : openCombobox()">
        <KimaIcon class="kima-combobox__arrow" :icon="ArrowDown01Icon" :size="20" aria-hidden="true" />
      </button>
    </div>

    <input
      ref="nativeInput"
      class="kima-combobox__native"
      type="text"
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
      <div v-if="localOpen" class="kima-combobox__popup">
        <div :id="listboxId" class="kima-combobox__options" role="listbox" :aria-labelledby="inputId" :aria-busy="remoteLoading || undefined">
          <div v-if="remoteLoading" class="kima-combobox__status" role="status">加载中…</div>
          <div v-else-if="remoteError" class="kima-combobox__status kima-combobox__status--error" role="alert">{{ remoteError }} <button type="button" @click="retryRemote">重试</button></div>
          <div
            v-for="(item, index) in visibleItems"
            :id="`${listboxId}-option-${index}`"
            :key="index"
            :ref="(element) => setOptionRef(element, index)"
            class="kima-combobox__option"
            :class="{ 'kima-combobox__option--active': index === activeIndex, 'kima-combobox__option--selected': Object.is(item.value, localValue) }"
            role="option"
            :aria-selected="Object.is(item.value, localValue)"
            :aria-disabled="item.disabled || undefined"
            tabindex="-1"
            @pointerdown.prevent
            @click="selectItem(item)"
          >
            <span class="kima-combobox__option-copy">
              <span class="kima-combobox__option-label">{{ item.label }}</span>
              <span v-if="item.description" class="kima-combobox__option-description">{{ item.description }}</span>
            </span>
            <Transition name="kima-fade"><KimaIcon v-if="Object.is(item.value, localValue)" class="kima-combobox__check" :icon="Tick01Icon" :size="18" aria-hidden="true" /></Transition>
          </div>
          <div v-if="!remoteLoading && !remoteError && visibleItems.length === 0" class="kima-combobox__empty" role="status">没有匹配选项</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;
.kima-combobox {
  position: relative;
  display: inline-flex;
  width: 100%;
  max-width: 360px;
  min-width: 0;
  flex-direction: column;
  gap: var(--kima-space-1);
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
}

/* 控件是一块完整的场地：搜索图标、输入框、清除按钮、下拉按钮都是场地里的排布项。
 * 谁在谁就占自己那一格，多一个少一个由 flex 自动重排——
 * 不用绝对定位去猜坐标，也就不会出现图标叠在一起的情况。 */
.kima-combobox__control {
  @include kima-state-layer;
  @include kima-ripple-host;
  position: relative;
  display: flex;
  height: var(--kima-field-height);
  align-items: center;
  gap: var(--kima-space-1);
  box-sizing: border-box;
  padding-right: var(--kima-space-2);
  border: 0;
  border-radius: var(--kima-radius-m);
  background: var(--kima-color-layer-2);
  transition:
    background-color var(--kima-duration-effects) var(--kima-curve-standard),
    box-shadow var(--kima-duration-effects) var(--kima-curve-standard);

  /* 聚焦时底色升一档，再叠一圈主色。和文本框用同一种提示。 */
  &:focus-within,
  .kima-combobox--open & {
    background: var(--kima-color-layer-3);
  }

  &:focus-within {
    box-shadow: inset 0 0 0 var(--kima-outline-width-focused) var(--kima-color-primary);
  }
}

/* 输入框铺满剩下的宽度，左右都是并排项，不用留白给绝对定位的图标。 */
.kima-combobox__input {
  box-sizing: border-box;
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  padding: 0 var(--kima-space-2) 0 var(--kima-field-padding);
  font-size: var(--kima-font-size-body-large);
  border: 0;
  border-radius: inherit;
  color: var(--kima-color-on-surface);
  background: var(--kima-color-transparent);
  font: inherit;
  outline: none;

  &:disabled {
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }

  &::placeholder {
    color: var(--kima-color-on-surface-variant);
  }
}

.kima-combobox__search-icon {
  flex: 0 0 auto;
  margin-left: var(--kima-space-3);
  color: var(--kima-color-on-surface-variant);
  pointer-events: none;
}

/* 有搜索图标时，输入框左边的留白交给图标占位，文字挨着图标起步。 */
.kima-combobox__search-icon + .kima-combobox__input {
  padding-left: var(--kima-space-1);
}

/* 清除和下拉按钮都是场地里 28px 的圆角格，各占各的位置，谁也不压着谁。 */
.kima-combobox__clear,
.kima-combobox__toggle {
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
    opacity: var(--kima-opacity-disabled);
  }
}

.kima-combobox__arrow {
  transition: transform var(--kima-duration-fast) var(--kima-ease-standard);
}

.kima-combobox--open .kima-combobox__arrow {
  transform: rotate(180deg);
}

.kima-combobox__native {
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

.kima-combobox__popup {
  box-sizing: border-box;
  position: absolute;
  z-index: 20;
  top: calc(100% + var(--kima-space-2));
  left: 0;
  width: 100%;
  max-height: min(360px, 50vh);
  overflow: auto;
  padding: var(--kima-space-2);
  border: 0;
  border-radius: var(--kima-radius-md);
  /* 弹层是实色：它是浮在内容之上的一层，必须挡住背后，不能透。 */
  background: var(--kima-color-popup);
  box-shadow: var(--kima-elevation-3);
}

.kima-combobox__options {
  display: grid;
  gap: var(--kima-space-1);
}

.kima-combobox__option {
  display: flex;
  min-height: 44px;
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
  &--selected.kima-combobox__option--active {
    background: var(--kima-color-primary-container-hover);
  }

  &[aria-disabled="true"] {
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }
}

.kima-combobox__option-copy {
  min-width: 0;
  display: grid;
  gap: var(--kima-space-1);
}

.kima-combobox__option-label,
.kima-combobox__option-description {
  overflow-wrap: anywhere;
}

.kima-combobox__option-description,
.kima-combobox__empty {
  color: var(--kima-color-on-surface-variant);
  font-size: var(--kima-font-size-sm);
}

.kima-combobox__check {
  flex: 0 0 auto;
  /* 勾跟着所在行的文字色走：选中行是 on-primary-container，勾也用同一个色。
   * 不能写死成 primary——容器色底上 primary 也是浅色，勾会跟底色糊在一起。 */
  color: inherit;
}

.kima-combobox__empty,
.kima-combobox__status {
  padding: var(--kima-space-3);
  text-align: center;
}
.kima-combobox__status--error { color: var(--kima-color-error); }
.kima-combobox__status button { margin-inline-start: var(--kima-space-2); color: var(--kima-color-primary); background: transparent; border: 0; font: inherit; text-decoration: underline; cursor: pointer; }

@media (prefers-reduced-motion: reduce) {
  .kima-combobox__arrow,
  .kima-combobox__option {
    transition: none;
  }
}
</style>
