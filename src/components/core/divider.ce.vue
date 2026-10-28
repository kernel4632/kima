<!--
分割线：用水平或垂直的语义分隔线组织内容，也可以在中间显示文字或插槽内容。
调用示例：
  <kima-divider />
  <kima-divider inset label="或者" />
  <kima-divider vertical><span aria-hidden="true">+</span></kima-divider>
-->
<script setup>
import { Comment, computed, ref, useAttrs, useSlots } from "vue";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  vertical: Boolean,
  inset: Boolean,
  label: {
    type: String,
    default: "",
  },
});

const slots = useSlots();
const attrs = useAttrs();
const root = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const hasSlotContent = computed(() => slots.default?.().some((vnode) => {
  if (vnode.type === Comment) return false;
  return typeof vnode.children !== "string" || vnode.children.trim().length > 0;
}) || hasNativeSlot("default"));
const hasContent = computed(() => Boolean(props.label.trim()) || hasSlotContent.value);
</script>

<template>
  <div
    ref="root"
    v-bind="forwardedAttrs"
    class="kima-divider"
    :class="{
      'kima-divider--vertical': vertical,
      'kima-divider--inset': inset,
      'kima-divider--labeled': hasContent,
    }"
    role="separator"
    :aria-orientation="vertical ? 'vertical' : undefined"
  >
    <span class="kima-divider__line" aria-hidden="true" />
    <span v-if="hasContent" class="kima-divider__label">
      <slot v-if="hasSlotContent" />
      <template v-else>{{ label }}</template>
    </span>
    <span v-if="hasContent" class="kima-divider__line" aria-hidden="true" />
  </div>
</template>

<style scoped lang="scss">
.kima-divider {
  display: flex;
  width: 100%;
  min-height: var(--kima-divider-thickness);
  align-items: center;
  gap: var(--kima-space-3);
  color: var(--kima-color-on-surface-variant);
  font-family: var(--kima-font-family);
}

.kima-divider--inset:not(.kima-divider--vertical) {
  width: auto;
  margin-inline: var(--kima-space-6);
}

.kima-divider__line {
  display: block;
  min-width: 0;
  flex: 1 1 auto;
  height: var(--kima-divider-thickness);
  background: var(--kima-color-outline-variant);
}

.kima-divider__label {
  flex: 0 0 auto;
  font-size: var(--kima-font-size-sm);
  line-height: 1.4;
  text-align: center;
}

.kima-divider--vertical {
  width: var(--kima-divider-thickness);
  min-height: 48px;
  height: 100%;
  flex-direction: column;
  gap: var(--kima-space-2);
}

.kima-divider--vertical.kima-divider--inset {
  height: auto;
  margin-block: var(--kima-space-6);
}

.kima-divider--vertical .kima-divider__line {
  width: var(--kima-divider-thickness);
  min-height: 0;
  height: auto;
  flex: 1 1 auto;
}

.kima-divider--vertical .kima-divider__label {
  writing-mode: vertical-rl;
}
</style>
