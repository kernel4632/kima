/* M3E Progress Indicator 圆环几何（github.com/matraic/m3e，MIT）。
 * 来源：packages/web/src/progress-indicator/CircularProgressGeometry.ts 逐行照抄。
 * 纯函数、无 DOM 依赖——progress.ce.vue（circular 模式）与 spinner.ce.vue
 * （环形 indeterminate 加载动画）共用同一份官方几何。
 *
 * 官方 API 语义（源文件注释逐行保留）：
 *   createCircularProgressCircle(d, sw, variant, padding) → { cx, cy, r, padding }
 *   circularProgressSizeToDegrees(size, r) → 像素长度折角度
 *   circularProgressArc(d, sw, variant, { startAngle, endAngle, gap, padding }) → { path, viewBox }
 * 角度从 12 点钟方向顺时针；单段 A 弧 large-arc = (end-start<=180 ? 0 : 1)、sweep 0。 */

export function createCircularProgressCircle(diameter, strokeWidth, variant, padding) {
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

export function circularProgressSizeToDegrees(size, radius) {
  return radius > 0 ? size * (360 / (2 * Math.PI * radius)) : 0;
}

function polarToCartesian(circle, degrees) {
  const rad = (degrees - 90) * (Math.PI / 180);

  return {
    x: circle.cx + circle.r * Math.cos(rad),
    y: circle.cy + circle.r * Math.sin(rad),
  };
}

export function circularProgressArc(diameter, strokeWidth, variant, { startAngle = 0, endAngle = 360, gap = 0, padding = 0 }) {
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
