<!-- 结果页：语义图标、标题、说明及后续动作。调用示例：<kima-result variant="success" heading="发布成功" description="现在可以分享了。" /> -->
<script setup>
import { computed, ref, useAttrs } from "vue";
import KimaIcon from "../core/icon.ce.vue";
import { displayStatus } from "../../utils/display-status.js";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  variant: { type: String, default: "success" },
  heading: { type: String, default: "" },
  description: { type: String, default: "" },
});
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement, hasNativeSlot } = useNativeSlots(root);
const status = computed(() => displayStatus(props.variant));
</script>
<template>
  <section ref="root" v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }" class="kima-result" :data-variant="status.variant">
    <span class="kima-result__icon" role="img" :aria-label="status.label"><slot name="icon"><KimaIcon :icon="status.icon" :size="56" /></slot></span>
    <h2>{{ heading || status.label }}</h2><p v-if="description">{{ description }}</p>
    <div v-if="$slots.default || hasNativeSlot('default') || isCustomElement" class="kima-result__content"><slot /></div>
    <div v-if="$slots.action || hasNativeSlot('action') || isCustomElement" class="kima-result__actions"><slot name="action" /></div>
  </section>
</template>
<style scoped lang="scss">
@use "../../styles/display" as *;
@use "../../styles/mixins" as *;
.kima-result__icon { @include kima-motion-colors; }
.kima-result {
  @include display-panel; @include display-tones;
  display: flex; flex-direction: column; align-items: center; text-align: center; gap: var(--kima-space-4); padding-block: var(--kima-space-10);
  &__icon { color: var(--kima-display-tone); display: inline-flex; }
  h2, p { margin: 0; max-width: 48ch; }
  h2 { font-size: var(--kima-font-size-headline-small); }
  p { color: var(--kima-color-on-surface-variant); }
  &__content { width: 100%; }
  &__content:empty, &__actions:empty { display: none; }
  &__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--kima-space-3); }
}
</style>
