<!-- 局部配置：theme=light/dark，seed 生成局部 token；locale/direction/reducedMotion 由 Vue inject 或 DOM observer 读取。
调用示例：<kima-config-provider theme="light" seed="#61afef" locale="zh-CN" direction="ltr" reduced-motion="reduce"><kima-button>局部主题</kima-button></kima-config-provider>
-->
<script setup>
import { computed, onMounted, provide, watch } from 'vue';
import { useNavigationRoot } from '../../utils/navigation.js';
import { defaultConfig, kimaConfigKey, useKimaConfig } from '../../utils/config.js';
import { applyPalette, defaultSeed, defaultVariant, generatePalette } from '../../utils/theme.js';
import { useScopedSlots } from '../../utils/scoped-slots.js';
const { native, vOutlet } = useScopedSlots();
defineOptions({ inheritAttrs: false });
const props = defineProps({ theme: { type: String, default: '' }, seed: { type: String, default: '' }, variant: { type: String, default: '' }, locale: { type: String, default: '' }, direction: { type: String, default: '' }, reducedMotion: { type: String, default: '' }, defaults: { type: Object, default: () => ({}) } });
const emit = defineEmits(['change']);
const { root, forwardedAttrs } = useNavigationRoot(); const parent = useKimaConfig(root);
const config = computed(() => ({ ...defaultConfig, ...parent.value, ...props.defaults, ...Object.fromEntries(['theme', 'locale', 'direction', 'reducedMotion'].filter((key) => props[key]).map((key) => [key, props[key]])), seed: props.seed || parent.value.seed || defaultSeed, variant: props.variant || parent.value.variant || defaultVariant }));
provide(kimaConfigKey, config);
const paletteOptions = computed(() => ({ isDark: config.value.theme !== 'light', variant: config.value.variant }));
const styles = computed(() => { try { return Object.fromEntries(Object.entries(generatePalette(config.value.seed, paletteOptions.value)).map(([key, value]) => [`--kima-color-${key}`, value])); } catch { return {}; } });
function apply() { if (!root.value) return; try { applyPalette(config.value.seed, { ...paletteOptions.value, target: root.value }); } catch { /* invalid seed retains readable inherited colors */ } }
onMounted(apply); watch(config, (value) => { apply(); emit('change', value); }, { deep: true });
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-config-provider" data-kima-config :data-kima-seed="config.seed" :data-kima-variant="config.variant" :data-kima-theme="config.theme" :data-kima-locale="config.locale" :data-kima-direction="config.direction" :data-kima-reduced-motion="config.reducedMotion" :lang="config.locale" :dir="config.direction" :style="[styles, {colorScheme: config.theme, '--kima-reduced-motion': config.reducedMotion === 'reduce' ? 'reduce' : 'system'}]"><div v-if="native" v-outlet class="kima-config-provider__content" /><slot v-else :config="config" /></div></template>
<style scoped lang="scss">
.kima-config-provider { color: var(--kima-color-on-surface); font-family: var(--kima-font-family); --kima-color-layer-1: color-mix(in srgb, var(--kima-color-on-surface) 5%, transparent); --kima-color-layer-2: color-mix(in srgb, var(--kima-color-on-surface) 10%, transparent); --kima-color-layer-3: color-mix(in srgb, var(--kima-color-on-surface) 15%, transparent); --kima-color-popup: var(--kima-color-surface-container-high); --kima-color-popup-large: var(--kima-color-surface-container-highest); --kima-color-primary-container-hover: color-mix(in srgb, var(--kima-color-primary-container) 90%, var(--kima-color-on-primary-container)); }
.kima-config-provider[data-kima-reduced-motion='reduce'] { --kima-duration-fast: 0ms; --kima-duration-medium: 0ms; --kima-duration-slow: 0ms; --kima-duration-slower: 0ms; --kima-duration-effects: 0ms; }
.kima-config-provider[data-kima-reduced-motion='reduce'] :deep(*) { animation-duration: 0s !important; transition-duration: 0s !important; scroll-behavior: auto !important; }
</style>

