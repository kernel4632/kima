<!-- 菜单：保留搜索/单选，children 递归子菜单；type=checkbox/radio，checked 按 value / radio group 存储。
调用示例：<kima-menu :items="[{value:'file',label:'文件',children:[{value:'save',label:'保存'}]}]" label="操作" />
-->
<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue';
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuContent } from 'reka-ui';
import KimaIcon from './icon.ce.vue';
import MenuItems from '../../internal/menu-items.vue';
import { ArrowDown01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { useInteractionRoot, usePlacement, dismissInteraction, flattenChoices } from '../../utils/interaction.js';
import { useShellModel, useMenuChecks } from '../../utils/shell.js';
import { presenceTransition } from '../../utils/motion.js';
import { useRipple } from '../../utils/ripple.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ open: Boolean, modelValue: { type: [String, Number, Boolean, Object, Array], default: null }, items: { type: Array, default: () => [] }, label: { type: String, default: '选择项目' }, disabled: Boolean, placement: { type: String, default: 'bottom-start' }, searchable: Boolean, checked: { type: Object, default: () => ({}) } });
const emit = defineEmits(['update:open', 'update:modelValue', 'change', 'select', 'update:checked', 'check']);
const { root, forwardedAttrs } = useInteractionRoot();
const [localOpen, updateOpen] = useShellModel(props, 'open', emit);
const [localValue, updateValue] = useShellModel(props, 'modelValue', emit);
const { checked, check } = useMenuChecks(props, emit);
const trigger = ref(null); const searchInput = ref(null); const query = ref('');
useRipple(trigger);
const menuId = `kima-menu-${useId()}`; const position = usePlacement(props);
const selectedItem = computed(() => flattenChoices(props.items).find((item) => Object.is(item.value, localValue.value)) || null);
function filter(items, text) { return items.flatMap((item) => { const children = item.children ? filter(item.children, text) : []; return `${item.label} ${item.description || ''}`.toLocaleLowerCase().includes(text) ? [item] : children.length ? [{ ...item, children }] : []; }); }
const visibleItems = computed(() => filter(props.items, query.value.trim().toLocaleLowerCase()));
function setOpen(value) { if (value && props.disabled) return; if (value) query.value = ''; updateOpen(value); }
function select(item) { if (props.disabled || item.disabled) return; if (!Object.is(localValue.value, item.value)) { updateValue(item.value); emit('change', item.value); } emit('select', item.value, item); setOpen(false); }
function searchKey(event) {
  if (event.key === 'Escape') { event.preventDefault(); setOpen(false); trigger.value?.focus(); }
  else if (event.key === 'Tab') setOpen(false);
  else if (['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) { event.preventDefault(); const items = root.value.querySelectorAll('[role^="menuitem"]:not([data-disabled])'); const item = event.key === 'ArrowUp' ? items[items.length - 1] : items[0]; if (event.key === 'Enter') item?.click(); else item?.focus(); }
}
watch(() => props.disabled, (value) => { if (value) setOpen(false); });
watch(localOpen, (value) => { if (value && props.searchable) nextTick(() => searchInput.value?.focus()); });
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-menu" :class="{'kima-menu--open': localOpen}">
    <DropdownMenuRoot :open="localOpen && !disabled" :modal="false" @update:open="setOpen">
      <DropdownMenuTrigger as-child><button ref="trigger" type="button" class="kima-menu__trigger" :disabled="disabled"><slot name="trigger" :open="localOpen" :selected-item="selectedItem" :value="localValue"><span>{{ selectedItem?.label || label }}</span></slot><KimaIcon :icon="ArrowDown01Icon" :size="20" aria-hidden="true" /></button></DropdownMenuTrigger>
      <Transition name="kima-popup" v-bind="presenceTransition"><DropdownMenuContent v-if="localOpen && !disabled" :id="menuId" force-mount v-bind="position" class="kima-menu__popup" :aria-label="label" loop @escape-key-down="(e) => dismissInteraction(e, () => setOpen(false))" @open-auto-focus="(e) => { if (searchable) { e.preventDefault(); nextTick(() => searchInput?.focus()); } }">
        <div v-if="searchable" class="kima-menu__search-wrap"><KimaIcon :icon="Search01Icon" :size="18" aria-hidden="true" /><input ref="searchInput" v-model="query" type="search" class="kima-menu__search" role="searchbox" aria-label="搜索菜单项" @input.stop @change.stop @keydown.stop="searchKey"></div>
        <MenuItems :items="visibleItems" :checked="checked" :model-value="localValue" selection :disabled="disabled" @select="select" @check="check" /><div v-if="!visibleItems.length" role="status">没有匹配项目</div>
      </DropdownMenuContent></Transition>
    </DropdownMenuRoot>
  </div>
</template>
<style scoped lang="scss">
@use '../../styles/mixins' as *;
@use '../../styles/interaction' as *;
@use '../../styles/shell-menu';
.kima-menu { @include interaction-root; position: relative; display: inline-flex; min-width: 180px; &--open { z-index: 60; } }
.kima-menu__trigger { @include kima-state-layer; @include kima-ripple-host; @include kima-focus-ring; @include kima-motion-colors; display: flex; width: 100%; min-height: 56px; align-items: center; justify-content: space-between; gap: var(--kima-space-3); padding: 0 var(--kima-space-4); border: 0; border-radius: var(--kima-radius-m); color: var(--kima-color-on-surface); background: var(--kima-color-layer-2); font: inherit; cursor: pointer; &:disabled { opacity: var(--kima-opacity-disabled); cursor: not-allowed; } }
/* 菜单内容由 Reka 渲染并传送到 body，元素上没有本组件的 data-v 标记，
 * 普通 scoped 规则匹配不到它——弹层就会完全没有底色。
 * 这里用 :global 按类名命中（类名带 kima-menu 前缀，不会污染宿主页面）。 */
:global(.kima-menu__popup) { @include interaction-popup; width: max(220px, var(--reka-dropdown-menu-trigger-width)); padding: var(--kima-space-2); }
.kima-menu__search-wrap { display: flex; align-items: center; gap: var(--kima-space-2); }
.kima-menu__search { @include interaction-search; }
</style>
