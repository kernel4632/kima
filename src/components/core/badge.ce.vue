<!--
徽章：显示短状态、数量或仅用于标记存在的圆点，并保留 status 语义。
外观照 DMS 的 DankBadge 对齐：默认 primary 底、药丸形、高度 20、字号 12、字重中等。
调用示例：
  <kima-badge value="8" />
  <kima-badge :value="128" :max="99" variant="danger" aria-label="128 条未读消息" />
  <kima-badge dot variant="success" aria-label="在线" />
  <kima-badge variant="primary"><template #leading><MyIcon /></template>同步中</kima-badge>
-->
<script setup>
import { Comment, computed, ref, useAttrs, useSlots } from "vue";
import { useNativeSlots } from "../../utils/native-slots.js";

defineOptions({ inheritAttrs: false });

const props = defineProps({
  value: {
    type: [String, Number],
    default: null,
  },
  variant: {
    type: String,
    default: "primary",
  },
  dot: Boolean,
  max: {
    type: Number,
    default: 99,
  },
});

const attrs = useAttrs();
const slots = useSlots();
const root = ref(null);
const { hasNativeSlot, isCustomElement } = useNativeSlots(root);
const forwardedAttrs = computed(() => isCustomElement ? { ...attrs, id: undefined } : attrs);
const hasDefaultContent = computed(() => slots.default?.().some((vnode) => {
  if (vnode.type === Comment) return false;
  return typeof vnode.children !== "string" || vnode.children.trim().length > 0;
}) || hasNativeSlot("default"));

const badgeVariant = computed(() => {
  const variants = ["neutral", "primary", "danger", "success"];
  return variants.includes(props.variant) ? props.variant : "primary";
});

const displayValue = computed(() => {
  if (props.dot || props.value === null || props.value === undefined || String(props.value).trim() === "") return "";
  const numericValue = Number(props.value);
  if (Number.isFinite(numericValue) && numericValue > props.max) {
    return `${props.max}+`;
  }
  return String(props.value);
});

const accessibleLabel = computed(() => attrs["aria-label"] || displayValue.value || undefined);
</script>

<template>
  <span
    ref="root"
    v-bind="forwardedAttrs"
    class="kima-badge"
    :class="[
      `kima-badge--${badgeVariant}`,
      { 'kima-badge--dot': dot },
    ]"
    role="status"
    :aria-label="accessibleLabel"
  >
    <span v-if="$slots.leading || hasNativeSlot('leading')" class="kima-badge__slot kima-badge__slot--leading" aria-hidden="true">
      <slot name="leading" />
    </span>
    <slot v-if="!dot && hasDefaultContent" />
    <Transition v-else-if="!dot" name="kima-fade" mode="out-in"><span :key="displayValue">{{ displayValue }}</span></Transition>
    <span v-if="$slots.trailing || hasNativeSlot('trailing')" class="kima-badge__slot kima-badge__slot--trailing" aria-hidden="true">
      <slot name="trailing" />
    </span>
  </span>
</template>

<style scoped lang="scss">
@use "../../styles/mixins" as *;
.kima-badge {
  @include kima-motion-colors;
  /* DMS DankBadge：文字高度 20（spacingL 16 + spacingXS 4），左右内边距 spacingS 8，
     字号 Small 12，字重 Medium，圆角取一半高度成药丸。 */
  min-width: 20px;
  min-height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--kima-space-xs);
  padding: 0 var(--kima-space-s);
  border: 0;
  border-radius: var(--kima-radius-full);
  box-sizing: border-box;
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-small);
  font-weight: var(--kima-font-weight-medium);
  line-height: 1;
  white-space: nowrap;
  color: var(--kima-color-on-primary);
  background: var(--kima-color-primary);

  &--neutral {
    color: var(--kima-color-on-surface);
    background: var(--kima-color-layer-3);
  }

  &--danger {
    color: var(--kima-color-on-danger);
    background: var(--kima-color-danger);
  }

  &--success {
    color: var(--kima-color-on-success);
    background: var(--kima-color-success);
  }

  /* DMS 无文字徽章高度 spacingXS + spacingXXS = 6，本身就是一个小圆点。 */
  &--dot {
    min-width: 6px;
    width: 6px;
    min-height: 6px;
    height: 6px;
    padding: 0;
  }

  &__slot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
