<!-- 集合复用 chip，选择/删除即时更新；方向键只保留一个 Tab 入口。 -->
<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import KimaChip from './chip.ce.vue';
import { useInteractionRoot, useInteractionModel, useInteractionReset } from '../utils/interaction.js';
import { presenceTransition } from '../utils/motion.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ items: { type: Array, default: () => [] }, modelValue: { type: Array, default: () => [] }, selectable: Boolean, removable: Boolean, disabled: Boolean, name: String, label: { type: String, default: '标签集合' } });
const emit = defineEmits(['update:items', 'update:modelValue', 'change', 'remove']);
const { root, forwardedAttrs } = useInteractionRoot();
const [items, updateItems] = useInteractionModel(props, 'items', emit);
const [selected, update] = useInteractionModel(props, 'modelValue', emit);
const active = ref(0);
const rows = computed(() => items.value.map(item => typeof item === 'object' ? item : { value: item, label: String(item) }));
const chosen = item => selected.value.includes(item.value);
function select(item) { if (props.disabled || item.disabled) return; update(chosen(item) ? selected.value.filter(value => value !== item.value) : [...selected.value, item.value]); emit('change', selected.value); }
function buttons() { return [...(root.value?.querySelectorAll('button:not(:disabled)') || [])].filter(button => !button.closest('[inert]')); }
async function syncFocus(focus = false) { await nextTick(); const list = buttons(); active.value = Math.max(0, Math.min(active.value, list.length - 1)); list.forEach((button, index) => { button.tabIndex = index === active.value ? 0 : -1; }); if (focus) list[active.value]?.focus(); }
function remove(item) { if (props.disabled || item.disabled) return; updateItems(items.value.filter(entry => (typeof entry === 'object' ? entry.value : entry) !== item.value)); update(selected.value.filter(value => value !== item.value)); emit('remove', item); syncFocus(true); }
function keydown(event) {
  const list = buttons(), current = list.indexOf(event.target);
  if (current < 0) return;
  if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) { event.preventDefault(); active.value = event.key === 'Home' ? 0 : event.key === 'End' ? list.length - 1 : (current + (event.key === 'ArrowLeft' ? -1 : 1) + list.length) % list.length; syncFocus(true); }
  if (['Delete', 'Backspace'].includes(event.key) && props.removable) { const value = event.target.closest('[data-tag-index]')?.dataset.tagIndex; if (value != null) { event.preventDefault(); remove(rows.value[Number(value)]); } }
}
watch([rows, () => props.disabled, () => props.selectable, () => props.removable], () => syncFocus(), { immediate: true, flush: 'post' });
onMounted(() => syncFocus());
useInteractionReset(root, selected, update);
useInteractionReset(root, items, updateItems);
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-tag-group" role="group" :aria-label="label" @keydown="keydown"><TransitionGroup name="kima-list" tag="div" class="kima-tag-group__items" v-bind="presenceTransition"><KimaChip v-for="(item, index) in rows" :key="item.value" :data-tag-index="index" :label="item.label" :value="item.value" :selectable="selectable" :removable="removable" :disabled="disabled || item.disabled" :model-value="chosen(item)" @change="select(item)" @remove="remove(item)"/></TransitionGroup><input v-for="value in selected" :key="value" type="hidden" :name="name" :value="value" :disabled="disabled"></div></template>
<style scoped lang="scss">.kima-tag-group { color: var(--kima-color-on-surface); font-family: var(--kima-font-family); &__items { position: relative; display: flex; flex-wrap: wrap; gap: var(--kima-space-2); } }</style>
