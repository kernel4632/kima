<!-- Synchronous items: strings or {value,label,disabled}. Filtering is local; host owns async fetching/race cancellation.
Select replaces ONLY the collapsed cursor's @query, preserving suffix. Emits select(item,{start,end,text}). -->
<script setup>
import { computed, nextTick, ref, useId, watch } from "vue";
import { useInputAttrs, useInputState } from "../../utils/input-state.js";
import { presenceTransition } from "../../utils/motion.js";
import { useRipple } from "../../utils/ripple.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: { type: String, default: "" }, items: { type: Array, default: () => [] }, trigger: { type: String, default: "@" }, label: { type: String, default: "消息" }, placeholder: String, name: String, disabled: Boolean, readonly: Boolean, required: Boolean, maxlength: Number, rows: { type: Number, default: 4 } });
const emit = defineEmits(["update:modelValue", "change", "select"]);
const root = ref(null), input = ref(null);
const { attrs, controlAttrs } = useInputAttrs();
const cursor = ref(0), selectionEnd = ref(0), composing = ref(false), focused = ref(false), dismissed = ref(false), active = ref(0);
const { local, update } = useInputState(props, emit, root, value => String(value || ""), () => { dismissed.value = true; composing.value = false; });
useRipple(root);
const id = `kima-mention-${useId()}`;
const query = computed(() => {
  if (!focused.value || composing.value || dismissed.value || props.disabled || props.readonly || !props.trigger || cursor.value !== selectionEnd.value) return null;
  const left = local.value.slice(0, cursor.value), start = left.lastIndexOf(props.trigger);
  if (start < 0 || start && !/\s/.test(left[start - 1])) return null;
  const term = left.slice(start + props.trigger.length);
  if (!/^[\p{L}\p{N}_-]*$/u.test(term)) return null;
  return { start, end: cursor.value, term };
});
const suggestions = computed(() => query.value ? props.items.map(item => ({ item, label: String(typeof item === "string" ? item : item.label ?? item.value), value: typeof item === "string" ? item : item.value ?? item.label, disabled: Boolean(item?.disabled) })).filter(item => item.label.toLocaleLowerCase().includes(query.value.term.toLocaleLowerCase())).slice(0, 8) : []);
const open = computed(() => Boolean(query.value));
watch(suggestions, items => { active.value = Math.max(0, items.findIndex(item => !item.disabled)); });
function syncCursor() { cursor.value = input.value?.selectionStart || 0; selectionEnd.value = input.value?.selectionEnd || 0; }
function typed() { if (composing.value) return; dismissed.value = false; update(input.value.value); syncCursor(); }
function compositionEnd() { composing.value = false; typed(); }
async function choose(option) {
  const range = query.value;
  if (!range || !option || option.disabled) return;
  const insertion = `${props.trigger}${option.label} `;
  const value = local.value.slice(0, range.start) + insertion + local.value.slice(range.end);
  if (props.maxlength && value.length > props.maxlength) return;
  update(value);
  emit("select", option.item, { start: range.start, end: range.end, text: insertion });
  dismissed.value = true;
  await nextTick();
  if (!input.value || props.disabled) return;
  input.value.focus();
  input.value.setSelectionRange(range.start + insertion.length, range.start + insertion.length);
  syncCursor();
}
function keydown(event) {
  if (event.isComposing || composing.value || event.keyCode === 229) { if(event.key === 'Enter') event.preventDefault(); return; }
  syncCursor();
  if (!open.value) return;
  if (event.key === "Escape") { event.preventDefault(); dismissed.value = true; return; }
  if (["ArrowDown", "ArrowUp"].includes(event.key)) {
    event.preventDefault();
    const items = suggestions.value;
    for (let count = 1; count <= items.length; count += 1) { const index = (active.value + (event.key === "ArrowDown" ? count : -count) + items.length * 2) % items.length; if (!items[index].disabled) { active.value = index; break; } }
    return;
  }
  if (event.key === "Enter" && suggestions.value.some(item => !item.disabled)) { event.preventDefault(); choose(suggestions.value[active.value]); }
  // Tab retains normal focus movement; it never silently changes text.
}
defineExpose({ focus: () => input.value?.focus() });
</script>
<template>
  <div ref="root" :class="['kima-mention',attrs.class]" :style="attrs.style">
    <textarea ref="input" v-bind="controlAttrs" class="kima-mention__input" :value="local" :name="name" :aria-label="controlAttrs['aria-label'] || label" :placeholder="placeholder" :disabled="disabled" :readonly="readonly" :required="required" :maxlength="maxlength" :rows="rows" aria-autocomplete="list" :aria-controls="open ? id : undefined" :aria-activedescendant="open && suggestions[active] ? `${id}-${active}` : undefined" @input.stop="typed" @change.stop @keydown="keydown" @keyup="syncCursor" @click="dismissed=false;syncCursor()" @select.stop="syncCursor" @focus="focused=true;syncCursor()" @blur="focused=false" @compositionstart="composing=true" @compositionend="compositionEnd"></textarea>
    <Transition name="kima-popup" v-bind="presenceTransition">
      <div v-if="open" class="kima-mention__popup">
        <ul :id="id" class="kima-mention__list" role="listbox" aria-label="提及建议"><li v-for="(option,index) in suggestions" :id="`${id}-${index}`" :key="index" class="kima-mention__option" role="option" :aria-selected="index===active" :aria-disabled="option.disabled || undefined" @pointerdown.prevent="choose(option)">{{ option.label }}</li></ul>
        <p v-if="!suggestions.length" role="status">无匹配候选</p>
      </div>
    </Transition>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/advanced-input" as *;
@use "../../styles/mixins" as *;
.kima-mention { @include advanced-root; position:relative; max-width:640px;
  &__input { @include advanced-field; display:block; min-height:120px; resize:vertical; }
  &__popup { @include kima-popup; position:absolute; z-index:20; inset-inline:0; top:calc(100% + var(--kima-space-1)); padding:var(--kima-space-2); border-radius:var(--kima-radius-m); }
  &__list { list-style:none; padding:0; margin:0; max-height:280px; overflow:auto; }
  &__option { @include kima-motion-colors; padding:var(--kima-space-3); border-radius:var(--kima-radius-s); cursor:pointer; &:hover {background:var(--kima-color-layer-3);} &[aria-selected="true"]{background:var(--kima-color-primary-container);color:var(--kima-color-on-primary-container); &:hover{background:var(--kima-color-primary-container-hover);}} &[aria-disabled="true"]{opacity:var(--kima-opacity-disabled);cursor:not-allowed;} }
  p {margin:var(--kima-space-2);color:var(--kima-color-on-surface-variant);}
}
</style>
