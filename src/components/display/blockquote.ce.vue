<!-- 引用：语义 blockquote 与来源说明，cite 为原文地址。调用示例：<kima-blockquote author="KIMA" cite="https://example.com">交互体验第一。</kima-blockquote> -->
<script setup>
import { ref, useAttrs } from "vue";
import { QuoteUpIcon } from "@hugeicons/core-free-icons";
import KimaIcon from "../core/icon.ce.vue";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  cite: { type: String, default: undefined },
  author: { type: String, default: "" },
  source: { type: String, default: "" },
});
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement, hasNativeSlot } = useNativeSlots(root);
</script>
<template>
  <figure ref="root" v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }" class="kima-blockquote"><KimaIcon :icon="QuoteUpIcon" :size="32" class="kima-blockquote__icon" aria-hidden="true" /><blockquote :cite="cite"><slot /></blockquote><figcaption v-if="author || source || $slots.caption || hasNativeSlot('caption') || isCustomElement"><slot name="caption"><span v-if="author">— {{ author }}</span><cite v-if="source">{{ source }}</cite></slot></figcaption></figure>
</template>
<style scoped lang="scss">
@use "../../styles/mixins" as *;
.kima-blockquote {
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
  margin: 0;
  &__icon { color: var(--kima-color-primary); margin-bottom: var(--kima-space-3); }
  blockquote { margin: 0; font-size: var(--kima-font-size-title-medium); line-height: var(--kima-line-height-loose); }
  figcaption { display: flex; flex-wrap: wrap; gap: var(--kima-space-3); margin-top: var(--kima-space-4); color: var(--kima-color-on-surface-variant); }
}
</style>
