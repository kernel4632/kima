<script setup>
import { computed, ref, watch } from "vue";
import { useInputAttrs, useInputState } from "../../utils/input-state.js";
import { useRipple } from "../../utils/ripple.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: { type: String, default: "#61afef" }, label: { type: String, default: "颜色" }, name: String, disabled: Boolean, readonly: Boolean, required: Boolean });
const emit = defineEmits(["update:modelValue", "change"]);
const root = ref(null), hex = ref(null), nativeColor = ref(null);
const { attrs, controlAttrs } = useInputAttrs();
function clamp(n, min = 0, max = 1) { return Math.max(min, Math.min(max, n)); }
function hexToRgb(value) {
  let v = String(value || "").replace("#", "");
  if (v.length === 3) v = [...v].map((c) => c + c).join("");
  if (!/^(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v)) return null;
  return { r: parseInt(v.slice(0, 2), 16), g: parseInt(v.slice(2, 4), 16), b: parseInt(v.slice(4, 6), 16), a: v.length === 8 ? parseInt(v.slice(6, 8), 16) / 255 : 1 };
}
function rgbToHsv({ r, g, b, a = 1 }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) { if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return { h, s: max ? d / max : 0, v: max, a };
}
function hsvToRgb({ h, s, v, a = 1 }) {
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x]; else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255), a };
}
function toHex(rgb, alpha = false) {
  const out = [rgb.r, rgb.g, rgb.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  return `#${out}${alpha ? Math.round(clamp(rgb.a) * 255).toString(16).padStart(2, "0") : ""}`;
}
const hsv = ref(rgbToHsv(hexToRgb(props.modelValue) || { r: 97, g: 175, b: 239, a: 1 }));
const draft = ref(toHex(hsvToRgb(hsv.value), hsv.value.a < 1));
const { local, update } = useInputState(props, emit, root, (v) => hexToRgb(v) ? toHex(hexToRgb(v), hexToRgb(v).a < 1) : "#61afef", sync);
useRipple(root);
function sync(value) {
  const color = hexToRgb(value);
  if (!color) return;
  hsv.value = rgbToHsv(color);
  draft.value = toHex(color, color.a < 1);
  hex.value?.setCustomValidity("");
  if (nativeColor.value) nativeColor.value.value = toHex(color).slice(0, 7);
}
watch(local, sync);
function commit(value, change = true) {
  if (props.disabled || props.readonly) return;
  const color = hexToRgb(value);
  if (!color) { hex.value?.setCustomValidity("请输入六位 HEX 颜色"); return; }
  hex.value?.setCustomValidity("");
  const output = toHex(color, color.a < 1);
  draft.value = output;
  update(output, change);
}
function setFromHsv(next, change = true) { if (props.disabled || props.readonly) return; hsv.value = { ...hsv.value, ...next }; const output = toHex(hsvToRgb(hsv.value), hsv.value.a < 1); draft.value = output; update(output, change); }
function area(event) { const rect = event.currentTarget.getBoundingClientRect(); setFromHsv({ s: clamp((event.clientX - rect.left) / rect.width), v: clamp(1 - (event.clientY - rect.top) / rect.height) }, false); }
function hue(event) { const rect = event.currentTarget.getBoundingClientRect(); setFromHsv({ h: clamp((event.clientY - rect.top) / rect.height, 0, 1) * 360 }, false); }
function alpha(event) { const rect = event.currentTarget.getBoundingClientRect(); setFromHsv({ a: clamp((event.clientX - rect.left) / rect.width) }, false); }
function sliderKey(event, field, step) {
  const key = event.key;
  if (props.disabled || props.readonly || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) return;
  event.preventDefault();
  const dir = key === 'ArrowRight' || key === 'ArrowUp' ? 1 : -1;
  setFromHsv({ [field]: key === 'Home' ? 0 : key === 'End' ? (field === 'h' ? 359 : 1) : clamp(hsv.value[field] + dir * step, 0, field === 'h' ? 359 : 1) });
}
function areaKey(event) {
  if (props.disabled || props.readonly || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
  event.preventDefault();
  const horizontal = ['ArrowLeft', 'ArrowRight'].includes(event.key);
  const field = horizontal ? 's' : 'v';
  const direction = ['ArrowRight', 'ArrowUp'].includes(event.key) ? 1 : -1;
  setFromHsv({ [field]: clamp(hsv.value[field] + direction * .01) });
}
function startPointer(event, move) {
  if (props.disabled || props.readonly) return;
  event.currentTarget.setPointerCapture(event.pointerId);
  move(event);
}
function setNativeColor(event) { const color = hexToRgb(event.target.value); if (color) commit(toHex(color), true); }
const rgb = computed(() => hsvToRgb(hsv.value));
const hsl = computed(() => {
  let { r, g, b } = rgb.value; r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min, s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  let h = 0;
  if (d) { if (max === r) h = 60 * ((g - b) / d % 6); else if (max === g) h = 60 * ((b - r) / d + 2); else h = 60 * ((r - g) / d + 4); if (h < 0) h += 360; }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
});
</script>
<template>
  <div ref="root" :class="['kima-color-picker', attrs.class]" :style="attrs.style">
    <div class="kima-color-picker__editor">
      <div class="kima-color-picker__area" role="slider" :tabindex="disabled ? -1 : 0" :aria-disabled="disabled" :aria-readonly="readonly" :aria-label="`${label}饱和度和明度`" :aria-valuetext="`S ${Math.round(hsv.s * 100)}%, V ${Math.round(hsv.v * 100)}%`" :style="{ background: `linear-gradient(to top,var(--kima-color-picker-black),var(--kima-color-transparent)),linear-gradient(to right,var(--kima-color-picker-white),hsl(${hsv.h} 100% 50%))` }" @pointerdown="e => startPointer(e, area)" @pointermove="e => e.buttons && area(e)" @keydown="areaKey"><span :style="{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }"></span></div>
      <div class="kima-color-picker__hue" role="slider" :tabindex="disabled ? -1 : 0" :aria-disabled="disabled" :aria-readonly="readonly" aria-label="色相" :aria-valuemin="0" :aria-valuemax="359" :aria-valuenow="hsv.h" @pointerdown="e => startPointer(e, hue)" @pointermove="e => e.buttons && hue(e)" @keydown="e => sliderKey(e, 'h', 1)"><span :style="{ top: `${hsv.h / 360 * 100}%` }"></span></div>
    </div>
    <div class="kima-color-picker__alpha" role="slider" :tabindex="disabled ? -1 : 0" :aria-disabled="disabled" :aria-readonly="readonly" aria-label="透明度" aria-valuemin="0" aria-valuemax="1" :aria-valuenow="hsv.a" @pointerdown="e => startPointer(e, alpha)" @pointermove="e => e.buttons && alpha(e)" @keydown="e => sliderKey(e, 'a', .01)"><span :style="{ left: `${hsv.a * 100}%` }"></span></div>
    <div class="kima-color-picker__inputs">
      <input ref="nativeColor" class="kima-color-picker__native" type="color" :value="toHex(rgb).slice(0, 7)" :aria-label="`${label}颜色选择器`" :disabled="disabled || readonly" @input="setNativeColor">
      <input ref="hex" v-bind="controlAttrs" class="kima-color-picker__hex" type="text" :value="draft" :name="name" :aria-label="controlAttrs['aria-label'] || label" :disabled="disabled" :readonly="readonly" :required="required" pattern="#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?" maxlength="9" @input.stop="draft = $event.target.value; commit(draft, false)" @change.stop="commit(draft, true)">
    </div>
    <output>RGB {{ rgb.r }}, {{ rgb.g }}, {{ rgb.b }} · HSL {{ hsl.h }}°, {{ hsl.s }}%, {{ hsl.l }}%</output>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/input" as *;
@use "../../styles/mixins" as *;
.kima-color-picker { @include input-root; display: grid; gap: var(--kima-space-3); &__editor { display: grid; grid-template-columns: 1fr 28px; gap: var(--kima-space-3); min-width: 220px; } &__area { position: relative; min-height: 220px; border-radius: var(--kima-radius-m); cursor: crosshair; touch-action: none; &:focus-visible { outline: var(--kima-focus-ring-width) solid var(--kima-color-primary); outline-offset: var(--kima-focus-ring-offset); } span, &__hue span, &__alpha span { position: absolute; width: 20px; height: 20px; border: 3px solid var(--kima-color-on-surface); border-radius: 50%; box-shadow: 0 0 0 2px var(--kima-color-surface); transform: translate(-50%, -50%); } } &__hue { position: relative; border-radius: var(--kima-radius-m); background: linear-gradient(to bottom, var(--kima-color-picker-red), var(--kima-color-picker-yellow), var(--kima-color-picker-green), var(--kima-color-picker-cyan), var(--kima-color-picker-blue), var(--kima-color-picker-magenta), var(--kima-color-picker-red)); touch-action: none; &:focus-visible { outline: var(--kima-focus-ring-width) solid var(--kima-color-primary); } span { left: 50%; } } &__alpha { position: relative; height: 20px; border-radius: var(--kima-radius-s); background: linear-gradient(to right, var(--kima-color-transparent), var(--kima-color-on-surface)); touch-action: none; &:focus-visible { outline: var(--kima-focus-ring-width) solid var(--kima-color-primary); } span { top: 50%; } } &__inputs { display: grid; grid-template-columns: 48px 1fr; gap: var(--kima-space-2); align-items: center; } &__native { width: 48px; height: 48px; padding: 4px; border: 0; border-radius: var(--kima-radius-s); background: var(--kima-color-layer-1); cursor: pointer; &:focus-visible { outline: var(--kima-focus-ring-width) solid var(--kima-color-primary); } } &__hex { @include input-surface; @include input-control; width: 100%; font-variant-numeric: tabular-nums; } output { color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-small); } }
</style>
