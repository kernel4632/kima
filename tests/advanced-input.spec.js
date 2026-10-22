import { test, expect } from "@playwright/test";
const names = ["range-slider","calendar","date-range-picker","time-range-picker","datetime-picker","mention","form","editable","transfer"];
test.beforeEach(async ({page}) => { await page.goto('/tests/fixture.html'); await expect(page.locator('html')).toHaveAttribute('data-ready','true'); });
async function mount(page,html,properties={}) { await page.evaluate(([html,properties])=>window.fixture.mount(html,properties),[html,properties]); }
async function data(page,selector='form') { return page.evaluate(selector=>[...new FormData(document.querySelector(selector))],selector); }
async function valid(page) { return page.locator('form').evaluate(form=>form.checkValidity()); }
const options=[{value:'a',label:'Alpha'},{value:'b',label:'Beta'},{value:'c',label:'Disabled',disabled:true},{value:'d',label:'Delta'}];

test('nine entries, metadata, isolated Vue demos and theme screenshots',async ({page},info)=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  expect(await page.evaluate(names=>names.every(n=>customElements.get(`kima-${n}`)),names)).toBe(true);
  expect(await page.evaluate(async()=>Object.keys((await import('/src/site/advanced-input-catalog.js')).advancedInputCatalog))).toEqual(names);
  await page.evaluate(async()=>{(await import('/tests/advanced-input-fixture.js')).mountAdvancedInputExamples();});
  for(const theme of ['dark','light']){
    await page.evaluate(async theme=>{(await import('/src/utils/theme.js')).applyPalette('#61afef',{isDark:theme==='dark'});},theme);
    for(const name of names){await page.evaluate(name=>window.advancedInputSlug.value=name,name);await expect(page.locator('article')).toHaveCount(1);await expect(page.locator('h3')).toHaveText(name);await page.screenshot({path:`shots/advanced-input/${info.project.name}-${theme}-${name}.png`,fullPage:true});}
  }
  await page.evaluate(()=>window.advancedInputApp.unmount());expect(errors).toEqual([]);
});
test('range collision, decimals, native keyboard, names and reset',async ({page})=>{
  await mount(page,'<form><kima-range-slider id="range" name="price" min="0" max="10" step="0.5"></kima-range-slider></form>',{range:{modelValue:[2,3]}});
  const ranges=page.locator('#range input');await ranges.first().focus();await ranges.first().press('End');expect(await data(page)).toEqual([['price[start]','3'],['price[end]','3']]);
  await ranges.last().press('Home');expect(await data(page)).toEqual([['price[start]','3'],['price[end]','3']]);
  await ranges.last().press('ArrowRight');expect(await data(page)).toEqual([['price[start]','3'],['price[end]','3.5']]);
  await page.locator('form').evaluate(form=>form.reset());await expect(page.locator('#range output')).toHaveText('2 – 3');expect(await data(page)).toEqual([['price[start]','2'],['price[end]','3']]);
});
test('calendar local date, cross-month keyboard, selected and native reset',async ({page})=>{
  await mount(page,'<form><kima-calendar id="cal" name="date" model-value="2026-03-31"></kima-calendar></form>');
  const day=page.locator('#cal [data-date="2026-03-31"]');await day.focus();await day.press('ArrowRight');await expect(page.locator('#cal [data-date="2026-04-01"]')).toBeFocused();await page.keyboard.press('Enter');expect(await data(page)).toEqual([['date','2026-04-01']]);
  await page.keyboard.press('PageDown');await expect(page.locator('#cal [data-date="2026-05-01"]')).toBeFocused();
  await page.locator('form').evaluate(form=>form.reset());expect(await data(page)).toEqual([['date','2026-03-31']]);
});
test('calendar boundaries, disabled date, weekday grid and one tab entry',async ({page})=>{
  await mount(page,'<form><kima-calendar id="cal" min="2026-03-01" max="2026-03-31" model-value="2026-03-01"></kima-calendar></form>',{cal:{disabledDates:['2026-03-02']}});
  await expect(page.locator('#cal [data-date="2026-03-02"]')).toBeDisabled();await expect(page.getByRole('button',{name:'上一月'})).toBeDisabled();await expect(page.locator('#cal button[data-date][tabindex="0"]')).toHaveCount(1);
  await page.locator('#cal [data-date="2026-03-01"]').press('ArrowRight');await expect(page.locator('#cal [data-date="2026-03-03"]')).toBeFocused();await expect(page.locator('#cal [role=row]')).toHaveCount(7);
});
test('calendar required empty value is invalid and every day has full accessible date',async ({page})=>{
  await mount(page,'<form><kima-calendar name="date" required></kima-calendar></form>');expect(await valid(page)).toBe(false);expect(await page.locator('[data-date]').first().getAttribute('aria-label')).toMatch(/\d{4}/);
});
test('date range incomplete contract, double month, ordered selection and reset',async ({page})=>{
  await mount(page,'<form><kima-date-range-picker id="dates" start-name="from" end-name="to" required></kima-date-range-picker></form>',{dates:{modelValue:['2026-03-10',null]}});
  expect(await data(page)).toEqual([['from','2026-03-10']]);expect(await valid(page)).toBe(false);await expect(page.locator('#dates [role=grid]')).toHaveCount(2);
  await page.locator('#dates [data-date="2026-03-12"]').first().click();expect(await data(page)).toEqual([['from','2026-03-10'],['to','2026-03-12']]);expect(await valid(page)).toBe(true);
  await page.locator('form').evaluate(form=>form.reset());expect(await data(page)).toEqual([['from','2026-03-10']]);
});
test('date range manual entry enforces bounds and blocked days within interval',async ({page})=>{
  await mount(page,'<form><kima-date-range-picker id="dates" name="period" min="2026-03-01" max="2026-03-31" required></kima-date-range-picker></form>',{dates:{modelValue:['2026-03-01','2026-03-04'],disabledDates:['2026-03-03']}});
  expect(await valid(page)).toBe(false);await page.locator('#dates > div > input[type=date]').last().fill('2026-03-02');expect(await valid(page)).toBe(true);
  await page.locator('#dates > div > input[type=date]').first().fill('2026-02-28');expect(await valid(page)).toBe(false);
});
test('time range overnight, equal=24h, required and same-day validation',async ({page})=>{
  await mount(page,'<form><kima-time-range-picker id="times" name="shift" required></kima-time-range-picker></form>',{times:{modelValue:['22:00','02:00']}});
  expect(await data(page)).toEqual([['shift[start]','22:00'],['shift[end]','02:00']]);await expect(page.locator('#times output')).toContainText('4h 0m');expect(await valid(page)).toBe(true);
  await page.locator('#times input').last().fill('22:00');await expect(page.locator('#times output')).toContainText('24h 0m');
  await page.evaluate(()=>document.getElementById('times').allowOvernight=false);await page.locator('#times input').last().fill('02:00');expect(await valid(page)).toBe(false);
  await page.locator('#times input').last().fill('');expect(await valid(page)).toBe(false);expect(await data(page)).toEqual([['shift[start]','22:00']]);
});
test('time endpoint min/max and minute step use native validation',async ({page})=>{
  await mount(page,'<form><kima-time-range-picker id="times" name="shift" min="08:00" max="18:00" step="15"></kima-time-range-picker></form>',{times:{modelValue:['09:00','17:00']}});
  await page.locator('#times input').first().fill('09:07');expect(await valid(page)).toBe(false);await page.locator('#times input').first().fill('09:15');expect(await valid(page)).toBe(true);
});
test('datetime local format, min/max, reset and rejects timezone value',async ({page})=>{
  await mount(page,'<form><kima-datetime-picker id="dt" name="local" model-value="2026-06-01T09:30" min="2026-06-01T08:00" max="2026-06-01T18:00" required></kima-datetime-picker></form>');
  expect(await data(page)).toEqual([['local','2026-06-01T09:30']]);const input=page.locator('#dt input');await input.fill('2026-06-01T20:00');expect(await valid(page)).toBe(false);await page.locator('form').evaluate(form=>form.reset());await expect(input).toHaveValue('2026-06-01T09:30');
  await page.evaluate(()=>document.getElementById('dt').modelValue='2026-06-01T09:30Z');await expect(input).toHaveValue('');expect(await valid(page)).toBe(false);
});
test('mention cursor replacement, enabled keyboard candidates and select event',async ({page})=>{
  await mount(page,'<form><kima-mention id="mention" name="message" label="消息" model-value="hi @ka there"></kima-mention></form>',{mention:{items:[{value:'kai',label:'Kai'},{value:'kate',label:'Kate',disabled:true}]}});
  await page.evaluate(()=>{window.selections=[];document.getElementById('mention').addEventListener('select',event=>window.selections.push(event.detail));});
  const input=page.locator('#mention textarea');await input.focus();await input.evaluate(el=>{el.setSelectionRange(6,6);el.dispatchEvent(new Event('select'));});await expect(page.getByRole('option',{name:'Kai',exact:true})).toBeVisible();await input.press('ArrowDown');await input.press('Enter');await expect(input).toHaveValue('hi @Kai  there');expect(await input.evaluate(el=>el.selectionStart)).toBe(8);expect(await page.evaluate(()=>window.selections[0][0].value)).toBe('kai');
});
test('mention IME, Escape, Tab, no results and external candidates',async ({page})=>{
  await mount(page,'<form><kima-mention id="mention" label="消息"></kima-mention><button>After</button></form>',{mention:{items:['中文']}});const input=page.locator('textarea');await input.focus();await input.dispatchEvent('compositionstart');await input.fill('@中');await input.press('Enter');await expect(page.getByRole('listbox')).toHaveCount(0);await input.dispatchEvent('compositionend');await expect(page.getByRole('option',{name:'中文'})).toBeVisible();await input.press('Escape');await expect(page.getByRole('listbox')).toBeHidden();await input.fill('@none');await expect(page.getByRole('status')).toHaveText('无匹配候选');await page.evaluate(()=>document.getElementById('mention').items=['none']);await expect(page.getByRole('option',{name:'none'})).toBeVisible();await input.press('Tab');await expect(input).toHaveValue('@none');
});
test('form async handler validates, prevents duplicate, exposes FormData and error',async ({page})=>{
  await page.evaluate(async()=>{window.calls=0;await window.fixture.mount('<kima-form id="coordinator"><kima-field hint="工作姓名"><input aria-label="姓名" name="person" required></kima-field><button type="submit">Send</button><button type="reset">Reset</button></kima-form>',{coordinator:{handleSubmit:context=>{window.calls++;window.submittedData=[...context.data];return new Promise((resolve,reject)=>{window.rejectSubmit=reject;window.resolveSubmit=resolve;});}}});});
  const input=page.getByRole('textbox',{name:'姓名'});await page.getByRole('button',{name:'Send'}).click();expect(await page.evaluate(()=>window.calls)).toBe(0);await input.fill('A');await input.press('Tab');await expect(input).toHaveAccessibleDescription('工作姓名');await page.getByRole('button',{name:'Send'}).click();await expect(page.locator('.kima-form')).toHaveAttribute('aria-busy','true');await page.getByRole('button',{name:'Send'}).click();expect(await page.evaluate(()=>window.calls)).toBe(1);expect(await page.evaluate(()=>window.submittedData)).toEqual([['person','A']]);await page.evaluate(()=>window.rejectSubmit(new Error('Submission rejected')));await expect(page.getByRole('alert')).toHaveText('Submission rejected');await page.getByRole('button',{name:'Reset'}).click();await expect(page.locator('.kima-form')).toHaveAttribute('data-dirty','false');await expect(page.getByRole('alert')).toBeHidden();
});
test('form native action attrs and unmount/reset invalidate old async completion',async ({page})=>{
  await page.evaluate(async()=>{await window.fixture.mount('<kima-form id="coordinator" action="/save" method="post"><input name="a" value="a"><button type="submit">Send</button><button type="reset">Reset</button></kima-form>',{coordinator:{handleSubmit:()=>new Promise((resolve,reject)=>window.lateReject=reject)}});});await expect(page.locator('.kima-form')).toHaveAttribute('action','/save');await expect(page.locator('.kima-form')).toHaveAttribute('method','post');await page.getByRole('button',{name:'Send'}).click();await page.getByRole('button',{name:'Reset'}).click();await page.evaluate(()=>window.lateReject(new Error('old')));await expect(page.getByRole('alert')).toBeHidden();
});
test('editable async error keeps draft, successful retry commits once, restores focus',async ({page})=>{
  await page.evaluate(async()=>{window.saves=0;await window.fixture.mount('<form><kima-editable id="edit" model-value="start" label="说明" name="note"></kima-editable></form>',{edit:{saveHandler:value=>{window.saves++;if(window.saves===1)return Promise.reject(new Error('Save failed'));return Promise.resolve();}}});});
  const display=page.locator('.kima-editable__display'),input=page.locator('.kima-editable__input');await display.click();await input.fill('draft');await input.press('Enter');await expect(page.getByRole('alert')).toHaveText('Save failed');await expect(input).toHaveValue('draft');await input.press('Enter');await expect(display).toHaveText('draft');await expect(display).toBeFocused();expect(await data(page)).toEqual([['note','draft']]);expect(await page.evaluate(()=>window.saves)).toBe(2);
});
test('editable Escape cancels and multiline Enter keeps editing',async ({page})=>{
  await mount(page,'<form><kima-editable id="edit" model-value="start" multiline></kima-editable></form>');await page.locator('.kima-editable__display').click();const input=page.locator('textarea');await input.fill('draft');await input.press('Enter');await expect(input).toBeVisible();await input.press('Escape');await expect(page.locator('.kima-editable__display')).toHaveText('start');await expect(page.locator('.kima-editable__display')).toBeFocused();
});
test('transfer native multiple selection, move, disabled, search and form reset',async ({page})=>{
  await mount(page,'<form><kima-transfer id="transfer" name="group" required></kima-transfer></form>',{transfer:{options,modelValue:['a']}});
  const lists=page.locator('#transfer select');await lists.first().selectOption(['b','d']);await page.getByRole('button',{name:'移入选中项 →'}).click();expect(await data(page)).toEqual([['group','a'],['group','b'],['group','d']]);await expect(lists.first().locator('option[value="c"]')).toBeDisabled();await page.getByRole('searchbox',{name:'搜索已选项'}).fill('Beta');expect(await data(page)).toHaveLength(3);await lists.last().selectOption(['b']);await page.getByRole('button',{name:'← 移出选中项'}).click();expect(await data(page)).toEqual([['group','a'],['group','d']]);await page.locator('form').evaluate(form=>form.reset());expect(await data(page)).toEqual([['group','a']]);await expect(page.getByRole('searchbox',{name:'搜索已选项'})).toHaveValue('');
});
test('transfer select all respects filtered enabled items and required target collection',async ({page})=>{
  await mount(page,'<form><kima-transfer id="transfer" name="group" required></kima-transfer></form>',{transfer:{options}});expect(await valid(page)).toBe(false);await page.getByRole('searchbox',{name:'搜索可用项'}).fill('Beta');await page.getByRole('button',{name:'全选可用项',exact:true}).click();await page.getByRole('button',{name:'移入选中项 →'}).click();expect(await data(page)).toEqual([['group','b']]);expect(await valid(page)).toBe(true);
});
test('rapid external updates settle and disabled fields do not submit',async ({page})=>{
  await mount(page,'<form><kima-range-slider id="rapid" name="range"></kima-range-slider><kima-datetime-picker id="dt" name="local"></kima-datetime-picker></form>');await page.evaluate(()=>{for(let i=0;i<50;i++)document.getElementById('rapid').modelValue=[i,100-i];document.getElementById('dt').modelValue='2026-12-31T23:59';});await expect(page.locator('#rapid output')).toHaveText('49 – 51');await expect(page.locator('#dt input')).toHaveValue('2026-12-31T23:59');await page.evaluate(()=>{document.getElementById('rapid').disabled=true;document.getElementById('dt').disabled=true;});expect(await data(page)).toEqual([]);
});
test('range clear removes all endpoint markers and upper bound stops navigation',async ({page})=>{
  await mount(page,'<form><kima-date-range-picker id="dates" max="2026-03-31" required></kima-date-range-picker></form>',{dates:{modelValue:['2026-02-10','2026-02-12']}});
  await expect(page.getByRole('button',{name:'下一月',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'下一月',exact:true}).click();
  await expect(page.getByRole('button',{name:'下一月',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'清空范围'}).click();
  await expect(page.locator('#dates .is-selected')).toHaveCount(0);expect(await valid(page)).toBe(false);
});
test('form capture observes child stopped input events and preserves field errors',async ({page})=>{
  await mount(page,'<kima-form id="coordinator"><kima-field error="宿主字段错误"><kima-text-field label="姓名" name="person"></kima-text-field></kima-field></kima-form>');
  const input=page.getByRole('textbox',{name:'姓名'});await input.fill('A');await expect(page.locator('.kima-form')).toHaveAttribute('data-dirty','true');await expect(input).toHaveAttribute('aria-invalid','true');await expect(input).toHaveAccessibleDescription('宿主字段错误');
});
test('transfer native keyboard select and move is independent of search UI',async ({page})=>{
  await mount(page,'<form><kima-transfer id="transfer" name="group"></kima-transfer></form>',{transfer:{options}});
  const available=page.locator('#transfer select').first();await available.focus();await available.press('Home');await available.press('ArrowDown');await expect(available).toHaveValues(['b']);
  await page.getByRole('button',{name:'移入选中项 →'}).focus();await page.keyboard.press('Enter');expect(await data(page)).toEqual([['group','b']]);
});
test('auto documentation parses all nine prop and emit contracts',async ({page})=>{
  const entries=await page.evaluate(async()=> (await import('/@id/__x00__kima-docs')).default);
  for(const name of names){const entry=entries.find(item=>item.slug===name);expect(entry?.attributes.length,name).toBeGreaterThan(0);expect(entry?.events.length,name).toBeGreaterThan(0);}
});
test('reduced motion popup exits immediately and restores on rapid reopen',async ({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await mount(page,'<kima-mention id="mention"></kima-mention>',{mention:{items:['Alpha']}});const input=page.locator('textarea');await input.fill('@');await expect(page.getByRole('option')).toBeVisible();await input.press('Escape');await expect(page.getByRole('listbox')).toHaveCount(0);await input.fill('@A');await expect(page.getByRole('option')).toBeVisible();expect(await page.locator('.kima-mention__popup').evaluate(el=>getComputedStyle(el).transitionDuration)).toMatch(/^0s/);
});
