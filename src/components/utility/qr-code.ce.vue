<!-- 真实 UTF-8 QR Code，四模块静区。颜色由宿主的 token 决定，需保持扫码对比度。 -->
<script setup>
import { computed, watch } from 'vue';
import { encodeQR } from '../../utils/qr.js';
import { useInteractionRoot } from '../../utils/interaction.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ value: { type: String, default: '' }, level: { type: String, default: 'M' }, size: { type: Number, default: 200 }, label: { type: String, default: '二维码' } });
const emit = defineEmits(['error', 'change']);
const { root, forwardedAttrs } = useInteractionRoot();
const result = computed(() => { try { return { qr: encodeQR(props.value, props.level) }; } catch (error) { return { error: String(error?.message || error) }; } });
watch(result, value => value.error ? emit('error', value.error) : emit('change', { modules: value.qr.size }), { immediate: true });
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-qr-code">
    <svg v-if="result.qr" role="img" :aria-label="label" :width="Math.max(40, size)" :height="Math.max(40, size)" :viewBox="result.qr.viewBox" shape-rendering="crispEdges"><rect width="100%" height="100%" class="kima-qr-code__paper"/><path :d="result.qr.path"/></svg>
    <p v-else role="alert">无法生成二维码：{{ result.error }}</p>
  </div>
</template>
<style scoped lang="scss">
.kima-qr-code { display: inline-block; max-width: 100%; color: var(--kima-color-on-surface); font-family: var(--kima-font-family); svg { display: block; max-width: 100%; height: auto; fill: var(--kima-color-on-surface); } &__paper { fill: var(--kima-color-surface); } }
</style>
