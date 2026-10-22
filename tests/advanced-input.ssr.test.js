import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { normalizeDate, normalizeDatetime, shiftDay, shiftMonth, timeMinutes } from '../src/utils/local-date.js';

test('local civil parsing never accepts offsets or rollover dates', () => {
  assert.equal(normalizeDate('2026-02-30'),null);
  assert.equal(normalizeDate('2024-02-29'),'2024-02-29');
  assert.equal(normalizeDate('0099-01-01'),'0099-01-01');
  assert.equal(shiftDay('2026-03-31',1),'2026-04-01');
  assert.equal(shiftMonth('2024-01-31',1),'2024-02-29');
  assert.equal(normalizeDatetime('2026-01-01T09:30Z'),null);
  assert.equal(normalizeDatetime('2026-01-01T09:30'),'2026-01-01T09:30');
  assert.equal(timeMinutes('24:00'),null);
});

test('all nine advanced input components SSR render with nonempty local models',async()=>{
  const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
  const values={
    'range-slider':{modelValue:[20,80]},calendar:{modelValue:'2026-06-01'},
    'date-range-picker':{modelValue:['2026-06-01','2026-06-10']},
    'time-range-picker':{modelValue:['22:00','02:00']},
    'datetime-picker':{modelValue:'2026-06-01T09:30'},mention:{modelValue:'Hello @Kai',items:['Kai']},
    form:{},editable:{modelValue:'说明'},transfer:{modelValue:['a'],options:[{value:'a',label:'Alpha'},{value:'b',label:'Beta'}]},
  };
  try {
    for(const [slug,props] of Object.entries(values)){
      const component=(await server.ssrLoadModule(`/src/components/${slug}.ce.vue`)).default;
      const html=await renderToString(createSSRApp({render:()=>h(component,{...props,name:'entry'},slug==='form'?{default:()=>h('input',{name:'child',required:true})}:undefined)}));
      assert.ok(html.includes(`kima-${slug}`),slug);
      if(slug==='date-range-picker') assert.equal((html.match(/role="grid"/g)||[]).length,2);
      if(slug==='datetime-picker') assert.match(html,/2026-06-01T09:30/);
    }
  } finally { await server.close(); }
});
