<script setup>
import { computed, ref } from 'vue';
import katex from 'katex';
import { useContentMotion } from '../../utils/content-motion.js';
const props=defineProps({formula:{type:String,default:''},display:{type:Boolean,default:true},label:String});
const root=ref(null);useContentMotion(root,()=>props.formula);
const rendered=computed(()=>{
  const source=props.formula;
  // No HTML extensions, URLs, embedded assets or caller macros enter this renderer.
  if(/\\(?:href|url|includegraphics|html\w*|class|style|data|require)\b/i.test(source))return {html:'',error:'公式不允许 HTML、URL 或外部资源命令'};
  try {const html=katex.renderToString(source,{output:'mathml',displayMode:props.display,trust:false,strict:'error',throwOnError:false,maxSize:20,maxExpand:500});return /katex-error|mathcolor=/i.test(html)?{html:'',error:'公式语法错误或包含不支持的命令'}:{html,error:''};}catch{return {html:'',error:'无法解析公式'};}
});
</script>
<template><figure ref="root" class="kima-equation" :class="{'kima-equation--inline':!display}" :aria-label="label"><div v-if="!rendered.error" class="kima-equation__math" v-html="rendered.html"></div><div v-else class="kima-equation__error" role="alert"><span>{{ rendered.error }}</span><code>{{ formula }}</code></div><figcaption v-if="label">{{ label }}</figcaption></figure></template>
<style scoped lang="scss">
@use '../../styles/content' as *;
.kima-equation{@include content-root;@include content-reduced;margin:0;padding:var(--kima-space-4);overflow-x:auto;&--inline{display:inline-block;padding:0;vertical-align:middle}&__math{font-size:1.35em;:deep(math){font-family:math;max-width:100%}:deep(.katex-mathml){position:static;width:auto;height:auto;clip:auto;overflow:visible}}&__error{display:grid;gap:var(--kima-space-2);color:var(--kima-color-error);code{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}}figcaption{margin-top:var(--kima-space-3);color:var(--kima-color-on-surface-variant);font-size:var(--kima-font-size-label-medium)}}
</style>
