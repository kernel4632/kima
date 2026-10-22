<!-- 文件选择：原生 file 输入 + 拖放/移除/类型大小校验，不伪造网络上传。modelValue 为 File[]。
调用示例：
  <kima-file-upload label="附件" name="attachments" accept="image/*,.pdf" multiple :max-size="5242880" />
-->
<script setup>
import { nextTick, ref, toRaw, watch } from "vue";
import { collapseTransition, presenceTransition } from "../utils/motion.js";
import KimaButton from "./button.ce.vue";
import { useInputAttrs, useInputState } from "../utils/input-state.js";
import { useRipple } from "../utils/ripple.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, default: "选择文件或拖放到此处" },
  name: String,
  accept: String,
  multiple: Boolean,
  disabled: Boolean,
  required: Boolean,
  maxSize: { type: Number, default: Infinity },
  maxFiles: { type: Number, default: Infinity },
});
const emit = defineEmits(["update:modelValue", "change", "reject"]);
const root = ref(null);
const input = ref(null);
const dragging = ref(false);
const { attrs, controlAttrs } = useInputAttrs();
const { local, update } = useInputState(props, emit, root, (v) => Array.isArray(v) ? v : [], () => nextTick(syncFiles));
useRipple(root);
function syncFiles() {
  if (!input.value) return;
  const transfer = new DataTransfer();
  for (const file of local.value) if (file instanceof File) transfer.items.add(file);
  input.value.files = transfer.files;
}
watch(local, () => nextTick(syncFiles), { immediate: true, deep: true });
function accepted(file) {
  if (!props.accept) return true;
  return props.accept.split(",").some((raw) => {
    const rule = raw.trim().toLowerCase();
    if (!rule) return false;
    if (rule.startsWith(".")) return file.name.toLowerCase().endsWith(rule);
    if (rule.endsWith("/*")) return file.type.toLowerCase().startsWith(rule.slice(0, -1));
    return file.type.toLowerCase() === rule;
  });
}
function choose(files) {
  if (props.disabled) return;
  const valid = [];
  const limit = Math.max(0, props.multiple ? props.maxFiles : Math.min(1, props.maxFiles));
  for (const file of files) {
    const reason = !accepted(file) ? "accept" : file.size > props.maxSize ? "size" : valid.length >= limit ? "count" : "";
    if (reason) emit("reject", { file, reason });
    else valid.push(file);
  }
  update(valid);
  nextTick(syncFiles);
}
function drop(event) { dragging.value = false; choose([...event.dataTransfer.files]); }
function remove(index) { if (!props.disabled) update(local.value.filter((_, i) => i !== index)); }
const fileIds = new WeakMap();
let nextFileId = 0;
function fileKey(file, index) {
  const raw = toRaw(file);
  if (!fileIds.has(raw)) fileIds.set(raw, ++nextFileId);
  const occurrence = local.value.slice(0, index).filter((item) => toRaw(item) === raw).length;
  return `${fileIds.get(raw)}-${occurrence}`;
}
</script>
<template>
  <div :class="['kima-file-upload', attrs.class]" :style="attrs.style" :aria-disabled="disabled || undefined">
    <div ref="root" class="kima-file-upload__drop" :class="{ 'kima-file-upload__drop--active': dragging && !disabled }" :aria-disabled="disabled || undefined" @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="drop">
      <input ref="input" v-bind="controlAttrs" type="file" :aria-label="controlAttrs['aria-label'] || label" :name="name" :accept="accept" :multiple="multiple" :disabled="disabled" :required="required" @input.stop @change.stop="choose([...$event.target.files])" />
      <p>{{ label }}</p>
    </div>
    <Transition :css="false" v-bind="collapseTransition">
      <div v-show="local.length" :inert="!local.length" :aria-hidden="!local.length || undefined">
        <TransitionGroup tag="ul" name="kima-list" v-bind="presenceTransition" class="kima-file-upload__files">
          <li v-for="(file, index) in local" :key="fileKey(file, index)"><span>{{ file.name }} · {{ file.size }} B</span><KimaButton variant="text" :disabled="disabled" :aria-label="`移除 ${file.name}`" @click="remove(index)">移除</KimaButton></li>
        </TransitionGroup>
      </div>
    </Transition>
  </div>
</template>
<style scoped lang="scss">
@use "../styles/input" as *;
@use "../styles/mixins" as *;
.kima-file-upload {
  @include input-root;
  @include kima-motion-colors;
  &__drop { @include input-surface; @include kima-motion-colors; display: grid; gap: var(--kima-space-3); padding: var(--kima-space-5); }
  &__drop--active { background: var(--kima-color-primary-container); color: var(--kima-color-on-primary-container); }
  input { @include input-control; width: 100%; }
  input::file-selector-button { border: 0; padding: var(--kima-space-3); margin-inline-end: var(--kima-space-3); border-radius: var(--kima-radius-full); background: var(--kima-color-primary-container); color: var(--kima-color-on-primary-container); font: inherit; cursor: pointer; }
  p { @include input-message; }
  &__files { list-style: none; margin: 0; padding: var(--kima-space-3) 0 0; display: grid; gap: var(--kima-space-2); }
  li { display: flex; align-items: center; justify-content: space-between; gap: var(--kima-space-3); }
  li span { min-width: 0; overflow-wrap: anywhere; }
}
</style>
