<!-- 菜单栏：桌面应用操作菜单，不是页面导航。menus 为 { value, label, disabled, items: [{ value, label, disabled, shortcut }] }。
支持菜单间左右键、菜单内上下键、Home/End、字符跳转与 Escape。
调用示例：<kima-menubar :menus="[{ value: 'file', label: '文件', items: [{ value: 'save', label: '保存' }] }]" @select="run" />
-->
<script setup>
import { computed, nextTick, useId, watch } from "vue";
import { presenceTransition } from "../../utils/motion.js";
import { MenubarRoot, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem } from "reka-ui";
import KimaButton from "../core/button.ce.vue";
import MenuItems from '../../internal/menu-items.vue';
import { useShellModel, useMenuChecks } from '../../utils/shell.js';
import { useInteractionRoot, useInteractionModel, usePlacement, dismissInteraction } from "../../utils/interaction.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: { type: String, default: "" }, menus: { type: Array, default: () => [] }, disabled: Boolean, label: { type: String, default: "应用菜单" }, placement: { type: String, default: "bottom-start" }, checked: { type: Object, default: () => ({}) } });
const emit = defineEmits(["update:modelValue", "select", "update:checked", "check"]);
const { checked, check } = useMenuChecks(props, emit);
const { root, forwardedAttrs } = useInteractionRoot();
const [local, update] = useShellModel(props, "modelValue", emit);
const position = usePlacement(props);
const instanceId = `kima-menubar-${useId()}`;
const internalValue = computed(() => {
  const index = props.menus.findIndex((menu, index) => String(menu.value ?? index) === local.value && !menu.disabled);
  return !props.disabled && index >= 0 ? `${instanceId}-${index}` : '';
});
function updateInternal(value) {
  const index = props.menus.findIndex((menu, index) => `${instanceId}-${index}` === value);
  update(index < 0 ? '' : String(props.menus[index].value ?? index));
}
function select(item, menu) { if (props.disabled || menu.disabled || item.disabled) return; emit("select", item.value, item, menu); update(""); }
watch(() => props.disabled, (value) => { if (value) update(""); });
function navigate(event, index) {
  if (!["ArrowRight", "ArrowLeft"].includes(event.key) || event.isComposing || event.target.closest('[data-kima-submenu]') || event.target.hasAttribute('aria-haspopup')) return;
  event.preventDefault(); event.stopPropagation();
  const step = event.key === "ArrowRight" ? 1 : -1;
  let next = index;
  for (let count = 0; count < props.menus.length; count++) {
    next = (next + step + props.menus.length) % props.menus.length;
    if (!props.menus[next].disabled) break;
  }
  update(String(props.menus[next].value ?? next));
  nextTick(() => (root.value?.$el || root.value)?.querySelector(`[data-kima-menu-index="${next}"] [role="menuitem"]:not([data-disabled])`)?.focus());
}
</script>
<template>
  <MenubarRoot ref="root" v-bind="forwardedAttrs" class="kima-menubar" :model-value="internalValue" :aria-label="label" loop @update:model-value="updateInternal">
    <MenubarMenu v-for="(menu, index) in menus" :key="menu.value ?? index" :value="`${instanceId}-${index}`">
      <MenubarTrigger :id="`${instanceId}-${index}`" as-child :disabled="disabled || menu.disabled"><KimaButton variant="text" :disabled="disabled || menu.disabled">{{ menu.label }}</KimaButton></MenubarTrigger>
      <Transition name="kima-popup" v-bind="presenceTransition"><MenubarContent v-if="local === String(menu.value ?? index) && !disabled && !menu.disabled" force-mount v-bind="position" class="kima-menubar__popup" :data-kima-menu-index="index" loop :aria-label="menu.label" @escape-key-down="(event) => dismissInteraction(event, () => update(''))" @keydown="navigate($event, index)"><MenuItems :items="menu.items || []" family="Menubar" :checked="checked" :disabled="disabled || menu.disabled" @select="select($event, menu)" @check="check" /><p v-if="!menu.items?.length" role="status">暂无操作</p></MenubarContent></Transition>
    </MenubarMenu>
  </MenubarRoot>
</template>
<style scoped lang="scss">
@use "../../styles/mixins" as *;
.kima-menubar { min-width: 0;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-body-medium);
  line-height: 1.5; @include kima-layer(1); display: flex; flex-wrap: wrap; gap: var(--kima-space-2); padding: var(--kima-space-2); border-radius: var(--kima-radius-m); &__item { @include kima-focus-ring;
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
/* 传送到 body 的内容拿不到 data-v，表面规则按类名全局命中。 */
:global(.kima-menubar__popup) { min-width: 0;
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
</style>
