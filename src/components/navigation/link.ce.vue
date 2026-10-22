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
@use "../../styles/navigation" as *;
.kima-link { @include navigation-root; @include navigation-action; padding-inline: var(--kima-space-2); text-decoration: none; overflow-wrap: anywhere; &--underline { text-decoration: underline; text-underline-offset: .2em; } &[aria-current] { @include navigation-current; } }
</style>
