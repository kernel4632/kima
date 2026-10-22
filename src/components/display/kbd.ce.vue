<!-- 键盘快捷键：keys 数组或默认插槽，不伪装成可点击控件。调用示例：<kima-kbd :keys="['Ctrl', 'K']" label="打开搜索" /> -->
<script setup>
import { ref, useAttrs } from "vue";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  keys: { type: Array, default: () => [] },
  label: { type: String, default: undefined },
});
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement } = useNativeSlots(root);
</script>
<template>
  <kbd ref="root" v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }" class="kima-kbd" :aria-label="label"><slot><template v-for="(key, index) in keys" :key="index"><span v-if="index" class="kima-kbd__separator" aria-hidden="true">+</span><kbd class="kima-kbd__key">{{ key }}</kbd></template></slot></kbd>
</template>
<style scoped lang="scss">
@use "../../styles/display" as *;
@use "../../styles/mixins" as *;
.kima-kbd {
  @include display-base;
  display: inline-flex; flex-wrap: wrap; align-items: center; gap: var(--kima-space-2); vertical-align: middle;
  &__key { @include kima-layer(2); padding: var(--kima-space-2) var(--kima-space-3); border-radius: var(--kima-radius-s); font: inherit; min-width: 32px; text-align: center; }
  &__separator { color: var(--kima-color-on-surface-variant); }
}
</style>
