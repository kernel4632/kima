<!-- 多选表单：搜索过滤、可移除已选项、清空、方向键与 Enter 切换，选择后面板保持打开。
items 为唯一 primitive value 的 { value, label, description, disabled }；name 按多个同名值提交，required 至少一个，reset 恢复挂载值。
调用示例：<kima-multi-select v-model="topics" name="topics" required label="关注主题" :items="options" searchable clearable />
-->
<script setup>
import { computed, nextTick, ref, useId, watch } from "vue";
import { presenceTransition } from "../../utils/motion.js";
import { PopoverRoot, PopoverTrigger, PopoverContent } from "reka-ui";
import KimaButton from "../core/button.ce.vue";
import KimaChip from "./chip.ce.vue";
import KimaIconButton from "../core/icon-button.ce.vue";
import KimaIcon from "../core/icon.ce.vue";
import { Cancel01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { useInteractionRoot, useInteractionModel, usePlacement, useChoiceCursor, useInteractionReset, dismissInteraction } from "../../utils/interaction.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: { type: Array, default: () => [] }, open: Boolean, items: { type: Array, default: () => [] }, name: String, required: Boolean, disabled: Boolean, searchable: { type: Boolean, default: true }, clearable: { type: Boolean, default: true }, label: { type: String, default: "多选" }, placeholder: { type: String, default: "请选择多个项目" }, placement: { type: String, default: "bottom-start" } });
const emit = defineEmits(["update:modelValue", "update:open", "change"]);
const { root, attrs, forwardedAttrs } = useInteractionRoot();
const [local, update] = useInteractionModel(props, "modelValue", emit);
const [localOpen, updateOpen] = useInteractionModel(props, "open", emit);
const position = usePlacement(props);
const query = ref("");
const search = ref(null);
const panel = ref(null);
const id = `kima-multi-select-${useId()}`;
const values = computed(() => Array.isArray(local.value) ? local.value : []);
const selected = computed(() => props.items.filter((item) => values.value.includes(item.value)));
const visible = computed(() => props.items.filter((item) => `${item.label} ${item.description || ''}`.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())));
function change(value) { if (props.disabled) return; update(value); emit("change", [...value]); }
function toggle(item) { if (props.disabled || item.disabled) return; change(values.value.includes(item.value) ? values.value.filter((v) => !Object.is(v, item.value)) : [...values.value, item.value]); }
function remove(item) { if (!item.disabled) change(values.value.filter((v) => !Object.is(v, item.value))); }
function clear() { change(props.items.filter((item) => item.disabled && values.value.includes(item.value)).map((item) => item.value)); }
function setOpen(value) { if (value && props.disabled) return; if (value && !localOpen.value) query.value = ""; updateOpen(value); }
const { active, activeId, highlight, keydown: cursorKeydown } = useChoiceCursor(visible, toggle, `${id}-option`);
function keydown(event) {
  if (event.isComposing) return;
  if (event.key === ' ' && !props.searchable) { event.preventDefault(); const item = visible.value[active.value]; if (item) toggle(item); }
  else cursorKeydown(event);
}
function focusPanel(event) { event.preventDefault(); nextTick(() => { if (localOpen.value && !props.disabled) (props.searchable ? search.value : panel.value)?.focus(); }); }
function nativeChange(event) { change([...event.target.selectedOptions].map((option) => props.items[Number(option.dataset.index)].value)); }
useInteractionReset(root, local, update, () => setOpen(false));
watch(() => props.disabled, (value) => { if (value) setOpen(false); });
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-multi-select">
    <TransitionGroup tag="div" name="kima-list" v-bind="presenceTransition" class="kima-multi-select__chips"><span v-for="item in selected" :key="item.value" class="kima-multi-select__chip"><KimaChip removable :label="item.label" :disabled="disabled || item.disabled" :value="item.value" @remove="remove(item)">{{ item.label }}</KimaChip></span></TransitionGroup>
    <div class="kima-multi-select__control"><PopoverRoot :open="localOpen && !disabled" :modal="false" @update:open="setOpen"><PopoverTrigger as-child><KimaButton variant="tonal" :disabled="disabled" :aria-label="attrs['aria-label'] || label" :aria-required="required || undefined" @keydown.down.prevent="setOpen(true)">{{ selected.length ? `已选择 ${selected.length} 项` : placeholder }}</KimaButton></PopoverTrigger><Transition name="kima-popup" v-bind="presenceTransition"><PopoverContent v-if="localOpen && !disabled" force-mount v-bind="position" class="kima-multi-select__popup" :aria-label="label" @open-auto-focus="focusPanel" @escape-key-down="(event) => dismissInteraction(event, () => setOpen(false))"><input v-if="searchable" ref="search" v-model="query" class="kima-multi-select__search" type="search" role="combobox" aria-expanded="true" aria-autocomplete="list" aria-label="搜索选项" :aria-controls="id" :aria-activedescendant="activeId" @keydown="keydown" @input.stop @change.stop><div :id="id" ref="panel" class="kima-multi-select__list" role="listbox" aria-multiselectable="true" :aria-label="label" :tabindex="searchable ? -1 : 0" :aria-activedescendant="searchable ? undefined : activeId" @keydown="keydown"><div v-for="(item, index) in visible" :id="`${id}-option-${index}`" :key="item.value" class="kima-multi-select__item" role="option" :aria-selected="values.includes(item.value)" :aria-disabled="item.disabled || undefined" :data-active="active === index" @pointerdown.prevent @pointermove="!item.disabled && highlight(index)" @click="toggle(item)"><span>{{ item.label }}<small v-if="item.description">{{ item.description }}</small></span><KimaIcon v-if="values.includes(item.value)" :icon="Tick01Icon" :size="20" aria-hidden="true" /></div></div><p v-if="!visible.length" role="status">没有匹配选项</p></PopoverContent></Transition></PopoverRoot><Transition name="kima-content" v-bind="presenceTransition"><span v-if="clearable && selected.length" class="kima-multi-select__clear"><KimaIconButton label="清除选择" :disabled="disabled" @click="clear"><KimaIcon :icon="Cancel01Icon" :size="20" /></KimaIconButton></span></Transition></div>
    <select class="kima-multi-select__native" multiple :name="name" :required="required" :disabled="disabled" tabindex="-1" aria-hidden="true" @input.stop @change.stop="nativeChange" @invalid.prevent="root?.querySelector('button')?.focus()"><option v-for="(item, index) in items" :key="item.value" :value="String(item.value)" :data-index="index" :disabled="item.disabled" :selected="values.includes(item.value)">{{ item.label }}</option></select>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/interaction" as *;
.kima-multi-select { @include interaction-root; position: relative; display: grid; gap: var(--kima-space-3); max-width: 100%; &__control, &__chips { display: flex; align-items: center; flex-wrap: wrap; gap: var(--kima-space-2); } &__chip, &__clear { display: inline-flex; } &__chips:empty { display: none; } &__search { @include interaction-search; } &__list { outline: none; } &__item { @include interaction-row; } &__native { @include interaction-native; } small { display: block; color: var(--kima-color-on-surface-variant); } }
/* 弹层内容由 Reka 渲染，可能被传送到 body：表面规则不能依赖 data-v 祖先。 */
:global(.kima-multi-select__popup) { @include interaction-popup; padding: var(--kima-space-2); }
</style>
