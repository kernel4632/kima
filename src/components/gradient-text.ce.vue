<!-- 可选渐变文字：纯语义 token，默认静态，animated 可选；不支持 clip/强制颜色时显示可读文字。
调用示例：<kima-gradient-text>专注当前内容</kima-gradient-text>
-->
<script setup>
import { useNavigationRoot } from '../utils/navigation.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ as: { type: String, default: 'span' }, animated: Boolean });
const { root, forwardedAttrs } = useNavigationRoot();
</script>
<template><component :is="['span','strong','em','p','h1','h2','h3'].includes(as) ? as : 'span'" ref="root" v-bind="forwardedAttrs" class="kima-gradient-text" :class="{'kima-gradient-text--animated': animated}"><slot /></component></template>
<style scoped lang="scss">
.kima-gradient-text { color: var(--kima-color-primary); }
@supports (background-clip: text) { .kima-gradient-text { background: linear-gradient(110deg, var(--kima-color-primary), var(--kima-color-on-tertiary-container), var(--kima-color-primary)); background-size: 200% 100%; background-clip: text; color: var(--kima-color-transparent); &--animated { animation: kima-gradient-shift 8s linear infinite; } } }
@keyframes kima-gradient-shift { to { background-position: 200% 0; } }
@media (prefers-reduced-motion: reduce) { .kima-gradient-text { animation: none; } }
@media (forced-colors: active) { .kima-gradient-text { background: none; color: CanvasText; animation: none; } }
</style>
