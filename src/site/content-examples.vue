<script setup>
import { ref } from 'vue';
import KimaChart from '../components/chart.ce.vue';
import KimaHeatmap from '../components/heatmap.ce.vue';
import KimaRichTextEditor from '../components/rich-text-editor.ce.vue';
import KimaCodeEditor from '../components/code-editor.ce.vue';
import KimaEquation from '../components/equation.ce.vue';
import KimaButton from '../components/button.ce.vue';
import KimaCheckbox from '../components/checkbox.ce.vue';
import KimaNativeSelect from '../components/native-select.ce.vue';
import KimaTextField from '../components/text-field.ce.vue';
const props=defineProps({component:{type:String,required:true}});
const mode=ref('line'),html=ref('<h2>写下想法</h2><p>选择文字，试试<strong>格式</strong>与链接。</p>'),code=ref('const greeting = "Hello KIMA";\nconsole.log(greeting);'),language=ref('javascript'),formula=ref('E = mc^2'),status=ref(''),disabled=ref(false),readonly=ref(false),modeOptions=['line','bar','area','scatter'],languageOptions=['javascript','json','html','css','plain'];
const series=ref([{name:'访问量',data:[12,24,null,-8,32,18]},{name:'转化量',data:[5,12,9,-4,20,16]}]);
const values=ref([[0,1,3,5,8,13],[2,null,8,4,3,7],[3,5,9,12,-2,4],[1,2,3,8,12,16]]);
function refresh(){series.value=series.value.map(s=>({...s,data:s.data.map(v=>v===null?null:v+3)}));values.value=values.value.map(row=>row.map(v=>v===null?null:v+1));}
function submit(event){status.value=JSON.stringify(Object.fromEntries(new FormData(event.target)));}
</script>
<template>
  <article class="kima-gallery__demo kima-content-example">
    <template v-if="props.component==='chart'"><label>图表形式 <KimaNativeSelect v-model="mode" label="图表形式" :options="modeOptions" /></label><KimaChart :series="series" :labels="['一月','二月','三月','四月','五月','六月']" :mode="mode" label="每月流量" y-label="数量" @select="status=JSON.stringify($event)"/><KimaButton @click="refresh">更新数据</KimaButton></template>
    <template v-else-if="props.component==='heatmap'"><KimaHeatmap :values="values" :columns="['周一','周二','周三','周四','周五','周六']" :rows="['早间','午间','下午','夜间']" label="一周活跃度" @select="status=JSON.stringify($event)"/><KimaButton @click="refresh">更新热力数据</KimaButton></template>
    <form v-else-if="props.component==='rich-text-editor'||props.component==='code-editor'" @submit.prevent="submit">
      <div class="kima-content-example__options"><KimaCheckbox v-model="readonly" label="只读"/><KimaCheckbox v-model="disabled" label="禁用"/><label v-if="props.component==='code-editor'">语言 <KimaNativeSelect v-model="language" label="语言" :options="languageOptions" /></label></div>
      <KimaRichTextEditor v-if="props.component==='rich-text-editor'" v-model="html" name="document" label="文章正文" :disabled="disabled" :readonly="readonly" required/>
      <KimaCodeEditor v-else v-model="code" :language="language" name="source" label="源代码" :disabled="disabled" :readonly="readonly" required/>
      <div class="kima-content-example__actions"><KimaButton type="submit">读取表单</KimaButton><KimaButton type="reset" variant="text">重置</KimaButton></div>
    </form>
    <template v-else-if="props.component==='equation'"><label>LaTeX 公式 <KimaTextField v-model="formula" label="公式源码"/></label><KimaEquation :formula="formula" label="原生 MathML 公式"/><KimaEquation :formula="'\\int_0^1 x^2 \\,dx = \\frac{1}{3}'" label="积分"/><KimaEquation :formula="'\\href{javascript:alert(1)}{unsafe}'" label="不安全命令被拒绝"/></template>
    <output role="status" class="kima-content-example__status">{{ status }}</output>
  </article>
</template>
<style scoped lang="scss">
.kima-content-example{min-width:0;width:100%;color:var(--kima-color-on-surface);font-family:var(--kima-font-family);form{display:grid;gap:var(--kima-space-4);min-width:0;max-width:none;width:100%}label{display:flex;align-items:center;gap:var(--kima-space-2);flex-wrap:wrap}&__options,&__actions{display:flex;flex-wrap:wrap;justify-content:center;gap:var(--kima-space-3)}&__status{white-space:pre-wrap;overflow-wrap:anywhere;font-size:var(--kima-font-size-label-medium);color:var(--kima-color-on-surface-variant)}}
</style>
