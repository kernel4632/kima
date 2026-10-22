<!-- 内联单/多选列表；roving tabindex，原生 hidden 字段参与表单。 -->
<script setup>
import { useInteractionRoot } from '../../utils/interaction.js';
import { useUtilityChoice } from '../../utils/utility-choice.js';
import { useRipple } from '../../utils/ripple.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: { type: [String, Number, Array], default: null }, options: { type: Array, default: () => [] }, multiple: Boolean, disabled: Boolean, name: String, label: { type: String, default: '选项列表' } });
const emit = defineEmits(['update:modelValue', 'change']);
const { root, forwardedAttrs } = useInteractionRoot();
const { values, filtered, active, id, selected, choose, move } = useUtilityChoice(props, emit, root);
useRipple(root);
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-listbox"><div role="listbox" :aria-label="label" :aria-multiselectable="multiple || undefined" :aria-disabled="disabled" :tabindex="!filtered.some(item => !item.disabled) ? 0 : undefined" @keydown="move($event, true)"><div v-for="(item, index) in filtered" :id="`${id}-${index}`" :key="item.index" class="kima-listbox__option kima-ripple-host" role="option" :tabindex="!disabled && index === active ? 0 : -1" :aria-selected="selected(item)" :aria-disabled="disabled || item.disabled" :data-disabled="disabled || item.disabled || undefined" @focus="active = index" @click="choose(item)">{{ item.label ?? item.value }}</div><p v-if="!filtered.length">暂无选项</p></div><input v-for="(value, index) in values" :key="index" type="hidden" :name="name" :value="value" :disabled="disabled"></div></template>
<style scoped lang="scss">@use '../../styles/interaction' as *; @use '../../styles/mixins' as *; .kima-listbox { @include interaction-root; @include kima-layer(1); width: 100%; padding: var(--kima-space-2); border-radius: var(--kima-radius-m); &__option { @include interaction-row; } }</style>
