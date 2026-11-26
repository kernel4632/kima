<!-- 菜单：保留搜索/单选，children 递归子菜单；type=checkbox/radio，checked 按 value / radio group 存储。
调用示例：<kima-menu :items="[{value:'file',label:'文件',children:[{value:'save',label:'保存'}]}]" label="操作" />
-->
<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue';
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuContent } from 'reka-ui';
import { AnimatePresence, motion } from 'motion-v';
import KimaIcon from './icon.ce.vue';
import MenuItems from '../../internal/menu-items.vue';
import { ArrowDown01Icon, MoreHorizontalIcon, Search01Icon } from '@hugeicons/core-free-icons';
import { useInteractionRoot, usePlacement, dismissInteraction, flattenChoices } from '../../utils/interaction.js';
import { useShellModel, useMenuChecks } from '../../utils/shell.js';
import { useRipple } from '../../utils/ripple.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ open: Boolean, modelValue: { type: [String, Number, Boolean, Object, Array], default: null }, items: { type: Array, default: () => [] }, label: { type: String, default: '选择项目' }, disabled: Boolean, placement: { type: String, default: 'bottom-start' }, searchable: Boolean, checked: { type: Object, default: () => ({}) }, variant: { type: String, default: 'default' }, iconOnly: Boolean, icon: { type: Object, default: undefined }, size: { type: String, default: 'default' } });
const emit = defineEmits(['update:open', 'update:modelValue', 'change', 'select', 'update:checked', 'check']);
const { root, forwardedAttrs } = useInteractionRoot();
const [localOpen, updateOpen] = useShellModel(props, 'open', emit);
const [localValue, updateValue] = useShellModel(props, 'modelValue', emit);
const { checked, check } = useMenuChecks(props, emit);
const trigger = ref(null); const searchInput = ref(null); const query = ref('');
useRipple(trigger);
const menuId = `kima-menu-${useId()}`; const position = usePlacement(props);
const selectedItem = computed(() => flattenChoices(props.items).find((item) => Object.is(item.value, localValue.value)) || null);
const iconTrigger = computed(() => props.iconOnly || props.variant === 'icon');
const triggerIcon = computed(() => props.icon || MoreHorizontalIcon);
const triggerSize = computed(() => ['small', 'default'].includes(props.size) ? props.size : 'default');
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
  <div ref="root" v-bind="forwardedAttrs" class="kima-menu" :class="{'kima-menu--open': localOpen, 'kima-menu--icon': iconTrigger, [`kima-menu--${triggerSize}`]: true}">
    <DropdownMenuRoot :open="localOpen && !disabled" :modal="false" @update:open="setOpen">
      <DropdownMenuTrigger as-child><button ref="trigger" type="button" class="kima-menu__trigger" :disabled="disabled" :aria-label="iconTrigger ? label : undefined" :title="iconTrigger ? label : undefined"><slot name="trigger" :open="localOpen" :selected-item="selectedItem" :value="localValue"><KimaIcon v-if="iconTrigger" :icon="triggerIcon" :size="20" aria-hidden="true" /><span v-else>{{ selectedItem?.label || label }}</span></slot><KimaIcon v-if="!iconTrigger" :icon="ArrowDown01Icon" :size="20" aria-hidden="true" /></button></DropdownMenuTrigger>
      <!-- 弹层交给 Motion：进场 = 弹簧缩放 + 淡入（从 0.96 弹到 1，带一丝过冲），
           退场 = 快速淡出。AnimatePresence 保证关闭时退场动画能播完才卸载，
           Vue 的 <Transition> 做不了嵌套子菜单的这种受控退出。 -->
      <AnimatePresence>
        <DropdownMenuContent v-if="localOpen && !disabled" :id="menuId" force-mount v-bind="position" as-child>
          <motion.div
            class="kima-menu__popup"
            :initial="{ opacity: 0, scale: 0.96 }"
            :animate="{ opacity: 1, scale: 1 }"
            :exit="{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }"
            :transition="{ type: 'spring', stiffness: 400, damping: 32 }"
            :aria-label="label"
            loop
            @escape-key-down="(e) => dismissInteraction(e, () => setOpen(false))"
            @open-auto-focus="(e) => { if (searchable) { e.preventDefault(); nextTick(() => searchInput?.focus()); } }"
          >
            <div v-if="searchable" class="kima-menu__search-wrap"><KimaIcon :icon="Search01Icon" :size="18" aria-hidden="true" /><input ref="searchInput" v-model="query" type="search" class="kima-menu__search" role="searchbox" aria-label="搜索菜单项" @input.stop @change.stop @keydown.stop="searchKey"></div>
            <MenuItems :items="visibleItems" :checked="checked" :model-value="localValue" selection :disabled="disabled" @select="select" @check="check" /><div v-if="!visibleItems.length" role="status">没有匹配项目</div>
          </motion.div>
        </DropdownMenuContent>
      </AnimatePresence>
    </DropdownMenuRoot>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/mixins" as *;
/* 子菜单内容会被 Reka 传送到 body：那里没有本组件的 data-v 祖先，
 * :deep 的世代选择器命中不了，弹层就会连底色都没有。按类名全局命中。
 * menu / context-menu / menubar 三个组件共用 menu-items.vue 渲染这套类名，
 * 全局规则在这里注入一份即可（重复注入只会写出重复样式）。 */
:global(.kima-shell-menu__popup) {
  min-width: 0; color: var(--kima-color-on-surface); font-family: var(--kima-font-family); font-size: var(--kima-font-size-body-medium); line-height: 1.5;
  @include kima-popup;
  box-sizing: border-box; z-index: 60; width: min(260px, calc(100vw - 24px));
  max-height: min(70vh, var(--reka-popper-available-height, 70vh)); overflow: auto;
  padding: var(--kima-space-2); border-radius: var(--kima-radius-l); outline: none;
}
:deep(.kima-shell-menu__item) {
  @include kima-focus-ring; @include kima-disabled;
  /* Grok 官方菜单项一比一（证据：docs/grok-component-reference.md 四）：
   * 视觉行 32（--grok-control-height-lg 档）、radius-control 10。
   * 触摸靠 ::before 外扩到 44（官方 data-touch-target 模式）。 */
  display: flex;
  box-sizing: border-box;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: var(--kima-space-3);
  position: relative;
  min-height: var(--kima-control-height-lg);
  padding: 0 var(--kima-space-3);
  border: 0;
  border-radius: var(--kima-radius-control);
  background: transparent; color: var(--kima-color-on-surface);
  font: inherit; text-align: start; cursor: pointer;
  /* 触摸外扩：视觉 32，命中补到 44+。::after 是状态层（z1），::before 管命中不画东西。 */
  &::before {
    content: "";
    position: absolute;
    inset-block: calc((var(--kima-touch-target) - var(--kima-control-height-lg)) / -2);
    inset-inline: calc(-1 * var(--kima-space-2));
    z-index: 0;
  }
  transition: background-color var(--kima-duration-effects) var(--kima-curve-standard), color var(--kima-duration-effects) var(--kima-curve-standard);
  &:hover:not([aria-disabled="true"]):not([data-disabled]), &[data-highlighted], &[data-active="true"] { background: var(--kima-color-wash-hover); }
  &[aria-selected="true"] { color: var(--kima-color-on-accent-secondary); background: var(--kima-color-accent-secondary); }
  &[aria-selected="true"]:hover, &[aria-selected="true"][data-active="true"] { background: var(--kima-color-accent-secondary-hover); }
  &[aria-checked='true'] { color: var(--kima-color-on-accent-secondary); background: var(--kima-color-accent-secondary); &:hover, &[data-highlighted] { background: var(--kima-color-accent-secondary-hover); } }
  &[data-disabled] { opacity: var(--kima-opacity-disabled); cursor: not-allowed; }
}
:deep(.kima-shell-menu__copy) { display: grid; gap: var(--kima-space-1); }
:deep(.kima-shell-menu__item) small { font-size: var(--kima-font-size-label-medium); opacity: .8; }
:deep(.kima-shell-menu__separator) { height: 1px; margin-block: var(--kima-space-2); background: var(--kima-color-outline-variant); }
@media (prefers-reduced-motion: reduce) { .kima-shell-menu__item { transition: none; } }
.kima-menu { min-width: 0;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-body-medium);
  line-height: 1.5; position: relative; display: inline-flex; min-width: 180px; &--open { z-index: 60; } &--icon { min-width: 0; } }
.kima-menu__trigger  {
  @include kima-state-layer;
  @include kima-ripple-host;
  @include kima-focus-ring;
  @include kima-motion-colors;
  display: flex;
  width: 100%;
  min-height: 56px;
  align-items: center;
  justify-content: space-between;
  gap: var(--kima-space-3);
  padding: 0 var(--kima-space-4);
  border: 0;
  border-radius: var(--kima-radius-m);
  color: var(--kima-color-on-surface);
  background: var(--kima-color-layer-2);
  font: inherit;
  cursor: pointer;
  &:disabled  {
    opacity: var(--kima-opacity-disabled);
    cursor: not-allowed;

  }

}
.kima-menu--small .kima-menu__trigger { min-height: 40px; padding-inline: var(--kima-space-3); }
.kima-menu--icon .kima-menu__trigger { width: var(--kima-touch-target); min-width: var(--kima-touch-target); height: var(--kima-touch-target); padding: 0; justify-content: center; aspect-ratio: 1; }
/* 菜单内容由 Reka 渲染并传送到 body：现在外面套了 motion.div，
 * data-v 标记在 motion.div 上，但 motion.div 由 Motion 渲染时同样带 scoped id，
 * 加上弹层结构变了，继续用 :global 按类名命中最稳（类名带 kima- 前缀，不污染宿主）。 */
:global(.kima-menu__popup) { min-width: 0;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-body-medium);
  line-height: 1.5;
  @include kima-popup;
  box-sizing: border-box;
  z-index: 60;
  width: min(360px, calc(100vw - 24px));
  /* 官方 --grok-menu-min-width: 240px 保底。 */
  min-width: 240px;
  max-height: min(70vh, var(--reka-popper-available-height, 70vh));
  overflow: auto;
  padding: var(--kima-space-2);
  border-radius: var(--kima-radius-lg);
  outline: none; }
.kima-menu__search-wrap { position: relative; display: flex; align-items: center; margin-bottom: var(--kima-space-2); }
.kima-menu__search-wrap > .kima-icon { position: absolute; left: var(--kima-space-3); color: var(--kima-color-on-surface-variant); pointer-events: none; }
.kima-menu__search { box-sizing: border-box;
  width: 100%;
  min-height: 48px;
  margin-bottom: var(--kima-space-2);
  padding: 0 var(--kima-space-3) 0 40px;
  border: 0;
  border-radius: var(--kima-radius-m);
  background: var(--kima-color-layer-2);
  color: var(--kima-color-on-surface);
  font: inherit;
  &:focus { outline: var(--kima-focus-ring-width) solid var(--kima-color-focus-ring); outline-offset: -2px; } }
</style>
