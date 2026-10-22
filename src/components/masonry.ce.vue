<!-- 列优先瀑布流：CSS columns 原生顺序；columns 为数字或 {base,sm,md,lg}，按实际容器宽度响应，图片加载自然重排。
调用示例：<kima-masonry :columns="{base:1,sm:2,lg:3}" gap="24px"><article>第一项</article><article>第二项</article></kima-masonry>
-->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useNavigationRoot, cssSize } from '../utils/navigation.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ columns: { type: [Number, Object], default: 3 }, gap: { type: [Number, String], default: 24 }, label: { type: String, default: '列优先瀑布流' } });
const emit = defineEmits(['resize']);
const { root, forwardedAttrs } = useNavigationRoot(); const width = ref(0); let observer;
const count = computed(() => { let value = props.columns; if (typeof value === 'object') value = width.value >= 1024 ? value.lg ?? value.md ?? value.sm ?? value.base : width.value >= 768 ? value.md ?? value.sm ?? value.base : width.value >= 480 ? value.sm ?? value.base : value.base; return Math.max(1, Math.min(12, Number(value) || 1)); });
onMounted(() => { observer = new ResizeObserver(([entry]) => { width.value = entry.contentRect.width; emit('resize', { width: width.value, columns: count.value }); }); observer.observe(root.value); });
onBeforeUnmount(() => observer?.disconnect());
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-masonry" role="group" :aria-label="label" data-flow="column-major" :style="{columnCount: count, '--kima-masonry-gap': cssSize(gap)}"><slot /></div></template>
<style scoped lang="scss">
.kima-masonry { column-gap: var(--kima-masonry-gap); transition: column-gap var(--kima-duration-medium) var(--kima-curve-standard); :deep(> *) { break-inside: avoid; margin-block: 0 var(--kima-masonry-gap); } :deep(img) { max-width: 100%; height: auto; } }
@media (prefers-reduced-motion: reduce) { .kima-masonry { transition: none; } }
</style>
