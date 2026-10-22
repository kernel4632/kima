<!-- 文档示例入口：按统一分组注册表选择示例视图，延迟加载当前组，不挂载其他组件场景。 -->
<script setup>
import { computed, defineAsyncComponent } from 'vue';
import { exampleLoaders } from './groups.js';
const props = defineProps({ component: { type: String, required: true } });
const view = computed(() => {
  const loader = exampleLoaders[props.component];
  return loader ? defineAsyncComponent(loader) : BaseExamples;
});
const BaseExamples = defineAsyncComponent(() => import('./base-examples.vue'));
</script>
<template><div class="kima-examples"><component :is="view" :key="component" :component="component" /></div></template>
