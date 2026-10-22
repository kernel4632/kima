// 布局原语共享白名单：间距只引用现有 token，响应值由 CSS 媒体查询选择，SSR 无视口依赖。
export const foundationBreakpoints = ['base', 'sm', 'md', 'lg'];
const spaces = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
export function choice(value, values, fallback) { return values.includes(value) ? value : fallback; }
export function space(value, fallback = 4) {
  const number = Number(value);
  return `var(--kima-space-${spaces.includes(number) ? number : fallback})`;
}
export function responsive(value, convert, fallback) {
  const values = value && typeof value === 'object' && !Array.isArray(value) ? value : { base: value };
  let current = convert(values.base ?? fallback);
  return foundationBreakpoints.map(key => { if (values[key] !== undefined) current = convert(values[key]); return current; });
}
export function layoutVariables(prefix, key, value, convert, fallback) {
  return Object.fromEntries(responsive(value, convert, fallback).map((item, index) => [`--kima-${prefix}-${key}-${foundationBreakpoints[index]}`, item]));
}
export function columnTemplate(value) {
  const count = Number(value);
  return `repeat(${Number.isInteger(count) && count >= 1 && count <= 24 ? count : 1}, minmax(0, 1fr))`;
}
export function gridAreas(value) {
  if (!Array.isArray(value) || !value.length || value.length > 24) return { template: 'none', names: [], columns: 0 };
  const rows = value.map(row => typeof row === 'string' ? row.trim().split(/\s+/) : []);
  const width = rows[0].length;
  if (!width || rows.some(row => row.length !== width || row.some(cell => !/^(?:[a-zA-Z_][\w-]*|\.)$/.test(cell)))) return { template: 'none', names: [], columns: 0 };
  const names = [...new Set(rows.flat().filter(cell => cell !== '.'))];
  for (const name of names) {
    const points = rows.flatMap((row, y) => row.flatMap((cell, x) => cell === name ? [[y, x]] : []));
    const ys = points.map(point => point[0]), xs = points.map(point => point[1]);
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) for (let x = Math.min(...xs); x <= Math.max(...xs); x++) if (rows[y][x] !== name) return { template: 'none', names: [], columns: 0 };
  }
  return { template: rows.map(row => `"${row.join(' ')}"`).join(' '), names, columns: width };
}
