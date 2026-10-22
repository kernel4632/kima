<!-- 行内语义标记：原生 mark 包住字面文本，关键词匹配仍交给 highlight，不重复实现切词，也不使用 v-html。调用示例：<kima-mark>关键结论</kima-mark> -->
<script setup>
import { computed } from 'vue';
import { useNavigationRoot } from '../utils/navigation.js';
import { choice } from '../utils/foundation.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ text: { type: String, default: '' }, tone: { type: String, default: 'highlight' } });
const { root, forwardedAttrs } = useNavigationRoot();
const tokenTone = computed(() => choice(props.tone, ['highlight', 'error'], 'highlight'));
</script>
<template><mark ref="root" v-bind="forwardedAttrs" class="kima-mark" :class="`kima-mark--${tokenTone}`"><slot>{{ text }}</slot></mark></template>
<style scoped lang="scss">
.kima-mark {
  display: inline;
  padding: 0 var(--kima-space-1);
  border-radius: var(--kima-radius-xs);
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  &--highlight { color: var(--kima-color-on-primary-container); background: var(--kima-color-primary-container); }
  &--error { color: var(--kima-color-on-error-container); background: var(--kima-color-error-container); }
}
</style>
