<!--
代码块：阅读与复制源码，支持语法着色、行号和自动换行，颜色跟随 KIMA 主题。
语言支持 HTML / Vue、JavaScript、CSS / SCSS、JSON、Shell；其他语言按纯文本展示。
调用示例：
  <kima-code-block code="pnpm add @kernel4632/kima vue" language="shell" />
  <kima-code-block :code="source" language="vue" filename="App.vue" line-numbers />
-->
<script>
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import scss from 'highlight.js/lib/languages/scss';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';

// 独立实例不修改宿主项目的 highlight.js 配置，也不打包全部语言。
const highlighter = hljs.newInstance();
for (const [name, grammar] of Object.entries({ javascript, xml, css, scss, json, bash })) {
  highlighter.registerLanguage(name, grammar);
}
highlighter.registerAliases(['html', 'vue'], { languageName: 'xml' });
highlighter.registerAliases(['shell'], { languageName: 'bash' });
</script>

<script setup>
import { computed, getCurrentInstance, ref, useAttrs, watch } from 'vue';
import KimaButton from './button.ce.vue';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  code: { type: String, default: '' },
  language: { type: String, default: 'text' },
  filename: { type: String, default: '' },
  label: { type: String, default: '代码' },
  lineNumbers: Boolean,
  wrap: Boolean,
  copyable: { type: Boolean, default: true },
});
const emit = defineEmits(['copy', 'copy-error']);
const attrs = useAttrs();
const isCustomElement = Boolean(getCurrentInstance()?.ce);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const wrapping = ref(props.wrap);
const copying = ref(false);
const status = ref('');
watch(() => props.wrap, (value) => { wrapping.value = value; });
watch(() => props.code, () => { status.value = ''; });

const lines = computed(() => {
  const language = props.language.toLowerCase();
  const html = highlighter.getLanguage(language)
    ? highlighter.highlight(props.code, { language, ignoreIllegals: true }).value
    : props.code.replace(/[&<>]/g, (character) => String.fromCharCode(38) + ({ '&': 'amp;', '<': 'lt;', '>': 'gt;' })[character]);
  // 着色跨行时，逐行补齐 span，保留多行字符串和注释的语义及行号对齐。
  const open = [];
  const rows = [];
  let row = '';
  for (const token of html.split(/(<span\b[^>]*>|<\/span>|\n)/)) {
    if (token === '\n') {
      rows.push(row + '</span>'.repeat(open.length));
      row = open.join('');
    } else {
      row += token;
      if (token.startsWith('<span')) open.push(token);
      else if (token === '</span>') open.pop();
    }
  }
  rows.push(row + '</span>'.repeat(open.length));
  return rows;
});

async function copyCode() {
  if (copying.value) return;
  const code = props.code;
  copying.value = true;
  status.value = '';
  try {
    await navigator.clipboard.writeText(code);
    if (code === props.code) status.value = '已复制';
    emit('copy', code);
  } catch {
    status.value = '复制失败，请选择代码手动复制';
    emit('copy-error');
  } finally {
    copying.value = false;
  }
}
</script>

<template>
  <figure v-bind="forwardedAttrs" class="kima-code-block" :class="{ 'kima-code-block--wrap': wrapping }">
    <figcaption class="kima-code-block__toolbar">
      <div class="kima-code-block__meta">
        <span v-if="filename" class="kima-code-block__filename">{{ filename }}</span>
        <span class="kima-code-block__language">{{ language }}</span>
      </div>
      <div class="kima-code-block__actions">
        <KimaButton variant="text" :aria-pressed="wrapping" @click="wrapping = !wrapping">换行</KimaButton>
        <KimaButton v-if="copyable" variant="text" :loading="copying" aria-label="复制代码" @click="copyCode"><Transition name="kima-fade" mode="out-in"><span :key="status === '已复制'">{{ status === '已复制' ? '已复制' : '复制' }}</span></Transition></KimaButton>
      </div>
    </figcaption>
    <pre class="kima-code-block__viewport" tabindex="0" role="region" :aria-label="filename || label"><code class="kima-code-block__code"><span v-for="(line, index) in lines" :key="index" class="kima-code-block__line"><span v-if="lineNumbers" class="kima-code-block__number" aria-hidden="true" :style="{ width: `${String(lines.length).length}ch` }">{{ index + 1 }}</span><span class="kima-code-block__text" v-html="line || '&#8203;'" /></span></code></pre>
    <span class="kima-code-block__status" :class="{ 'kima-code-block__status--error': status && status !== '已复制' }" role="status">{{ status }}</span>
  </figure>
</template>

<style scoped lang="scss">
@use '../../styles/mixins' as *;

// light DOM 宿主作为 grid/flex 子项时，也必须允许比代码的固有宽度更窄。
:global(kima-code-block) { display: block; min-width: 0; max-width: 100%; }

.kima-code-block {
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  margin: 0;
  border-radius: var(--kima-radius-m);
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  font-weight: var(--kima-font-weight-semi-bold);
  @include kima-layer(1);

  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--kima-space-2);
    padding: var(--kima-space-2) var(--kima-space-4);
  }
  &__meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--kima-space-3); min-width: 0; }
  &__filename { overflow-wrap: anywhere; font-size: var(--kima-font-size-label-medium); }
  &__language { color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-small); }
  &__actions { display: flex; margin-left: auto; gap: var(--kima-space-1); }
  &__actions :deep(.kima-button) { padding-inline: var(--kima-space-3); }
  &__viewport {
    box-sizing: border-box;
    max-height: 32rem;
    overflow: auto;
    margin: 0;
    padding: var(--kima-space-4) var(--kima-space-5) var(--kima-space-6);
    border-radius: var(--kima-radius-m);
    font: inherit;
    font-size: var(--kima-font-size-body-small);
    line-height: var(--kima-line-height-loose);
    tab-size: 2;
    @include kima-focus-ring;
  }
  &__code { display: block; min-width: max-content; font: inherit; }
  &__line { display: flex; min-height: 1lh; }
  &__number { flex: 0 0 auto; padding-right: var(--kima-space-5); color: var(--kima-color-on-surface-variant); text-align: right; user-select: none; }
  &__text { display: block; flex: 1; min-width: 0; white-space: pre; }
  &--wrap &__code { min-width: 0; }
  &--wrap &__text { white-space: pre-wrap; overflow-wrap: anywhere; }
  // 反馈由读屏即时播报；失败时也给视觉用户提供具体操作。
  &__status { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  &__status--error { position: static; display: block; width: auto; height: auto; clip-path: none; padding: 0 var(--kima-space-5) var(--kima-space-3); font-size: var(--kima-font-size-label-small); color: var(--kima-color-on-surface-variant); }
  :deep(.hljs-keyword), :deep(.hljs-tag), :deep(.hljs-selector-tag) { color: var(--kima-color-primary); }
  :deep(.hljs-string), :deep(.hljs-attr), :deep(.hljs-selector-class) { color: var(--kima-color-tertiary); }
  :deep(.hljs-number), :deep(.hljs-literal), :deep(.hljs-built_in), :deep(.hljs-title) { color: var(--kima-color-secondary); }
  :deep(.hljs-comment), :deep(.hljs-meta) { color: var(--kima-color-on-surface-variant); }
}
</style>
