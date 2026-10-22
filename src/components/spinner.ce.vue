<!-- 加载指示器：具名状态，装饰用途可设 decorative。调用示例：<kima-spinner label="正在同步" /> -->
<script setup>
import { ref, useAttrs } from "vue";
import { useNativeSlots } from "../utils/native-slots.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  label: { type: String, default: "加载中" },
  size: { type: String, default: "medium" },
  decorative: Boolean,
});
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement } = useNativeSlots(root);
</script>
<template>
  <span ref="root" v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }" class="kima-spinner" :class="`kima-spinner--${size}`" :role="decorative ? undefined : 'status'" :aria-label="decorative ? undefined : label" :aria-hidden="decorative || undefined"><span class="kima-spinner__ring" aria-hidden="true" /></span>
</template>
<style scoped lang="scss">
.kima-spinner {
  display: inline-flex;
  vertical-align: middle;
  color: var(--kima-color-primary);
  &__ring { box-sizing: border-box; width: 32px; height: 32px; border: 3px solid var(--kima-color-layer-3); border-top-color: currentColor; border-radius: 50%; animation: kima-spinner-turn var(--kima-spinner-duration) linear infinite; }
  &--small &__ring { width: 20px; height: 20px; }
  &--large &__ring { width: 48px; height: 48px; }
}
@keyframes kima-spinner-turn { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .kima-spinner__ring { animation: none; } }
</style>
