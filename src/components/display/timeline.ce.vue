<!-- 时间线：items 包含 title/description/time/datetime/variant，按输入顺序呈现。调用示例：<kima-timeline :items="[{ title: '已发布', time: '今天', variant: 'success' }]" /> -->
<script setup>
import { ref, useAttrs } from "vue";
import KimaIcon from "../core/icon.ce.vue";
import { displayStatus } from "../../utils/display-status.js";
import { useNativeSlots } from "../../utils/native-slots.js";
import { presenceTransition } from "../../utils/motion.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  items: { type: Array, default: () => [] },
  label: { type: String, default: "时间线" },
});
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement } = useNativeSlots(root);
</script>
<template>
  <ol ref="root" v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }" class="kima-timeline" :aria-label="label">
    <slot><TransitionGroup name="kima-list" v-bind="presenceTransition"><li v-for="(item, index) in items" :key="item.id ?? index" class="kima-timeline__item" :data-variant="displayStatus(item.variant).variant"><span class="kima-timeline__marker" role="img" :aria-label="displayStatus(item.variant).label"><KimaIcon :icon="displayStatus(item.variant).icon" :size="24" /></span><div class="kima-timeline__body"><slot name="item" :item="item" :index="index"><time v-if="item.time" :datetime="item.datetime">{{ item.time }}</time><strong>{{ item.title }}</strong><p v-if="item.description">{{ item.description }}</p></slot></div></li></TransitionGroup></slot>
  </ol>
</template>
<style scoped lang="scss">
@use "../../styles/display" as *;
@use "../../styles/mixins" as *;
.kima-timeline__marker { @include kima-motion-colors; }
.kima-timeline { position: relative; }
.kima-timeline__item.kima-list-leave-active { position: absolute; width: 100%; }
.kima-timeline {
  @include display-base;
  @include kima-block-host;
  margin: 0; padding: 0; list-style: none;
  &__item { @include display-tones; display: flex; position: relative; gap: var(--kima-space-4); padding-bottom: var(--kima-space-8); &:last-child { padding-bottom: 0; } &:not(:last-child)::before { content: ''; position: absolute; inset-inline-start: 11px; top: 32px; bottom: 8px; width: 2px; background: var(--kima-color-layer-3); } }
  &__marker { color: var(--kima-display-tone); display: inline-flex; flex: 0 0 24px; }
  &__body { min-width: 0; }
  time { display: block; color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-body-small); margin-bottom: var(--kima-space-2); }
  p { margin: var(--kima-space-2) 0 0; color: var(--kima-color-on-surface-variant); }
}
</style>
