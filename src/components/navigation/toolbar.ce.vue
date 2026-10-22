<!-- 工具栏：插槽内真实按钮/链接的 roving 焦点，跳过禁用项，支持横竖方向。
调用示例：
  <kima-toolbar label="编辑工具"><kima-button>保存</kima-button><kima-button>撤销</kima-button></kima-toolbar>
-->
<script setup>
import { onMounted, onBeforeUnmount, watch } from "vue";
import { useNavigationRoot } from "../../utils/navigation.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ label: { type: String, default: "工具栏" }, orientation: { type: String, default: "horizontal" }, loop: { type: Boolean, default: true }, disabled: Boolean });
const { root, forwardedAttrs } = useNavigationRoot();
const originals = new Map();
let observer;
let current;
function allControls() { return [...(root.value?.querySelectorAll('button,a[href],[role="button"],input,select,textarea,[data-kima-toolbar-item]') || [])].filter((el) => el.closest('[role="toolbar"]') === root.value); }
function enabled() { return allControls().filter((el) => !el.matches(':disabled,[aria-disabled="true"]') && !el.closest('[hidden],[inert]') && el.getClientRects().length); }
function reconcile() {
  const controls = allControls();
  for (const element of controls) if (!originals.has(element)) originals.set(element, element.getAttribute("tabindex"));
  const available = enabled();
  if (!available.includes(current)) current = available[0];
  for (const element of controls) {
    const value = !props.disabled && element === current ? "0" : "-1";
    if (element.getAttribute("tabindex") !== value) element.setAttribute("tabindex", value);
  }
}
function focusin(event) { if (enabled().includes(event.target)) { current = event.target; reconcile(); } }
function keydown(event) {
  if (props.disabled || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
  const controls = enabled();
  const index = controls.indexOf(event.target);
  if (index < 0 || event.target.matches('input,textarea,select,[contenteditable="true"]')) return;
  const vertical = props.orientation === "vertical";
  let step = event.key === (vertical ? "ArrowDown" : "ArrowRight") ? 1 : event.key === (vertical ? "ArrowUp" : "ArrowLeft") ? -1 : 0;
  if (!vertical && getComputedStyle(root.value).direction === "rtl") step *= -1;
  let next;
  if (event.key === "Home") next = 0;
  else if (event.key === "End") next = controls.length - 1;
  else if (step) next = props.loop ? (index + step + controls.length) % controls.length : Math.max(0, Math.min(controls.length - 1, index + step));
  else return;
  event.preventDefault(); current = controls[next]; reconcile(); current?.focus();
}
watch(() => props.disabled, reconcile, { flush: "post" });
onMounted(() => { reconcile(); observer = new MutationObserver(reconcile); observer.observe(root.value, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "aria-disabled", "hidden", "inert", "href"] }); });
onBeforeUnmount(() => { observer?.disconnect(); for (const [el, value] of originals) { if (value === null) el.removeAttribute("tabindex"); else el.setAttribute("tabindex", value); } });
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-toolbar" :class="{ 'kima-toolbar--vertical': orientation === 'vertical' }" role="toolbar" :aria-label="label" :aria-orientation="orientation === 'vertical' ? 'vertical' : 'horizontal'" :aria-disabled="disabled || undefined" :inert="disabled || undefined" @focusin="focusin" @keydown="keydown"><slot /></div></template>
<style scoped lang="scss">
@use "../../styles/navigation" as *;
.kima-toolbar { @include navigation-surface; display: flex; flex-wrap: wrap; align-items: center; gap: var(--kima-space-3); &--vertical { flex-direction: column; align-items: stretch; } }
</style>
