<!--
数据表格：展示数据行、筛选、可选受控/非受控排序、列宽调整、汇总、选择、展开和编辑。
items 和 rows 都接受对象数组；传入 items 时优先使用它，包括空数组。
rowKey 接受字段名或函数，未指定时使用 id、key，最后才使用行位置。
sortKey/sortDirection 传入时排序受控：组件仍发出 sort-change，但不改写数据；不传入时由组件本地排序。
列可设置 sortable、resizable、width、minWidth、hidden、sorter 和 summary(rows, context)；table 的 sortable/resizable 作为默认开关。
summary 返回 footer 单元格内容，组件不自动分页，也不改变传入 rows/items。
row-click 返回 row 和原始事件；Enter 激活行，空格选择行，方向键移动焦点。
Vue 支持 cell-字段名插槽；原生自定义元素用 slot="empty" / slot="loading"。
调用示例：
  <kima-table
    sortable resizable summary
    :columns="[
      { key: 'name', label: '姓名', sortable: true, resizable: true },
      { key: 'amount', label: '金额', summary: rows => rows.reduce((sum, row) => sum + row.amount, 0) }
    ]"
    :rows="users"
    row-key="id"
    @sort-change="sort = $event"
  />
-->
<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, ref, useAttrs, useHost, watch } from "vue";
import { useContentMotion } from "../../utils/content-motion.js";
import { presenceTransition } from "../../utils/motion.js";
import KimaIcon from "../core/icon.ce.vue";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  CheckmarkSquare02Icon,
  MinusSignSquareIcon,
  SquareIcon,
} from "@hugeicons/core-free-icons";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  items: { type: Array, default: undefined },
  caption: { type: String, default: "" },
  striped: Boolean,
  hoverable: Boolean,
  selectable: Boolean,
  expandable: Boolean,
  editable: Boolean,
  modelValue: { type: Array, default: () => [] },
  filterValues: { type: Object, default: () => ({}) },
  expandedRows: { type: Array, default: () => [] },
  rowKey: { type: [String, Function], default: undefined },
  sortKey: { type: String, default: undefined },
  sortDirection: { type: String, default: undefined },
  sortable: Boolean,
  resizable: Boolean,
  summary: Boolean,
  loading: Boolean,
});

const emit = defineEmits([
  "update:modelValue", "row-click", "sort-change", "update:filterValues", "filter-change",
  "update:expandedRows", "expand", "cell-edit",
]);
const attrs = useAttrs();
const host = getCurrentInstance().ce ? useHost() : null;
const forwardedAttrs = computed(() => host ? { ...attrs, id: undefined } : attrs);
const scroll = ref(null);
const localSelection = ref(props.modelValue);
const localFilters = ref({ ...props.filterValues });
const localExpanded = ref([...props.expandedRows]);
const localSortKey = ref(props.sortKey ?? "");
const localSortDirection = ref(props.sortDirection ?? "");
const localWidths = ref(Object.fromEntries(props.columns.filter((column) => column.width).map((column) => [column.key, column.width])));
const editing = ref(null);
let resizeSession;
watch(() => props.modelValue, (value) => { localSelection.value = value; }, { deep: true });
watch(() => props.filterValues, (value) => { localFilters.value = { ...value }; }, { deep: true });
watch(() => props.expandedRows, (value) => { localExpanded.value = [...value]; }, { deep: true });
watch(() => props.sortKey, (value) => { if (value !== undefined) localSortKey.value = value || ""; });
watch(() => props.sortDirection, (value) => { if (value !== undefined) localSortDirection.value = value || ""; });
watch(() => props.columns, (columns) => {
  const next = { ...localWidths.value };
  columns.forEach((column) => { if (next[column.key] === undefined && column.width !== undefined) next[column.key] = column.width; });
  localWidths.value = next;
}, { deep: true });

const tableRows = computed(() => props.items === undefined ? props.rows : props.items);
const visibleColumns = computed(() => props.columns.filter((column) => !column.hidden));
const filteredRows = computed(() => tableRows.value.filter((row) => props.columns.every((column) => {
  const filter = String(localFilters.value[column.key] ?? "").trim().toLowerCase();
  return !filter || String(row[column.key] ?? "").toLowerCase().includes(filter);
})));
const sortControlled = computed(() => props.sortKey !== undefined || props.sortDirection !== undefined);
const activeSortKey = computed(() => sortControlled.value ? props.sortKey || "" : localSortKey.value);
const validDirection = computed(() => {
  const direction = sortControlled.value ? props.sortDirection : localSortDirection.value;
  return ["asc", "desc"].includes(direction) ? direction : "";
});
const sortedRows = computed(() => {
  const column = props.columns.find((item) => item.key === activeSortKey.value);
  if (!column || !validDirection.value) return filteredRows.value;
  const direction = validDirection.value === "asc" ? 1 : -1;
  return filteredRows.value.map((row, index) => ({ row, index })).sort((a, b) => {
    if (typeof column.sorter === "function") return column.sorter(a.row, b.row) * direction;
    const left = a.row[column.key];
    const right = b.row[column.key];
    if (left === right) return a.index - b.index;
    if (left === null || left === undefined) return 1;
    if (right === null || right === undefined) return -1;
    if (typeof left === "number" && typeof right === "number") return (left - right) * direction;
    return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" }) * direction;
  }).map(({ row }) => row);
});
const selectedKeys = computed(() => new Set(localSelection.value));
const visibleKeys = computed(() => sortedRows.value.map(getRowKey));
const expandedKeys = computed(() => new Set(localExpanded.value));
const allSelected = computed(() => visibleKeys.value.length > 0 && visibleKeys.value.every((key) => selectedKeys.value.has(key)));
const someSelected = computed(() => visibleKeys.value.some((key) => selectedKeys.value.has(key)));
useContentMotion(scroll, () => [props.loading, sortedRows.value, [...expandedKeys.value]], { opacity: false });
const selectionState = computed(() => allSelected.value ? "true" : someSelected.value ? "mixed" : "false");
const selectionLabel = computed(() => allSelected.value ? "取消选择全部行" : "选择全部行");
const hasFilters = computed(() => props.columns.some((column) => column.filterable));
const hasSummary = computed(() => props.summary || props.columns.some((column) => typeof column.summary === "function"));
const columnCount = computed(() => Math.max(1, visibleColumns.value.length + (props.selectable ? 1 : 0) + (props.expandable ? 1 : 0)));

// --- 找到行的身份：排序后继续跟随同一条数据 ---
function getRowKey(row, index) {
  if (typeof props.rowKey === "function") return props.rowKey(row);
  if (typeof props.rowKey === "string") return row[props.rowKey];
  return row.id ?? row.key ?? `row-${index}`;
}

// --- 选择一行：只提交新数组，不改动外部 modelValue ---
function toggleRow(row, index) {
  const key = getRowKey(row, index);
  const nextKeys = new Set(selectedKeys.value);
  if (nextKeys.has(key)) nextKeys.delete(key);
  else nextKeys.add(key);
  localSelection.value = [...nextKeys];
  emit("update:modelValue", localSelection.value);
}

// --- 全选当前数据：保留筛选或分页后暂时不可见的选择 ---
function toggleAll() {
  const nextKeys = new Set(selectedKeys.value);
  for (const key of visibleKeys.value) {
    if (allSelected.value) nextKeys.delete(key);
    else nextKeys.add(key);
  }
  localSelection.value = [...nextKeys];
  emit("update:modelValue", localSelection.value);
}

// --- 激活一行：单元格里的按钮、链接和输入框保留自己的行为 ---
function handleRowClick(row, event) {
  const control = event.target.closest?.("button, a, input, select, textarea, label, summary, [contenteditable]:not([contenteditable='false']), [role='button'], [role='checkbox'], [tabindex]");
  if (control && control !== event.currentTarget) return;
  emit("row-click", row, event);
}

function changeFilter(column, event) {
  const value = event.target.value;
  localFilters.value = { ...localFilters.value, [column.key]: value };
  emit("update:filterValues", localFilters.value);
  emit("filter-change", { ...localFilters.value, key: column.key, value });
}

function toggleExpanded(row, index) {
  const key = getRowKey(row, index);
  const next = new Set(localExpanded.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  localExpanded.value = [...next];
  emit("update:expandedRows", localExpanded.value);
  emit("expand", { row, key, expanded: next.has(key) });
}

function beginEdit(row, index, column) {
  if (!props.editable || !column.editable) return;
  editing.value = { rowKey: getRowKey(row, index), columnKey: column.key, value: row[column.key] ?? "", oldValue: row[column.key] };
}
function commitEdit(row, index, column) {
  if (!editing.value) return;
  const edit = editing.value;
  editing.value = null;
  emit("cell-edit", { row, rowKey: getRowKey(row, index), column, key: column.key, value: edit.value, oldValue: edit.oldValue });
}
function cancelEdit() { editing.value = null; }
function isEditing(row, index, column) { return editing.value?.rowKey === getRowKey(row, index) && editing.value?.columnKey === column.key; }

// --- 键盘操作：只处理行自身的按键，不拦截内部控件 ---
function handleRowKeydown(row, index, event) {
  if (event.target !== event.currentTarget || event.repeat) return;
  if (!["Enter", " ", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  if (event.key === "Enter" || (event.key === " " && !props.selectable)) {
    emit("row-click", row, event);
    return;
  }
  if (event.key === " ") {
    toggleRow(row, index);
    return;
  }
  const rows = event.currentTarget.parentElement.rows;
  let nextIndex = index + (event.key === "ArrowUp" ? -1 : 1);
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = rows.length - 1;
  rows[Math.max(0, Math.min(rows.length - 1, nextIndex))].focus();
}

function isSortable(column) { return props.sortable && column.sortable !== false || column.sortable === true; }
function isResizable(column) { return props.resizable && column.resizable !== false || column.resizable === true; }
function columnWidth(column) {
  const width = localWidths.value[column.key] ?? column.width;
  return width ? (typeof width === "number" ? `${width}px` : width) : undefined;
}
function changeSort(column) {
  if (!isSortable(column)) return;
  const direction = activeSortKey.value !== column.key || validDirection.value !== "asc" ? "asc" : "desc";
  if (!sortControlled.value) {
    localSortKey.value = column.key;
    localSortDirection.value = direction;
  }
  emit("sort-change", { key: column.key, direction });
}

// --- 说明下一次排序动作，同时保留列名 ---
function sortLabel(column) {
  const descending = activeSortKey.value === column.key && validDirection.value === "asc";
  return `${column.label}：按${descending ? '降' : '升'}序排列`;
}
function setColumnWidth(column, width) {
  const minimum = Number(column.minWidth) || 72;
  const maximum = Number(column.maxWidth) || 1200;
  const next = Math.max(minimum, Math.min(maximum, Math.round(width)));
  localWidths.value = { ...localWidths.value, [column.key]: next };
  emit("column-resize", { key: column.key, width: next });
}
function startResize(column, event) {
  if (!isResizable(column) || event.button !== 0) return;
  event.preventDefault();
  resizeSession = { column, startX: event.clientX, startWidth: Number(localWidths.value[column.key] ?? column.width) || event.currentTarget.parentElement.offsetWidth };
  document.addEventListener("pointermove", moveResize);
  document.addEventListener("pointerup", stopResize, { once: true });
}
function moveResize(event) {
  if (!resizeSession) return;
  setColumnWidth(resizeSession.column, resizeSession.startWidth + event.clientX - resizeSession.startX);
}
function stopResize() {
  resizeSession = null;
  document.removeEventListener("pointermove", moveResize);
}
function resizeKeydown(column, event) {
  if (!isResizable(column) || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  const current = Number(localWidths.value[column.key] ?? column.width) || 160;
  const minimum = Number(column.minWidth) || 72;
  const maximum = Number(column.maxWidth) || 1200;
  const width = event.key === "Home" ? minimum : event.key === "End" ? maximum : current + (event.key === "ArrowRight" ? 8 : -8);
  setColumnWidth(column, width);
}
onBeforeUnmount(stopResize);
</script>

<template>
  <div class="kima-table" :class="{ 'kima-table--striped': striped, 'kima-table--hoverable': hoverable }">
    <div ref="scroll" class="kima-table__scroll" tabindex="0" role="region" :aria-label="caption || attrs['aria-label'] || '表格区域'">
      <table v-bind="forwardedAttrs" :aria-busy="loading">
        <caption v-if="caption">{{ caption }}</caption>
        <thead>
          <tr>
            <th v-if="expandable" scope="col" class="kima-table__expand-column">展开</th>
            <th v-if="selectable" scope="col" class="kima-table__select-column">
              <button
                type="button"
                role="checkbox"
                class="kima-table__select-button"
                :aria-checked="selectionState"
                :aria-label="selectionLabel"
                :title="selectionLabel"
                :disabled="loading || !tableRows.length"
                @click="toggleAll"
              >
                <KimaIcon :icon="allSelected ? CheckmarkSquare02Icon : someSelected ? MinusSignSquareIcon : SquareIcon" :size="20" aria-hidden="true" />
              </button>
            </th>
            <th
              v-for="column in visibleColumns"
              :key="column.key"
              scope="col"
              :class="`kima-table__align--${column.align || 'start'}`"
              :style="{ width: columnWidth(column), minWidth: column.minWidth ? (typeof column.minWidth === 'number' ? `${column.minWidth}px` : column.minWidth) : undefined }"
              :aria-sort="isSortable(column) ? activeSortKey === column.key && validDirection ? (validDirection === 'asc' ? 'ascending' : 'descending') : 'none' : undefined"
            >
              <button
                v-if="isSortable(column)"
                type="button"
                class="kima-table__sort-button"
                :aria-label="sortLabel(column)"
                :title="sortLabel(column)"
                :disabled="loading"
                @click="changeSort(column)"
              >
                <span>{{ column.label }}</span>
                <KimaIcon :icon="activeSortKey === column.key && validDirection ? (validDirection === 'asc' ? ArrowUp01Icon : ArrowDown01Icon) : ArrowUpDownIcon" :size="16" aria-hidden="true" />
              </button>
              <span v-else>{{ column.label }}</span>
              <button v-if="isResizable(column)" type="button" class="kima-table__resize" role="separator" :aria-label="`调整${column.label}列宽`" :aria-valuenow="Number(localWidths[column.key] ?? column.width) || undefined" :aria-valuemin="Number(column.minWidth) || 72" :aria-valuemax="Number(column.maxWidth) || 1200" @pointerdown="startResize(column, $event)" @keydown="resizeKeydown(column, $event)" />
            </th>
          </tr>
          <tr v-if="hasFilters" class="kima-table__filter-row">
            <th v-if="expandable" class="kima-table__expand-column" aria-hidden="true" />
            <th v-if="selectable" class="kima-table__select-column" aria-hidden="true" />
            <th v-for="column in visibleColumns" :key="column.key" :class="`kima-table__align--${column.align || 'start'}`">
              <input v-if="column.filterable" class="kima-table__filter" type="search" :value="localFilters[column.key] || ''" :aria-label="`过滤${column.label}`" :placeholder="column.filterPlaceholder || `过滤${column.label}`" @input="changeFilter(column, $event)" />
            </th>
          </tr>
        </thead>
        <tbody v-if="loading" key="loading">
          <tr><td class="kima-table__message" :colspan="columnCount"><div role="status"><slot name="loading">加载中</slot></div></td></tr>
        </tbody>
        <tbody v-else-if="sortedRows.length" key="rows">
          <template v-for="(row, index) in sortedRows" :key="getRowKey(row, index)">
            <tr
              :class="{ 'kima-table__row--selected': selectable && selectedKeys.has(getRowKey(row, index)) }"
              tabindex="0"
              @click="handleRowClick(row, $event)"
              @keydown="handleRowKeydown(row, index, $event)"
            >
              <td v-if="expandable" class="kima-table__expand-column">
                <button type="button" class="kima-table__expand-button" :aria-expanded="expandedKeys.has(getRowKey(row, index))" :aria-label="`${expandedKeys.has(getRowKey(row, index)) ? '收起' : '展开'}第 ${index + 1} 行`" @click.stop="toggleExpanded(row, index)">
                  <KimaIcon :icon="ArrowRight01Icon" :size="18" aria-hidden="true" />
                </button>
              </td>
              <td v-if="selectable" class="kima-table__select-column">
                <button
                  type="button"
                  class="kima-table__select-button"
                  role="checkbox"
                  :aria-checked="selectedKeys.has(getRowKey(row, index))"
                  :aria-label="`${selectedKeys.has(getRowKey(row, index)) ? '取消选择' : '选择'}第 ${index + 1} 行`"
                  :title="`${selectedKeys.has(getRowKey(row, index)) ? '取消选择' : '选择'}第 ${index + 1} 行`"
                  @click.stop="toggleRow(row, index)"
                >
                  <KimaIcon :icon="selectedKeys.has(getRowKey(row, index)) ? CheckmarkSquare02Icon : SquareIcon" :size="20" aria-hidden="true" />
                </button>
              </td>
              <td v-for="column in visibleColumns" :key="column.key" :class="`kima-table__align--${column.align || 'start'}`" :style="{ width: columnWidth(column), minWidth: column.minWidth ? (typeof column.minWidth === 'number' ? `${column.minWidth}px` : column.minWidth) : undefined }" @dblclick="beginEdit(row, index, column)">
                <input v-if="isEditing(row, index, column)" v-model="editing.value" class="kima-table__edit-input" :aria-label="`编辑${column.label}`" @keydown.enter="commitEdit(row, index, column)" @keydown.esc="cancelEdit" @blur="commitEdit(row, index, column)" />
                <slot v-else :name="`cell-${column.key}`" :row="row" :value="row[column.key]" :column="column">
                  {{ row[column.key] }}
                </slot>
              </td>
            </tr>
            <tr v-if="expandable && expandedKeys.has(getRowKey(row, index))" class="kima-table__expanded-row">
              <td :colspan="columnCount"><slot name="expanded" :row="row" :index="index">{{ row }}</slot></td>
            </tr>
          </template>
        </tbody>
        <tbody v-else key="empty">
          <tr><td class="kima-table__message" :colspan="columnCount"><div role="status"><slot name="empty">暂无数据</slot></div></td></tr>
        </tbody>
        <tfoot v-if="hasSummary" class="kima-table__summary">
          <tr>
            <th v-if="expandable" class="kima-table__expand-column" aria-hidden="true" />
            <th v-if="selectable" class="kima-table__select-column" aria-hidden="true" />
            <th v-for="column in visibleColumns" :key="column.key" :class="`kima-table__align--${column.align || 'start'}`" :style="{ width: columnWidth(column), minWidth: column.minWidth ? (typeof column.minWidth === 'number' ? `${column.minWidth}px` : column.minWidth) : undefined }">
              <slot :name="`summary-${column.key}`" :column="column" :rows="sortedRows">
                {{ typeof column.summary === 'function' ? column.summary(sortedRows, { column, rows: sortedRows }) : '' }}
              </slot>
            </th>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;

.kima-table {
  width: 100%;
  min-width: 0;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-md);
  line-height: 1.5;
  letter-spacing: 0;
}

.kima-table__scroll {
  max-width: 100%;
  /* 只由外层定义轮廓；内部靠轻底色分层，不再用线切割。 */
  border-radius: var(--kima-radius-m);
  background: var(--kima-color-layer-1);
  overflow-x: auto;
  overflow-y: hidden;

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: 2px;
  }
}

table {
  width: 100%;
  min-width: 32rem;
  table-layout: fixed;
  /* separate 而不是 collapsed：行与行之间留一道缝，每行是一块自己的造型，
   * 斑马纹和悬停的底色跟着行的圆角走，而不是一条通到边的色带。
   * collapsed 会忽略单元格圆角，行带就画不出来。 */
  border-collapse: separate;
  border-spacing: 0 var(--kima-space-1);
}

caption {
  padding: var(--kima-space-3) var(--kima-space-4);
  color: var(--kima-color-on-surface);
  text-align: start;
  caption-side: top;
}

th,
td {
  padding: var(--kima-space-3) var(--kima-space-4);
  border: 0;
  overflow-wrap: anywhere;
  text-align: start;
  vertical-align: middle;
}

th {
  color: var(--kima-color-on-surface-variant);
  background: var(--kima-color-layer-1);
  font-size: var(--kima-font-size-sm);
  font-weight: var(--kima-font-weight-bold);
}

tbody tr {
  transition: background-color var(--kima-duration-effects) var(--kima-curve-standard), color var(--kima-duration-effects) var(--kima-curve-standard);

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: -2px;
  }
}

/* 行带是块造型，所以它要收角：首尾单元格把角圆掉，中间的保持直角。
 * 每一行都写（不只斑马纹行），悬停未填充行时形状才一致。 */
tbody td:first-child,
tbody th:first-child {
  border-radius: var(--kima-radius-s) 0 0 var(--kima-radius-s);
}

tbody td:last-child,
tbody th:last-child {
  border-radius: 0 var(--kima-radius-s) var(--kima-radius-s) 0;
}

.kima-table--striped tbody tr:nth-child(even) {
  background: var(--kima-color-layer-1);
}

.kima-table--hoverable tbody tr:hover {
  background: var(--kima-color-layer-3);
}

.kima-table tbody tr.kima-table__row--selected {
  color: var(--kima-color-on-primary-container);
  background: var(--kima-color-primary-container);
}

.kima-table__sort-button,
.kima-table__select-button,
.kima-table__resize {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: var(--kima-radius-sm);
  color: inherit;
  background: var(--kima-color-transparent);
  font: inherit;
  letter-spacing: 0;
  cursor: pointer;
  /* 悬停是"亮起来"的反馈，要看得见过程。 */
  transition: color var(--kima-duration-effects) var(--kima-curve-standard);

  &:hover:not(:disabled) {
    color: var(--kima-color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--kima-color-primary);
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: var(--kima-opacity-disabled);
  }
}

.kima-table__expand-column {
 width: 48px;
 padding-inline: var(--kima-space-1);
 text-align: center;
}

.kima-table__expand-button {
 display: inline-grid;
 width: 40px;
 height: 40px;
 place-items: center;
 padding: 0;
 border: 0;
 border-radius: var(--kima-radius-full);
 color: inherit;
 background: var(--kima-color-transparent);
 cursor: pointer;
 transition: background-color var(--kima-duration-effects) var(--kima-curve-standard), transform var(--kima-duration-fast) var(--kima-curve-standard);

 &:hover { background: var(--kima-color-layer-3); }
 &:focus-visible { outline: 2px solid var(--kima-color-primary); outline-offset: 2px; }
 &[aria-expanded="true"] :deep(svg) { transform: rotate(90deg); }
 :deep(svg) { transition: transform var(--kima-duration-fast) var(--kima-curve-standard); }
}

.kima-table__filter-row th { padding-block: var(--kima-space-2); }
.kima-table__filter {
 box-sizing: border-box;
 width: 100%;
 min-height: 40px;
 padding: var(--kima-space-2) var(--kima-space-3);
 border: 0;
 border-radius: var(--kima-radius-s);
 color: var(--kima-color-on-surface);
 background: var(--kima-color-layer-2);
 font: inherit;
 @include kima-focus-ring;
}
.kima-table__edit-input { box-sizing: border-box; width: 100%; min-height: 40px; padding: var(--kima-space-2); border: 0; border-radius: var(--kima-radius-s); color: inherit; background: var(--kima-color-layer-2); font: inherit; @include kima-focus-ring; }
.kima-table__expanded-row td { color: var(--kima-color-on-surface-variant); background: var(--kima-color-layer-1); }

.kima-table__resize {
  width: 8px;
  min-width: 8px;
  height: 36px;
  margin-inline-start: auto;
  border: 0;
  border-radius: var(--kima-radius-full);
  background: var(--kima-color-transparent);
  cursor: col-resize;
  touch-action: none;
  transition: background-color var(--kima-duration-effects) var(--kima-curve-standard);
  &:hover, &:focus-visible { background: var(--kima-color-primary); outline: 0; }
}

.kima-table__sort-button {
  max-width: 100%;
  gap: var(--kima-space-2);
  text-align: inherit;

  :deep(svg) {
    flex: 0 0 16px;
  }
}

.kima-table__select-column {
  width: 40px;
  padding: var(--kima-space-1) var(--kima-space-2);
  text-align: center;
}

.kima-table__select-button {
  width: 40px;
  height: 40px;

  &[aria-checked="true"],
  &[aria-checked="mixed"] {
    color: var(--kima-color-primary);
  }
}

.kima-table tbody tr.kima-list-move { transition: transform var(--kima-duration-slow) var(--kima-curve-emphasized), background-color var(--kima-duration-effects) var(--kima-curve-standard), color var(--kima-duration-effects) var(--kima-curve-standard); }
.kima-table tbody tr.kima-list-enter-active,
.kima-table tbody tr.kima-list-leave-active { transition: opacity var(--kima-duration-medium) var(--kima-curve-standard); }
.kima-table tbody tr.kima-list-enter-from,
.kima-table tbody tr.kima-list-leave-to { opacity: 0; }
.kima-table__summary th { color: var(--kima-color-on-surface); background: var(--kima-color-layer-2); font-weight: var(--kima-font-weight-bold); }
.kima-table__message {
  height: 96px;
  color: var(--kima-color-on-surface-variant);
  text-align: center;
}

.kima-table__align--left { text-align: left; }
.kima-table__align--right { text-align: right; }
.kima-table__align--center { text-align: center; }
.kima-table__align--end { text-align: end; }

@media (max-width: 480px) {
  th,
  td {
    padding-inline: var(--kima-space-2);
  }
}

@media (prefers-reduced-motion: reduce) {
  tbody tr, .kima-table__expand-button, .kima-table__expand-button :deep(svg), .kima-table__resize { transition: none; }
}
</style>
