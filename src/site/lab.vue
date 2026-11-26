<!-- 实验台：全部组件演示平铺一页，直接上手交互看效果。
     base-examples 平铺 28 个核心组件（component="*" 模式）之外，
     再按统一分组注册表把扩展组（input/advanced-input/form-completion/utility/…）
     逐 slug 渲染成独立演示块——实验台=全部组件，和 gallery 的场景页互补。
     入口：#/lab -->
<script setup>
import { computed, defineAsyncComponent, onMounted, onBeforeUnmount, ref } from 'vue';
import BaseExamples from './base-examples.vue';
import { KimaIconButton, KimaBadge, KimaButton } from '../index.js';
import { inputCatalog } from './input-catalog.js';
import { displayCatalog } from './display-catalog.js';
import { navigationCatalog } from './navigation-catalog.js';
import { interactionCatalog } from './interaction-catalog.js';
import { advancedInputCatalog } from './advanced-input-catalog.js';
import { dataCatalog } from './data-catalog.js';
import { formCompletionCatalog } from './form-completion-catalog.js';
import { utilityCatalog } from './utility-catalog.js';
import { foundationCatalog } from './foundation-catalog.js';
import { contentCatalog } from './content-catalog.js';
import { shellCatalog } from './shell-catalog.js';
import { Menu01Icon } from '@hugeicons/core-free-icons';

defineProps({ navigate: { type: Function, required: true } });

/* 扩展组示例视图：全部懒加载，进实验台才拉取对应 chunk。 */
const exampleViews = {
  input: defineAsyncComponent(() => import('./input-examples.vue')),
  display: defineAsyncComponent(() => import('./display-examples.vue')),
  navigation: defineAsyncComponent(() => import('./navigation-examples.vue')),
  interaction: defineAsyncComponent(() => import('./interaction-examples.vue')),
  'advanced-input': defineAsyncComponent(() => import('./advanced-input-examples.vue')),
  data: defineAsyncComponent(() => import('./data-examples.vue')),
  'form-completion': defineAsyncComponent(() => import('./form-completion-examples.vue')),
  utility: defineAsyncComponent(() => import('./utility-examples.vue')),
  foundation: defineAsyncComponent(() => import('./foundation-examples.vue')),
  content: defineAsyncComponent(() => import('./content-examples.vue')),
  shell: defineAsyncComponent(() => import('./shell-examples.vue')),
};

/* 分区 = 目录名 + 对应 catalog + 对应示例视图。
 * 直接按 catalog 文件枚举，不靠 group 文案匹配（分组描述与目录名不对齐）。
 * 同一 slug 在多个目录登记过（color-picker 同时在 input 与 form-completion、
 * form 同时在 advanced-input 与 form-completion）——先出现的区优先，后面去重。 */
const seen = new Set();
const extensionSections = [
  { id: 'input', label: '输入控件', view: 'input', catalog: inputCatalog },
  { id: 'advanced-input', label: '日期与高级输入', view: 'advanced-input', catalog: advancedInputCatalog },
  { id: 'form-completion', label: '表单闭环', view: 'form-completion', catalog: formCompletionCatalog },
  { id: 'display', label: '展示与反馈', view: 'display', catalog: displayCatalog },
  { id: 'interaction', label: '弹层与交互', view: 'interaction', catalog: interactionCatalog },
  { id: 'data', label: '数据与媒体', view: 'data', catalog: dataCatalog },
  { id: 'content', label: '图表与内容引擎', view: 'content', catalog: contentCatalog },
  { id: 'navigation', label: '导航与组织', view: 'navigation', catalog: navigationCatalog },
  { id: 'utility', label: '工具与操作', view: 'utility', catalog: utilityCatalog },
  { id: 'foundation', label: '布局与排版', view: 'foundation', catalog: foundationCatalog },
  { id: 'shell', label: '应用壳', view: 'shell', catalog: shellCatalog },
].map((section) => ({
  ...section,
  slugs: Object.entries(section.catalog)
    .filter(([slug]) => !seen.has(slug) && seen.add(slug))
    .map(([slug, meta]) => ({ slug, label: meta.label })),
}));

/* base-examples 的 28 个核心组件自成一区（component="*" 平铺）。 */
const baseSection = { id: 'actions', label: '核心组件' };
const sections = computed(() => [baseSection, ...extensionSections]);

/* 目录高亮：滚动到哪个分组，导航点亮哪个。实验台是长页，这个比返回顶部有用。 */
const activeGroup = ref(baseSection.id);
let observer;
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) activeGroup.value = visible.target.id;
    },
    { rootMargin: '-80px 0px -70% 0px' },
  );
  for (const group of sections.value) {
    const el = document.getElementById(group.id);
    if (el) observer.observe(el);
  }
});
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div class="kima-lab">
    <header class="kima-lab__top">
      <div class="kima-lab__brand">
        <KimaButton variant="text" @click="navigate('overview')">← 返回文档</KimaButton>
        <KimaBadge value="LAB" variant="primary" />
        <span class="kima-lab__hint">全部组件平铺，随便点</span>
      </div>
      <nav class="kima-lab__nav" aria-label="实验台分组">
        <KimaButton
          v-for="group in sections"
          :key="group.id"
          variant="text"
          :aria-current="activeGroup === group.id ? 'true' : undefined"
          @click="document.getElementById(group.id)?.scrollIntoView({ behavior: 'smooth' })"
        >{{ group.label }}</KimaButton>
      </nav>
    </header>

    <main class="kima-lab__body">
      <section :id="baseSection.id" class="kima-lab__section">
        <h2>{{ baseSection.label }}</h2>
        <BaseExamples component="*" />
      </section>

      <section v-for="section in extensionSections" :id="section.id" :key="section.id" class="kima-lab__section">
        <h2>{{ section.label }}</h2>
        <div class="kima-lab__grid">
          <article v-for="entry in section.slugs" :key="entry.slug" class="kima-lab__demo">
            <header><h3>{{ entry.label }}</h3><p>{{ entry.slug }}</p></header>
            <component :is="exampleViews[section.view]" :key="entry.slug" :component="entry.slug" />
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.kima-lab {
  min-height: 100vh;
  color: var(--kima-color-on-surface);
  background: var(--kima-color-surface);
  padding: 0 var(--kima-space-6) var(--kima-space-16);
}

.kima-lab__top {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--kima-space-3);
  margin: 0 calc(-1 * var(--kima-space-6));
  padding: var(--kima-space-3) var(--kima-space-6);
  background: color-mix(in srgb, var(--kima-color-surface) 88%, transparent);
  backdrop-filter: blur(8px);
}

.kima-lab__brand {
  display: flex;
  align-items: center;
  gap: var(--kima-space-2);
}

.kima-lab__hint {
  color: var(--kima-color-on-surface-variant);
  font-size: var(--kima-font-size-label-medium);
}

.kima-lab__nav {
  display: flex;
  flex-wrap: wrap;
  gap: var(--kima-space-1);

  :deep(.kima-button) {
    min-height: 40px;
    padding-inline: var(--kima-space-3);
    font-size: var(--kima-font-size-label-medium);
  }

  :deep(.kima-button[aria-current='true']) {
    background: var(--kima-color-accent-secondary);
    color: var(--kima-color-on-accent-secondary);
  }
}

.kima-lab__body {
  max-width: 1280px;
  margin: var(--kima-space-6) auto 0;
}

.kima-lab__section {
  display: block;
  scroll-margin-top: 88px;

  > h2 {
    margin: var(--kima-space-6) 0 var(--kima-space-3);
    font-size: var(--kima-font-size-title-medium);
  }
}

/* 平铺模式下每个演示要能认出是谁：标题行 + 两列铺开。 */
.kima-lab__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--kima-space-4);
  align-items: start;
}

.kima-lab__demo {
  display: flex;
  flex-direction: column;
  gap: var(--kima-space-2);
  min-width: 0;
  padding: var(--kima-space-4);
  border-radius: var(--kima-radius-l);
  background: var(--kima-color-layer-1);

  header {
    display: flex;
    flex-direction: column;
    gap: var(--kima-space-1);

    h3 { margin: 0; font-size: var(--kima-font-size-title-small); }
    p { margin: 0; color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-medium); }
  }
}

/* base-examples 自己带的分组结构在「核心组件」区里照旧生效。 */
.kima-lab__section:first-child {
  :deep(.kima-gallery__demo > header) {
    display: flex;
    flex-direction: column;
    gap: var(--kima-space-1);
    align-self: stretch;

    h3 { margin: 0; font-size: var(--kima-font-size-title-small); }
    p { margin: 0; color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-medium); }
  }

  :deep(.kima-gallery__section > h2) { display: none; }

  :deep(.kima-gallery__main) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--kima-space-4);
    align-items: start;
  }

  :deep(.kima-gallery__section) { display: block; overflow: visible; }

  :deep(.kima-gallery__section .kima-gallery__demo) { align-items: stretch; text-align: start; }
}

@media (max-width: 900px) {
  .kima-lab__grid,
  .kima-lab__section:first-child :deep(.kima-gallery__main) { grid-template-columns: minmax(0, 1fr); }
}
</style>
