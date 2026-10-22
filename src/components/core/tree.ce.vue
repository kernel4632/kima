<!--
树：展示可展开的层级数据，支持单选、多选和键盘移动焦点。
items 格式为 { value, label, children, disabled }，value 必须在整棵树中唯一且稳定。
调用示例：
  <kima-tree
    v-model="selected"
    v-model:expanded="expanded"
    :items="[{ value: 'docs', label: '文档', children: [{ value: 'readme', label: 'README' }] }]"
    selectable
  />
  <kima-tree :items="items"><template #default="{ item }">{{ item.label }}</template></kima-tree>
-->
<script setup>
import { computed, getCurrentInstance, nextTick, ref, shallowRef, useAttrs, useHost, useId, watch } from "vue";
import { collapseTransition, presenceTransition } from "../../utils/motion.js";
import KimaIcon from "./icon.ce.vue";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: [String, Number, Boolean, Object, Array],
    default: null,
  },
  expanded: {
    type: Array,
    default: () => [],
  },
  multiple: Boolean,
  selectable: Boolean,
  disabled: Boolean,
});

const emit = defineEmits(["update:modelValue", "update:expanded", "select"]);
const attrs = useAttrs();
const host = getCurrentInstance()?.ce ? useHost() : null;
const forwardedAttrs = computed(() => host ? { ...attrs, id: undefined } : attrs);

const treeId = `kima-tree-${useId()}`;
const localValue = shallowRef(props.modelValue);
const localExpanded = ref([...props.expanded]);
const activeIndex = ref(0);
const activeValue = shallowRef(null);
const hasActiveValue = ref(false);
const nodeElements = ref([]);

const expandedValues = computed(() => new Set(localExpanded.value));
const visibleNodes = computed(() => {
  // 只把当前展开的节点放入平面列表，键盘移动和未来虚拟渲染都只依赖这份列表。
  const result = [];
  const stack = [];

  for (let index = props.items.length - 1; index >= 0; index -= 1) {
    stack.push({
      item: props.items[index],
      level: 1,
      parentValue: null,
      position: index + 1,
      setSize: props.items.length,
    });
  }

  while (stack.length) {
    const entry = stack.pop();
    const item = entry.item || {};
    const children = Array.isArray(item.children) ? item.children : [];
    const node = {
      ...entry,
      item,
      value: item.value,
      children,
      hasChildren: children.length > 0,
      expanded: expandedValues.value.has(item.value),
    };
    result.push(node);

    if (!node.expanded || !children.length) continue;
    for (let index = children.length - 1; index >= 0; index -= 1) {
      stack.push({
        item: children[index],
        level: entry.level + 1,
        parentValue: item.value,
        position: index + 1,
        setSize: children.length,
      });
    }
  }

  return result;
});

const selectedValues = computed(() => {
  if (!props.multiple) return null;
  return new Set(Array.isArray(localValue.value) ? localValue.value : []);
});

function nodeId(value) {
  return `${treeId}-node-${encodeURIComponent(String(value))}`;
}

function isSelected(node) {
  return props.multiple
    ? selectedValues.value.has(node.value)
    : Object.is(localValue.value, node.value);
}

function isInteractive(node) {
  return !props.disabled && !node.item.disabled;
}

function findEnabledIndex(start, step) {
  const count = visibleNodes.value.length;
  if (!count) return -1;

  let index = start;
  for (let attempts = 0; attempts < count; attempts += 1) {
    if (index >= 0 && index < count && isInteractive(visibleNodes.value[index])) return index;
    index += step;
  }
  return -1;
}

function setActive(index, focus = false) {
  const node = visibleNodes.value[index];
  if (!node) return;
  activeIndex.value = index;
  activeValue.value = node.value;
  hasActiveValue.value = true;
  if (focus) nextTick(() => nodeElements.value[index]?.focus());
}

function setNodeRef(element, index) {
  if (element) nodeElements.value[index] = element;
}

function updateSelection(value, item) {
  if (!props.selectable || props.disabled || item.disabled) return;

  if (props.multiple) {
    const nextValues = new Set(selectedValues.value);
    if (nextValues.has(value)) nextValues.delete(value);
    else nextValues.add(value);
    const nextValue = [...nextValues];
    localValue.value = nextValue;
    emit("update:modelValue", nextValue);
  } else if (!Object.is(localValue.value, value)) {
    localValue.value = value;
    emit("update:modelValue", value);
  }

  emit("select", value, item);
}

function toggleExpanded(node) {
  if (!node.hasChildren || !isInteractive(node)) return;
  const nextExpanded = new Set(localExpanded.value);
  if (nextExpanded.has(node.value)) nextExpanded.delete(node.value);
  else nextExpanded.add(node.value);
  localExpanded.value = [...nextExpanded];
  emit("update:expanded", localExpanded.value);
}

function handleNodeClick(node, index, event) {
  setActive(index);
  event.currentTarget.focus();
  updateSelection(node.value, node.item);
}

function handleKeydown(node, index, event) {
  if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
  if (!isInteractive(node) && !["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;

  const nodes = visibleNodes.value;
  let nextIndex = -1;

  if (event.key === "ArrowRight") {
    event.preventDefault();
    if (node.hasChildren && !node.expanded) {
      toggleExpanded(node);
      return;
    }
    nextIndex = index + 1;
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    if (node.hasChildren && node.expanded) {
      toggleExpanded(node);
      return;
    }
    nextIndex = nodes.findIndex((candidate) => Object.is(candidate.value, node.parentValue));
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    nextIndex = index + 1;
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    nextIndex = index - 1;
  } else if (event.key === "Home") {
    event.preventDefault();
    nextIndex = 0;
  } else if (event.key === "End") {
    event.preventDefault();
    nextIndex = nodes.length - 1;
  } else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    updateSelection(node.value, node.item);
    return;
  } else {
    return;
  }

  const enabledIndex = findEnabledIndex(nextIndex, event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1);
  if (enabledIndex >= 0) setActive(enabledIndex, true);
}

watch(() => props.modelValue, (value) => {
  localValue.value = value;
});

watch(() => props.expanded, (value) => {
  localExpanded.value = [...value];
}, { deep: true });

watch([visibleNodes, () => props.modelValue], () => {
  const currentIndex = hasActiveValue.value
    ? visibleNodes.value.findIndex((node) => Object.is(node.value, activeValue.value))
    : -1;
  if (currentIndex >= 0) {
    activeIndex.value = currentIndex;
    return;
  }

  const selectedIndex = visibleNodes.value.findIndex((node) => isSelected(node) && isInteractive(node));
  const nextIndex = selectedIndex >= 0 ? selectedIndex : findEnabledIndex(0, 1);
  activeIndex.value = nextIndex >= 0 ? nextIndex : 0;
  if (visibleNodes.value[activeIndex.value]) setActive(activeIndex.value);
}, { deep: true, immediate: true });
</script>

<template>
  <div
    v-bind="forwardedAttrs"
    class="kima-tree"
    :class="{ 'kima-tree--disabled': disabled }"
    role="tree"
    :aria-multiselectable="multiple || undefined"
    :aria-disabled="disabled || undefined"
  >
    <TransitionGroup tag="div" class="kima-tree__group" role="group" :css="false" v-bind="{ ...collapseTransition, ...presenceTransition }">
      <div v-for="(node, index) in visibleNodes" :key="node.value" class="kima-tree__motion-row">
      <div
        :id="nodeId(node.value)"
        :ref="(element) => setNodeRef(element, index)"
        class="kima-tree__item"
        :class="{
          'kima-tree__item--selected': isSelected(node),
          'kima-tree__item--disabled': node.item.disabled,
        }"
        role="treeitem"
        :aria-level="node.level"
        :aria-posinset="node.position"
        :aria-setsize="node.setSize"
        :aria-expanded="node.hasChildren ? node.expanded : undefined"
        :aria-selected="selectable ? isSelected(node) : undefined"
        :aria-disabled="node.item.disabled || undefined"
        :tabindex="index === activeIndex && isInteractive(node) ? 0 : -1"
        :style="{ '--kima-tree-level': node.level - 1 }"
        @click="handleNodeClick(node, index, $event)"
        @focus="setActive(index)"
        @keydown="handleKeydown(node, index, $event)"
      >
        <button
          v-if="node.hasChildren"
          class="kima-tree__toggle"
          type="button"
          :disabled="disabled || node.item.disabled"
          :aria-label="`${node.expanded ? '收起' : '展开'} ${node.item.label}`"
          :aria-expanded="node.expanded"
          @click.stop="toggleExpanded(node)"
        >
          <KimaIcon class="kima-tree__toggle-icon" :icon="ArrowRight01Icon" :size="18" aria-hidden="true" />
        </button>
        <span v-else class="kima-tree__toggle kima-tree__toggle--empty" aria-hidden="true" />
        <span class="kima-tree__label">
          <slot :item="node.item" :value="node.value" :level="node.level" :selected="isSelected(node)" :expanded="node.expanded" :disabled="node.item.disabled">
            {{ node.item.label }}
          </slot>
        </span>
      </div>
      </div>
    </TransitionGroup>
    <div v-if="!visibleNodes.length" class="kima-tree__empty" role="status">
      <slot name="empty">暂无数据</slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kima-tree {
  min-width: 0;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-md);
  line-height: 1.4;
}

.kima-tree__group { display: grid; }
.kima-tree__motion-row { display: flow-root; }
.kima-tree__motion-row > .kima-tree__item { margin-bottom: var(--kima-space-1); }

.kima-tree__item {
  display: flex;
  min-height: 40px;
  min-width: 0;
  align-items: center;
  gap: var(--kima-space-2);
  padding: var(--kima-space-1) var(--kima-space-3) var(--kima-space-1) calc(var(--kima-space-4) + var(--kima-tree-level) * var(--kima-space-4));
  border-radius: var(--kima-radius-sm);
  box-sizing: border-box;
  color: var(--kima-color-on-surface);
  cursor: pointer;
  outline: none;
  transition: background-color var(--kima-duration-effects) var(--kima-curve-standard), color var(--kima-duration-effects) var(--kima-curve-standard);

  &:hover:not(.kima-tree__item--disabled),
  &:focus-visible {
    background: var(--kima-color-layer-3);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: -2px;
  }

  &--selected {
    color: var(--kima-color-on-primary-container);
    background: var(--kima-color-primary-container);
  }

  /* 选中项被悬停或键盘聚焦时，底色从容器色派生，不落回通用悬停色：
   * 换回 layer-3 会让"容器文字 + 深灰底"配成一对，对比度就掉了。 */
  &--selected:hover:not(.kima-tree__item--disabled),
  &--selected:focus-visible {
    background: var(--kima-color-primary-container-hover);
  }

  &--disabled {
    color: var(--kima-color-on-surface-variant);
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }
}

.kima-tree--disabled .kima-tree__item {
  color: var(--kima-color-on-surface-variant);
  cursor: not-allowed;
  opacity: var(--kima-opacity-disabled);
}

.kima-tree__toggle {
  display: inline-flex;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--kima-radius-sm);
  color: inherit;
  background: var(--kima-color-transparent);
  cursor: pointer;
  /* 悬停和展开箭头都要看得见过程。 */
  transition: background-color var(--kima-duration-effects) var(--kima-curve-standard);

  &:hover:not(:disabled),
  &:focus-visible {
    background: var(--kima-color-layer-3);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: -1px;
  }

  &:disabled {
    cursor: not-allowed;
  }

  /* 展开箭头用库里的图标：跟级联选项右侧的箭头是同一个，线条跟全库一致。
   * 手拼边框做箭头会跟图标库对不上。 */
  &-icon {
    transition: transform var(--kima-duration-fast) var(--kima-ease-standard);
  }

  &[aria-expanded="true"] .kima-tree__toggle-icon {
    transform: rotate(90deg);
  }

  &--empty {
    cursor: default;
    pointer-events: none;
  }
}

.kima-tree__label {
  min-width: 0;
  overflow-wrap: anywhere;
}

.kima-tree__empty {
  padding: var(--kima-space-4);
  color: var(--kima-color-on-surface-variant);
  text-align: center;
}

@media (prefers-reduced-motion: reduce) {
  .kima-tree__item,
  .kima-tree__toggle,
  .kima-tree__toggle-icon {
    transition: none;
  }
}
</style>
