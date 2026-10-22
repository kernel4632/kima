<!-- YYYY-MM-DDTHH:mm|null, minute precision, local civil datetime only. No offset, epoch or timezone conversion.
step is minutes; min/max use the same local format. Native browser input owns min/max/required/step validation. -->
<script setup>
import { computed, ref } from "vue";
import { useInputAttrs, useInputState } from "../../utils/input-state.js";
import { normalizeDatetime } from "../../utils/local-date.js";
import { useRipple } from "../../utils/ripple.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: { type: String, default: null }, name: String, label: { type: String, default: "日期时间" }, min: String, max: String, required: Boolean, disabled: Boolean, readonly: Boolean, step: { type: Number, default: 1 } });
const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null), input = ref(null);
const { attrs, controlAttrs } = useInputAttrs();
const { local, update } = useInputState(props, emit, root, normalizeDatetime);
useRipple(root);
const seconds = computed(() => Math.max(1, Number.isFinite(props.step) ? Math.floor(props.step) : 1) * 60);
defineExpose({ focus: () => input.value?.focus() });
</script>
<template><div ref="root" :class="['kima-datetime-picker',attrs.class]" :style="attrs.style" :aria-disabled="disabled || undefined"><input ref="input" v-bind="controlAttrs" class="kima-datetime-picker__input" type="datetime-local" :value="local || ''" :name="name" :aria-label="controlAttrs['aria-label'] || label" :min="min" :max="max" :step="seconds" :required="required" :disabled="disabled" :readonly="readonly" @input.stop="update($event.target.value)" @change.stop></div></template>
<style scoped lang="scss">
@use "../../styles/advanced-input" as *;
.kima-datetime-picker { @include advanced-root; max-width:440px; &__input { @include advanced-field; } }
</style>
