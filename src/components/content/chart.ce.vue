<script setup>
import { presenceTransition } from "../../utils/motion.js";
import { computed, nextTick, ref, useId } from 'vue';
import KimaButton from '../core/button.ce.vue';
import { collapseTransition } from "../../utils/motion.js";
import { useContentMotion } from '../../utils/content-motion.js';
const props = defineProps({ series: { type: Array, default: () => [] }, labels: { type: Array, default: () => [] }, mode: { type: String, default: 'line', validator: v => ['line','bar','area','scatter'].includes(v) }, label: { type: String, default: '数据图表' }, xLabel: { type: String, default: '类别' }, yLabel: { type: String, default: '数值' } });
const emit = defineEmits(['select']);
const root = ref(null), plot = ref(null), hidden = ref([]), selected = ref(null), table = ref(false), uid = useId();
useContentMotion(plot,()=>[props.series,props.mode]);
const color = index => `var(--kima-chart-series-${index % 4 + 1})`;
const rows = computed(() => props.series.map((s, si) => ({ name: s.name || `系列 ${si+1}`, si, values: (s.data || []).map((v,i) => ({ i, x: typeof v === 'object' && v !== null ? v.x : i, y: typeof v === 'object' && v !== null ? v.y : v, label: props.labels[i] ?? (typeof v === 'object' && v !== null ? v.x : i+1) })) })));
const valid = p => typeof p.y === 'number' && Number.isFinite(p.y);
const visible = computed(() => rows.value.filter(s => !hidden.value.includes(s.si)));
const count = computed(() => Math.max(1, props.labels.length, ...rows.value.map(s => s.values.length)));
const domain = computed(() => { const values = visible.value.flatMap(s => s.values.filter(valid).map(p => p.y)); const min = Math.min(0,...values), max = Math.max(0,...values); return [min,max === min ? min+1 : max]; });
const xDomain = computed(() => {const xs=visible.value.flatMap(s=>s.values.map(p=>Number(p.x)).filter(Number.isFinite));const min=Math.min(0,...xs),max=Math.max(1,...xs);return [min,max];});
const px = p => props.mode === 'scatter' ? 55 + (Number(p.x)-xDomain.value[0])/(xDomain.value[1]-xDomain.value[0])*620 : 55+(p.i+.5)/count.value*620;
const py = value => 250-(value-domain.value[0])/(domain.value[1]-domain.value[0])*220;
const points = computed(() => visible.value.flatMap(s => s.values.filter(valid).map(p => ({ ...p, si:s.si, name:s.name, key:`${s.si}-${p.i}` }))));
const active = computed(() => points.value.find(p => p.key === selected.value));
const ticks = computed(() => Array.from({length:5},(_,i) => domain.value[0]+(domain.value[1]-domain.value[0])*i/4));
function segments(s) { const result=[]; let segment=[]; for(const p of s.values) { if(valid(p)) segment.push(p); else if(segment.length) {result.push(segment);segment=[];} } if(segment.length)result.push(segment);return result; }
const line = segment => segment.map((p,i)=>`${i?'L':'M'}${px(p)},${py(p.y)}`).join(' ');
const area = segment => `${line(segment)} L${px(segment.at(-1))},${py(0)} L${px(segment[0])},${py(0)} Z`;
function select(p) { selected.value=p.key; emit('select',{series:p.si,index:p.i,x:p.x,value:p.y}); }
async function keyboard(event,p) { const keys=['ArrowRight','ArrowDown','ArrowLeft','ArrowUp','Home','End'];if(!keys.includes(event.key))return;event.preventDefault();const n=points.value.length,i=points.value.findIndex(v=>v.key===p.key);const index=event.key==='Home'?0:event.key==='End'?n-1:(i+(['ArrowLeft','ArrowUp'].includes(event.key)?-1:1)+n)%n;select(points.value[index]);await nextTick();root.value?.querySelector(`[data-point="${points.value[index].key}"]`)?.focus(); }
function toggle(si){ hidden.value=hidden.value.includes(si)?hidden.value.filter(v=>v!==si):[...hidden.value,si];selected.value=null; }
</script>
<template>
  <section ref="root" class="kima-chart" :aria-label="label">
    <div class="kima-chart__legend" aria-label="图例"><KimaButton v-for="s in rows" :key="s.si" variant="text" :aria-pressed="!hidden.includes(s.si)" @click="toggle(s.si)"><span class="kima-chart__swatch" :style="{background:color(s.si)}"></span>{{ s.name }}</KimaButton></div>
    <svg ref="plot" viewBox="0 0 720 300" class="kima-chart__plot" role="group" :aria-label="`${label}，方向键选择数据点`" :aria-describedby="uid+'-hint'">
      <g class="kima-chart__axis"><g v-for="tick in ticks" :key="tick"><line x1="55" x2="675" :y1="py(tick)" :y2="py(tick)" /><text x="48" :y="py(tick)+4" text-anchor="end">{{ Number(tick.toPrecision(4)) }}</text></g><line x1="55" x2="675" :y1="py(0)" :y2="py(0)" /><text x="365" y="295" text-anchor="middle">{{ xLabel }}</text><text x="8" y="15">{{ yLabel }}</text><text v-for="(_,i) in Array.from({length:count})" :key="i" :x="55+(i+.5)/count*620" y="273" text-anchor="middle">{{ mode==='scatter' ? '' : labels[i] ?? i+1 }}</text><template v-if="mode==='scatter'"><text x="55" y="273">{{ xDomain[0] }}</text><text x="675" y="273" text-anchor="end">{{ xDomain[1] }}</text></template></g>
      <g v-for="s in visible" :key="s.si" :style="{color:color(s.si)}" class="kima-chart__series">
        <template v-if="mode==='line'||mode==='area'"><g v-for="(segment,i) in segments(s)" :key="i"><path v-if="mode==='area'" :d="area(segment)" class="kima-chart__area"/><path :d="line(segment)" fill="none" stroke="currentColor" stroke-width="3" /></g></template>
        <template v-for="p in points.filter(v=>v.si===s.si)" :key="p.key"><g role="button" :tabindex="selected===p.key || (!active && points[0]?.key===p.key) ? 0 : -1" :data-point="p.key" :aria-label="`${s.name}，${p.label}，${p.y}`" :aria-pressed="selected===p.key" class="kima-chart__point" @keydown="keyboard($event,p)" @keydown.enter.prevent="select(p)" @keydown.space.prevent="select(p)" @focus="select(p)" @pointerenter="select(p)" @click="select(p)"><rect v-if="mode==='bar'" :x="px(p)-Math.max(2,500/count/Math.max(1,visible.length))/2+(visible.findIndex(v=>v.si===s.si)-(visible.length-1)/2)*(500/count/Math.max(1,visible.length))" :y="Math.min(py(0),py(p.y))" :width="Math.max(2,500/count/Math.max(1,visible.length))" :height="Math.max(2,Math.abs(py(p.y)-py(0)))" rx="3" fill="currentColor"/><circle v-else :cx="px(p)" :cy="py(p.y)" :r="selected===p.key?7:5" fill="currentColor"/><circle :cx="px(p)" :cy="py(p.y)" r="14" fill="transparent"/></g></template>
      </g>
    </svg>
    <p :id="uid+'-hint'" class="kima-chart__hint">方向键选择，Home / End 到首尾；空值保留断点。{{ points.length ? '' : '暂无有效数据' }}</p>
    <Transition name="kima-popup" v-bind="presenceTransition"><output v-if="active" class="kima-chart__tooltip" role="status">{{ active.name }} · {{ active.label }}：{{ active.y }}</output></Transition>
    <KimaButton variant="text" :aria-expanded="table" :aria-controls="uid+'-table'" @click="table=!table">{{ table?'收起':'查看' }}数据表</KimaButton>
    <Transition :css="false" v-bind="collapseTransition"><div v-show="table" :inert="!table" :aria-hidden="!table || undefined" :id="uid+'-table'" class="kima-chart__table"><table><caption>{{ label }}（含隐藏系列）</caption><thead><tr><th>{{ xLabel }}</th><th>系列</th><th>{{ yLabel }}</th></tr></thead><tbody><template v-for="s in rows" :key="s.si"><tr v-for="p in s.values" :key="p.i"><th scope="row">{{ p.label }}</th><td>{{ s.name }}</td><td>{{ valid(p)?p.y:'缺失' }}</td></tr></template></tbody></table></div></Transition>
  </section>
</template>
<style scoped lang="scss">
@use '../../styles/content' as *;
.kima-chart { @include content-root; @include content-reduced; display:grid;gap:var(--kima-space-2); &__legend{display:flex;flex-wrap:wrap;gap:var(--kima-space-2)} &__swatch{display:inline-block;width:.8em;height:.8em;border-radius:50%;margin-inline-end:.5em} &__plot{width:100%;height:auto;overflow:visible} &__axis{fill:var(--kima-color-on-surface-variant);font-size:11px;line{stroke:var(--kima-color-layer-3);stroke-width:1}} &__series{animation:kima-chart-appear var(--kima-duration-slow) var(--kima-curve-standard)} &__point{cursor:pointer;outline:none;opacity:.8;transition:opacity var(--kima-duration-effects) var(--kima-curve-standard);&:hover,&:focus,&[aria-pressed=true]{opacity:1;filter:drop-shadow(0 0 3px currentColor)} &:focus-visible{outline:2px solid var(--kima-color-primary);outline-offset:3px}} &__area{fill:currentColor;opacity:.15} &__tooltip{background:var(--kima-color-popup);color:var(--kima-color-on-surface);padding:var(--kima-space-3);border-radius:var(--kima-radius-m);box-shadow:var(--kima-elevation-3)} &__hint{font-size:var(--kima-font-size-label-medium);color:var(--kima-color-on-surface-variant);margin:0} &__table{overflow:auto;table{@include content-table}} }
@keyframes kima-chart-appear {from{opacity:0}to{opacity:1}}
</style>
