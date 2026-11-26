<!--
图标：包一层 Hugeicons，线宽按尺寸等比缩放。
Hugeicons 按 24×24 画布设计；不传 absolute-stroke-width 时，strokeWidth
是画布坐标系里的值——图标放大到多少 px，线条就跟着等比放大多少。
24px 图标视觉线宽 1.75px，48px 图标自然长到 3.5px，比例永远协调。
全库粗细只由下面 iconStrokeWidth 一个值决定（画布坐标系），不要在别的组件里单独传 strokeWidth。
调用示例：
  <kima-icon :icon="Search01Icon" :size="20" />
  <kima-icon :icon="StarIcon" :size="32" class="my-icon" />
-->
<script setup>
import { HugeiconsIcon } from "@hugeicons/vue";

// 全库图标线宽的唯一来源（24 画布坐标系）。想整体调粗细只改这一个数。
// 为什么不放 CSS token：线宽要传给 Hugeicons 组件当属性用，JS 读不到 CSS 变量，
// 放两处就会出现"改了 token 图标没变"的情况。
const iconStrokeWidth = 1.75;

const props = defineProps({
  icon: {
    type: [Object, Array],
    required: true,
  },
  // 图标边长。默认取控件图标的标准档 24。
  size: {
    type: [Number, String],
    default: 24,
  },
  color: {
    type: String,
    default: "currentColor",
  },
  // 个别地方确实需要更粗或更细时传它，正常情况不要传。
  strokeWidth: {
    type: Number,
    default: iconStrokeWidth,
  },
});
</script>

<template>
  <HugeiconsIcon
    class="kima-icon"
    :icon="props.icon"
    :size="props.size"
    :color="props.color"
    :stroke-width="props.strokeWidth"
  />
</template>

<style scoped lang="scss">
/* 图标永远不参与伸缩：放进 flex 容器时不会被压扁，跟文字混排时也对齐中线。 */
.kima-icon {
  display: inline-block;
  flex: none;
  vertical-align: middle;
}
</style>
