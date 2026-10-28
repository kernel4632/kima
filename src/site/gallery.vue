<!-- 组件总览墙：全部组件按分组平铺，每个组件一块可交互的演示卡。
     参考 shadcn/create 的"一览全部、直接上手"思路：
     - 左侧锚点目录按分组跳转，右侧瀑布式铺开全部组件；
     - 每张卡自带标题（中文名 + slug）和"文档"按钮，直达该组件的文档页；
     - 演示内容复用各分组 examples.vue 里已经写好的交互示例，
       不重新画一套样图——这里跑的就是库里的组件。
     入口：App.vue 的 #/gallery 路由。 -->
<script setup>
import { computed, defineAsyncComponent, ref } from 'vue';
import { catalog } from './catalog.js';
import { exampleLoaders } from './groups.js';
import { KimaButton, KimaTextField, KimaIcon } from '../index.js';
import { ArrowUpRight01Icon, Search01Icon } from '@hugeicons/core-free-icons';

const props = defineProps({ navigate: { type: Function, required: true } });

const search = ref('');
const keyword = computed(() => search.value.trim().toLowerCase());

/* 目录按分组聚合，保持 catalog 的字母序；搜索时同时匹配中文名和 slug。 */
const groups = computed(() => {
  const map = new Map();
  for (const item of catalog) {
    if (keyword.value && !`${item.slug} ${item.label} ${item.name}`.toLowerCase().includes(keyword.value)) continue;
    if (!map.has(item.group)) map.set(item.group, []);
    map.get(item.group).push(item);
  }
  return [...map.entries()].map(([name, items]) => ({ name, items }));
});

/* 每个分组一个异步示例视图：和文档页同一套 loader，懒加载当前分组。 */
const groupViews = computed(() => Object.fromEntries(groups.value.map((group) => {
  const loader = exampleLoaders[group.items[0].slug];
  return [group.name, loader ? defineAsyncComponent(loader) : defineAsyncComponent(() => import('./base-examples.vue'))];
})));

/* 锚点 id 要稳定且合法：分组名可能带空格和斜杠，统一转成拼音安全的 slug。 */
function anchorOf(groupName) {
  return `gallery-${groupName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g, '-')}`;
}
function jump(groupName) {
  document.getElementById(anchorOf(groupName))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<template>
  <div class="kima-overview">
    <header class="kima-overview__head">
      <div>
        <h1>组件总览</h1>
        <p>全部 {{ catalog.length }} 个组件按分组平铺，每块都是可交互的实组件。点卡片右上角的「文档」看属性与源码。</p>
      </div>
      <KimaTextField v-model="search" class="kima-overview__search" label="过滤组件" type="search" placeholder="按名称过滤…" clearable>
        <template #leading><KimaIcon :icon="Search01Icon" /></template>
      </KimaTextField>
    </header>

    <div class="kima-overview__layout">
      <nav class="kima-overview__anchors" aria-label="分组目录">
        <KimaButton v-for="group in groups" :key="group.name" variant="text" @click="jump(group.name)">
          {{ group.name }}<span class="kima-overview__count">{{ group.items.length }}</span>
        </KimaButton>
        <p v-if="!groups.length" role="status">没有匹配「{{ search }}」的组件。</p>
      </nav>

      <div class="kima-overview__wall">
        <section v-for="group in groups" :key="group.name" :id="anchorOf(group.name)" class="kima-overview__group">
          <h2>{{ group.name }}</h2>
          <div class="kima-overview__cards">
            <article v-for="item in group.items" :key="item.slug" class="kima-overview__card">
              <header class="kima-overview__card-head">
                <div class="kima-overview__card-title">
                  <h3>{{ item.label }}</h3>
                  <code>{{ `<kima-${item.slug}>` }}</code>
                </div>
                <KimaIconButton :icon="ArrowUpRight01Icon" :label="`打开 ${item.label} 文档`" variant="text" @click="navigate(`components/${item.slug}`)" />
              </header>
              <div class="kima-overview__card-body">
                <component :is="groupViews[group.name]" :component="item.slug" />
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use "../styles/mixins" as *;

.kima-overview { min-width: 0; }

.kima-overview__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--kima-space-4);
  margin-bottom: var(--kima-space-8);

  h1 { margin: 0; font-size: var(--kima-font-size-headline-medium); letter-spacing: -.02em; }
  p { margin: var(--kima-space-2) 0 0; color: var(--kima-color-on-surface-variant); line-height: 1.8; }
}

.kima-overview__search { flex: 0 1 320px; min-width: 220px; }

.kima-overview__layout {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: var(--kima-space-8);
  align-items: start;
}

.kima-overview__anchors {
  position: sticky;
  top: 96px;
  display: flex;
  flex-direction: column;
  gap: var(--kima-space-1);
  max-height: calc(100dvh - 120px);
  overflow-y: auto;

  :deep(.kima-button) { justify-content: space-between; min-height: 40px; padding-inline: var(--kima-space-3); border-radius: var(--kima-radius-s); }
  :deep(.kima-button__label) { font-size: var(--kima-font-size-label-medium); }
}

.kima-overview__count { color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-small); }

.kima-overview__wall { display: flex; flex-direction: column; gap: var(--kima-space-10); min-width: 0; }

.kima-overview__group {
  scroll-margin-top: 120px;

  h2 {
    margin: 0 0 var(--kima-space-5);
    padding-bottom: var(--kima-space-2);
    border-bottom: 1px solid var(--kima-color-layer-2);
    font-size: var(--kima-font-size-title-medium);
  }
}

/* 卡片墙：两列起步，窄屏自动降为一列。卡片高度不齐是刻意的——
 * 每个组件按自己的自然高度展示，不强行等高裁切。 */
.kima-overview__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(420px, 100%), 1fr));
  gap: var(--kima-space-4);
  align-items: start;
}

.kima-overview__card {
  @include kima-layer(1);
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-radius: var(--kima-radius-m);
  overflow: hidden;
}

.kima-overview__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--kima-space-2);
  padding: var(--kima-space-3) var(--kima-space-4);
  border-bottom: 1px solid var(--kima-color-layer-1);
}

.kima-overview__card-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  h3 { margin: 0; font-size: var(--kima-font-size-label-large); }
  code { color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-small); }
}

/* 演示区：复用文档站的演示布局（gallery.scss 已全局生效），
 * 这里只负责把示例视图收进卡片并给足内边距。 */
.kima-overview__card-body {
  padding: var(--kima-space-5) var(--kima-space-4);
  min-width: 0;
}

@media (max-width: 900px) {
  .kima-overview__layout { grid-template-columns: minmax(0, 1fr); }
  .kima-overview__anchors {
    position: static;
    flex-direction: row;
    flex-wrap: wrap;
    max-height: none;
  }
}
</style>
