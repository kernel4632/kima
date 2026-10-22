<!-- 可选跑马灯：默认静态；animated 开启运动，hover/focus/暂停按钮可停，减少动效始终静止；副本 inert 且移除 ID。
调用示例：<kima-marquee animated :duration="24"><a href="#news">更新消息</a></kima-marquee>
-->
<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import KimaButton from './button.ce.vue';
import { useNavigationRoot } from '../utils/navigation.js';
import { useShellModel } from '../utils/shell.js';
import { useKimaConfig } from '../utils/config.js';
import { prefersReducedMotion } from '../utils/motion.js';
import { useScopedSlots } from '../utils/scoped-slots.js';
const { native, vOutlet } = useScopedSlots();
defineOptions({ inheritAttrs: false });
const props = defineProps({ animated: Boolean, paused: Boolean, duration: { type: Number, default: 24 }, reverse: Boolean, label: { type: String, default: '滚动内容' } });
const emit = defineEmits(['update:paused']);
const { root, forwardedAttrs } = useNavigationRoot(); const config = useKimaConfig(root); const [paused, pause] = useShellModel(props, 'paused', emit);
const source = ref(null); const duplicate = ref(null); const hovered = ref(false); const focused = ref(false); const reduced = ref(false); let media; let observer;
const moving = computed(() => props.animated && !reduced.value && config.value.reducedMotion !== 'reduce');
const stopped = computed(() => paused.value || hovered.value || focused.value || !moving.value);
function clone() { if (!source.value || !duplicate.value) return; const nodes = [...source.value.childNodes].map((node) => node.cloneNode(true)); duplicate.value.replaceChildren(...nodes); for (const node of duplicate.value.querySelectorAll('*')) { node.removeAttribute('id'); node.removeAttribute('name'); node.setAttribute('tabindex', '-1'); } }
function mediaChanged() { reduced.value = prefersReducedMotion(root.value); }
onMounted(() => { media = root.value.ownerDocument.defaultView.matchMedia('(prefers-reduced-motion: reduce)'); media.addEventListener('change', mediaChanged); mediaChanged(); observer = new MutationObserver(clone); observer.observe(source.value, { childList: true, subtree: true, characterData: true }); clone(); });
watch(moving, () => nextTick(clone));
onBeforeUnmount(() => { observer?.disconnect(); media?.removeEventListener('change', mediaChanged); });
</script>
<template><section ref="root" v-bind="forwardedAttrs" class="kima-marquee" :aria-label="label" @pointerenter="hovered = true" @pointerleave="hovered = false" @focusin="focused = true" @focusout="(e) => { if (!root.contains(e.relatedTarget)) focused = false; }">
  <KimaButton v-show="animated" variant="text" :aria-pressed="paused" :disabled="!moving" @click="pause(!paused)">{{ paused || !moving ? '继续滚动' : '暂停滚动' }}</KimaButton>
  <div class="kima-marquee__viewport"><div class="kima-marquee__track" :class="{'kima-marquee__track--moving': moving}" :style="{animationDuration: `${Math.max(1, duration)}s`, animationDirection: reverse ? 'reverse' : 'normal', animationPlayState: stopped ? 'paused' : 'running'}"><div v-if="native" ref="source" v-outlet class="kima-marquee__group" /><div v-else ref="source" class="kima-marquee__group"><slot /></div><div v-show="moving" ref="duplicate" class="kima-marquee__group" aria-hidden="true" inert /></div></div>
</section></template>
<style scoped lang="scss">
.kima-marquee { min-width: 0; color: var(--kima-color-on-surface); &__viewport { overflow: hidden; } &__track { display: flex; width: max-content; max-width: 100%; &--moving { max-width: none; animation: kima-marquee-scroll linear infinite; } } &__group { display: flex; flex: 0 0 auto; align-items: center; gap: var(--kima-space-6); padding-inline-end: var(--kima-space-6); } }
@keyframes kima-marquee-scroll { to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .kima-marquee__track { animation: none !important; transform: none !important; } }
@media (forced-colors: active) { .kima-marquee__track { animation: none; } }
</style>
