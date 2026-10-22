<!-- 描述列表：items 为 label/value 键值对；默认插槽可提供 dt/dd。调用示例：<kima-descriptions :items="[{ label: '名称', value: 'KIMA' }]" :columns="2" /> -->
<script setup>
import { computed, ref, useAttrs } from "vue";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  items: { type: Array, default: () => [] },
  columns: { type: Number, default: 2 },
  label: { type: String, default: "详细信息" },
});
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement } = useNativeSlots(root);
const count = computed(() => Number.isFinite(props.columns) ? Math.min(4, Math.max(1, Math.floor(props.columns))) : 2);
</script>
<template>
  <dl ref="root" v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }" class="kima-descriptions" :aria-label="label" :style="{ '--kima-description-columns': count }">
    <slot><div v-for="(item, index) in items" :key="item.id ?? index" class="kima-descriptions__item"><dt>{{ item.label }}</dt><dd><slot name="value" :item="item" :index="index">{{ item.value ?? '—' }}</slot></dd></div></slot>
  </dl>
</template>
<style scoped lang="scss">
@use "../../styles/display" as *;
@use "../../styles/mixins" as *;
.kima-descriptions {
  @include display-base;
  display: grid; grid-template-columns: repeat(var(--kima-description-columns), minmax(0, 1fr)); gap: var(--kima-space-3); margin: 0;
  &__item { @include kima-layer; padding: var(--kima-space-5); border-radius: var(--kima-radius-m); min-width: 0; }
  dt { color: var(--kima-color-on-surface-variant); margin-bottom: var(--kima-space-2); }
  dd { margin: 0; }
}
@media (max-width: 600px) { .kima-descriptions { grid-template-columns: 1fr; } }
</style>
