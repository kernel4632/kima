<!-- 菜单：保留搜索/单选，children 递归子菜单；type=checkbox/radio，checked 按 value / radio group 存储。
调用示例：<kima-menu :items="[{value:'file',label:'文件',children:[{value:'save',label:'保存'}]}]" label="操作" />
-->
<script setup>
import { computed, nextTick, ref, useId, watch } from 'vue';
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuContent } from 'reka-ui';
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

/* M3E 弹层进出（bounce-open）：Vue <Transition> 的类挂载在 Reka Portal
 * + force-mount 组合下不生效（实测 enter-active 从未出现，CSS 链路本身正常）。
 * 改用官方同构思路——纯 CSS 驱动：打开时挂 kima-popup-enter-active（bounce
 * keyframes + opacity 快进），动画结束自己移除；关闭时挂 leave-active，
 * 退场播完再卸载（leaving 控制卸载延迟，保 AnimatePresence 的等价语义）。
 * leaving 必须同步置位：放 nextTick 里的话 v-if 同一帧已把弹层卸掉，
 * 退场永远播不出来。事件回调必须过滤 target——涟漪/选项行的动画会冒泡
 * 误触清理。 */
const leaving = ref(false);
watch(localOpen, (open) => {
  const el = root.value?.querySelector('.kima-menu__popup');
  if (open) {
    leaving.value = false;
    nextTick(() => {
      const node = root.value?.querySelector('.kima-menu__popup');
      if (!node || !localOpen.value) return;
      node.classList.remove('kima-popup-leave-active', 'kima-popup-leave-to');
      const attach = () => {
        if (!localOpen.value || node.classList.contains('kima-popup-enter-active')) return;
        node.classList.add('kima-popup-enter-active');
        const clear = (event) => {
          if (event.target !== node) return;
          node.classList.remove('kima-popup-enter-active');
          node.removeEventListener('animationend', clear);
        };
        node.addEventListener('animationend', clear);
      };
      /* Reka PopperContent 定位完成前给弹层内联 animation:none，压过类选择器；
       * 挂类等 data-side 出现（定位完成同帧写出）。 */
      if (node.hasAttribute('data-side')) attach();
      else {
        const observer = new MutationObserver(() => { if (node.hasAttribute('data-side')) { observer.disconnect(); attach(); } });
        observer.observe(node, { attributes: true, attributeFilter: ['data-side'] });
        setTimeout(() => { observer.disconnect(); attach(); }, 300);
      }
    });
  } else {
    if (!el) return;
    leaving.value = true; // 同步置位：渲染前保住弹层，退场播完再卸
    nextTick(() => {
      const node = root.value?.querySelector('.kima-menu__popup');
      if (!node || localOpen.value) return;
      node.classList.remove('kima-popup-enter-active');
      node.classList.add('kima-popup-leave-active', 'kima-popup-leave-to');
      const done = (event) => {
        if (event && event.target !== node) return;
        leaving.value = false;
        node.classList.remove('kima-popup-leave-active', 'kima-popup-leave-to');
        node.removeEventListener('transitionend', done);
      };
      node.addEventListener('transitionend', done);
      setTimeout(done, 140); // 官方退场 100ms，+40ms 兜底
    });
  }
});
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-menu" :class="{'kima-menu--open': localOpen, 'kima-menu--icon': iconTrigger, [`kima-menu--${triggerSize}`]: true}">
    <DropdownMenuRoot :open="localOpen && !disabled" :modal="false" @update:open="setOpen">
      <DropdownMenuTrigger as-child><button ref="trigger" type="button" class="kima-menu__trigger" :disabled="disabled" :aria-label="iconTrigger ? label : undefined" :title="iconTrigger ? label : undefined"><slot name="trigger" :open="localOpen" :selected-item="selectedItem" :value="localValue"><KimaIcon v-if="iconTrigger" :icon="triggerIcon" :size="20" aria-hidden="true" /><span v-else>{{ selectedItem?.label || label }}</span></slot><KimaIcon v-if="!iconTrigger" :icon="ArrowDown01Icon" :size="20" aria-hidden="true" /></button></DropdownMenuTrigger>
      <!-- 弹层动效按 M3E MenuElement.ts 一比一（纯 CSS，无 JS 动画库）：
           官方 = CSS animation bounce-open（scaleY 0→1）跑 spring-fast-spatial 的
           linear() 弹簧采样串 + opacity 100ms transition 快进、
           transform-origin 按锚点方向（--bottom→top / --top→bottom 官方同款）。
           退场 = 100ms 缩回 0.8 + 淡出（官方 transition short2 同值）。
           进退场类由 script 里的 localOpen watcher 手动挂（Vue <Transition> 的类
           在 Reka Portal + force-mount 组合下不生效——实测 enter-active 从未
           出现，而手动挂类后 animationName 立即恢复）。 -->
      <DropdownMenuContent v-if="localOpen && !disabled || leaving" :id="menuId" force-mount v-bind="position" as-child>
        <div
          class="kima-menu__popup"
          :aria-label="label"
          @escape-key-down="(e) => dismissInteraction(e, () => setOpen(false))"
          @open-auto-focus="(e) => { if (searchable) { e.preventDefault(); nextTick(() => searchInput?.focus()); } }"
        >
            <div v-if="searchable" class="kima-menu__search-wrap"><KimaIcon :icon="Search01Icon" :size="18" aria-hidden="true" /><input ref="searchInput" v-model="query" type="search" class="kima-menu__search" role="searchbox" aria-label="搜索菜单项" @input.stop @change.stop @keydown.stop="searchKey"></div>
            <MenuItems :items="visibleItems" :checked="checked" :model-value="localValue" selection :disabled="disabled" @select="select" @check="check" /><div v-if="!visibleItems.length" role="status">没有匹配项目</div>
          </div>
        </DropdownMenuContent>
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
  /* 官方 hover 模式：触发器轻洗 5%（状态层 ::after 之外，行级 wash 更直观）。 */
  &:hover:not(:disabled) {
    background: var(--kima-color-wash-hover);
  }
  &:disabled  {
    opacity: var(--kima-opacity-disabled);
    cursor: not-allowed;

  }

}
.kima-menu--small .kima-menu__trigger { min-height: 40px; padding-inline: var(--kima-space-3); }
.kima-menu--icon .kima-menu__trigger { width: var(--kima-touch-target); min-width: var(--kima-touch-target); height: var(--kima-touch-target); padding: 0; justify-content: center; aspect-ratio: 1; }
/* 菜单内容由 Reka 渲染（本组件不走 Portal，弹层在 root 内），
 * data-v 标记在弹层 div 上，:global 按类名命中最稳。
 * transform-origin 按 M3E 锚点方向（MenuElement.ts :host(--bottom)→top /
 * --top→bottom）。Reka 把翻转后的真实方向写在 data-side 上（props.placement
 * 是期望方向，翻转后 data-side 才是真相），弹层从锚点往下开 = 向上生长 = origin top。 */
:global(.kima-menu__popup[data-side="bottom"]) { transform-origin: top; }
:global(.kima-menu__popup[data-side="top"]) { transform-origin: bottom; }
:global(.kima-menu__popup[data-side="right"]) { transform-origin: left center; }
:global(.kima-menu__popup[data-side="left"]) { transform-origin: right center; }
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
