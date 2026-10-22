<!-- Inline edit: click/Enter to edit, Enter (Ctrl/Meta+Enter for multiline) saves, Escape cancels.
Blur keeps the draft open. saveHandler(value) may return a Promise; failure keeps draft and focus.
Save/cancel return focus to display. External value updates do not overwrite an active draft. -->
<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";
import KimaButton from "../core/button.ce.vue";
import { useInputState } from "../../utils/input-state.js";
import { presenceTransition } from "../../utils/motion.js";
import { useRipple } from "../../utils/ripple.js";
const props = defineProps({ modelValue: { type: String, default: "" }, name: String, label: { type: String, default: "编辑内容" }, placeholder: String, multiline: Boolean, disabled: Boolean, readonly: Boolean, required: Boolean, saveHandler: Function });
const emit = defineEmits(["update:modelValue", "change", "save", "cancel", "error", "update:editing"]);
const root = ref(null), display = ref(null), editor = ref(null);
const editing = ref(false), draft = ref(props.modelValue), pending = ref(false), error = ref("");
let generation = 0;
const { local, update } = useInputState(props, emit, root, value => String(value || ""), value => { generation+=1;pending.value=false;editing.value=false;draft.value=value;error.value=""; });
useRipple(root);
watch(() => props.modelValue, value => { if (!editing.value) draft.value = value || ""; });
async function begin() {
  if (props.disabled || props.readonly || pending.value) return;
  draft.value=local.value;error.value="";editing.value=true;emit("update:editing",true);
  await nextTick();if(editing.value){editor.value?.focus();editor.value?.select?.();}
}
async function finishFocus() { await nextTick();if(!editing.value)display.value?.focus(); }
async function save() {
  if(pending.value || props.disabled || props.readonly)return;
  if(!editor.value?.reportValidity())return;
  const task=++generation,value=draft.value;
  pending.value=true;error.value="";
  try {
    if(props.saveHandler)await props.saveHandler(value);
    if(task!==generation)return;
    update(value);emit("save",value);editing.value=false;emit("update:editing",false);finishFocus();
  } catch(cause) {
    if(task!==generation)return;
    error.value=cause?.message||String(cause);emit("error",cause);await nextTick();editor.value?.focus();
  } finally {if(task===generation)pending.value=false;}
}
function cancel() { if(pending.value)return;generation+=1;draft.value=local.value;error.value="";editing.value=false;emit("cancel");emit("update:editing",false);finishFocus(); }
function keydown(event) { if(event.isComposing || event.keyCode===229)return;if(event.key==='Escape'){event.preventDefault();cancel();}else if(event.key==='Enter'&&(!props.multiline||event.ctrlKey||event.metaKey)){event.preventDefault();save();} }
onBeforeUnmount(()=>{generation+=1;});
defineExpose({ edit:begin, save, cancel, focus:()=>display.value?.focus() });
</script>
<template>
  <div ref="root" class="kima-editable" :aria-busy="pending || undefined">
    <Transition name="kima-fade" v-bind="presenceTransition">
      <button v-show="!editing" ref="display" class="kima-editable__display" type="button" :disabled="disabled" :aria-readonly="readonly || undefined" :aria-label="`${label}: ${local || placeholder || ''}`" :inert="editing" @click="begin">{{ local || placeholder || '编辑' }}</button>
    </Transition>
    <Transition name="kima-content" v-bind="presenceTransition">
      <div v-show="editing" class="kima-editable__editor" :inert="!editing" :aria-hidden="!editing || undefined">
        <component :is="multiline?'textarea':'input'" ref="editor" :value="draft" class="kima-editable__input" :aria-label="label" :required="required" :readonly="pending" :disabled="disabled" @input="draft=$event.target.value" @keydown="keydown" />
        <div class="kima-editable__actions"><KimaButton :loading="pending" :disabled="disabled" @click="save">保存</KimaButton><KimaButton variant="text" :disabled="pending || disabled" @click="cancel">取消</KimaButton></div>
        <p v-if="error" role="alert">{{ error }}</p>
      </div>
    </Transition>
    <input type="hidden" :name="name" :value="local" :disabled="disabled">
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/advanced-input" as *;
.kima-editable { @include advanced-root; display:grid;gap:var(--kima-space-2);position:relative;
  &__display { @include advanced-action; justify-self:start;text-align:start;border-radius:var(--kima-radius-s); }
  &__editor {display:grid;gap:var(--kima-space-2);}
  &__input { @include advanced-field;resize:vertical; }
  textarea {min-height:120px;}
  &__actions {display:flex;gap:var(--kima-space-2);}
  p {margin:0;color:var(--kima-color-error);}
}
</style>
