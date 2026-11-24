<!-- 悬浮预览：鼠标延时打开、进入面板保持；键盘聚焦和触屏点击也可访问，Escape 关闭。
只放补充资料，关键操作请用 popover；trigger 插槽不嵌套交互元素。
调用示例：<kima-hover-card label="查看作者" heading="KIMA 团队"><p>专注交互体验。</p></kima-hover-card>
-->
<script setup>
import { useId, watch } from "vue";
import { presenceTransition } from "../../utils/motion.js";
import { HoverCardRoot, HoverCardTrigger, HoverCardContent } from "reka-ui";
import KimaButton from "../core/button.ce.vue";
import { useInteractionRoot, useInteractionModel, usePlacement, dismissInteraction } from "../../utils/interaction.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ open: Boolean, disabled: Boolean, label: { type: String, default: "查看预览" }, heading: { type: String, default: "预览" }, openDelay: { type: Number, default: 400 }, closeDelay: { type: Number, default: 250 }, placement: { type: String, default: "bottom-start" } });
const emit = defineEmits(["update:open"]);
const { root, forwardedAttrs } = useInteractionRoot();
const [localOpen, updateOpen] = useInteractionModel(props, "open", emit);
const position = usePlacement(props);
const id = `kima-hover-card-${useId()}`;
function setOpen(value) { if (!value || !props.disabled) updateOpen(value); }
watch(() => props.disabled, (value) => { if (value) updateOpen(false); });
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-hover-card">
    <HoverCardRoot :open="localOpen && !disabled" :open-delay="openDelay" :close-delay="closeDelay" @update:open="setOpen">
      <HoverCardTrigger as-child><KimaButton variant="text" :disabled="disabled" :aria-expanded="localOpen && !disabled" :aria-controls="localOpen ? id : undefined" @click="setOpen(!localOpen)" @keydown.esc.stop.prevent="setOpen(false)"><slot name="trigger">{{ label }}</slot></KimaButton></HoverCardTrigger>
      <Transition name="kima-popup" v-bind="presenceTransition"><HoverCardContent v-if="localOpen && !disabled" :id="id" force-mount v-bind="position" class="kima-hover-card__popup" role="region" :aria-label="heading" @escape-key-down="(event) => dismissInteraction(event, () => setOpen(false))"><h3>{{ heading }}</h3><slot /></HoverCardContent></Transition>
    </HoverCardRoot>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/mixins" as *;
.kima-hover-card { min-width: 0;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-body-medium);
  line-height: 1.5; display: inline-block; }
/* 传送到 body 的内容拿不到 data-v，表面规则按类名全局命中。 */
:global(.kima-hover-card__popup) { min-width: 0;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-body-medium);
  line-height: 1.5;
  @include kima-popup;
  box-sizing: border-box;
  z-index: 60;
  width: min(360px, calc(100vw - 24px));
  max-height: min(70vh, var(--reka-popper-available-height, 70vh));
  overflow: auto;
  padding: var(--kima-space-4);
  border-radius: var(--kima-radius-l);
  outline: none; h3 { margin: 0 0 var(--kima-space-3); } }
</style>
