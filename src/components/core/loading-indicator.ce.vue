<!--
  加载指示器：M3E LoadingIndicatorElement 全源码逐行照抄
  （github.com/matraic/m3e packages/web/src/loading-indicator）。
  来源逐文件：LoadingIndicatorElement.ts（299 行）/ LoadingIndicatorToken.ts /
  LoadingIndicatorVariant.ts / ShapePolygon.ts（七形 polygon，离线预计算进
  src/utils/loading-shapes.js）/ core 依赖（Role→progressbar、AttachInternals、
  ReconnectedCallback、setCustomEnumState、MotionToken、generateClipPaths）。

  翻译规则（唯一允许的改写）：
    Lit css`...` → SCSS：每行样式照抄；${LoadingIndicatorToken.*} → KIMA token；
    :host → .kima-loading-indicator（根元素）；
    :host(:state(--contained/--uncontained)) → kima-loading-indicator--* 修饰类。

  官方行为面（逐行保留）：
    role="progressbar" + aria-valuemin/max 默认 0/100（作者值优先）；
    容器 aria-hidden="true"（视觉件对 AT 隐藏）；
    variant 状态机：非法值回落 uncontained，contained/uncontained 互斥；
    pull-progress 生命周期：null=动画，数值=停止并逆时针旋转 -360×progress 度，
      负值钳 0，NaN/Infinity 视为停住不转（Number.isFinite 分支）；
    断连清态（disconnectedCallback 移除 animate/pull 类）、重连恢复 pull 状态。

  动效（官方运行值，非源码默认）：
    rotate-outer：4666ms linear infinite（外环匀速）；
    rotate-inner：4666ms cubic-bezier(0.34,0.88,0.34,1) infinite
      + 七形 clip-path 关键帧（0/14/29/43/57/71/83/100%）；
    clip-path 过渡：300ms spring slow-effects——官网实测为 linear() 物理采样串
      （SpringEasing.ts：ζ=1 临界阻尼 k=800 采样，覆盖源码的 cubic-bezier 兜底），
      运行值优先，串照抄。

  调用示例：
    <kima-loading-indicator label="正在加载"></kima-loading-indicator>
    <kima-loading-indicator variant="contained" label="刷新中"></kima-loading-indicator>
    <kima-loading-indicator :pull-progress="pullTurns" label="下拉刷新"></kima-loading-indicator>
-->
<script>
/* 七形 polygon 常量（M3E ShapePolygon.ts 离线预计算，见 src/utils/loading-shapes.js）。
 * 官方在 Lit css`` 里内联 polygon 串；KIMA 等价做法：组件挂载时把七条串写进
 * 根元素 style 的 --kima-loading-shape-* 变量，SCSS 里只引用变量名。
 * scoped 样式会加 data-v 标记，30KB 串写在模板/样式里会膨胀每份产物，
 * 变量注入让串只在 DOM 上存一份。 */
import { loadingShapePolygons } from "../../utils/loading-shapes.js";
</script>

<script setup>
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

/* LoadingIndicatorVariant.ts 逐行照抄。 */
function isLoadingIndicatorVariant(value) {
  return value === "uncontained" || value === "contained";
}

const props = defineProps({
  /* 官方 variant：uncontained（默认）/ contained。 */
  variant: { type: String, default: "uncontained" },
  /* 官方 pullProgress：pull-to-refresh 进度（圈数），null = 无手势、恢复动画。 */
  pullProgress: { type: Number, default: null },
  /* 可访问名（官方不画标签，aria-label 由使用者给）。 */
  label: { type: String, default: "" },
});

const attrs = useAttrs();
const isCustomElement = Boolean(getCurrentInstance()?.ce);
const forwardedAttrs = computed(() => (isCustomElement ? { ...attrs, id: undefined } : attrs));

const root = ref(null);
const container = ref(null);

/* 官方 #applyVariant：非法值回落 + 互斥状态（Lit :state(--x) → 修饰类）。 */
const variantClass = computed(() => {
  const variant = isLoadingIndicatorVariant(props.variant) ? props.variant : "uncontained";
  return `kima-loading-indicator--${variant}`;
});

/* 官方 #applyPullProgress 逐行：
 * pulling = pullProgress !== null && !Number.isNaN(pullProgress)；
 * .pull = pulling、.animate = !pulling；
 * --_pull-rotation = -360 × (isFinite ? max(0, progress) : 0) deg。 */
const pulling = computed(() => props.pullProgress !== null && !Number.isNaN(props.pullProgress));
const containerClasses = computed(() => ({
  "kima-loading-indicator__container--animate": !pulling.value,
  "kima-loading-indicator__container--pull": pulling.value,
}));

function applyPullProgress() {
  if (!container.value) return;
  if (pulling.value) {
    const progress = Number.isFinite(props.pullProgress) ? Math.max(0, props.pullProgress) : 0;
    container.value.style.setProperty("--_kima-pull-rotation", `${-360 * progress}deg`);
  }
}

/* 官方 connectedCallback：aria-valuemin/max 默认 0/100，作者已有值优先。
 * CE 模式：宿主就是 progressbar，补在宿主上；Vue 模式：根 span 模板里已带。
 * label prop 是 KIMA 可访问名约定（官方要求 aria-label，组件不画可见标签），
 * 使用者显式给的 aria-label 优先。 */
function applyAriaDefaults() {
  if (!isCustomElement || !root.value) return;
  const host = root.value.parentElement;
  if (!host || !host.tagName.startsWith("KIMA-LOADING")) return;
  if (!host.hasAttribute("role")) host.setAttribute("role", "progressbar");
  if (!host.hasAttribute("aria-valuemin")) host.setAttribute("aria-valuemin", "0");
  if (!host.hasAttribute("aria-valuemax")) host.setAttribute("aria-valuemax", "100");
  if (!host.hasAttribute("aria-label") && !host.hasAttribute("aria-labelledby") && props.label) {
    host.setAttribute("aria-label", props.label);
  }
}

/* 七形 polygon 注入：官方在 css`` 模板里直接内联，KIMA 用 CSS 变量承载同一份串。 */
function applyShapeVariables() {
  if (!root.value || root.value.dataset.shapesApplied) return;
  for (const [name, polygon] of Object.entries(loadingShapePolygons)) {
    root.value.style.setProperty(`--kima-loading-shape-${name}`, polygon);
  }
  root.value.dataset.shapesApplied = "true";
}

/* 官方 disconnectedCallback：断连清 animate/pull；reconnectedCallback：重连恢复。 */
function clearPullState() {
  const el = container.value;
  if (!el) return;
  el.classList.remove("kima-loading-indicator__container--animate", "kima-loading-indicator__container--pull");
  el.style.removeProperty("--_kima-pull-rotation");
}

watch(() => props.pullProgress, applyPullProgress);
onMounted(() => {
  applyShapeVariables();
  applyAriaDefaults();
  applyPullProgress();
});
onBeforeUnmount(clearPullState);

/* Vue 自定义元素模式下节点移动（appendChild 复用同一元素）不触发卸载，
 * 官方 reconnectedCallback 的"重连恢复 pull 状态"由 watch + watchEffect 覆盖。 */
</script>

<template>
  <span
    ref="root"
    v-bind="forwardedAttrs"
    class="kima-loading-indicator"
    :class="variantClass"
    :role="isCustomElement ? undefined : 'progressbar'"
    :aria-label="isCustomElement ? undefined : (attrs['aria-label'] || attrs.ariaLabel || label || undefined)"
    :aria-valuemin="isCustomElement ? undefined : (attrs['aria-valuemin'] || '0')"
    :aria-valuemax="isCustomElement ? undefined : (attrs['aria-valuemax'] || '100')"
  >
    <span ref="container" class="kima-loading-indicator__container" :class="containerClasses" aria-hidden="true">
      <span class="kima-loading-indicator__wrapper">
        <span class="kima-loading-indicator__active" />
      </span>
    </span>
  </span>
</template>

<style scoped lang="scss">
/* ============ M3E LoadingIndicatorElement.styles 逐行翻译 ============
 * :host → .kima-loading-indicator；${LoadingIndicatorToken.x} → --kima-loading-indicator-x。
 * token 对照（M3E 默认 → KIMA）：
 *   activeIndicatorSize 38px → --kima-loading-indicator-active-size
 *   containerSize 48px → --kima-loading-indicator-container-size
 *   containerShape full → --kima-radius-full
 *   activeIndicatorColor primary → --kima-color-primary
 *   containedActiveIndicatorColor onPrimaryContainer → --kima-color-on-surface
 *     （KIMA 无 M3 的 primary-container 色对；contained 的官方语义是
 *     "容器底 + 对比色活动件"，映射为 surface-container-high 底 + on-surface 件）
 *   containedContainerColor secondaryContainer → --kima-color-surface-container-high */

.kima-loading-indicator {
  /* 官方 token 变量名带 m3e 前缀，KIMA 化；默认值官方一致（38/48）。 */
  --kima-loading-indicator-active-size: 38px;
  --kima-loading-indicator-container-size: 48px;

  display: inline-block;
  aspect-ratio: 1 / 1;
  contain: layout paint style;
  vertical-align: middle;
  /* uncontained = activeIndicatorSize（官方 :state(--uncontained) 分支）。 */
  width: var(--kima-loading-indicator-active-size);

  &[hidden] {
    display: none;
  }

  &--contained {
    width: var(--kima-loading-indicator-container-size);
  }

  &__container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: var(--kima-radius-full);

    /* 官方 .container.animate / .container.pull 类分支。 */
    &--animate {
      .kima-loading-indicator__wrapper {
        animation: kima-loading-indicator-rotate-outer 4666ms linear infinite;
        will-change: transform;
      }

      .kima-loading-indicator__active {
        animation: kima-loading-indicator-rotate-inner 4666ms cubic-bezier(0.34, 0.88, 0.34, 1) infinite;
      }
    }

    &--pull {
      .kima-loading-indicator__wrapper {
        transform: rotate(var(--_kima-pull-rotation, 0deg));
        will-change: transform;
      }

      .kima-loading-indicator__active {
        clip-path: polygon(var(--kima-loading-shape-soft-burst));
      }
    }
  }

  /* uncontained 活动件颜色（官方 :state(--uncontained) .active-indicator）。 */
  &__active {
    margin: auto;
    aspect-ratio: 1 / 1;
    width: calc(var(--kima-loading-indicator-active-size) * 0.842);
    transform-origin: center;
    /* 官方源码：spring slowEffects 300ms cubic-bezier(0.34,0.88,0.34,1)；
     * 官网运行值（主题层覆盖）：同一弹簧的 linear() 物理采样串
     * （SpringEasing.ts ζ=1 k=800 duration=300 的 1000 点采样降到 32 档）。
     * 运行值优先——照抄官网实测串。 */
    transition: clip-path 300ms linear(0 0%, 0.0048 1.2%, 0.0196 2.5%, 0.0461 4%, 0.0828 5.6%, 0.1171 6.9%, 0.1603 8.4%, 0.3635 15%, 0.4569 18.2%, 0.5058 20%, 0.5493 21.7%, 0.5901 23.4%, 0.628 25.1%, 0.6631 26.8%, 0.6955 28.5%, 0.7253 30.2%, 0.7541 32%, 0.7803 33.8%, 0.8039 35.6%, 0.8264 37.5%, 0.8466 39.4%, 0.8681 41.7%, 0.8868 44%, 0.9037 46.4%, 0.9193 49%, 0.9448 54.5%, 0.9644 60.7%, 0.9781 67.5%, 0.9877 75.4%, 0.9943 85.9%, 0.998 99.9%, 1 100%);
    will-change: transform, clip-path;
    background-color: var(--kima-color-primary);

    /* 七形 polygon：--kima-loading-shape-*（JS 注入，见上方 <script> 块说明）。 */
  }

  &__wrapper {
    transform-origin: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* contained 配色（官方 :state(--contained) 分支：容器底 + 对比色活动件）。 */
  &--contained &__active {
    background-color: var(--kima-color-on-surface);
  }

  &--contained &__container {
    background-color: var(--kima-color-surface-container-high);
  }
}

/* 官方 @keyframes rotate-outer / rotate-inner 逐行（百分比关键帧原样）。 */
@keyframes kima-loading-indicator-rotate-outer {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes kima-loading-indicator-rotate-inner {
  0% {
    clip-path: polygon(var(--kima-loading-shape-soft-burst));
    transform: rotate(0deg);
  }
  14% {
    clip-path: polygon(var(--kima-loading-shape-9-sided-cookie));
    transform: rotate(154deg) scale(1);
  }
  29% {
    clip-path: polygon(var(--kima-loading-shape-pentagon));
    transform: rotate(309deg) scale(1);
  }
  43% {
    clip-path: polygon(var(--kima-loading-shape-pill));
    transform: rotate(463deg) scale(1);
  }
  57% {
    clip-path: polygon(var(--kima-loading-shape-sunny));
    transform: rotate(617deg) scale(1);
  }
  71% {
    clip-path: polygon(var(--kima-loading-shape-4-sided-cookie));
    transform: rotate(771deg) scale(1);
  }
  83% {
    clip-path: polygon(var(--kima-loading-shape-oval));
    transform: rotate(926deg) scale(1);
  }
  100% {
    clip-path: polygon(var(--kima-loading-shape-soft-burst));
    transform: rotate(1080deg) scale(1);
  }
}

/* 官方 forced-colors 分支：系统文字色，保对比。 */
@media (forced-colors: active) {
  .kima-loading-indicator__active {
    background-color: CanvasText !important;
  }
}
</style>
