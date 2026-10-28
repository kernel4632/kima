/*
主题色：KIMA 全部颜色的唯一来源。
两个地方共用这一个文件，所以角色名单只写一遍：
  1. scripts/palette.js —— 构建期生成 src/styles/_palette.scss（首屏和 SSR 用的默认色）
  2. 运行时 applyPalette() —— 用户换主题色时直接改写 CSS 变量，不用重新构建
调用示例：
  import { applyPalette } from "./utils/theme";
  applyPalette("#61afef", { isDark: true });       // 换成青蓝
  applyPalette("#ffffff", { variant: "monochrome" }); // 换成纯灰度
*/
import {
  Hct,
  SchemeTonalSpot,
  SchemeMonochrome,
  SchemeNeutral,
  MaterialDynamicColors,
  argbFromHex,
  hexFromArgb,
} from "@material/material-color-utilities";

// 默认主题色。想改默认值只改这里。
export const defaultSeed = "#61afef";

// 默认配色风格。需要纯灰度主题时由使用者调用
// applyPalette("#ffffff", { variant: "monochrome" })，不要改这里的默认值。
export const defaultVariant = "tonal-spot";

// 只生成组件真正用得到的角色，每一条写清它管什么，加新角色时照着往下加。
export const paletteRoles = [
  ["surface", "页面背景"],
  ["surfaceContainerLowest", "最低层容器"],
  ["surfaceContainerLow", "低层容器"],
  ["surfaceContainer", "主容器"],
  ["surfaceContainerHigh", "高层容器"],
  ["surfaceContainerHighest", "最高层容器"],
  ["onSurface", "主文字"],
  ["onSurfaceVariant", "次要文字"],
  ["outline", "强描边"],
  ["outlineVariant", "弱描边"],
  ["primary", "主操作"],
  ["onPrimary", "主操作上的文字"],
  ["primaryContainer", "柔和主操作"],
  ["onPrimaryContainer", "柔和主操作上的文字"],
  ["secondaryContainer", "次操作"],
  ["onSecondaryContainer", "次操作上的文字"],
  ["tertiaryContainer", "强调色"],
  ["onTertiaryContainer", "强调色上的文字"],
  ["error", "危险操作"],
  ["onError", "危险操作上的文字"],
  ["errorContainer", "危险柔和"],
  ["onErrorContainer", "危险柔和上的文字"],
  ["inverseSurface", "反色表面（提示条）"],
  ["inverseOnSurface", "反色表面上的文字"],
  ["scrim", "抽屉背后的遮罩"],
];

// 配色风格。换风格只改调用时传的名字，不用碰下面的逻辑。
const generators = {
  "tonal-spot": SchemeTonalSpot,
  monochrome: SchemeMonochrome,
  neutral: SchemeNeutral,
};

/** 驼峰角色名转 CSS 变量用的连字符写法：surfaceContainerHigh → surface-container-high */
export function cssName(role) {
  return role.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

/**
 * 用种子色生成一整套颜色。
 * @param {string} seed 种子色，例如 "#61afef"
 * @param {object} [options]
 * @param {boolean} [options.isDark] 生成深色还是浅色那一套
 * @param {string} [options.variant] 配色风格：tonal-spot / monochrome / neutral
 * @returns {Record<string, string>} 角色名 → 十六进制颜色，例如 { surface: "#131313" }
 */
export function generatePalette(seed, { isDark = true, variant = defaultVariant } = {}) {
  const Scheme = generators[variant] || SchemeTonalSpot;
  const scheme = new Scheme(Hct.fromInt(argbFromHex(seed)), isDark, 0);

  // 注意：error 系列不去色。语义色（危险/成功/警告）是功能性的，像交通灯，
  // 不该因为主题是黑白的就变成灰——那样徽章的"危险"和"中性"会长得一样，
  // 用户没法一眼区分"3 条未读"和"3 条错误"。
  // 品牌色（primary / secondary / 容器色）才跟着种子和风格走。
  const palette = {};
  for (const [role] of paletteRoles) {
    palette[cssName(role)] = hexFromArgb(MaterialDynamicColors[role].getArgb(scheme));
  }
  return palette;
}

/**
 * 把一套颜色写成 CSS 变量。可以选深色或浅色，写到哪个元素上。
 * @param {string} seed 种子色
 * @param {object} [options]
 * @param {boolean} [options.isDark] true 写深色（默认），false 写浅色
 * @param {string} [options.variant] 配色风格
 * @param {HTMLElement} [options.target] 写到哪个元素上，默认是 <html>
 * @returns {Record<string, string>} 生成的颜色，方便调用方复用
 */
export function applyPalette(seed, { isDark = true, variant = defaultVariant, target } = {}) {
  const palette = generatePalette(seed, { isDark, variant });
  const element = target || document.documentElement;

  // 运行时换色是"页面已经画好了再换"，整块界面要一起过渡过去；
  // 构建期生成 _palette.scss 不走这里，首屏不该有过渡。
  markThemeSwitching(element);

  for (const [name, value] of Object.entries(palette)) {
    element.style.setProperty(`--kima-color-${name}`, value);
  }
  return palette;
}
/** 清掉运行时写上的颜色，恢复成 _palette.scss 里的默认值。 */
export function resetPalette(target) {
  const element = target || document.documentElement;
  for (const [role] of paletteRoles) {
    element.style.removeProperty(`--kima-color-${cssName(role)}`);
  }
}

/* 主题切换的统一颜色过渡：换色前把根元素标记成 .kima-theme-switching，
 * _tokens.scss 里那条规则会在这 240ms 内接管所有元素的颜色过渡，
 * 整个界面一起换色，不会出现"一半先到、一半后到"。清掉再重设而不是
 * 叠加计时器：快速连点两次主题，最后只有一个计时器在跑。 */
let switchingTimer = 0;

export function markThemeSwitching(target) {
  const element = target || document.documentElement;
  element.classList.add("kima-theme-switching");
  window.clearTimeout(switchingTimer);
  switchingTimer = window.setTimeout(() => element.classList.remove("kima-theme-switching"), 240);
}
