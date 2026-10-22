<!-- 主导航：真实嵌套链接，expanded 控制展开；当前后代自动展开祖先，保持页面导航语义。
调用示例：<kima-navigation-menu :items="[{value:'guide',label:'指南',href:'#guide',children:[{value:'start',label:'开始',href:'#start'}]}]" />
-->
<script setup>
import { watch } from 'vue';
import NavigationItems from '../internal/navigation-items.vue';
import { useNavigationRoot } from '../utils/navigation.js';
import { navKey, navContains, useShellModel } from '../utils/shell.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: { type: String, default: '' }, items: { type: Array, default: () => [] }, label: { type: String, default: '主导航' }, orientation: { type: String, default: 'horizontal' }, disabled: Boolean, expanded: { type: Array, default: () => [] } });
const emit = defineEmits(['update:modelValue', 'change', 'navigate', 'update:expanded']);
const { root, forwardedAttrs } = useNavigationRoot();
const [local, update] = useShellModel(props, 'modelValue', emit);
const [expanded, expand] = useShellModel(props, 'expanded', emit);
function navigate(item, event) { if (props.disabled || item.disabled) return; const value = navKey(item); update(value); emit('change', value); emit('navigate', item, event); }
watch([local, () => props.items], () => { const ancestors = []; function visit(items) { for (const item of items) if (item.children?.length && item.children.some((child) => navContains(child, local.value))) { ancestors.push(navKey(item)); visit(item.children); } } visit(props.items); const next = [...new Set([...expanded.value, ...ancestors])]; if (next.length !== expanded.value.length) expand(next); }, { immediate: true, deep: true });
function keydown(event) { if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || event.isComposing) return; const controls = [...root.value.querySelectorAll('a[href], button:not(:disabled)')].filter((el) => !el.closest('[inert]')); const current = controls.indexOf(event.target); if (current < 0) return; event.preventDefault(); const index = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + controls.length) % controls.length; controls[index]?.focus(); }
</script>
<template><nav ref="root" v-bind="forwardedAttrs" class="kima-navigation-menu" :class="{'kima-navigation-menu--vertical': orientation === 'vertical'}" :aria-label="label" @keydown="keydown"><NavigationItems :items="items" :model-value="local" :expanded="expanded" :disabled="disabled" @navigate="navigate" @expand="expand" /><slot /></nav></template>
<style scoped lang="scss">
@use '../styles/navigation' as *;
.kima-navigation-menu { @include navigation-surface; :deep(.kima-shell-nav__list) { display: flex; flex-wrap: wrap; gap: var(--kima-space-2); list-style: none; padding: 0; margin: 0; } :deep(.kima-shell-nav__list .kima-shell-nav__list) { flex-direction: column; padding-inline-start: var(--kima-space-4); } :deep(.kima-shell-nav__row) { display: flex; min-height: 56px; align-items: center; gap: var(--kima-space-2); } :deep(.kima-link) { flex: 1; min-height: 56px; } :deep(li[data-active] > .kima-shell-nav__row) { border-radius: var(--kima-radius-m); background: var(--kima-color-layer-2); } :deep(.kima-icon) { transition: transform var(--kima-duration-medium) var(--kima-curve-standard); } &--vertical :deep(.kima-shell-nav__list) { flex-direction: column; } }
@media (max-width: 560px) { .kima-navigation-menu :deep(.kima-shell-nav__list) { flex-direction: column; } }
@media (prefers-reduced-motion: reduce) { .kima-navigation-menu :deep(.kima-icon) { transition: none; } }
</style>
