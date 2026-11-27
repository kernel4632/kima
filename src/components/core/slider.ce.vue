<!--
滑块：M3E Slider 全源码照抄（github.com/matraic/m3e packages/web/src/slider）。
来源逐文件：SliderElement.ts（1286 行）/ SliderThumbElement.ts（312 行）/
SliderSize.ts / SliderOrientation.ts / core 依赖（Directionality、ResizeController、
FocusRingElement、Dirty/Touched/Disabled/Focusable/FormAssociated mixins）。

翻译规则（唯一允许的改写）：
  Lit css`...` → SCSS：每行样式照抄；${DesignToken.*} → KIMA token；
  :host → .kima-slider（根元素）；:state(--x) → kima-slider--x 修饰类；
  thumb 的 :host → .kima-slider-thumb（官方 thumb 是独立 Web Component，
  KIMA 内联为主组件内的响应式值载体，value/disabled/dirty/touched/aria 全保留）。

官方算法（逐行照抄，非近似）：
  #pointFromValue：pos = (size − thumbSize) × (v − min) / (max − min)
  #valueFromPoint：thumbRatio 折叠 + 步进取整（90ms 合并事件容忍关闭动画）
  #updateDimensions：单/双 thumb 两分支写 --_slider-* 像素变量（JS 量测，非 CSS 百分比）
  #updateTicks：discrete && step>1 全量刻度；否则 min +（跨零 0）+ max
  #updateTickOverlap：|pos(tick) − pos(thumb)| < thumbSize/2 隐藏
  #handlePointerDown：中点选择 activeThumb、指针捕获、步进吸附、--active 态
  键盘：Home/End/PageUp/PageDown/箭头（vertical 或 ltr 决定升序方向）

KIMA API 适配（对官方机制的包装，不改行为）：
  modelValue：Number|null → 单 thumb；[下限, 上限] → 双 thumb（官方 slot 双 thumb 的同构）
  show-value（旧名）与 labelled（官方名）等价：悬停/聚焦显示数值气泡
  label → thumb 的 aria-label（组件不画可见标签）；name → 隐藏 input 提交表单值
  v-model 的 update:modelValue 在 input/change 官方事件点发出；beforeinput 原生可取消

调用示例：
  <kima-slider v-model="volume" label="音量" show-value></kima-slider>
  <kima-slider :model-value="[20, 80]" label="区间" discrete :step="10" labelled></kima-slider>
  <kima-slider orientation="vertical" size="medium" :model-value="30" label="亮度"></kima-slider>
-->
<script>
/* M3eDirectionality（core/bidi/Directionality.ts 逐行照抄，MIT，改自 Angular CDK）：
 * 监听 body/html 的 dir 与 languagechange；slider 的 translate 符号、valueFromPoint
 * 的命中方向、键盘升序方向都读它。模块级副作用（对浏览器守卫，SSR 安全）。 */
const RTL_LOCALES =
  /^(ar|ckb|dv|he|iw|fa|nqo|ps|sd|ug|ur|yi|.*[-_](Adlm|Arab|Hebr|Nkoo|Rohg|Thaa))(?!.*[-_](Latn|Cyrl)($|-|_))($|-|_)/i;

const directionality = { current: "ltr", observers: [] };

function updateDirection() {
  const _dir = (document.body?.dir || document.documentElement?.dir)?.toLowerCase() || "auto";
  directionality.current =
    _dir === "auto" && navigator?.language
      ? RTL_LOCALES.test(navigator.language)
        ? "rtl"
        : "ltr"
      : _dir === "rtl"
        ? "rtl"
        : "ltr";
}

if (typeof window !== "undefined") {
  updateDirection();

  if (typeof MutationObserver !== "undefined") {
    const init = { attributeFilter: ["dir"] };
    const observer = new MutationObserver(() => {
      updateDirection();
      directionality.observers.forEach((x) => x());
    });
    if (document.body) observer.observe(document.body, init);
    if (document.documentElement) observer.observe(document.documentElement, init);
  }

  window.addEventListener("languagechange", () => {
    updateDirection();
    directionality.observers.forEach((x) => x());
  });
}

/* M3eDirectionality.observe：返回取消订阅函数。 */
function observeDirectionality(callback) {
  directionality.observers.push(callback);
  return () => {
    const index = directionality.observers.indexOf(callback);
    if (index >= 0) directionality.observers.splice(index, 1);
  };
}
</script>

<script setup>
import { computed, getCurrentInstance, markRaw, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

/* SliderSize.ts / SliderOrientation.ts 逐行照抄。 */
function isSliderSize(value) {
  return (
    value === "extra-small" || value === "small" || value === "medium" || value === "large" || value === "extra-large"
  );
}
function isSliderOrientation(value) {
  return value === "horizontal" || value === "vertical";
}

const props = defineProps({
  modelValue: { type: [Number, Array], default: 0 },
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  size: { type: String, default: "extra-small" },
  orientation: { type: String, default: "horizontal" },
  discrete: { type: Boolean, default: false },
  labelled: { type: Boolean, default: false },
  /* 旧 KIMA 名，等价官方 labelled。 */
  showValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  label: { type: String, default: "" },
  name: { type: String, default: undefined },
  /* 官方 displayWith：数值气泡的格式化函数（attribute: false 的程序接口）。 */
  displayWith: { type: Function, default: null },
});

const emit = defineEmits(["update:modelValue", "input", "change"]);
const attrs = useAttrs();
const isCustomElement = Boolean(getCurrentInstance()?.ce);
const forwardedAttrs = computed(() => (isCustomElement ? { ...attrs, id: undefined } : attrs));

/* #applySize / #applyOrientation（willUpdate）：非法值回落官方默认。 */
const size = computed(() => (isSliderSize(props.size) ? props.size : "extra-small"));
const orientation = computed(() => (isSliderOrientation(props.orientation) ? props.orientation : "horizontal"));
const labelled = computed(() => props.labelled || props.showValue);
const vertical = computed(() => orientation.value === "vertical");

/* SupportsDirectionality：--rtl 态；订阅内重算 + 重渲染（官方 requestUpdate）。 */
const direction = ref(directionality.current);
let unsubscribeDirectionality;

/* ============ 官方 thumb 机制（SliderThumbElement.ts） ============
 * thumb 是独立值载体：value / disabled / dirty / touched / aria 由 slider 写入，
 * 变换与轨道变量全部由 slider 的像素测量驱动。el 用 markRaw 存（原生 API 不吃代理）。 */
function makeThumb(value) {
  return {
    value: value ?? null,
    disabled: false,
    dirty: false,
    touched: false,
    active: false,
    vertical: false,
    pos: 0,
    ariaValueMin: "",
    ariaValueMax: "",
    ariaValueNow: "",
    ariaOrientation: orientation.value,
    el: null,
  };
}

/* #handleSlotChange 的 modelValue 映射：数组 → 双 thumb（上限 2，官方截断）。 */
function thumbsFromModel(model) {
  if (Array.isArray(model)) {
    return [makeThumb(model[0]), makeThumb(model[1])].slice(0, 2);
  }
  return [makeThumb(model)];
}

const thumbs = ref(thumbsFromModel(props.modelValue));
const lowerThumb = computed(() => thumbs.value[0] ?? null);
const upperThumb = computed(() => thumbs.value[1] ?? null);
const isRange = computed(() => thumbs.value.length > 1);

function syncThumbsFromModel(model) {
  const next = thumbsFromModel(model);
  if (next.length === thumbs.value.length) {
    thumbs.value.forEach((thumb, i) => {
      thumb.value = next[i].value;
    });
  } else {
    thumbs.value = next;
  }
}

/* ============ 测量缓存（官方私有字段） ============
 * cachedSize/cachedThumbSize 是 ref：模板里的 tick 变换依赖它们，尺寸变化即重排。 */
const root = ref(null); /* .kima-slider = 官方 :host */
const base = ref(null); /* 官方 @query(".base") */
const cachedSize = ref(0);
const cachedThumbSize = ref(0);
let cachedClientStart = 0;
let cachedClientEnd = 0;
let cachedClientSize = 0;
let lastThumbMoveTimestamp = 0;
let resizeObserver = null;
const animating = ref(false); /* 官方 --animating custom state */

/* #pointFromValue 逐行。 */
function pointFromValue(value) {
  return (cachedSize.value - cachedThumbSize.value) * ((value - props.min) / (props.max - props.min));
}

/* #translate 逐行：垂直自底向上取负；水平方向随文档 dir 翻转。 */
function formatTranslate(pos) {
  return vertical.value
    ? `translate(0, ${-pos}px)`
    : `translate(${direction.value === "rtl" ? -pos : pos}px, 0)`;
}

/* #updateCachedDimensions 逐行：轴上长度用 clientWidth/Height，命中计算用 rect。 */
function updateCachedDimensions() {
  if (!lowerThumb.value || !lowerThumb.value.el || !root.value) return;

  const size = vertical.value ? root.value.clientHeight : root.value.clientWidth;
  const thumbSize = vertical.value ? lowerThumb.value.el.clientHeight : lowerThumb.value.el.clientWidth;

  cachedSize.value = size;
  cachedThumbSize.value = thumbSize;

  const rect = root.value.getBoundingClientRect();
  const clientStart = vertical.value ? rect.top : rect.left;
  const clientEnd = vertical.value ? rect.bottom : rect.right;
  const clientSize = vertical.value ? rect.height : rect.width;

  cachedClientStart = clientStart;
  cachedClientEnd = clientEnd;
  cachedClientSize = clientSize;
}

/* #updateDimensions 逐行：单/双 thumb 两分支；像素变量写在 base 上（官方 setProperty）。 */
const baseStyle = ref({});

function updateDimensions() {
  if (!lowerThumb.value) return;

  const lowerValue = lowerThumb.value.value ?? props.min;
  const lowerPos = pointFromValue(lowerValue);
  lowerThumb.value.pos = lowerPos;

  if (!upperThumb.value) {
    baseStyle.value = {
      "--_slider-active-track-size": `${lowerPos}px`,
      "--_slider-inactive-track-after-offset": `${lowerPos + cachedThumbSize.value}px`,
      "--_slider-inactive-track-after-size": `${cachedSize.value - lowerPos - cachedThumbSize.value}px`,
    };

    updateTicks((i) => i < lowerValue);
  } else {
    const upperValue = upperThumb.value.value ?? lowerValue;
    const upperPos = pointFromValue(upperValue);
    upperThumb.value.pos = upperPos;

    baseStyle.value = {
      "--_slider-inactive-track-before-size": `${lowerPos}px`,
      "--_slider-active-track-offset": `${lowerPos + cachedThumbSize.value}px`,
      "--_slider-active-track-size": `${upperPos - lowerPos - cachedThumbSize.value}px`,
      "--_slider-inactive-track-after-offset": `${upperPos + cachedThumbSize.value}px`,
      "--_slider-inactive-track-after-size": `${cachedSize.value - cachedThumbSize.value - upperPos}px`,
    };

    updateTicks((i) => i > lowerValue && i < upperValue);
  }
}

/* #updateTicks 逐行。 */
const ticks = ref([]);

function updateTicks(active) {
  const list = [];
  if (props.discrete && props.step > 1) {
    for (let i = props.min; i <= props.max; i += props.step) {
      list.push({ value: i, active: active(i), hidden: false });
    }
  } else {
    list.push({ value: props.min, active: active(props.min), hidden: false });
    if (props.min < 0 && props.max > 0) {
      list.push({ value: 0, active: active(0), hidden: false });
    }
    list.push({ value: props.max, active: active(props.max), hidden: false });
  }
  ticks.value = list;
  updateTickOverlap();
}

/* #updateTickOverlap 逐行：thumb 盖住的刻度隐藏。 */
function updateTickOverlap() {
  if (cachedSize.value === 0 || cachedThumbSize.value === 0) return;
  const withValues = thumbs.value.filter((t) => t.value != null);
  if (withValues.length === 0) return;
  const thumbHalfWidth = cachedThumbSize.value / 2;
  ticks.value = ticks.value.map((tick) => {
    const tickPos = pointFromValue(tick.value);
    const hidden = withValues.some((thumb) => {
      const thumbPos = pointFromValue(thumb.value);
      return Math.abs(tickPos - thumbPos) < thumbHalfWidth;
    });
    return { ...tick, hidden };
  });
}

/* #valueFromPoint 逐行（含官方 `(1 - thumbRatio || 1)` 的原样优先级）。 */
function valueFromPoint(e) {
  const pos =
    vertical.value || direction.value === "rtl"
      ? cachedClientEnd - (vertical.value ? e.clientY : e.clientX)
      : e.clientX - cachedClientStart;

  const step = props.step === 0 ? 1 : props.step;
  const numSteps = Math.floor((props.max - props.min) / step);

  const thumbRatio = cachedSize.value ? cachedThumbSize.value / cachedSize.value : 0;
  const percentage = (pos / cachedClientSize - thumbRatio / 2) / (1 - thumbRatio || 1);

  const fixedPercentage = Math.round(percentage * numSteps) / numSteps;
  const impreciseValue = fixedPercentage * (props.max - props.min) + props.min;
  return Math.round(impreciseValue / step) * step;
}

/* #updateThumbs 逐行：aria 全套 + 垂直态 + 禁用同步。 */
function updateThumbs() {
  thumbs.value.forEach((thumb, i) => {
    if (props.disabled) {
      thumb.disabled = true;
    }
    thumb.ariaValueMin = `${thumbs.value[i - 1]?.value ?? props.min}`;
    thumb.ariaValueMax = `${thumbs.value[i + 1]?.value ?? props.max}`;
    thumb.ariaValueNow = `${thumb.value ?? thumbs.value[i - 1]?.value ?? props.min}`;
    thumb.ariaOrientation = orientation.value;
    thumb.vertical = vertical.value;
  });
}

/* prefersReducedMotion（core/shared/utils 逐行，仅交互路径调用）。 */
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion)").matches;
}

/* 官方 e.composedPath().find(x => x instanceof M3eSliderThumbElement)。 */
function thumbStateFromEvent(e) {
  const el = (e.composedPath() || []).find(
    (x) => x instanceof HTMLElement && x.classList?.contains("kima-slider-thumb"),
  );
  return el ? thumbs.value.find((thumb) => thumb.el === el) ?? null : null;
}

let activeThumb = null;
const changedThumbs = new Set();

/* #handlePointerDown 逐行。 */
function handlePointerDown(e) {
  if (e.pointerType === "mouse" && e.button > 1) return;
  if (!lowerThumb.value || props.disabled) return;

  updateCachedDimensions();

  if (e.target instanceof HTMLElement) {
    e.target.setPointerCapture(e.pointerId);
  }

  changedThumbs.clear();
  lastThumbMoveTimestamp = e.timeStamp;

  activeThumb = thumbStateFromEvent(e);

  if (activeThumb) {
    return;
  }

  const value = valueFromPoint(e);

  if (!upperThumb.value) {
    if (!lowerThumb.value.disabled) {
      activeThumb = lowerThumb.value;
    }
  } else {
    const lowerValue = lowerThumb.value.value ?? props.min;
    const upperValue = upperThumb.value.value ?? lowerValue;

    if (value < lowerValue) {
      if (!lowerThumb.value.disabled) {
        activeThumb = lowerThumb.value;
      }
    } else if (value > upperValue) {
      if (!upperThumb.value.disabled) {
        activeThumb = upperThumb.value;
      }
    } else {
      const mid = (lowerValue + upperValue) / 2;
      if (value < mid && !lowerThumb.value.disabled) {
        activeThumb = lowerThumb.value;
      } else if (!upperThumb.value.disabled) {
        activeThumb = upperThumb.value;
      }
    }
  }

  if (activeThumb) {
    const min =
      activeThumb === upperThumb.value ? Math.max(props.min, lowerThumb.value.value ?? props.min) : props.min;
    const max =
      activeThumb === lowerThumb.value && upperThumb.value
        ? Math.min(props.max, upperThumb.value.value ?? props.max)
        : props.max;

    changeThumb(activeThumb, Math.min(max, Math.max(min, value)), true);
    activeThumb.active = true; /* addCustomState(thumb, "--active") */
  }
}

/* #handlePointerMove 逐行：90ms 合并事件容忍关闭动画。 */
function handlePointerMove(e) {
  if (
    !(e.target instanceof HTMLElement) ||
    !e.target.hasPointerCapture(e.pointerId) ||
    !activeThumb ||
    activeThumb.disabled
  ) {
    return;
  }

  let value = valueFromPoint(e);
  let min = props.min;
  let max = props.max;

  if (activeThumb === upperThumb.value) {
    min = Math.max(min, lowerThumb.value?.value ?? 0);
  } else if (upperThumb.value) {
    max = Math.min(max, upperThumb.value.value ?? props.max);
  }

  value = Math.min(max, Math.max(min, value));
  if (value === activeThumb.value) {
    return;
  }

  const effectiveStep = props.step === 0 ? 1 : props.step;
  let animate = effectiveStep !== 1;

  if (animate) {
    for (const coalescedEvent of e.getCoalescedEvents()) {
      if (coalescedEvent.timeStamp - lastThumbMoveTimestamp < 90) {
        animate = false;
      }
      lastThumbMoveTimestamp = coalescedEvent.timeStamp;
    }
  }

  if (!animate) {
    if (animating.value) {
      animating.value = false; /* deleteCustomState(this, "--animating") */
      activeThumb.el.style.transition = "";
    }
  }

  changeThumb(activeThumb, value, animate);
}

/* #handlePointerUp 逐行。 */
function handlePointerUp(e) {
  if (e.pointerType === "mouse" && e.button > 1) return;
  if (!lowerThumb.value || props.disabled) return;

  if (e.target instanceof HTMLElement) {
    e.target.releasePointerCapture(e.pointerId);
  }

  lastThumbMoveTimestamp = 0;

  if (activeThumb && !activeThumb.disabled) {
    commitThumb(activeThumb);
    activeThumb.el.focus();
    activeThumb.active = false; /* deleteCustomState(thumb, "--active") */
  }
}

/* #handleKeyDown 逐行：垂直或 ltr 决定升序方向；space 仅吞默认。 */
function handleKeyDown(e) {
  activeThumb = thumbStateFromEvent(e);

  if (!activeThumb) return;

  let min = props.min;
  let max = props.max;

  if (activeThumb === upperThumb.value) {
    min = Math.max(min, lowerThumb.value?.value ?? 0);
  } else if (upperThumb.value) {
    max = Math.min(max, upperThumb.value.value ?? props.max);
  }

  const value = activeThumb.value ?? min;

  const ascending = vertical.value || direction.value === "ltr";

  switch (e.key) {
    case "Home":
      changeThumb(activeThumb, min);
      e.preventDefault();
      break;

    case "End":
      changeThumb(activeThumb, max);
      e.preventDefault();
      break;

    case "PageUp":
      if (ascending) {
        changeThumb(activeThumb, Math.min(max, value + (props.step > 1 ? props.step : 10)));
      } else {
        changeThumb(activeThumb, Math.max(min, value - (props.step > 1 ? props.step : 10)));
      }

      e.preventDefault();
      break;

    case "PageDown":
      if (ascending) {
        changeThumb(activeThumb, Math.max(min, value - (props.step > 1 ? props.step : 10)));
      } else {
        changeThumb(activeThumb, Math.min(max, value + (props.step > 1 ? props.step : 10)));
      }

      e.preventDefault();
      break;

    case "Down":
    case "ArrowDown":
    case "Left":
    case "ArrowLeft":
      if (ascending) {
        changeThumb(activeThumb, Math.max(min, value - props.step));
      } else {
        changeThumb(activeThumb, Math.min(max, value + props.step));
      }

      e.preventDefault();

      break;

    case "Up":
    case "ArrowUp":
    case "Right":
    case "ArrowRight":
      if (ascending) {
        changeThumb(activeThumb, Math.min(max, value + props.step));
      } else {
        changeThumb(activeThumb, Math.max(min, value - props.step));
      }

      e.preventDefault();

      break;

    case " ":
      e.preventDefault();
      break;
  }
}

/* #handleKeyUp 逐行：提交路径上经过的 thumb。 */
function handleKeyUp(e) {
  const activeThumbFromEvent = thumbStateFromEvent(e);
  if (activeThumbFromEvent) {
    commitThumb(activeThumbFromEvent);
  }
}

/* #handleThumbChange 逐行（thumb 的 value-change 通道 → 内部同步调用）。 */
function onThumbValueChanged() {
  updateThumbs();
  updateDimensions();
}

/* #changeThumb 逐行：beforeinput 可取消；动画 = spring.fastEffects + --animating 态。 */
function changeThumb(thumb, value, animate = false) {
  if (thumb.value === value) return;

  if (thumb.el.dispatchEvent(new Event("beforeinput", { bubbles: true, cancelable: true }))) {
    if (animate && !prefersReducedMotion()) {
      animating.value = true; /* addCustomState(this, "--animating") */
      thumb.el.addEventListener(
        "transitionend",
        () => {
          thumb.el.style.transition = "";
          animating.value = false;
        },
        { once: true },
      );
      thumb.el.style.transition = `transform var(--kima-slider-motion-fast-effects)`;
    }
    changedThumbs.add(thumb);
    thumb.value = value;
    thumb.dirty = true; /* markAsDirty */
    thumb.touched = true; /* markAsTouched */
    onThumbValueChanged();
    emit("update:modelValue", modelFromThumbs());
    emit("input", modelFromThumbs());
  }
}

/* #commitThumb 逐行。 */
function commitThumb(thumb) {
  if (changedThumbs.has(thumb)) {
    changedThumbs.delete(thumb);
    emit("change", modelFromThumbs());
  }
}

function modelFromThumbs() {
  if (isRange.value) return [thumbs.value[0].value, thumbs.value[1].value];
  return thumbs.value[0].value;
}

/* SliderThumbElement #labelText 逐行。 */
function thumbLabelText(thumb) {
  return props.displayWith?.(thumb.value) ?? thumb.value?.toString() ?? "";
}

function setThumbEl(thumb, el) {
  thumb.el = el ? markRaw(el) : null;
}

/* ============ 生命周期（connectedCallback / disconnectedCallback / updated） ============ */
let defaultValue = null;
let ownerForm = null;

/* formResetCallback 逐行：恢复 connectedCallback 捕获的默认值 + pristine/untouched；
 * update:modelValue 的回发是 v-model 契约（防止父状态与表单脱钩）。 */
function handleFormReset() {
  syncThumbsFromModel(defaultValue);
  thumbs.value.forEach((thumb) => {
    thumb.dirty = false;
    thumb.touched = false;
  });
  onThumbValueChanged();
  emit("update:modelValue", modelFromThumbs());
}

onMounted(() => {
  /* ResizeController：observe 自身 + 全部 thumb；初始测量由 RO 首次回调完成。 */
  resizeObserver = new ResizeObserver(() => {
    updateCachedDimensions();
    updateDimensions();
  });
  resizeObserver.observe(root.value);
  thumbs.value.forEach((thumb) => thumb.el && resizeObserver.observe(thumb.el));

  /* 方向订阅（官方 slider 自有订阅 + SupportsDirectionality 的 --rtl 态）。 */
  unsubscribeDirectionality = observeDirectionality(() => {
    direction.value = directionality.current;
    updateDimensions();
  });
  direction.value = directionality.current;

  updateThumbs();

  defaultValue = props.modelValue;
  ownerForm = root.value?.closest("form") ?? null;
  ownerForm?.addEventListener("reset", handleFormReset);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  unsubscribeDirectionality?.();
  ownerForm?.removeEventListener("reset", handleFormReset);
});

/* updated() 逐行：disabled 变化同步全部 thumb。 */
watch(
  () => props.disabled,
  () => thumbs.value.forEach((x) => (x.disabled = props.disabled)),
);

/* updated() 逐行：轴向变化 → aria 重写 + 重新测量（官方 resizeController 重观察）。 */
watch(orientation, () => {
  updateThumbs();
  nextTick(() => {
    updateCachedDimensions();
    updateDimensions();
  });
});

/* min/max/step/discrete 变化 → 轨道与刻度重算（官方在每次 updateDimensions 里完成）。 */
watch([() => props.min, () => props.max, () => props.step, () => props.discrete], () => {
  onThumbValueChanged();
});

/* modelValue → thumb 值（官方 thumb.value 程序赋值 → value-change → 重算，不发 input）。
 * 模式切换（单↔双）= #handleSlotChange：重观察新 thumb。 */
watch(
  () => props.modelValue,
  (model) => {
    const previous = thumbs.value;
    syncThumbsFromModel(model);
    if (thumbs.value !== previous) {
      previous.forEach((thumb) => thumb.el && resizeObserver?.unobserve(thumb.el));
      nextTick(() => {
        thumbs.value.forEach((thumb) => thumb.el && resizeObserver.observe(thumb.el));
        updateThumbs();
        updateCachedDimensions();
        updateDimensions();
      });
    } else {
      onThumbValueChanged();
    }
  },
);

/* SSR 也要带全套 aria（updateThumbs 纯状态，无 DOM 访问）。 */
updateThumbs();
</script>

<template>
  <div
    ref="root"
    class="kima-slider"
    :class="[
      `kima-slider--${size}`,
      {
        'kima-slider--disabled': disabled,
        'kima-slider--discrete': discrete,
        'kima-slider--labelled': labelled,
        'kima-slider--vertical': vertical,
        'kima-slider--rtl': direction === 'rtl',
        'kima-slider--animating': animating,
      },
    ]"
    v-bind="forwardedAttrs"
  >
    <!-- 官方 render() 同构：base > track 三段 + ticks + thumb。 -->
    <div
      ref="base"
      class="base"
      :class="{ range: isRange }"
      :style="baseStyle"
      :tabindex="!disabled ? '-1' : undefined"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @keydown="handleKeyDown"
      @keyup="handleKeyUp"
    >
      <div class="track" aria-hidden="true">
        <div class="track-inactive start"></div>
        <div class="track-active"></div>
        <div class="track-inactive end"></div>
      </div>
      <div class="ticks" aria-hidden="true">
        <div
          v-for="(tick, index) in ticks"
          :key="index"
          class="tick"
          :class="[tick.active ? 'active' : 'inactive', { hidden: tick.hidden }]"
          :style="{ transform: formatTranslate(pointFromValue(tick.value)) }"
        ></div>
      </div>
      <!-- 官方 thumb render() 同构：label + base(focus-ring + touch + wrapper(handle))。 -->
      <div
        v-for="(thumb, index) in thumbs"
        :key="index"
        :ref="(el) => setThumbEl(thumb, el)"
        class="kima-slider-thumb"
        :class="{
          'kima-slider-thumb--vertical': thumb.vertical,
          'kima-slider-thumb--active': thumb.active,
        }"
        role="slider"
        :tabindex="thumb.disabled ? undefined : 0"
        :aria-disabled="thumb.disabled ? 'true' : undefined"
        :aria-valuemin="thumb.ariaValueMin"
        :aria-valuemax="thumb.ariaValueMax"
        :aria-valuenow="thumb.ariaValueNow"
        :aria-orientation="thumb.ariaOrientation"
        :aria-label="label || undefined"
        :data-dirty="thumb.dirty ? '' : undefined"
        :data-touched="thumb.touched ? '' : undefined"
        :style="{ transform: formatTranslate(thumb.pos) }"
        @focusout="thumb.touched = true"
      >
        <div class="label" aria-hidden="true">{{ thumbLabelText(thumb) }}</div>
        <div class="base">
          <div class="focus-ring" aria-hidden="true">
            <div class="outline"></div>
          </div>
          <div class="touch" aria-hidden="true"></div>
          <div class="wrapper">
            <div class="handle"></div>
          </div>
        </div>
      </div>
    </div>
    <!-- 表单值（官方 thumb 的 formAssociated setFormValue；type=hidden 不参与校验）。 -->
    <div v-if="name !== undefined && !disabled" hidden aria-hidden="true">
      <input v-for="(thumb, index) in thumbs" :key="index" type="hidden" :name="name" :value="thumb.value ?? ''" />
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ============ M3E SliderElement.ts / SliderThumbElement.ts / FocusRingElement.ts 逐行照抄 ============
 * :host → .kima-slider；:state(--x) → .kima-slider--x；
 * ${DesignToken.*} → --kima-* token（_tokens.scss slider 块）；
 * 轨道形状 cssprop 的方向相关默认值按官方留 var() 回退（ltr/rtl/vertical 各自的编译值）。
 * slider 的 .base 用 > 直接子代选择器（thumb 内部还有同名 .base，不能串）。 */

/* ---- SliderElement.ts :host（181-190）---- */
.kima-slider {
  display: inline-block;
  vertical-align: middle;
  min-inline-size: var(--kima-slider-min-width, 200px);
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  line-height: 0;
}
.kima-slider[hidden] {
  display: none;
}
.kima-slider:not(.kima-slider--disabled) {
  cursor: pointer;
}

/* ---- 尺寸档（197-200 / 231-233 / 262-264 / 290-292）---- */
.kima-slider:is(.kima-slider--extra-small, .kima-slider--small) {
  height: var(--kima-slider-small-height, 44px);
}
.kima-slider--medium {
  height: var(--kima-slider-medium-height, 52px);
}
.kima-slider--large {
  height: var(--kima-slider-large-height, 68px);
}
.kima-slider--extra-large {
  height: var(--kima-slider-extra-large-height, 108px);
}

/* ---- 轨道圆角（ltr，201-224 / 234-247 / 265-275 / 293-306）----
 * 官方 ShapeToken.corner.*Start/End 的展开编译值：small 8 / medium 12 / large 16 / extra-large 28。 */
.kima-slider:not(.kima-slider--rtl):is(.kima-slider--extra-small, .kima-slider--small) > .base {
  --_slider-active-track-shape: var(--kima-slider-small-active-track-shape, 8px 0 0 8px);
  --_slider-inactive-track-start-shape: var(--kima-slider-small-inactive-active-track-start-shape, 8px 0 0 8px);
  --_slider-inactive-track-end-shape: var(--kima-slider-small-inactive-track-end-shape, 0 8px 8px 0);
}
.kima-slider.kima-slider--rtl:is(.kima-slider--extra-small, .kima-slider--small) > .base {
  --_slider-active-track-shape: var(--kima-slider-small-active-track-shape, 0 8px 8px 0);
  --_slider-inactive-track-start-shape: var(--kima-slider-small-inactive-active-track-start-shape, 0 8px 8px 0);
  --_slider-inactive-track-end-shape: var(--kima-slider-small-inactive-track-end-shape, 8px 0 0 8px);
}
.kima-slider:not(.kima-slider--rtl).kima-slider--medium > .base {
  --_slider-active-track-shape: var(--kima-slider-medium-active-track-shape, 12px 0 0 12px);
  --_slider-inactive-track-start-shape: var(--kima-slider-medium-inactive-active-track-start-shape, 12px 0 0 12px);
  --_slider-inactive-track-end-shape: var(--kima-slider-medium-inactive-track-end-shape, 0 12px 12px 0);
}
.kima-slider.kima-slider--rtl.kima-slider--medium > .base {
  --_slider-active-track-shape: var(--kima-slider-medium-active-track-shape, 0 12px 12px 0);
  --_slider-inactive-track-start-shape: var(--kima-slider-medium-inactive-active-track-start-shape, 0 12px 12px 0);
  --_slider-inactive-track-end-shape: var(--kima-slider-medium-inactive-track-end-shape, 12px 0 0 12px);
}
.kima-slider:not(.kima-slider--rtl).kima-slider--large > .base {
  --_slider-active-track-shape: var(--kima-slider-large-active-track-shape, 16px 0 0 16px);
  --_slider-inactive-track-start-shape: var(--kima-slider-large-inactive-active-track-start-shape, 16px 0 0 16px);
  --_slider-inactive-track-end-shape: var(--kima-slider-large-inactive-track-end-shape, 0 16px 16px 0);
}
.kima-slider.kima-slider--rtl.kima-slider--large > .base {
  --_slider-active-track-shape: var(--kima-slider-large-active-track-shape, 0 16px 16px 0);
  --_slider-inactive-track-start-shape: var(--kima-slider-large-inactive-active-track-start-shape, 0 16px 16px 0);
  --_slider-inactive-track-end-shape: var(--kima-slider-large-inactive-track-end-shape, 16px 0 0 16px);
}
.kima-slider:not(.kima-slider--rtl).kima-slider--extra-large > .base {
  --_slider-active-track-shape: var(--kima-slider-extra-large-active-track-shape, 28px 0 0 28px);
  --_slider-inactive-track-start-shape: var(--kima-slider-extra-large-inactive-active-track-start-shape, 28px 0 0 28px);
  --_slider-inactive-track-end-shape: var(--kima-slider-extra-large-inactive-track-end-shape, 0 28px 28px 0);
}
.kima-slider.kima-slider--rtl.kima-slider--extra-large > .base {
  --_slider-active-track-shape: var(--kima-slider-extra-large-active-track-shape, 0 28px 28px 0);
  --_slider-inactive-track-start-shape: var(--kima-slider-extra-large-inactive-active-track-start-shape, 0 28px 28px 0);
  --_slider-inactive-track-end-shape: var(--kima-slider-extra-large-inactive-track-end-shape, 28px 0 0 28px);
}

/* ---- 轨道高（225-230 / 259-261 / 287-289 / 321-323）---- */
.kima-slider--extra-small .track {
  height: calc(var(--kima-slider-extra-small-track-height, 16px));
}
.kima-slider--small .track {
  height: calc(var(--kima-slider-small-track-height, 24px));
}
.kima-slider--medium .track {
  height: var(--kima-slider-medium-track-height, 40px);
}
.kima-slider--large .track {
  height: var(--kima-slider-large-track-height, 56px);
}
.kima-slider--extra-large .track {
  height: var(--kima-slider-extra-large-track-height, 96px);
}

/* ---- 动画态（324-329）：spring.fastEffects。 ---- */
.kima-slider--animating .track-active,
.kima-slider--animating .track-inactive.start,
.kima-slider--animating .track-inactive.end {
  transition:
    margin-inline-start var(--kima-slider-motion-fast-effects),
    width var(--kima-slider-motion-fast-effects);
}

/* ---- .base / .track / 轨道三段（330-367）---- */
.kima-slider > .base {
  contain: layout style;
  display: inline-flex;
  align-items: center;
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  outline: none;
  touch-action: none;
}
.kima-slider .track {
  contain: layout style paint;
  position: relative;
  flex: 1 1 auto;
  touch-action: none;
}
.kima-slider .track-inactive,
.kima-slider .track-active {
  contain: layout style paint;
  position: absolute;
  height: 100%;
  touch-action: none;
}
.kima-slider .track-active {
  margin-inline-start: var(--_slider-active-track-offset, 0px);
  width: var(--_slider-active-track-size, 0px);
  border-radius: var(--_slider-active-track-middle-shape, var(--_slider-active-track-shape));
}
.kima-slider .track-inactive.start {
  width: var(--_slider-inactive-track-before-size, 0px);
  border-radius: var(--_slider-inactive-track-start-shape);
}
.kima-slider .track-inactive.end {
  margin-inline-start: var(--_slider-inactive-track-after-offset, 0px);
  width: var(--_slider-inactive-track-after-size, 0px);
  border-radius: var(--_slider-inactive-track-end-shape);
}

/* 双 thumb 时 active 段方角（#handleSlotChange 的 middle-shape 0）。 */
.kima-slider > .base.range {
  --_slider-active-track-middle-shape: 0;
}

/* ---- .ticks / .tick（368-386）---- */
.kima-slider .ticks {
  position: absolute;
  width: 100%;
  height: var(--kima-slider-tick-size, 4px);
  overflow: visible;
  touch-action: none;
}
.kima-slider .tick {
  position: absolute;
  top: 0;
  touch-action: none;
  inset-inline-start: calc(var(--kima-slider-tick-size, 4px) + calc(var(--kima-slider-tick-size, 4px) / 2));
  width: var(--kima-slider-tick-size, 4px);
  height: var(--kima-slider-tick-size, 4px);
  border-radius: var(--kima-slider-tick-shape, var(--kima-radius-full));
}
.kima-slider .tick.hidden {
  visibility: hidden;
}

/* ---- 轨道与刻度配色（387-420）---- */
.kima-slider:not(.kima-slider--disabled) .track-inactive {
  background-color: var(--kima-slider-inactive-track-color, var(--kima-color-secondary-container));
}
.kima-slider--disabled .track-inactive {
  background-color: color-mix(
    in srgb,
    var(--kima-slider-disabled-inactive-track-color, var(--kima-color-on-surface))
      var(--kima-slider-disabled-inactive-track-opacity, 12%),
    transparent
  );
}
.kima-slider:not(.kima-slider--disabled) .track-active {
  background-color: var(--kima-slider-active-track-color, var(--kima-color-primary));
}
.kima-slider--disabled .track-active {
  background-color: color-mix(
    in srgb,
    var(--kima-slider-disabled-active-track-color, var(--kima-color-on-surface))
      var(--kima-slider-disabled-active-track-opacity, 38%),
    transparent
  );
}
.kima-slider:not(.kima-slider--disabled) .tick.active {
  background-color: var(--kima-slider-tick-active-color, var(--kima-color-on-primary));
}
.kima-slider--disabled .tick.active {
  background-color: var(--kima-slider-disabled-tick-active-color, var(--kima-color-inverse-on-surface));
}
.kima-slider:not(.kima-slider--disabled) .tick.inactive {
  background-color: var(--kima-slider-tick-inactive-color, var(--kima-color-on-secondary-container));
}
.kima-slider--disabled .tick.inactive {
  background-color: var(--kima-slider-disabled-tick-inactive-color, var(--kima-color-on-surface));
}
.kima-slider:not(.kima-slider--discrete) .tick.active {
  display: none;
}

/* ---- labelled：悬停/聚焦显示数值气泡（424-429）---- */
.kima-slider--labelled:hover > .base,
.kima-slider--labelled:focus-within > .base {
  --_slider-label-visibility: visible;
  --_slider-label-opacity: 1;
  --_slider-label-transform: scale(1);
}

/* ---- 强制对比色（430-462）---- */
@media (forced-colors: active) {
  .kima-slider:not(.kima-slider--disabled) .track-inactive {
    background-color: unset;
  }
  .kima-slider:not(.kima-slider--disabled) > .base.range .track-inactive.start,
  .kima-slider:not(.kima-slider--disabled) .track-inactive.end {
    border: 1px solid CanvasText;
    box-sizing: border-box;
  }
  .kima-slider:not(.kima-slider--disabled) .tick.inactive {
    background-color: CanvasText;
  }
  .kima-slider:not(.kima-slider--disabled) .tick.active {
    background-color: Canvas;
  }
  .kima-slider:not(.kima-slider--disabled) .track-active {
    background-color: CanvasText;
  }
  .kima-slider--disabled > .base.range .track-inactive.start,
  .kima-slider--disabled .track-inactive.end {
    border: 1px solid GrayText;
    box-sizing: border-box;
  }
  .kima-slider--disabled .track-active {
    background-color: GrayText;
  }
  .kima-slider--disabled .tick.inactive {
    background-color: GrayText;
  }
  .kima-slider--disabled .tick.active {
    background-color: Canvas;
  }
}

/* ---- 垂直方向（477-636，官方在水平规则之后追加，源序即优先）----
 * 官方 vertical 段的 :host(:state(--vertical)) 带 :host 伪类，特异性压过横向
 * :host 规则；平移后横向规则是 .kima-slider <类>，vertical 必须双类起步才能
 * 保持官方的覆盖方向（vertical 覆盖横向，而不是反过来）。 */
.kima-slider.kima-slider--vertical {
  min-inline-size: auto;
  min-block-size: var(--kima-slider-min-width, 200px);
  /* 根是 .base 的包含块。 */
  position: relative;
}
.kima-slider.kima-slider--vertical > .base {
  position: absolute;
  inset: 0;
  width: auto;
  height: auto;
  flex-direction: column;
}
.kima-slider.kima-slider--vertical:is(.kima-slider--extra-small, .kima-slider--small) {
  height: auto;
  width: var(--kima-slider-small-height, 44px);
}
.kima-slider.kima-slider--vertical.kima-slider--extra-small .track {
  height: auto;
  width: calc(var(--kima-slider-extra-small-track-height, 16px));
}
.kima-slider.kima-slider--vertical.kima-slider--small .track {
  height: auto;
  width: calc(var(--kima-slider-small-track-height, 24px));
}
.kima-slider.kima-slider--vertical.kima-slider--medium {
  height: auto;
  width: var(--kima-slider-medium-height, 52px);
}
.kima-slider.kima-slider--vertical.kima-slider--medium .track {
  height: auto;
  width: var(--kima-slider-medium-track-height, 40px);
}
.kima-slider.kima-slider--vertical.kima-slider--large {
  height: auto;
  width: var(--kima-slider-large-height, 68px);
}
.kima-slider.kima-slider--vertical.kima-slider--large .track {
  height: auto;
  width: var(--kima-slider-large-track-height, 56px);
}
.kima-slider.kima-slider--vertical.kima-slider--extra-large {
  height: auto;
  width: var(--kima-slider-extra-large-height, 108px);
}
.kima-slider.kima-slider--vertical.kima-slider--extra-large .track {
  height: auto;
  width: var(--kima-slider-extra-large-track-height, 96px);
}
/* 垂直圆角 = 对称角值组合（官方 0 0 small small 等）。 */
.kima-slider.kima-slider--vertical.kima-slider--extra-small > .base {
  --_slider-active-track-shape: var(
    --kima-slider-extra-small-active-track-shape,
    0 0 var(--kima-slider-corner-small, 8px) var(--kima-slider-corner-small, 8px)
  );
  --_slider-inactive-track-start-shape: var(
    --kima-slider-extra-small-inactive-active-track-start-shape,
    0 0 var(--kima-slider-corner-small, 8px) var(--kima-slider-corner-small, 8px)
  );
  --_slider-inactive-track-end-shape: var(
    --kima-slider-extra-small-inactive-track-end-shape,
    var(--kima-slider-corner-small, 8px) var(--kima-slider-corner-small, 8px) 0 0
  );
}
.kima-slider.kima-slider--vertical.kima-slider--small > .base {
  --_slider-active-track-shape: var(
    --kima-slider-small-active-track-shape,
    0 0 var(--kima-slider-corner-small, 8px) var(--kima-slider-corner-small, 8px)
  );
  --_slider-inactive-track-start-shape: var(
    --kima-slider-small-inactive-active-track-start-shape,
    0 0 var(--kima-slider-corner-small, 8px) var(--kima-slider-corner-small, 8px)
  );
  --_slider-inactive-track-end-shape: var(
    --kima-slider-small-inactive-track-end-shape,
    var(--kima-slider-corner-small, 8px) var(--kima-slider-corner-small, 8px) 0 0
  );
}
.kima-slider.kima-slider--vertical.kima-slider--medium > .base {
  --_slider-active-track-shape: var(
    --kima-slider-medium-active-track-shape,
    0 0 var(--kima-slider-corner-medium, 12px) var(--kima-slider-corner-medium, 12px)
  );
  --_slider-inactive-track-start-shape: var(
    --kima-slider-medium-inactive-active-track-start-shape,
    0 0 var(--kima-slider-corner-medium, 12px) var(--kima-slider-corner-medium, 12px)
  );
  --_slider-inactive-track-end-shape: var(
    --kima-slider-medium-inactive-track-end-shape,
    var(--kima-slider-corner-medium, 12px) var(--kima-slider-corner-medium, 12px) 0 0
  );
}
.kima-slider.kima-slider--vertical.kima-slider--large > .base {
  --_slider-active-track-shape: var(
    --kima-slider-large-active-track-shape,
    0 0 var(--kima-slider-corner-large, 16px) var(--kima-slider-corner-large, 16px)
  );
  --_slider-inactive-track-start-shape: var(
    --kima-slider-large-inactive-active-track-start-shape,
    0 0 var(--kima-slider-corner-large, 16px) var(--kima-slider-corner-large, 16px)
  );
  --_slider-inactive-track-end-shape: var(
    --kima-slider-large-inactive-track-end-shape,
    var(--kima-slider-corner-large, 16px) var(--kima-slider-corner-large, 16px) 0 0
  );
}
.kima-slider.kima-slider--vertical.kima-slider--extra-large > .base {
  --_slider-active-track-shape: var(
    --kima-slider-extra-large-active-track-shape,
    0 0 var(--kima-slider-corner-extra-large, 28px) var(--kima-slider-corner-extra-large, 28px)
  );
  --_slider-inactive-track-start-shape: var(
    --kima-slider-extra-large-inactive-active-track-start-shape,
    0 0 var(--kima-slider-corner-extra-large, 28px) var(--kima-slider-corner-extra-large, 28px)
  );
  --_slider-inactive-track-end-shape: var(
    --kima-slider-extra-large-inactive-track-end-shape,
    var(--kima-slider-corner-extra-large, 28px) var(--kima-slider-corner-extra-large, 28px) 0 0
  );
}
.kima-slider.kima-slider--vertical .track-inactive,
.kima-slider.kima-slider--vertical .track-active {
  width: 100%;
  height: auto;
  margin-inline-start: 0;
}
.kima-slider.kima-slider--vertical .track-active {
  bottom: var(--_slider-active-track-offset, 0px);
  height: var(--_slider-active-track-size, 0px);
}
.kima-slider.kima-slider--vertical .track-inactive.start {
  bottom: 0;
  height: var(--_slider-inactive-track-before-size, 0px);
}
.kima-slider.kima-slider--vertical .track-inactive.end {
  bottom: var(--_slider-inactive-track-after-offset, 0px);
  height: var(--_slider-inactive-track-after-size, 0px);
}
.kima-slider.kima-slider--vertical.kima-slider--animating .track-active,
.kima-slider.kima-slider--vertical.kima-slider--animating .track-inactive.start,
.kima-slider.kima-slider--vertical.kima-slider--animating .track-inactive.end {
  transition:
    bottom var(--kima-slider-motion-fast-effects),
    height var(--kima-slider-motion-fast-effects);
}
.kima-slider.kima-slider--vertical .ticks {
  width: var(--kima-slider-tick-size, 4px);
  height: 100%;
}
.kima-slider.kima-slider--vertical .tick {
  top: auto;
  inset-inline-start: 0;
  bottom: calc(var(--kima-slider-tick-size, 4px) + calc(var(--kima-slider-tick-size, 4px) / 2));
}

/* ============ SliderThumbElement.ts（thumb :host 与内部结构） ============ */

/* :host（77-89）：绝对定位竖列，宽度由内容收缩（wrapper 4+6×2=16）。 */
.kima-slider-thumb {
  display: block;
  box-sizing: border-box;
  position: absolute;
  outline: none;
  top: 0;
  bottom: 0;
  border-radius: var(--kima-slider-thumb-shape, var(--kima-radius-full));
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}
.kima-slider-thumb[hidden] {
  display: none;
}

/* thumb 内 .base（93-104）。 */
.kima-slider-thumb > .base {
  contain: layout style;
  box-sizing: border-box;
  vertical-align: middle;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: inherit;
}

/* .touch（105-111）：48px 命中区。 */
.kima-slider-thumb .touch {
  position: absolute;
  height: 48px;
  left: 0;
  right: 0;
  touch-action: none;
}

/* .wrapper（112-118）：handle 4px + padding 6×2。 */
.kima-slider-thumb .wrapper {
  display: inline-flex;
  justify-content: center;
  height: 100%;
  border-radius: inherit;
  width: calc(var(--kima-slider-thumb-width, 4px) + calc(var(--kima-slider-thumb-padding, 6px) * 2));
}

/* .focus-ring（119-124）：外扩厚度一圈；FocusRingElement :host 的属性在
 * 文件尾部原语段平铺，源序保持官方“原语规则在前、thumb 定位在后”的覆盖关系。 */
.kima-slider-thumb .focus-ring {
  top: calc(0px - var(--kima-slider-focus-ring-thickness, 3px));
  bottom: calc(0px - var(--kima-slider-focus-ring-thickness, 3px));
  left: var(--kima-slider-focus-ring-thickness, 3px);
  right: var(--kima-slider-focus-ring-thickness, 3px);
}

/* .label（125-151）：inverse 底气泡，label.medium 排版。 */
.kima-slider-thumb .label {
  -webkit-user-select: none;
  user-select: none;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  visibility: var(--_slider-label-visibility, hidden);
  opacity: var(--_slider-label-opacity, 0);
  transform: var(--_slider-label-transform, scale(0));
  transition:
    opacity var(--kima-slider-motion-short3, 150ms) var(--kima-curve-standard),
    transform var(--kima-slider-motion-short3, 150ms) var(--kima-curve-standard),
    visibility var(--kima-slider-motion-short3, 150ms) var(--kima-curve-standard) allow-discrete;
  width: var(--kima-slider-label-width, 48px);
  height: var(--kima-slider-label-height, 44px);
  top: calc(0px - var(--kima-slider-label-height, 44px) - var(--kima-slider-label-margin, 4px));
  inset-inline-start: calc(0px - 100%);
  border-radius: var(--kima-slider-label-shape, var(--kima-radius-full));
  background-color: var(--kima-slider-label-container-color, var(--kima-color-inverse-surface));
  color: var(--kima-slider-label-color, var(--kima-color-inverse-on-surface));
  font-size: var(--kima-slider-label-font-size, 12px);
  font-weight: var(--kima-slider-label-font-weight, 500);
  line-height: var(--kima-slider-label-line-height, 16px);
  letter-spacing: var(--kima-slider-label-tracking, 0.5px);
}
@starting-style {
  .kima-slider-thumb .label {
    opacity: 0;
    transform: scale(0);
  }
}

/* .handle（158-163）：4px 竖条，宽度 short2 过渡。 */
.kima-slider-thumb .handle {
  height: 100%;
  width: var(--kima-slider-thumb-width, 4px);
  border-radius: inherit;
  transition: width var(--kima-slider-motion-short2, 100ms) var(--kima-curve-standard);
}

/* 按压/聚焦/拖动态 → 2px（164-166）。 */
.kima-slider-thumb:is(:active, :focus-visible, .kima-slider-thumb--active):not([aria-disabled="true"]) .handle {
  width: var(--kima-slider-thumb-pressed-width, 2px);
}

/* handle 配色（167-173）。 */
.kima-slider-thumb:not([aria-disabled="true"]) .handle {
  background-color: var(--kima-slider-thumb-color, var(--kima-color-primary));
}
.kima-slider-thumb[aria-disabled="true"] .handle {
  opacity: var(--kima-slider-thumb-disabled-opacity, 38%);
  background-color: var(--kima-slider-thumb-disabled-color, var(--kima-color-on-surface));
}

@media (prefers-reduced-motion) {
  .kima-slider-thumb .label {
    transition: none;
  }
}

@media (forced-colors: active) {
  .kima-slider-thumb .label {
    forced-color-adjust: none;
    background-color: CanvasText;
    color: Canvas;
  }
  .kima-slider-thumb:not([aria-disabled="true"]) .handle {
    background-color: CanvasText;
  }
  .kima-slider-thumb[aria-disabled="true"] .handle {
    opacity: unset;
    background-color: GrayText;
  }
}

/* ---- thumb 垂直方向（203-245）---- */
.kima-slider-thumb--vertical {
  top: auto;
  bottom: 0;
  inset-inline: 0;
  height: calc(var(--kima-slider-thumb-width, 4px) + calc(var(--kima-slider-thumb-padding, 6px) * 2));
}
.kima-slider-thumb--vertical .touch {
  height: auto;
  width: 48px;
  top: 0;
  bottom: 0;
  inset-inline-start: 50%;
  translate: -50% 0;
}
.kima-slider-thumb--vertical .wrapper {
  width: 100%;
  height: 100%;
  align-items: center;
}
.kima-slider-thumb--vertical .handle {
  width: 100%;
  height: var(--kima-slider-thumb-width, 4px);
  transition: height var(--kima-slider-motion-short2, 100ms) var(--kima-curve-standard);
}
.kima-slider-thumb--vertical:is(:active, :focus-visible, .kima-slider-thumb--active):not([aria-disabled="true"])
  .handle {
  width: 100%;
  height: var(--kima-slider-thumb-pressed-width, 2px);
}
.kima-slider-thumb--vertical .focus-ring {
  top: var(--kima-slider-focus-ring-thickness, 3px);
  bottom: var(--kima-slider-focus-ring-thickness, 3px);
  left: calc(0px - var(--kima-slider-focus-ring-thickness, 3px));
  right: calc(0px - var(--kima-slider-focus-ring-thickness, 3px));
}
.kima-slider-thumb--vertical .label {
  top: calc(50% - calc(var(--kima-slider-label-height, 44px) / 2));
  inset-inline-start: calc(0px - var(--kima-slider-label-width, 48px) - var(--kima-slider-label-margin, 4px));
}

/* ============ FocusRingElement.ts（焦点环原语，官方逐行） ============
 * :host → thumb 内 .focus-ring（thumb 119-124 的定位规则在前、原语规则在后，
 * 与官方“thumb 定位覆盖原语默认 inset”的层叠结果一致）。 */

.kima-slider-thumb .focus-ring {
  display: block;
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  border-radius: inherit;
  corner-shape: inherit;
  outline: none;
}
/* thumb 119-124 定位规则块已在 SliderThumbElement 段（本文件上方）声明；
 * 此处仅原语 :host 的其余属性（平铺后重复定位会因源序覆盖，故不在此重复）。 */
.kima-slider-thumb .focus-ring[hidden] {
  display: none;
}
.kima-slider-thumb .focus-ring .outline {
  contain: layout style;
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  border-radius: inherit;
  corner-shape: inherit;
  z-index: 1;
  outline-color: var(--kima-slider-focus-ring-color, var(--kima-color-focus-ring));
  outline-width: var(--kima-slider-focus-ring-thickness, 3px);
  visibility: var(--kima-slider-focus-ring-visibility, visible);
}
.kima-slider-thumb .focus-ring:not([inward]) .outline {
  outline-offset: var(--kima-slider-focus-ring-outward-offset, 2px);
}
.kima-slider-thumb .focus-ring[inward] .outline {
  outline-offset: calc(var(--kima-slider-focus-ring-inward-offset, 0px) - var(--kima-slider-focus-ring-thickness, 3px));
}

/* .outline.visible：官方由 FocusController 驱动（键盘触发）；thumb 内等价 :focus-visible。 */
.kima-slider-thumb:focus-visible .outline {
  outline-style: solid;
}
.kima-slider-thumb:focus-visible .focus-ring:not([inward]) .outline {
  animation: kima-slider-ring-grow-shrink var(--kima-slider-focus-ring-duration, 500ms);
}
.kima-slider-thumb:focus-visible .focus-ring[inward] .outline {
  animation: kima-slider-ring-shrink-grow var(--kima-slider-focus-ring-duration, 500ms);
}
@keyframes kima-slider-ring-grow-shrink {
  50% {
    outline-width: calc(var(--kima-slider-focus-ring-thickness, 3px) * var(--kima-slider-focus-ring-growth-factor, 2));
  }
}
@keyframes kima-slider-ring-shrink-grow {
  50% {
    outline-offset: calc(
      var(--kima-slider-focus-ring-inward-offset, 0px) -
        calc(var(--kima-slider-focus-ring-thickness, 3px) * var(--kima-slider-focus-ring-growth-factor, 2))
    );
    outline-width: calc(var(--kima-slider-focus-ring-thickness, 3px) * var(--kima-slider-focus-ring-growth-factor, 2));
  }
}
@media (prefers-reduced-motion) {
  .kima-slider-thumb:focus-visible .outline {
    animation: none;
  }
}
@media (forced-colors: active) {
  .kima-slider-thumb .focus-ring .outline {
    outline-color: Highlight;
  }
}
</style>
