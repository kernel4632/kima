<!--
树：展示可展开的层级数据，支持单选、多选和键盘移动焦点。
行为层由 Reka Tree 承担（RovingFocus 键盘、展开状态、选择传播），KIMA 只保留皮肤。
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
import { computed, getCurrentInstance, shallowRef, useAttrs, useHost, watch } from "vue";
import { TreeRoot, TreeItem } from "reka-ui";
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

/* Reka Tree：键盘焦点（RovingFocus/typeahead）、展开状态、aria 全由它管。
 * 选择这一层 Reka 2.11 的受控协议与 KIMA 对不上（useVModel 的值语义是 item 对象副本），
 * 所以选择保留 KIMA 自己的轻量 toggle——比手写全树少得多的那部分仍在。 */
const getKey = (item) => item?.value;
const getChildren = (item) => (Array.isArray(item?.children) && item.children.length ? item.children : undefined);

const localValue = shallowRef(props.modelValue);
watch(() => props.modelValue, (value) => { localValue.value = value; });

const selectedValues = computed(() => {
  if (!props.multiple) return null;
  return new Set(Array.isArray(localValue.value) ? localValue.value : []);
});

function isSelected(entry) {
  return props.multiple
    ? selectedValues.value.has(entry.value.value)
    : Object.is(localValue.value, entry.value.value);
}

function selectItem(entry) {
  if (!props.selectable || props.disabled || entry.value.disabled) return;
  if (props.multiple) {
    const next = new Set(selectedValues.value);
    if (next.has(entry.value.value)) next.delete(entry.value.value);
    else next.add(entry.value.value);
    localValue.value = [...next];
  } else if (!Object.is(localValue.value, entry.value.value)) {
    localValue.value = entry.value.value;
  } else {
    return;
  }
  emit("update:modelValue", localValue.value);
  emit("select", entry.value.value, entry.value);
}
</script>

<template>
  <div
    v-bind="forwardedAttrs"
    class="kima-tree"
    :class="{ 'kima-tree--disabled': disabled }"
    role="tree"
    :aria-multiselectable="selectable && multiple || undefined"
    :aria-disabled="disabled || undefined"
  >
    <TreeRoot
      v-slot="{ flattenItems }"
      :items="items"
      :get-key="getKey"
      :get-children="getChildren"
      :disabled="disabled"
      :expanded="expanded"
      @update:expanded="(value) => emit('update:expanded', value)"
      as-child
    >
      <div class="kima-tree__group">
        <!-- Reka 把"当前展开状态下的平铺节点表"给到 slot（flattenItems），
             逐项渲染 TreeItem 即可——展开/收起由键盘或 handleToggle 驱动，列表自动增减。 -->
        <TreeItem
          v-for="entry in flattenItems"
          :key="getKey(entry.value)"
          v-bind="entry.bind"
          as="div"
          class="kima-tree__branch"
          v-slot="{ isExpanded, isDisabled, handleToggle, ...treeItem }"
        >
          <div
            class="kima-tree__item"
            :class="{
              'kima-tree__item--selected': selectable && isSelected(entry),
              'kima-tree__item--disabled': isDisabled,
            }"
            :aria-selected="selectable ? isSelected(entry) : undefined"
            :style="{ '--kima-tree-level': entry.level - 1 }"
            v-bind="treeItem"
            @click="selectable ? selectItem(entry) : (entry.hasChildren && handleToggle?.($event))"
          >
            <button
              v-if="entry.hasChildren"
              class="kima-tree__chevron-button"
              type="button"
              :disabled="isDisabled"
              :aria-label="`${isExpanded ? '收起' : '展开'} ${entry.value.label}`"
              :aria-expanded="isExpanded"
              tabindex="-1"
              @click.stop="handleToggle"
            >
              <KimaIcon class="kima-tree__chevron" :class="{ 'kima-tree__chevron--open': isExpanded }" :icon="ArrowRight01Icon" :size="18" aria-hidden="true" />
            </button>
            <KimaIcon v-else class="kima-tree__chevron kima-tree__chevron--leaf" :icon="ArrowRight01Icon" :size="18" aria-hidden="true" />
            <span class="kima-tree__label">
              <slot :item="entry.value" :value="entry.value.value" :level="entry.level" :selected="selectable && isSelected(entry)" :expanded="isExpanded" :disabled="isDisabled">
                {{ entry.value.label }}
              </slot>
            </span>
          </div>
        </TreeItem>
      </div>
    </TreeRoot>
    <div v-if="!items.length" class="kima-tree__empty" role="status">
      <slot name="empty">暂无数据</slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kima-tree {
  min-width: 0;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-body-medium);
  line-height: 1.4;
}

.kima-tree--disabled {
  opacity: var(--kima-opacity-disabled);
  pointer-events: none;
}

.kima-tree__group {
  display: flex;
  flex-direction: column;
  gap: var(--kima-space-1);
  margin: 0;
  padding: 0;
  list-style: none;
}

.kima-tree__branch {
  display: flex;
  flex-direction: column;
  gap: var(--kima-space-1);
  min-width: 0;
}

.kima-tree__children {
  display: flex;
  flex-direction: column;
  gap: var(--kima-space-1);
  /* 子层级的树项由 Reka 的 aria-level 标记；视觉缩进跟随层级容器。 */
  padding-inline-start: var(--kima-space-5);
}

.kima-tree__item {
  display: flex;
  align-items: center;
  gap: var(--kima-space-1);
  min-height: 44px;
  padding: var(--kima-space-1) var(--kima-space-2);
  border-radius: var(--kima-radius-s);
  cursor: pointer;
  /* 缩进层级由 --kima-tree-level 驱动（Reka 传 level）。 */
  padding-inline-start: calc(var(--kima-space-2) + var(--kima-tree-level, 0) * var(--kima-space-4));
  transition: background-color var(--kima-duration-effects) var(--kima-curve-standard);

  &:hover:not(.kima-tree__item--disabled) {
    background: var(--kima-color-layer-2);
  }

  &:focus-visible {
    outline: var(--kima-focus-ring-width) solid var(--kima-color-primary);
    outline-offset: var(--kima-focus-ring-offset);
  }
}

.kima-tree__item--disabled {
  opacity: var(--kima-opacity-disabled);
  cursor: not-allowed;
}

.kima-tree__chevron-button {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--kima-radius-full);
  color: var(--kima-color-on-surface-variant);
  background: transparent;
  cursor: pointer;

  &:hover:not(:disabled) { background: var(--kima-color-layer-3); }
  &:disabled { cursor: not-allowed; }
}

.kima-tree__chevron {
  color: var(--kima-color-on-surface-variant);
  transition: rotate var(--kima-duration-effects) var(--kima-curve-standard);
}

.kima-tree__chevron--leaf {
  opacity: 0;
}

.kima-tree__chevron--open {
  rotate: 90deg;
}

.kima-tree__label {
  min-width: 0;
  overflow-wrap: anywhere;
}

/* 选中态：行底用容器色整对配文字。 */
.kima-tree__item--selected {
  color: var(--kima-color-on-primary-container);
  background: var(--kima-color-primary-container);
}

.kima-tree__empty {
  padding: var(--kima-space-4);
  color: var(--kima-color-on-surface-variant);
}
</style>
