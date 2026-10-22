<!-- 视觉文本水印，不防篡改、不承诺内容安全。原生文字重复排布，SSR 无 canvas。 -->
<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useInteractionRoot } from '../utils/interaction.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ text: { type: [String, Array], default: 'KIMA' }, gap: { type: Number, default: 160 }, rotate: { type: Number, default: -20 } });
const emit = defineEmits(['resize']);
const { root, forwardedAttrs } = useInteractionRoot();
const width = ref(640), height = ref(320);
const spacing = computed(() => Math.max(80, Number(props.gap) || 160));
const count = computed(() => Math.ceil(width.value / spacing.value) * Math.ceil(height.value / 100));
const content = computed(() => Array.isArray(props.text) ? props.text.join('\n') : props.text);
let observer;
onMounted(() => { observer = new ResizeObserver(([entry]) => { width.value = entry.contentRect.width; height.value = entry.contentRect.height; emit('resize', { width: width.value, height: height.value }); }); observer.observe(root.value); });
onBeforeUnmount(() => observer?.disconnect());
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-watermark"><slot/><div class="kima-watermark__overlay" aria-hidden="true" :style="{ gridTemplateColumns: `repeat(${Math.max(1, Math.ceil(width / spacing))}, 1fr)` }"><span v-for="index in count" :key="index" :style="{ transform: `rotate(${rotate}deg)` }">{{ content }}</span></div></div></template>
<style scoped lang="scss">.kima-watermark { position: relative; min-height: 100px; font-family: var(--kima-font-family); color: var(--kima-color-on-surface); &__overlay { position: absolute; inset: 0; overflow: hidden; pointer-events: none; user-select: none; display: grid; grid-auto-rows: 100px; z-index: 1; color: var(--kima-color-on-surface-variant); opacity: var(--kima-opacity-disabled); } span { display: grid; place-content: center; white-space: pre-line; text-align: center; } }</style>
