<!--
选择器：提供搜索、键盘单选和原生表单提交；items 格式为 { value, label, disabled, description }。
Vue 用 v-model 和 v-model:open 同步状态；原生 HTML 设置元素的 items 属性。
原生表单需要沿用本库的 light DOM 注册方式（shadowRoot: false）。
表单把字符串、数字、布尔值提交为字符串。对象和数组仍可用于 Vue/事件选择，
但原生表单会用 String(value) 提交（对象为 [object Object]）；表单请用唯一的字符串或数字 value。
form.reset() 恢复挂载时的 modelValue；清除选择返回 null，必填时为空值。
调用示例：
  <kima-select v-model="country" name="country" label="国家" :items="countries" searchable clearable />
  <kima-select v-model="choice" v-model:open="selectOpen" :items="items" placeholder="请选择" />
-->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs, useHost, useId, getCurrentInstance, watch } from "vue";
import KimaIcon from "./icon.ce.vue";
import { useRemoteOptions } from "../utils/remote-options.js";
import { ArrowDown01Icon, Cancel01Icon, Search01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { useRipple } from "../utils/ripple.js";
import { presenceTransition } from "../utils/motion.js";

defineOptions({ inheritAttrs: false });
const attrs = useAttrs();
const host = getCurrentInstance().ce ? useHost() : null;

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean, Object, Array],
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
    default: "请选择",
  },
  disabled: Boolean,
  required: Boolean,
  name: String,
  searchable: Boolean,
  clearable: Boolean,
  open: Boolean,
  loader: { type: Function, default: undefined },
  debounce: { type: Number, default: 200 },
  retry: { type: Number, default: 0 },
});

const emit = defineEmits(["update:modelValue", "change", "update:open", "options-loading", "options-load", "options-error"]);

const root = ref(null);
const trigger = ref(null);
// 整块场地（__control）是"点得动的东西"，按下时整块亮一下。
// 亮层铺满整块底、由场地自己的圆角裁边，触发器或清除按钮都算在场地上。
const control = ref(null);
useRipple(control);
const searchInput = ref(null);
const nativeSelect = ref(null);
const optionElements = ref([]);
const query = ref("");
const activeIndex = ref(-1);
// 对象值保留调用方的身份，不转换成另一个 Proxy 后导致 Object.is 失配。
const localValue = shallowRef(props.modelValue);
const localOpen = ref(props.open && !props.disabled);
let ownerDocument;
let form;
let initialValue;
let resetTimer;
let restoreFocus = true;
const baseId = useId();
const triggerId = `kima-select-${baseId}-trigger`;
const listboxId = `kima-select-${baseId}-listbox`;
const hiddenSelectId = `kima-select-${baseId}-native`;

// 跟文本框同一套做法：组件不画标签，可访问名取调用方的 aria-label，其次 label 属性。
// 可见的「国家」两个字由使用者自己用普通排版文字写在自己的布局里。
const ariaLabel = computed(() => attrs["aria-label"] || attrs.ariaLabel || props.label || undefined);
const remoteLoader = computed(() => props.loader);
const remoteQuery = computed(() => query.value);
const { items: remoteItems, loading: remoteLoading, error: remoteError, retry: retryRemote } = useRemoteOptions(remoteLoader, remoteQuery, computed(() => props.debounce), computed(() => props.retry), emit);
const optionItems = computed(() => typeof props.loader === "function" ? remoteItems.value : props.items);
const visibleItems = computed(() => {
  const text = query.value.trim().toLocaleLowerCase();
  if (typeof props.loader === "function") return optionItems.value;
  if (!text) return optionItems.value;
  return optionItems.value.filter((item) => `${item.label} ${item.description || ""}`.toLocaleLowerCase().includes(text));
});
const selectedItem = computed(() => optionItems.value.find((item) => Object.is(item.value, localValue.value)));
const nativeValue = computed({
  get: () => selectedItem.value ? localValue.value : "",
  set: () => {
    const index = nativeSelect.value.selectedIndex;
    updateValue(index > 0 ? optionItems.value[index - 1].value : null);
  },
});
const enabledIndexes = computed(() => visibleItems.value.flatMap((item, index) => item.disabled ? [] : [index]));
const activeId = computed(() => localOpen.value && activeIndex.value >= 0 ? `${listboxId}-option-${activeIndex.value}` : undefined);

// --- 移动高亮，不把键盘焦点从搜索框中移走 ---
function highlight(index) {
  activeIndex.value = index;
  nextTick(() => optionElements.value[index]?.scrollIntoView({ block: "nearest" }));
}

function moveActive(step) {
  const count = enabledIndexes.value.length;
  if (!count) return;
  const current = enabledIndexes.value.indexOf(activeIndex.value);
  const next = current < 0 ? (step > 0 ? 0 : count - 1) : (current + step + count) % count;
  highlight(enabledIndexes.value[next]);
}

// --- 打开和关闭：不要求原生 HTML 的调用方每次都回写属性 ---
function openSelect() {
  if (props.disabled || localOpen.value) return;
  localOpen.value = true;
  emit("update:open", true);
}

function closeSelect(returnToTrigger = true) {
  if (!localOpen.value) return;
  restoreFocus = returnToTrigger;
  localOpen.value = false;
  emit("update:open", false);
}

function toggleSelect() {
  if (localOpen.value) closeSelect();
  else openSelect();
}

// --- 提交一次选择；重复选择不重复发出 change ---
function updateValue(value) {
  if (props.disabled || Object.is(value, localValue.value)) return;
  localValue.value = value;
  emit("update:modelValue", value);
  emit("change", value);
}

function selectItem(item) {
  if (props.disabled || item.disabled) return;
  updateValue(item.value);
  closeSelect();
}

function clearValue() {
  updateValue(null);
  closeSelect();
  nextTick(() => trigger.value?.focus());
}

function resetValue(event) {
  // 原生 reset 可以被取消；等待默认动作完成后再同步显示与提交值。
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    if (event.defaultPrevented) return;
    localValue.value = initialValue;
    nativeSelect.value.selectedIndex = optionItems.value.findIndex((item) => Object.is(item.value, initialValue)) + 1;
    closeSelect(false);
    emit("update:modelValue", initialValue);
  }, 0);
}

// --- 键盘：跳过禁用项；搜索时保留空格和输入法组合 ---
function handleKeydown(event) {
  if (props.disabled || event.isComposing) return;
  if (event.key === "Tab") {
    closeSelect(false); // Tab 继续前往下一个控件，不把焦点拉回来。
    return;
  }
  if (event.key === " " && event.target === searchInput.value) return;
  if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape"].includes(event.key)) return;
  event.preventDefault();
  event.stopPropagation();

  if (event.key === "Escape") {
    closeSelect();
    return;
  }
  if (!localOpen.value) {
    openSelect();
    if (event.key === "ArrowUp" || event.key === "End") {
      nextTick(() => highlight(enabledIndexes.value.at(-1) ?? -1));
    } else if (event.key === "Home") {
      nextTick(() => highlight(enabledIndexes.value[0] ?? -1));
    }
    return;
  }
  if (event.key === "ArrowDown") moveActive(1);
  else if (event.key === "ArrowUp") moveActive(-1);
  else if (event.key === "Home") highlight(enabledIndexes.value[0] ?? -1);
  else if (event.key === "End") highlight(enabledIndexes.value.at(-1) ?? -1);
  else {
    const item = visibleItems.value[activeIndex.value];
    if (item) selectItem(item);
  }
}

// --- 外部点击与焦点离开：composedPath 也能识别 Shadow DOM 内部点击 ---
function handleOutside(event) {
  if (localOpen.value && !event.composedPath().includes(root.value)) closeSelect(false);
}

watch(() => props.modelValue, (value) => { localValue.value = value; });
watch(() => props.open, (open) => { localOpen.value = open && !props.disabled; });
watch(() => props.disabled, (disabled) => { if (disabled) closeSelect(false); });

watch(localOpen, async (open, wasOpen) => {
  if (open) {
    query.value = "";
    const selected = visibleItems.value.findIndex((item) => Object.is(item.value, localValue.value) && !item.disabled);
    highlight(selected >= 0 ? selected : (enabledIndexes.value[0] ?? -1));
    await nextTick();
    if (localOpen.value) (props.searchable ? searchInput.value : trigger.value)?.focus();
  } else {
    if (wasOpen && restoreFocus) nextTick(() => { if (!localOpen.value) trigger.value?.focus(); });
    restoreFocus = true;
  }
}, { immediate: true });

watch(visibleItems, () => {
  // 搜索结果或选项更新后，不让高亮指向另一条过期结果。
  const selected = visibleItems.value.findIndex((item) => Object.is(item.value, localValue.value) && !item.disabled);
  highlight(!query.value && selected >= 0 ? selected : (enabledIndexes.value[0] ?? -1));
});

onMounted(() => {
  initialValue = props.modelValue;
  form = nativeSelect.value.form;
  form?.addEventListener("reset", resetValue);
  ownerDocument = root.value.ownerDocument;
  ownerDocument.addEventListener("pointerdown", handleOutside);
  ownerDocument.addEventListener("focusin", handleOutside);
});
onBeforeUnmount(() => {
  clearTimeout(resetTimer);
  form?.removeEventListener("reset", resetValue);
  ownerDocument.removeEventListener("pointerdown", handleOutside);
  ownerDocument.removeEventListener("focusin", handleOutside);
});
</script>

<template>
  <div ref="root" v-bind="{ ...attrs, id: host ? undefined : attrs.id }" class="kima-select" :class="{ 'kima-select--open': localOpen, 'kima-select--disabled': disabled }">
    <div ref="control" class="kima-select__control" :aria-disabled="disabled || undefined">
      <button
        :id="triggerId"
        ref="trigger"
        class="kima-select__trigger"
        type="button"
        role="combobox"
        :disabled="disabled"
        :aria-expanded="localOpen"
        :aria-controls="listboxId"
        aria-haspopup="listbox"
        :aria-label="ariaLabel"
        :aria-required="required || undefined"
        :aria-activedescendant="searchable ? undefined : activeId"
        @click="toggleSelect"
        @keydown="handleKeydown"
      >
        <span class="kima-select__trigger-label" :class="{ 'kima-select__trigger-label--placeholder': !selectedItem }">
          {{ selectedItem ? selectedItem.label : placeholder }}
        </span>
        <KimaIcon class="kima-select__arrow" :icon="ArrowDown01Icon" :size="20" aria-hidden="true" />
      </button>
      <Transition name="kima-fade" v-bind="presenceTransition">
      <button
        v-if="clearable && selectedItem"
        class="kima-select__clear"
        type="button"
        aria-label="清除选择"
        title="清除选择"
        :disabled="disabled"
        @click.stop="clearValue"
      >
        <KimaIcon :icon="Cancel01Icon" :size="18" aria-hidden="true" />
      </button>
      </Transition>
    </div>

    <!-- 原生选项保留真实值；阻止原生事件冒泡，只发出组件自己的 change。 -->
    <select
      ref="nativeSelect"
      v-model="nativeValue"
      :id="hiddenSelectId"
      class="kima-select__native"
      :name="name"
      :required="required"
      :disabled="disabled"
      tabindex="-1"
      aria-hidden="true"
      @input.stop
      @change.stop
      @invalid.prevent="trigger?.focus()"
    >
      <option value=""></option>
      <option
        v-for="(item, index) in optionItems"
        :key="index"
        :value="item.value"
        :disabled="item.disabled"
      >
        {{ item.label }}
      </option>
    </select>

    <!-- 出场/退场走全库共用的 kima-popup 过渡（定义在 _tokens.scss）。 -->
    <Transition name="kima-popup" v-bind="presenceTransition">
      <div
        v-if="localOpen"
        class="kima-select__popup"
      >
        <div v-if="searchable" class="kima-select__search-wrap">
          <KimaIcon class="kima-select__search-icon" :icon="Search01Icon" :size="18" aria-hidden="true" />
          <input
            ref="searchInput"
            v-model="query"
            class="kima-select__search"
            type="search"
            role="combobox"
            aria-label="搜索选项"
            aria-expanded="true"
            aria-autocomplete="list"
            :aria-controls="listboxId"
            :aria-activedescendant="activeId"
            @input.stop
            @change.stop
            @keydown="handleKeydown"
          >
        </div>

        <div :id="listboxId" class="kima-select__options" role="listbox" :aria-labelledby="triggerId" :aria-busy="remoteLoading || undefined">
          <div v-if="remoteLoading" class="kima-select__status" role="status">加载中…</div>
          <div v-else-if="remoteError" class="kima-select__status kima-select__status--error" role="alert">{{ remoteError }} <button type="button" @click="retryRemote">重试</button></div>
          <div
            v-for="(item, index) in visibleItems"
            :id="`${listboxId}-option-${index}`"
            :key="index"
            :ref="(element) => { optionElements[index] = element; }"
            class="kima-select__option"
            :class="{ 'kima-select__option--active': index === activeIndex, 'kima-select__option--selected': Object.is(item.value, localValue) }"
            role="option"
            :aria-selected="Object.is(item.value, localValue)"
            :aria-disabled="item.disabled || undefined"
            @pointerdown.prevent
            @click="selectItem(item)"
          >
            <span class="kima-select__option-copy">
              <span class="kima-select__option-label">{{ item.label }}</span>
              <span v-if="item.description" class="kima-select__option-description">{{ item.description }}</span>
            </span>
            <KimaIcon v-if="Object.is(item.value, localValue)" class="kima-select__check" :icon="Tick01Icon" :size="18" aria-hidden="true" />
          </div>
        </div>
        <div v-if="!remoteLoading && !remoteError && visibleItems.length === 0" class="kima-select__empty" role="status">没有匹配选项</div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
@use "../styles/mixins" as *;

.kima-select {
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

/* 控件是一块完整的场地：触发器、箭头、清除按钮都是场地里的排布项。
 * 谁在谁就占自己那一格，多一个少一个由 flex 自动重排——
 * 不用绝对定位去猜坐标，也就不会出现图标叠在一起的情况。 */
.kima-select__control {
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
  .kima-select--open & {
    background: var(--kima-color-layer-3);
  }

  /* 聚焦提示是一条内阴影：不占位置，也不会把元素撑大。
   * 焦点落在触发器或清除按钮上都算"停在这个框里"，所以用 focus-within。 */
  &:focus-within {
    box-shadow: inset 0 0 0 var(--kima-outline-width-focused) var(--kima-color-primary);
  }

  /* 打开的下拉仍要有"我停在这个框上"的提示，但不用第二圈线：
   * 底色已经升了一档，这就够了。 */
  .kima-select--open &:focus-within {
    box-shadow: none;
  }

  .kima-select--disabled & {
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }
}

/* 触发器是场地里"占满剩余宽度"的一项：文字在左，箭头在右。
 * 底色和圆角在 __control 上，它自己不再画框。 */
.kima-select__trigger {
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

.kima-select__trigger-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kima-select__trigger-label--placeholder,
.kima-select__search::placeholder {
  color: var(--kima-color-on-surface-variant);
}

.kima-select__arrow {
  flex: 0 0 auto;
  /* 单独放着时离右边缘 16px（场地 8 + 自己 8），跟旁边的清除按钮留出一个字的空。 */
  margin-right: var(--kima-space-2);
  color: var(--kima-color-on-surface-variant);
  transition: transform var(--kima-duration-fast) var(--kima-ease-standard);
}

.kima-select--open .kima-select__arrow {
  transform: rotate(180deg);
}

/* 清除按钮是场地里的普通一项，占 28px 的圆角格，谁也不压着谁。 */
.kima-select__clear {
  @include kima-motion-colors;
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

.kima-select__native {
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

.kima-select__popup {
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

.kima-select__search-wrap {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: var(--kima-space-2);
}

.kima-select__search-icon {
  position: absolute;
  left: var(--kima-space-3);
  color: var(--kima-color-on-surface-variant);
  pointer-events: none;
}
.kima-select__search {
  box-sizing: border-box;
  width: 100%;
  min-height: var(--kima-touch-target);
  padding: 0 var(--kima-space-3) 0 40px;
  border: 0;
  border-radius: var(--kima-radius-m);
  color: var(--kima-color-on-surface);
  /* 搜索框跟页面里的输入框同一个做法：靠底色认出来，聚焦时叠一圈主色，
   * 不画描边。弹层是实色底，叠一层半透明的 on-surface 就看得出来。 */
  background: var(--kima-color-layer-2);
  font: inherit;
  outline: none;

  &:focus {
    background: var(--kima-color-layer-3);
    box-shadow: inset 0 0 0 var(--kima-outline-width-focused) var(--kima-color-primary);
  }
}

.kima-select__options {
  display: grid;
  gap: var(--kima-space-1);
}

.kima-select__option {
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
  &:focus-visible,
  &--active {
    background: var(--kima-color-layer-3);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: -2px;
  }

  &--selected {
    color: var(--kima-color-primary);
  }

  &[aria-disabled="true"] {
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }
}

.kima-select__option-copy {
  min-width: 0;
  display: grid;
  gap: var(--kima-space-1);
}

.kima-select__option-label,
.kima-select__option-description {
  overflow-wrap: anywhere;
}

@media (prefers-reduced-motion: reduce) {
  .kima-select__trigger,
  .kima-select__arrow,
  .kima-select__option {
    transition: none;
  }
}

.kima-select__option-description,
.kima-select__empty {
  color: var(--kima-color-on-surface-variant);
  font-size: var(--kima-font-size-sm);
}

.kima-select__check {
  flex: 0 0 auto;
  /* 勾跟着所在行的文字色走：选中行是 primary（选中项不加底色），勾也用同一个色。
   * 写死颜色的话，选中行换配色时勾会和文字对不上。 */
  color: inherit;
}

.kima-select__empty,
.kima-select__status {
  padding: var(--kima-space-3);
  text-align: center;
}
.kima-select__status--error { color: var(--kima-color-error); }
.kima-select__status button { margin-inline-start: var(--kima-space-2); color: var(--kima-color-primary); background: transparent; border: 0; font: inherit; text-decoration: underline; cursor: pointer; }
</style>
