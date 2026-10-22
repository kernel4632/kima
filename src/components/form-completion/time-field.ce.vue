<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
const props = defineProps({ modelValue: { type: String, default: "" }, name: String, label: { type: String, default: "时间" }, required: Boolean, disabled: Boolean, readonly: Boolean, seconds: Boolean, min: String, max: String });
const emit = defineEmits(["update:modelValue", "change"]);
const parts = ref(Array(props.seconds ? 3 : 2).fill("")), inputs = ref([]), hidden = ref(null), valid = ref(false);
const count = () => props.seconds ? 3 : 2;
function split(value) { const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value || ""); return match ? [match[1], match[2], match[3] || "00"].slice(0, count()) : Array(count()).fill(""); }
function validTime(value) { const match = props.seconds ? /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.exec(value || "") : /^(?:[01]\d|2[0-3]):[0-5]\d$/.exec(value || ""); return Boolean(match && (!props.min || value >= props.min) && (!props.max || value <= props.max)); }
function updateValidity() { const hasInput = parts.value.some(Boolean); hidden.value?.setCustomValidity(!hasInput && !props.required ? "" : valid.value ? "" : "请输入完整且在范围内的时间"); }
watch(() => [props.modelValue, props.seconds], () => { parts.value = split(props.modelValue); valid.value = validTime(props.modelValue); updateValidity(); }, { immediate: true });
function apply(value, notify = true) { valid.value = validTime(value); if (valid.value) { emit("update:modelValue", value); if (notify) emit("change", value); } else emit("update:modelValue", ""); updateValidity(); }
function commit(index, event) { const value = event.target.value.replace(/\D/g, "").slice(0, 2), maximum = index === 0 ? 23 : 59; parts.value[index] = value; event.target.value = value; if (value.length === 2 && Number(value) <= maximum) { if (index < count() - 1) nextTick(() => inputs.value[index + 1]?.focus()); if (parts.value.every(part => part.length === 2)) apply(parts.value.join(":")); else { valid.value = false; updateValidity(); } } else { valid.value = false; updateValidity(); emit("update:modelValue", ""); } }
function keydown(index, event) { if (event.isComposing) return; if (["ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); const el = inputs.value[index], maximum = index === 0 ? 23 : 59, next = (Number(el.value || 0) + (event.key === "ArrowUp" ? 1 : -1) + maximum + 1) % (maximum + 1); el.value = String(next).padStart(2, "0"); commit(index, { target: el }); } else if (event.key === "ArrowLeft" && event.target.selectionStart === 0) inputs.value[index - 1]?.focus(); else if (event.key === "ArrowRight" && event.target.selectionStart === event.target.value.length) inputs.value[index + 1]?.focus(); }
let form, doc, initial;
function reset(event) { if (event.target !== form) return; queueMicrotask(() => { if (event.defaultPrevented) return; parts.value = split(initial); valid.value = validTime(initial); updateValidity(); emit("update:modelValue", initial); }); }
onMounted(() => { initial = props.modelValue; form = hidden.value?.form; doc = hidden.value?.ownerDocument; updateValidity(); doc?.addEventListener("reset", reset, true); });
onBeforeUnmount(() => doc?.removeEventListener("reset", reset, true));
</script>
<template><div class="kima-time-field" role="group" :aria-label="label" :aria-disabled="disabled || undefined"><input v-for="(part,index) in parts" :key="index" :ref="el => inputs[index] = el" class="kima-time-field__segment" type="text" :value="part" :placeholder="index===0 ? 'HH' : index===1 ? 'MM' : 'SS'" :aria-label="`${label} ${index===0 ? '时' : index===1 ? '分' : '秒'}`" inputmode="numeric" maxlength="2" :disabled="disabled" :readonly="readonly" @input="commit(index,$event)" @keydown="keydown(index,$event)" @compositionend="commit(index,$event)"><input ref="hidden" class="kima-time-field__native" type="text" :name="name" :required="required" :disabled="disabled" :value="valid ? parts.join(':') : ''" :aria-label="label" tabindex="-1" aria-hidden="true"></div></template>
<style scoped lang="scss">
@use "../../styles/advanced-input" as *;
.kima-time-field { @include advanced-root; display:flex; align-items:center; gap:var(--kima-space-2); &__segment { @include advanced-field; width:5.5ch; min-width:4ch; padding-inline:var(--kima-space-2); text-align:center; font-variant-numeric:tabular-nums; } &__native { position:absolute; width:1px; height:1px; opacity:0; pointer-events:none; } span { color:var(--kima-color-on-surface-variant); font-size:var(--kima-font-size-label-small); } }
</style>
