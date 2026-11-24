<!-- 文本链接：真实 href 导航、禁用拦截、新窗口安全关系与统一交互反馈。
调用示例：
  <kima-link href="https://reka-ui.com" target="_blank">阅读文档</kima-link>
-->
<script setup>
import { computed } from "vue";
import { useNavigationRoot } from "../../utils/navigation.js";
import { useRipple } from "../../utils/ripple.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ href: { type: String, default: "" }, target: { type: String, default: "" }, rel: { type: String, default: "" }, disabled: Boolean, current: { type: [Boolean, String], default: false }, underline: { type: Boolean, default: true } });
const emit = defineEmits(["navigate"]);
const { root, forwardedAttrs } = useNavigationRoot();
useRipple(root);
const safeRel = computed(() => [...new Set(`${props.rel} ${props.target === "_blank" ? "noopener noreferrer" : ""}`.split(/\s+/).filter(Boolean))].join(" ") || undefined);
function navigate(event) { if (props.disabled) { event.preventDefault(); event.stopImmediatePropagation(); return; } emit("navigate", event); }
</script>
<template><a ref="root" v-bind="forwardedAttrs" class="kima-link" :class="{ 'kima-link--underline': underline }" :href="disabled ? undefined : href || undefined" :target="target || undefined" :rel="safeRel" :aria-disabled="disabled || undefined" :aria-current="current ? (typeof current === 'string' ? current : 'page') : undefined" :tabindex="disabled ? -1 : undefined" @click="navigate"><slot /></a></template>
<style scoped lang="scss">
@use "../../styles/mixins" as *;
.kima-link { box-sizing: border-box;
  min-width: 0;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-weight: var(--kima-font-weight-semi-bold);
  font-size: var(--kima-font-size-body-large); @include kima-state-layer;
  @include kima-focus-ring;
  @include kima-ripple-host;
  @include kima-disabled;
  display: inline-flex;
  align-items: center;
  gap: var(--kima-space-2);
  min-height: 48px;
  box-sizing: border-box;
  padding: var(--kima-space-2) var(--kima-space-4);
  border: 0;
  border-radius: var(--kima-radius-m);
  color: var(--kima-color-primary);
  background: transparent;
  font: inherit;
  cursor: pointer;
  transition: background-color var(--kima-duration-effects) var(--kima-curve-standard), color var(--kima-duration-effects) var(--kima-curve-standard); padding-inline: var(--kima-space-2); text-decoration: none; overflow-wrap: anywhere; &--underline { text-decoration: underline; text-underline-offset: .2em; } &[aria-current] { color: var(--kima-color-on-primary-container);
  background: var(--kima-color-primary-container);
  &:hover { background: var(--kima-color-primary-container-hover); } } }
</style>
