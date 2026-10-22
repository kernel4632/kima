<!-- 头像：图片失败回退到文字或用户图标，保留可访问姓名。调用示例：<kima-avatar name="林青" src="/th.jpg" /> -->
<script setup>
import { computed, ref, useAttrs, watch } from "vue";
import { UserCircleIcon } from "@hugeicons/core-free-icons";
import KimaIcon from "../core/icon.ce.vue";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  src: { type: String, default: "" },
  name: { type: String, default: "" },
  alt: { type: String, default: undefined },
  size: { type: String, default: "medium" },
  shape: { type: String, default: "rounded" },
});
const emit = defineEmits(["load", "error"]);
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement } = useNativeSlots(root);
const failed = ref(false);
const loaded = ref(false);
watch(() => props.src, () => { failed.value = false; loaded.value = false; });
function load(event) { loaded.value = true; emit("load", event); }
function error(event) { failed.value = true; loaded.value = false; emit("error", event); }
const accessibleName = computed(() => props.alt ?? props.name);
const initials = computed(() => {
  const words = props.name.trim().split(/\s+/u);
  return words.length > 1 ? words.slice(0, 2).map((word) => Array.from(word)[0]).join("").toUpperCase() : Array.from(words[0]).slice(0, 2).join("");
});
</script>
<template>
  <span ref="root" v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }" class="kima-avatar" :class="[`kima-avatar--${size}`, { 'kima-avatar--circle': shape === 'circle' }]" :role="!src || failed ? 'img' : undefined" :aria-label="!src || failed ? accessibleName || undefined : undefined" :aria-hidden="(!src || failed) && !accessibleName ? true : undefined">
    <img v-if="src && !failed" :key="src" :src="src" :alt="accessibleName" :class="{ 'kima-avatar__image--loaded': loaded }" @load="load" @error="error" />
    <Transition name="kima-fade">
      <span v-if="!loaded" class="kima-avatar__fallback" aria-hidden="true"><span v-if="initials">{{ initials }}</span><KimaIcon v-else :icon="UserCircleIcon" :size="28" /></span>
    </Transition>
  </span>
</template>
<style scoped lang="scss">
@use "../../styles/display" as *;
@use "../../styles/mixins" as *;
.kima-avatar {
  @include display-base;
  @include kima-layer(2);
  display: inline-grid;
  grid-template: 100% / 100%;
  width: var(--kima-avatar-size, 56px);
  height: var(--kima-avatar-size, 56px);
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  border-radius: var(--kima-radius-m);
  overflow: hidden;
  &--small { --kima-avatar-size: 40px; }
  &--large { --kima-avatar-size: 72px; font-size: var(--kima-font-size-title-large); }
  &--circle { border-radius: 50%; }
  > img, &__fallback { grid-area: 1 / 1; }
  &__fallback { display: inline-flex; align-items: center; justify-content: center; }
  img { width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity var(--kima-duration-medium) var(--kima-curve-standard); }
  img.kima-avatar__image--loaded { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) { .kima-avatar img { transition: none; } }
</style>
