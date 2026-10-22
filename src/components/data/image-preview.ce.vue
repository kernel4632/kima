<!-- 图片预览：触发内容使用 KimaImage；打开后提供受控 dialog、焦点恢复、Esc/方向键、缩放/旋转/重置。 -->
<script setup>
import { presenceTransition } from "../../utils/motion.js";
import { computed, nextTick, onBeforeUnmount, ref, watch, useAttrs, useHost, getCurrentInstance } from "vue";
import KimaImage from "../display/image.ce.vue";
import KimaIconButton from "../core/icon-button.ce.vue";
import { ArrowLeft01Icon, ArrowRight01Icon, Cancel01Icon, Refresh01Icon, RotateRight01Icon, ZoomInAreaIcon, ZoomOutAreaIcon } from "@hugeicons/core-free-icons";
import { useNativeSlots } from "../../utils/native-slots.js";

 defineOptions({ inheritAttrs: false });
const props = defineProps({
  src: { type: String, default: "" },
  alt: { type: String, default: "" },
  items: { type: Array, default: () => [] },
  open: Boolean,
  index: { type: Number, default: 0 },
  caption: { type: String, default: "" },
});
const emit = defineEmits(["update:open", "update:index", "change", "close"]);
const attrs = useAttrs();
const host = getCurrentInstance()?.ce ? useHost() : null;
const root = ref(null);
const dialog = ref(null);
const overlay = ref(null);
const trigger = ref(null);
useNativeSlots(root);
const localOpen = ref(props.open);
let returnFocus = null;
let backgroundState = null;
const activeIndex = ref(Math.max(0, props.index));
const scale = ref(1);
const rotation = ref(0);
const entries = computed(() => props.items.length ? props.items : [{ src: props.src, alt: props.alt, caption: props.caption }]);
const current = computed(() => entries.value[Math.min(activeIndex.value, Math.max(0, entries.value.length - 1))] || {});
const currentSrc = computed(() => typeof current.value === "string" ? current.value : current.value.src || "");
const currentAlt = computed(() => typeof current.value === "string" ? "" : current.value.alt || props.alt);
const currentCaption = computed(() => typeof current.value === "string" ? "" : current.value.caption || "");
const forwardedAttrs = computed(() => host ? { ...attrs, id: undefined } : attrs);
const focusableSelector = "button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])";
watch(() => props.open, (value) => { if (value && !localOpen.value) rememberFocus(); localOpen.value = value; if (value) focusDialog(); });
watch(() => props.index, (value) => { activeIndex.value = Math.max(0, Math.min(Number(value) || 0, entries.value.length - 1)); });
watch(localOpen, (value) => { if (value) { rememberFocus(); focusDialog(); } });
function rememberFocus() { returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : trigger.value; }
function focusDialog() { nextTick(() => { if (localOpen.value) dialog.value?.focus(); }); }
function setBackgroundInert() {
  const body = root.value?.ownerDocument?.body;
  if (!body || backgroundState) return;
  backgroundState = [...body.children].filter((element) => element !== overlay.value).map((element) => ({ element, inert: element.inert }));
  for (const { element } of backgroundState) element.inert = true;
}
function restoreBackground() {
  if (!backgroundState) return;
  for (const { element, inert } of backgroundState) if (element.isConnected) element.inert = inert;
  backgroundState = null;
}
function enterModal(element) {
  overlay.value = element;
  element.inert = false;
  element.removeAttribute("aria-hidden");
  const panel = element.querySelector('[role="dialog"]');
  if (panel) { panel.inert = false; panel.removeAttribute("aria-hidden"); }
  setBackgroundInert();
  focusDialog();
}
function beforeLeave(element) {
  element.inert = true;
  element.setAttribute("aria-hidden", "true");
  const panel = element.querySelector('[role="dialog"]');
  if (panel) { panel.inert = true; panel.setAttribute("aria-hidden", "true"); }
}
function afterLeave() { if (!localOpen.value) { restoreBackground(); returnFocus?.focus?.({ preventScroll: true }); returnFocus = null; } }
function close(reason = "button") { localOpen.value = false; emit("update:open", false); emit("close", reason); }
function choose(index) { if (!entries.value.length) return; activeIndex.value = (index + entries.value.length) % entries.value.length; scale.value = 1; rotation.value = 0; emit("update:index", activeIndex.value); emit("change", activeIndex.value, current.value); }
function reset() { scale.value = 1; rotation.value = 0; }
function handleKeydown(event) {
  if (!localOpen.value) return;
  if (event.key === "Escape") { event.preventDefault(); close("escape"); }
  else if (event.key === "Tab") {
    const controls = [...dialog.value.querySelectorAll(focusableSelector)].filter((element) => !element.closest("[inert]"));
    if (!controls.length) return;
    const currentIndex = controls.indexOf(document.activeElement);
    const nextIndex = event.shiftKey
      ? (currentIndex <= 0 ? controls.length - 1 : currentIndex - 1)
      : (currentIndex < 0 || currentIndex === controls.length - 1 ? 0 : currentIndex + 1);
    if (currentIndex < 0 || currentIndex === 0 || currentIndex === controls.length - 1) event.preventDefault();
    controls[nextIndex].focus();
  }
  else if (event.key === "ArrowRight" && entries.value.length > 1) { event.preventDefault(); choose(activeIndex.value + 1); }
  else if (event.key === "ArrowLeft" && entries.value.length > 1) { event.preventDefault(); choose(activeIndex.value - 1); }
  else if (event.key === "Home" && entries.value.length > 1) { event.preventDefault(); choose(0); }
  else if (event.key === "End" && entries.value.length > 1) { event.preventDefault(); choose(entries.value.length - 1); }
}
onBeforeUnmount(() => {
  restoreBackground();
  if (!localOpen.value) returnFocus?.focus?.({ preventScroll: true });
  returnFocus = null;
});
</script>
<template>
  <span ref="root" v-bind="forwardedAttrs" class="kima-image-preview">
    <button ref="trigger" class="kima-image-preview__trigger" type="button" :aria-label="`预览${alt || '图片'}`" @click="localOpen = true; emit('update:open', true)"><KimaImage :src="src" :alt="alt" :caption="caption"><template #caption><slot name="caption" /></template></KimaImage></button>
    <Teleport to="body">
      <Transition name="kima-popup" v-bind="presenceTransition" @before-enter="enterModal" @before-leave="beforeLeave" @after-leave="afterLeave">
        <div v-if="localOpen" ref="overlay" class="kima-image-preview__overlay" role="presentation" @click.self="close('backdrop')">
          <div ref="dialog" class="kima-image-preview__dialog" role="dialog" aria-modal="true" :aria-label="currentAlt || '图片预览'" tabindex="-1" @keydown="handleKeydown">
            <header class="kima-image-preview__toolbar">
              <span class="kima-image-preview__count" aria-live="polite">{{ entries.length > 1 ? `${activeIndex + 1} / ${entries.length}` : '' }}</span>
              <div class="kima-image-preview__actions">
                <KimaIconButton :icon="ZoomOutAreaIcon" label="缩小" :disabled="scale <= .5" @click="scale = Math.max(.5, scale - .25)" />
                <KimaIconButton :icon="ZoomInAreaIcon" label="放大" :disabled="scale >= 3" @click="scale = Math.min(3, scale + .25)" />
                <KimaIconButton :icon="RotateRight01Icon" label="旋转" @click="rotation = (rotation + 90) % 360" />
                <KimaIconButton :icon="Refresh01Icon" label="重置视图" @click="reset" />
                <KimaIconButton :icon="Cancel01Icon" label="关闭预览" @click="close()" />
              </div>
            </header>
            <div class="kima-image-preview__stage">
              <KimaIconButton v-if="entries.length > 1" class="kima-image-preview__prev" :icon="ArrowLeft01Icon" label="上一张" @click="choose(activeIndex - 1)" />
              <img class="kima-image-preview__image" :src="currentSrc" :alt="currentAlt" :style="{ transform: `scale(${scale}) rotate(${rotation}deg)` }" />
              <KimaIconButton v-if="entries.length > 1" class="kima-image-preview__next" :icon="ArrowRight01Icon" label="下一张" @click="choose(activeIndex + 1)" />
            </div>
            <p v-if="currentCaption" class="kima-image-preview__caption">{{ currentCaption }}</p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </span>
</template>
<style scoped lang="scss">
.kima-image-preview { display: inline-block; max-width: 100%; }
.kima-image-preview__trigger { display: block; max-width: 100%; padding: 0; border: 0; border-radius: var(--kima-radius-m); color: inherit; background: var(--kima-color-transparent); cursor: zoom-in; }
.kima-image-preview__trigger:focus-visible { outline: 2px solid var(--kima-color-primary); outline-offset: 3px; }
.kima-image-preview__overlay { position: fixed; z-index: 1200; inset: 0; display: grid; place-items: center; padding: var(--kima-space-4); background: color-mix(in srgb, var(--kima-color-scrim, var(--kima-color-on-surface)) 70%, transparent); }
.kima-image-preview__dialog { display: grid; width: min(100%, 1200px); max-height: 100%; grid-template-rows: auto minmax(0, 1fr) auto; color: var(--kima-color-on-surface); background: var(--kima-color-popup-large); border-radius: var(--kima-radius-l); outline: none; overflow: hidden; }
.kima-image-preview__toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--kima-space-3); padding: var(--kima-space-3) var(--kima-space-4); }
.kima-image-preview__actions { display: flex; flex-wrap: wrap; gap: var(--kima-space-1); }
.kima-image-preview__count { color: var(--kima-color-on-surface-variant); }
.kima-image-preview__stage { position: relative; display: grid; min-height: min(65vh, 640px); place-items: center; overflow: auto; background: var(--kima-color-surface); }
.kima-image-preview__image { display: block; max-width: 90%; max-height: 62vh; object-fit: contain; transition: transform var(--kima-duration-medium) var(--kima-curve-emphasized); }
.kima-image-preview__prev, .kima-image-preview__next { position: absolute; top: 50%; z-index: 1; transform: translateY(-50%); }
.kima-image-preview__prev { left: var(--kima-space-4); } .kima-image-preview__next { right: var(--kima-space-4); }
.kima-image-preview__caption { margin: 0; padding: var(--kima-space-3) var(--kima-space-4); color: var(--kima-color-on-surface-variant); text-align: center; }
@media (prefers-reduced-motion: reduce) { .kima-image-preview__image { transition: none; } }
</style>
