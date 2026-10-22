<!-- 命令面板：原生模态 dialog 聚焦隔离，搜索 label/description/keywords/group、分组、禁用跳过与键盘执行。
items 为 { value, label, group, description, keywords: [], disabled, shortcut }；select 发出动作，不冒充表单选择。
调用示例：<kima-command v-model:open="open" :items="[{ value: 'new', label: '新建项目', group: '项目' }]" @select="run" />
-->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from "vue";
import KimaButton from "./button.ce.vue";
import KimaIconButton from "./icon-button.ce.vue";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useInteractionRoot, useInteractionModel, useChoiceCursor } from "../utils/interaction.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ open: Boolean, disabled: Boolean, label: { type: String, default: "命令面板" }, triggerLabel: { type: String, default: "打开命令面板" }, placeholder: { type: String, default: "搜索命令…" }, items: { type: Array, default: () => [] }, emptyText: { type: String, default: "没有匹配命令" } });
const emit = defineEmits(["update:open", "select"]);
const { root, forwardedAttrs } = useInteractionRoot();
const [localOpen, updateOpen] = useInteractionModel(props, "open", emit);
const query = ref("");
const search = ref(null);
const dialog = ref(null);
let returnFocus;
function syncDialog() {
  const element = dialog.value;
  if (!element) return;
  if (localOpen.value && !props.disabled && !element.open) {
    returnFocus = element.ownerDocument.activeElement;
    query.value = "";
    element.showModal();
    nextTick(() => { if (dialog.value?.open) search.value?.focus(); });
  } else if ((!localOpen.value || props.disabled) && element.open) {
    element.close();
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  }
}
function nativeClose(event) { if (event.currentTarget.open === false && localOpen.value) updateOpen(false); }
function cancel(event) { event.preventDefault(); event.stopPropagation(); updateOpen(false); }
const listId = `kima-command-${useId()}`;
const filtered = computed(() => { const text = query.value.trim().toLocaleLowerCase(); return props.items.filter((item) => `${item.label} ${item.description || ''} ${item.group || ''} ${(item.keywords || []).join(' ')}`.toLocaleLowerCase().includes(text)); });
const groups = computed(() => { const result = new Map(); filtered.value.forEach((item, index) => { const key = item.group || "命令"; if (!result.has(key)) result.set(key, []); result.get(key).push({ item, index }); }); return [...result].map(([label, items]) => ({ label, items })); });
function select(item) { if (props.disabled || item.disabled) return; emit("select", item.value, item); updateOpen(false); }
const { active, activeId, highlight, keydown: cursorKeydown } = useChoiceCursor(filtered, select, `${listId}-option`);
function keydown(event) {
  if (event.isComposing) return;
  if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); updateOpen(false); }
  else cursorKeydown(event);
}
watch(localOpen, syncDialog, { flush: "post" });
watch(() => props.disabled, (value) => { if (value) updateOpen(false); });
onMounted(syncDialog);
onBeforeUnmount(() => { const element = dialog.value; if (element?.open) element.close(); });
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-command">
    <KimaButton variant="tonal" :disabled="disabled" aria-haspopup="dialog" :aria-expanded="localOpen && !disabled" @click="updateOpen(true)"><slot name="trigger">{{ triggerLabel }}</slot></KimaButton>
    <dialog ref="dialog" class="kima-command__dialog" :aria-label="label" @cancel="cancel" @close="nativeClose" @click.self="updateOpen(false)">
      <section class="kima-command__panel"><header class="kima-command__header"><h2>{{ label }}</h2><KimaIconButton label="关闭命令面板" :icon="Cancel01Icon" @click="updateOpen(false)" /></header>
      <input ref="search" v-model="query" class="kima-command__search" role="combobox" type="search" autofocus aria-expanded="true" aria-autocomplete="list" :aria-label="placeholder" :placeholder="placeholder" :aria-controls="listId" :aria-activedescendant="activeId" @input.stop @change.stop @keydown="keydown">
      <div :id="listId" class="kima-command__list" role="listbox" :aria-label="label"><div v-for="(group, groupIndex) in groups" :key="group.label" role="group" :aria-labelledby="`${listId}-group-${groupIndex}`"><h3 :id="`${listId}-group-${groupIndex}`">{{ group.label }}</h3><div v-for="({ item, index }) in group.items" :id="`${listId}-option-${index}`" :key="item.value ?? index" class="kima-command__item" role="option" :aria-selected="index === active" :aria-disabled="item.disabled || undefined" :data-active="index === active" @pointermove="!item.disabled && highlight(index)" @pointerdown.prevent @click="select(item)"><span>{{ item.label }}<small v-if="item.description">{{ item.description }}</small></span><small v-if="item.shortcut">{{ item.shortcut }}</small></div></div></div>
      <p v-if="!filtered.length" role="status">{{ emptyText }}</p>
      </section>
    </dialog>
  </div>
</template>
<style scoped lang="scss">
@use "../styles/interaction" as *;
@use "../styles/mixins" as *;
.kima-command__dialog {
  position: fixed; inset: 0; box-sizing: border-box; width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: var(--kima-space-4); border: 0; color: var(--kima-color-on-surface); background: var(--kima-color-transparent);
  &[open] { display: grid; place-items: center; }
  transition: opacity var(--kima-duration-medium) var(--kima-curve-emphasized), display var(--kima-duration-medium) allow-discrete, overlay var(--kima-duration-medium) allow-discrete;
  &::backdrop { background: color-mix(in srgb, var(--kima-color-scrim) var(--kima-scrim-opacity), var(--kima-color-transparent)); backdrop-filter: blur(var(--kima-backdrop-blur)); transition: opacity var(--kima-duration-medium) var(--kima-curve-emphasized); }
  &:not([open]), &:not([open])::backdrop { opacity: 0; }
  @starting-style { &[open], &[open]::backdrop { opacity: 0; } }
}
.kima-command__panel {
  @include kima-popup(large); width: min(640px, 100%); max-height: 85vh; overflow: auto; padding: var(--kima-space-6); box-sizing: border-box; border-radius: var(--kima-radius-xl);
  transition: scale var(--kima-duration-medium) var(--kima-curve-emphasized);
  .kima-command__dialog:not([open]) & { scale: 0.96; }
  @starting-style { scale: 0.96; }
}
.kima-command__header { display: flex; align-items: center; justify-content: space-between; gap: var(--kima-space-3); margin-bottom: var(--kima-space-4); h2 { margin: 0; font-size: var(--kima-font-size-title-large); } }
@media (prefers-reduced-motion: reduce) { .kima-command__dialog, .kima-command__dialog::backdrop, .kima-command__panel { transition-duration: 1ms; } .kima-command__dialog .kima-command__panel { scale: 1; } }
.kima-command { @include interaction-root; &__search { @include interaction-search; } &__list { max-height: 50vh; overflow: auto; } &__item { @include interaction-row; } h3 { color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-medium); margin: var(--kima-space-4) var(--kima-space-3) var(--kima-space-2); } small { display: block; color: var(--kima-color-on-surface-variant); } }
.kima-command__search { @include kima-motion-colors; }
</style>
