<!-- 实验台：全部 30 个原语组件平铺一页，直接上手交互看效果。
     base-examples 以 component="*" 模式渲染全部演示块。
     入口：#/lab -->
<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import BaseExamples from './base-examples.vue';
import { KimaBadge, KimaButton } from '../index.js';

defineProps({ navigate: { type: Function, required: true } });

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
        <KimaButton variant="text" @click="navigate('overview')">← 返回文档</KimaButton>
        <KimaBadge value="LAB" variant="primary" />
        <span class="kima-lab__hint">全部组件平铺，随便点</span>
      </div>
      <nav class="kima-lab__nav" aria-label="实验台分组">
        <KimaButton
          v-for="group in groups"
          :key="group.id"
          variant="text"
          :aria-current="activeGroup === group.id ? 'true' : undefined"
          @click="document.getElementById(group.id)?.scrollIntoView({ behavior: 'smooth' })"
        >{{ group.label }}</KimaButton>
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

/* 平铺模式下每个演示要能认出是谁：把组件演示的标题放回来。 */
.kima-lab__body :deep(.kima-gallery__demo > header) {
  display: flex;
  flex-direction: column;
  gap: var(--kima-space-1);
  align-self: stretch;

  h3 { margin: 0; font-size: var(--kima-font-size-title-small); }
  p { margin: 0; color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-medium); }
}

/* 分组标题也显示，并且组内 demo 两列铺开（窄屏一列）。 */
.kima-lab__body :deep(.kima-gallery__section > h2) {
  display: block;
  margin: var(--kima-space-6) 0 0;
  font-size: var(--kima-font-size-title-medium);
}

.kima-lab__body :deep(.kima-gallery__main) {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--kima-space-4);
  align-items: start;
}

.kima-lab__body :deep(.kima-gallery__section) {
  display: block;
  overflow: visible;
}

.kima-lab__body :deep(.kima-gallery__section .kima-gallery__demo) {
  align-items: stretch;
  text-align: start;
}

@media (max-width: 900px) {
  .kima-lab__body :deep(.kima-gallery__main) { grid-template-columns: minmax(0, 1fr); }
}
</style>
