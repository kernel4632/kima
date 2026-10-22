import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
test('six shell entries and four menu/navigation enhancements SSR without browser globals', async () => {
  const server = await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
  try {
    for (const slug of ['sidebar','app-shell','config-provider','masonry','marquee','gradient-text','menu','context-menu','menubar','navigation-menu']) {
      const Component = (await server.ssrLoadModule(`/src/components/${slug}.ce.vue`)).default;
      const html = await renderToString(createSSRApp({render:() => h(Component,{items:[{value:'guide',label:'指南',href:'#guide',children:[{value:'start',label:'开始',href:'#start'}]}]}, {default:() => '内容',main:() => '正文',header:() => '头部',footer:() => '页脚'})}));
      assert.ok(html.includes(`kima-${slug}`),slug);
      if (slug === 'app-shell') { assert.match(html, /<main/); assert.match(html,/正文/); assert.match(html,/跳到正文/); }
      if (slug === 'masonry') assert.match(html,/column-major/);
      if (slug === 'marquee') assert.doesNotMatch(html,/track--moving/);
    }
  } finally { await server.close(); }
});
test('provider SSR tokens locale direction and nested Vue defaults are scoped',async () => {
  const server=await createServer({server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'});
  try {
    const Provider=(await server.ssrLoadModule('/src/components/config-provider.ce.vue')).default;
    const Sidebar=(await server.ssrLoadModule('/src/components/sidebar.ce.vue')).default;
    const html=await renderToString(createSSRApp({render:() => h(Provider,{theme:'light',seed:'#61afef',variant:'tonal-spot',locale:'en-US',direction:'rtl',reducedMotion:'reduce'}, {default:() => h(Sidebar)})}));
    assert.match(html,/--kima-color-primary:/); assert.match(html,/dir="rtl"/); assert.match(html,/aria-label="Sidebar"/); assert.match(html,/data-kima-reduced-motion="reduce"/);
  } finally { await server.close(); }
});
