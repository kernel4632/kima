<!-- 行内警示：五种语义、动作插槽与键盘关闭，不自动消失。调用示例：<kima-alert heading="已保存" variant="success" closable>修改已同步。</kima-alert> -->
<script setup>
import { computed, ref, useAttrs, watch } from "vue";
import { Cancel01Icon } from "@hugeicons/core-free-icons";
import KimaIcon from "../core/icon.ce.vue";
import KimaButton from "../core/button.ce.vue";
import { displayStatus } from "../../utils/display-status.js";
import { useNativeSlots } from "../../utils/native-slots.js";
import { collapseTransition } from "../../utils/motion.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  open: { type: Boolean, default: true },
  variant: { type: String, default: "info" },
  heading: { type: String, default: "" },
  description: { type: String, default: "" },
  closable: Boolean,
  closeLabel: { type: String, default: "关闭提示" },
});
const emit = defineEmits(["update:open", "close"]);
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement, hasNativeSlot } = useNativeSlots(root);
const visible = ref(props.open);
watch(() => props.open, (value) => { visible.value = value; });
const status = computed(() => displayStatus(props.variant));
function close() { if (!visible.value) return; visible.value = false; emit("update:open", false); emit("close"); }
</script>
<template>
  <Transition :css="false" v-bind="collapseTransition">
  <div v-show="visible" class="kima-alert__collapse" :inert="!visible" :aria-hidden="!visible">
  <section ref="root" v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }" class="kima-alert" :data-variant="status.variant" :role="['danger', 'warning'].includes(status.variant) ? 'alert' : 'status'" aria-atomic="true">
    <span class="kima-alert__icon" role="img" :aria-label="status.label"><slot name="icon"><KimaIcon :icon="status.icon" :size="28" /></slot></span>
    <div class="kima-alert__body"><strong v-if="heading" class="kima-alert__heading">{{ heading }}</strong><div><slot>{{ description }}</slot></div><div v-if="$slots.action || hasNativeSlot('action') || isCustomElement" class="kima-alert__action"><slot name="action" /></div></div>
    <KimaButton v-if="closable" variant="text" class="kima-alert__close" :aria-label="closeLabel" @click="close"><KimaIcon :icon="Cancel01Icon" :size="20" aria-hidden="true" /></KimaButton>
  </section>
  </div>
  </Transition>
</template>
<style scoped lang="scss">
@use "../../styles/mixins" as *;
.kima-alert {
  box-sizing: border-box;
  min-width: 0;
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-body-medium);
  font-weight: var(--kima-font-weight-semi-bold);
  line-height: var(--kima-line-height-normal);
  color: var(--kima-color-on-surface);
  overflow-wrap: anywhere;
  @include kima-block-host;
  @include kima-layer;
  padding: var(--kima-space-6);
  border-radius: var(--kima-radius-m);
  --kima-display-tone: var(--kima-color-on-surface-variant);
  &[data-variant="info"] { --kima-display-tone: var(--kima-color-accent); }
  &[data-variant="success"] { --kima-display-tone: var(--kima-color-success); }
  &[data-variant="warning"] { --kima-display-tone: var(--kima-color-warning); }
  &[data-variant="danger"] { --kima-display-tone: var(--kima-color-error); }
  @include kima-motion-colors;
  display: flex; align-items: flex-start; gap: var(--kima-space-4);
  &__icon { @include kima-motion-colors; display: inline-flex; flex: 0 0 auto; color: var(--kima-display-tone); padding-block: var(--kima-space-1); }
  &__body { min-width: 0; flex: 1; }
  &__heading { display: block; margin-bottom: var(--kima-space-2); font-size: var(--kima-font-size-title-medium); }
  &__action { display: flex; flex-wrap: wrap; gap: var(--kima-space-2); margin-top: var(--kima-space-4); }
  &__action:empty { display: none; }
  &__close { flex: 0 0 auto; min-width: var(--kima-touch-target); padding: 0; }
}
</style>
