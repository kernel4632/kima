<script setup>
import { computed } from "vue";
import KimaSelect from "./select.ce.vue";
const props = defineProps({ modelValue: { type: [String, Number], default: null }, items: { type: Array, default: () => [] }, presets: { type: Array, default: () => [] }, label: { type: String, default: "时间" }, name: String, disabled: Boolean, required: Boolean, clearable: Boolean, placeholder: { type: String, default: "选择时间" } });
const emit = defineEmits(["update:modelValue", "change"]);
const options = computed(() => (props.items.length ? props.items : props.presets).map(item => typeof item === "string" || typeof item === "number" ? { value: item, label: String(item) } : item));
</script>
<template><div class="kima-time-select"><KimaSelect :model-value="modelValue" :items="options" :label="label" :name="name" :disabled="disabled" :required="required" :clearable="clearable" :placeholder="placeholder" @update:model-value="emit('update:modelValue',$event)" @change="emit('change',$event)"><slot /></KimaSelect></div></template>
<style scoped lang="scss">
@use "../styles/input" as *;
.kima-time-select { @include input-root; display:block; min-width:0; }
</style>
