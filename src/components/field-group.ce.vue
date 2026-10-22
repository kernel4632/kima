<!-- 字段分组：可见 legend 是分组标题，不是输入框标签；hint/error 关联组内所有真实控件，required/valid 只做聚合，不冒充 schema 校验。调用示例：<kima-field-group legend="通知方式" hint="至少选择一种" required><kima-checkbox label="邮件" name="mail" /></kima-field-group> -->
<script setup>
import { onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { useContentMotion } from "../utils/content-motion.js";
import { useNavigationRoot } from '../utils/navigation.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ legend: { type: String, default: '' }, hint: { type: String, default: '' }, error: { type: String, default: '' }, required: Boolean, disabled: Boolean });
const emit = defineEmits(['validity-change']);
const { root, forwardedAttrs } = useNavigationRoot();
const messages = ref(null);
useContentMotion(messages, () => [props.hint, props.error]);
const id = `kima-field-group-${useId()}`;
const hintId = `${id}-hint`, errorId = `${id}-error`, statusId = `${id}-status`;
const validity = ref({ valid: true, errors: [] });
const marked = new Set(), described = new Set();
let observer;
function controls() {
  if (!root.value) return [];
  return [...root.value.querySelectorAll('input:not([type="hidden"]),select,textarea,[role="combobox"],[role="radiogroup"]')].filter((element) => element.closest('.kima-field-group') === root.value && !element.disabled);
}
function hasValue(element) {
  if (['checkbox', 'radio'].includes(element.type)) return element.checked;
  return String(element.value ?? '').trim() !== '';
}
function reconcile() {
  const list = controls();
  const errors = [];
  for (const element of list) {
    if (element.validity && element.validity.valid === false) errors.push({ name: element.name || element.getAttribute('aria-label') || '', message: element.validationMessage || '字段值无效' });
    const ids = (element.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean).filter((value) => value !== hintId && value !== errorId);
    if (props.hint) ids.push(hintId);
    if (props.error) ids.push(errorId);
    const next = ids.join(' ');
    if ((element.getAttribute('aria-describedby') || '') !== next) { if (next) element.setAttribute('aria-describedby', next); else element.removeAttribute('aria-describedby'); }
    if (props.hint || props.error) described.add(element);
    if (props.error && !element.hasAttribute('aria-invalid')) { element.setAttribute('aria-invalid', 'true'); marked.add(element); }
    if (!props.error && marked.has(element)) { element.removeAttribute('aria-invalid'); marked.delete(element); }
  }
  if (props.required && !list.some(hasValue)) errors.push({ name: '', message: '此分组至少需要填写一项' });
  const next = { valid: errors.length === 0, errors };
  if (JSON.stringify(next) !== JSON.stringify(validity.value)) { validity.value = next; emit('validity-change', { ...next, controls: list.length }); }
}
function validate() { reconcile(); return validity.value; }
function reportValidity() {
  const list = controls();
  const target = list.find((element) => element.validity && element.validity.valid === false) || (props.required && !list.some(hasValue) ? list[0] : null);
  target?.reportValidity?.();
  reconcile();
  return validity.value.valid;
}
watch(() => [props.hint, props.error, props.required], reconcile, { flush: 'post' });
onMounted(() => {
  reconcile();
  const view = root.value.ownerDocument.defaultView;
  root.value.addEventListener('input', reconcile, true);
  root.value.addEventListener('change', reconcile, true);
  observer = new view.MutationObserver(reconcile);
  observer.observe(root.value, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-describedby', 'aria-invalid', 'disabled'] });
});
onBeforeUnmount(() => {
  observer?.disconnect();
  root.value?.removeEventListener('input', reconcile, true);
  root.value?.removeEventListener('change', reconcile, true);
  for (const element of described) {
    const ids = (element.getAttribute('aria-describedby') || '').split(/\s+/).filter((value) => value && value !== hintId && value !== errorId);
    if (ids.length) element.setAttribute('aria-describedby', ids.join(' ')); else element.removeAttribute('aria-describedby');
  }
  for (const element of marked) element.removeAttribute('aria-invalid');
});
defineExpose({ validate, reportValidity });
</script>
<template>
  <fieldset ref="root" v-bind="forwardedAttrs" class="kima-field-group" :disabled="disabled" :data-valid="validity.valid" :aria-describedby="[hint ? hintId : '', error ? errorId : ''].filter(Boolean).join(' ') || undefined">
    <legend v-if="legend" class="kima-field-group__legend">{{ legend }}<span v-if="required" class="kima-field-group__required">必填</span></legend>
    <div class="kima-field-group__fields"><slot /></div>
    <div v-show="hint || error" ref="messages" class="kima-field-group__messages">
      <p v-if="hint" :id="hintId" class="kima-field-group__hint">{{ hint }}</p>
      <p v-if="error" :id="errorId" class="kima-field-group__error" role="alert">{{ error }}</p>
    </div>
    <p :id="statusId" class="kima-field-group__status" aria-live="polite">{{ validity.valid ? '分组有效' : `分组有 ${validity.errors.length} 项待处理` }}</p>
  </fieldset>
</template>
<style scoped lang="scss">
.kima-field-group {
  display: grid;
  gap: var(--kima-space-3);
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  &__legend { display: flex; align-items: baseline; gap: var(--kima-space-2); padding: 0; font-size: var(--kima-font-size-title-small); font-weight: var(--kima-font-weight-semi-bold); }
  &__required { color: var(--kima-color-error); font-size: var(--kima-font-size-label-small); font-weight: var(--kima-font-weight-regular); }
  &__fields { display: grid; gap: var(--kima-space-3); min-width: 0; }
  &__messages { display: grid; gap: var(--kima-space-1); }
  &__hint, &__error { margin: 0; font-size: var(--kima-font-size-label-medium); line-height: var(--kima-line-height-normal); }
  &__hint { color: var(--kima-color-on-surface-variant); }
  &__error { color: var(--kima-color-error); }
  &__status { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
}
</style>
