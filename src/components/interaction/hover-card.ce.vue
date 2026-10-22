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
@use "../../styles/interaction" as *;
.kima-hover-card { @include interaction-root; display: inline-block; }
:deep(.kima-hover-card__popup) { @include interaction-popup; h3 { margin: 0 0 var(--kima-space-3); } }
</style>
