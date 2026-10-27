<!-- 追加文本日志，用户滚离底部暂停跟尾。搜索只是本地文本过滤；导出为当前裁剪后原始文本。 -->
<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import KimaIconButton from '../core/icon-button.ce.vue';
import KimaTooltip from '../core/tooltip.ce.vue';
import { Download01Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import KimaHighlight from '../display/highlight.ce.vue';
import { useInteractionRoot } from '../../utils/interaction.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ lines: { type: Array, default: () => [] }, maxLines: { type: Number, default: 1000 }, label: { type: String, default: '日志' }, searchable: { type: Boolean, default: true } });
const emit = defineEmits(['append', 'follow-change', 'export']);
const { root, forwardedAttrs } = useInteractionRoot();
const rows = ref([]), query = ref(''), following = ref(true), viewport = ref(null);
let sequence = 0;
function trim() { rows.value = rows.value.slice(-Math.max(1, Math.floor(props.maxLines) || 1)); }
async function tail() { await nextTick(); if (following.value && viewport.value) viewport.value.scrollTop = viewport.value.scrollHeight; }
function append(value) { const lines = Array.isArray(value) ? value : String(value).split('\n'); rows.value.push(...lines.map(text => ({ id: ++sequence, text: String(text) }))); trim(); tail(); emit('append', lines); }
watch(() => props.lines, value => { rows.value = value.map(text => ({ id: ++sequence, text: String(text) })); trim(); tail(); }, { immediate: true, deep: true });
watch(() => props.maxLines, trim);
const filtered = computed(() => rows.value.filter(row => !query.value || row.text.toLocaleLowerCase().includes(query.value.toLocaleLowerCase())));
function follow(value) { if (following.value !== value) { following.value = value; emit('follow-change', value); } if (value) tail(); }
function scroll() { const el = viewport.value; follow(el.scrollHeight - el.scrollTop - el.clientHeight < 8); }
function exportText() { const text = rows.value.map(row => row.text).join('\n'); emit('export', text); return text; }
function download() { const url = URL.createObjectURL(new Blob([exportText()], { type: 'text/plain;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'kima-log.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 0); }
defineExpose({ append, exportText, resume: () => follow(true) });
</script>
<template>
  <section ref="root" v-bind="forwardedAttrs" class="kima-log-viewer" :aria-label="label">
    <div class="kima-log-viewer__tools">
      <input v-if="searchable" v-model="query" type="search" placeholder="过滤日志" aria-label="搜索日志">
      <KimaTooltip :text="following ? '暂停跟尾' : '恢复跟尾'"><KimaIconButton :icon="following ? PauseIcon : PlayIcon" :label="following ? '暂停跟尾' : '恢复跟尾'" :variant="following ? 'tonal' : 'standard'" :aria-pressed="following" @click="follow(!following)" /></KimaTooltip>
      <KimaTooltip text="导出日志" position="left"><KimaIconButton :icon="Download01Icon" label="导出日志" @click="download" /></KimaTooltip>
      <span class="kima-log-viewer__follow-status" role="status">{{ following ? '跟随最新' : '已暂停跟尾' }}</span>
    </div>
    <div ref="viewport" class="kima-log-viewer__viewport" role="log" :aria-label="label" :aria-live="following ? 'polite' : 'off'" tabindex="0" @scroll="scroll"><div v-for="row in filtered" :key="row.id" class="kima-log-viewer__line"><KimaHighlight :text="row.text" :keywords="query"/></div><p v-if="!filtered.length">没有匹配日志</p></div>
  </section>
</template>
<style scoped lang="scss">@use '../../styles/mixins' as *; @use '../../styles/interaction' as *; .kima-log-viewer { @include kima-layer(1); color: var(--kima-color-on-surface); font-family: var(--kima-font-family); padding: var(--kima-space-4); border-radius: var(--kima-radius-m); &__tools { display: flex; align-items: center; flex-wrap: wrap; gap: var(--kima-space-2); input { @include interaction-search; width: min(100%, 240px); } } &__follow-status { font-size: var(--kima-font-size-label-small); color: var(--kima-color-on-surface-variant); } &__viewport { @include kima-focus-ring; height: 260px; overflow: auto; overflow-anchor: none; } &__line { min-height: 28px; white-space: pre-wrap; overflow-wrap: anywhere; } }</style>
