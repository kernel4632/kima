<!-- 危险确认复用 dialog。异步 confirmHandler 失败保留弹层；关闭/卸载使旧 Promise 失效。 -->
<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import KimaDialog from '../core/dialog.ce.vue';
import KimaButton from '../core/button.ce.vue';
import { useInteractionRoot, useInteractionModel } from '../../utils/interaction.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ open: Boolean, heading: { type: String, default: '确认操作' }, description: { type: String, default: '' }, confirmLabel: { type: String, default: '确认' }, cancelLabel: { type: String, default: '取消' }, danger: { type: Boolean, default: true }, confirmHandler: Function });
const emit = defineEmits(['update:open', 'confirm', 'cancel', 'error']);
const { root, forwardedAttrs } = useInteractionRoot();
const [visible, update] = useInteractionModel(props, 'open', emit);
const busy = ref(false), error = ref('');
let generation = 0;
function cancel() { if (busy.value) return; generation++; update(false); emit('cancel'); }
async function confirm() {
  if (busy.value || !visible.value) return;
  busy.value = true; error.value = ''; const epoch = ++generation;
  try { const result = await props.confirmHandler?.(); if (epoch !== generation || !visible.value) return; if (result === false) { error.value = '操作未完成，请重试'; return; } emit('confirm'); update(false); }
  catch (reason) { if (epoch === generation) { error.value = reason?.message || String(reason); emit('error', reason); } }
  finally { if (epoch === generation) busy.value = false; }
}
watch(visible, async value => { generation++; busy.value = false; error.value = ''; if (value) { await nextTick(); root.value?.querySelector('.kima-alert-dialog__cancel')?.focus(); } }, { flush: 'post' });
onBeforeUnmount(() => {
  generation++;
  // 原生 close 是排队事件。子 dialog 销毁时引用会先清空，阻止拆卸期间的迟到 close
  // 再进入它的应用事件处理器；用户关闭路径仍由 dialog 正常处理。
  const nativeDialog = root.value?.querySelector('dialog');
  if (nativeDialog?.open) nativeDialog.addEventListener('close', event => event.stopImmediatePropagation(), { once: true, capture: true });
});
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-alert-dialog" @click.capture="event => { if (busy && event.target.closest('.kima-dialog__close')) { event.preventDefault(); event.stopPropagation(); } }"><KimaDialog :open="visible" role="alertdialog" :aria-label="heading" :aria-busy="busy" :description="description" :close-on-backdrop="false" :close-on-escape="!busy" @update:open="value => { if (!value) cancel(); }"><template #header><h2>{{ heading }}</h2></template><slot/><p v-if="error" role="alert">{{ error }}</p><template #footer><KimaButton class="kima-alert-dialog__cancel" variant="tonal" autofocus :disabled="busy" @click="cancel">{{ cancelLabel }}</KimaButton><KimaButton :class="{ 'kima-alert-dialog__danger': danger }" :loading="busy" @click="confirm">{{ confirmLabel }}</KimaButton></template></KimaDialog></div></template>
<style scoped lang="scss">.kima-alert-dialog { color: var(--kima-color-on-surface); font-family: var(--kima-font-family); h2 { margin: 0; font-size: var(--kima-font-size-xl); } [role='alert'] { color: var(--kima-color-error); } &__danger { background: var(--kima-color-error); color: var(--kima-color-on-error); } }</style>
