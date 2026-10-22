<!--
布局容器：用统一的页面或面板宽度、间距和内边距组织设置类内容。
调用示例：
  <kima-layout variant="page" as="main">
    <template #header><h1>设置</h1></template>
    <section>页面内容</section>
  </kima-layout>
  <kima-layout variant="panel" :max-width="640">表单内容</kima-layout>
-->
<script setup>
import { computed, ref, useAttrs } from "vue";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  as: {
    type: String,
    default: "main",
  },
  variant: {
    type: String,
    default: "page",
  },
  maxWidth: {
    type: [String, Number],
    default: 920,
  },
  gap: {
    type: [String, Number],
    default: 24,
  },
  padding: {
    type: [String, Number],
    default: undefined,
  },
});

const attrs = useAttrs();
const root = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);

const semanticElement = computed(() => {
  const elements = ["main", "section", "div"];
  return elements.includes(props.as) ? props.as : "main";
});
const layoutVariant = computed(() =>
  ["page", "panel"].includes(props.variant) ? props.variant : "page",
);
const dimension = (value) => {
  if (typeof value === "number") return `${value}px`;
  if (typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value.trim())) return `${value}px`;
  return value;
};
const layoutStyle = computed(() => ({
  "--kima-layout-max-width": dimension(props.maxWidth),
  "--kima-layout-gap": dimension(props.gap),
  "--kima-layout-padding": props.padding === undefined ? undefined : dimension(props.padding),
}));
</script>

<template>
  <component
    :is="semanticElement"
    ref="root"
    v-bind="forwardedAttrs"
    class="kima-layout"
    :class="`kima-layout--${layoutVariant}`"
    :style="layoutStyle"
  >
    <header v-if="$slots.header || hasNativeSlot('header')" class="kima-layout__header"><slot name="header" /></header>
    <div v-if="$slots.default || hasNativeSlot('default')" class="kima-layout__content"><slot /></div>
    <footer v-if="$slots.footer || hasNativeSlot('footer')" class="kima-layout__footer"><slot name="footer" /></footer>
  </component>
</template>

<style scoped lang="scss">
.kima-layout {
  box-sizing: border-box;
  width: 100%;
  max-width: var(--kima-layout-max-width);
  margin: 0 auto;
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
}

.kima-layout__header,
.kima-layout__content,
.kima-layout__footer {
  display: flex;
  flex-direction: column;
  gap: var(--kima-layout-gap);
}

.kima-layout__content {
  min-width: 0;
}

.kima-layout__header + .kima-layout__content,
.kima-layout__content + .kima-layout__footer {
  margin-top: var(--kima-layout-gap);
}

.kima-layout--page {
  padding: var(--kima-layout-padding, 40px);
}

.kima-layout--panel {
  padding: var(--kima-layout-padding, 24px);
  border: 0;
  border-radius: var(--kima-radius-l);
  background: var(--kima-color-layer-2);
}

@media (max-width: 720px) {
  .kima-layout--page {
    padding: var(--kima-space-6);
  }
}

@media (max-width: 480px) {
  .kima-layout--page,
  .kima-layout--panel {
    padding: var(--kima-space-4);
  }
}
</style>
