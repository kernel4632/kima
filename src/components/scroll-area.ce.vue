<!-- 滚动区域：独立具名、键盘可达的原生滚动区，支持最大高宽，不做虚拟化。
调用示例：
  <kima-scroll-area label="更新日志" :max-height="320">长内容</kima-scroll-area>
-->
<script setup>
import { computed } from "vue";
import { cssSize, useNavigationRoot } from "../utils/navigation.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ label: { type: String, default: "滚动内容" }, maxHeight: { type: [Number, String], default: 360 }, maxWidth: { type: [Number, String], default: "100%" }, orientation: { type: String, default: "vertical" } });
const emit = defineEmits(["scroll"]);
const { root, forwardedAttrs } = useNavigationRoot();
const dimensions = computed(() => ({ maxHeight: cssSize(props.maxHeight), maxWidth: cssSize(props.maxWidth), overflowX: props.orientation === "vertical" ? "hidden" : "auto", overflowY: props.orientation === "horizontal" ? "hidden" : "auto" }));
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-scroll-area" role="region" :aria-label="label" tabindex="0" :style="dimensions" @scroll="emit('scroll', $event)"><slot /></div></template>
<style scoped lang="scss">
@use "../styles/navigation" as *;
@use "../styles/mixins" as *;
.kima-scroll-area { @include navigation-surface; @include kima-focus-ring; overscroll-behavior: contain; scrollbar-gutter: stable; }
</style>
