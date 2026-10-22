<!-- 固定行高窗口；活动项立即进入窗口，再设置 aria-activedescendant。 -->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useInteractionRoot } from '../utils/interaction.js';
import { useUtilityChoice } from '../utils/utility-choice.js';
import { presenceTransition } from '../utils/motion.js';
import { useRipple } from '../utils/ripple.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: { type: [String, Number, Array], default: null }, options: { type: Array, default: () => [] }, multiple: Boolean, disabled: Boolean, searchable: { type: Boolean, default: true }, rowHeight: { type: Number, default: 48 }, height: { type: Number, default: 240 }, name: String, label: { type: String, default: '虚拟选择' } });
const emit = defineEmits(['update:modelValue', 'change', 'update:open']);
const { root, forwardedAttrs } = useInteractionRoot();
const { values, query, active, id, options, filtered, selected, choose, move } = useUtilityChoice(props, emit, root, () => setOpen(false));
const open = ref(false), scrollTop = ref(0), viewport = ref(null), control = ref(null);
const row = computed(() => Math.max(24, props.rowHeight || 48));
const visibleHeight = computed(() => Math.max(row.value, props.height || 240));
const start = computed(() => Math.max(0, Math.floor(scrollTop.value / row.value) - 2));
const end = computed(() => Math.min(filtered.value.length, start.value + Math.ceil(visibleHeight.value / row.value) + 5));
const windowRows = computed(() => filtered.value.slice(start.value, end.value).map((item, index) => ({ item, index: start.value + index })));
const activeId = computed(() => open.value && active.value >= start.value && active.value < end.value ? `${id}-${active.value}` : undefined);
const summary = computed(() => options.value.filter(selected).map(item => item.label ?? item.value).join('、'));
const hint = computed(() => props.multiple ? '请选择' : '搜索或选择');
function setOpen(next, restore = false) { if (props.disabled && next) return; open.value = next; emit('update:open', next); if (next) reveal(); if (restore) nextTick(() => control.value?.focus()); }
async function reveal() {
  const top = active.value * row.value;
  if (top < scrollTop.value) scrollTop.value = top;
  else if (top + row.value > scrollTop.value + visibleHeight.value) scrollTop.value = top + row.value - visibleHeight.value;
  await nextTick(); if (viewport.value) viewport.value.scrollTop = scrollTop.value;
}
watch(active, reveal, { flush: 'sync' });
watch(query, () => { scrollTop.value = 0; if (viewport.value) viewport.value.scrollTop = 0; });
watch(() => props.disabled, value => { if (value) setOpen(false); });
function select(item) { choose(item); if (!props.multiple) setOpen(false, true); }
function keydown(event) {
  if (event.key === 'Escape' && open.value) { event.preventDefault(); event.stopPropagation(); setOpen(false, true); return; }
  if (event.key === 'Tab') { setOpen(false); return; }
  if (!open.value && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) { event.preventDefault(); setOpen(true); reveal(); return; }
  if (!open.value) return;
  if (event.key === 'Enter' || (!props.searchable && event.key === ' ')) { event.preventDefault(); select(filtered.value[active.value]); }
  else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) move(event);
}
function onScroll(event) {
  scrollTop.value = event.target.scrollTop;
  if (active.value < start.value || active.value >= end.value) active.value = filtered.value.findIndex((item, index) => index >= start.value && index < end.value && !item.disabled);
}
let doc;
function outside(event) { if (!root.value?.contains(event.target)) setOpen(false); }
onMounted(() => { doc = root.value.ownerDocument; doc.addEventListener('pointerdown', outside); });
onBeforeUnmount(() => doc?.removeEventListener('pointerdown', outside));
useRipple(root);
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-virtual-select" @keydown="keydown"><input v-if="searchable" ref="control" v-model="query" class="kima-virtual-select__control" role="combobox" :aria-label="label" :placeholder="hint" :disabled="disabled" :aria-expanded="open" :aria-controls="open ? `${id}-list` : undefined" :aria-activedescendant="activeId" autocomplete="off" @input="setOpen(true)" @click="setOpen(!open)"><button v-else ref="control" type="button" class="kima-virtual-select__control kima-ripple-host" role="combobox" :aria-label="label" :disabled="disabled" :aria-expanded="open" :aria-controls="open ? `${id}-list` : undefined" :aria-activedescendant="activeId" @click="setOpen(!open)">{{ summary || '请选择' }}</button><span v-if="searchable && summary" class="kima-virtual-select__summary">{{ summary }}</span><Transition name="kima-popup" v-bind="presenceTransition"><div v-if="open" :id="`${id}-list`" ref="viewport" class="kima-virtual-select__viewport" role="listbox" :aria-label="label" :aria-multiselectable="multiple || undefined" :style="{ maxHeight: `${visibleHeight}px` }" @scroll="onScroll"><div :style="{ height: `${filtered.length * row}px`, position: 'relative' }"><div v-for="entry in windowRows" :id="`${id}-${entry.index}`" :key="entry.item.index" role="option" class="kima-virtual-select__option kima-ripple-host" :aria-selected="selected(entry.item)" :aria-disabled="entry.item.disabled" :aria-posinset="entry.index + 1" :aria-setsize="filtered.length" :data-active="entry.index === active" :data-disabled="entry.item.disabled || undefined" :style="{ height: `${row}px`, transform: `translateY(${entry.index * row}px)` }" @mousedown.prevent @click="select(entry.item)">{{ entry.item.label ?? entry.item.value }}</div></div><p v-if="!filtered.length">没有匹配选项</p></div></Transition><input v-for="(entry, index) in values" :key="index" type="hidden" :name="name" :value="entry" :disabled="disabled"></div></template>
<style scoped lang="scss">@use '../styles/interaction' as *; @use '../styles/mixins' as *; .kima-virtual-select { @include interaction-root; position: relative; &__control { @include interaction-search; margin: 0; } &__summary { display: block; padding: var(--kima-space-2); color: var(--kima-color-on-surface-variant); } &__viewport { @include kima-popup; position: absolute; top: 100%; left: 0; right: 0; z-index: 60; overflow: auto; border-radius: var(--kima-radius-m); overscroll-behavior: contain; } &__option { @include interaction-row; position: absolute; top: 0; left: 0; overflow: hidden; } }</style>
