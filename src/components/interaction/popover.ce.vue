<!-- 锚定弹层：非模态交互面板，自动翻转、焦点进入/返回、Escape 与点击外部关闭；不传送到 body，兼容原生 dialog 顶层。
trigger 插槽只放文字/图标，不嵌套按钮；需要交互的内容放 default 插槽。placement 支持四方向和 start/end。
调用示例：<kima-popover label="项目详情" content-label="项目信息"><p>当前项目已经同步。</p><a href="#details">查看详情</a></kima-popover>
-->
<script setup>
import { watch } from "vue";
import { presenceTransition } from "../../utils/motion.js";
import { PopoverRoot, PopoverTrigger, PopoverContent } from "reka-ui";
import KimaButton from "../core/button.ce.vue";
import { useInteractionRoot, useInteractionModel, usePlacement, dismissInteraction } from "../../utils/interaction.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ open: Boolean, disabled: Boolean, label: { type: String, default: "展开内容" }, contentLabel: { type: String, default: "详情" }, placement: { type: String, default: "bottom-start" }, variant: { type: String, default: "tonal" } });
const emit = defineEmits(["update:open", "close"]);
const { root, forwardedAttrs } = useInteractionRoot();
const [localOpen, updateOpen] = useInteractionModel(props, "open", emit);
const position = usePlacement(props);
function setOpen(value) { if (value && props.disabled) return; const wasOpen = localOpen.value; updateOpen(value); if (wasOpen && !value) emit("close"); }
watch(() => props.disabled, (disabled) => { if (disabled) setOpen(false); }, { immediate: true });
function escape(event) { dismissInteraction(event, () => setOpen(false)); }
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-popover">
    <PopoverRoot :open="localOpen && !disabled" :modal="false" @update:open="setOpen">
      <PopoverTrigger as-child><KimaButton :disabled="disabled" :variant="variant"><slot name="trigger">{{ label }}</slot></KimaButton></PopoverTrigger>
      <!-- 显式内容名优先于 Reka 默认关联的触发器名。 -->
      <Transition name="kima-popup" v-bind="presenceTransition"><PopoverContent v-if="localOpen && !disabled" as-child force-mount v-bind="position" class="kima-popover__popup" @escape-key-down="escape"><div :aria-label="contentLabel" aria-labelledby=""><slot :close="() => setOpen(false)" /></div></PopoverContent></Transition>
    </PopoverRoot>
  </div>
</template>
<style scoped lang="scss">
@use "../../styles/interaction" as *;
.kima-popover { @include interaction-root; display: inline-block; max-width: 100%; }
:global(.kima-popover__popup) { @include interaction-popup; }
</style>
