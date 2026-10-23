<!-- KIMA 文档站入口：站点控件直接使用组件库，目录从源码发现。
     pnpm dev 查看；#/components/button 可直达组件并刷新保留位置。 -->
<script setup>
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { KimaButton, KimaIconButton, KimaTextField, KimaSelect, KimaTabs, KimaBadge, KimaCard, KimaDrawer, KimaCodeBlock, KimaTable, KimaIcon, KimaCommand } from './index.js';
import { Menu01Icon, Sun01Icon, Moon02Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import { applyPalette } from './utils/theme.js';
const Examples = defineAsyncComponent(() => import('./site/examples.vue'));
import { catalog } from './site/catalog.js';
import { tierMeta } from './component-tiers.js';
import manifest from '../package.json';
const route = ref(location.hash.slice(2) || 'overview');
function readRoute() { route.value = location.hash.slice(2) || 'overview'; }
window.addEventListener('hashchange', readRoute);
const commandOpen = ref(false);
/* 只有从搜索结果进来才需要跳到某一节；普通点导航应该停在页面顶部，
 * 否则每次换页都会先滚到预览，标题反而被顶出屏幕。 */
const pendingSection = ref('');
function openCommand() { commandOpen.value = true; }
function handleGlobalKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openCommand();
  }
}
onMounted(() => window.addEventListener('keydown', handleGlobalKeydown));
onBeforeUnmount(() => {
  window.removeEventListener('hashchange', readRoute);
  window.removeEventListener('keydown', handleGlobalKeydown);
});
const search = ref('');
const mobileMenu = ref(false);
const theme = ref('dark');
const seed = ref('#61afef');
const seeds = [{ value: '#61afef', label: '青蓝' }, { value: '#6750a4', label: '紫色' }, { value: '#2e7d32', label: '绿色' }, { value: '#ffffff', label: '灰度' }];
watch([theme, seed], () => {
  document.documentElement.dataset.kimaTheme = theme.value;
  applyPalette(seed.value, { isDark: theme.value === 'dark', variant: seed.value === '#ffffff' ? 'monochrome' : 'tonal-spot' });
}, { immediate: true });
const component = computed(() => catalog.find((item) => route.value === `components/${item.slug}`));
const filtered = computed(() => catalog.filter((item) => `${item.slug} ${item.label}`.toLowerCase().includes(search.value.toLowerCase().trim())));
const commandItems = computed(() => catalog.map((item) => ({
  value: `components/${item.slug}`,
  label: `${item.name} · ${item.label}`,
  group: item.group,
  description: item.description,
  keywords: [item.slug, item.label, ...item.attributes.map((attribute) => attribute.name), ...item.events],
  section: 'properties',
})));
function selectSearchResult(value, item) {
  pendingSection.value = item.section || 'preview';
  navigate(value);
}
const nav = computed(() => [
  { heading: '开始使用', items: [{ slug: 'overview', name: '概览' }, { slug: 'installation', name: '安装与接入' }, { slug: 'theme', name: '主题与设计' }] },
  ...[...new Set(catalog.map((item) => item.group))].map((heading) => ({ heading, items: filtered.value.filter((item) => item.group === heading).map((item) => ({ slug: `components/${item.slug}`, name: `${item.name} ${item.label}` })) })),
]);
const title = computed(() => component.value ? component.value.name : ({ overview: '让交互，自然发生。', installation: '安装与接入', theme: '一颗种子，整个界面。' }[route.value] || '页面不存在'));
const sections = computed(() => component.value ? [{ id: 'preview', label: '交互预览' }, { id: 'usage', label: '使用方式' }, { id: 'properties', label: '属性参考' }] : [{ id: 'introduction', label: '概览' }, { id: 'usage', label: '开始使用' }, { id: 'principles', label: '设计原则' }]);
function scrollToSection(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }
const showSource = ref(false);
const fullSource = ref('');
async function toggleSource() {
  showSource.value = !showSource.value;
  if (!showSource.value) return;
  const page = component.value;
  const source = await page.loadSource();
  if (page === component.value) fullSource.value = source;
}
const previewTab = ref('preview');
const previewTabs = [{ value: 'preview', label: '实时预览' }, { value: 'source', label: '示例源码' }];
function navigate(slug) { location.hash = `/${slug}`; mobileMenu.value = false; }
watch(route, async () => {
  previewTab.value = 'preview'; showSource.value = false; fullSource.value = ''; window.scrollTo({ top: 0 }); document.title = `${title.value} · KIMA`;
  await nextTick();
  if (pendingSection.value) {
    document.getElementById(pendingSection.value)?.scrollIntoView({ behavior: 'smooth' });
    pendingSection.value = '';
  }
}, { immediate: true });
const importCode = computed(() => component.value ? `import { Kima${component.value.name} } from '@kernel4632/kima';\nimport '@kernel4632/kima/style.css';` : '');
const themeUsage = `import { applyPalette } from '@kernel4632/kima/theme';\napplyPalette('#61afef', { isDark: true });`;
const install = 'pnpm add @kernel4632/kima vue';
const vueUsage = `<script setup>\nimport { KimaButton } from '@kernel4632/kima';\nimport '@kernel4632/kima/style.css';\n<` + `/script>\n\n<template>\n  <KimaButton>保存更改</KimaButton>\n</template>`;
const elementUsage = `import '@kernel4632/kima/elements';\n\n// 注册入口自带样式与 Vue 运行时\n// <kima-button>保存更改</kima-button>`;
const propColumns = [{ key: 'name', label: '属性' }, { key: 'type', label: '类型' }, { key: 'default', label: '默认值' }];
</script>

<template>
  <div class="kima-docs">
    <header class="kima-docs__top">
      <div class="kima-docs__brand">
        <KimaIconButton class="kima-docs__mobile-toggle" :icon="Menu01Icon" label="打开文档导航" variant="text" @click="mobileMenu = true" />
        <KimaButton variant="text" @click="navigate('overview')"><template #leading><KimaIcon :icon="SparklesIcon" /></template>KIMA</KimaButton>
        <KimaBadge :value="manifest.version" variant="primary" />
      </div>
      <KimaTextField v-model="search" class="kima-docs__search" label="搜索组件" type="search" placeholder="搜索组件 / Search components" clearable />
      <KimaCommand v-model:open="commandOpen" class="kima-docs__command" label="内容搜索" trigger-label="全文搜索" placeholder="搜索组件、属性、事件或关键词…" :items="commandItems" @select="selectSearchResult" />
      <div class="kima-docs__tools">
        <KimaSelect v-model="seed" :items="seeds" label="主题种子" />
        <KimaIconButton :icon="theme === 'dark' ? Sun01Icon : Moon02Icon" :label="theme === 'dark' ? '切换浅色' : '切换深色'" variant="text" @click="theme = theme === 'dark' ? 'light' : 'dark'" />
        <KimaButton variant="tonal" @click="navigate('installation')">开始使用</KimaButton>
      </div>
    </header>
    <div class="kima-docs__layout">
      <aside class="kima-docs__sidebar" aria-label="文档导航">
        <p class="kima-docs__sidebar-title">构建有生命力的界面</p>
        <nav v-for="group in nav" :key="group.heading" :aria-label="group.heading">
          <h2>{{ group.heading }}</h2>
          <KimaButton v-for="item in group.items" :key="item.slug" :variant="route === item.slug ? 'tonal' : 'text'" :aria-current="route === item.slug ? 'page' : undefined" @click="navigate(item.slug)">{{ item.name }}</KimaButton>
        </nav>
        <p v-if="!filtered.length" role="status">没有匹配的组件。</p>
      </aside>
      <main class="kima-docs__content">
        <header id="introduction" class="kima-docs__heading">
          <p class="kima-docs__eyebrow">{{ component ? `COMPONENTS / ${component.label}` : 'KINETIC · INTERACTION · MOTION · ALIVE' }}<span v-if="component" class="kima-docs__tier" :data-tier="component.tier" :title="tierMeta[component.tier].hint">{{ tierMeta[component.tier].label }}</span></p>
          <h1>{{ title }}</h1>
          <p class="kima-docs__lead">{{ component ? component.description : route === 'overview' ? '大控件、轻层次、专注的动效。一个让体验先行的设计系统，用自己的组件搭建自己的展示界面。' : route === 'installation' ? 'Vue 组件与原生自定义元素，两种入口，同一套交互与设计语言。' : '从单一种子色生成深浅主题，颜色、形状和动效始终由 KIMA token 统一控制。' }}</p>
        </header>

        <template v-if="component">
          <section id="preview" class="kima-docs__section">
            <h2>交互预览</h2><p>这里运行的就是库里的组件，不是重新绘制的样图。</p>
            <KimaTabs v-model="previewTab" :items="previewTabs">
              <template #panel="{ item }">
                <div v-if="item.value === 'preview'" class="kima-docs__canvas"><Examples :key="component.slug" :component="component.slug" /></div>
                <KimaCodeBlock v-else :code="component.examples" language="vue" line-numbers />
              </template>
            </KimaTabs>
          </section>
          <section id="usage" class="kima-docs__section"><h2>使用方式</h2><p>先安装并导入全局样式，然后按需导入组件。</p><KimaCodeBlock :code="importCode" language="javascript" /></section>
          <section id="properties" class="kima-docs__section">
            <h2>属性参考</h2>
            <p>属性类型和默认值直接读取组件声明，与实际组件保持同步。</p>
            <KimaTable :columns="propColumns" :rows="component.attributes" row-key="name" />
            <h3>公开事件</h3>
            <p>{{ component.events.length ? component.events.join(' / ') : '该组件没有自定义事件；可交互元素保留原生事件。' }}</p>
            <p>Vue 中直接接收参数；自定义元素通过 event.detail 数组接收参数。按钮 click 仍是原生事件。</p>
            <KimaButton variant="text" :aria-expanded="showSource" @click="toggleSource">{{ showSource ? '收起源码' : '查看完整组件源码' }}</KimaButton>
            <KimaCodeBlock v-if="showSource" :code="fullSource || '正在加载源码…'" :filename="`${component.slug}.ce.vue`" language="vue" line-numbers />
          </section>
        </template>
        <template v-else-if="route === 'overview'">
          <section class="kima-docs__hero-canvas" aria-label="KIMA 交互示例">
            <KimaCard><template #header><KimaBadge value="用组件，展示组件" variant="primary" /></template><h2>好界面，从一次自然的交互开始。</h2><p>试着点击、悬停或切换主题。文档站里的按钮、搜索、菜单和标签页，全部由 KIMA 自己提供。</p><div class="kima-docs__actions"><KimaButton @click="navigate('components/button')">探索组件</KimaButton><KimaButton variant="text" @click="navigate('theme')">了解设计语言</KimaButton></div></KimaCard>
          </section>
          <section id="usage" class="kima-docs__section"><h2>从安装开始</h2><p>安装包、导入样式、放入第一个组件。无需安装整套视觉框架。</p><KimaCodeBlock :code="install" language="shell" /><KimaButton variant="tonal" @click="navigate('installation')">查看接入指南</KimaButton></section>
          <section id="principles" class="kima-docs__section"><h2>交互第一，外观其次</h2><div class="kima-docs__principles"><KimaCard><h3>留出呼吸感</h3><p>更大的控件、更松的间距，重要的操作一眼可见。</p></KimaCard><KimaCard><h3>用动效引导注意力</h3><p>状态变化清晰可感，抽屉与遮罩只聚焦当前内容。</p></KimaCard><KimaCard><h3>统一，而不僵硬</h3><p>同一套颜色、圆角和状态反馈，适配 Vue 与原生网页。</p></KimaCard></div></section>
        </template>
        <template v-else-if="route === 'installation'">
          <section id="usage" class="kima-docs__section"><h2>1. 安装依赖</h2><KimaCodeBlock :code="install" language="shell" /><p>公共 npm 包是否可下载，以仓库 README 的发布状态为准。正式发布前可安装本地产出的 tarball。</p><h2>2. 在 Vue 中使用</h2><KimaCodeBlock :code="vueUsage" filename="App.vue" language="vue" line-numbers /><h2>3. 在原生网页中使用</h2><KimaCodeBlock :code="elementUsage" language="javascript" /></section>
          <section id="principles" class="kima-docs__section"><h2>接入约定</h2><p>Vue 入口需显式导入样式；自定义元素入口自带样式和运行时。自定义事件参数位于 event.detail 数组中。样式不重置宿主页面。</p></section>
        </template>
        <template v-else-if="route === 'theme'">
          <section id="usage" class="kima-docs__section"><h2>在整个站点体验主题</h2><p>使用顶部的种子色选择器和深浅主题按钮，实际组件与文档界面同步变化。</p><KimaCodeBlock :code="themeUsage" language="javascript" /></section><section id="principles" class="kima-docs__section"><h2>设计约束</h2><p>页面表面使用透明层次，弹层使用实色。成功、警告、危险色不随品牌种子改变；所有组件使用 --kima-* 变量。字体采用 Maple Mono 系列与系统等宽回退。</p></section>
        </template>
        <footer class="kima-docs__footer">KIMA · 让组件、界面与体验说同一种语言。</footer>
      </main>
      <aside class="kima-docs__toc" aria-label="本页目录"><p>本页内容</p><KimaButton v-for="section in sections" :key="section.id" variant="text" @click="scrollToSection(section.id)">{{ section.label }}</KimaButton></aside>
    </div>
    <KimaDrawer v-model:open="mobileMenu" placement="left" title="文档导航"><nav v-for="group in nav" :key="group.heading" class="kima-docs__mobile-nav"><h2>{{ group.heading }}</h2><KimaButton v-for="item in group.items" :key="item.slug" variant="text" @click="navigate(item.slug)">{{ item.name }}</KimaButton></nav></KimaDrawer>
  </div>
</template>

<style scoped lang="scss">
.kima-docs { min-height: 100vh; background: var(--kima-color-surface); color: var(--kima-color-on-surface); }

/* 顶栏用弹性排布，不用定宽栅格：栅格列数是固定的，多一个控件就会掉到第二行，
 * 第二行又只剩品牌那一列宽，主题选择被压窄、按钮和品牌叠在一起。 */
.kima-docs__top { position: sticky; top: 0; z-index: 10; display: flex; flex-wrap: wrap; align-items: center; gap: var(--kima-space-3) var(--kima-space-5); padding: var(--kima-space-3) var(--kima-space-6); background: var(--kima-color-surface); }
.kima-docs__brand, .kima-docs__tools, .kima-docs__actions { display: flex; align-items: center; gap: var(--kima-space-2); }
.kima-docs__brand { flex: 0 0 auto; }
.kima-docs__search { flex: 1 1 240px; max-width: 420px; min-width: 180px; }
.kima-docs__command { flex: 0 0 auto; min-width: 0; }
.kima-docs__brand :deep(.kima-button__label) { font-size: var(--kima-font-size-title-large); font-weight: var(--kima-font-weight-bold); }
.kima-docs__tools { flex: 0 0 auto; justify-content: flex-end; margin-inline-start: auto; min-width: 0; }
.kima-docs__tools > :first-child { flex: 0 0 150px; width: 150px; }
.kima-docs__mobile-toggle { display: none; }
.kima-docs__layout { display: grid; grid-template-columns: 248px minmax(0, 1fr) 200px; gap: var(--kima-space-8); max-width: 1600px; margin: auto; padding: var(--kima-space-6); }
.kima-docs__sidebar, .kima-docs__toc { position: sticky; top: 96px; align-self: start; max-height: calc(100dvh - 112px); overflow-y: auto; }
.kima-docs__sidebar-title { margin: 0 0 var(--kima-space-6); color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-small); }
.kima-docs__sidebar nav { display: flex; flex-direction: column; gap: var(--kima-space-1); margin-bottom: var(--kima-space-6); }
.kima-docs__sidebar h2, .kima-docs__mobile-nav h2 { margin: var(--kima-space-3) 0; color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-medium); }
.kima-docs__sidebar :deep(.kima-button) { justify-content: flex-start; min-height: 44px; border-radius: var(--kima-radius-s); padding-inline: var(--kima-space-3); text-align: start; }
.kima-docs__sidebar :deep(.kima-button__label) { white-space: normal; font-size: var(--kima-font-size-label-medium); }
.kima-docs__content { min-width: 0; width: 100%; max-width: 840px; margin: 0 auto; padding: var(--kima-space-10) var(--kima-space-4); }
.kima-docs__heading { margin-bottom: var(--kima-space-10); }
.kima-docs__eyebrow { display: flex; align-items: center; flex-wrap: wrap; gap: var(--kima-space-2); font-size: var(--kima-font-size-label-small); color: var(--kima-color-primary); letter-spacing: .08em; margin: 0 0 var(--kima-space-6); }
/* 维护水位：核心/扩展/实验。颜色只用来区分优先级，不承担状态语义。 */
.kima-docs__tier { padding: 2px var(--kima-space-2); border-radius: var(--kima-radius-full); letter-spacing: 0; background: var(--kima-color-layer-3); color: var(--kima-color-on-surface-variant); &[data-tier="core"] { background: var(--kima-color-primary-container); color: var(--kima-color-on-primary-container); } &[data-tier="experimental"] { color: var(--kima-color-warning); } }
.kima-docs__heading h1 { margin: 0; font-size: clamp(32px, 4vw, 56px); line-height: 1.2; letter-spacing: -.03em; overflow-wrap: anywhere; }
.kima-docs__lead { color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-body-large); line-height: 1.8; margin-top: var(--kima-space-6); }
.kima-docs__section { margin-top: var(--kima-space-12); scroll-margin-top: 120px; }
.kima-docs__section h2 { font-size: var(--kima-font-size-headline-small); margin: 0 0 var(--kima-space-4); }
.kima-docs__section p { color: var(--kima-color-on-surface-variant); line-height: 1.8; }
.kima-docs__hero-canvas { padding: var(--kima-space-8); border-radius: var(--kima-radius-m); background: var(--kima-color-layer-1); }
.kima-docs__hero-canvas :deep(.kima-card) { padding: var(--kima-space-8); }
.kima-docs__hero-canvas h2 { font-size: var(--kima-font-size-headline-small); line-height: 1.5; }
.kima-docs__hero-canvas p { color: var(--kima-color-on-surface-variant); line-height: 1.8; margin-bottom: var(--kima-space-6); }
.kima-docs__canvas { display: flex; flex-direction: column; justify-content: center; padding: var(--kima-space-6); background: var(--kima-color-layer-1); border-radius: var(--kima-radius-m); min-height: 180px; }
.kima-docs__section > .kima-code-block { margin: var(--kima-space-5) 0; }
.kima-docs__principles { display: grid; gap: var(--kima-space-4); }
.kima-docs__principles h3 { margin: 0; }
.kima-docs__toc { display: flex; flex-direction: column; gap: var(--kima-space-1); padding-top: var(--kima-space-4); }
.kima-docs__toc p { font-size: var(--kima-font-size-label-small); color: var(--kima-color-on-surface-variant); }
.kima-docs__toc :deep(.kima-button) { justify-content: flex-start; padding-inline: var(--kima-space-2); font-size: var(--kima-font-size-label-small); }
.kima-docs__footer { margin-top: var(--kima-space-16); padding-block: var(--kima-space-6); color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-small); }
.kima-docs__mobile-nav { display: flex; flex-direction: column; }
@media (max-width: 1200px) { .kima-docs__layout { grid-template-columns: 220px minmax(0, 1fr); } .kima-docs__toc { display: none; } .kima-docs__tools > :last-child { display: none; } }

/* 900 就换成单列：768 宽再并一个 220 侧栏，正文只剩五百出头，长标题会挤成两三行。 */
@media (max-width: 900px) {
  .kima-docs__layout { grid-template-columns: minmax(0, 1fr); padding: var(--kima-space-4); }
  .kima-docs__sidebar { display: none; }
  .kima-docs__mobile-toggle { display: inline-flex; }
  .kima-docs__content { padding: var(--kima-space-6) 0; }

  /* 侧栏在 900 以下藏起来了，搜索框就只剩下装饰作用：
   * 它过滤的是被藏起来的目录，输入了也看不到结果。这里换成全文搜索面板。 */
  .kima-docs__search { display: none; }
  .kima-docs__brand { order: 1; gap: var(--kima-space-1); }
  .kima-docs__tools { order: 2; }
  .kima-docs__command { order: 3; }
}

@media (max-width: 760px) {
  .kima-docs__top { gap: var(--kima-space-2) var(--kima-space-3); padding: var(--kima-space-2) var(--kima-space-4); }
  .kima-docs__hero-canvas, .kima-docs__hero-canvas :deep(.kima-card), .kima-docs__canvas { padding: var(--kima-space-4); }
  .kima-docs__actions { flex-wrap: wrap; }
}

/* 窄手机（390 这一类）一行只放得下导航和主题两样：
 * 版本号退场，主题选择收窄，KIMA 字标的内边距也收紧，别让它们分两行占掉半屏。 */
@media (max-width: 480px) {
  .kima-docs__brand :deep(.kima-badge) { display: none; }
  .kima-docs__brand :deep(.kima-button) { padding-inline: var(--kima-space-2); }
  .kima-docs__tools { gap: var(--kima-space-1); }
  .kima-docs__tools > :first-child { flex: 0 0 116px; width: 116px; }
}
</style>
