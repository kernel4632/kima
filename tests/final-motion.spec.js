import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// This suite is intentionally discovered by the unchanged main config.
// KIMA_TEST_PORT=5224 pnpm exec playwright test tests/final-motion.spec.js --workers=1
const groups = {
  advanced: ['range-slider','calendar','date-range-picker','time-range-picker','datetime-picker','mention','form','editable','transfer'],
  data: ['infinite-scroll','virtual-table','virtual-tree','image-preview','notification-queue','relative-time','ring-progress','copy-button','long-text'],
  form: ['datetime-range-picker','period-picker','date-field','time-field','time-select','dynamic-input','masked-input','json-input','angle-slider','upload-manager'],
  utility: ['tour','qr-code','watermark','affix','float-button','log-viewer','loading-bar','animated-number','listbox','progress-group','alert-dialog','virtual-select','tag-group'],
  foundation: ['grid','flex','stack','field-group','input-group','page-header','banner','error-state','typography','mark','time-display'],
  content: ['chart','heatmap','rich-text-editor','code-editor','equation'],
  shell: ['sidebar','app-shell','config-provider','masonry','marquee','gradient-text'],
};
const staticNames = new Set(['qr-code','watermark','affix','relative-time','grid','flex','stack','input-group','page-header','typography','mark','time-display','config-provider','masonry']);
const options = [{value:'a',label:'Alpha'},{value:'b',label:'Beta'}];
const initial = {
  calendar:{modelValue:'2026-06-15'}, 'date-range-picker':{modelValue:['2026-06-10','2026-06-12']},
  'time-range-picker':{modelValue:['09:00','10:00']}, 'datetime-picker':{modelValue:'2026-06-01T09:00'}, mention:{items:['Alpha','Beta']},
  editable:{modelValue:'Alpha'}, transfer:{options}, 'virtual-table':{columns:[{key:'name',label:'名称'}],rows:[{id:'a',name:'Alpha'},{id:'b',name:'Beta'}],selectable:true},
  'virtual-tree':{items:[{value:'a',label:'Alpha',children:[{value:'b',label:'Beta'}]}],selectable:true},
  'image-preview':{src:'/th.jpg',alt:'预览内容'}, 'notification-queue':{items:[{id:'a',message:'Alpha',duration:0}]},
  'relative-time':{date:'2026-06-01T09:00:00Z',locale:'zh-CN',updateInterval:0}, 'ring-progress':{value:20,showValue:true}, 'copy-button':{text:'Alpha',timeout:1000},
  'long-text':{text:'可展开内容。'.repeat(100),lines:1}, 'datetime-range-picker':{modelValue:['2026-06-01T09:00','2026-06-01T10:00']},
  'period-picker':{modelValue:'2026-06'}, 'time-select':{items:options}, 'dynamic-input':{modelValue:[{id:'a',value:'Alpha'},{id:'b',value:'Beta'}]},
  'masked-input':{mask:'AA-##'}, 'json-input':{modelValue:'{"ok":true}'}, tour:{steps:[{target:'#target',title:'Alpha'},{target:'#target',title:'Beta'}]},
  'qr-code':{value:'KIMA'}, watermark:{text:'KIMA'}, 'float-button':{actions:[{id:'a',label:'Alpha'}]}, 'log-viewer':{lines:['Alpha','Beta']},
  listbox:{options}, 'progress-group':{tasks:[{id:'a',label:'Alpha',value:10},{id:'b',label:'Beta',value:20}]},
  'virtual-select':{options}, 'tag-group':{items:options,modelValue:['a'],selectable:true,removable:true},
  'field-group':{hint:'Alpha'}, 'page-header':{heading:'Alpha',description:'正文'}, banner:{heading:'Alpha',description:'正文',closable:true},
  'error-state':{heading:'错误恢复'}, mark:{text:'Alpha'}, 'time-display':{value:'2026-06-01',mode:'date'},
  chart:{series:[{name:'Alpha',data:[1,2]}],labels:['一','二']}, heatmap:{values:[[1,2]],columns:['一','二']},
  'rich-text-editor':{modelValue:'<p>Alpha</p>'}, 'code-editor':{modelValue:'const value = 1;'}, equation:{formula:'x^2'},
  sidebar:{breakpoint:0,items:[{value:'a',label:'Alpha',href:'#a'}]}, 'app-shell':{breakpoint:9999}, marquee:{animated:true,duration:2}, 'gradient-text':{animated:true},
};
const slots = {watermark:'<button>内容操作</button>',affix:'<button>吸附内容</button>',grid:'<p>Alpha</p>',flex:'<p>Alpha</p>',stack:'<p>Alpha</p>','field-group':'<input aria-label="组内字段">','input-group':'<input aria-label="输入组字段">',typography:'Alpha','config-provider':'<button>局部内容</button>',masonry:'<p>Alpha</p><p>Beta</p>',marquee:'<a href="#news">Alpha</a><span>Beta</span>','gradient-text':'Alpha','app-shell':'<a href="#a" slot="sidebar">Alpha</a><p slot="main">正文</p>',form:'<input name="value" value="Alpha"><button type="submit">提交</button>'};
async function ready(page) {
  await page.goto('/tests/fixture.html');
  await page.waitForFunction(()=>typeof window.fixture?.mount === 'function');
  // The generic behavior fixture deliberately has no page theme. Visual evidence
  // must pair the library's default dark foreground tokens with its surface.
  await page.addStyleTag({ content: 'html { background: var(--kima-color-surface); color: var(--kima-color-on-surface); color-scheme: dark; } body { background: var(--kima-color-surface); color: var(--kima-color-on-surface); } #target { background: var(--kima-color-layer-2); color: inherit; border: 0; border-radius: var(--kima-radius-s); min-height: var(--kima-touch-target); font: inherit; }' });
}
async function mount(page,slug,properties=initial[slug]||{}) {
  await page.evaluate(async({slug,properties,content})=>{
    const container = slug === 'form' ? 'div' : 'form';
    await window.fixture.mount(`<button id="target">外部目标</button><${container} id="native-form"><kima-${slug} id="subject" name="value" style="display:block;max-width:640px">${content}</kima-${slug}></${container}>`,{subject:properties});
    const el=document.getElementById('subject');
    if(slug==='form') el.handleSubmit=async()=>{throw new Error('提交失败');};
    if(slug==='infinite-scroll'){el.observe=false;el.loadMore=()=>new Promise(resolve=>{window.finishLoad=resolve;});}
    if(slug==='error-state') el.retryHandler=async()=>{throw new Error('服务失败');};
  },{slug,properties,content:slots[slug]||''});
}
async function frames(page,selector='#subject') {
  return page.evaluate(async selector=>{const out=[];for(let i=0;i<5;i++){await new Promise(requestAnimationFrame);const nodes=[...document.querySelectorAll(selector)];out.push(nodes.map(el=>({tag:el.tagName,class:el.className?.baseVal??el.className,text:el.textContent.slice(0,100),height:el.getBoundingClientRect().height,opacity:Number(getComputedStyle(el).opacity),inert:el.inert,hidden:el.getAttribute('aria-hidden'),animations:el.getAnimations().map(a=>({type:a.constructor.name,time:a.currentTime,progress:a.effect?.getComputedTiming().progress,frames:a.effect?.getKeyframes()}))})));}return out;},selector);
}
async function save(page,info,name,data) {const dir=`artifacts/final-motion/${info.project.name}`;await mkdir(dir,{recursive:true});await writeFile(`${dir}/${name}.json`,JSON.stringify(data,null,2));await page.screenshot({path:`${dir}/${name}.png`,fullPage:true});}
async function operate(page,slug) {
  const host=page.locator('[id="subject"]').first();
  const click=selector=>host.locator(selector).first().evaluate(el=>el.click());
  const set=values=>host.evaluate((el,values)=>Object.assign(el,values),values);
  switch(slug){
    case 'range-slider': await host.locator('input[type=range]').first().focus();await page.keyboard.press('ArrowRight');await expect(host.locator('output')).toContainText('26');break;
    case 'calendar': await click('button[aria-label="下一月"]');await expect(host.locator('h2')).toContainText('7月');break;
    case 'date-range-picker': await click('.kima-date-range-picker__navigation button');await expect(host.locator('h2').first()).toContainText('5月');break;
    case 'time-range-picker': await host.locator('input').last().fill('11:00');await expect(host.locator('output')).toContainText('2h');break;
    case 'datetime-picker': await host.locator('input').fill('2026-07-01T09:00');await expect(host.locator('input')).toHaveValue('2026-07-01T09:00');break;
    case 'mention': await host.locator('textarea').fill('@');await expect(host.getByRole('option')).toHaveCount(2);break;
    case 'form': await click('button');await expect(host.locator('.kima-form__error')).toHaveText('提交失败');break;
    case 'editable': await click('.kima-editable__display');await expect(host.locator('.kima-editable__input')).toBeFocused();break;
    case 'transfer': await host.locator('select').first().selectOption('a');await host.getByRole('button',{name:'移入选中项 →'}).click();await expect(host.locator('input[type=hidden]')).toHaveValue('a');break;
    case 'infinite-scroll': await click('button');await expect(host.locator('[role=region]')).toHaveAttribute('aria-busy','true');break;
    case 'virtual-table': await set({modelValue:['a']});await expect(host.locator('.kima-virtual-table__row--selected')).toHaveCount(1);break;
    case 'virtual-tree': await click('.kima-virtual-tree__toggle');await expect(host.locator('[role=treeitem]')).toHaveCount(2);break;
    case 'image-preview': await click('.kima-image-preview__trigger');await expect(page.getByRole('dialog')).toBeVisible();break;
    case 'notification-queue': await set({items:[]});await expect(host.locator('.kima-notification-queue__item:not([inert])')).toHaveCount(0);break;
    case 'ring-progress': await set({value:80});await expect(host.getByRole('progressbar')).toHaveAttribute('aria-valuenow','80');break;
    case 'copy-button': await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}});});await click('button');await expect(host.getByRole('status')).toHaveText('已复制');break;
    case 'long-text': await click('button');await expect(host.locator('button')).toHaveAttribute('aria-expanded','true');break;
    case 'datetime-range-picker': await host.locator('input').last().fill('2026-06-01T08:00');await expect(host.getByRole('alert')).toBeVisible();break;
    case 'period-picker': await host.locator('input').fill('2026-07');await expect(host.locator('input')).toHaveValue('2026-07');break;
    case 'date-field': {const inputs=host.locator('.kima-date-field__segment');await inputs.nth(0).fill('2026');await inputs.nth(1).fill('06');await inputs.nth(2).fill('15');await expect(host.locator('.kima-date-field__native')).toHaveValue('2026-06-15');break;}
    case 'time-field': {const inputs=host.locator('.kima-time-field__segment');await inputs.nth(0).fill('09');await inputs.nth(1).fill('30');await expect(host.locator('.kima-time-field__native')).toHaveValue('09:30');break;}
    case 'time-select': await click('button');await expect(page.getByRole('listbox')).toBeVisible();break;
    case 'dynamic-input': await click('button[aria-label="移除第1项"]');await expect(host.locator('.kima-dynamic-input__row:not([inert])')).toHaveCount(1);break;
    case 'masked-input': await host.locator('input').fill('ab-12');await expect(host.locator('input')).toHaveValue('ab-12');break;
    case 'json-input': await host.locator('textarea').fill('{');await expect(host.getByRole('alert')).toBeVisible();break;
    case 'angle-slider': await host.getByRole('slider').focus();await page.keyboard.press('ArrowRight');await expect(host.getByRole('slider')).toHaveAttribute('aria-valuenow','1');break;
    case 'upload-manager': await host.locator('input[type=file]').setInputFiles({name:'Alpha.txt',mimeType:'text/plain',buffer:Buffer.from('Alpha')});await expect(host.locator('.kima-upload-manager__list li')).toHaveCount(1);break;
    case 'tour': await set({open:true});await expect(page.getByRole('dialog')).toBeVisible();break;
    case 'float-button': await click('.kima-float-button__trigger');await expect(host.getByRole('button',{name:'Alpha'})).toBeFocused();break;
    case 'log-viewer': await host.getByRole('searchbox').fill('Beta');await expect(host.locator('.kima-log-viewer__line')).toHaveCount(1);break;
    case 'loading-bar': await host.evaluate(el=>el.start());await expect(host.getByRole('progressbar')).toBeVisible();break;
    case 'animated-number': await set({value:100});await expect(host.locator('.kima-animated-number')).toHaveAttribute('aria-label','100');break;
    case 'listbox': await host.getByRole('option',{name:'Beta'}).click();await expect(host.getByRole('option',{name:'Beta'})).toHaveAttribute('aria-selected','true');break;
    case 'progress-group': await set({tasks:[{id:'b',label:'Beta',value:80}]});await expect(host.getByRole('progressbar',{name:'任务总进度'})).toHaveAttribute('value','80');break;
    case 'alert-dialog': await set({open:true});await expect(page.getByRole('alertdialog')).toBeVisible();break;
    case 'virtual-select': await click('input');await expect(host.getByRole('listbox')).toBeVisible();break;
    case 'tag-group': await host.getByRole('button',{name:'Alpha',exact:true}).focus();await page.keyboard.press('Delete');await expect(host.locator('input[type=hidden]')).toHaveCount(0);break;
    case 'field-group': await set({error:'分组错误'});await expect(host.locator('input')).toHaveAttribute('aria-invalid','true');break;
    case 'banner': await click('button');await expect(host.locator('.kima-banner__clip')).toHaveAttribute('inert','');break;
    case 'error-state': await click('button');await expect(host.locator('.kima-error-state__failure')).toContainText('服务失败');break;
    case 'chart': case 'heatmap': await host.getByRole('button',{name:/查看.*数据表/}).evaluate(el=>el.click());await expect(host.locator(`.kima-${slug}__table`)).toBeVisible();break;
    case 'rich-text-editor': await host.getByRole('button',{name:'链接',exact:true}).click();await expect(host.getByRole('textbox',{name:'链接地址'})).toBeVisible();break;
    case 'code-editor': await host.getByRole('button',{name:'查找',exact:true}).click();await expect(host.locator('.cm-search')).toBeVisible();break;
    case 'equation': await set({formula:'y^3'});await expect(host.locator('math')).toContainText('y');break;
    case 'sidebar': await click('button');await expect(host.locator('aside')).toHaveAttribute('data-collapsed','true');break;
    case 'app-shell': await click('button');await expect(host.locator('dialog')).toBeVisible();break;
    case 'marquee': await set({paused:true});await expect.poll(()=>host.locator('.kima-marquee__track').evaluate(el=>getComputedStyle(el).animationName==='none'||getComputedStyle(el).animationPlayState==='paused')).toBe(true);break;
    case 'gradient-text': await expect(host.locator('.kima-gradient-text')).toHaveText('Alpha');break;
    default: expect(staticNames.has(slug),slug).toBe(true);await expect(host).toBeVisible();
  }
}

for(const [group,names] of Object.entries(groups)) for(const slug of names){
  test(`63 audit / ${group} / ${slug}`,async({page},info)=>{
    const errors=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
    for(const mode of ['no-preference','reduce']){
      await page.emulateMedia({reducedMotion:mode});await mount(page,slug);await operate(page,slug);
      const sample=await frames(page,`#subject [class*="kima-"], .kima-image-preview__overlay`);
      if(mode==='reduce') expect(sample.flat().flatMap(n=>n.animations).filter(a=>a.type==='CSSTransition'||a.type==='CSSAnimation')).toEqual([]);
      await save(page,info,`${slug}-${mode}`,{slug,group,mode,static:staticNames.has(slug),samples:sample});
    }
    expect(errors).toEqual([]);
  });
}

// Sample real running animations, not just declared transition-duration values.
async function moving(page,selector){
  return page.evaluate(async selector=>{for(let i=0;i<40;i++){await new Promise(requestAnimationFrame);for(const el of document.querySelectorAll(selector)){for(const animation of el.getAnimations()){const timing=animation.effect.getComputedTiming();if(timing.progress>0&&timing.progress<1){return {opacity:Number(getComputedStyle(el).opacity),height:el.getBoundingClientRect().height,progress:timing.progress,inert:el.inert,hidden:el.getAttribute('aria-hidden'),type:animation.constructor.name};}}}}throw Error(`No actual intermediate frame: ${selector}`);},selector);
}
for(const [slug,selector,open,close] of [
  ['mention','.kima-mention__popup','mention-open','mention-close'],
  ['float-button','.kima-float-button__actions','float-open','float-close'],
  ['virtual-select','.kima-virtual-select__viewport','virtual-open','virtual-close'],
  ['image-preview','.kima-image-preview__overlay','preview-open','preview-close'],
  ['rich-text-editor','.kima-rich-text-editor__link','link-open','link-close'],
  ['editable','.kima-editable__editor','edit-open','edit-close'],
]) test(`presence frames exit fast reversal reduced / ${slug}`,async({page},info)=>{
  await ready(page);await mount(page,slug);
  async function action(name){await page.evaluate(name=>{const host=document.getElementById('subject');const click=s=>host.querySelector(s).click();switch(name){case'mention-open':{const el=host.querySelector('textarea');el.focus();el.value='@';el.dispatchEvent(new Event('input',{bubbles:true}));break;}case'mention-close':host.querySelector('textarea').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));break;case'float-open':case'float-close':click('.kima-float-button__trigger');break;case'virtual-open':case'virtual-close':click('.kima-virtual-select__control');break;case'preview-open':host.open=true;break;case'preview-close':host.open=false;break;case'link-open':[...host.querySelectorAll('button')].find(el=>el.textContent==='链接').click();break;case'link-close':[...host.querySelectorAll('button')].find(el=>el.textContent==='取消').click();break;case'edit-open':host.edit();break;case'edit-close':host.cancel();break;}},name);}
  await action(open);const enter=await moving(page,selector);expect(enter.opacity).toBeGreaterThan(0);expect(enter.opacity).toBeLessThan(1);
  await page.waitForTimeout(250);await action(close);const leave=await moving(page,selector);expect(leave.inert).toBe(true);expect(leave.hidden).toBe('true');
  await action(open);await expect(page.locator(selector)).not.toHaveAttribute('inert','');await expect(page.locator(selector)).not.toHaveAttribute('aria-hidden','true');
  await page.waitForTimeout(300);await expect(page.locator(selector)).toBeVisible();
  await save(page,info,`${slug}-presence`,{enter,leave,reopened:true});
  await page.emulateMedia({reducedMotion:'reduce'});await action(close);await page.waitForTimeout(40);await expect(page.locator(selector)).toBeHidden();await action(open);await expect(page.locator(selector)).toBeVisible();
});

test('content updates calendar and formula have real frames and immediate fresh DOM',async({page},info)=>{
  await ready(page);const evidence={};
  for(const slug of ['calendar','equation','field-group','json-input','long-text']){await mount(page,slug);await operate(page,slug);const selector={calendar:'.kima-calendar__grid',equation:'.kima-equation','field-group':'.kima-field-group__messages','json-input':'.kima-json-input__message','long-text':'.kima-long-text__content'}[slug];evidence[slug]=await moving(page,selector);expect(evidence[slug].opacity).toBeLessThan(1);}
  await save(page,info,'content-update-frames',evidence);
});

for(const slug of ['chart','heatmap','banner']) test(`collapse visible frames exit reversal reduced / ${slug}`,async({page},info)=>{
  await ready(page);await mount(page,slug);const selector=slug==='banner'?'.kima-banner__clip':`.kima-${slug}__table`;
  const toggle=()=>page.evaluate(slug=>{const host=document.getElementById('subject');if(slug==='banner')host.open=!host.open;else [...host.querySelectorAll('button')].find(el=>el.textContent.includes('数据表')).click();},slug);
  if(slug!=='banner')await toggle();else {await toggle();await page.waitForTimeout(350);await toggle();}
  const enter=await moving(page,selector);expect(enter.height).toBeGreaterThan(0);await toggle();const leave=await moving(page,selector);expect(leave.inert).toBe(true);await toggle();await page.waitForTimeout(350);await expect(page.locator(selector)).toBeVisible();await expect(page.locator(selector)).not.toHaveAttribute('inert','');
  await save(page,info,`${slug}-collapse`,{enter,leave});await page.emulateMedia({reducedMotion:'reduce'});await toggle();await expect(page.locator(selector)).toBeHidden();
});

test('table enhancement expansion sorting loading edit and keyboard stay immediate',async({page},info)=>{
  await ready(page);await mount(page,'table',{columns:[{key:'name',label:'名称',sortable:true,editable:true,resizable:true,width:220}],rows:[{id:'b',name:'Beta'},{id:'a',name:'Alpha'}],expandable:true,editable:true,selectable:true});
  const host=page.locator('#subject');await host.locator('.kima-table__sort-button').evaluate(el=>el.click());
  // 必须采到组件本地排序产生的真实 FLIP 帧，不能靠宿主重排制造动画。
  const reorder=await moving(page,'.kima-table tbody tr');
  await expect(host.locator('th[aria-sort]')).toHaveAttribute('aria-sort','ascending');
  await expect(host.locator('tbody tr td:last-child')).toHaveText(['Alpha','Beta']);
  expect(await host.evaluate(el=>el.rows.map(row=>row.name))).toEqual(['Beta','Alpha']);
  await page.waitForTimeout(350);
  await host.evaluate(el=>{el.sortKey='name';el.sortDirection='desc';});
  const controlledReorder=await moving(page,'.kima-table tbody tr');
  await expect(host.locator('tbody tr td:last-child')).toHaveText(['Beta','Alpha']);
  await host.locator('.kima-table__expand-button').first().evaluate(el=>el.click());await expect(host.locator('.kima-table__expanded-row')).toBeVisible();
  await host.locator('.kima-table__expand-button').first().evaluate(el=>el.click());const expandedExit=await moving(page,'.kima-table__expanded-row');expect(expandedExit.inert).toBe(true);
  await host.evaluate(el=>el.loading=true);const loadingExit=await moving(page,'.kima-table tbody.kima-fade-leave-active');expect(loadingExit.inert).toBe(true);
  await host.evaluate(el=>el.loading=false);await expect(host.locator('tbody:not([inert]) tr:not(.kima-list-leave-active)')).toHaveCount(2);
  await save(page,info,'table-enhancement',{reorder,controlledReorder,expandedExit,loadingExit});
});

test('list removals keep visible inert exits and immediate model state',async({page},info)=>{
  await ready(page);const evidence={};
  for(const slug of ['dynamic-input','tag-group','progress-group','notification-queue','upload-manager']){
    await mount(page,slug);if(slug==='upload-manager')await operate(page,slug);await page.waitForTimeout(300);
    await page.evaluate(slug=>{const host=document.getElementById('subject');if(slug==='dynamic-input')host.remove(0);if(slug==='tag-group')host.querySelector('button').dispatchEvent(new KeyboardEvent('keydown',{key:'Delete',bubbles:true}));if(slug==='progress-group')host.tasks=[];if(slug==='notification-queue')host.items=[];if(slug==='upload-manager')host.querySelector('.kima-upload-manager__list [aria-label="移除 Alpha.txt"]').click();},slug);
    const selector={ 'dynamic-input':'.kima-dynamic-input__row','tag-group':'.kima-tag-group__items > *','progress-group':'.kima-progress-group li','notification-queue':'.kima-notification-queue__item','upload-manager':'.kima-upload-manager__list li'}[slug];
    evidence[slug]=await moving(page,selector);expect(evidence[slug].inert).toBe(true);expect(evidence[slug].hidden).toBe('true');
  }await save(page,info,'list-exits',evidence);
});

test('numeric and continuous motion samples reverse and honor reduced',async({page},info)=>{
  await ready(page);await mount(page,'animated-number');await operate(page,'animated-number');const samples=await frames(page,'.kima-animated-number');expect(samples.flat().some(n=>Number(n.text)>0&&Number(n.text)<100)).toBe(true);await page.locator('#subject').evaluate(el=>el.value=-20);await expect(page.locator('.kima-animated-number')).toHaveText('-20');
  await mount(page,'ring-progress');await operate(page,'ring-progress');const ring=await moving(page,'.kima-ring-progress__value');await page.locator('#subject').evaluate(el=>el.value=10);await moving(page,'.kima-ring-progress__value');
  await mount(page,'gradient-text');const gradient=await moving(page,'.kima-gradient-text');await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.kima-gradient-text')).toHaveCSS('animation-name','none');await save(page,info,'numeric-continuous',{samples,ring,gradient});
});

test('calendar fresh focus quick month reversal and scoped zero-duration content',async({page},info)=>{
  await ready(page);await mount(page,'calendar');
  const result=await page.evaluate(async()=>{
    const host=document.getElementById('subject');const next=host.querySelector('[aria-label="下一月"]'),prev=host.querySelector('[aria-label="上一月"]'),grid=host.querySelector('[role=grid]');
    next.click();await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);
    const forward={opacity:Number(getComputedStyle(grid).opacity),title:host.querySelector('h2').textContent};
    prev.click();await new Promise(requestAnimationFrame);const reverse={opacity:Number(getComputedStyle(grid).opacity),title:host.querySelector('h2').textContent};
    return {forward,reverse,grids:host.querySelectorAll('[role=grid]').length};
  });expect(result.forward.opacity).toBeLessThan(1);expect(result.reverse.title).toContain('6月');expect(result.grids).toBe(1);
  await page.locator('[data-date="2026-06-30"]').focus();await page.keyboard.press('ArrowRight');await expect(page.locator('[data-date="2026-07-01"]')).toBeFocused();
  await page.locator('kima-calendar').evaluate(el=>el.style.setProperty('--kima-duration-effects','0ms'));await page.locator('[aria-label="上一月"]').evaluate(el=>el.click());expect(await page.locator('.kima-calendar__grid').evaluate(el=>el.getAnimations().length)).toBe(0);
  await save(page,info,'calendar-reversal-zero',result);
});

test('copy visual exit keeps status immediate; infinite loading exits and retries',async({page},info)=>{
  await ready(page);await mount(page,'copy-button');await operate(page,'copy-button');
  const copy=await moving(page,'.kima-copy-button__visual > span');await expect(page.locator('.kima-copy-button__status')).toHaveText('已复制');
  await mount(page,'infinite-scroll');await operate(page,'infinite-scroll');await page.waitForTimeout(250);await page.evaluate(()=>window.finishLoad(false));const loadingExit=await moving(page,'.kima-infinite-scroll__status .kima-fade-leave-active');expect(loadingExit.inert).toBe(true);await expect(page.getByText('没有更多内容')).toBeVisible();
  await save(page,info,'copy-infinite-frames',{copy,loadingExit});
});

test('virtual row colors animate while scroll recycling remains immediate',async({page},info)=>{
  await ready(page);const result={};
  await mount(page,'virtual-tree');await page.locator('.kima-virtual-tree__node').evaluate(el=>el.click());result.tree=await moving(page,'.kima-virtual-tree__node');await expect(page.locator('[role=treeitem]')).toHaveAttribute('aria-selected','true');
  await mount(page,'virtual-table');await operate(page,'virtual-table');result.table=await moving(page,'.kima-virtual-table__row--selected');await page.emulateMedia({reducedMotion:'reduce'});await page.locator('kima-virtual-table').evaluate(el=>el.modelValue=['b']);await expect(page.locator('.kima-virtual-table__row--selected')).toContainText('Beta');await expect.poll(()=>page.locator('.kima-virtual-table tr').evaluateAll(els=>els.flatMap(el=>el.getAnimations()).length)).toBe(0);
  await save(page,info,'virtual-color-frames',result);
});

test('loading bar leave reverses without an old cleanup hiding a new task',async({page},info)=>{
  await ready(page);await mount(page,'loading-bar',{finishDelay:0});await page.locator('kima-loading-bar').evaluate(el=>{window.releaseMotion=el.start();});await page.waitForTimeout(250);await page.evaluate(()=>window.releaseMotion());const leave=await moving(page,'.kima-loading-bar__track');expect(leave.inert).toBe(true);
  await page.locator('kima-loading-bar').evaluate(el=>el.start());await expect(page.locator('.kima-loading-bar')).toHaveAttribute('aria-busy','true');await page.waitForTimeout(300);await expect(page.locator('.kima-loading-bar__track')).not.toHaveAttribute('inert','');
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('kima-loading-bar').evaluate(el=>el.finish());await expect(page.locator('.kima-loading-bar__track')).toHaveCount(0);await save(page,info,'loading-reentry',{leave});
});

for(const slug of ['tour','alert-dialog','app-shell']) test(`native modal CSS completion fresh focus reversal reduced / ${slug}`,async({page},info)=>{
  await ready(page);await mount(page,slug);await operate(page,slug);const dialog=page.locator('dialog');const motion=slug==='app-shell'?'.kima-drawer__panel':'dialog';const enter=await moving(page,motion);
  await page.waitForTimeout(350);await page.locator(`[id="subject"]`).first().evaluate(el=>el.open=false);const leave=await moving(page,motion);
  await page.locator(`[id="subject"]`).first().evaluate(el=>el.open=true);await expect(dialog).toHaveAttribute('open','');await page.waitForTimeout(350);await expect(dialog).toBeVisible();
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator(`[id="subject"]`).first().evaluate(el=>el.open=false);await expect(dialog).toBeHidden();await save(page,info,`${slug}-modal-frames`,{enter,leave});
});

test('visual evidence uses matching light and dark surfaces',async({page},info)=>{
  await ready(page);
  for(const theme of ['dark','light']){
    await page.evaluate(async theme=>{
      const {applyPalette,defaultSeed,defaultVariant}=await import('/src/utils/theme.js');
      applyPalette(defaultSeed,{isDark:theme==='dark',variant:defaultVariant});
      document.documentElement.style.colorScheme=theme;
    },theme);
    for(const slug of ['calendar','image-preview']){
      await mount(page,slug);await operate(page,slug);await page.waitForTimeout(300);
      const colors=await page.evaluate(()=>({surface:getComputedStyle(document.body).backgroundColor,foreground:getComputedStyle(document.querySelector('.kima-calendar')||document.querySelector('.kima-image-preview__dialog')).color}));
      expect(colors.surface).not.toBe(colors.foreground);
      await save(page,info,`${slug}-${theme}-readable`,{theme,colors});
    }
  }
});

test('sidebar width reverses from the current frame and reduced is immediate',async({page},info)=>{
  await ready(page);await mount(page,'sidebar');const frames=await page.evaluate(async()=>{const host=document.getElementById('subject'),side=host.querySelector('aside');host.collapsed=true;await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);const first=side.getBoundingClientRect().width;host.collapsed=false;await new Promise(requestAnimationFrame);const second=side.getBoundingClientRect().width;return{first,second};});expect(frames.first).toBeGreaterThan(180);expect(frames.first).toBeLessThan(288);expect(Math.abs(frames.second-frames.first)).toBeLessThan(40);await page.emulateMedia({reducedMotion:'reduce'});await page.locator('kima-sidebar').evaluate(el=>el.collapsed=true);await expect(page.locator('aside')).toHaveCSS('width','180px');await save(page,info,'sidebar-width-reverse',frames);
});
