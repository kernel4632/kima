<!-- 聚合 = sum(clamp(value/max)*weight) / sum(weight)，零/非法权重不参与。 -->
<script setup>
import { computed, ref, watch } from 'vue';
import { useContentMotion } from '../../utils/content-motion.js';
import { freezeLeaveLayout, presenceTransition } from "../../utils/motion.js";
import KimaProgress from '../core/progress.ce.vue';
import { useInteractionRoot } from '../../utils/interaction.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ tasks: { type: Array, default: () => [] }, label: { type: String, default: '任务总进度' } });
const emit = defineEmits(['change']);
const { root, forwardedAttrs } = useInteractionRoot();
const rows = computed(() => props.tasks.map((task, index) => { const max = Number(task.max ?? 100); const value = Number(task.value) || 0; const raw = Number(task.weight ?? 1); return { ...task, id: task.id ?? index, weight: Number.isFinite(raw) ? Math.max(0, raw) : 0, percent: max > 0 ? Math.min(100, Math.max(0, value / max * 100)) : 0 }; }));
const aggregate = computed(() => { const weight = rows.value.reduce((sum, task) => sum + task.weight, 0); return weight ? rows.value.reduce((sum, task) => sum + task.percent * task.weight, 0) / weight : 0; });
const list = ref(null);
useContentMotion(root, () => rows.value);
watch(aggregate, value => emit('change', value));
defineExpose({ aggregate });
</script>
<template><section ref="root" v-bind="forwardedAttrs" class="kima-progress-group" :aria-label="label"><KimaProgress :value="aggregate" :label="label"/><p>{{ label }} · {{ Math.round(aggregate) }}%</p><TransitionGroup tag="ul" name="kima-list" v-bind="{ ...presenceTransition, onBeforeLeave: freezeLeaveLayout }"><li v-for="task in rows" :key="task.id"><span>{{ task.label }}</span><KimaProgress :value="task.percent" :label="task.label || '任务'"/></li></TransitionGroup></section></template>
<style scoped lang="scss">.kima-progress-group { color: var(--kima-color-on-surface); font-family: var(--kima-font-family); ul { display: grid; gap: var(--kima-space-4); padding: 0; list-style: none; } li { display: grid; gap: var(--kima-space-2); } }</style>
