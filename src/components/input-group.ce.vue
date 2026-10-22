<!-- 输入复合组：prefix/suffix 是装饰槽，默认槽放真实文本控件；组本身不画第二层表面，也不制造可见标签。调用示例：<label>金额<kima-input-group><span slot="prefix">¥</span><kima-number-field label="金额" name="amount" /><span slot="suffix">元</span></kima-input-group></label> -->
<script setup>
import { useNavigationRoot } from '../utils/navigation.js';
defineOptions({ inheritAttrs: false });
const props = defineProps({ label: { type: String, default: '输入组' } });
const { root, forwardedAttrs, hasNativeSlot, isCustomElement } = useNavigationRoot();
</script>
<template>
  <div ref="root" v-bind="forwardedAttrs" class="kima-input-group" role="group" :aria-label="label">
    <div v-if="$slots.prefix || hasNativeSlot('prefix') || isCustomElement" class="kima-input-group__decoration kima-input-group__decoration--prefix"><slot name="prefix" /></div>
    <div class="kima-input-group__control"><slot /></div>
    <div v-if="$slots.suffix || hasNativeSlot('suffix') || isCustomElement" class="kima-input-group__decoration kima-input-group__decoration--suffix"><slot name="suffix" /></div>
  </div>
</template>
<style scoped lang="scss">
@use '../styles/foundation' as *;
.kima-input-group {
  @include foundation-base;
  display: flex;
  align-items: center;
  gap: var(--kima-space-2);
  width: 100%;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
  &__control { display: flex; flex: 1 1 auto; min-width: 0; > :deep(*) { flex: 1 1 auto; min-width: 0; } }
  &__decoration { display: inline-flex; flex: 0 0 auto; align-items: center; color: var(--kima-color-on-surface-variant); font-size: var(--kima-font-size-body-medium); &:empty { display: none; } }
}
</style>
