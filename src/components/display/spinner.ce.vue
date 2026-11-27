<!--
加载指示器（环形 indeterminate）：M3E Progress Indicator 的 circular flat 不定态
全源码照抄（github.com/matraic/m3e
packages/web/src/progress-indicator/CircularProgressIndicatorElement.ts 389-423 行 render
+ 77-254 行样式）。Spinner 就是官方圆环进度条的不定态形态——用户明令。

官方结构（#renderFlatIndicator indeterminate 分支逐行）：
  .progress > .spinner > .left/.right（clip-path 各半）> svg.circle > path.active-track
  左弧 startAngle=-45, endAngle=90+strokeWidth；右弧 startAngle=-strokeWidth, endAngle=135
三层旋转（CSS，官方 137-175 逐行）：
  .progress   linear-rotate 1333ms×360/306（=1568.6ms/圈，229.5°/s）
  .spinner    rotate-arc 5332ms cubic-bezier(0.4, 0, 0.2, 1)（每半周期递增 135°）
  .circle     expand-arc 1333ms 265°↔130°；左右基座 rotate 135deg/100deg，右半 delay -666.5ms

KIMA API 适配（对官方机制的包装，不改行为）：
  size small/medium/large → 官方 --m3e-circular-flat-progress-indicator-diameter 三档
    （medium=官方默认 40px；small 20 / large 48 与旧版视觉尺寸衔接，stroke 官方 4px）
  label/decorative 照旧：非 decorative 挂 role=status + aria-label，decorative 整体 aria-hidden
  几何与 progress.ce.vue 共用 utils/progress-geometry.js（官方 CircularProgressGeometry.ts 逐行）

实测记录（官网 matraic.github.io/m3e，Edge，2026-11-27/28）：
  官方 flat indeterminate：progress 1.5686s/圈 linear；spinner 5.332s ease(0.4,0,0.2,1)；
  左半 rotate 135deg 基座 + expand-arc 265↔130°；右半 rotate 100deg delay -0.6665s；
  KIMA 复刻后实测（progress.ce.vue circular 对表同源几何）：progress 层 229.7°/s 对官方 229.5

调用示例：
  <kima-spinner label="正在同步" />
  <kima-spinner size="small" label="加载中" />
  <kima-spinner decorative />
-->
<script setup>
import { onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";
import { useNativeSlots } from "../../utils/native-slots.js";
import { circularProgressArc } from "../../utils/progress-geometry.js";

defineOptions({ inheritAttrs: false });
const props = defineProps({
  label: { type: String, default: "加载中" },
  size: { type: String, default: "medium" },
  decorative: Boolean,
});
const attrs = useAttrs();
const root = ref(null);
const { isCustomElement } = useNativeSlots(root);

/* 官方隐藏量测探针同构：diameter/stroke 只能通过 DOM 布局读 token 像素。
 * 直径三档写在 scoped 样式，这里读回。 */
const probe = ref(null);
const measured = ref({ diameter: 0, strokeWidth: 0 });
let observer = null;

function readProbes() {
  const el = probe.value;
  if (!el) return;
  measured.value = { diameter: el.clientWidth, strokeWidth: el.clientHeight };
}

onMounted(() => {
  readProbes();
  /* 尺寸档/theme token 变化时重量（官方 ResizeController 等价）。 */
  observer = new ResizeObserver(() => readProbes());
  observer.observe(probe.value);
  observer.observe(root.value);
});

onBeforeUnmount(() => observer?.disconnect());

/* 官方 #drawArc 两段（#renderFlatIndicator indeterminate 逐行）。 */
const left = ref({ path: "", viewBox: "0 0 0 0" });
const right = ref({ path: "", viewBox: "0 0 0 0" });

watch(
  measured,
  (m) => {
    left.value = circularProgressArc(m.diameter, m.strokeWidth, "flat", {
      startAngle: -45,
      endAngle: 90 + m.strokeWidth,
    });
    right.value = circularProgressArc(m.diameter, m.strokeWidth, "flat", {
      startAngle: -m.strokeWidth,
      endAngle: 135,
    });
  },
  { deep: true },
);
</script>

<template>
  <span
    ref="root"
    v-bind="{ ...attrs, id: isCustomElement ? undefined : attrs.id }"
    class="kima-spinner"
    :class="`kima-spinner--${size}`"
    :role="decorative ? undefined : 'status'"
    :aria-label="decorative ? undefined : label"
    :aria-hidden="decorative || undefined"
  >
    <span class="kima-spinner__progress" aria-hidden="true">
      <span class="kima-spinner__spinner">
        <span class="kima-spinner__left">
          <svg
            class="kima-spinner__circle"
            :width="measured.diameter"
            :height="measured.diameter"
            :viewBox="left.viewBox"
          >
            <path
              class="kima-spinner__active-track"
              :d="left.path"
              stroke="currentColor"
              :stroke-width="measured.strokeWidth"
              fill="none"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <span class="kima-spinner__right">
          <svg
            class="kima-spinner__circle"
            :width="measured.diameter"
            :height="measured.diameter"
            :viewBox="right.viewBox"
          >
            <path
              class="kima-spinner__active-track"
              :d="right.path"
              stroke="currentColor"
              :stroke-width="measured.strokeWidth"
              fill="none"
              stroke-linecap="round"
            />
          </svg>
        </span>
      </span>
    </span>
    <!-- 官方量测探针：直径/厚度 token 的 DOM 读点。 -->
    <span ref="probe" class="kima-spinner__diameter-and-stroke" aria-hidden="true"></span>
  </span>
</template>

<style scoped lang="scss">
/* ============ M3E CircularProgressIndicatorElement.ts 逐行照抄（flat indeterminate）============
 * :host → .kima-spinner；.progress/.spinner/.left/.right/.circle → kima-spinner__*；
 * 官方 --m3e-circular-flat-progress-indicator-diameter → 尺寸档 token（_tokens.scss spinner 块）；
 * 加载色走 --kima-color-accent（KIMA 官方加载点 accent 蓝约定，旧版已定）。 */

.kima-spinner {
  display: inline-flex;
  vertical-align: middle;
  aspect-ratio: 1;
  position: relative;
  align-items: center;
  justify-content: center;
  color: var(--kima-color-accent);
}
/* 直径三档（官方 flat 40px 默认；131-136 的 :host width 规则）。 */
.kima-spinner--small {
  width: var(--kima-spinner-small-diameter, 20px);
}
.kima-spinner--medium {
  width: var(--kima-spinner-medium-diameter, 40px);
}
.kima-spinner--large {
  width: var(--kima-spinner-large-diameter, 48px);
}

/* 官方 .progress 变量三件套（89-93）+ flat 的 flex 拉伸（97-101）。 */
.kima-spinner__progress {
  --_arc-duration: 1333ms;
  --_cycle-duration: calc(4 * var(--_arc-duration));
  --_linear-rotate-duration: calc(var(--_arc-duration) * 360 / 306);
  --_indeterminate-easing: cubic-bezier(0.4, 0, 0.2, 1);

  flex: 1;
  align-self: stretch;
  pointer-events: none;
  position: absolute;
  inset: 0;
}

/* 三层旋转（137-145）+ 半圆裁剪（152-159）。 */
.kima-spinner__progress {
  animation: linear infinite kima-spinner-linear-rotate;
  animation-duration: var(--_linear-rotate-duration);
}
.kima-spinner__spinner {
  position: absolute;
  inset: 0;
  animation: infinite both kima-spinner-rotate-arc;
  animation-duration: var(--_cycle-duration);
  animation-timing-function: var(--_indeterminate-easing);
}
.kima-spinner__left {
  position: absolute;
  inset: 0;
  clip-path: inset(0);
  inset: 0 50% 0 0;
}
.kima-spinner__right {
  position: absolute;
  inset: 0;
  clip-path: inset(0);
  inset: 0 0 0 50%;
}

/* .circle：expand-arc + 左右基座（160-175）。 */
.kima-spinner__circle {
  position: absolute;
  inset: 0;
  animation: kima-spinner-expand-arc;
  animation-iteration-count: infinite;
  animation-fill-mode: both;
  animation-duration: var(--_arc-duration), var(--_cycle-duration);
  animation-timing-function: var(--_indeterminate-easing);
}
.kima-spinner__left .kima-spinner__circle {
  rotate: 135deg;
  inset: 0 -100% 0 0;
}
.kima-spinner__right .kima-spinner__circle {
  rotate: 100deg;
  inset: 0 0 0 -100%;
  animation-delay: calc(-0.5 * var(--_arc-duration)), 0ms;
}

/* 量测探针（官方 118-126 的 .diameter-and-stroke）。 */
.kima-spinner__diameter-and-stroke {
  visibility: hidden;
  position: absolute;
  width: inherit;
  height: var(--kima-spinner-thickness, 4px);
}

/* 官方 keyframes（186-227）逐帧值照抄。 */
@keyframes kima-spinner-linear-rotate {
  to {
    transform: rotate(360deg);
  }
}
@keyframes kima-spinner-rotate-arc {
  12.5% {
    transform: rotate(135deg);
  }
  25% {
    transform: rotate(270deg);
  }
  37.5% {
    transform: rotate(405deg);
  }
  50% {
    transform: rotate(540deg);
  }
  62.5% {
    transform: rotate(675deg);
  }
  75% {
    transform: rotate(810deg);
  }
  87.5% {
    transform: rotate(945deg);
  }
  100% {
    transform: rotate(1080deg);
  }
}
@keyframes kima-spinner-expand-arc {
  0% {
    transform: rotate(265deg);
  }
  50% {
    transform: rotate(130deg);
  }
  100% {
    transform: rotate(265deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .kima-spinner__progress,
  .kima-spinner__spinner,
  .kima-spinner__circle {
    animation: none;
  }
}
</style>
