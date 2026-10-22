import { createApp, h } from 'vue';
import ContentExamples from '../src/site/content-examples.vue';
import '../src/styles/_tokens.scss';
import './content-fixture.scss';
const query=new URLSearchParams(location.search);
const component=query.get('component')||'chart';
if(query.has('standalone')) {
  await import(/* @vite-ignore */ '/dist/kima-elements.js');
  document.body.insertAdjacentHTML('beforeend','<form id="native"><button type="reset">原生重置</button></form>');
  const form=document.querySelector('#native');
  const chart=document.createElement('kima-chart');chart.series=[{name:'Standalone',data:[3,null,-2,8]}];chart.labels=['A','B','C','D'];form.append(chart);
  const heatmap=document.createElement('kima-heatmap');heatmap.values=[[1,2],[3,4]];form.append(heatmap);
  const rich=document.createElement('kima-rich-text-editor');rich.modelValue='<p>Native document</p>';rich.name='document';form.append(rich);
  const code=document.createElement('kima-code-editor');code.modelValue='const native = 1;';code.name='source';form.append(code);
  const equation=document.createElement('kima-equation');equation.formula='x^2 + y^2 = z^2';form.append(equation);
} else if(query.has('model')) {const Fixture=(await import('./content-model-fixture.vue')).default;createApp(Fixture).mount('#app');}
else createApp({render:()=>h(ContentExamples,{component})}).mount('#app');
window.contentFixture={async sanitize(value){const {sanitizeContent}=await import('../src/utils/content.js');return sanitizeContent(value);},async palette(seed,dark=false){const {applyPalette}=await import('../src/utils/theme.js');applyPalette(seed,{isDark:dark,variant:"tonal-spot"});}};
