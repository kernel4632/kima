import { test, expect } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
const names = ['tour','qr-code','watermark','affix','float-button','log-viewer','loading-bar','animated-number','listbox','progress-group','alert-dialog','virtual-select','tag-group','notification-queue'];
test.beforeEach(async ({ page }) => { await page.goto('/tests/utility-fixture.html'); await expect(page.locator('html')).toHaveAttribute('data-ready','true'); });
const mount = (page, html, properties = {}) => page.evaluate(({ html, properties }) => window.utility.mount(html,properties),{html,properties});
const data = page => page.evaluate(() => [...new FormData(document.querySelector('form'))]);

test('listbox roving skips disabled, multi values submit and reset',async ({page})=>{
  await mount(page,'<form><kima-listbox id="list" name="stage" multiple></kima-listbox><button type="reset">Reset</button></form>',{list:{modelValue:['a'],options:[{value:'a',label:'Alpha'},{value:'b',label:'Blocked',disabled:true},{value:'c',label:'Charlie'}]}});
  const alpha=page.getByRole('option',{name:'Alpha'}), charlie=page.getByRole('option',{name:'Charlie'});
  await alpha.focus(); await alpha.press('ArrowDown'); await expect(charlie).toBeFocused(); await charlie.press(' ');
  expect(await data(page)).toEqual([['stage','a'],['stage','c']]);
  await page.getByRole('button',{name:'Reset'}).click(); await expect(charlie).toHaveAttribute('aria-selected','false'); expect(await data(page)).toEqual([['stage','a']]);
  await page.evaluate(()=>document.getElementById('list').disabled=true); await charlie.click({force:true}); expect(await data(page)).toEqual([]);
});
test('virtual select 10000 rows End renders active descendant, filter, reset',async ({page})=>{
  await page.evaluate(()=>window.utility.mount('<form><kima-virtual-select id="select" name="entry"></kima-virtual-select><button type="reset">Reset</button></form>',{select:{modelValue:3,options:Array.from({length:10000},(_,i)=>({value:i,label:`Item ${i}`,disabled:i===4}))}}));
  const control=page.getByRole('combobox'); await control.click(); await control.press('End');
  await expect.poll(()=>control.evaluate(el=>{const active=document.getElementById(el.getAttribute('aria-activedescendant'));return active?.textContent;})).toBe('Item 9999');
  expect(await page.getByRole('option').count()).toBeLessThan(20); await control.press('Enter'); expect(await data(page)).toEqual([['entry','9999']]);
  await control.fill('Item 120'); await expect(page.getByRole('option',{name:'Item 120',exact:true})).toBeVisible(); await control.press('Escape');
  await page.getByRole('button',{name:'Reset'}).click(); await expect.poll(()=>data(page)).toEqual([['entry','3']]); await expect(control).toHaveValue('');
});
test('virtual select multiple Space no-search, outside, disabled, cancelled reset',async ({page})=>{
  await mount(page,'<form><kima-virtual-select id="select" name="v" multiple></kima-virtual-select><button type="reset">Reset</button></form><button id="outside">Outside</button>',{select:{searchable:false,modelValue:['a'],options:[{value:'a',label:'Alpha'},{value:'b',label:'Beta'},{value:'c',label:'Blocked',disabled:true}]}});
  const control=page.getByRole('combobox'); await control.click(); await control.press('ArrowDown'); await control.press(' '); expect(await data(page)).toEqual([['v','a'],['v','b']]); await expect(control).toHaveAttribute('aria-expanded','true');
  await control.press('Escape');
  await page.evaluate(()=>document.querySelector('form').addEventListener('reset',event=>event.preventDefault())); await page.getByText('Reset',{exact:true}).click(); expect(await data(page)).toHaveLength(2);
  await control.click(); await page.locator('#outside').evaluate(el=>{el.style.marginTop='300px';});
  await page.getByText('Outside',{exact:true}).click(); await expect(control).toHaveAttribute('aria-expanded','false');
  await page.evaluate(()=>document.getElementById('select').disabled=true); expect(await data(page)).toEqual([]);
});
test('loading public lifecycle counts releases, error and reentry cancels old cleanup',async ({page})=>{
  await mount(page,'<kima-loading-bar id="load" finish-delay="100"></kima-loading-bar>');
  await page.evaluate(()=>{const el=document.getElementById('load'); window.releaseA=el.start(); window.releaseB=el.start();});
  await expect(page.locator('.kima-loading-bar')).toHaveAttribute('aria-busy','true');
  await page.evaluate(()=>{window.releaseA();window.releaseA();}); await expect(page.getByRole('status')).toContainText('1 项');
  await page.evaluate(()=>window.releaseB()); await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','100');
  await page.evaluate(()=>document.getElementById('load').start()); await page.waitForTimeout(150); await expect(page.getByRole('progressbar')).toBeVisible();
  await page.evaluate(()=>document.getElementById('load').error('failure')); await expect(page.getByRole('status')).toHaveText('加载失败'); await expect(page.getByRole('progressbar')).toHaveCount(0);
});
test('animated number has real intermediate frames, reverses, exact finish and reduced',async ({page})=>{
  await mount(page,'<kima-animated-number id="number" value="0" duration="800" precision="2"></kima-animated-number>');
  const frames=await page.evaluate(async()=>{const el=document.getElementById('number'); el.value=100; const values=[]; for(let i=0;i<8;i++){await new Promise(requestAnimationFrame);values.push(Number(el.textContent));} el.value=-20;return values;});
  expect(frames.some(v=>v>0&&v<100)).toBe(true); expect(new Set(frames).size).toBeGreaterThan(2);
  await expect(page.locator('.kima-animated-number')).toHaveText('-20.00'); await page.emulateMedia({reducedMotion:'reduce'}); await page.evaluate(()=>document.getElementById('number').value=42.125); await expect(page.locator('.kima-animated-number')).toHaveText('42.13');
});
test('weighted aggregate clamps each task and ignores zero weights',async ({page})=>{
  await mount(page,'<kima-progress-group id="group"></kima-progress-group>',{group:{tasks:[{label:'A',value:100,weight:3},{label:'B',value:20,weight:1},{label:'Zero',value:100,weight:0}]}});
  await expect(page.getByRole('progressbar',{name:'任务总进度'})).toHaveAttribute('value','80');
  await page.evaluate(()=>document.getElementById('group').tasks=[{label:'A',value:-50,weight:2},{label:'B',value:300,max:200,weight:2}]); await expect(page.getByRole('progressbar',{name:'任务总进度'})).toHaveAttribute('value','50');
});
test('alert dialog defaults cancel, async rejection stays open, retry and focus restoration',async ({page})=>{
  await page.evaluate(async()=>{await window.utility.mount('<button id="launch">Launch</button><kima-alert-dialog id="confirm" heading="Delete project" confirm-label="Delete"></kima-alert-dialog>',{confirm:{confirmHandler:()=>{window.confirmCalls=(window.confirmCalls||0)+1;return new Promise((resolve,reject)=>{window.resolveConfirm=resolve;window.rejectConfirm=reject;});}}});document.getElementById('launch').addEventListener('click',()=>document.getElementById('confirm').open=true);});
  await page.getByText('Launch',{exact:true}).click(); await expect(page.getByRole('button',{name:'取消',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Delete',exact:true}).click(); await page.evaluate(()=>window.rejectConfirm(new Error('Server failed'))); await expect(page.getByRole('alert')).toHaveText('Server failed'); await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button',{name:'Delete',exact:true}).click(); await page.evaluate(()=>window.resolveConfirm()); await expect(page.getByRole('alertdialog')).not.toBeVisible(); await expect(page.getByText('Launch',{exact:true})).toBeFocused(); expect(await page.evaluate(()=>window.confirmCalls)).toBe(2);
});
test('float actions skip disabled, Escape restores trigger, outside keeps clicked focus',async ({page})=>{
  await mount(page,'<kima-float-button id="float"></kima-float-button><button>Outside</button>',{float:{actions:[{id:'a',label:'Alpha'},{id:'b',label:'Blocked',disabled:true},{id:'c',label:'Charlie'}]}});
  const trigger=page.getByRole('button',{name:'快捷操作'}); await trigger.click(); await expect(page.getByRole('button',{name:'Alpha'})).toBeFocused(); await page.getByRole('button',{name:'Alpha'}).press('ArrowDown'); await expect(page.getByRole('button',{name:'Charlie'})).toBeFocused(); await page.getByRole('button',{name:'Charlie'}).press('Escape'); await expect(trigger).toBeFocused();
  await trigger.click(); await page.getByRole('button',{name:'Outside'}).click(); await expect(page.getByRole('button',{name:'Outside'})).toBeFocused(); await expect(trigger).toHaveAttribute('aria-expanded','false');
});
test('log append crops, pauses tail, resumes, filters literal text and exports retained lines',async ({page})=>{
  await page.evaluate(()=>window.utility.mount('<kima-log-viewer id="log" max-lines="30"></kima-log-viewer>',{log:{lines:Array.from({length:25},(_,i)=>`INFO line ${i}`)}}));
  const viewport=page.getByRole('log'); await expect.poll(()=>viewport.evaluate(el=>el.scrollHeight-el.clientHeight-el.scrollTop)).toBeLessThan(8);
  await viewport.evaluate(el=>{el.scrollTop=0;el.dispatchEvent(new Event('scroll'));}); await expect(page.getByRole('button',{name:'恢复跟尾'})).toBeVisible();
  await page.evaluate(()=>document.getElementById('log').append(['WARN [a]','ERROR failed'])); await expect.poll(()=>viewport.evaluate(el=>el.scrollTop)).toBe(0);
  await page.getByRole('searchbox').fill('[a]'); await expect(page.locator('mark')).toHaveText('[a]'); await expect(page.locator('.kima-log-viewer__line')).toHaveCount(1);
  await page.getByRole('searchbox').fill(''); await page.getByRole('button',{name:'恢复跟尾'}).click(); await page.evaluate(()=>document.getElementById('log').append(Array.from({length:10},(_,i)=>`extra ${i}`))); await expect(page.locator('.kima-log-viewer__line')).toHaveCount(30);
  const text=await page.evaluate(()=>document.getElementById('log').exportText()); expect(text.split('\n')).toHaveLength(30); expect(text).toContain('ERROR failed');
});
test('tour scrolls targets, handles missing target, traps keyboard and returns focus',async ({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.evaluate(async()=>{await window.utility.mount('<button id="launch">Launch</button><div style="height:1100px"></div><button id="target">Target</button><kima-tour id="tour"></kima-tour>',{tour:{steps:[{target:'#target',title:'First'},{target:'#missing',title:'Missing'},{target:'#target',title:'Last'}]}});document.getElementById('launch').addEventListener('click',()=>document.getElementById('tour').open=true);});
  await page.getByText('Launch',{exact:true}).click(); await expect(page.getByRole('dialog')).toBeVisible(); expect(await page.evaluate(()=>scrollY)).toBeGreaterThan(300); await expect(page.locator('.kima-tour__spotlight')).toBeVisible();
  await page.getByRole('button',{name:'下一步'}).click(); await expect(page.getByRole('status')).toContainText('未找到目标'); await page.getByRole('button',{name:'下一步'}).click(); await expect(page.getByRole('heading',{name:'Last'})).toBeVisible();
  await page.getByRole('button',{name:'完成'}).press('Tab'); await expect(page.getByRole('button',{name:'退出'})).toBeFocused(); await page.getByRole('button',{name:'退出'}).press('Escape'); await expect(page.getByText('Launch',{exact:true})).toBeFocused();
});
test('tour losing a mounted target remains escapable',async ({page})=>{
  await mount(page,'<button id="target">Target</button><kima-tour id="tour"></kima-tour>',{tour:{open:true,steps:[{target:'#target',title:'One'}]}}); await expect(page.locator('.kima-tour__spotlight')).toBeVisible(); await page.evaluate(()=>document.getElementById('target').remove()); await expect(page.getByRole('status')).toContainText('未找到目标'); await page.getByRole('button',{name:'退出'}).click(); await expect(page.getByRole('dialog')).not.toBeVisible();
});
test('tag group selects and deletes immediately, roves and form reset restores collection',async ({page})=>{
  await mount(page,'<form><kima-tag-group id="tags" selectable removable name="tags"></kima-tag-group><button type="reset">Reset</button></form>',{tags:{items:[{value:'a',label:'Alpha'},{value:'b',label:'Beta'}],modelValue:['a']}});
  await page.getByRole('button',{name:'Beta',exact:true}).click(); expect(await data(page)).toEqual([['tags','a'],['tags','b']]); await page.getByRole('button',{name:'Beta',exact:true}).press('Delete'); expect(await data(page)).toEqual([['tags','a']]); await expect(page.getByRole('button',{name:'Beta',exact:true})).toHaveCount(0);
  await page.getByText('Reset',{exact:true}).click(); await expect(page.getByRole('button',{name:'Beta',exact:true})).toBeVisible(); expect(await data(page)).toEqual([['tags','a']]);
});
test('notification service dedupes updates dismisses capacity and queue subscribes',async ({page})=>{
  await page.evaluate(async()=>{window.notices=window.utility.createNotifications({capacity:2});await window.utility.mount('<kima-notification-queue id="queue"></kima-notification-queue>',{queue:{service:window.notices}});window.noticeId=window.notices.push({message:'One',dedupeKey:'save',duration:0});window.notices.push({message:'Updated',dedupeKey:'save',duration:0});});
  await expect(page.locator('.kima-notification')).toHaveCount(1); await expect(page.getByText('Updated',{exact:true})).toBeVisible(); await page.evaluate(()=>window.notices.update(window.noticeId,{message:'Patched'})); await expect(page.getByText('Patched',{exact:true})).toBeVisible();
  await page.evaluate(()=>{window.notices.push({message:'Two',duration:0});window.notices.push({message:'Three',duration:0});}); await expect(page.getByText('Patched',{exact:true})).toHaveCount(0); await expect(page.locator('.kima-notification')).toHaveCount(2);
  await page.evaluate(()=>window.notices.clear()); await expect(page.locator('.kima-notification')).toHaveCount(0);
});
test('queue owns public push update dismiss without a global singleton',async ({page})=>{
  await mount(page,'<kima-notification-queue id="queue"></kima-notification-queue>'); await page.evaluate(()=>{const el=document.getElementById('queue');window.id=el.push({message:'Direct',duration:0});el.update(window.id,{message:'Direct update'});}); await expect(page.getByText('Direct update',{exact:true})).toBeVisible(); await page.evaluate(()=>document.getElementById('queue').dismiss(window.id)); await expect(page.locator('.kima-notification')).toHaveCount(0);
});
test('watermark repeats safe text without intercepting content controls',async ({page})=>{
  await mount(page,'<kima-watermark id="water"><button id="content">Clickable</button><div style="height:350px"></div></kima-watermark>',{water:{text:'<script>safe</script>'}}); await expect(page.locator('.kima-watermark__overlay')).toHaveAttribute('aria-hidden','true'); expect(await page.locator('.kima-watermark__overlay span').count()).toBeGreaterThan(3); await page.getByRole('button',{name:'Clickable'}).click(); expect(await page.locator('.kima-watermark script').count()).toBe(0);
});
test('affix top and bottom stick within container and respond to resize',async ({page})=>{
  await mount(page,'<div id="scroll" style="height:240px;overflow:auto"><div id="boundary" style="height:600px"><kima-affix id="affix" offset="8"><button>Sticky</button></kima-affix></div><div style="height:300px"></div></div>');
  await page.locator('#scroll').evaluate(el=>el.scrollTop=180); const delta=await page.evaluate(()=>document.querySelector('.kima-affix').getBoundingClientRect().top-document.getElementById('scroll').getBoundingClientRect().top); expect(Math.abs(delta-8)).toBeLessThan(2);
  await page.locator('#scroll').evaluate(el=>el.scrollTop=650); expect(await page.evaluate(()=>document.querySelector('.kima-affix').getBoundingClientRect().bottom<=document.getElementById('boundary').getBoundingClientRect().bottom+1)).toBe(true);
  await page.evaluate(()=>{document.getElementById('affix').placement='bottom';document.getElementById('scroll').style.height='180px';}); await expect(page.locator('.kima-affix')).toHaveCSS('bottom','8px');
});
test('new popup enter and leave expose real intermediate frames and retire semantics',async ({page})=>{
  await mount(page,'<kima-float-button id="float"></kima-float-button>',{float:{actions:[{id:'a',label:'Alpha'}]}});
  const snapshot=await page.evaluate(async()=>{document.querySelector('.kima-float-button__trigger').click();let el,animations=[];for(let i=0;i<20&&!animations.length;i++){await new Promise(requestAnimationFrame);el=document.querySelector('.kima-float-button__actions');if(el){getComputedStyle(el).opacity;animations=el.getAnimations();}} animations.forEach(animation=>{animation.pause();animation.currentTime=animation.effect.getTiming().duration/2;});return {opacity:Number(getComputedStyle(el).opacity),animations:animations.length};}); expect(snapshot.animations).toBeGreaterThan(0); expect(snapshot.opacity).toBeGreaterThan(0); expect(snapshot.opacity).toBeLessThan(1);
  await page.evaluate(()=>document.querySelector('.kima-float-button__trigger').click()); const panel=page.locator('.kima-float-button__actions'); await expect(panel).toHaveAttribute('aria-hidden','true'); await expect(panel).toHaveAttribute('inert','');
});
test('metadata extracts every new props and emits contract',async ({page})=>{
  const entries=await page.evaluate(async()=>(await import('/@id/__x00__kima-docs')).default); for(const slug of names){const entry=entries.find(item=>item.slug===slug);expect(entry?.attributes.length,slug).toBeGreaterThan(0);expect(entry?.events.length,slug).toBeGreaterThan(0);}
});
test('isolated Vue examples only mount current article, themes screenshots and no errors',async ({page},info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message)); await mkdir('shots/utility',{recursive:true});
  for(const slug of names){await page.evaluate(slug=>window.utility.examples(slug),slug);await expect(page.locator('article.kima-gallery__demo')).toHaveCount(1);await expect(page.locator('article')).toHaveAttribute('data-utility',slug);}
  for(const mode of ['light','dark']){
    await page.evaluate(mode=>window.utility.theme(mode),mode);
    for(const slug of names){
      await page.evaluate(slug=>window.utility.examples(slug),slug);
      if(slug==='tour') { await page.getByRole('button',{name:'开始导览'}).click(); await expect(page.getByRole('dialog')).toBeVisible(); }
      if(slug==='alert-dialog') { await page.getByRole('button',{name:'删除项目',exact:true}).click(); await expect(page.getByRole('alertdialog')).toBeVisible(); }
      if(slug==='virtual-select') { await page.getByRole('combobox').click(); await expect(page.getByRole('listbox')).toBeVisible(); }
      if(slug==='float-button') { await page.getByRole('button',{name:'快捷操作'}).click(); await expect(page.getByRole('button',{name:'新建项目'})).toBeVisible(); }
      if(slug==='notification-queue') { await page.getByRole('button',{name:'推送 / 去重'}).click(); await expect(page.getByText('项目已保存',{exact:true})).toBeVisible(); }
      await page.screenshot({path:`shots/utility/${info.project.name}-${mode}-${slug}.png`,fullPage:true,animations:'disabled'});
    }
  }
  expect(errors).toEqual([]);
});

test('bottom affix uses actual lower scroll edge after resize',async ({page})=>{
  await mount(page,'<div id="scroll" style="height:240px;overflow:auto"><div style="height:700px"><div style="height:400px"></div><kima-affix placement="bottom" offset="12"><button>Bottom</button></kima-affix><div style="height:200px"></div></div></div>');
  const gap=()=>page.evaluate(()=>document.getElementById('scroll').getBoundingClientRect().bottom-document.querySelector('.kima-affix').getBoundingClientRect().bottom);
  await expect.poll(gap).toBe(12);await page.locator('#scroll').evaluate(el=>el.style.height='180px');await expect.poll(gap).toBe(12);
});
test('QR renders encoded SVG, changes content and reports oversized errors',async ({page})=>{
  await mount(page,'<kima-qr-code id="qr" value="HELLO WORLD"></kima-qr-code>');const path=page.locator('#qr path');const initial=await path.getAttribute('d');expect(initial.length).toBeGreaterThan(1000);await expect(page.getByRole('img',{name:'二维码'})).toHaveAttribute('viewBox','0 0 29 29');
  await page.evaluate(()=>document.getElementById('qr').value='https://kima.example/你好');await expect(path).not.toHaveAttribute('d',initial);
  await page.evaluate(()=>document.getElementById('qr').value='x'.repeat(10000));await expect(page.getByRole('alert')).toContainText('无法生成二维码');
});
test('rapid alert reopen discards previous async result and blocks duplicate confirms',async ({page})=>{
  await page.evaluate(async()=>{await window.utility.mount('<kima-alert-dialog id="alert"></kima-alert-dialog>',{alert:{open:true,confirmHandler:()=>{window.calls=(window.calls||0)+1;return new Promise(resolve=>window.oldResolve=resolve);}}});});
  await page.getByRole('button',{name:'确认',exact:true}).click();await expect(page.getByRole('button',{name:'确认',exact:true})).toBeDisabled();
  await page.evaluate(()=>document.getElementById('alert').open=false);await expect(page.getByRole('alertdialog')).not.toBeVisible();await page.evaluate(()=>document.getElementById('alert').open=true);await expect(page.getByRole('button',{name:'取消',exact:true})).toBeFocused();await page.evaluate(()=>window.oldResolve());await expect(page.getByRole('alertdialog')).toBeVisible();expect(await page.evaluate(()=>window.calls)).toBe(1);
});
test('virtual manual scroll always references a mounted row and external property resyncs',async ({page})=>{
  await page.evaluate(()=>window.utility.mount('<kima-virtual-select id="v"></kima-virtual-select>',{v:{options:Array.from({length:1000},(_,i)=>({value:i,label:`Row ${i}`})),modelValue:900}}));const control=page.getByRole('combobox');await control.click();await expect.poll(()=>control.evaluate(el=>document.getElementById(el.getAttribute('aria-activedescendant'))?.textContent)).toBe('Row 900');
  await page.getByRole('listbox').evaluate(el=>{el.scrollTop=10000;el.dispatchEvent(new Event('scroll'));});await expect.poll(()=>control.evaluate(el=>Boolean(document.getElementById(el.getAttribute('aria-activedescendant'))))).toBe(true);await control.press('Escape');await page.evaluate(()=>document.getElementById('v').modelValue=12);await expect(page.locator('.kima-virtual-select__summary')).toHaveText('Row 12');
});
test('reduced motion suppresses popup movement and number interpolations',async ({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await mount(page,'<kima-float-button id="f"></kima-float-button><kima-animated-number id="n" value="0"></kima-animated-number>',{f:{actions:[{id:'a',label:'Alpha'}]}});await page.getByRole('button',{name:'快捷操作'}).click();const duration=await page.locator('.kima-float-button__actions').evaluate(el=>getComputedStyle(el).transitionDuration);expect(duration.split(',').every(value=>parseFloat(value)<=0.001)).toBe(true);await page.evaluate(()=>document.getElementById('n').value=123);await expect(page.locator('.kima-animated-number')).toHaveText('123');
});
test('queue capacity zero hides items and replacement service unsubscribes old source',async ({page})=>{
  await page.evaluate(async()=>{window.a=window.utility.createNotifications();window.b=window.utility.createNotifications();await window.utility.mount('<kima-notification-queue id="q" capacity="0"></kima-notification-queue>',{q:{service:window.a}});window.a.push({message:'Hidden',duration:0});});
  await expect(page.locator('.kima-notification')).toHaveCount(0);await page.evaluate(()=>{document.getElementById('q').capacity=2;document.getElementById('q').service=window.b;window.b.push({message:'New service',duration:0});});await expect(page.getByText('New service',{exact:true})).toBeVisible();await page.evaluate(()=>window.a.push({message:'Old service',duration:0}));await expect(page.getByText('Old service',{exact:true})).toHaveCount(0);
});
test('open virtual select native reset closes panel and restores initial value',async ({page})=>{
  await mount(page,'<form><kima-virtual-select id="v" name="v"></kima-virtual-select></form>',{v:{modelValue:'a',options:[{value:'a',label:'Alpha'},{value:'b',label:'Beta'}]}});await page.getByRole('combobox').click();await page.getByRole('combobox').press('ArrowDown');await page.getByRole('combobox').press('Enter');await page.getByRole('combobox').click();await page.evaluate(()=>document.querySelector('form').reset());await expect(page.getByRole('combobox')).toHaveAttribute('aria-expanded','false');await expect.poll(()=>data(page)).toEqual([['v','a']]);
});
test('standalone built CE module works without source imports or node globals',async ({page})=>{
  const bundle=await readFile('dist/kima-elements.js','utf8');const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.route('**/utility-standalone',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><div id="fixture"></div><script type="module" src="/utility-standalone.js"></script></body></html>'}));await page.route('**/utility-standalone.js',route=>route.fulfill({contentType:'text/javascript',body:bundle}));await page.goto('/utility-standalone');await page.evaluate(()=>customElements.whenDefined('kima-virtual-select'));await page.evaluate(()=>{const root=document.getElementById('fixture');root.innerHTML='<kima-qr-code value="standalone"></kima-qr-code><kima-loading-bar id="bar"></kima-loading-bar><kima-virtual-select id="choice"></kima-virtual-select>';document.getElementById('choice').options=[{value:'a',label:'Built Alpha'}];});await expect(page.getByRole('img',{name:'二维码'})).toBeVisible();await page.evaluate(()=>document.getElementById('bar').start());await expect(page.getByRole('progressbar')).toBeVisible();await page.getByRole('combobox').click();await expect(page.getByRole('option',{name:'Built Alpha'})).toBeVisible();expect(errors).toEqual([]);
});
