<!--
按钮组：把一组项目渲染成单选、多选或标签页，并提供方向键移动焦点。
调用示例：
  <kima-button-group v-model="view" :items="views" />
  <kima-button-group v-model="filters" :items="filters" multiple orientation="vertical" />
  <kima-button-group v-model="tab" :items="tabs" role="tablist" />
-->
<script setup>
import { computed, getCurrentInstance, nextTick, ref, shallowRef, useAttrs, watch } from "vue";
import KimaIcon from "./icon.ce.vue";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { useRipple } from "../../utils/ripple.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: [String, Number, Array, Boolean, Object],
    default: null,
  },
  multiple: Boolean,
  orientation: {
    type: String,
    default: "horizontal",
  },
  size: {
    type: String,
    default: "default",
  },
});

const emit = defineEmits(["update:modelValue", "change"]);
const attrs = useAttrs();
const isCustomElement = Boolean(getCurrentInstance()?.ce);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const buttons = ref([]);
const root = ref(null);
useRipple(root);
const localValue = shallowRef(props.modelValue);
const focusedIndex = ref(-1);
watch(() => props.modelValue, (value) => { localValue.value = value; });

const groupOrientation = computed(() =>
  props.orientation === "vertical" ? "vertical" : "horizontal",
);
const groupSize = computed(() => {
  const sizes = ["small", "default", "large"];
  return sizes.includes(props.size) ? props.size : "default";
});
const groupRole = computed(() =>
  attrs.role === "tablist" ? "tablist" : "group",
);
const selectedValues = computed(() =>
  props.multiple ? (Array.isArray(localValue.value) ? localValue.value : []) : [localValue.value],
);
const firstEnabledIndex = computed(() => props.items.findIndex((item) => !item.disabled));
const activeIndex = computed(() => {
  if (focusedIndex.value >= 0 && props.items[focusedIndex.value] && !props.items[focusedIndex.value].disabled) return focusedIndex.value;
  const selectedIndex = props.items.findIndex((item) => isSelected(item) && !item.disabled);
  return selectedIndex >= 0 ? selectedIndex : firstEnabledIndex.value;
});

function isSelected(item) {
  return selectedValues.value.some((value) => Object.is(value, item.value));
}

function setButtonRef(element, index) {
  buttons.value[index] = element;
}

function select(item) {
  if (item.disabled) return;

  if (props.multiple) {
    const values = [...selectedValues.value];
    const index = values.findIndex((value) => Object.is(value, item.value));
    if (index >= 0) values.splice(index, 1);
    else values.push(item.value);
    localValue.value = values;
    emit("update:modelValue", values);
    emit("change", values);
    return;
  }

  if (Object.is(item.value, localValue.value)) return;
  localValue.value = item.value;
  emit("update:modelValue", item.value);
  emit("change", item.value);
}

function focusItem(index, selectOnMove = false) {
  const item = props.items[index];
  if (!item || item.disabled) return;
  nextTick(() => buttons.value[index]?.focus());
  if (selectOnMove) select(item);
}

function moveFocus(index, event) {
  if (event.isComposing) return;
  const forward = groupOrientation.value === "horizontal"
    ? event.key === "ArrowRight"
    : event.key === "ArrowDown";
  const backward = groupOrientation.value === "horizontal"
    ? event.key === "ArrowLeft"
    : event.key === "ArrowUp";

  if (event.key === "Home") {
    event.preventDefault();
    focusItem(firstEnabledIndex.value, groupRole.value === "tablist");
    return;
  }
  if (event.key === "End") {
    event.preventDefault();
    for (let last = props.items.length - 1; last >= 0; last -= 1) {
      if (!props.items[last].disabled) {
        focusItem(last, groupRole.value === "tablist");
        return;
      }
    }
  }
  if (!forward && !backward) return;

  event.preventDefault();
  let next = index;
  for (let step = 0; step < props.items.length; step += 1) {
    next = forward
      ? (next + 1) % props.items.length
      : (next - 1 + props.items.length) % props.items.length;
    if (!props.items[next].disabled) {
      focusItem(next, groupRole.value === "tablist");
      return;
    }
  }
}
</script>

<template>
  <div
    ref="root"
    class="kima-button-group"
    :class="[
      `kima-button-group--${groupOrientation}`,
      `kima-button-group--${groupSize}`,
    ]"
     v-bind="forwardedAttrs"
    :role="groupRole"
    :aria-orientation="groupRole === 'tablist' ? groupOrientation : undefined"
  >
    <!-- 对勾只在多选时显示：多选看不出当前哪几项被选中，勾能补上这个信息；
         单选靠选中项变色就够了，再加勾是多余的装饰，还会把标签挤偏。 -->
    <button
      v-for="(item, index) in items"
      :key="item.value"
      :ref="(element) => setButtonRef(element, index)"
      class="kima-button-group__item"
      :class="{ 'kima-button-group__item--selected': isSelected(item) }"
      type="button"
      :disabled="item.disabled"
      :role="groupRole === 'tablist' ? 'tab' : undefined"
      :aria-selected="groupRole === 'tablist' ? isSelected(item) : undefined"
      :aria-pressed="groupRole === 'group' ? isSelected(item) : undefined"
      :tabindex="index === activeIndex ? 0 : -1"
      @click="select(item)"
      @focus="focusedIndex = index"
      @keydown="moveFocus(index, $event)"
    >
      <Transition name="kima-content"><span v-if="multiple && isSelected(item)" class="kima-button-group__check" aria-hidden="true"><KimaIcon :icon="Tick02Icon" :size="16" /></span></Transition>
      <slot :item="item" :index="index" :selected="isSelected(item)">{{ item.label }}</slot>
    </button>
  </div>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;

.kima-button-group {
  @include kima-ripple-host;
  /* 段与段之间不留缝，整条连成一片，看起来才是一个连续的控件。 */
  display: inline-flex;
  align-items: stretch;
  gap: 0;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  overflow: hidden;

  /* 横向：整条是一条药丸。段高 48，满圆半径 24 正好是半圆，看起来就是"一条胶囊"。 */
  border-radius: var(--kima-radius-full);

  /* 纵向：不能用满圆。三段叠起来总高约 150，满圆半径会是 75，
   * 两端各被啃掉一半高度，整条就成了一个竖着的胶囊，跟横向不是一个东西了。
   * 改用 L（16），跟 M3 分段按钮的圆角档一致。 */
  &--vertical {
    flex-direction: column;
    border-radius: var(--kima-radius-l);
  }
}
.kima-button-group__item {
  box-sizing: border-box;
  /* DMS 中等档：高 40、最小宽 64、内边距 16、圆角 S 8。 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--kima-space-s);
  min-width: 88px;
  min-height: var(--kima-button-height-s);
  padding: 0 var(--kima-space-6);
  /* 圆角由外层容器统一裁剪，各段自己不带圆角，内角才是真的直角。 */
  border: 0;
  border-radius: 0;
  color: var(--kima-color-on-secondary-container);
  background: var(--kima-color-secondary-container);
  font: inherit;
  font-size: var(--kima-font-size-label-large);
  font-weight: var(--kima-font-weight-semi-bold);
  cursor: pointer;
  transition:
    background-color var(--kima-duration-effects) var(--kima-curve-standard),
    color var(--kima-duration-effects) var(--kima-curve-standard);

  @include kima-state-layer;
  @include kima-focus-ring;
  /* 各段裁剪状态层；点击涟漪由整组宿主承接。 */
  @include kima-ripple-host;

  /* 段与段之间用一条弱描边分开，避免相邻两段同色糊成一块。 */
  & + & {
    box-shadow: inset var(--kima-outline-width) 0 0 0 var(--kima-color-outline-variant);
  }

  &:disabled {
    color: var(--kima-color-on-surface-38);
    background: var(--kima-color-on-surface-12);
    cursor: not-allowed;
  }
}

/* 选中段换成主色实心，是整条里唯一的高亮，一眼能看出当前项。 */
.kima-button-group__item--selected {
  color: var(--kima-color-on-primary);
  background: var(--kima-color-primary);
}

.kima-button-group__check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* 纵向时把分隔线转成上边线。 */
.kima-button-group--vertical .kima-button-group__item + .kima-button-group__item {
  box-shadow: inset 0 var(--kima-outline-width) 0 0 var(--kima-color-outline-variant);
}

/* 焦点环往内收：整条被容器裁剪，往外画会被切掉，键盘用户就看不到焦点了。 */
.kima-button-group__item:focus-visible {
  outline-offset: calc(0px - var(--kima-focus-ring-offset));
}

/* small 档：矮一档，用在工具栏这类紧凑位置。 */
.kima-button-group--small .kima-button-group__item {
  min-width: 72px;
  min-height: var(--kima-space-10);
  padding-inline: var(--kima-space-4);
  font-size: var(--kima-font-size-label-medium);
}

/* large 档：高一档，用做主操作区的大分段。 */
.kima-button-group--large .kima-button-group__item {
  min-height: var(--kima-button-height-l);
  padding-inline: var(--kima-space-8);
  font-size: var(--kima-font-size-body-large);
}
@media (prefers-reduced-motion: reduce) { .kima-button-group__item { transition: none; } }
</style>
