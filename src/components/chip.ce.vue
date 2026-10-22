<!-- 芯片：静态分类为普通文本；selectable 是独立可切换按钮（aria-pressed），removable 另外提供移除按钮，不嵌套按钮。
选择芯片可用 name/value 参与表单，reset 恢复初始选中；remove 由父层决定是否删除，组件不会悄悄销毁内容。
调用示例：<kima-chip v-model="selected" selectable removable name="topics" value="design" @remove="removeTopic">交互设计</kima-chip>
-->
<script setup>
import { computed } from "vue";
import KimaButton from "./button.ce.vue";
import KimaIconButton from "./icon-button.ce.vue";
import KimaIcon from "./icon.ce.vue";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { useInteractionRoot, useInteractionModel, useInteractionReset } from "../utils/interaction.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: Boolean, selectable: Boolean, removable: Boolean, disabled: Boolean, label: { type: String, default: "芯片" }, removeLabel: { type: String, default: "移除" }, name: String, value: { type: [String, Number], default: "on" } });
const emit = defineEmits(["update:modelValue", "change", "remove"]);
const { root, forwardedAttrs } = useInteractionRoot();
const [selected, update] = useInteractionModel(props, "modelValue", emit);
const selectedClass = computed(() => props.selectable && selected.value);
function toggle() { if (props.disabled) return; update(!selected.value); emit("change", selected.value); }
useInteractionReset(root, selected, update);
</script>
<template>
  <span ref="root" v-bind="forwardedAttrs" class="kima-chip" :class="{ 'kima-chip--selected': selectedClass, 'kima-chip--disabled': disabled, 'kima-chip--interactive': selectable || removable }">
    <KimaButton v-if="selectable" variant="text" class="kima-chip__select" :aria-pressed="selected" :disabled="disabled" @click="toggle"><slot>{{ label }}</slot></KimaButton>
    <span v-else class="kima-chip__text"><slot>{{ label }}</slot></span>
    <Transition name="kima-content"><KimaIconButton v-if="removable" variant="text" :label="`${removeLabel} ${label}`" :disabled="disabled" class="kima-chip__remove" @click="!disabled && emit('remove', value)"><KimaIcon :icon="Cancel01Icon" :size="18" aria-hidden="true" /></KimaIconButton></Transition>
    <input v-if="selectable && selected && name" type="hidden" :name="name" :value="value" :disabled="disabled">
  </span>
</template>
<style scoped lang="scss">
@use "../styles/interaction" as *;
@use "../styles/mixins" as *;
.kima-chip { @include interaction-root; @include kima-layer(2); display: inline-flex; vertical-align: middle; align-items: center; gap: var(--kima-space-1); border-radius: var(--kima-radius-s); min-height: 40px; &--interactive { border-radius: var(--kima-radius-full); } &__text { padding: var(--kima-space-2) var(--kima-space-3); } &__select { min-height: 40px; min-width: 0; color: inherit; } &__remove { width: 36px; height: 36px; min-width: 36px; min-height: 36px; color: inherit; margin-right: var(--kima-space-1); } &--selected { background: var(--kima-color-primary-container); color: var(--kima-color-on-primary-container); } &--disabled { opacity: var(--kima-opacity-disabled); } }
.kima-chip { @include kima-motion-colors; }
// 删除由父层处理；父层列表可套 kima-list，芯片只负责选中与移除入口的过渡。
</style>
