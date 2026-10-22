<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { normalizeDate } from "../utils/local-date.js";
const props = defineProps({ modelValue: { type: String, default: "" }, name: String, label: { type: String, default: "日期" }, required: Boolean, disabled: Boolean, readonly: Boolean, min: String, max: String });
const emit = defineEmits(["update:modelValue", "change"]);
const parts = ref(["", "", ""]), inputs = ref([]), hidden = ref(null), valid = ref(false);
function split(value) { const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || ""); return match ? match.slice(1) : ["", "", ""]; }
function complete() { return parts.value.every(Boolean); }
function inBounds(value) { return Boolean(normalizeDate(value) && (!props.min || value >= props.min) && (!props.max || value <= props.max)); }
function updateValidity() { const hasInput = parts.value.some(Boolean); hidden.value?.setCustomValidity(!hasInput && !props.required ? "" : valid.value ? "" : "请输入完整且在范围内的日期"); }
function setValue(value, notify = false) { const normalized = normalizeDate(value); valid.value = Boolean(normalized && (!props.min || normalized >= props.min) && (!props.max || normalized <= props.max)); if (valid.value) { parts.value = split(normalized); emit("update:modelValue", normalized); if (notify) emit("change", normalized); } else { emit("update:modelValue", ""); if (notify) emit("change", ""); } updateValidity(); }
watch(() => props.modelValue, value => { parts.value = split(value); valid.value = inBounds(value); updateValidity(); }, { immediate: true });
function commit(index, event) { const limit = index === 0 ? 4 : 2, maximum = index === 0 ? 9999 : index === 1 ? 12 : 31; const value = event.target.value.replace(/\D/g, "").slice(0, limit); parts.value[index] = value; event.target.value = value; if (value.length === limit && Number(value) >= 1 && Number(value) <= maximum) { if (index < 2) nextTick(() => inputs.value[index + 1]?.focus()); if (complete()) setValue(parts.value.join("-"), true); else { valid.value = false; updateValidity(); } } else { valid.value = false; updateValidity(); emit("update:modelValue", ""); } }
function keydown(index, event) { if (props.disabled || props.readonly || event.isComposing) return; if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); const el = inputs.value[index], maximum = index === 0 ? 9999 : index === 1 ? 12 : 31; el.value = String(Math.max(1, Math.min(maximum, Number(el.value || 0) + (event.key === "ArrowUp" ? 1 : -1)))).padStart(index ? 2 : 4, "0"); commit(index, { target: el }); } else if (event.key === "ArrowLeft" && event.target.selectionStart === 0) inputs.value[index - 1]?.focus(); else if (event.key === "ArrowRight" && event.target.selectionStart === event.target.value.length) inputs.value[index + 1]?.focus(); }
let form, doc, initial;
function reset(event) { if (event.target !== form) return; queueMicrotask(() => { if (event.defaultPrevented) return; parts.value = split(initial); valid.value = inBounds(initial); updateValidity(); emit("update:modelValue", initial); }); }
onMounted(() => { initial = props.modelValue; form = hidden.value?.form; doc = hidden.value?.ownerDocument; updateValidity(); doc?.addEventListener("reset", reset, true); });
onBeforeUnmount(() => doc?.removeEventListener("reset", reset, true));
const display = computed(() => parts.value);
</script>
<template><div class="kima-date-field" role="group" :aria-label="label" :aria-disabled="disabled || undefined"><input v-for="(part,index) in display" :key="index" :ref="el => inputs[index] = el" class="kima-date-field__segment" type="text" :value="part" :placeholder="index===0 ? 'YYYY' : index===1 ? 'MM' : 'DD'" :aria-label="`${label} ${index===0 ? '年' : index===1 ? '月' : '日'}`" inputmode="numeric" :maxlength="index===0 ? 4 : 2" :disabled="disabled" :readonly="readonly" @input="commit(index,$event)" @keydown="keydown(index,$event)" @compositionend="commit(index,$event)"><input ref="hidden" class="kima-date-field__native" type="text" :name="name" :required="required" :disabled="disabled" :value="valid ? parts.join('-') : ''" :aria-label="label" tabindex="-1" aria-hidden="true"></div></template>
<style scoped lang="scss">
@use "../styles/advanced-input" as *;
.kima-date-field { @include advanced-root; display:flex; align-items:center; gap:var(--kima-space-2); &__segment { @include advanced-field; width:5.5ch; min-width:4ch; padding-inline:var(--kima-space-2); text-align:center; font-variant-numeric:tabular-nums; } &__segment:first-child { width:7.5ch; } &__native { position:absolute; width:1px; height:1px; opacity:0; pointer-events:none; } span { color:var(--kima-color-on-surface-variant); font-size:var(--kima-font-size-label-small); } }
</style>
