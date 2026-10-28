<!-- 内容列表：items 的 title/description，item 与 action 作用域插槽；默认插槽可自定义 li。调用示例：<kima-list :items="[{ title: '项目', description: '最近更新' }]" /> -->
<script setup>
import { ref, toRaw, useAttrs } from "vue";
import { useCollectionMotion } from "../../utils/content-motion.js";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  items: { type: Array, default: () => [] },
  ordered: Boolean,
  variant: { type: String, default: 'default' },
  gap: { type: [String, Number], default: '' },
  label: { type: String, default: "列表" },
  emptyText: { type: String, default: "暂无条目" },
});
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement, hasNativeSlot } = useNativeSlots(root);
const collection = useCollectionMotion(root, () => props.items);
const objectKeys = new WeakMap();
let nextKey = 0;
function itemKey(item, index) {
  let identity;
  if (item !== null && typeof item === "object") {
    const raw = toRaw(item);
    if (raw.id != null) identity = `id:${typeof raw.id}:${raw.id}`;
    else { if (!objectKeys.has(raw)) objectKeys.set(raw, ++nextKey); identity = `object:${objectKeys.get(raw)}`; }
  } else identity = `value:${typeof item}:${item}`;
  const occurrence = props.items.slice(0, index).filter((other) => Object.is(toRaw(other), toRaw(item))).length;
  return `${identity}:${occurrence}`;
}
</script>
<template>
  <component :is="ordered ? 'ol' : 'ul'" ref="root" v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }" class="kima-list" :class="{ 'kima-list--plain': variant === 'plain' }" :style="{ '--kima-list-gap': typeof gap === 'number' ? `${gap}px` : gap || undefined }" :aria-label="label">
    <slot><TransitionGroup v-bind="collection"><li v-for="(item, index) in items" :key="itemKey(item, index)" class="kima-list__item"><slot name="item" :item="item" :index="index"><div class="kima-list__body"><strong>{{ item !== null && typeof item === 'object' ? item.title : item }}</strong><p v-if="item?.description">{{ item.description }}</p></div><div v-if="$slots.action" class="kima-list__action"><slot name="action" :item="item" :index="index" /></div></slot></li><li v-if="!items.length && !hasNativeSlot('default')" key="empty" class="kima-list__empty">{{ emptyText }}</li></TransitionGroup></slot>
  </component>
</template>
<style scoped lang="scss">
@use "../../styles/display" as *;
@use "../../styles/mixins" as *;
.kima-list {
  @include display-base;
  @include kima-block-host;
  // 高度过渡保留的空间不应拉伸剩余行，否则会改变 FLIP 已测得的目标位置。
  display: grid; align-content: start; gap: var(--kima-list-gap, var(--kima-space-3)); margin: 0; padding: 0; list-style-position: inside;
  &:is(ul) { list-style: none; }
  &__item { @include kima-layer; min-height: var(--kima-list-item-height); padding: var(--kima-space-5); border-radius: var(--kima-radius-m); }
  &--plain { .kima-list__item { min-height: 0; padding: 0; border-radius: 0; background: transparent; } }
  &:is(ul) &__item { display: flex; align-items: center; gap: var(--kima-space-4); }
  &__body { flex: 1; min-width: 0; }
  p { margin: var(--kima-space-2) 0 0; color: var(--kima-color-on-surface-variant); }
  &__action { display: flex; flex-wrap: wrap; gap: var(--kima-space-2); }
  &__empty { padding: var(--kima-space-6); color: var(--kima-color-on-surface-variant); list-style: none; }
}
</style>
