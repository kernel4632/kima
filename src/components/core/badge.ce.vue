<!--
徽章：显示短状态、数量或仅用于标记存在的圆点，并保留 status 语义。
外观基准：默认 primary 底、药丸形、高度 20、字号 12、字重中等。
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
  // 官方 Badge CVA 变体（chunk 0krw1oe1f4-2d.js）：muted(默认)/secondary/highlight/warning/
  // success/accent/destructive/outline。KIMA 映射：muted→neutral、destructive→danger，
  // 其余同名；官方默认 muted——KIMA 同步默认 neutral。
  const variants = ["neutral", "primary", "secondary", "warning", "success", "accent", "danger", "outline"];
  return variants.includes(props.variant) ? props.variant : "neutral";
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
  /* 几何基准：文字高度 20（16 + 4），左右内边距 8，
     字号 label-small，字重 medium，圆角取一半高度成药丸。 */
  min-width: 20px;
  min-height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--kima-space-1);
  padding: 0 var(--kima-space-2);
  border: 0;
  border-radius: var(--kima-radius-full);
  box-sizing: border-box;
  font-family: var(--kima-font-family);
  font-size: var(--kima-font-size-label-small);
  font-weight: var(--kima-font-weight-semi-bold);
  line-height: 1;
  white-space: nowrap;
  /* 官方 Badge CVA（chunk 0krw1oe1f4-2d.js）变体一比一：
   * muted → 次级填充底 + fg-secondary 字；secondary → 同底 + fg-primary 字；
   * success/accent → 语义色 15% 洗底 + 同色字（官方 bg-fg-success/15 模式，
   *   与 error-secondary 梯子同哲学）；warning → 实色橙底；
   * destructive → button-danger-fill 实底；outline → 透明 + border-l3。
   * KIMA 默认档与官方默认 muted 对齐 = neutral。 */
  color: var(--kima-color-on-surface-variant);
  background: var(--kima-color-wash-secondary);

  /* primary：KIMA 的米白实底场景（角标常用），官方语义位 = secondary 的实色档。 */
  &--primary {
    color: var(--kima-color-on-primary);
    background: var(--kima-color-primary);
  }

  /* 官方 secondary：次级填充底 + base 字。 */
  &--secondary {
    color: var(--kima-color-on-surface);
    background: var(--kima-color-wash-secondary);
  }

  /* 官方 success：语义色 15% 洗底 + 语义字。官方徽章字色走 fg-success（双主题），
   * 不用 --grok-success 单值——token：--kima-color-fg-success。 */
  &--success {
    color: var(--kima-color-fg-success);
    background: color-mix(in srgb, var(--kima-color-fg-success) 15%, transparent);
  }

  /* 官方 accent：accent 15% 洗底 + accent 字。官方 fg-accent 双主题
   * （浅 #0890ff / 深 #299fff）——token：--kima-color-fg-accent。 */
  &--accent {
    color: var(--kima-color-fg-accent);
    background: color-mix(in srgb, var(--kima-color-fg-accent) 15%, transparent);
  }

  /* 官方 warning：bg-warning 实色 + 专属字色。 */
  &--warning {
    color: var(--kima-color-on-warning);
    background: var(--kima-color-warning);
  }

  /* 官方 destructive：button-danger-fill 实底 + danger 字色。 */
  &--danger {
    color: var(--kima-color-on-error);
    background: var(--kima-color-error);
  }

  /* 官方 outline：透明底 + border-l3 描边 + base 字。 */
  &--outline {
    color: var(--kima-color-on-surface);
    background: transparent;
    border: var(--kima-outline-width) solid var(--kima-color-outline-tertiary);
  }

  /* 无文字徽章高度 4 + 2 = 6，本身就是一个小圆点。
   * 圆点是"状态灯"：官方圆点类 "size-2 rounded-full bg-fg-primary" 是实色模式——
   * 15% 洗底的灯在深浅底上都近乎隐形，语义态（success/danger/accent）必须实色 fg-*。
   * 非语义档（neutral/secondary/primary）dot 用自身变体底色实色。 */
  &--dot {
    min-width: 6px;
    width: 6px;
    min-height: 6px;
    height: 6px;
    padding: 0;

    &.kima-badge--success { background: var(--kima-color-fg-success); }
    &.kima-badge--danger { background: var(--kima-color-error); }
    &.kima-badge--accent { background: var(--kima-color-fg-accent); }
    &.kima-badge--warning { background: var(--kima-color-warning); }
  }

  &__slot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
