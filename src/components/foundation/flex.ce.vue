<!-- Flex 区域：方向、换行、token 响应间距与两轴对齐，保留原始内容顺序。调用示例：<kima-flex direction="row" wrap="wrap" :gap="4" align="center" justify="space-between">内容</kima-flex> -->
<script setup>
import { computed } from 'vue';
import { useNavigationRoot } from '../../utils/navigation.js';
import { choice, layoutVariables, space } from '../../utils/foundation.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ direction: { type: String, default: 'row' }, wrap: { type: String, default: 'wrap' }, gap: { type: [Number, Object], default: 4 }, align: { type: String, default: 'stretch' }, justify: { type: String, default: 'start' } });
const { root, forwardedAttrs } = useNavigationRoot();
const alignments = { start: 'flex-start', end: 'flex-end', center: 'center', stretch: 'stretch', baseline: 'baseline' };
const justifications = { start: 'flex-start', end: 'flex-end', center: 'center', 'space-between': 'space-between', 'space-around': 'space-around', 'space-evenly': 'space-evenly' };
const style = computed(() => ({ ...layoutVariables('flex', 'gap', props.gap, space, 4), flexDirection: choice(props.direction, ['row', 'column'], 'row'), flexWrap: choice(props.wrap, ['wrap', 'nowrap'], 'wrap'), alignItems: alignments[choice(props.align, Object.keys(alignments), 'stretch')], justifyContent: justifications[choice(props.justify, Object.keys(justifications), 'start')] }));
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-flex" :style="style"><slot /></div></template>
<style scoped lang="scss">
@use '../../styles/foundation' as *;
.kima-flex { @include foundation-base; @include foundation-responsive('flex'); display: flex; }
</style>
