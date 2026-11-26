<!-- 上下文操作菜单：右键/长按或聚焦后按 Shift+F10 / 菜单键打开；items 为 { value, label, disabled, shortcut }。
调用示例：<kima-context-menu :items="[{ value: 'copy', label: '复制' }]" @select="run"><p>右键此区域</p></kima-context-menu>
-->
<script setup>
import { nextTick, watch } from "vue";
import { ContextMenuRoot, ContextMenuTrigger, ContextMenuContent } from "reka-ui";
import MenuItems from '../../internal/menu-items.vue';
import { useShellModel, useMenuChecks } from '../../utils/shell.js';
import { presenceTransition } from '../../utils/motion.js';
import { useInteractionRoot, useInteractionModel, dismissInteraction } from "../../utils/interaction.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ open: Boolean, disabled: Boolean, items: { type: Array, default: () => [] }, label: { type: String, default: "上下文操作" }, checked: { type: Object, default: () => ({}) } });
const emit = defineEmits(["update:open", "select", "update:checked", "check"]);
const { checked, check } = useMenuChecks(props, emit);
const { root, forwardedAttrs } = useInteractionRoot();
const [localOpen, updateOpen] = useShellModel(props, "open", emit);
let outside = false;
function setOpen(value) { if (value) outside = false; if (!value || !props.disabled) updateOpen(value); }
function restoreFocus(event) { event.preventDefault(); if (!outside) root.value?.querySelector('.kima-context-menu__trigger')?.focus(); }
function keydown(event) { if (props.disabled || !(event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))) return; event.preventDefault(); setOpen(true); nextTick(() => root.value.querySelector('[role="menuitem"]:not([data-disabled])')?.focus()); }
function select(item) { if (props.disabled || item.disabled) return; emit("select", item.value, item); setOpen(false); }
watch(() => props.disabled, (value) => { if (value) setOpen(false); });
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-context-menu">
    <ContextMenuRoot :open="localOpen && !disabled" :modal="false" @update:open="setOpen">
      <ContextMenuTrigger as="div" class="kima-context-menu__trigger" :disabled="disabled" :tabindex="disabled ? -1 : 0" :aria-label="label" aria-haspopup="menu" :aria-expanded="localOpen && !disabled" @keydown="keydown"><slot>右键或长按打开操作菜单</slot></ContextMenuTrigger>
      <Transition name="kima-popup" v-bind="presenceTransition"><ContextMenuContent v-if="localOpen && !disabled" force-mount class="kima-context-menu__popup" :aria-label="label" :collision-padding="12" :side-offset="4" position-strategy="fixed" loop @escape-key-down="(event) => dismissInteraction(event, () => setOpen(false))" @interact-outside="outside = true" @close-auto-focus="restoreFocus"><MenuItems :items="items" family="ContextMenu" :checked="checked" :disabled="disabled" @select="select" @check="check" /><p v-if="!items.length" role="status">暂无操作</p></ContextMenuContent></Transition>
    </ContextMenuRoot>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/mixins" as *;
.kima-context-menu { min-width: 0;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-body-medium);
  line-height: 1.5; &__trigger { @include kima-layer(1); @include kima-focus-ring; padding: var(--kima-space-6); border-radius: var(--kima-radius-m); } &__item { @include kima-focus-ring;
  @include kima-disabled;
  display: flex;
  box-sizing: border-box;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: var(--kima-space-3);
  min-height: var(--kima-control-height-2xl);
  padding: var(--kima-space-2) var(--kima-space-3);
  border: 0;
  border-radius: var(--kima-radius-s);
  background: transparent;
  color: var(--kima-color-on-surface);
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition: background-color var(--kima-duration-effects) var(--kima-curve-standard), color var(--kima-duration-effects) var(--kima-curve-standard);
  &:hover:not([aria-disabled="true"]):not([data-disabled]), &[data-highlighted], &[data-active="true"] { background: var(--kima-color-wash-hover); }
  &[aria-selected="true"] { color: var(--kima-color-on-accent-secondary); background: var(--kima-color-accent-secondary); }
  &[aria-selected="true"]:hover, &[aria-selected="true"][data-active="true"] { background: var(--kima-color-accent-secondary-hover); }
  &[data-disabled] { opacity: var(--kima-opacity-disabled); cursor: not-allowed; } } small { color: var(--kima-color-on-surface-variant); } }
/* 菜单内容由 Reka 渲染并可能传送到 body：那里没有本组件的 data-v 祖先，
 * :deep 命中不了，弹层会连底色都没有。表面规则按类名全局命中。 */
:global(.kima-context-menu__popup) { min-width: 0;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-body-medium);
  line-height: 1.5;
  @include kima-popup;
  box-sizing: border-box;
  z-index: 60;
  width: min(360px, calc(100vw - 24px));
  max-height: min(70vh, var(--reka-popper-available-height, 70vh));
  overflow: auto;
  padding: var(--kima-space-4);
  border-radius: var(--kima-radius-l);
  outline: none; padding: var(--kima-space-2); width: min(280px, calc(100vw - 24px)); }
.kima-context-menu__trigger { @include kima-motion-colors; }
</style>
