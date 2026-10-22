<!--
虚拟滚动：固定每行高度，只把视口附近的 items 渲染出来，并用上下空白占住完整列表高度。
items 可以是任意值，也可以是带 value、key 或 id 的对象；对象的 value 会作为选中值。
调用示例：
  <kima-virtual-scroll :items="rows" :item-height="44" height="320px" :overscan="4" v-model="selected">
    <template #default="{ item, index }">{{ index + 1 }}. {{ item.label }}</template>
  </kima-virtual-scroll>
键盘焦点在列表容器上，ArrowUp、ArrowDown、Home、End 移动高亮，Enter 或空格选择当前项。
自定义元素宿主的 id 会保留在宿主上，light DOM 内部不会复制同一个 id。
上游记录：本地参考仓库没有独立的 VirtualScroll；列表行为参考 DankListView、DankFlickable 和 FileListView 的固定行高与可见范围计算。
-->
<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs, useHost, useId, watch } from "vue";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  itemHeight: {
    type: Number,
    default: 40,
  },
  height: {
    type: [Number, String],
    default: 320,
  },
  overscan: {
    type: Number,
    default: 4,
  },
  modelValue: {
    type: [String, Number, Boolean, Object, Array],
    default: undefined,
  },
});

const emit = defineEmits(["update:modelValue", "item-click"]);
const attrs = useAttrs();
const host = getCurrentInstance()?.ce ? useHost() : null;
const forwardedAttrs = computed(() => host ? { ...attrs, id: undefined } : attrs);

const root = ref(null);
const scrollTop = ref(0);
const viewportHeight = ref(0);
const activeIndex = ref(-1);
const localValue = shallowRef(props.modelValue);
let resizeObserver;

const listId = `kima-virtual-scroll-${useId()}`;
const safeItemHeight = computed(() => {
  const value = Number(props.itemHeight);
  return Number.isFinite(value) && value > 0 ? Math.max(1, Math.floor(value)) : 40;
});
const safeOverscan = computed(() => {
  const value = Number(props.overscan);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
});
const heightStyle = computed(() => {
  if (typeof props.height === "number") return `${Math.max(0, props.height)}px`;
  if (typeof props.height === "string" && /^\d+(?:\.\d+)?$/.test(props.height.trim())) return `${props.height}px`;
  return props.height || "320px";
});
const totalHeight = computed(() => props.items.length * safeItemHeight.value);
const hasSelection = computed(() => localValue.value !== undefined && localValue.value !== null);
const selectedIndex = computed(() => hasSelection.value ? props.items.findIndex((item) => Object.is(itemValue(item), localValue.value)) : -1);
const viewHeight = computed(() => {
  if (viewportHeight.value > 0) return viewportHeight.value;
  const height = Number.parseFloat(props.height);
  if (Number.isFinite(height) && height > 0) return height;
  return safeItemHeight.value * 8;
});

const visibleRange = computed(() => {
  if (!props.items.length) return { start: 0, end: -1 };

  const first = Math.floor(scrollTop.value / safeItemHeight.value) - safeOverscan.value;
  const last = Math.ceil((scrollTop.value + viewHeight.value) / safeItemHeight.value) + safeOverscan.value - 1;
  return {
    start: Math.max(0, first),
    end: Math.min(props.items.length - 1, Math.max(0, last)),
  };
});

const visibleItems = computed(() => {
  const rows = [];
  for (let index = visibleRange.value.start; index <= visibleRange.value.end; index += 1) {
    rows.push({ item: props.items[index], index, key: itemKey(props.items[index]) });
  }
  return rows;
});
const topSpacerHeight = computed(() => visibleRange.value.start * safeItemHeight.value);
const bottomSpacerHeight = computed(() => Math.max(0, totalHeight.value - ((visibleRange.value.end + 1) * safeItemHeight.value)));
const activeId = computed(() => {
  const { start, end } = visibleRange.value;
  return activeIndex.value >= start && activeIndex.value <= end ? itemId(activeIndex.value) : undefined;
});

// item 的 value 是对外选择值；没有 value 时，item 自己就是选择值。
function itemValue(item) {
  if (item && typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "value")) return item.value;
  return item;
}

function itemLabel(item) {
  if (item && typeof item === "object" && Object.prototype.hasOwnProperty.call(item, "label")) return item.label;
  return item;
}

// key 优先使用调用方提供的稳定字段；对象本身可以保持引用时也能稳定复用 DOM。
function itemKey(item) {
  if (item && typeof item === "object") {
    const key = item.key ?? item.value ?? item.id;
    return key === undefined || key === null ? item : key;
  }
  return item;
}

function itemId(index) {
  return `${listId}-item-${index}`;
}

function setViewport(element) {
  root.value = element;
  viewportHeight.value = element?.clientHeight || 0;
}

function handleScroll(event) {
  // 滚动只更新可见范围；没有 watch 反向设置 scrollTop，因此不会形成滚动循环。
  scrollTop.value = event.currentTarget.scrollTop;
}

function ensureVisible(index) {
  if (!root.value) return;
  const top = index * safeItemHeight.value;
  const bottom = top + safeItemHeight.value;
  let nextScrollTop = root.value.scrollTop;
  if (top < nextScrollTop) nextScrollTop = top;
  else if (bottom > nextScrollTop + root.value.clientHeight) nextScrollTop = bottom - root.value.clientHeight;
  if (nextScrollTop === root.value.scrollTop) return;
  root.value.scrollTop = Math.max(0, nextScrollTop);
  scrollTop.value = root.value.scrollTop;
}

function setActive(index, shouldScroll = false) {
  if (index < 0 || index >= props.items.length) return;
  activeIndex.value = index;
  if (shouldScroll) ensureVisible(index);
}

function selectItem(item, index) {
  setActive(index);
  const value = itemValue(item);
  if (!hasSelection.value || !Object.is(value, localValue.value)) {
    localValue.value = value;
    emit("update:modelValue", value);
  }
  emit("item-click", item, index);
}

function handleKeydown(event) {
  if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey || !props.items.length) return;
  if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(event.key)) return;

  event.preventDefault();
  const current = activeIndex.value >= 0 ? activeIndex.value : (selectedIndex.value >= 0 ? selectedIndex.value : 0);
  let next = current;
  if (event.key === "ArrowDown") next = Math.min(props.items.length - 1, current + 1);
  else if (event.key === "ArrowUp") next = Math.max(0, current - 1);
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = props.items.length - 1;

  setActive(next, true);
  if (event.key === "Enter" || event.key === " ") selectItem(props.items[next], next);
}

watch(() => props.modelValue, (value) => {
  localValue.value = value;
  const index = value === undefined || value === null ? -1 : props.items.findIndex((item) => Object.is(itemValue(item), value));
  if (index >= 0) activeIndex.value = index;
});

watch(() => props.items.length, (length) => {
  if (!length) {
    activeIndex.value = -1;
    return;
  }
  if (activeIndex.value >= length) activeIndex.value = length - 1;
  if (activeIndex.value < 0) activeIndex.value = selectedIndex.value >= 0 ? selectedIndex.value : 0;
});

watch(safeItemHeight, () => {
  if (root.value) root.value.scrollTop = Math.min(root.value.scrollTop, Math.max(0, totalHeight.value - root.value.clientHeight));
  scrollTop.value = root.value?.scrollTop || 0;
});

onMounted(() => {
  viewportHeight.value = root.value?.clientHeight || 0;
  if (typeof ResizeObserver !== "undefined" && root.value) {
    resizeObserver = new ResizeObserver((entries) => {
      viewportHeight.value = entries[0]?.contentRect.height || root.value.clientHeight;
    });
    resizeObserver.observe(root.value);
  }
});

onBeforeUnmount(() => resizeObserver?.disconnect());
</script>

<template>
  <div
    :ref="setViewport"
    v-bind="forwardedAttrs"
    class="kima-virtual-scroll"
    :style="{ height: heightStyle }"
    role="list"
    tabindex="0"
    :aria-activedescendant="activeId"
    @scroll="handleScroll"
    @keydown="handleKeydown"
  >
    <div class="kima-virtual-scroll__content" :style="{ height: `${totalHeight}px` }">
      <div class="kima-virtual-scroll__spacer" :style="{ height: `${topSpacerHeight}px` }" aria-hidden="true"></div>
      <div
        v-for="row in visibleItems"
        :id="itemId(row.index)"
        :key="row.key"
        class="kima-virtual-scroll__item"
        :class="{
          'kima-virtual-scroll__item--active': row.index === activeIndex,
          'kima-virtual-scroll__item--selected': hasSelection && Object.is(itemValue(row.item), localValue),
        }"
        role="listitem"
        :aria-posinset="row.index + 1"
        :aria-setsize="items.length"
        :aria-selected="hasSelection ? Object.is(itemValue(row.item), localValue) : undefined"
        :style="{ height: `${safeItemHeight}px` }"
        @click="selectItem(row.item, row.index)"
      >
         <slot :item="row.item" :index="row.index">{{ itemLabel(row.item) }}</slot>
      </div>
      <div class="kima-virtual-scroll__spacer" :style="{ height: `${bottomSpacerHeight}px` }" aria-hidden="true"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kima-virtual-scroll {
  display: block;
  min-width: 0;
  overflow: auto;
  overscroll-behavior: contain;
  color: var(--kima-color-on-surface);
  background: var(--kima-color-transparent);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-md);
  line-height: 1.4;
  outline: none;

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: -2px;
  }
}

.kima-virtual-scroll__content {
  min-width: 100%;
}

.kima-virtual-scroll__spacer {
  width: 1px;
  pointer-events: none;
}

.kima-virtual-scroll__item {
  display: flex;
  min-width: 0;
  align-items: center;
  box-sizing: border-box;
  padding: 0 var(--kima-space-3);
  border-radius: var(--kima-radius-sm);
  color: var(--kima-color-on-surface);
  cursor: pointer;
  contain: layout paint;
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

  &--selected {
    color: var(--kima-color-primary);
  }
}

@media (prefers-reduced-motion: reduce) {
  .kima-virtual-scroll {
    scroll-behavior: auto;
  }

  .kima-virtual-scroll__item {
    transition: none;
  }
}
</style>
