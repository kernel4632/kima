<!-- 头像组：items 数组支持 max 折叠，默认插槽可直接组合头像。调用示例：<kima-avatar-group :items="people" :max="3" label="协作者" /> -->
<script setup>
import { computed, ref, useAttrs } from "vue";
import KimaAvatar from "./avatar.ce.vue";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  items: { type: Array, default: () => [] },
  max: { type: Number, default: 5 },
  label: { type: String, default: "成员" },
  size: { type: String, default: "medium" },
});
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement } = useNativeSlots(root);
const limit = computed(() => Number.isFinite(props.max) ? Math.max(0, Math.floor(props.max)) : props.items.length);
const visible = computed(() => props.items.slice(0, limit.value));
const remaining = computed(() => Math.max(0, props.items.length - visible.value.length));
const hiddenNames = computed(() => props.items.slice(limit.value).map((item) => item.name).filter(Boolean).join('、'));
</script>
<template>
  <div ref="root" v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }" class="kima-avatar-group" role="group" :aria-label="label">
    <slot>
      <TransitionGroup name="kima-list" tag="div" class="kima-avatar-group__items">
        <KimaAvatar v-for="(item, index) in visible" :key="`avatar-${item.id ?? index}`" :src="item.src" :name="item.name" :alt="item.alt" :size="size" />
        <span v-if="remaining" key="more" class="kima-avatar-group__more" :aria-label="`另有 ${remaining} 位成员${hiddenNames ? '：' + hiddenNames : ''}`" :title="hiddenNames">+{{ remaining }}</span>
      </TransitionGroup>
    </slot>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/display" as *;
@use "../../styles/mixins" as *;
.kima-avatar-group {
  @include display-base;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--kima-space-2);
  &__items { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: var(--kima-space-2); }
  &__more { @include kima-layer(2); display: inline-flex; align-items: center; justify-content: center; min-width: 56px; min-height: 56px; padding-inline: var(--kima-space-2); border-radius: var(--kima-radius-m); }
}
</style>
