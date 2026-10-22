# 动效审查 D：123 入口整合与本轮高级能力

本部分记录从既有 82 项审计扩展到当前目录 123 个 `src/components/*.ce.vue` 的维护核对，以及本轮高级能力增强。入口总数由目录实际计数确认；本部分不把专项浏览器结果写成 123 项全量回归。

## 核对范围

- 新增/已整合的 utility、日期/表单、数据/媒体、闭环入口均复用 [`src/utils/motion.js`](../src/utils/motion.js)、全局 popup/list/content 过渡和 `prefers-reduced-motion` 规则。
- [`color-picker.ce.vue`](../src/components/color-picker.ce.vue:1) 的 HSV 二维区、色相、alpha 和输入值需要跟手更新，因此不对拖动、键盘值或光标引入延迟动画；焦点环即时，颜色展示使用 token。
- [`table.ce.vue`](../src/components/table.ce.vue:1) 的排序、筛选、列宽拖动/键盘调整和 summary 是数据语义，保持即时；行增删/重排沿用 list 过渡，loading/data/empty 维持交叉状态并在退场时隔离交互。
- [`select.ce.vue`](../src/components/select.ce.vue:1) 与 [`combobox.ce.vue`](../src/components/combobox.ce.vue:1) 的 loader loading/error/empty 是请求状态，不能延迟结果或焦点；弹层仍使用 popup 过渡，旧请求通过 AbortSignal 和 generation 丢弃。
- [`command.ce.vue`](../src/components/command.ce.vue:1) 的文档搜索结果保持即时过滤；模态 panel/backdrop 使用现有离散过渡，Escape、Enter、方向键和焦点返回不等待动画。

## 专项证据

- [`tests/final-enhancement.spec.js`](../tests/final-enhancement.spec.js:1) 在 5218、桌面/移动 Chromium、2 workers 下 10/10 通过：表格本地/受控排序、隐藏列、键盘列宽和 summary；选择器请求取消与旧结果隔离；combobox 错误重试；文档命令搜索和目录完整度。
- `pnpm build` 通过；`pnpm test:ssr` 10/10 通过。SSR 输出仅有既存 Vite HMR 24678 端口占用 warning，不影响测试结果。
- 构建/库校验和 123 入口计数将在本轮收尾命令中补记；父级 123 组件全量浏览器回归、全量截图、人工读屏、Firefox/WebKit 和真实移动系统仍未在本组运行。

## 快速反向与减少动态效果

- 弹层关闭/重开必须保留 leave 节点直到视觉结束，同时在 leave 开始立即 `inert`/`aria-hidden`；快速反向由共享过渡恢复活动状态。
- 表格行、文档搜索结果和请求状态不使用延迟状态机掩盖实时语义；排序/筛选/请求新结果应立即成为当前状态。
- `prefers-reduced-motion: reduce` 下停止连续旋转/脉冲，popup/list/content 时长降为受控最短值，列宽、拖动、输入和焦点不被动画阻塞。
- 未对静态排版、布局、引用、键盘提示、视觉隐藏和跟手滚动强加装饰动画；动画只承担状态转换、层级进入/退出或重排引导。

## 附加包边界

图表、富文本/代码编辑器、数学公式、业务应用壳、日志远程权限、上传服务端传输和通用 CMS 内容索引需要独立数据模型、渲染/安全策略或宿主服务生命周期，不在核心组件动效审计中伪造为已完成。核心保留稳定接口边界，由附加包或宿主决定请求、权限、数据和业务动画。
