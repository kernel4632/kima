import { computed, nextTick, ref, useId, watch } from 'vue';
import { useInteractionModel, useInteractionReset } from './interaction.js';
export function useUtilityChoice(props, emit, root, afterReset) {
  const [value, update] = useInteractionModel(props, 'modelValue', emit);
  const query = ref(''), active = ref(-1);
  const id = `kima-choice-${useId()}`;
  const options = computed(() => props.options.map((item, index) => typeof item === 'object' && item !== null ? { ...item, index } : { value: item, label: String(item), index }));
  const filtered = computed(() => options.value.filter(item => String(item.label ?? item.value).toLocaleLowerCase().includes(query.value.toLocaleLowerCase())));
  const enabled = computed(() => filtered.value.flatMap((item, index) => item.disabled ? [] : [index]));
  const selected = item => props.multiple ? (Array.isArray(value.value) ? value.value : []).includes(item.value) : Object.is(value.value, item.value);
  function choose(item) {
    if (!item || item.disabled || props.disabled) return;
    const values = Array.isArray(value.value) ? value.value : [];
    update(props.multiple ? selected(item) ? values.filter(v => !Object.is(v, item.value)) : [...values, item.value] : item.value);
    emit('change', value.value);
  }
  const values = computed(() => props.multiple ? (Array.isArray(value.value) ? value.value : []) : value.value == null || value.value === '' ? [] : [value.value]);
  function move(event, focus = false) {
    if (props.disabled || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
    const keys = enabled.value;
    if (['Enter', ' '].includes(event.key)) { event.preventDefault(); choose(filtered.value[active.value]); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = keys.indexOf(active.value), step = event.key === 'ArrowUp' ? -1 : 1;
    active.value = event.key === 'Home' ? keys[0] ?? -1 : event.key === 'End' ? keys.at(-1) ?? -1 : keys[current < 0 ? (step > 0 ? 0 : keys.length - 1) : (current + step + keys.length) % keys.length] ?? -1;
    if (focus) nextTick(() => root.value?.querySelector(`[id="${id}-${active.value}"]`)?.focus());
  }
  watch(filtered, () => { const index = filtered.value.findIndex(item => !item.disabled && selected(item)); active.value = index >= 0 ? index : enabled.value[0] ?? -1; }, { immediate: true });
  useInteractionReset(root, value, update, () => { query.value = ''; afterReset?.(); });
  return { value, values, update, query, active, id, options, filtered, enabled, selected, choose, move };
}
