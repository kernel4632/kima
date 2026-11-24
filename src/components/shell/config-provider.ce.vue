<!-- 局部配置：locale/direction/reducedMotion 由 Vue inject 或 DOM observer 读取。
颜色不由库控制：组件跟随系统配色（color-scheme），局部想固定深浅时用 colorScheme 属性。
调用示例：<kima-config-provider locale="zh-CN" direction="ltr" reduced-motion="reduce"><kima-button>局部配置</kima-button></kima-config-provider>
-->
<script setup>
import { computed, provide } from 'vue';
import { useNavigationRoot } from '../../utils/navigation.js';
import { defaultConfig, kimaConfigKey, useKimaConfig } from '../../utils/config.js';
import { useScopedSlots } from '../../utils/scoped-slots.js';
const { native, vOutlet } = useScopedSlots();
defineOptions({ inheritAttrs: false });
const props = defineProps({ locale: { type: String, default: '' }, direction: { type: String, default: '' }, reducedMotion: { type: String, default: '' }, colorScheme: { type: String, default: '' }, defaults: { type: Object, default: () => ({}) } });
const emit = defineEmits(['change']);
const { root, forwardedAttrs } = useNavigationRoot(); const parent = useKimaConfig(root);
const config = computed(() => ({ ...defaultConfig, ...parent.value, ...props.defaults, ...Object.fromEntries(['locale', 'direction', 'reducedMotion', 'colorScheme'].filter((key) => props[key]).map((key) => [key, props[key]])) }));
provide(kimaConfigKey, config);
function emitChange() { emit('change', config.value); }
defineExpose({ config });
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-config-provider" data-kima-config :data-kima-locale="config.locale" :data-kima-direction="config.direction" :data-kima-reduced-motion="config.reducedMotion" :lang="config.locale" :dir="config.direction" :style="{ colorScheme: config.colorScheme || undefined, '--kima-reduced-motion': config.reducedMotion === 'reduce' ? 'reduce' : 'system' }" @vue:mounted="emitChange"><div v-if="native" v-outlet class="kima-config-provider__content" /><slot v-else :config="config" /></div></template>
<style scoped lang="scss">
.kima-config-provider { color: var(--kima-color-on-surface); font-family: var(--kima-font-family); }
.kima-config-provider[data-kima-reduced-motion='reduce'] { --kima-duration-fast: 0ms; --kima-duration-medium: 0ms; --kima-duration-slow: 0ms; --kima-duration-slower: 0ms; --kima-duration-effects: 0ms; }
.kima-config-provider[data-kima-reduced-motion='reduce'] :deep(*) { animation-duration: 0s !important; transition-duration: 0s !important; scroll-behavior: auto !important; }
</style>
