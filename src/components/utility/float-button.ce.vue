<!-- 展开动作组；外点不抢焦点，Escape 和执行动作恢复触发器。 -->
<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue';
import KimaButton from '../core/button.ce.vue';
import KimaIcon from '../core/icon.ce.vue';
import { Add01Icon } from '@hugeicons/core-free-icons';
import { useInteractionRoot, useInteractionModel } from '../../utils/interaction.js';
import { presenceTransition } from '../../utils/motion.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ open: Boolean, disabled: Boolean, label: { type: String, default: '快捷操作' }, actions: { type: Array, default: () => [] } });
const emit = defineEmits(['update:open', 'action']);
const { root, forwardedAttrs } = useInteractionRoot();
const [expanded, update] = useInteractionModel(props, 'open', emit);
const panelId = `kima-float-${useId()}`;
const panel = ref(null);
function trigger() { return root.value?.querySelector('.kima-float-button__trigger'); }
function close(restore = false) { update(false); if (restore) trigger()?.focus(); }
async function toggle() { if (props.disabled) return; update(!expanded.value); if (expanded.value) { await nextTick(); panel.value?.querySelector('button:not(:disabled)')?.focus(); } }
function keydown(event) {
  if (event.key === 'Escape' && expanded.value) { event.preventDefault(); event.stopPropagation(); close(true); }
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || !expanded.value) return;
  const buttons = [...(panel.value?.querySelectorAll('button:not(:disabled)') || [])];
  if (!buttons.length) return;
  event.preventDefault(); const index = buttons.indexOf(document.activeElement);
  buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowUp' ? -1 : 1) + buttons.length) % buttons.length]?.focus();
}
function outside(event) { if (!root.value?.contains(event.target)) close(); }
function action(item) { if (item.disabled) return; emit('action', item); close(true); }
let doc;
onMounted(() => { doc = root.value.ownerDocument; doc.addEventListener('pointerdown', outside); });
onBeforeUnmount(() => doc?.removeEventListener('pointerdown', outside));
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-float-button" @keydown="keydown"><Transition name="kima-popup" v-bind="presenceTransition"><div v-if="expanded && !disabled" :id="panelId" ref="panel" class="kima-float-button__actions" role="group" :aria-label="label"><KimaButton v-for="item in actions" :key="item.id ?? item.label" variant="tonal" :disabled="item.disabled" @click="action(item)">{{ item.label }}</KimaButton></div></Transition><KimaButton class="kima-float-button__trigger" :aria-label="label" :aria-expanded="expanded && !disabled" :aria-controls="expanded ? panelId : undefined" :disabled="disabled" @click="toggle"><KimaIcon :icon="Add01Icon" :size="24"/><slot>{{ label }}</slot></KimaButton></div></template>
<style scoped lang="scss">@use '../../styles/mixins' as *; .kima-float-button { position: relative; display: inline-flex; flex-direction: column; align-items: flex-end; gap: var(--kima-space-3); &__actions { @include kima-popup; display: grid; gap: var(--kima-space-2); padding: var(--kima-space-3); border-radius: var(--kima-radius-l); } &__trigger { min-height: 56px; } }</style>
