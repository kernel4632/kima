<!-- 页头：标题/描述/面包屑/动作四个可组合区域，透明排版，不接管页面容器宽度；heading 避免与原生 title 属性冲突。调用示例：<kima-page-header heading="成员" description="管理当前空间成员"><template #breadcrumbs><a href="/">首页</a></template><template #actions><kima-button>邀请</kima-button></template></kima-page-header> -->
<script setup>
import { computed } from 'vue';
import { useNavigationRoot } from '../../utils/navigation.js';
import { choice } from '../../utils/foundation.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ heading: { type: String, default: '' }, description: { type: String, default: '' }, level: { type: Number, default: 1 }, align: { type: String, default: 'start' } });
const { root, forwardedAttrs, hasNativeSlot, isCustomElement } = useNavigationRoot();
const headingTag = computed(() => `h${Math.min(6, Math.max(1, Number(props.level) || 1))}`);
const alignment = computed(() => choice(props.align, ['start', 'center'], 'start'));
</script>
<template>
  <header ref="root" v-bind="forwardedAttrs" class="kima-page-header" :class="`kima-page-header--${alignment}`">
    <nav v-if="$slots.breadcrumbs || hasNativeSlot('breadcrumbs') || isCustomElement" class="kima-page-header__breadcrumbs" aria-label="面包屑"><slot name="breadcrumbs" /></nav>
    <div class="kima-page-header__row">
      <div class="kima-page-header__body">
        <component :is="headingTag" v-if="heading" class="kima-page-header__title">{{ heading }}</component>
        <p v-if="description" class="kima-page-header__description">{{ description }}</p>
        <slot />
      </div>
      <div v-if="$slots.actions || hasNativeSlot('actions') || isCustomElement" class="kima-page-header__actions"><slot name="actions" /></div>
    </div>
  </header>
</template>
<style scoped lang="scss">
@use '../../styles/foundation' as *;
.kima-page-header {
  @include foundation-base;
  display: grid;
  gap: var(--kima-space-4);
  padding-block: var(--kima-space-4);
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  &__breadcrumbs { min-width: 0; color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-label-medium); &:empty { display: none; } }
  &__row { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--kima-space-4); }
  &__body { display: grid; flex: 1 1 320px; gap: var(--kima-space-2); min-width: 0; }
  &__title { margin: 0; font-size: var(--kima-font-size-headline-small); line-height: var(--kima-line-height-tight); }
  &__description { max-width: 72ch; margin: 0; color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-body-medium); line-height: var(--kima-line-height-normal); }
  &__actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--kima-space-2); &:empty { display: none; } }
  &--center {
    text-align: center;
    .kima-page-header__row { justify-content: center; }
    .kima-page-header__description { margin-inline: auto; }
  }
  @media (max-width: 640px) { &__row { align-items: stretch; } &__actions { width: 100%; } }
}
</style>
