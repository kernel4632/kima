<!-- 虚拟表格：固定行高窗口 + 原生 table/theads/tbody/tr/td 语义；不会把 virtual-scroll 伪装成表格。 -->
<script setup>
import { computed, getCurrentInstance, onMounted, onBeforeUnmount, ref, useAttrs, useHost, useId, watch } from "vue";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  columns: { type: Array, default: () => [] }, rows: { type: Array, default: () => [] }, items: { type: Array, default: undefined },
  rowKey: { type: [String, Function], default: undefined }, itemHeight: { type: Number, default: 56 }, height: { type: [Number, String], default: 360 }, overscan: { type: Number, default: 4 }, caption: { type: String, default: "" }, selectable: Boolean, modelValue: { type: Array, default: () => [] }, loading: Boolean,
});
const emit = defineEmits(["update:modelValue", "row-click"]);
const attrs = useAttrs(); const host = getCurrentInstance()?.ce ? useHost() : null; const root = ref(null); const viewportHeight = ref(0); const scrollTop = ref(0); const activeIndex = ref(-1); let resizeObserver;
const tableRows = computed(() => props.items === undefined ? props.rows : props.items);
const rowHeight = computed(() => Math.max(1, Math.floor(Number(props.itemHeight) || 56)));
const viewHeight = computed(() => viewportHeight.value || Number.parseFloat(props.height) || rowHeight.value * 6);
const totalHeight = computed(() => tableRows.value.length * rowHeight.value);
const range = computed(() => { if (!tableRows.value.length) return { start: 0, end: -1 }; const extra = Math.max(0, Math.floor(Number(props.overscan) || 0)); return { start: Math.max(0, Math.floor(scrollTop.value / rowHeight.value) - extra), end: Math.min(tableRows.value.length - 1, Math.ceil((scrollTop.value + viewHeight.value) / rowHeight.value) + extra - 1) }; });
const visibleRows = computed(() => tableRows.value.slice(range.value.start, range.value.end + 1).map((row, offset) => ({ row, index: range.value.start + offset, key: getRowKey(row, range.value.start + offset) })));
const selected = computed(() => new Set(props.modelValue));
const colspan = computed(() => Math.max(1, props.columns.length + (props.selectable ? 1 : 0)));
const heightStyle = computed(() => typeof props.height === "number" ? `${Math.max(0, props.height)}px` : props.height || "360px");
const forwardedAttrs = computed(() => host ? { ...attrs, id: undefined } : attrs);
function getRowKey(row, index) { if (typeof props.rowKey === "function") return props.rowKey(row); if (typeof props.rowKey === "string") return row?.[props.rowKey]; return row?.id ?? row?.key ?? `row-${index}`; }
function toggle(row, index) { const key = getRowKey(row, index); const next = new Set(selected.value); next.has(key) ? next.delete(key) : next.add(key); emit("update:modelValue", [...next]); }
function handleKeydown(row, index, event) { if (event.target !== event.currentTarget) return; if (event.key === " " && props.selectable) { event.preventDefault(); toggle(row, index); } else if (event.key === "Enter") emit("row-click", row, event); else if (["ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); const next = Math.max(0, Math.min(tableRows.value.length - 1, index + (event.key === "ArrowUp" ? -1 : 1))); document.getElementById(`${tableId}-row-${next}`)?.focus(); } }
const tableId = `kima-virtual-table-${useId()}`;
function handleScroll(event) { scrollTop.value = event.currentTarget.scrollTop; }
onMounted(() => { viewportHeight.value = root.value?.clientHeight || 0; if (typeof ResizeObserver !== "undefined" && root.value) { resizeObserver = new ResizeObserver((entries) => { viewportHeight.value = entries[0]?.contentRect.height || root.value.clientHeight; }); resizeObserver.observe(root.value); } });
onBeforeUnmount(() => resizeObserver?.disconnect());
watch(() => tableRows.value.length, (length) => { if (activeIndex.value >= length) activeIndex.value = length - 1; });
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-virtual-table" :style="{ height: heightStyle }" role="region" :aria-label="caption || attrs['aria-label'] || '虚拟表格区域'" @scroll="handleScroll">
    <table :aria-busy="loading || undefined"><caption v-if="caption">{{ caption }}</caption><thead><tr><th v-if="selectable" scope="col" class="kima-virtual-table__select">选择</th><th v-for="column in columns" :key="column.key" scope="col" :class="`kima-virtual-table__align--${column.align || 'start'}`">{{ column.label }}</th></tr></thead>
      <tbody v-if="loading"><tr><td :colspan="colspan" class="kima-virtual-table__message" role="status"><slot name="loading">加载中</slot></td></tr></tbody>
      <tbody v-else-if="visibleRows.length"><tr class="kima-virtual-table__spacer" aria-hidden="true"><td :colspan="colspan" :style="{ height: `${range.start * rowHeight}px` }" /></tr><tr v-for="entry in visibleRows" :id="`${tableId}-row-${entry.index}`" :key="entry.key" :class="{ 'kima-virtual-table__row--selected': selected.has(entry.key) }" tabindex="0" :aria-rowindex="entry.index + 2" :aria-selected="props.selectable ? selected.has(entry.key) : undefined" @click="emit('row-click', entry.row, $event)" @keydown="handleKeydown(entry.row, entry.index, $event)"><td v-if="selectable" class="kima-virtual-table__select"><input type="checkbox" :checked="selected.has(entry.key)" :aria-label="`选择第 ${entry.index + 1} 行`" @click.stop="toggle(entry.row, entry.index)" /></td><td v-for="column in columns" :key="column.key" :class="`kima-virtual-table__align--${column.align || 'start'}`"><slot :name="`cell-${column.key}`" :row="entry.row" :value="entry.row[column.key]" :column="column">{{ entry.row[column.key] }}</slot></td></tr><tr class="kima-virtual-table__spacer" aria-hidden="true"><td :colspan="colspan" :style="{ height: `${Math.max(0, totalHeight - (range.end + 1) * rowHeight)}px` }" /></tr></tbody>
      <tbody v-else><tr><td :colspan="colspan" class="kima-virtual-table__message" role="status"><slot name="empty">暂无数据</slot></td></tr></tbody>
    </table>
  </div>
</template>
<style scoped lang="scss">
.kima-virtual-table { min-width: 0; overflow: auto; color: var(--kima-color-on-surface); background: var(--kima-color-layer-1); font-family: var(--kima-font-family); }
.kima-virtual-table:focus-visible, .kima-virtual-table tr:focus-visible { outline: 2px solid var(--kima-color-primary); outline-offset: -2px; }
.kima-virtual-table table { width: 100%; min-width: 36rem; border-collapse: separate; border-spacing: 0; table-layout: fixed; }
.kima-virtual-table th, .kima-virtual-table td { box-sizing: border-box; height: var(--kima-virtual-row-height, 56px); padding: var(--kima-space-3) var(--kima-space-4); border: 0; overflow-wrap: anywhere; text-align: start; vertical-align: middle; }
.kima-virtual-table th { position: sticky; top: 0; z-index: 1; color: var(--kima-color-on-surface-variant); background: var(--kima-color-popup); }
.kima-virtual-table tbody tr:not(.kima-virtual-table__spacer) { transition: background-color var(--kima-duration-effects) var(--kima-curve-standard), color var(--kima-duration-effects) var(--kima-curve-standard); }
.kima-virtual-table tbody tr:not(.kima-virtual-table__spacer):hover { background: var(--kima-color-layer-3); }
.kima-virtual-table__row--selected { color: var(--kima-color-on-primary-container); background: var(--kima-color-primary-container); }
.kima-virtual-table__row--selected:hover { background: var(--kima-color-primary-container-hover); }
.kima-virtual-table__spacer td { padding: 0; height: auto; }
.kima-virtual-table__select { width: 72px; text-align: center; }
.kima-virtual-table__message { height: 96px; color: var(--kima-color-on-surface-variant); text-align: center; }
.kima-virtual-table__align--center { text-align: center; } .kima-virtual-table__align--end { text-align: end; } .kima-virtual-table__align--right { text-align: right; }
@media (prefers-reduced-motion: reduce) { .kima-virtual-table tbody tr { transition: none; } }
</style>
