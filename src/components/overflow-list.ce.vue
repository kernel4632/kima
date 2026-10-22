<!-- 溢出列表：限制首屏项数，显式展开剩余项；不重复页面布局容器。
调用示例：
  <kima-overflow-list :items="['设计', '交互', '动效', '发布']" :max="2" v-model:expanded="expanded" />
-->
<script setup>
import { computed, useId } from "vue";
import { collapseTransition } from "../utils/motion.js";
import KimaButton from "./button.ce.vue";
import { useNavigationModel, useNavigationRoot } from "../utils/navigation.js";
defineOptions({ inheritAttrs: false });
const props = defineProps({ items: { type: Array, default: () => [] }, max: { type: Number, default: 3 }, expanded: Boolean, disabled: Boolean, label: { type: String, default: "内容列表" } });
const emit = defineEmits(["update:expanded", "change"]);
const { root, forwardedAttrs } = useNavigationRoot();
const [local, update] = useNavigationModel(props, "expanded", emit);
const limit = computed(() => Math.max(0, Math.floor(Number(props.max) || 0)));
const remaining = computed(() => Math.max(0, props.items.length - limit.value));
const id = `kima-overflow-${useId()}`;
function text(item) { return typeof item === "object" && item !== null ? item.label ?? item.value ?? "" : item; }
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-overflow-list"><ul :id="id" :aria-label="label"><template v-for="(item, index) in items" :key="item?.value ?? index"><Transition :css="false" v-bind="collapseTransition"><li v-show="local || index < limit" :inert="!local && index >= limit" :aria-hidden="!local && index >= limit || undefined"><div><slot :name="`item-${index}`" :item="item" :index="index">{{ text(item) }}</slot></div></li></Transition></template></ul><KimaButton v-if="remaining" variant="text" :disabled="disabled" :aria-controls="id" :aria-expanded="local" @click="update(!local)">{{ local ? '收起列表' : `展开其余 ${remaining} 项` }}</KimaButton><slot /></div></template>
<style scoped lang="scss">
@use "../styles/navigation" as *;
.kima-overflow-list { @include navigation-surface; ul { display: flex; flex-wrap: wrap; gap: var(--kima-space-3); list-style: none; margin: 0 0 var(--kima-space-3); padding: 0; } li > div { padding: var(--kima-space-3) var(--kima-space-4); background: var(--kima-color-layer-2); border-radius: var(--kima-radius-m); } }
</style>
