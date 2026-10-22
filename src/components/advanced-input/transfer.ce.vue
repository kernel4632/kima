<!-- modelValue is the target collection; options use unique string values. Selection for moving is separate.
Native multiple selects own Shift/Ctrl/Meta/arrow keyboard behavior. Searches affect only the visible subset.
Selected hidden inputs submit repeated name values, independent of temporary search/selection. No virtualization. -->
<script setup>
import { computed, ref, watchEffect } from "vue";
import KimaButton from "../core/button.ce.vue";
import { useInputState } from "../../utils/input-state.js";
import { useRipple } from "../../utils/ripple.js";
const props = defineProps({ modelValue: { type: Array, default: () => [] }, options: { type: Array, default: () => [] }, name: String, label: { type: String, default: "穿梭选择" }, disabled: Boolean, required: Boolean, searchable: { type: Boolean, default: true }, availableTitle: { type: String, default: "可用项" }, selectedTitle: { type: String, default: "已选项" } });
const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null), left = ref(null);
const leftChosen = ref([]), rightChosen = ref([]), leftQuery = ref(""), rightQuery = ref("");
const { local, update } = useInputState(props, emit, root, value => Array.isArray(value) ? [...new Set(value.map(String))] : [], () => { leftChosen.value=[];rightChosen.value=[];leftQuery.value="";rightQuery.value=""; });
useRipple(root);
const options = computed(() => { const seen=new Set(); return props.options.filter(item => {const value=String(item.value);if(seen.has(value))return false;seen.add(value);return true;}).map(item=>({...item,value:String(item.value),label:String(item.label??item.value)})); });
const available = computed(() => options.value.filter(item=>!local.value.includes(item.value)));
const selected = computed(() => local.value.map(value=>options.value.find(item=>item.value===value) || {value,label:value,disabled:true}));
const filteredLeft = computed(() => available.value.filter(item=>item.label.toLocaleLowerCase().includes(leftQuery.value.toLocaleLowerCase())));
const filteredRight = computed(() => selected.value.filter(item=>item.label.toLocaleLowerCase().includes(rightQuery.value.toLocaleLowerCase())));
watchEffect(() => { left.value?.setCustomValidity(props.required && !local.value.length ? "请至少移入一项" : ""); },{flush:"post"});
const movableLeft = computed(() => filteredLeft.value.filter(item=>leftChosen.value.includes(item.value)&&!item.disabled));
const movableRight = computed(() => filteredRight.value.filter(item=>rightChosen.value.includes(item.value)&&!item.disabled));
function moveRight() { if(props.disabled)return;update([...local.value,...movableLeft.value.map(item=>item.value)]);leftChosen.value=[]; }
function moveLeft() { if(props.disabled)return;const remove=new Set(movableRight.value.map(item=>item.value));update(local.value.filter(value=>!remove.has(value)));rightChosen.value=[]; }
function selectAll(side) { const source=side==='left'?filteredLeft.value:filteredRight.value;const value=source.filter(item=>!item.disabled).map(item=>item.value);if(side==='left')leftChosen.value=value;else rightChosen.value=value; }
</script>
<template>
  <div ref="root" class="kima-transfer" role="group" :aria-label="label" :aria-disabled="disabled || undefined">
    <section class="kima-transfer__panel" :aria-label="availableTitle"><header><strong>{{ availableTitle }}</strong><span>{{ available.length }}</span></header>
      <input v-if="searchable" v-model="leftQuery" class="kima-transfer__search" type="search" :aria-label="`搜索${availableTitle}`" :disabled="disabled" placeholder="搜索">
      <select ref="left" v-model="leftChosen" class="kima-transfer__list" multiple size="6" :aria-label="availableTitle" :disabled="disabled"><option v-for="item in filteredLeft" :key="item.value" :value="item.value" :disabled="item.disabled">{{ item.label }}</option></select>
      <span v-if="!filteredLeft.length" role="status">无可用项</span>
      <KimaButton variant="text" :disabled="disabled || !filteredLeft.some(item=>!item.disabled)" @click="selectAll('left')">全选可用项</KimaButton>
      <KimaButton :disabled="disabled || !movableLeft.length" @click="moveRight">移入选中项 →</KimaButton>
    </section>
    <section class="kima-transfer__panel" :aria-label="selectedTitle"><header><strong>{{ selectedTitle }}</strong><span>{{ local.length }}</span></header>
      <input v-if="searchable" v-model="rightQuery" class="kima-transfer__search" type="search" :aria-label="`搜索${selectedTitle}`" :disabled="disabled" placeholder="搜索">
      <select v-model="rightChosen" class="kima-transfer__list" multiple size="6" :aria-label="selectedTitle" :disabled="disabled"><option v-for="item in filteredRight" :key="item.value" :value="item.value" :disabled="item.disabled">{{ item.label }}</option></select>
      <span v-if="!filteredRight.length" role="status">无已选项</span>
      <KimaButton variant="text" :disabled="disabled || !filteredRight.some(item=>!item.disabled)" @click="selectAll('right')">全选已选项</KimaButton>
      <KimaButton :disabled="disabled || !movableRight.length" @click="moveLeft">← 移出选中项</KimaButton>
    </section>
    <input v-for="value in local" :key="value" type="hidden" :name="name" :value="value" :disabled="disabled">
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/advanced-input" as *;
@use "../../styles/mixins" as *;
.kima-transfer { @include advanced-root; display:grid; grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--kima-space-4);
  &__panel { @include kima-layer(1); display:grid;gap:var(--kima-space-2);min-width:0;padding:var(--kima-space-3);border-radius:var(--kima-radius-m); }
  header {display:flex;justify-content:space-between;gap:var(--kima-space-2);span{color:var(--kima-color-on-surface-variant);}}
  &__search { @include advanced-field;min-height:var(--kima-touch-target); }
  &__list { @include kima-focus-ring;box-sizing:border-box;width:100%;min-height:240px;padding:var(--kima-space-2);border:0;border-radius:var(--kima-radius-s);background:var(--kima-color-layer-1);color:inherit;font:inherit;option{ @include kima-motion-colors;min-height:40px;padding:var(--kima-space-2);border-radius:var(--kima-radius-s);&:checked{background:var(--kima-color-primary-container);color:var(--kima-color-on-primary-container);} &:disabled{color:var(--kima-color-on-surface-38);} } }
}
@media(max-width:640px){.kima-transfer{grid-template-columns:1fr;}}
</style>
