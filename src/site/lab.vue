<!-- 实验台：全部 30 个原语组件平铺一页，直接上手交互看效果。
     base-examples 以 component="*" 模式渲染全部演示块。
     入口：#/lab -->
<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import BaseExamples from './base-examples.vue';
import { KimaBadge, KimaButton } from '../index.js';

defineProps({ navigate: { type: Function, required: true } });

/* 模板里直接写 document 在运行时是 undefined（Vue 模板作用域只暴露实例），
 * 滚动锚点收进方法。 */
function scrollToGroup(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

/* 目录高亮：滚动到哪个分组，导航点亮哪个。实验台是长页，这个比返回顶部有用。 */
const groups = [
  { id: 'actions', label: '按钮与动作' },
  { id: 'form', label: '表单输入' },
  { id: 'pickers', label: '选择' },
  { id: 'feedback', label: '反馈与提示' },
  { id: 'data', label: '数据展示' },
  { id: 'structure', label: '结构与导航' },
];
const activeGroup = ref(groups[0].id);
let observer;
onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) activeGroup.value = visible.target.id;
    },
    { rootMargin: '-80px 0px -70% 0px' },
  );
  for (const group of groups) {
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
        <kima-button variant="text" @click="navigate('overview')">← 返回文档</kima-button>
        <kima-badge value="LAB" variant="primary" />
        <span class="kima-lab__hint">全部组件平铺，随便点</span>
      </div>
      <nav class="kima-lab__nav" aria-label="实验台分组">
        <kima-button
          v-for="group in groups"
          :key="group.id"
          variant="text"
          :aria-current="activeGroup === group.id ? 'true' : undefined"
          @click="scrollToGroup(group.id)"
        >{{ group.label }}</kima-button>
      </nav>
    </header>

    <main class="kima-lab__body">
      <BaseExamples component="*" />
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

/* 平铺模式下每个演示要能认出是谁：KimaTypography 自带尺寸/颜色 token，
 * 只负责排版间距。header 在 KimaCard 的 body 插槽里，用后代选择器命中。 */
.kima-lab__body :deep(.kima-gallery__demo header) {
  display: flex;
  flex-direction: column;
  gap: var(--kima-space-1);
  align-self: stretch;
}

/* 平铺模式把分组标题（KimaTypography）显出来，组标题上方让开一档（24px），
 * 与上一组的末卡拉开呼吸感；下方靠 section gap 16 承担。 */
.kima-lab__body :deep(.kima-gallery__section > .kima-typography) {
  display: block;
  margin: var(--kima-space-6) 0 0;
}

.kima-lab__body :deep(.kima-gallery__section:first-child > .kima-typography) {
  margin-top: 0;
}

/* 单列一排排：demo 卡片占满行宽，组间用 KimaDivider 分隔（组件自己渲染）。 */
.kima-lab__body :deep(.kima-gallery__main),
.kima-lab__body :deep(.kima-gallery__section) {
  display: flex;
  flex-direction: column;
  gap: var(--kima-space-4);
}

.kima-lab__body :deep(.kima-gallery__section .kima-gallery__demo) {
  align-items: stretch;
  text-align: start;
  /* KimaCard 承担卡片皮肤，这里只管铺满。 */
  width: 100%;
}
</style>
