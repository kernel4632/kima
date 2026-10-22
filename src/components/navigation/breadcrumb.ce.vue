<!-- 面包屑：有序导航路径，末项标记当前位置，不伪装成按钮。
调用示例：
  <kima-breadcrumb :items="[{ label: '首页', href: '/' }, { label: '项目' }]" />
-->
<script setup>
import KimaLink from "./link.ce.vue";
import { useNavigationRoot } from "../../utils/navigation.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ items: { type: Array, default: () => [] }, label: { type: String, default: "面包屑导航" }, separator: { type: String, default: "/" } });
const { root, forwardedAttrs } = useNavigationRoot();
</script>
<template><nav ref="root" v-bind="forwardedAttrs" class="kima-breadcrumb" :aria-label="label"><ol><li v-for="(item, index) in items" :key="index"><span v-if="index" aria-hidden="true" class="kima-breadcrumb__separator">{{ separator }}</span><KimaLink v-if="item.href && index !== items.length - 1" :href="item.href" :disabled="item.disabled">{{ item.label }}</KimaLink><span v-else :aria-current="index === items.length - 1 ? 'page' : undefined">{{ item.label }}</span></li></ol><slot /></nav></template>
<style scoped lang="scss">
@use "../../styles/navigation" as *;
.kima-breadcrumb { @include navigation-root; ol { display: flex; flex-wrap: wrap; align-items: center; gap: var(--kima-space-2); margin: 0; padding: 0; list-style: none; } li { display: flex; align-items: center; gap: var(--kima-space-2); min-width: 0; overflow-wrap: anywhere; } &__separator { color: var(--kima-color-on-surface-variant); padding-inline: var(--kima-space-2); } }
</style>
