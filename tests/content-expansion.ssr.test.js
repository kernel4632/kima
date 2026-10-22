import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createSSRApp,h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { sanitizeContent,safeContentUrl } from '../src/utils/content.js';
test('HTML allowlist removes executable payloads and validates URLs',()=>{
 const clean=sanitizeContent('<h2>Hello</h2><script>alert(1)</script><img src=x onerror=alert(1)><a href="jav&#x61;script:alert(1)">bad</a><p style="color:red" onclick="x()">Safe<strong>yes</strong></p><svg onload="x()"></svg>');
 assert.match(clean,/<h2>Hello<\/h2>/);assert.match(clean,/<strong>yes<\/strong>/);assert.doesNotMatch(clean,/script|onerror|onclick|style=|<svg|<img|javascript/i);
 for(const url of ['javascript:alert(1)','data:text/html,x','//evil.test','https:\\evil.test','java\nscript:x'])assert.equal(safeContentUrl(url),false,url);
 for(const url of ['https://example.com','mailto:a@example.com','/docs','#section'])assert.equal(safeContentUrl(url),true,url);
});
test('five content components render useful safe SSR output',async()=>{
 const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
 try{for(const [slug,props] of Object.entries({chart:{series:[{name:'North',data:[1,null,-2]}]},heatmap:{values:[[0,null,-2]]},'rich-text-editor':{modelValue:'<p>SSR document</p><script>unsafe()</script>'},'code-editor':{modelValue:'<script>plain text</script>'},equation:{formula:'\\frac{1}{2}'}})){
 const component=(await server.ssrLoadModule(`/src/components/${slug}.ce.vue`)).default;
 const html=await renderToString(createSSRApp({render:()=>h(component,props)}));assert.match(html,new RegExp(`kima-${slug}`));
 if(slug==='equation'){assert.match(html,/<math/);assert.match(html,/<mfrac>/);}
 if(slug==='rich-text-editor'){assert.match(html,/SSR document/);assert.doesNotMatch(html,/<script>/);}
 if(slug==='code-editor'){assert.ok(html.includes('&'+'lt;script'+'&'+'gt;plain text'));assert.doesNotMatch(html,/<script>/);}
 }
 const Equation=(await server.ssrLoadModule('/src/components/equation.ce.vue')).default;
 for(const formula of ['\\href{javascript:alert(1)}{x}','\\htmlStyle{color:red}{x}','\\frac{']){const html=await renderToString(createSSRApp({render:()=>h(Equation,{formula})}));assert.match(html,/role="alert"/);assert.doesNotMatch(html,/<a |<script/);}
 }finally{await server.close();}
});
