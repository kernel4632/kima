import { test,expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const visit=(page,component)=>page.goto(`/tests/content-fixture.html?component=${component}`);
const mod=process.platform==='darwin'?'Meta':'Control';

test('chart modes, missing/negative values, keyboard, legend, data table and responsive screenshot',async({page},info)=>{
 await visit(page,'chart');
 const chart=page.locator('.kima-chart');await expect(chart.locator('[data-point]')).toHaveCount(11);
 const point=chart.locator('[data-point="0-0"]');await point.focus();await point.press('ArrowRight');await expect(chart.locator('[data-point="0-1"]')).toBeFocused();await expect(chart.getByRole('status')).toContainText('24');
 await chart.getByRole('button',{name:'查看数据表'}).click();await expect(chart.getByRole('table')).toBeVisible();await expect(chart.getByRole('cell',{name:'缺失',exact:true})).toBeVisible();await expect(chart.getByRole('cell',{name:'-8',exact:true})).toBeVisible();
 for(const mode of ['bar','area','scatter','line']){await page.getByRole('combobox').selectOption(mode);await expect(chart.locator('[data-point]')).toHaveCount(11);}
 await chart.getByRole('button',{name:'访问量',exact:true}).click();await expect(chart.locator('[data-point]')).toHaveCount(6);await chart.getByRole('button',{name:'访问量',exact:true}).click();
 await page.getByRole('button',{name:'更新数据',exact:true}).click();await chart.locator('[data-point="0-0"]').focus();await expect(chart.getByRole('status')).toContainText('15');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await mkdir('shots/content-expansion',{recursive:true});await page.screenshot({path:`shots/content-expansion/chart-${info.project.name}.png`,fullPage:true});
});

test('heatmap grid keyboard, missing cells, legend and theme-derived intensities',async({page},info)=>{
 await visit(page,'heatmap');const grid=page.getByRole('grid');await expect(grid.getByRole('gridcell')).toHaveCount(24);
 const first=grid.getByRole('gridcell').first();await first.focus();await first.press('ArrowDown');await expect(grid.getByRole('gridcell').nth(6)).toBeFocused();await grid.getByRole('gridcell').nth(6).press('End');await expect(grid.getByRole('gridcell').nth(11)).toBeFocused();
 await page.getByRole('button',{name:'查看数据表'}).click();await expect(page.getByRole('table')).toBeVisible();await expect(page.getByRole('cell',{name:'缺失',exact:true})).toBeVisible();
 const high=grid.getByRole('gridcell').last();const before=await high.evaluate(el=>getComputedStyle(el).backgroundColor);await page.evaluate(()=>document.documentElement.style.setProperty('--kima-color-primary-container','rebeccapurple'));await expect.poll(()=>high.evaluate(el=>getComputedStyle(el).backgroundColor)).not.toBe(before);await page.getByRole('button',{name:'更新热力数据'}).click();await expect(first).toHaveText('1');
 await page.screenshot({path:`shots/content-expansion/heatmap-${info.project.name}.png`,fullPage:true});
});

test('rich editor true selection, formatting, undo, safe link and form/reset',async({page},info)=>{
 await visit(page,'rich-text-editor');const editor=page.getByRole('textbox',{name:'文章正文',exact:true});await expect(editor).toBeVisible();
 await editor.click();await editor.press(`${mod}+End`);await editor.press('Enter');await page.keyboard.type('Selection text');await editor.press(`${mod}+Shift+ArrowLeft`);
 await page.getByRole('button',{name:'粗体',exact:true}).click();await expect(editor.locator('strong')).toContainText(['格式','text']);await expect(page.locator('.kima-rich-text-editor__selection')).toContainText('text');
 await page.getByRole('button',{name:'链接',exact:true}).click();await page.getByRole('textbox',{name:'链接地址',exact:true}).fill('javascript:alert(1)');await page.getByRole('button',{name:'应用链接'}).click();await expect(page.getByRole('alert')).toContainText('仅允许');
 await page.getByRole('textbox',{name:'链接地址',exact:true}).fill('https://example.com/docs');await page.getByRole('button',{name:'应用链接'}).click();await expect(editor.locator('a')).toHaveAttribute('href','https://example.com/docs');
 await page.getByRole('button',{name:'读取表单'}).click();await expect(page.locator('.kima-content-example__status')).toContainText('https://example.com/docs');
 await page.getByRole('button',{name:'撤销',exact:true}).click();await expect(editor.locator('a')).toHaveCount(0);await page.getByRole('button',{name:'重做',exact:true}).click();await expect(editor.locator('a')).toHaveCount(1);
 await page.screenshot({path:`shots/content-expansion/rich-text-editor-${info.project.name}.png`,fullPage:true});
 await page.getByRole('checkbox',{name:'只读',exact:true}).check();await expect(editor).toHaveAttribute('contenteditable','false');await expect(page.getByRole('button',{name:'粗体',exact:true})).toBeDisabled();await page.getByRole('checkbox',{name:'只读',exact:true}).uncheck();
 await page.getByRole('button',{name:'重置',exact:true}).click();await expect(editor).not.toContainText('Selection');await expect(editor).toContainText('写下想法');
});

test('rich paste allowlist and IME preserve composition and actual selection',async({page})=>{
 await visit(page,'rich-text-editor');const editor=page.getByRole('textbox',{name:'文章正文',exact:true});await editor.click();await editor.press(`${mod}+End`);
 await editor.evaluate(el=>{const transfer=new DataTransfer();transfer.setData('text/html','<p onclick="alert(1)">Pasted <b>safe</b><img src=x onerror="alert(1)"><a href="javascript:alert(1)">bad</a><script>alert(1)</script></p>');el.dispatchEvent(new ClipboardEvent('paste',{clipboardData:transfer,bubbles:true,cancelable:true}));});
 await expect(editor).toContainText('Pasted');expect(await editor.innerHTML()).not.toMatch(/onclick|onerror|javascript:|<script|<img/);
 await editor.dispatchEvent('compositionstart',{data:''});await page.keyboard.insertText('中文输入');await editor.dispatchEvent('compositionend',{data:'中文输入'});await expect(editor).toContainText('中文输入');
 await page.getByRole('button',{name:'读取表单'}).click();await expect(page.locator('.kima-content-example__status')).toContainText('中文输入');
});

test('CodeMirror edits JS/JSON/HTML/CSS, find, history, selection and native form reset',async({page},info)=>{
 await visit(page,'code-editor');const editor=page.getByRole('textbox',{name:'源代码',exact:true});await expect(editor).toBeVisible();await editor.click();await editor.press(`${mod}+End`);await editor.press('Enter');await page.keyboard.type('const answer = 42;');await expect(page.locator('.cm-line').last()).toContainText('answer');
 await editor.press(`${mod}+z`);await expect(editor).not.toContainText('answer');await editor.press(`${mod}+Shift+z`);await expect(editor).toContainText('answer');
 await page.getByRole('button',{name:'查找',exact:true}).click();await expect(page.locator('.cm-search')).toBeVisible();await page.locator('.cm-search input[name="search"]').fill('answer');await page.locator('.cm-search input[name="search"]').press('Enter');await expect(page.locator('.cm-searchMatch')).not.toHaveCount(0);await page.locator('.cm-search input[name="search"]').press('Escape');
 for(const language of ['json','html','css','javascript']){await page.getByRole('combobox').selectOption(language);await expect(editor).toContainText('answer');}
 await page.getByRole('button',{name:'读取表单'}).click();await expect(page.locator('.kima-content-example__status')).toContainText('answer');await expect(page.locator('.kima-code-editor__selection')).toContainText('行');
 await page.screenshot({path:`shots/content-expansion/code-editor-${info.project.name}.png`,fullPage:true});
 await page.getByRole('checkbox',{name:'只读',exact:true}).check();await expect(editor).toHaveAttribute('contenteditable','false');await page.getByRole('checkbox',{name:'只读',exact:true}).uncheck();await page.getByRole('button',{name:'重置',exact:true}).click();await expect(editor).not.toContainText('answer');await expect(editor).toContainText('greeting');
 await page.getByRole('checkbox',{name:'禁用',exact:true}).check();const formData=await page.locator('form').evaluate(form=>Object.fromEntries(new FormData(form)));expect(formData.source).toBeUndefined();
});

test('equation reactive MathML, strict failures and no unsafe URLs or font requests',async({page},info)=>{
 const fonts=[];page.on('request',r=>{if(/\.(woff2?|ttf)(\?|$)/.test(r.url()))fonts.push(r.url());});await visit(page,'equation');await expect(page.locator('math')).toHaveCount(2);
 const input=page.getByRole('textbox',{name:'公式源码'});await input.fill('\\frac{a}{b}');await expect(page.locator('math mfrac')).toHaveCount(2);await input.fill('\\frac{');await expect(page.getByRole('alert').first()).toContainText('语法错误');await input.fill('\\url{https://evil.test}');await expect(page.getByRole('alert').first()).toContainText('不允许');await expect(page.locator('.kima-equation a,.kima-equation img')).toHaveCount(0);expect(fonts).toEqual([]);
 await input.fill('x^2 + y^2 = z^2');await expect(page.locator('math')).toHaveCount(2);await page.screenshot({path:`shots/content-expansion/equation-${info.project.name}.png`,fullPage:true});
});

test('normal/reduced motion intermediate frames settle exactly while selection is immediate',async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await visit(page,'chart');const point=page.locator('[data-point="0-0"]');await point.focus();const tooltip=page.locator('.kima-chart__tooltip');await expect(tooltip).toBeVisible();
 const frames=await tooltip.evaluate(async el=>{await new Promise(requestAnimationFrame);const animations=el.getAnimations();return animations.map(a=>({duration:a.effect.getTiming().duration,current:a.currentTime}));});expect(frames.some(a=>a.duration>0)).toBe(true);await expect(tooltip).toHaveCSS('opacity','1');
 await page.emulateMedia({reducedMotion:'reduce'});await visit(page,'chart');await page.locator('[data-point="0-0"]').focus();await expect(page.locator('.kima-chart__tooltip')).toHaveCSS('opacity','1');
 await visit(page,'rich-text-editor');const editor=page.getByRole('textbox',{name:'文章正文'});await editor.click();await editor.press(`${mod}+End`);await page.keyboard.type('immediate');await expect(editor).toContainText('immediate');await expect(page.locator('.kima-rich-text-editor__selection')).not.toContainText('选区 0–0');
});

test('standalone bundled light DOM elements edit without external modules and reset forms',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/tests/content-fixture.html?standalone');await expect(page.locator('kima-equation math')).toBeVisible();
 const rich=page.locator('kima-rich-text-editor [contenteditable=true]'),code=page.locator('kima-code-editor .cm-content');await expect(rich).toContainText('Native document');await code.click();await code.press(`${mod}+End`);await page.keyboard.type(' // changed');await expect(code).toContainText('changed');
 await rich.click();await rich.press(`${mod}+End`);await page.keyboard.type(' edited');await expect(rich).toContainText('edited');const data=await page.locator('#native').evaluate(form=>Object.fromEntries(new FormData(form)));expect(data.source).toContain('changed');expect(data.document).toContain('edited');await page.getByRole('button',{name:'原生重置'}).click();await expect(code).not.toContainText('changed');await expect(rich).not.toContainText('edited');expect(errors).toEqual([]);
});

 test("external model sync retains real selection, required validity and canceled reset",async({page})=>{
 await page.goto("/tests/content-fixture.html?model");const rich=page.getByRole("textbox",{name:"文档",exact:true}),code=page.getByRole("textbox",{name:"代码",exact:true});await rich.click();await rich.press("Control+Home");await rich.press("ArrowRight");
 const before=await rich.evaluate((element)=>{const selection=element.ownerDocument.getSelection();return {anchorNode:selection.anchorNode?.nodeName,anchorOffset:selection.anchorOffset,focusNode:selection.focusNode?.nodeName,focusOffset:selection.focusOffset,text:selection.toString()};});
 expect(before).toMatchObject({anchorNode:"#text",anchorOffset:1,focusNode:"#text",focusOffset:1,text:""});
 await page.getByRole("button",{name:"外部更新"}).click();await expect(rich).toContainText("External beta");await expect(code).toContainText("external");await expect(page.locator(".kima-rich-text-editor__selection")).toHaveText("选区 2–2");
 const after=await rich.evaluate((element)=>{const selection=element.ownerDocument.getSelection();return {anchorNode:selection.anchorNode?.nodeName,anchorOffset:selection.anchorOffset,focusNode:selection.focusNode?.nodeName,focusOffset:selection.focusOffset,text:selection.toString()};});
 expect(after).toMatchObject({anchorNode:"#text",anchorOffset:1,focusNode:"#text",focusOffset:1,text:""});
 await page.getByRole("checkbox",{name:"取消重置"}).check();await page.getByRole("button",{name:"重置",exact:true}).click();await expect(rich).toContainText("External");await expect(code).toContainText("external");await page.getByRole("checkbox",{name:"取消重置"}).uncheck();await page.getByRole("button",{name:"重置",exact:true}).click();await expect(rich).toContainText("Alpha beta");await expect(code).toContainText("alpha");
 await page.getByRole("button",{name:"清空模型"}).click();await expect(rich).toHaveText("");await expect(page.locator('.kima-code-editor__proxy')).toHaveValue("");expect(await page.locator("form").evaluate(form=>form.checkValidity())).toBe(false);await expect(page.locator(".cm-placeholder")).toHaveText("输入代码");await expect(rich.locator("p")).toHaveAttribute("data-placeholder","写点内容");
 await rich.click();await page.keyboard.insertText("新文档");await code.click();await page.keyboard.insertText("const valid = true;");await page.getByRole("button",{name:"提交",exact:true}).click();await expect(page.locator("#result")).toContainText("新文档");await expect(page.locator("#result")).toContainText("valid");
 });
 test("light/dark palettes update all content roles and equation visual motion settles",async({page},info)=>{
 await visit(page,"chart");const before=await page.locator(".kima-chart__series").first().evaluate(el=>getComputedStyle(el).color);await page.evaluate(()=>window.contentFixture.palette("#61afef",false));await expect.poll(()=>page.locator(".kima-chart__series").first().evaluate(el=>getComputedStyle(el).color)).not.toBe(before);await page.screenshot({path:"shots/content-expansion/chart-light-"+info.project.name+".png",fullPage:true});
 await visit(page,"equation");await page.emulateMedia({reducedMotion:"no-preference"});await page.getByRole("textbox",{name:"公式源码"}).fill("x^3");await expect(page.locator("math").first()).toContainText("x3");const result=await page.locator(".kima-equation").first().evaluate(async el=>{const animation=el.getAnimations()[0];if(!animation)return null;animation.pause();const duration=animation.effect.getTiming().duration;animation.currentTime=duration/2;const opacity=Number(getComputedStyle(el).opacity);animation.finish();await animation.finished;return {opacity,final:getComputedStyle(el).opacity};});expect(result?.opacity).toBeGreaterThan(.55);expect(result?.opacity).toBeLessThan(1);expect(result?.final).toBe("1");
 });
