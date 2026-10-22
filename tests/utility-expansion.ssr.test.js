import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createNotifications } from '../src/utils/notifications.js';
import { encodeQR } from '../src/utils/qr.js';

test('QR matrices match independent ISO byte-mode fixtures for ASCII and UTF-8', async () => {
  const fixture = JSON.parse(await readFile(new URL('./fixtures/utility-qr-standard.json',import.meta.url),'utf8'));
  for (const entry of fixture.cases) {
    const qr=encodeQR(entry.text,'M');
    assert.equal(qr.size,entry.size);
    const bits=qr.modules.flat().map(cell=>cell?'1':'0').join('');
    const hash=createHash('sha256').update(bits).digest('hex');
    assert.ok(entry.validMaskHashes.includes(hash),`${entry.text}: ${hash}`);
    assert.equal(qr.viewBox,`0 0 ${entry.size+8} ${entry.size+8}`);
  }
});
test('notification instances isolate SSR requests, unsubscribe, dedupe, capacity zero and immutable snapshots',()=>{
  const a=createNotifications({capacity:2}),b=createNotifications(); let calls=0; const off=a.subscribe(()=>calls++);
  const id=a.push({message:'A',dedupeKey:'key'});assert.equal(a.push({message:'B',dedupeKey:'key'}),id);assert.equal(a.snapshot().length,1);assert.equal(b.snapshot().length,0);
  a.update(id,{message:'C',id:'injected'});assert.equal(a.snapshot()[0].id,id);const copy=a.snapshot();copy[0].message='mutated';assert.equal(a.snapshot()[0].message,'C');
  off();const before=calls;a.push('D');assert.equal(calls,before);a.setCapacity(0);assert.deepEqual(a.snapshot(),[]);a.push('E');assert.deepEqual(a.snapshot(),[]);assert.equal(a.dismiss('missing'),false);
});
test('all thirteen utility components and queue SSR render without browser globals',async()=>{
  const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
  const samples={tour:{open:true,steps:[{target:'#missing',title:'SSR tour'}]},'qr-code':{value:'你好'},watermark:{text:'KIMA'},affix:{placement:'bottom'},'float-button':{actions:[{id:'a',label:'Alpha'}]},'log-viewer':{lines:['SSR line']},'loading-bar':{},'animated-number':{value:12.5,precision:2},listbox:{modelValue:['a'],multiple:true,options:[{value:'a',label:'Alpha'}]},'progress-group':{tasks:[{label:'A',value:50}]},'alert-dialog':{open:true,heading:'Danger'},'virtual-select':{modelValue:'a',options:[{value:'a',label:'Alpha'}]},'tag-group':{items:[{value:'a',label:'Alpha'}],modelValue:['a'],selectable:true},'notification-queue':{}};
  try{for(const [slug,props] of Object.entries(samples)){const Component=(await server.ssrLoadModule(`/src/components/${slug}.ce.vue`)).default;const html=await renderToString(createSSRApp({render:()=>h(Component,props)}));assert.ok(html.includes(`kima-${slug}`),slug);if(slug==='animated-number')assert.match(html,/12\.50/);if(slug==='log-viewer')assert.match(html,/SSR line/);}}finally{await server.close();}
});
