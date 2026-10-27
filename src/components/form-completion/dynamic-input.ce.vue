<script setup>
import { computed, ref } from "vue";
import { useContentMotion } from "../../utils/content-motion.js";
import { freezeLeaveLayout, presenceTransition } from "../../utils/motion.js";
import KimaButton from "../core/button.ce.vue";
import KimaIconButton from "../core/icon-button.ce.vue";
import KimaTooltip from "../core/tooltip.ce.vue";
import { ArrowUp01Icon, ArrowDown01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
const props = defineProps({ modelValue: { type: Array, default: () => [] }, create: { type: Function, default: () => ({}) }, disabled: Boolean, min: { type: Number, default: 0 }, max: { type: Number, default: Infinity }, label: { type: String, default: "字段列表" } });
const emit = defineEmits(["update:modelValue", "change", "add", "remove", "move"]);
let nextId = 0;
const ids = new WeakMap();
function rowId(row) { if (!row || typeof row !== "object") return `row-${++nextId}`; if (!ids.has(row)) ids.set(row, row.id || `row-${++nextId}`); return ids.get(row); }
const rows = ref(props.modelValue.map(row => ({ ...row })));
const disabledAdd = computed(() => props.disabled || rows.value.length >= props.max);
const root = ref(null);
useContentMotion(root, () => rows.value);
function sync(next, event, payload) { rows.value = next; emit("update:modelValue", next.map(row => ({ ...row }))); emit("change", next.map(row => ({ ...row }))); if (event) emit(event, payload); }
function add() { if (disabledAdd.value) return; const row = { ...props.create(), id: `row-${++nextId}` }; sync([...rows.value, row], "add", { row, index: rows.value.length }); }
function remove(index) { if (props.disabled || rows.value.length <= props.min) return; const row = rows.value[index]; sync(rows.value.filter((_, i) => i !== index), "remove", { row, index }); }
function move(index, delta) { const target = index + delta; if (props.disabled || target < 0 || target >= rows.value.length) return; const next = [...rows.value]; [next[index], next[target]] = [next[target], next[index]]; sync(next, "move", { row: next[target], from: index, to: target }); }
function patch(index, value) { const next = [...rows.value]; next[index] = value; sync(next); }
function reset(value) { rows.value = value.map(row => ({ ...row })); }
function validate() { return rows.value.every(row => row && row.valid !== false); }
defineExpose({ add, remove, move, validate, rows });
</script>
<template>
  <div ref="root" class="kima-dynamic-input" role="group" :aria-label="label">
    <TransitionGroup tag="div" name="kima-list" v-bind="{ ...presenceTransition, onBeforeLeave: freezeLeaveLayout }" class="kima-dynamic-input__rows">
      <div v-for="(row,index) in rows" :key="rowId(row)" class="kima-dynamic-input__row">
        <slot :row="row" :index="index" :id="rowId(row)" :update="value=>patch(index,value)"><output>{{ JSON.stringify(row) }}</output></slot>
        <div class="kima-dynamic-input__actions">
          <KimaTooltip text="上移"><KimaIconButton :icon="ArrowUp01Icon" :label="`${label}上移第${index+1}项`" :disabled="disabled || index===0" @click="move(index,-1)" /></KimaTooltip>
          <KimaTooltip text="下移"><KimaIconButton :icon="ArrowDown01Icon" :label="`${label}下移第${index+1}项`" :disabled="disabled || index===rows.length-1" @click="move(index,1)" /></KimaTooltip>
          <KimaTooltip text="移除"><KimaIconButton :icon="Cancel01Icon" :label="`移除第${index+1}项`" :disabled="disabled || rows.length<=min" @click="remove(index)" /></KimaTooltip>
        </div>
      </div>
    </TransitionGroup>
    <KimaButton variant="tonal" :disabled="disabledAdd" @click="add">添加字段</KimaButton>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/advanced-input" as *;
@use "../../styles/input" as *;
.kima-dynamic-input{ @include advanced-root;display:grid;gap:var(--kima-space-3);&__rows{position:relative;display:grid;grid-column:1 / -1;gap:var(--kima-space-3)}&__row{ @include input-surface;display:grid;gap:var(--kima-space-2);padding:var(--kima-space-3);min-width:0}&__actions{display:flex;flex-wrap:wrap;gap:var(--kima-space-1)} }
.kima-dynamic-input__row.kima-list-enter-active,
.kima-dynamic-input__row.kima-list-leave-active { transition: opacity var(--kima-duration-medium) var(--kima-curve-standard), transform var(--kima-duration-medium) var(--kima-curve-emphasized); }
.kima-dynamic-input__row.kima-list-move { transition: transform var(--kima-duration-slow) var(--kima-curve-emphasized); }
</style>
