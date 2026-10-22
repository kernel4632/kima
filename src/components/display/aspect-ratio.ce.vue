<!-- 固定宽高比容器：ratio 为宽/高，非法值退回 16/9。调用示例：<kima-aspect-ratio :ratio="16 / 9"><img src="/th.jpg" alt="风景" /></kima-aspect-ratio> -->
<script setup>
import { computed, ref, useAttrs } from "vue";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  ratio: { type: Number, default: 16 / 9 },
});
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement } = useNativeSlots(root);
const safeRatio = computed(() => Number.isFinite(props.ratio) && props.ratio > 0 ? props.ratio : 16 / 9);
</script>
<template>
  <div ref="root" v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }" class="kima-aspect-ratio" :style="{ aspectRatio: safeRatio }"><div class="kima-aspect-ratio__content"><slot /></div></div>
</template>
<style scoped lang="scss">
@use "../../styles/display" as *;
@use "../../styles/mixins" as *;
.kima-aspect-ratio {
  @include display-base; @include kima-layer;
  position: relative; width: 100%; border-radius: var(--kima-radius-m); overflow: hidden;
  &__content { position: absolute; inset: 0; display: grid; place-items: center; }
  &__content :deep(> img), &__content :deep(> video), &__content :deep(> iframe) { width: 100%; height: 100%; object-fit: cover; border: 0; }
}
</style>
