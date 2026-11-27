<!-- 实验台：全部原语组件平铺一页，直接上手交互看效果。
     base-examples 以 component="*" 模式渲染全部演示块。
     顶栏右侧是深浅主题切换（三态：跟随系统 / 浅色 / 深色）。
     入口：#/lab -->
<script setup>
import { ref } from 'vue';
import BaseExamples from './base-examples.vue';
import { KimaBadge, KimaButton, KimaIcon } from '../index.js';
import { Moon02Icon, Sun03Icon, ComputerIcon } from '@hugeicons/core-free-icons';

defineProps({ navigate: { type: Function, required: true } });

/* 主题切换：写 documentElement 的 color-scheme（light-dark() 全库自动跟随）。
 * 三态循环：跟随系统（默认）→ 浅 → 深 → 跟随系统。 */
const themeMode = ref('auto'); // auto | light | dark
function cycleTheme() {
  themeMode.value = { auto: 'light', light: 'dark', dark: 'auto' }[themeMode.value];
  document.documentElement.style.colorScheme = themeMode.value === 'auto' ? '' : themeMode.value;
}
const themeMeta = {
  auto: { label: '跟随系统', icon: ComputerIcon },
  light: { label: '浅色主题', icon: Sun03Icon },
  dark: { label: '深色主题', icon: Moon02Icon },
};
</script>

<template>
  <div class="kima-lab">
    <header class="kima-lab__top">
      <div class="kima-lab__brand">
        <kima-button variant="text" @click="navigate('overview')">← 返回文档</kima-button>
        <kima-badge value="LAB" variant="primary" />
        <span class="kima-lab__hint">全部组件平铺，随便点</span>
      </div>
      <kima-button variant="standard" icon-only :label="themeMeta[themeMode].label" @click="cycleTheme">
        <kima-icon :icon="themeMeta[themeMode].icon" :size="20" />
      </kima-button>
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
