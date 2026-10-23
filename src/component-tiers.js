/* 组件分档：唯一来源。
 *
 * 分档解决的是一件事：145 个入口不可能都按最高水位维护。
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
 */
export const componentTiers = {
  core: [
    "alert",
    "avatar",
    "badge",
    "breadcrumb",
    "button",
    "button-group",
    "card",
    "checkbox",
    "checkbox-group",
    "config-provider",
    "date-picker",
    "dialog",
    "divider",
    "drawer",
    "empty-state",
    "field",
    "field-group",
    "flex",
    "form",
    "grid",
    "icon",
    "icon-button",
    "link",
    "menu",
    "notification",
    "number-field",
    "pagination",
    "popover",
    "progress",
    "radio-group",
    "select",
    "skeleton",
    "slider",
    "spinner",
    "stack",
    "switch",
    "table",
    "tabs",
    "text-field",
    "textarea",
    "time-picker",
    "tooltip",
    "typography",
    "visually-hidden",
  ],
  extras: [
    "accordion",
    "alert-dialog",
    "anchor",
    "app-shell",
    "avatar-group",
    "back-top",
    "banner",
    "calendar",
    "carousel",
    "cascader",
    "chart",
    "chip",
    "code-block",
    "code-editor",
    "collapsible",
    "color-picker",
    "combobox",
    "command",
    "context-menu",
    "copy-button",
    "date-field",
    "date-range-picker",
    "datetime-picker",
    "datetime-range-picker",
    "descriptions",
    "dynamic-input",
    "editable",
    "error-state",
    "file-upload",
    "float-button",
    "heatmap",
    "hover-card",
    "image",
    "image-preview",
    "infinite-scroll",
    "input-group",
    "json-input",
    "layout",
    "list",
    "listbox",
    "loading-overlay",
    "log-viewer",
    "long-text",
    "masked-input",
    "mention",
    "menubar",
    "multi-select",
    "native-select",
    "navigation-menu",
    "notification-queue",
    "overflow-list",
    "page-header",
    "period-picker",
    "pin-input",
    "popconfirm",
    "progress-group",
    "qr-code",
    "range-slider",
    "rating",
    "relative-time",
    "result",
    "rich-text-editor",
    "ring-progress",
    "scroll-area",
    "sidebar",
    "splitter",
    "stepper",
    "tag-group",
    "tags-input",
    "time-field",
    "time-range-picker",
    "time-select",
    "timeline",
    "toggle",
    "toolbar",
    "tour",
    "transfer",
    "tree",
    "tree-select",
    "upload-manager",
    "virtual-scroll",
    "virtual-select",
    "virtual-table",
    "virtual-tree",
  ],
  experimental: [
    "affix",
    "angle-slider",
    "animated-number",
    "aspect-ratio",
    "blockquote",
    "countdown",
    "equation",
    "gradient-text",
    "highlight",
    "kbd",
    "loading-bar",
    "mark",
    "marquee",
    "masonry",
    "statistic",
    "time-display",
    "watermark",
  ],
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
