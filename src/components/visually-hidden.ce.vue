<!-- 视觉隐藏辅助：文字保留在无障碍树中，可选聚焦时显示；不是分隔线。
调用示例：
  <kima-visually-hidden>仅供读屏的补充说明</kima-visually-hidden>
-->
<script setup>
import { useNavigationRoot } from "../utils/navigation.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ focusable: Boolean });
const { root, forwardedAttrs } = useNavigationRoot();
</script>
<template><span ref="root" v-bind="forwardedAttrs" class="kima-visually-hidden" :class="{ 'kima-visually-hidden--focusable': focusable }"><slot /></span></template>
<style scoped lang="scss">
.kima-visually-hidden:not(.kima-visually-hidden--focusable:focus-within) { position: absolute !important; width: 1px !important; height: 1px !important; padding: 0 !important; margin: -1px !important; overflow: hidden !important; clip-path: inset(50%) !important; white-space: nowrap !important; border: 0 !important; }
</style>
