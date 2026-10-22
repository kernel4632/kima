<script setup>
import { ref } from "vue";
import KimaAccordion from "../components/accordion.ce.vue";
import KimaCollapsible from "../components/collapsible.ce.vue";
import KimaBreadcrumb from "../components/breadcrumb.ce.vue";
import KimaLink from "../components/link.ce.vue";
import KimaStepper from "../components/stepper.ce.vue";
import KimaNavigationMenu from "../components/navigation-menu.ce.vue";
import KimaAnchor from "../components/anchor.ce.vue";
import KimaBackTop from "../components/back-top.ce.vue";
import KimaSplitter from "../components/splitter.ce.vue";
import KimaScrollArea from "../components/scroll-area.ce.vue";
import KimaToolbar from "../components/toolbar.ce.vue";
import KimaVisuallyHidden from "../components/visually-hidden.ce.vue";
import KimaOverflowList from "../components/overflow-list.ce.vue";
import KimaCarousel from "../components/carousel.ce.vue";
import KimaButton from "../components/button.ce.vue";
import { navigationCatalog } from "./navigation-catalog.js";
const props = defineProps({ component: { type: String, default: "accordion" } });
const expanded = ref("experience");
const open = ref(true);
const page = ref("overview");
const step = ref(1);
const size = ref(35);
const slide = ref(0);
const overflow = ref(false);
const actions = ref(0);
const questions = [{ value: "experience", label: "交互体验为什么优先？", content: "让下一步清晰可见，减少用户的选择成本。" }, { value: "motion", label: "动效承担什么职责？", content: "引导注意力，并反馈每一次操作。" }, { value: "disabled", label: "暂不可用的内容", disabled: true }];
const navigation = [{ value: "overview", label: "概览", href: "#navigation-overview" }, { value: "design", label: "设计指南", href: "#navigation-design" }, { value: "components", label: "组件", href: "#navigation-components" }, { value: "later", label: "即将开放", href: "#later", disabled: true }];
const steps = [{ label: "项目信息", description: "已经准备就绪" }, { label: "确认配置", description: "检查无障碍与主题" }, { label: "发布", description: "分享给协作者" }];
const sections = [{ href: "#navigation-overview", label: "概览" }, { href: "#navigation-design", label: "设计指南" }, { href: "#navigation-components", label: "组件" }];
const slides = [{ title: "Kinetic · 动起来", content: "用动效引导注意力，而不是让内容自动离开视野。" }, { title: "Interaction · 可达", content: "方向键、按钮与清晰计数，你决定阅读节奏。" }, { title: "Alive · 鲜活", content: "大尺寸、低密度，让界面轻松呼吸。" }];
</script>
<template>
  <article v-if="navigationCatalog[component]" class="kima-gallery__demo kima-navigation-demo">
    <header><h2>{{ navigationCatalog[component].label }}</h2><p>真实导航、键盘可达、手动控制；松弛排版与透明层次。</p></header>
    <KimaAccordion v-if="component === 'accordion'" v-model="expanded" :items="questions" />
    <div v-else-if="component === 'collapsible'" class="kima-navigation-demo__stack"><KimaCollapsible v-model:open="open" label="高级偏好"><p>单独控制这一块内容，不影响其他折叠区域。</p><KimaButton variant="tonal">管理偏好</KimaButton></KimaCollapsible><KimaButton variant="text" @click="open = !open">从外部{{ open ? '关闭' : '展开' }}</KimaButton></div>
    <KimaBreadcrumb v-else-if="component === 'breadcrumb'" :items="[{ label: '工作空间', href: '#workspace' }, { label: '项目', href: '#projects' }, { label: 'KIMA 设计系统' }]" />
    <div v-else-if="component === 'link'" class="kima-navigation-demo__row"><KimaLink href="https://reka-ui.com" target="_blank">阅读 Reka 文档</KimaLink><KimaLink href="#current" current>当前位置</KimaLink><KimaLink href="#disabled" disabled>暂不可用</KimaLink></div>
    <KimaStepper v-else-if="component === 'stepper'" v-model="step" :items="steps" linear />
    <KimaNavigationMenu v-else-if="component === 'navigation-menu'" v-model="page" :items="navigation" />
    <div v-else-if="component === 'anchor'" class="kima-navigation-demo__columns"><KimaAnchor :items="sections" target="#navigation-reader" :offset="16" /><KimaScrollArea id="navigation-reader" label="指南正文" :max-height="360"><section v-for="item in sections" :id="item.href.slice(1)" :key="item.href" class="kima-navigation-demo__section"><h3>{{ item.label }}</h3><p>目录跟随正文滚动，点击链接可定位到对应章节。</p></section></KimaScrollArea></div>
    <div v-else-if="component === 'back-top'" class="kima-navigation-demo__stack"><KimaScrollArea id="navigation-long-reader" label="可滚动的长文" :max-height="280"><div v-for="n in 12" :key="n" class="kima-navigation-demo__paragraph">第 {{ n }} 段 · 向下滚动后，返回顶部操作会出现。</div></KimaScrollArea><KimaBackTop target="#navigation-long-reader" :threshold="80" :fixed="false" /></div>
    <div v-else-if="component === 'splitter'"><KimaSplitter v-model="size" :min="20" :max="75"><template #first><h3>项目目录</h3><p>拖动中间把手调整分栏。</p></template><template #second><h3>内容工作区</h3><p>也可以聚焦把手，使用方向键或 Home / End 调整。</p></template></KimaSplitter><output>左侧比例：{{ size }}%</output></div>
    <KimaScrollArea v-else-if="component === 'scroll-area'" label="最近更新" :max-height="260"><p v-for="n in 16" :key="n" class="kima-navigation-demo__paragraph">更新 {{ n }} · 原生滚动、键盘访问、保留完整内容。</p></KimaScrollArea>
    <div v-else-if="component === 'toolbar'" class="kima-navigation-demo__stack"><KimaToolbar label="编辑工具"><KimaButton @click="actions++">保存</KimaButton><KimaButton variant="tonal" disabled>撤销</KimaButton><KimaButton variant="tonal" @click="actions++">预览</KimaButton><KimaLink href="#publish">发布说明</KimaLink></KimaToolbar><output>操作次数：{{ actions }} · 方向键跳过禁用项</output></div>
    <div v-else-if="component === 'visually-hidden'"><KimaButton aria-describedby="navigation-hidden-help">分享项目</KimaButton><KimaVisuallyHidden id="navigation-hidden-help">分享链接将允许协作者查看项目，不会授予编辑权限。</KimaVisuallyHidden><p>辅助说明仅供读屏，不占据视觉版面，也不是装饰分隔线。</p></div>
    <KimaOverflowList v-else-if="component === 'overflow-list'" v-model:expanded="overflow" :items="['交互设计', '主题配色', '无障碍', '文档', '动效', '发布']" :max="3" />
    <KimaCarousel v-else-if="component === 'carousel'" v-model="slide" :items="slides" />
  </article>
</template>
<style scoped lang="scss">
.kima-navigation-demo { display: grid; gap: var(--kima-space-6); min-width: 0; width: 100%; box-sizing: border-box; padding: var(--kima-space-6); color: var(--kima-color-on-surface); font-family: var(--kima-font-family); h2 { margin: 0 0 var(--kima-space-3); font-size: var(--kima-font-size-headline-small); } header p { margin: 0; color: var(--kima-color-on-surface-variant); } &__row { display: flex; flex-wrap: wrap; gap: var(--kima-space-4); align-items: center; } &__stack { display: grid; gap: var(--kima-space-4); } &__columns { display: grid; grid-template-columns: minmax(140px, 1fr) minmax(0, 3fr); gap: var(--kima-space-4); } &__section { min-height: 280px; padding: var(--kima-space-4); box-sizing: border-box; } &__paragraph { padding: var(--kima-space-4); margin: 0; } }
@media (max-width: 560px) { .kima-navigation-demo { padding: var(--kima-space-4); &__columns { grid-template-columns: minmax(0, 1fr); } } }
</style>
