<!-- 图片：原生 img alt/srcset/loading，加载与失败占位，换源重试。调用示例：<kima-image src="/th.jpg" alt="山间风景" caption="旅行记录" /> -->
<script setup>
import { ref, useAttrs, watch } from "vue";
import { ImageNotFound01Icon } from "@hugeicons/core-free-icons";
import KimaIcon from "./icon.ce.vue";
import KimaSpinner from "./spinner.ce.vue";
import { useNativeSlots } from "../utils/native-slots.js";
import { presenceTransition } from "../utils/motion.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  src: { type: String, default: "" },
  alt: { type: String, default: "" },
  srcset: { type: String, default: undefined },
  sizes: { type: String, default: undefined },
  loading: { type: String, default: "lazy" },
  fit: { type: String, default: "cover" },
  width: { type: [String, Number], default: undefined },
  height: { type: [String, Number], default: undefined },
  caption: { type: String, default: "" },
});
const emit = defineEmits(["load", "error"]);
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement, hasNativeSlot } = useNativeSlots(root);
const image = ref(null);
const state = ref(props.src || props.srcset ? "loading" : "error");
watch(() => [props.src, props.srcset, props.sizes], () => { state.value = props.src || props.srcset ? "loading" : "error"; }, { flush: "sync" });
function isCurrent(event) {
  return event.target === image.value && event.target.getAttribute("src") === props.src && (event.target.getAttribute("srcset") || "") === (props.srcset || "") && (event.target.getAttribute("sizes") || "") === (props.sizes || "");
}
function loaded(event) { if (isCurrent(event)) { state.value = "loaded"; emit("load", event); } }
function failed(event) { if (isCurrent(event)) { state.value = "error"; emit("error", event); } }
</script>
<template>
  <figure ref="root" v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }" class="kima-image" :data-state="state">
    <div class="kima-image__frame" :aria-busy="state === 'loading' || undefined">
      <Transition name="kima-fade"><img v-if="src || srcset" v-show="state !== 'error'" ref="image" class="kima-image__img" :key="JSON.stringify([src, srcset, sizes])" :src="src" :alt="alt" :srcset="srcset" :sizes="sizes" :loading="loading" :width="width" :height="height" :inert="state !== 'loaded'" :aria-hidden="state !== 'loaded' || undefined" :style="{ objectFit: ['cover', 'contain', 'fill', 'none', 'scale-down'].includes(fit) ? fit : 'cover' }" @load="loaded" @error="failed" /></Transition>
      <Transition name="kima-fade" v-bind="presenceTransition"><div v-if="state === 'loading'" class="kima-image__placeholder"><slot name="loading"><KimaSpinner label="图片加载中" /></slot></div></Transition>
      <Transition name="kima-fade" v-bind="presenceTransition"><div v-if="state === 'error'" class="kima-image__error" :role="alt ? 'img' : undefined" :aria-label="alt || undefined"><slot name="error"><KimaIcon :icon="ImageNotFound01Icon" :size="32" aria-hidden="true" /><span>图片加载失败</span></slot></div></Transition>
    </div>
    <figcaption v-if="caption || $slots.caption || hasNativeSlot('caption') || isCustomElement"><slot name="caption">{{ caption }}</slot></figcaption>
  </figure>
</template>
<style scoped lang="scss">
@use "../styles/display" as *;
@use "../styles/mixins" as *;
.kima-image {
  @include display-base;
  margin: 0;
  &__frame { @include kima-layer; position: relative; display: grid; min-height: 160px; overflow: hidden; border-radius: var(--kima-radius-m); }
  &__frame > * { grid-area: 1 / 1; }
  img { display: block; width: 100%; height: auto; transition: opacity var(--kima-duration-medium) var(--kima-curve-standard); }
  &[data-state="loading"] img { opacity: 0; }
  &__placeholder { display: grid; place-items: center; min-height: 160px; }
  &__error { min-height: 160px; padding: var(--kima-space-6); display: flex; flex-direction: column; gap: var(--kima-space-3); align-items: center; justify-content: center; color: var(--kima-color-on-surface-variant); }
  figcaption { margin-top: var(--kima-space-3); color: var(--kima-color-on-surface-variant); }
}
</style>
