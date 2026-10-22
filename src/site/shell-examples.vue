<script setup>
import { ref } from 'vue';
import KimaSidebar from '../components/shell/sidebar.ce.vue';
import KimaAppShell from '../components/shell/app-shell.ce.vue';
import KimaConfigProvider from '../components/shell/config-provider.ce.vue';
import KimaMasonry from '../components/shell/masonry.ce.vue';
import KimaMarquee from '../components/shell/marquee.ce.vue';
import KimaGradientText from '../components/shell/gradient-text.ce.vue';
import KimaNavigationMenu from '../components/navigation/navigation-menu.ce.vue';
import KimaMenu from '../components/core/menu.ce.vue';
import KimaButton from '../components/core/button.ce.vue';
import KimaLink from '../components/navigation/link.ce.vue';
const props = defineProps({ component: { type: String, default: 'app-shell' } });
const page = ref('start'); const mode = ref('light');
const items = [{value:'overview',label:'概览',href:'#overview'}, {value:'guide',label:'指南',href:'#guide',children:[{value:'start',label:'开始使用',href:'#start'},{value:'theme',label:'主题配置',href:'#theme'}]}];
const actions = [{value:'export',label:'导出',children:[{value:'pdf',label:'PDF'},{value:'images',label:'图像',children:[{value:'png',label:'PNG'},{value:'svg',label:'SVG',disabled:true}]}]}, {value:'grid',label:'显示网格',type:'checkbox'}, {value:'comfortable',label:'舒适密度',type:'radio',group:'density'}, {value:'compact',label:'紧凑密度',type:'radio',group:'density'}];
</script>
<template><article :id="`shell-${component}`" class="kima-gallery__demo kima-shell-demo">
  <KimaSidebar v-if="component === 'sidebar'" v-model="page" :items="items"><template #header><strong>工作区</strong></template><template #footer>本地偏好</template></KimaSidebar>
  <KimaAppShell v-else-if="component === 'app-shell'"><template #header><h2>专注工作区</h2><KimaMenu :items="actions" label="操作" /></template><template #sidebar><KimaNavigationMenu v-model="page" :items="items" orientation="vertical" /></template><template #main><h3>当前内容 · {{ page }}</h3><p>真实链接、键盘导航与响应抽屉，让注意力留在当前任务。</p><KimaButton @click="page = page === 'theme' ? 'start' : 'theme'">切换内容</KimaButton></template><template #footer>应用壳负责布局，内容与路由由使用者控制。</template></KimaAppShell>
  <div v-else-if="component === 'config-provider'"><KimaButton @click="mode = mode === 'light' ? 'dark' : 'light'">切换局部明暗</KimaButton><KimaConfigProvider :theme="mode" seed="#61afef" variant="tonal-spot" locale="zh-CN" class="kima-shell-demo__scope"><p>局部 {{ mode }} 主题</p><KimaButton>局部按钮</KimaButton><KimaMenu :items="actions" label="局部操作" /></KimaConfigProvider></div>
  <KimaMasonry v-else-if="component === 'masonry'" :columns="{base:1,sm:2,lg:3}"><KimaLink v-for="n in 8" :key="n" href="#shell-masonry" class="kima-shell-demo__tile" :style="{minHeight: `${90 + n % 3 * 45}px`}">内容 {{ n }} · 列优先阅读顺序</KimaLink></KimaMasonry>
  <KimaMarquee v-else-if="component === 'marquee'" animated><KimaLink v-for="n in 5" :key="n" href="#shell-marquee">更新 {{ n }} · 聚焦暂停</KimaLink></KimaMarquee>
  <KimaGradientText v-else-if="component === 'gradient-text'" as="h2">专注、交互、动效、鲜活</KimaGradientText>
</article></template>
<style scoped lang="scss">
.kima-shell-demo { box-sizing: border-box; width: 100%; min-width: 0; color: var(--kima-color-on-surface); font-family: var(--kima-font-family); &__scope { margin-top: var(--kima-space-4); padding: var(--kima-space-6); background: var(--kima-color-surface); border-radius: var(--kima-radius-l); } &__tile { display: block; box-sizing: border-box; padding: var(--kima-space-4); background: var(--kima-color-layer-2); color: var(--kima-color-primary); border-radius: var(--kima-radius-m); } }
</style>
