<!--
代码块：阅读与复制源码，支持语法着色、行号和自动换行，颜色跟随 KIMA 主题。
分词用 highlight.js，已内置它的 common 语言集（36 种 + dockerfile），别名见 utils/code-highlight.js；
其余语言用 registerCodeLanguage() 按需登记，未登记的语言按纯文本展示。
调用示例：
  <kima-code-block code="pnpm add @kernel4632/kima vue" language="shell" />
  <kima-code-block :code="source" language="vue" filename="App.vue" line-numbers />
-->
<script setup>
import { computed, getCurrentInstance, ref, useAttrs, watch } from 'vue';
import { highlightCodeLines } from '../../utils/code-highlight.js';
import { Copy01Icon, TextWrapIcon, Tick01Icon } from '@hugeicons/core-free-icons';
import KimaIcon from './icon.ce.vue';
import KimaIconButton from './icon-button.ce.vue';
import KimaTooltip from './tooltip.ce.vue';

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

const lines = computed(() => highlightCodeLines(props.code, props.language));

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
        <KimaTooltip :text="wrapping ? '关闭自动换行' : '开启自动换行'" position="left">
          <KimaIconButton :icon="TextWrapIcon" label="自动换行" :title="wrapping ? '关闭自动换行' : '开启自动换行'" :variant="wrapping ? 'tonal' : 'standard'" :aria-pressed="wrapping" @click="wrapping = !wrapping" />
        </KimaTooltip>
        <KimaTooltip v-if="copyable" :text="status === '已复制' ? '已复制' : '复制代码'" position="left">
          <KimaIconButton :loading="copying" label="复制代码" :title="status === '已复制' ? '已复制' : '复制代码'" @click="copyCode">
            <Transition name="kima-fade" mode="out-in"><KimaIcon :key="status === '已复制'" :icon="status === '已复制' ? Tick01Icon : Copy01Icon" /></Transition>
          </KimaIconButton>
        </KimaTooltip>
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

  /* 顶栏是一层独立的小场地：给它自己一层浅底，和代码正文分开，
   * 上下内边距压到 4px，别让"文件名那行"和第一行代码之间空出一条带。 */
  &__toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--kima-space-2);
    padding: var(--kima-space-1) var(--kima-space-4);
    border-radius: var(--kima-radius-m) var(--kima-radius-m) 0 0;
    background: var(--kima-color-layer-2);
  }
  &__meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--kima-space-3); min-width: 0; }
  &__filename { overflow-wrap: anywhere; font-size: var(--kima-font-size-label-medium); }
  &__language { color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-small); }
  &__actions { display: flex; flex: 0 0 auto; align-items: center; margin-left: auto; gap: var(--kima-space-1); }
  &__viewport {
    box-sizing: border-box;
    max-height: 32rem;
    overflow: auto;
    margin: 0;
    padding: var(--kima-space-2) var(--kima-space-4) var(--kima-space-4);
    border-radius: 0 0 var(--kima-radius-m) var(--kima-radius-m);
    font: inherit;
    font-size: var(--kima-font-size-body-small);
    /* 代码的节奏由行本身承担：1.6 比正文的 1.7 紧一点，一屏能多看两行。 */
    line-height: var(--kima-line-height-code);
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
  /* 语法着色分五层：关键字（品牌色）、字符串（绿）、数字/常量（橙）、
   * 函数与类型（紫）、属性与变量（粉）；注释和标点退到次要文字色。
   * 只给 4 个 token 的话，一段 Vue 代码除了字符串几乎全是同一个颜色。 */
  :deep(.hljs-keyword),
  :deep(.hljs-name),
  :deep(.hljs-selector-tag),
  :deep(.hljs-section),
  :deep(.hljs-doctag),
  :deep(.hljs-meta .hljs-keyword),
  :deep(.hljs-function) { color: var(--kima-color-code-keyword); }

  :deep(.hljs-string),
  :deep(.hljs-regexp),
  :deep(.hljs-addition),
  :deep(.hljs-meta .hljs-string) { color: var(--kima-color-code-string); }

  :deep(.hljs-number),
  :deep(.hljs-literal),
  :deep(.hljs-symbol),
  :deep(.hljs-bullet),
  :deep(.hljs-link),
  :deep(.hljs-selector-attr),
  :deep(.hljs-char.escape_) { color: var(--kima-color-code-number); }

  :deep(.hljs-title),
  :deep(.hljs-type),
  :deep(.hljs-built_in),
  :deep(.hljs-template-tag),
  :deep(.hljs-selector-pseudo),
  :deep(.hljs-formula) { color: var(--kima-color-code-function); }

  :deep(.hljs-attr),
  :deep(.hljs-attribute),
  :deep(.hljs-property),
  :deep(.hljs-variable),
  :deep(.hljs-selector-class),
  :deep(.hljs-selector-id),
  :deep(.hljs-template-variable),
  :deep(.hljs-code) { color: var(--kima-color-code-property); }

  :deep(.hljs-comment),
  :deep(.hljs-quote),
  :deep(.hljs-meta) { color: var(--kima-color-code-comment); font-style: italic; }

  :deep(.hljs-tag),
  :deep(.hljs-punctuation),
  :deep(.hljs-operator) { color: var(--kima-color-code-punctuation); }

  :deep(.hljs-deletion) { color: var(--kima-color-error); }
  :deep(.hljs-emphasis) { font-style: italic; }
  :deep(.hljs-strong) { font-weight: 700; }
}
</style>
