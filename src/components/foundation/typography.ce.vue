<!-- 语义排版：只输出原生 heading/body/caption，尺寸与颜色限定在 token 白名单，不生成标签。调用示例：<kima-typography type="heading" :level="2" size="headline-medium">成员列表</kima-typography> -->
<script setup>
import { computed } from 'vue';
import { useNavigationRoot } from '../../utils/navigation.js';
import { choice } from '../../utils/foundation.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ type: { type: String, default: 'body' }, level: { type: Number, default: 2 }, size: { type: String, default: '' }, color: { type: String, default: 'default' } });
const { root, forwardedAttrs } = useNavigationRoot();
const sizes = ['display-large', 'display-medium', 'display-small', 'headline-large', 'headline-medium', 'headline-small', 'title-large', 'title-medium', 'title-small', 'body-large', 'body-medium', 'body-small', 'label-large', 'label-medium', 'label-small'];
const defaults = { heading: 'headline-small', body: 'body-medium', caption: 'label-medium' };
const textType = computed(() => choice(props.type, ['heading', 'body', 'caption'], 'body'));
const tag = computed(() => textType.value === 'heading' ? `h${Math.min(6, Math.max(1, Number(props.level) || 2))}` : textType.value === 'caption' ? 'small' : 'p');
const tokenSize = computed(() => choice(props.size, sizes, defaults[textType.value]));
const tokenColor = computed(() => choice(props.color, ['default', 'muted', 'primary', 'success', 'warning', 'danger'], 'default'));
</script>
<template>
  <component :is="tag" ref="root" v-bind="forwardedAttrs" class="kima-typography" :class="[`kima-typography--${textType}`, `kima-typography--color-${tokenColor}`]" :style="{ '--kima-typography-size': `var(--kima-font-size-${tokenSize})` }"><slot /></component>
</template>
<style scoped lang="scss">
.kima-typography {
  display: block;
  margin: 0;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-typography-size);
  line-height: var(--kima-line-height-normal);
  &--heading { line-height: var(--kima-line-height-tight); font-weight: var(--kima-font-weight-semi-bold); text-wrap: balance; }
  &--body { max-width: 72ch; }
  &--caption { color: var(--kima-color-on-surface-variant); font-weight: var(--kima-font-weight-regular); line-height: var(--kima-line-height-normal); }
  &--color-muted { color: var(--kima-color-on-surface-variant); }
  &--color-primary { color: var(--kima-color-primary); }
  &--color-success { color: var(--kima-color-success); }
  &--color-warning { color: var(--kima-color-warning); }
  &--color-danger { color: var(--kima-color-error); }
}
</style>
