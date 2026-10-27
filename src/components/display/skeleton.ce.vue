<!-- 骨架屏：loading 为 false 时恢复默认插槽，减少动效偏好下静止。调用示例：<kima-skeleton :loading="busy" :rows="3"><p>真实内容</p></kima-skeleton> -->
<script setup>
import { computed, ref, useAttrs } from "vue";
import { useContentMotion } from "../../utils/content-motion.js";
import { useNativeSlots } from "../../utils/native-slots.js";
import { freezeLeaveLayout } from "../../utils/motion.js";
import { presenceTransition } from "../../utils/motion.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  loading: { type: Boolean, default: true },
  rows: { type: Number, default: 3 },
  animated: { type: Boolean, default: true },
  avatar: Boolean,
  label: { type: String, default: "正在加载内容" },
});
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement } = useNativeSlots(root);
const rowCount = computed(() => Number.isFinite(props.rows) ? Math.min(50, Math.max(1, Math.floor(props.rows))) : 3);
useContentMotion(root, () => props.loading);
</script>
<template>
  <div ref="root" v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }" class="kima-skeleton" :class="{ 'kima-skeleton--animated': animated && loading }" :aria-busy="loading || undefined" :aria-label="loading ? label : undefined" :role="loading ? 'status' : undefined">
    <Transition name="kima-fade" v-bind="{ ...presenceTransition, onBeforeLeave: freezeLeaveLayout }">
      <div v-show="loading" class="kima-skeleton__placeholder" aria-hidden="true"><span v-if="avatar" class="kima-skeleton__avatar" /><div class="kima-skeleton__lines"><span v-for="row in rowCount" :key="row" class="kima-skeleton__line" /></div></div>
    </Transition>
    <Transition name="kima-fade" v-bind="{ ...presenceTransition, onBeforeLeave: freezeLeaveLayout }">
      <div v-show="!loading" class="kima-skeleton__content" :inert="loading" :aria-hidden="loading || undefined"><slot /></div>
    </Transition>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/display" as *;
.kima-skeleton {
  @include display-base;
  width: 100%;
  display: grid;
  &__placeholder, &__content { grid-area: 1 / 1; align-self: start; min-width: 0; }
  &__placeholder { display: flex; gap: var(--kima-space-4); }
  &__lines { flex: 1; display: grid; gap: var(--kima-space-4); }
  &__line, &__avatar { display: block; border-radius: var(--kima-radius-m); background: var(--kima-color-layer-2); }
  &__line { height: 24px; &:last-child { width: 65%; } }
  &__avatar { width: 64px; height: 64px; flex: 0 0 auto; }
  &--animated &__placeholder { animation: kima-skeleton-pulse var(--kima-spinner-duration) var(--kima-curve-standard) infinite alternate; }
}
@keyframes kima-skeleton-pulse { to { opacity: 0.45; } }
@media (prefers-reduced-motion: reduce) { .kima-skeleton--animated .kima-skeleton__placeholder { animation: none; } }
</style>
