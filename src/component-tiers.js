/* 组件分档：唯一来源。
 *
 * 分档解决的是一件事：当前全部入口不可能都按最高水位维护。
 * 维护成本要花在"每个应用都会用、而且最代表 KIMA 手感"的那部分上。
 *
 * core（默认注册，最高水位）
 *   每个应用都会用；逐页视觉审查、跨浏览器、键盘与读屏、动画中间帧都要验。
 * extras（按需注册，标准水位）
 *   只有一类应用会用（后台、文档、数据工具…）；保证能渲染、键盘可达、有交互反馈，
 *   不做逐页视觉打磨，也不承诺和 core 同等的边缘情况。
 * experimental（按需注册，低水位）
 *   装饰或单点用途；只保证能渲染、有状态反馈。接口可能随需要调整。
 *
 * 判断规则（加新组件时按顺序问）：
 *   1. 每个应用都会用吗？        会用 → core
 *   2. 只有一类应用会用吗？      会用 → extras
 *   3. 只是原生控件的皮肤或装饰？ 是   → 并进基础控件，或 experimental
 *
 * scripts/components.js 会校验：任何组件漏了分档、或分档里写了不存在的组件，
 * 构建直接失败——所以新增 .ce.vue 必须在这里选一档。
 *
 * 2026-11 裁员：库收缩为「Grok 官方实锤 + 行为原语」30 件。
 * 裁员判据：官方有独立组件、且不可由其他 KIMA 组件组合替代。
 * 可组合件（cascader=menu 组合、notification=dialog 组合、rating=icon 组合…）
 * 与官方无对应的扩展件全部移除；演示页保留组合用法示例。
 */
export const componentTiers = {
  core: [
    "avatar",
    "badge",
    "button",
    "calendar",
    "card",
    "checkbox",
    "collapsible",
    "combobox",
    "dialog",
    "divider",
    "drawer",
    "icon",
    "link",
    "loading-indicator",
    "menu",
    "popover",
    "progress",
    "radio-group",
    "select",
    "shape",
    "skeleton",
    "slider",
    "spinner",
    "switch",
    "table",
    "tabs",
    "text-field",
    "textarea",
    "tooltip",
    "tree",
    "typography",
  ],
  extras: [],
  experimental: [],
};

/* 展示用的档位文案与徽标语气：文档站只认这一份。 */
export const tierMeta = {
  core: { label: "核心", hint: "默认注册，逐页审查" },
  extras: { label: "扩展", hint: "按需注册，标准水位" },
  experimental: { label: "实验", hint: "装饰与长尾，低水位" },
};

const tierByComponent = new Map(
  Object.entries(componentTiers).flatMap(([tier, slugs]) => slugs.map((slug) => [slug, tier])),
);

export function tierOf(slug) {
  return tierByComponent.get(slug) || null;
}
