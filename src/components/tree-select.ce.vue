<!-- 树选择：真实层级树弹层，复用 KimaTree 的展开、选择和键盘；name/required/reset 由原生 select 承担。
items 为 { value, label, disabled, children }，value 全树唯一 primitive；multiple 时逐节点多选（不隐式级联），单选后关闭。
调用示例：<kima-tree-select v-model="folder" label="目标目录" name="folder" :items="folders" clearable />
-->
<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { presenceTransition } from "../utils/motion.js";
import { PopoverRoot, PopoverTrigger, PopoverContent } from "reka-ui";
import KimaTree from "./tree.ce.vue";
import KimaButton from "./button.ce.vue";
import KimaIconButton from "./icon-button.ce.vue";
import KimaIcon from "./icon.ce.vue";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useInteractionRoot, useInteractionModel, usePlacement, useInteractionReset, flattenChoices, dismissInteraction } from "../utils/interaction.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: { type: [String, Number, Boolean, Array], default: null }, open: Boolean, expanded: { type: Array, default: () => [] }, items: { type: Array, default: () => [] }, multiple: Boolean, clearable: Boolean, disabled: Boolean, name: String, required: Boolean, label: { type: String, default: "树选择" }, placeholder: { type: String, default: "请选择节点" }, placement: { type: String, default: "bottom-start" } });
const emit = defineEmits(["update:modelValue", "update:open", "update:expanded", "change"]);
const { root, attrs, forwardedAttrs } = useInteractionRoot();
const [local, update] = useInteractionModel(props, "modelValue", emit);
const [localOpen, updateOpen] = useInteractionModel(props, "open", emit);
const [expanded, updateExpanded] = useInteractionModel(props, "expanded", emit);
const position = usePlacement(props);
const panel = ref(null);
const choices = computed(() => flattenChoices(props.items));
const values = computed(() => props.multiple ? (Array.isArray(local.value) ? local.value : []) : local.value == null ? [] : [local.value]);
const selected = computed(() => choices.value.filter((item) => values.value.includes(item.value)));
function setOpen(value) { if (value && props.disabled) return; updateOpen(value); }
function change(value) { if (props.disabled) return; update(value); emit("change", value); if (!props.multiple) setOpen(false); }
function clear() { change(props.multiple ? [] : null); nextTick(() => { if (!localOpen.value) root.value?.querySelector('button')?.focus(); }); }
function focusTree(event) { event.preventDefault(); nextTick(() => { const element = panel.value?.$el || panel.value; element?.querySelector('[role="treeitem"][tabindex="0"]')?.focus(); }); }
const nativeValue = computed({
  get: () => props.multiple ? values.value.map(String) : (values.value.length ? String(values.value[0]) : ""),
  set: (value) => { const entries = (Array.isArray(value) ? value : [value]).map((entry) => choices.value.find((item) => String(item.value) === entry)?.value).filter((entry) => entry !== undefined); change(props.multiple ? entries : (entries[0] ?? null)); },
});
useInteractionReset(root, local, update, () => setOpen(false));
watch(() => props.disabled, (value) => { if (value) setOpen(false); });
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-tree-select"><div class="kima-tree-select__control"><PopoverRoot :open="localOpen && !disabled" :modal="false" @update:open="setOpen"><PopoverTrigger as-child><KimaButton variant="tonal" :disabled="disabled" :aria-label="attrs['aria-label'] || label" :aria-required="required || undefined" @keydown.down.prevent="setOpen(true)">{{ selected.length ? selected.map((item) => item.label).join('、') : placeholder }}</KimaButton></PopoverTrigger><Transition name="kima-popup" v-bind="presenceTransition"><PopoverContent v-if="localOpen && !disabled" force-mount v-bind="position" class="kima-tree-select__popup" :inert="!localOpen || disabled" :aria-hidden="!localOpen || disabled || undefined" :aria-label="label" @open-auto-focus="focusTree" @escape-key-down="(event) => dismissInteraction(event, () => setOpen(false))"><KimaTree ref="panel" :items="items" :model-value="local" :expanded="expanded" :multiple="multiple" selectable :aria-label="label" @update:model-value="change" @update:expanded="updateExpanded" /></PopoverContent></Transition></PopoverRoot><Transition name="kima-fade" v-bind="presenceTransition"><KimaIconButton v-if="clearable && selected.length" label="清除选择" :disabled="disabled" @click="clear"><KimaIcon :icon="Cancel01Icon" :size="20" /></KimaIconButton></Transition></div>
    <select v-model="nativeValue" class="kima-tree-select__native" :multiple="multiple" :name="name" :required="required" :disabled="disabled" tabindex="-1" aria-hidden="true" @input.stop @change.stop @invalid.prevent="root?.querySelector('button')?.focus()"><option v-if="!multiple" value=""></option><option v-for="(item, index) in choices" :key="item.value" :value="String(item.value)" :data-index="index" :disabled="item.disabled">{{ item.label }}</option></select>
  </div>
</template>
<style scoped lang="scss">
@use "../styles/interaction" as *;
.kima-tree-select { @include interaction-root; position: relative; &__control { display: flex; align-items: center; flex-wrap: wrap; gap: var(--kima-space-2); } :deep(.kima-tree-select__popup) { @include interaction-popup; padding: var(--kima-space-2); } &__native { @include interaction-native; } :deep(.kima-button__label) { white-space: normal; overflow-wrap: anywhere; } }
</style>
