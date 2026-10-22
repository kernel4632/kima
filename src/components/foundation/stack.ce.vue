<!-- 有序堆叠：纵向默认、可切横向；不换行、不倒序，不给内容增加交互。调用示例：<kima-stack direction="vertical" :gap="6" align="stretch">内容</kima-stack> -->
<script setup>
import { computed } from 'vue';
import { useNavigationRoot } from '../../utils/navigation.js';
import { choice, layoutVariables, space } from '../../utils/foundation.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ direction: { type: String, default: 'vertical' }, gap: { type: [Number, Object], default: 4 }, align: { type: String, default: 'stretch' } });
const { root, forwardedAttrs } = useNavigationRoot();
const alignments = { start: 'flex-start', end: 'flex-end', center: 'center', stretch: 'stretch', baseline: 'baseline' };
const style = computed(() => ({ ...layoutVariables('stack', 'gap', props.gap, space, 4), flexDirection: props.direction === 'horizontal' ? 'row' : 'column', alignItems: alignments[choice(props.align, Object.keys(alignments), 'stretch')] }));
</script>
<template><div ref="root" v-bind="forwardedAttrs" class="kima-stack" :style="style"><slot /></div></template>
<style scoped lang="scss">
@use '../../styles/foundation' as *;
.kima-stack { @include foundation-base; @include foundation-responsive('stack'); display: flex; flex-wrap: nowrap; }
</style>
