<!-- 双面板分栏：pointer 捕获拖拽、键盘调整、百分比 min/max 和数值同步。
调用示例：
  <kima-splitter v-model="size" :min="20" :max="80"><template #first>目录</template><template #second>正文</template></kima-splitter>
-->
<script setup>
import { computed, ref, useId, watch, onBeforeUnmount } from "vue";
import { useNavigationModel, useNavigationRoot } from "../../utils/navigation.js";
import { useRipple } from "../../utils/ripple.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ modelValue: { type: Number, default: 40 }, min: { type: Number, default: 15 }, max: { type: Number, default: 85 }, step: { type: Number, default: 5 }, orientation: { type: String, default: "horizontal" }, disabled: Boolean, label: { type: String, default: "调整面板大小" } });
const emit = defineEmits(["update:modelValue", "change", "resize-start", "resize-end"]);
const { root, forwardedAttrs } = useNavigationRoot();
const [local, update] = useNavigationModel(props, "modelValue", emit);
const handle = ref(null);
useRipple(handle);
const id = `kima-splitter-${useId()}`;
const lower = computed(() => Math.min(100, Math.max(0, Number(props.min) || 0)));
const upper = computed(() => Math.max(lower.value, Math.min(100, Number.isFinite(props.max) ? props.max : 100)));
const vertical = computed(() => props.orientation === "vertical");
const size = computed(() => clamp(local.value));
const panelStyle = computed(() => ({ flexBasis: `calc((100% - 48px) * ${size.value / 100})` }));
let drag;
function clamp(value) { return Math.min(upper.value, Math.max(lower.value, Number.isFinite(Number(value)) ? Number(value) : 40)); }
function set(value) { if (!props.disabled) update(Math.round(clamp(value) * 100) / 100); }
function down(event) {
  if (props.disabled || event.button !== 0 || drag) return;
  event.preventDefault();
  const rect = root.value.getBoundingClientRect();
  const available = (vertical.value ? rect.height : rect.width) - 48;
  if (available <= 0) return;
  drag = { id: event.pointerId, position: vertical.value ? event.clientY : event.clientX, size: size.value, available, direction: !vertical.value && getComputedStyle(root.value).direction === "rtl" ? -1 : 1 };
  event.currentTarget.setPointerCapture(event.pointerId);
  emit("resize-start", size.value);
}
function move(event) { if (!drag || drag.id !== event.pointerId) return; const position = vertical.value ? event.clientY : event.clientX; set(drag.size + (position - drag.position) / drag.available * 100 * drag.direction); }
function end(event) { if (!drag || (event && event.pointerId !== drag.id)) return; const id = drag.id; drag = undefined; if (handle.value?.hasPointerCapture(id)) handle.value.releasePointerCapture(id); emit("resize-end", size.value); }
function keydown(event) {
  if (props.disabled || event.isComposing) return;
  const forward = vertical.value ? "ArrowDown" : "ArrowRight";
  const backward = vertical.value ? "ArrowUp" : "ArrowLeft";
  let amount = Math.max(0.1, Number(props.step) || 5) * (event.shiftKey ? 2 : 1);
  if (!vertical.value && getComputedStyle(root.value).direction === "rtl") amount *= -1;
  if (event.key === "Home") set(lower.value);
  else if (event.key === "End") set(upper.value);
  else if (event.key === forward) set(size.value + amount);
  else if (event.key === backward) set(size.value - amount);
  else return;
  event.preventDefault();
}
watch(() => [props.disabled, props.orientation], () => end());
onBeforeUnmount(() => end());
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-splitter" :class="{ 'kima-splitter--vertical': vertical }"><section :id="`${id}-first`" class="kima-splitter__panel kima-splitter__panel--first" :style="panelStyle"><slot name="first" /></section><div ref="handle" class="kima-splitter__handle" role="separator" :tabindex="disabled ? -1 : 0" :aria-label="label" :aria-controls="`${id}-first ${id}-second`" :aria-orientation="vertical ? 'horizontal' : 'vertical'" :aria-valuenow="size" :aria-valuemin="lower" :aria-valuemax="upper" :aria-valuetext="`${size}%`" :aria-disabled="disabled || undefined" @pointerdown="down" @pointermove="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end" @keydown="keydown"><span aria-hidden="true"></span></div><section :id="`${id}-second`" class="kima-splitter__panel"><slot name="second" /></section></div></template>
<style scoped lang="scss">
@use "../../styles/navigation" as *;
.kima-splitter { @include navigation-root; display: flex; min-height: 260px; width: 100%; &--vertical { flex-direction: column; height: 420px; } &__panel { min-width: 0; min-height: 0; flex: 1 1 0; overflow: auto; padding: var(--kima-space-4); box-sizing: border-box; border-radius: var(--kima-radius-m); background: var(--kima-color-layer-1); } &__panel--first { flex-grow: 0; flex-shrink: 0; } &__handle { @include navigation-action; flex: 0 0 48px; width: 48px; padding: 0; justify-content: center; cursor: col-resize; touch-action: none; user-select: none; span { width: 4px; height: 40px; border-radius: var(--kima-radius-full); background: var(--kima-color-outline); } } &--vertical &__handle { width: 100%; height: 48px; cursor: row-resize; span { width: 40px; height: 4px; } } }
</style>
