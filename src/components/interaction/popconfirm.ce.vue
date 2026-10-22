<!-- 气泡确认：在原操作附近确认，取消为默认焦点；confirm/cancel 只在显式操作时发出。
调用示例：<kima-popconfirm label="删除项目" heading="确定删除？" description="删除后无法恢复。" @confirm="removeProject" />
-->
<script setup>
import { useId, watch } from "vue";
import KimaPopover from "./popover.ce.vue";
import KimaButton from "../core/button.ce.vue";
import { useInteractionRoot, useInteractionModel } from "../../utils/interaction.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ open: Boolean, disabled: Boolean, label: { type: String, default: "删除" }, heading: { type: String, default: "确认此操作？" }, description: { type: String, default: "" }, confirmText: { type: String, default: "确认" }, cancelText: { type: String, default: "取消" }, placement: { type: String, default: "bottom-start" }, danger: Boolean });
const emit = defineEmits(["update:open", "confirm", "cancel"]);
const { root, forwardedAttrs } = useInteractionRoot();
const [localOpen, updateOpen] = useInteractionModel(props, "open", emit);
const headingId = `kima-popconfirm-${useId()}`;
watch(() => props.disabled, (value) => { if (value) updateOpen(false); });
function act(action) { if (props.disabled || !localOpen.value) return; updateOpen(false); emit(action); }
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-popconfirm">
    <KimaPopover :open="localOpen" :disabled="disabled" :label="label" :content-label="heading" :placement="placement" @update:open="updateOpen">
      <template #trigger><slot name="trigger">{{ label }}</slot></template>
      <section :aria-labelledby="headingId"><h3 :id="headingId">{{ heading }}</h3><p v-if="description">{{ description }}</p><slot /><div class="kima-popconfirm__actions"><KimaButton variant="text" :disabled="disabled" @click="act('cancel')">{{ cancelText }}</KimaButton><KimaButton :class="{ 'kima-popconfirm__danger': danger }" :disabled="disabled" @click="act('confirm')">{{ confirmText }}</KimaButton></div></section>
    </KimaPopover>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/interaction" as *;
.kima-popconfirm { @include interaction-root; display: inline-block; h3 { margin: 0 0 var(--kima-space-3); } p { color: var(--kima-color-on-surface-variant); } &__actions { display: flex; justify-content: flex-end; gap: var(--kima-space-2); margin-top: var(--kima-space-4); } &__danger { color: var(--kima-color-on-error); background: var(--kima-color-error); } }
</style>
