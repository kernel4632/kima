<!-- 响应式栅格：1–24 列、token 间距；areas 的矩形区域对应同名插槽，命名单元按 areas 声明顺序投影，视觉与焦点顺序一致。调用示例：<kima-grid :columns="{ base: 1, sm: 2, md: 3 }" :gap="4"><div>单元格</div></kima-grid> -->
<script setup>
import { computed } from 'vue';
import { useNavigationRoot } from '../utils/navigation.js';
import { choice, columnTemplate, gridAreas, layoutVariables, space } from '../utils/foundation.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({
  columns: { type: [Number, Object], default: undefined },
  gap: { type: [Number, Object], default: 4 },
  areas: { type: Array, default: () => [] },
  align: { type: String, default: 'stretch' },
});
const { root, forwardedAttrs } = useNavigationRoot();
const area = computed(() => gridAreas(props.areas));
const fallbackColumns = computed(() => area.value.columns || 1);
const style = computed(() => ({ ...layoutVariables('grid', 'columns', props.columns ?? fallbackColumns.value, columnTemplate, fallbackColumns.value), ...layoutVariables('grid', 'gap', props.gap, space, 4), gridTemplateAreas: area.value.template, alignItems: choice(props.align, ['start', 'end', 'center', 'stretch', 'baseline'], 'stretch') }));
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-grid" :style="style">
    <div v-for="name in area.names" :key="name" class="kima-grid__cell" :style="{ gridArea: name }"><slot :name="name" /></div>
    <slot />
  </div>
</template>
<style scoped lang="scss">
@use '../styles/foundation' as *;
.kima-grid {
  @include foundation-base;
  @include foundation-responsive('grid');
  display: grid;
  --kima-grid-columns: var(--kima-grid-columns-base);
  grid-template-columns: var(--kima-grid-columns);
  &__cell { min-width: 0; }
  @media (min-width: 640px) { --kima-grid-columns: var(--kima-grid-columns-sm); }
  @media (min-width: 960px) { --kima-grid-columns: var(--kima-grid-columns-md); }
  @media (min-width: 1280px) { --kima-grid-columns: var(--kima-grid-columns-lg); }
}
</style>
