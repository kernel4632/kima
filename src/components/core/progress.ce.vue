<!--
进度指示器：M3E Progress Indicator 全源码照抄（github.com/matraic/m3e
packages/web/src/progress-indicator）。
来源逐文件：LinearProgressIndicatorElement.ts（645 行）/
CircularProgressIndicatorElement.ts（699 行）/ CircularProgressGeometry.ts（119 行）/
LinearWavyGeometry.ts（70 行）/ CircularWavyGeometry.ts（267 行）/
CircularWavyMotion.ts（57 行）/ WavyAmplitude.ts（113 行）/
ProgressElementIndicatorBase.ts（78 行）/ ProgressIndicatorVariant.ts / LinearProgressMode.ts。

官方结构：一个包、两个元素（m3e-linear-progress-indicator + m3e-circular-progress-indicator），
共享基类（value/max/variant/role=progressbar/forced-colors）。KIMA 合并为一个入口：
mode 属性区分 linear（默认）/ circular；官方 linear 的四模式
（determinate/indeterminate/buffer/query）作为 mode 值保留；
circular 官方的 indeterminate 布尔照抄为 indeterminate 属性。
KIMA 的 spinner 是独立的简洁环形加载件（border 环），不承担进度语义，与本组件分工。

翻译规则（唯一允许的改写）：
  Lit css`...` → SCSS：每行样式照抄；${DesignToken.*} → KIMA token；
  :host → .kima-progress（根元素）；:state(--x) → kima-progress--x 修饰类；
  官方 --m3e-* cssprop → --kima-progress-* token（_tokens.scss progress 块）；
  官方隐藏量测探针（.stroke / .amplitude-and-wavelength / .diameter-and-stroke）
  是架构决策——JS 只能通过 DOM 探针读到 cssprop 的像素值，照抄。
  ResizeController → ResizeObserver；AnimationLoopController → rAF 自调度（静止即停）。

官方算法（逐行照抄，非近似）：
  圆环几何（CircularProgressGeometry.ts）：
    polarToCartesian：(deg-90)° 的余弦/正弦极坐标
    circularProgressArc：gap 像素 → 度（sizeToDegrees），≥360° 收到 359.999°，
      单段 A 弧 large-arc-flag = (end-start<=180 ? 0 : 1)，sweep 0
    flat viewBox padding = amplitude 探针 + strokeWidth/2（实测 1.59375+2 → 47.1875）
    wavy 圆心半径 r=(d-sw)/2（stroke 内缩，无 padding）
    最小可见角 minDegrees = sizeToDegrees(sw*2, r)：track 段 < min 则不画
  线形 indeterminate（官方 keyframes 逐帧值，实测 2.1s 周期吻合）：
    primary: left -145.167%→-113.333%→56.333%→100%，width 8%→48%→78%→8%（0/20/60/100%）
    secondary: 同曲线相位平移（left -54.888%→-20%→60%→160%），delay 1.15s fill backwards
    wavy 变体用 transform translateX 同值（.primary 不参与 flex 排布）
  圆环 flat indeterminate 三层旋转（实测 1333ms 弧/5333ms 周）：
    .progress 线性自旋 1333×360/306 ms；.spinner 每半周期递增 135°（easing 0.4,0,0.2,1）；
    左右两个半圆 .circle 各自 expand-arc 265°↔130°（rotate 135deg/100deg 基座，右半 delay -666.5ms）
  圆环 wavy indeterminate（CircularWavyMotion.ts 逐行，6s 周期）：
    sweep 36°→313.2°线性涨，后半 313.2°→36° cubic(0.2,0,0,1) 收；
    rotation = (cycle/6)*1080 + quarter 突进 90°（1.5s 一节，0.3s 完成）；
    waveRotation/dashOffset = -(elapsed/waveCount % 1)*360/100 同相补偿
  wavy 波幅（WavyAmplitude.ts 逐行）：
    progress 0.1~0.95 之间或 indeterminate → 波幅全开，两端归零，500ms 形变
    （涨 cubic(0.2,0,0,1)；平 cubic(0.3,0,0.8,0.15)——中断从当前值重启）
    linear 波形（LinearWavyGeometry.ts）：半波长 Q 二次贝塞尔，控制点跨中线
    circular 波形（CircularWavyGeometry.ts）：圆与圆角星同构三次贝塞尔对，
      waveCount = round(π(d-sw)/λ) 夹 5..256，控制点插值 morph，maxDeformation 反折限幅
  线形 buffer：径向渐变 mask 打点，250ms 平移一个点距（thickness*2）

KIMA API 适配（对官方机制的包装，不改行为）：
  mode：'determinate'（默认）| 'indeterminate' | 'buffer' | 'query' | 'circular'
    前四个 = 官方 linear mode 透传；'circular' = 官方 m3e-circular-progress-indicator
  indeterminate：circular 官方布尔（linear 用 mode 表达，两者保持一致）
  label → aria-label（组件不画可见标签，同文本框约定）
  circular 默认插槽（官方：圆心放数值文本）照抄

实测记录（官网 matraic.github.io/m3e，Edge 139，2026-11-27）：
  线形 determinate 25%：host 4px 高；primary = 25% 宽 4px 圆角（radius=厚度/2），
    轨道色 secondaryContainer，primary 色 primary，gap flex-basis 4px，stop 方块 aspect 1:1
  线形 indeterminate 逐帧（1240px 宽，176 帧 ×12ms）：
    t=0 primary left=-145.167% w=8% → t=420(20%) w=48% → t=1260(60%) left=56.333% w=78%
    → t=2100 w=8% 循环；secondary delay 1.15s 后同曲线（2.1s 周期实测吻合 keyframes）
  圆环 flat 25%：viewBox 0 0 47.1875 47.1875（d40+padding 2×3.59375），
    active d 与 polarToCartesian(r=20, gap 4px→11.4592°) 逐位一致
  圆环 flat indeterminate：progress 1.5686s/圈 linear；spinner 5.332s ease(0.4,0,0,0.2,1)；
    左半 rotate 135deg 基座 + expand-arc 265↔130°；右半 rotate 100deg delay -0.6665s
  圆环 wavy indeterminate 逐帧（70 帧）：dash 13.1→35.4（sweep 36°→313°再收回），
    svg rotation 半周 +180°（3s）吻合 quarter 突进模型；waveRotation -4.86°→-39.5° 线性
  波幅探针实测：circular amplitude 1.59375px（默认 1.6px used value）wavelength 15px；
    linear amplitude 3px wavelength 40px（indeterminate 24px）
  官方 flat 主题色映射：primary=rgb(205,192,236)、track=rgb(62,56,76)（secondaryContainer）

调用示例：
  <kima-progress :value="downloaded" label="下载进度"></kima-progress>
  <kima-progress indeterminate label="正在连接"></kima-progress>
  <kima-progress mode="buffer" :value="10" :buffer-value="25" label="缓冲"></kima-progress>
  <kima-progress mode="circular" :value="25" label="完成度">25</kima-progress>
  <kima-progress mode="circular" indeterminate label="加载中"></kima-progress>
  <kima-progress mode="circular" variant="wavy" indeterminate></kima-progress>
-->
<script>
/* ============ WavyAmplitude.ts 逐行照抄（500ms 形变追踪） ============ */
function wavyProgress(value, max) {
  return max > 0 ? Math.max(0, Math.min(value / max, 1)) : 0;
}

function wavyAmplitudeTarget(progress, amplitude, indeterminate) {
  return indeterminate || (progress > 0.1 && progress < 0.95) ? Math.max(0, amplitude) : 0;
}

/* cubicEasing 逐行：二分反解曲线 x，再求 y（时间不是曲线参数）。 */
function cubicEasing(progress, x1, y1, x2, y2) {
  if (progress <= 0 || progress >= 1) return progress;

  let low = 0;
  let high = 1;

  for (let i = 0; i < 20; i++) {
    const t = (low + high) / 2;
    const x = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;

    if (x < progress) {
      low = t;
    } else {
      high = t;
    }
  }

  const t = (low + high) / 2;
  return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
}

/* WavyAmplitude 类逐行：retarget 从当前采样值重启。 */
class WavyAmplitude {
  constructor() {
    this.value = undefined;
    this._target = 0;
    this._from = 0;
    this._start = undefined;
  }

  get animating() {
    return this._start !== undefined;
  }

  setTarget(target, time) {
    if (this.value === undefined) {
      this.value = this._target = target;
    } else if (target !== this._target) {
      this.sample(time);
      this._from = this.value;
      this._target = target;
      this._start = time;
    }
  }

  sample(time) {
    if (this._start === undefined) return false;

    const previous = this.value;
    const progress = Math.max(0, Math.min(1, (time - this._start) / 0.5));
    const eased =
      this._target > this._from ? cubicEasing(progress, 0.2, 0, 0, 1) : cubicEasing(progress, 0.3, 0, 0.8, 0.15);

    this.value = this._from + (this._target - this._from) * eased;

    if (progress === 1) {
      this.value = this._target;
      this._start = undefined;
    }

    return this.value !== previous;
  }

  reset() {
    this.value = undefined;
    this._start = undefined;
  }
}

/* ============ LinearWavyGeometry.ts 逐行照抄 ============ */
function linearWavyPath({ width, strokeWidth, configuredAmplitude, amplitude, wavelength, phase = 0 }) {
  const extent = Math.max(configuredAmplitude, amplitude);
  const y = extent + strokeWidth / 2;

  const path = [];
  const step = wavelength / 2;
  let x = 0;

  path.push(`M ${x},${y}`);

  if (amplitude === 0) {
    path.push(`H ${width}`);
  } else {
    while (x <= width) {
      const endX = x + step;
      const endY = y + amplitude * Math.sin((2 * Math.PI * endX) / wavelength + phase);
      const cpX = x + step / 2;
      const cpY = y + amplitude * Math.sin((2 * Math.PI * (x + step / 2)) / wavelength + phase);

      path.push(`Q ${cpX},${cpY} ${endX},${endY}`);
      x += step;
    }
  }

  const height = strokeWidth + extent * 2;
  const viewBox = `0 0 ${width} ${height}`;

  return { path: path.join(" "), viewBox, height };
}

/* ============ CircularProgressGeometry.ts 逐行照抄 ============ */
function createCircularProgressCircle(diameter, strokeWidth, variant, padding) {
  if (variant === "wavy") {
    const r = Math.max(0, (diameter - strokeWidth) / 2);
    return { cx: diameter / 2, cy: diameter / 2, r, padding: 0 };
  }

  padding = padding + strokeWidth / 2;
  const r = diameter / 2;
  const cx = r + padding;
  const cy = r + padding;

  return { cx, cy, r, padding };
}

function circularProgressSizeToDegrees(size, radius) {
  return radius > 0 ? size * (360 / (2 * Math.PI * radius)) : 0;
}

function polarToCartesian(circle, degrees) {
  const rad = (degrees - 90) * (Math.PI / 180);

  return {
    x: circle.cx + circle.r * Math.cos(rad),
    y: circle.cy + circle.r * Math.sin(rad),
  };
}

function circularProgressArc(diameter, strokeWidth, variant, { startAngle = 0, endAngle = 360, gap = 0, padding = 0 }) {
  if (diameter === 0 || strokeWidth === 0) return { path: "", viewBox: "0 0 0 0" };

  const circle = createCircularProgressCircle(diameter, strokeWidth, variant, padding);

  if (gap > 0) {
    startAngle += circularProgressSizeToDegrees(gap, circle.r);
    endAngle -= circularProgressSizeToDegrees(gap, circle.r);
  }

  if (variant === "wavy" && endAngle <= startAngle) {
    return { path: "", viewBox: `0 0 ${diameter} ${diameter}` };
  }

  if (endAngle - startAngle >= 360) {
    endAngle = startAngle + 359.999;
  }

  const start = polarToCartesian(circle, endAngle);
  const end = polarToCartesian(circle, startAngle);
  const path = `M ${start.x} ${start.y} A ${circle.r} ${circle.r} 0 ${endAngle - startAngle <= 180 ? "0" : "1"} 0 ${end.x} ${end.y}`;
  const viewBox = `0 0 ${diameter + circle.padding * 2} ${diameter + circle.padding * 2}`;

  return { path, viewBox };
}

/* ============ CircularWavyGeometry.ts 逐行照抄（圆角星 morph 几何） ============ */
function interpolatePoint(a, b, fraction) {
  return { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction };
}

function cross(a, b) {
  return a.x * b.y - a.y * b.x;
}

function arcCubic(center, radius, start, sweep) {
  const end = start + sweep;
  const handle = (4 / 3) * Math.tan(sweep / 4) * radius;
  const a = { x: center.x + radius * Math.cos(start), y: center.y + radius * Math.sin(start) };
  const b = { x: center.x + radius * Math.cos(end), y: center.y + radius * Math.sin(end) };

  return [
    a,
    { x: a.x - handle * Math.sin(start), y: a.y + handle * Math.cos(start) },
    { x: b.x + handle * Math.sin(end), y: b.y - handle * Math.cos(end) },
    b,
  ];
}

function circularWavyWaveCount(diameter, strokeWidth, wavelength) {
  const circumference = Math.PI * Math.max(0, diameter - strokeWidth);

  return wavelength > 0 ? Math.min(256, Math.max(5, Math.round(circumference / wavelength))) : 5;
}

function createCircularWavyGeometry(waves) {
  const vertices = Array.from({ length: waves * 2 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / waves;
    const radius = i % 2 === 0 ? 1 : 0.75;

    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
  });

  const corners = vertices.map((vertex, i) => {
    const previous = vertices[(i + vertices.length - 1) % vertices.length];
    const next = vertices[(i + 1) % vertices.length];
    const length = Math.hypot(previous.x - vertex.x, previous.y - vertex.y);
    const u = { x: (previous.x - vertex.x) / length, y: (previous.y - vertex.y) / length };
    const v = { x: (next.x - vertex.x) / length, y: (next.y - vertex.y) / length };
    const halfAngle = Math.acos(Math.max(-1, Math.min(1, u.x * v.x + u.y * v.y))) / 2;
    const cut = (i % 2 === 0 ? 0.35 : 0.5) / Math.tan(halfAngle);

    return { vertex, u, v, length, halfAngle, cut, extra: 0 };
  });

  const fit = Math.min(
    1,
    ...corners.map((corner, i) => corner.length / (corner.cut + corners[(i + 1) % corners.length].cut)),
  );
  corners.forEach((corner, i) => {
    corner.cut *= fit;
    corner.extra = i % 2 === 0 ? corner.cut * 0.4 : 0;
  });

  const smoothingFit = Math.min(
    1,
    ...corners.map((corner, i) => {
      const next = corners[(i + 1) % corners.length];

      return corner.extra + next.extra > 0
        ? Math.max(0, corner.length - corner.cut - next.cut) / (corner.extra + next.extra)
        : 1;
    }),
  );

  corners.forEach((corner) => (corner.extra *= smoothingFit));

  const curves = [];
  let firstPeak = 0;

  corners.forEach((corner, i) => {
    const { vertex, u, v, cut, extra, halfAngle } = corner;
    const radius = cut * Math.tan(halfAngle);
    const centerDistance = cut / (1 + u.x * v.x + u.y * v.y);
    const center = { x: vertex.x + (u.x + v.x) * centerDistance, y: vertex.y + (u.y + v.y) * centerDistance };

    const start = { x: vertex.x + u.x * cut, y: vertex.y + u.y * cut };
    const direction = Math.sign(v.x * u.y - v.y * u.x);
    const turn = direction * (Math.PI - halfAngle * 2);
    const angle = Math.atan2(start.y - center.y, start.x - center.x);
    const inset = (turn * extra) / (2 * (cut + extra));
    const segments = 2 * Math.max(1, Math.ceil(Math.abs(turn - 2 * inset) / (Math.PI / 2)));
    const rounded = Array.from({ length: segments }, (_, j) =>
      arcCubic(center, radius, angle + inset + ((turn - 2 * inset) * j) / segments, (turn - 2 * inset) / segments),
    );

    const entry = { x: vertex.x + u.x * (cut + extra), y: vertex.y + u.y * (cut + extra) };
    const exit = { x: vertex.x + v.x * (cut + extra), y: vertex.y + v.y * (cut + extra) };

    if (curves.length > 0) {
      const previous = curves[curves.length - 1][3];

      if (Math.hypot(entry.x - previous.x, entry.y - previous.y) > 1e-9) {
        curves.push([
          previous,
          interpolatePoint(previous, entry, 1 / 3),
          interpolatePoint(previous, entry, 2 / 3),
          entry,
        ]);
      }
    }

    if (extra > 1e-9) {
      const end = rounded[0][0];
      const tangentAngle = angle + inset;
      const handle = Math.hypot(end.x - entry.x, end.y - entry.y) / 3;

      curves.push([
        entry,
        { x: entry.x - u.x * handle, y: entry.y - u.y * handle },
        {
          x: end.x + direction * Math.sin(tangentAngle) * handle,
          y: end.y - direction * Math.cos(tangentAngle) * handle,
        },
        end,
      ]);
    }

    if (i === 0) firstPeak = curves.length + segments / 2;
    curves.push(...rounded);

    if (extra > 1e-9) {
      const start2 = rounded[rounded.length - 1][3];
      const tangentAngle = angle + turn - inset;
      const handle = Math.hypot(exit.x - start2.x, exit.y - start2.y) / 3;

      curves.push([
        start2,
        {
          x: start2.x - direction * Math.sin(tangentAngle) * handle,
          y: start2.y + direction * Math.cos(tangentAngle) * handle,
        },
        { x: exit.x - v.x * handle, y: exit.y - v.y * handle },
        exit,
      ]);
    }
  });

  const end = curves[curves.length - 1][3];
  const start = curves[0][0];

  if (Math.hypot(end.x - start.x, end.y - start.y) > 1e-9) {
    curves.push([end, interpolatePoint(end, start, 1 / 3), interpolatePoint(end, start, 2 / 3), start]);
  }

  const ordered = [...curves.slice(firstPeak), ...curves.slice(0, firstPeak)];
  const outerRadius = Math.hypot(ordered[0][0].x, ordered[0][0].y);
  const normalize = (p) => ({ x: p.x / outerRadius, y: p.y / outerRadius });
  const star = ordered.map((curve) => [
    normalize(curve[0]),
    normalize(curve[1]),
    normalize(curve[2]),
    normalize(curve[3]),
  ]);

  const circle = star.map((curve) => {
    const startAngle = Math.atan2(curve[0].y, curve[0].x);
    const endAngle = Math.atan2(curve[3].y, curve[3].x);
    const sweep = (endAngle - startAngle + 2 * Math.PI) % (2 * Math.PI);

    return arcCubic({ x: 0, y: 0 }, 1, startAngle, sweep);
  });

  const innerRadius = Math.min(
    ...star.flatMap((curve) => [Math.hypot(curve[0].x, curve[0].y), Math.hypot(curve[3].x, curve[3].y)]),
  );
  let maxDeformation = 1 / (1 - innerRadius);

  star.forEach((curve, i) => {
    for (let j = 0; j < 3; j++) {
      const p = circle[i][j];
      const q = circle[i][j + 1];
      const dp = { x: curve[j].x - p.x, y: curve[j].y - p.y };
      const dq = { x: curve[j + 1].x - q.x, y: curve[j + 1].y - q.y };
      const a = cross(dp, dq);
      const b = cross(dp, q) + cross(p, dq);
      const c = cross(p, q);
      const discriminant = b * b - 4 * a * c;
      let roots = [];

      if (Math.abs(a) < 1e-12) {
        if (b < 0) roots = [-c / b];
      } else if (discriminant >= 0) {
        roots = [(-b - Math.sqrt(discriminant)) / (2 * a), (-b + Math.sqrt(discriminant)) / (2 * a)];
      }

      for (const root of roots) {
        if (root > 1) maxDeformation = Math.min(maxDeformation, root);
      }
    }
  });

  return { star, circle, maxDeformation };
}

function circularWavyPath(geometry, radius, center, deformation) {
  const fraction = Math.max(0, Math.min(deformation, geometry.maxDeformation));
  const curves = geometry.star.map((curve, i) =>
    curve.map((p, j) => {
      const point = interpolatePoint(geometry.circle[i][j], p, fraction);
      return { x: center + point.x * radius, y: center + point.y * radius };
    }),
  );

  return (
    `M ${curves[0][0].x},${curves[0][0].y} ` +
    curves
      .map((curve) => `C ${curve[1].x},${curve[1].y} ${curve[2].x},${curve[2].y} ${curve[3].x},${curve[3].y}`)
      .join(" ") +
    " Z"
  );
}

/* ============ CircularWavyMotion.ts 逐行照抄（6s 不定态运动） ============ */
const CIRCULAR_WAVY_INDETERMINATE_DURATION = 6;

function circularWavyMotion(elapsed, waveCount) {
  const cycle = elapsed % CIRCULAR_WAVY_INDETERMINATE_DURATION;

  const minSweep = 0.1 * 360;
  const maxSweep = 0.87 * 360;
  const halfCycle = CIRCULAR_WAVY_INDETERMINATE_DURATION / 2;
  const sweep =
    cycle < halfCycle
      ? minSweep + (maxSweep - minSweep) * (cycle / halfCycle)
      : maxSweep - (maxSweep - minSweep) * cubicEasing((cycle - halfCycle) / halfCycle, 0.2, 0, 0, 1);

  const quarter = Math.floor(cycle / 1.5);
  const quarterProgress = Math.min((cycle % 1.5) / 0.3, 1);
  const rotation = (cycle / CIRCULAR_WAVY_INDETERMINATE_DURATION) * 1080 + (quarter + quarterProgress) * 90;

  const waveOffset = (elapsed / waveCount) % 1;
  const progress = sweep / 3.6;

  return {
    sweep,
    rotation,
    waveRotation: -waveOffset * 360,
    dashOffset: -waveOffset * 100,
    dashArray: `${progress} ${100 - progress}`,
  };
}
</script>

<script setup>
import { computed, getCurrentInstance, markRaw, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch } from "vue";

defineOptions({ inheritAttrs: false });

/* ProgressIndicatorVariant.ts / LinearProgressMode.ts 逐行。 */
const isVariant = (v) => v === "flat" || v === "wavy";
const isLinearMode = (v) => v === "determinate" || v === "indeterminate" || v === "buffer" || v === "query";

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  /* KIMA 命名层：determinate（默认）| indeterminate | buffer | query = 官方 linear
   * mode 透传；circular = 官方 m3e-circular-progress-indicator。 */
  mode: { type: String, default: "determinate" },
  /* circular 官方 indeterminate 布尔；linear 的 indeterminate 由 mode 表达。 */
  indeterminate: { type: Boolean, default: false },
  bufferValue: { type: Number, default: 0 },
  variant: { type: String, default: "flat" },
  label: { type: String, default: "" },
});

const attrs = useAttrs();
const isCustomElement = Boolean(getCurrentInstance()?.ce);
const forwardedAttrs = computed(() => (isCustomElement ? { ...attrs, id: undefined } : attrs));

/* 官方 #maskId：每实例唯一（line wavy 的 SVG mask 引用）。 */
const uid = getCurrentInstance()?.uid ?? 0;

/* #applyVariant / #applyMode 逐行：非法值回落官方默认。 */
const variant = computed(() => (isVariant(props.variant) ? props.variant : "flat"));
const isCircular = computed(() => props.mode === "circular");
const linearMode = computed(() => (isLinearMode(props.mode) ? props.mode : "determinate"));
/* 官方语义：circular 看 indeterminate 布尔；linear 的 indeterminate/query 都是不定态。 */
const indeterminate = computed(() =>
  isCircular.value ? props.indeterminate : linearMode.value === "indeterminate" || linearMode.value === "query",
);

const safeMax = computed(() => (Number.isFinite(props.max) && props.max > 0 ? props.max : 100));
const clampedValue = computed(() => Math.max(0, Math.min(props.value, safeMax.value)));
const safeBufferValue = computed(() => Math.max(0, Math.min(props.bufferValue, safeMax.value)));
const wavyProgressValue = computed(() => wavyProgress(clampedValue.value, safeMax.value));

/* ============ 量测缓存（官方私有字段 + ResizeController） ============
 * 官方探针是架构决策：cssprop 只能通过 DOM 布局读像素。 */
const root = ref(null);
const amplitudeProbe = ref(null);
const strokeProbe = ref(null);
const diameterProbe = ref(null);

const measured = ref({ width: 0, strokeWidth: 0, amplitude: 0, wavelength: 0, diameter: 0 });
let resizeObserver = null;

const wavyAmplitude = new WavyAmplitude();
let spinnerStart = undefined;
let rafId = 0;

/* ============ 圆环 wavy 不定态：AnimationLoopController 逐行等价 ============ */
const spinnerNodes = { svg: null, active: null, track: null };

/* #syncWavyAnimation 逐行：重绑节点 + 重置相位。 */
function bindSpinnerNodes() {
  spinnerStart = undefined;
  spinnerNodes.svg = null;
  spinnerNodes.active = null;
  spinnerNodes.track = null;

  if (!(isCircular.value && variant.value === "wavy" && indeterminate.value)) return;
  const el = root.value;
  if (!el) return;
  spinnerNodes.svg = markRaw(el.querySelector(".progress > svg") ?? null);
  spinnerNodes.active = markRaw(el.querySelector(".spinner.active-track") ?? null);
  spinnerNodes.track = markRaw(el.querySelector(".spinner.track") ?? null);
}

/* #updateDiameterAndStroke / #updateAmplitudeAndWavelength / #updateStroke 逐行。 */
function readProbes() {
  const el = root.value;
  if (!el) return;
  const next = { ...measured.value };

  const stroke = strokeProbe.value;
  if (stroke) {
    next.strokeWidth = stroke.clientHeight;
    next.width = Math.round(stroke.getBoundingClientRect().width);
  }
  const aw = amplitudeProbe.value;
  if (aw) {
    next.amplitude = aw.clientHeight;
    next.wavelength = aw.clientWidth;
  }
  const ds = diameterProbe.value;
  if (ds) {
    if (variant.value === "wavy") {
      const style = getComputedStyle(ds);
      const diameter = parseFloat(style.width);
      const strokeWidth = parseFloat(style.height);

      if (Number.isFinite(diameter)) next.diameter = diameter;
      if (Number.isFinite(strokeWidth)) next.strokeWidth = strokeWidth;
    } else {
      next.diameter = ds.clientWidth;
      next.strokeWidth = ds.clientHeight;
    }
  }

  measured.value = next;
}

/* #getTargetAmplitude 逐行。 */
function targetAmplitude() {
  return wavyAmplitudeTarget(wavyProgressValue.value, measured.value.amplitude, indeterminate.value);
}

function wavyCircleWaveCount() {
  return circularWavyWaveCount(measured.value.diameter, measured.value.strokeWidth, measured.value.wavelength);
}

/* #updateWavyIndeterminateSpinner 逐行：直接写 SVG 节点，不重渲染。 */
function applySpinnerFrame(t) {
  if (spinnerStart === undefined) spinnerStart = t;

  const motion = circularWavyMotion(t - spinnerStart, wavyCircleWaveCount());

  if (spinnerNodes.svg) spinnerNodes.svg.style.transform = `rotate(${motion.rotation}deg)`;
  if (spinnerNodes.active) {
    spinnerNodes.active.setAttribute("stroke-dasharray", motion.dashArray);
    spinnerNodes.active.setAttribute("stroke-dashoffset", `${motion.dashOffset}`);
    spinnerNodes.active.style.transform = `rotate(${motion.waveRotation}deg)`;
  }
  if (spinnerNodes.track) {
    spinnerNodes.track.setAttribute(
      "d",
      drawArc({ gap: measured.value.strokeWidth * 2, startAngle: motion.sweep }).path,
    );
  }
}

/* #updateWavyAnimation 逐行：morph 采样 + spinner 帧驱动，静止即停。 */
function tick(t) {
  if (wavyAmplitude.sample(t)) measured.value = { ...measured.value };

  if (isCircular.value && variant.value === "wavy" && indeterminate.value) {
    applySpinnerFrame(t);
    rafId = requestAnimationFrame(tick);
  } else if (wavyAmplitude.animating) {
    rafId = requestAnimationFrame(tick);
  } else {
    rafId = 0;
  }
}

/* #syncWavyAmplitude / #syncWavyAnimation：setTarget + 按需启动循环。 */
function ensureLoop() {
  if (variant.value !== "wavy") {
    wavyAmplitude.reset();
    return;
  }
  wavyAmplitude.setTarget(targetAmplitude(), performance.now() / 1000);
  const needsFrames = wavyAmplitude.animating || (isCircular.value && indeterminate.value);
  if (needsFrames && !rafId) rafId = requestAnimationFrame(tick);
}

/* ============ 圆环几何（官方 #drawArc / #drawWavyPath / #sizeToDegrees） ============ */
function computeCircle(padding) {
  return createCircularProgressCircle(measured.value.diameter, measured.value.strokeWidth, variant.value, padding);
}

function sizeToDegrees(size, padding = measured.value.amplitude) {
  return circularProgressSizeToDegrees(size, computeCircle(padding).r);
}

function drawArc(options) {
  const { padding = measured.value.amplitude, ...rest } = options;
  return circularProgressArc(measured.value.diameter, measured.value.strokeWidth, variant.value, {
    ...rest,
    padding,
  });
}

let geometryCache = null;
let geometryWaveCount = 0;

/* #drawWavyPath 逐行：unit 几何缓存，waveCount 变更才重建。 */
function drawWavyPath() {
  if (measured.value.diameter === 0 || measured.value.strokeWidth === 0) return { path: "", viewBox: "0 0 0 0" };

  const circle = computeCircle(0);
  const waveCount = wavyCircleWaveCount();

  if (!geometryCache || geometryWaveCount !== waveCount) {
    geometryCache = createCircularWavyGeometry(waveCount);
    geometryWaveCount = waveCount;
  }

  const amplitude = wavyAmplitude.value ?? targetAmplitude();

  return {
    path: circularWavyPath(geometryCache, circle.r, circle.cx, amplitude / 1.6),
    viewBox: `0 0 ${measured.value.diameter} ${measured.value.diameter}`,
  };
}

/* ============ 线形渲染（官方 LinearProgressIndicatorElement render 同构） ============ */
const progressVars = computed(() => ({
  "--_translate-x": `-${(clampedValue.value / safeMax.value) * measured.value.width}px`,
  "--_value": `${(clampedValue.value / safeMax.value) * 100}%`,
  "--_buffer-value": `${(safeBufferValue.value / safeMax.value) * 100}%`,
}));

/* render() 逐行：waveWidth 三态（indeterminate/query 全宽；determinate 活段+3λ）。 */
function linearWave() {
  if (variant.value !== "wavy" || measured.value.strokeWidth <= 0 || measured.value.wavelength <= 0) return null;

  const activeWidth = (clampedValue.value / safeMax.value) * measured.value.width;
  const waveWidth =
    linearMode.value === "indeterminate" || linearMode.value === "query"
      ? measured.value.width
      : activeWidth + measured.value.wavelength * 3;
  const amplitude = wavyAmplitude.value ?? targetAmplitude();

  return linearWavyPath({
    width: waveWidth,
    strokeWidth: measured.value.strokeWidth,
    configuredAmplitude: measured.value.amplitude,
    amplitude,
    wavelength: measured.value.wavelength,
  });
}

/* determinate/buffer 且 value<=0 时官方不渲染 primary（nothing 分支）。 */
const showPrimary = computed(
  () => !((linearMode.value === "determinate" || linearMode.value === "buffer") && clampedValue.value <= 0),
);
/* buffer 且 bufferValue<=0 时官方不渲染 secondary。 */
const showSecondary = computed(() => linearMode.value !== "buffer" || safeBufferValue.value > 0);
/* value>0 时官方在 determinate/buffer 尾部补 gap+stop（端点方块）。 */
const showStop = computed(
  () => (linearMode.value === "determinate" || linearMode.value === "buffer") && clampedValue.value > 0,
);
const isDeterminateLike = computed(() => linearMode.value === "determinate" || linearMode.value === "buffer");

/* ============ 圆环渲染（官方 render 同构） ============ */
/* flat determinate：minDegrees 夹底 + 双弧（active + track）。 */
const circularFlat = computed(() => {
  const minDegrees = sizeToDegrees(measured.value.strokeWidth * 2);
  let degrees = (clampedValue.value / safeMax.value) * 360;

  if (degrees > 0) {
    degrees = Math.max(0, minDegrees, degrees);
  }

  const active = drawArc({ gap: degrees < 360 ? measured.value.strokeWidth : 0, endAngle: degrees });
  const inactive = drawArc({
    gap: degrees > 0 ? measured.value.strokeWidth : 0,
    startAngle: degrees,
    endAngle: 360,
  });

  return { degrees, minDegrees, active, inactive };
});

/* flat indeterminate：左右两个半圆（官方 -45°~90°+sw 与 -sw°~135° 两弧）。 */
const circularFlatIndeterminate = computed(() => {
  const left = drawArc({ startAngle: -45, endAngle: 90 + measured.value.strokeWidth });
  const right = drawArc({ startAngle: -measured.value.strokeWidth, endAngle: 135 });
  return { left, right };
});

/* wavy determinate：morph 星形 active（dash 按 progress 归一）+ track 弧。 */
const circularWavy = computed(() => {
  const minDegrees = sizeToDegrees(measured.value.strokeWidth * 2);
  const progress = wavyProgressValue.value;
  const degrees = progress * 360;
  const amplitude = wavyAmplitude.value ?? targetAmplitude();

  const active = drawWavyPath();
  const inactive = drawArc({
    gap: degrees > 0 ? measured.value.strokeWidth * 2 : 0,
    startAngle: degrees,
    endAngle: 360,
  });

  return { degrees, minDegrees, progress, amplitude, active, inactive };
});

/* wavy indeterminate 初始 d（后续帧由 rAF 直写节点）。 */
const circularWavyIndeterminate = computed(() => ({ active: drawWavyPath() }));

const waveDuration = computed(() => `${wavyCircleWaveCount()}s`);

/* ============ 生命周期（connectedCallback / updated 同构） ============ */
onMounted(() => {
  readProbes();
  resizeObserver = new ResizeObserver(() => {
    readProbes();
    ensureLoop();
  });
  if (root.value) resizeObserver.observe(root.value);
  bindSpinnerNodes();
  ensureLoop();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (rafId) cancelAnimationFrame(rafId);
});

/* updated()：mode/variant/indeterminate 变化 → 重读探针 + 重绑 + 官方 amplitude 同步。 */
watch([() => props.mode, () => props.variant, () => props.indeterminate], () => {
  nextTick(() => {
    readProbes();
    bindSpinnerNodes();
    ensureLoop();
  });
});

watch([() => props.value, () => props.max, () => props.bufferValue], () => {
  ensureLoop();
});
</script>

<template>
  <div
    ref="root"
    class="kima-progress"
    :class="[
      isCircular ? 'kima-progress--circular' : 'kima-progress--linear',
      `kima-progress--${variant}`,
      isCircular ? {} : `kima-progress--${linearMode}`,
      { 'kima-progress--indeterminate': indeterminate },
    ]"
    role="progressbar"
    :aria-valuemin="0"
    :aria-valuenow="indeterminate ? undefined : clampedValue"
    :aria-valuemax="safeMax"
    :aria-label="attrs['aria-label'] || label || undefined"
    v-bind="forwardedAttrs"
  >
    <!-- ============ 线形（官方 LinearProgressIndicatorElement render 同构）============ -->
    <div v-if="!isCircular" class="progress" aria-hidden="true" :style="progressVars">
      <div v-if="!linearWave()" class="track"></div>
      <template v-if="showPrimary">
        <div class="primary">
          <!-- 官方：跳到 100% 要等 morph 完成（amplitude 归零）才换完成条。 -->
          <template v-if="linearWave() && isDeterminateLike">
            <svg
              v-if="!(safeMax > 0 && clampedValue >= safeMax && wavyAmplitude.value === 0)"
              class="wave"
              :width="linearWave().viewBox.split(' ')[2]"
              :height="linearWave().height"
              :viewBox="linearWave().viewBox"
              preserveAspectRatio="none"
            >
              <path
                class="wave-path"
                :d="linearWave().path"
                stroke="currentColor"
                :stroke-width="measured.strokeWidth"
                fill="none"
                stroke-linecap="round"
              />
            </svg>
          </template>
          <div v-if="linearWave() && isDeterminateLike && safeMax > 0 && clampedValue >= safeMax && wavyAmplitude.value === 0" class="complete"></div>
        </div>
        <div v-if="isDeterminateLike" class="gap"></div>
      </template>
      <div v-if="showSecondary" class="secondary"></div>
      <div v-if="linearMode === 'buffer' && safeBufferValue > 0" class="gap"></div>
      <div v-if="linearMode === 'buffer'" class="buffer"></div>
      <template v-if="showStop">
        <div class="gap"></div>
        <div class="stop"></div>
      </template>
      <svg
        v-if="linearWave() && !isDeterminateLike"
        class="wave"
        :width="linearWave().viewBox.split(' ')[2]"
        :height="linearWave().height"
        :viewBox="linearWave().viewBox"
        preserveAspectRatio="none"
      >
        <mask :id="`kima-progress-mask-${uid}`" maskUnits="userSpaceOnUse" :width="linearWave().viewBox.split(' ')[2]" :height="linearWave().height">
          <rect :width="linearWave().viewBox.split(' ')[2]" :height="linearWave().height" fill="black" />
          <rect class="primary" :height="linearWave().height" fill="white" />
          <rect class="secondary" :height="linearWave().height" fill="white" />
        </mask>
        <mask :id="`kima-progress-mask-${uid}-inverse`" maskUnits="userSpaceOnUse" :width="linearWave().viewBox.split(' ')[2]" :height="linearWave().height">
          <rect :width="linearWave().viewBox.split(' ')[2]" :height="linearWave().height" fill="white" />
          <rect class="primary" :height="linearWave().height" fill="black" />
          <rect class="secondary" :height="linearWave().height" fill="black" />
        </mask>
        <g :mask="`url(#kima-progress-mask-${uid})`">
          <path
            class="wave-path"
            :d="linearWave().path"
            stroke="currentColor"
            :stroke-width="measured.strokeWidth"
            fill="none"
            stroke-linecap="round"
          />
        </g>
        <g :mask="`url(#kima-progress-mask-${uid}-inverse)`">
          <rect class="track" width="100%" :height="measured.strokeWidth" fill="currentColor" />
        </g>
      </svg>
    </div>
    <template v-if="!isCircular">
      <div ref="strokeProbe" class="stroke" aria-hidden="true"></div>
      <div ref="amplitudeProbe" class="amplitude-and-wavelength" aria-hidden="true"></div>
    </template>

    <!-- ============ 圆环 flat（官方 CircularProgressIndicatorElement render 同构）============ -->
    <template v-if="isCircular && variant === 'flat'">
      <!-- indeterminate：左右半圆 + 三层旋转（CSS 动画驱动）。 -->
      <div v-if="indeterminate" class="progress" aria-hidden="true">
        <div class="spinner">
          <div class="left">
            <svg
              class="circle"
              :width="measured.diameter"
              :height="measured.diameter"
              :viewBox="circularFlatIndeterminate.left.viewBox"
            >
              <path
                class="active-track"
                :d="circularFlatIndeterminate.left.path"
                stroke="currentColor"
                :stroke-width="measured.strokeWidth"
                fill="none"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <div class="right">
            <svg
              class="circle"
              :width="measured.diameter"
              :height="measured.diameter"
              :viewBox="circularFlatIndeterminate.right.viewBox"
            >
              <path
                class="active-track"
                :d="circularFlatIndeterminate.right.path"
                stroke="currentColor"
                :stroke-width="measured.strokeWidth"
                fill="none"
                stroke-linecap="round"
              />
            </svg>
          </div>
        </div>
      </div>
      <!-- determinate：单 SVG 双弧。 -->
      <div v-else class="progress" aria-hidden="true">
        <svg :width="measured.diameter" :height="measured.diameter" :viewBox="circularFlat.active.viewBox">
          <path
            v-if="circularFlat.degrees > 0"
            class="active-track"
            :d="circularFlat.active.path"
            stroke="currentColor"
            :stroke-width="measured.strokeWidth"
            fill="none"
            stroke-linecap="round"
          />
          <path
            v-if="360 - circularFlat.degrees >= circularFlat.minDegrees"
            class="track"
            :d="circularFlat.inactive.path"
            stroke="currentColor"
            :stroke-width="measured.strokeWidth"
            fill="none"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <div class="content" aria-hidden="true"><slot></slot></div>
    </template>

    <!-- ============ 圆环 wavy ============ -->
    <template v-if="isCircular && variant === 'wavy'">
      <!-- indeterminate：morph 星形 dash + rAF 直写旋转（官方 CircularWavyMotion）。 -->
      <div v-if="indeterminate" class="progress" aria-hidden="true">
        <svg :width="measured.diameter" :height="measured.diameter" :viewBox="`0 0 ${measured.diameter} ${measured.diameter}`">
          <path
            class="spinner active-track"
            :d="circularWavyIndeterminate.active.path"
            pathLength="100"
            stroke-dasharray="10 90"
            style="transform-origin: center"
            stroke="currentColor"
            :stroke-width="measured.strokeWidth"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
          />
          <path class="spinner track" stroke="currentColor" :stroke-width="measured.strokeWidth" fill="none" stroke-linecap="round" />
        </svg>
      </div>
      <!-- determinate：morph 星形 dash 按 progress + 波动 spin-reverse。 -->
      <svg
        v-else
        class="progress"
        :viewBox="circularWavy.inactive.viewBox"
        aria-hidden="true"
      >
        <g v-if="circularWavy.degrees > 0" class="active-track">
          <path
            :class="{ wave: circularWavy.amplitude > 0 }"
            :style="{ '--_circular-wave-duration': waveDuration }"
            :d="circularWavy.active.path"
            pathLength="100"
            :stroke-dasharray="`${circularWavy.progress * 100} ${(1 - circularWavy.progress) * 100}`"
            stroke="currentColor"
            :stroke-width="measured.strokeWidth"
            stroke-linecap="round"
            stroke-linejoin="round"
            fill="none"
          />
        </g>
        <path
          v-if="360 - circularWavy.degrees >= circularWavy.minDegrees"
          class="track"
          :d="circularWavy.inactive.path"
          stroke="currentColor"
          :stroke-width="measured.strokeWidth"
          fill="none"
          stroke-linecap="round"
        />
      </svg>
      <div class="content" aria-hidden="true"><slot></slot></div>
    </template>

    <!-- 官方量测探针（circular）：width/height 由 token 决定，JS 读像素。 -->
    <template v-if="isCircular">
      <div ref="diameterProbe" class="diameter-and-stroke" aria-hidden="true"></div>
      <div ref="amplitudeProbe" class="amplitude-and-wavelength" aria-hidden="true"></div>
    </template>
  </div>
</template>

<style scoped lang="scss">
/* ============ M3E ProgressElementIndicatorBase + Linear + Circular 逐行照抄 ============
 * :host → .kima-progress；:state(--x) → .kima-progress--x；
 * ${DesignToken.*} → --kima-* token（_tokens.scss progress 块）；
 * --m3e-* cssprop → --kima-progress-*（KIMA 重命名，值照抄）。 */

.kima-progress[hidden] {
  display: none;
}

@media (forced-colors: active) {
  .kima-progress .progress {
    --kima-progress-track-color: GrayText;
    --kima-progress-color: CanvasText;
  }
}

/* ---- 线形 :host（LinearProgressIndicatorElement.ts 85-121）---- */
.kima-progress--linear {
  display: block;
  position: relative;
}
.kima-progress--linear .progress {
  width: 100%;
  height: 100%;
  position: relative;
  align-items: center;
  border-radius: var(--kima-progress-linear-shape, var(--kima-radius-xs));
}
.kima-progress--linear .stroke,
.kima-progress--linear .amplitude-and-wavelength {
  visibility: hidden;
  position: absolute;
}
.kima-progress--linear .stroke {
  width: 100%;
  height: var(--kima-progress-linear-thickness, 4px);
}
.kima-progress--linear .amplitude-and-wavelength {
  height: var(--kima-progress-linear-wavy-amplitude, 3px);
  width: var(
    --_linear-wavy-wavelength,
    var(--kima-progress-linear-wavy-wavelength, 40px)
  );
}
.kima-progress--linear .primary,
.kima-progress--linear .secondary,
.kima-progress--linear .stop {
  height: var(--kima-progress-linear-thickness, 4px);
  border-radius: inherit;
}
.kima-progress--linear .stop {
  aspect-ratio: 1;
  flex: none;
}

/* flat 高度 = 厚度（119-121）。 */
.kima-progress--linear.kima-progress--flat {
  height: var(--kima-progress-linear-thickness, 4px);
}
/* wavy 高度 = 厚度 + 波幅×2（122-128）。 */
.kima-progress--linear.kima-progress--wavy {
  --_linear-wavy-wavelength: var(--kima-progress-linear-wavy-wavelength, 40px);
  height: calc(
    var(--kima-progress-linear-thickness, 4px) +
      calc(var(--_linear-wavy-amplitude, var(--kima-progress-linear-wavy-amplitude, 3px)) * 2)
  );
}
/* wavy 不定态波长 24px（129-132）。 */
.kima-progress--linear.kima-progress--wavy.kima-progress--indeterminate,
.kima-progress--linear.kima-progress--wavy.kima-progress--query {
  --_linear-wavy-wavelength: var(--kima-progress-linear-wavy-indeterminate-wavelength, 24px);
}
.kima-progress--linear.kima-progress--wavy .primary,
.kima-progress--linear.kima-progress--wavy .secondary {
  position: relative;
  height: 100%;
  overflow: hidden;
}
.kima-progress--linear.kima-progress--wavy .complete {
  position: absolute;
  margin: auto;
  top: calc(50% - calc(var(--kima-progress-linear-thickness, 4px) / 2));
  left: 0;
  right: 0;
  height: var(--kima-progress-linear-thickness, 4px);
  border-radius: inherit;
}
.kima-progress--linear.kima-progress--wavy .secondary {
  height: var(--kima-progress-linear-thickness, 4px);
}
.kima-progress--linear .wave {
  position: absolute;
  display: block;
}
.kima-progress--linear .primary .wave,
.kima-progress--linear .secondary .wave {
  margin-inline-start: calc(0px - var(--_linear-wavy-wavelength, 40px));
}
.kima-progress--linear.kima-progress--wavy .wave-path {
  animation: wave-slide 1s linear infinite;
}
@keyframes wave-slide {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(0px - var(--_linear-wavy-wavelength, 40px)));
  }
}

/* determinate/buffer 排布（170-187）。 */
.kima-progress--linear.kima-progress--determinate .progress,
.kima-progress--linear.kima-progress--buffer .progress {
  display: flex;
  overflow: hidden;
}
.kima-progress--linear.kima-progress--determinate .primary,
.kima-progress--linear.kima-progress--buffer .primary {
  width: var(--_value, 0px);
  flex: none;
}
.kima-progress--linear.kima-progress--determinate .gap,
.kima-progress--linear.kima-progress--buffer .gap {
  flex-basis: var(--kima-progress-linear-thickness, 4px);
  flex-shrink: 1;
}
.kima-progress--linear.kima-progress--determinate .secondary,
.kima-progress--linear.kima-progress--buffer .buffer {
  flex: 1 1 auto;
}

/* buffer 打点 mask + 250ms 平移（189-214）。 */
.kima-progress--linear.kima-progress--buffer .buffer {
  flex-shrink: 5;
  height: 100%;
  width: 100%;
  background-color: var(--kima-progress-track-color, var(--kima-color-secondary-container));
  -webkit-mask-image: radial-gradient(
    circle,
    black 0,
    black calc(var(--kima-progress-linear-thickness, 4px) / 2),
    transparent calc(var(--kima-progress-linear-thickness, 4px) / 2)
  );
  mask-image: radial-gradient(
    circle,
    black 0,
    black calc(var(--kima-progress-linear-thickness, 4px) / 2),
    transparent calc(var(--kima-progress-linear-thickness, 4px) / 2)
  );
  -webkit-mask-size: calc(var(--kima-progress-linear-thickness, 4px) * 2) 100%;
  mask-size: calc(var(--kima-progress-linear-thickness, 4px) * 2) 100%;
  mask-repeat: repeat;
  animation: buffer 250ms linear infinite;
}
.kima-progress--linear.kima-progress--buffer .buffer:dir(rtl) {
  transform: scaleX(-1);
}
@keyframes buffer {
  from {
    mask-position: 0 0;
  }
  to {
    mask-position: calc(-1 * calc(var(--kima-progress-linear-thickness, 4px) * 2)) 0;
  }
}
.kima-progress--linear.kima-progress--buffer .secondary {
  width: var(--_buffer-value, 0px);
  flex: none;
}

/* indeterminate/query（219-253）：官方 keyframes 逐帧值照抄。 */
.kima-progress--linear.kima-progress--indeterminate .primary,
.kima-progress--linear.kima-progress--query .primary {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: inherit;
  animation: indeterminate-primary 2.1s infinite linear;
}
.kima-progress--linear.kima-progress--wavy.kima-progress--indeterminate .primary,
.kima-progress--linear.kima-progress--wavy.kima-progress--query .primary {
  animation-name: wavy-indeterminate-primary;
}
.kima-progress--linear.kima-progress--indeterminate .secondary,
.kima-progress--linear.kima-progress--query .secondary {
  position: absolute;
  top: 0;
  height: 100%;
  border-radius: inherit;
  animation: indeterminate-secondary 2.1s infinite linear;
  animation-delay: 1.15s;
  animation-fill-mode: backwards;
}
.kima-progress--linear.kima-progress--wavy.kima-progress--indeterminate .secondary,
.kima-progress--linear.kima-progress--wavy.kima-progress--query .secondary {
  animation-name: wavy-indeterminate-secondary;
}
.kima-progress--linear.kima-progress--indeterminate .progress,
.kima-progress--linear.kima-progress--query .progress {
  overflow: hidden;
  position: relative;
}
/* query = RTL 镜像的 indeterminate（250-253）。 */
.kima-progress--linear.kima-progress--query:dir(rtl) .progress,
.kima-progress--linear.kima-progress--indeterminate:dir(rtl) .progress {
  transform: scaleX(-1);
}

/* 配色（254-273）。 */
.kima-progress--linear.kima-progress--flat .primary,
.kima-progress--linear.kima-progress--flat.kima-progress--indeterminate .secondary,
.kima-progress--linear.kima-progress--flat.kima-progress--query .secondary,
.kima-progress--linear.kima-progress--wavy .complete,
.kima-progress--linear .stop {
  background-color: var(--kima-progress-color, var(--kima-color-primary));
}
.kima-progress--linear.kima-progress--wavy .progress {
  color: var(--kima-progress-color, var(--kima-color-primary));
}
.kima-progress--linear.kima-progress--determinate .secondary,
.kima-progress--linear.kima-progress--buffer .secondary,
.kima-progress--linear.kima-progress--flat.kima-progress--indeterminate .track,
.kima-progress--linear.kima-progress--flat.kima-progress--query .track {
  background-color: var(--kima-progress-track-color, var(--kima-color-secondary-container));
}
.kima-progress--linear.kima-progress--wavy.kima-progress--indeterminate .track,
.kima-progress--linear.kima-progress--wavy.kima-progress--query .track {
  color: var(--kima-progress-track-color, var(--kima-color-secondary-container));
  y: calc(50% - calc(var(--kima-progress-linear-thickness, 4px) / 2));
  border-radius: inherit;
}
.kima-progress--linear.kima-progress--flat.kima-progress--indeterminate .track,
.kima-progress--linear.kima-progress--flat.kima-progress--query .track {
  position: absolute;
  margin: auto;
  top: calc(50% - calc(var(--kima-progress-linear-thickness, 4px) / 2));
  left: 0;
  right: 0;
  height: var(--kima-progress-linear-thickness, 4px);
  border-radius: inherit;
}

/* 官方 indeterminate keyframes（289-360）逐帧值照抄。 */
@keyframes indeterminate-primary {
  0% {
    left: -145.167%;
    width: 8%;
  }
  20% {
    left: -113.333%;
    width: 48%;
  }
  60% {
    left: 56.333%;
    width: 78%;
  }
  100% {
    left: 100%;
    width: 8%;
  }
}
@keyframes indeterminate-secondary {
  0% {
    left: -54.888%;
    width: 8%;
  }
  20% {
    left: -20%;
    width: 48%;
  }
  60% {
    left: 60%;
    width: 78%;
  }
  100% {
    left: 160%;
    width: 8%;
  }
}
@keyframes wavy-indeterminate-primary {
  0% {
    transform: translateX(-145.167%);
    width: 8%;
  }
  20% {
    transform: translateX(-113.333%);
    width: 48%;
  }
  60% {
    transform: translateX(56.333%);
    width: 78%;
  }
  100% {
    transform: translateX(100%);
    width: 8%;
  }
}
@keyframes wavy-indeterminate-secondary {
  0% {
    transform: translateX(-54.888%);
    width: 8%;
  }
  20% {
    transform: translateX(-20%);
    width: 48%;
  }
  60% {
    transform: translateX(60%);
    width: 78%;
  }
  100% {
    transform: translateX(160%);
    width: 8%;
  }
}

/* ---- 圆环 :host（CircularProgressIndicatorElement.ts 77-93）---- */
.kima-progress--circular {
  display: inline-flex;
  vertical-align: middle;
  aspect-ratio: 1;
  position: relative;
  align-items: center;
  justify-content: center;
}
.kima-progress--circular .progress {
  --_arc-duration: 1333ms;
  --_cycle-duration: calc(4 * var(--_arc-duration));
  --_linear-rotate-duration: calc(var(--_arc-duration) * 360 / 306);
  --_indeterminate-easing: cubic-bezier(0.4, 0, 0.2, 1);
}
.kima-progress--circular .active-track {
  transition: stroke-dashoffset 500ms cubic-bezier(0, 0, 0.2, 1);
}
.kima-progress--circular.kima-progress--flat .progress {
  flex: 1;
  align-self: stretch;
  pointer-events: none;
}
.kima-progress--circular .progress,
.kima-progress--circular .spinner,
.kima-progress--circular .left,
.kima-progress--circular .right,
.kima-progress--circular .content,
.kima-progress--circular .circle {
  position: absolute;
  inset: 0;
}
.kima-progress--circular .content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.kima-progress--circular .diameter-and-stroke,
.kima-progress--circular .amplitude-and-wavelength {
  visibility: hidden;
  position: absolute;
}
.kima-progress--circular .diameter-and-stroke {
  width: inherit;
  height: var(--kima-progress-circular-thickness, 4px);
}
.kima-progress--circular .amplitude-and-wavelength {
  width: var(--kima-progress-circular-wavy-amplitude, 1.6px);
  height: var(--kima-progress-circular-wavy-wavelength, 15px);
}
/* 直径（131-136）：flat 40px / wavy 48px。 */
.kima-progress--circular.kima-progress--flat {
  width: var(--kima-progress-circular-flat-diameter, 40px);
}
.kima-progress--circular.kima-progress--wavy {
  width: var(--kima-progress-circular-wavy-diameter, 48px);
}
/* flat indeterminate 三层旋转（137-145）。 */
.kima-progress--circular.kima-progress--flat.kima-progress--indeterminate .progress {
  animation: linear infinite linear-rotate;
  animation-duration: var(--_linear-rotate-duration);
}
.kima-progress--circular.kima-progress--flat.kima-progress--indeterminate .spinner {
  animation: infinite both rotate-arc;
  animation-duration: var(--_cycle-duration);
  animation-timing-function: var(--_indeterminate-easing);
}
.kima-progress--circular.kima-progress--wavy.kima-progress--indeterminate .progress > svg {
  transform-origin: center;
}
.kima-progress--circular.kima-progress--wavy.kima-progress--indeterminate .active-track {
  transition: none;
}
/* 左右半圆（152-175）。 */
.kima-progress--circular .left {
  clip-path: inset(0);
  inset: 0 50% 0 0;
}
.kima-progress--circular .right {
  clip-path: inset(0);
  inset: 0 0 0 50%;
}
.kima-progress--circular .circle {
  animation: expand-arc;
  animation-iteration-count: infinite;
  animation-fill-mode: both;
  animation-duration: var(--_arc-duration), var(--_cycle-duration);
  animation-timing-function: var(--_indeterminate-easing);
}
.kima-progress--circular .left .circle {
  rotate: 135deg;
  inset: 0 -100% 0 0;
}
.kima-progress--circular .right .circle {
  rotate: 100deg;
  inset: 0 0 0 -100%;
  animation-delay: calc(-0.5 * var(--_arc-duration)), 0ms;
}
/* 轨道/前景配色（176-181）。 */
.kima-progress--circular .track {
  color: var(--kima-progress-track-color, var(--kima-color-secondary-container));
}
.kima-progress--circular .active-track {
  color: var(--kima-progress-color, var(--kima-color-primary));
}
/* wavy determinate 波动（182-185）：每波 8s/波数。 */
.kima-progress--circular .wave {
  animation: spin-reverse var(--_circular-wave-duration, 8s) linear infinite;
  transform-origin: 50% 50%;
}
/* 官方圆环 keyframes（186-245）逐帧值照抄。 */
@keyframes expand-arc {
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
@keyframes rotate-arc {
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
@keyframes linear-rotate {
  to {
    transform: rotate(360deg);
  }
}
@keyframes spin-reverse {
  from {
    transform: rotate(360deg);
    stroke-dashoffset: 0;
  }
  to {
    transform: rotate(0deg);
    stroke-dashoffset: -100;
  }
}

/* 官方 flat forced-colors（246-254）。 */
@media (forced-colors: active) {
  .kima-progress--circular.kima-progress--flat circle {
    fill: Canvas;
  }
  .kima-progress--circular.kima-progress--flat .circle {
    border-color: var(--kima-progress-color, var(--kima-color-primary))
      var(--kima-progress-color, var(--kima-color-primary)) Canvas Canvas;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kima-progress--linear .wave-path,
  .kima-progress--linear.kima-progress--buffer .buffer,
  .kima-progress--linear.kima-progress--indeterminate .primary,
  .kima-progress--linear.kima-progress--indeterminate .secondary,
  .kima-progress--linear.kima-progress--query .primary,
  .kima-progress--linear.kima-progress--query .secondary,
  .kima-progress--circular .wave,
  .kima-progress--circular .circle,
  .kima-progress--circular.kima-progress--flat.kima-progress--indeterminate .progress,
  .kima-progress--circular.kima-progress--flat.kima-progress--indeterminate .spinner {
    animation: none;
  }
}
</style>
