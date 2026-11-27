# 组件删减：第一批（9 个入口）

本轮将公开入口从 145 个收缩到 136 个。分档为 core 43、extras 80、experimental 13。
这是未发布开发线上的破坏性 API 变更：删除文件、具名导出、自定义元素注册、分档条目与专属演示，不提供同名兼容空壳。历史提交仍可用于追溯旧实现。

## 保留组件的标准

公开组件必须承担值得复用的交互、状态管理、无障碍或设计系统约束。
组合其他组件不等于低价值；使用原生 HTML 语义也不等于低价值。
只有换名包装、重复接口或纯页面排版的入口，不为了数量继续维护。

## 已移除与替代方式

| 旧 slug | 处置与替代 |
| --- | --- |
| `mark` | 使用原生语义标记与宿主局部样式；需要安全关键词匹配时使用 [highlight](../src/components/display/highlight.ce.vue:1) |
| `kbd` | 使用原生键盘语义标签排版，不再维护快捷键展示组件 |
| `aspect-ratio` | 使用原生 CSS 宽高比和媒体填充能力，不需要自定义元素运行时 |
| `gradient-text` | 纯装饰退出组件库；有实际需求时由宿主局部样式实现 |
| `stack` | 合并到 [flex](../src/components/foundation/flex.ce.vue:1)：纵向使用 `direction="column" wrap="nowrap"`，横向使用 `direction="row" wrap="nowrap"`；间距与对齐接口不变 |
| `time-select` | 使用 [select](../src/components/core/select.ce.vue:1) 的时间选项数据；选择器页面保留预设时刻演示 |
| `native-select` | 使用 [select](../src/components/core/select.ce.vue:1) 或 [multi-select](../src/components/interaction/multi-select.ce.vue:1)；若确需系统菜单，宿主直接使用原生控件 |
| `datetime-picker` | 不再以原生日期时间输入薄包装交付“完整选择器”；按需组合日期与时间字段，由宿主维护本地日期时间模型和校验 |
| `datetime-range-picker` | 起止日期时间是组合表单；使用现有字段与 [form](../src/components/form-completion/form.ce.vue:1)，起止顺序校验留在宿主规则中 |

移除系统输入包装不表示新组合自动覆盖旧接口的全部规则。日期时间的拼接、必填、上下限、步长、起止顺序及表单名称需要由使用方明确处理；不制造时区或 DST 支持的承诺。

## 有效示例迁移

- 弹性布局页同时演示横向自动换行、纵向不换行，不再单独保留堆叠页。
- 选择器页增加上午、午间与禁用时刻选项，保留清除和键盘交互。
- 纯装饰不另建公开组件或专属文档路由；原生排版能力直接交给宿主。

## 尚未执行的下一批

结果页、聚合进度、时间展示需要另一步审查。只保留实际有复用的计算或交互，不把每个删除的组件原样搬成工具函数，也不把全部能力塞进万能组件。

维护档位只是投入优先级，不是验收证明；数量下降也不等于剩余组件已经全部通过读屏、跨浏览器或视觉验收。

## 本轮验证

- 站点生产构建、组件库构建通过；产物核验 136 个组件、13 项检查通过，注册表与源码集合完全一致。
- 默认冒烟冷启动复跑 6.6 秒；SSR 16/16；真实 tarball 隔离消费者 22/22。
- 生产站路由检查 136/136，无页面运行错误；9 个删除路由不再展示组件或演示。
- 截图套件通过；另查看 1440 与 390 宽度下的弹性布局、预设时刻选择和保留的期间输入页面。
- 当前矩阵 136 行且与源码入口一一对应；组件源码文档链接无断链。

第一批主要减少公开 API 与维护面。全量独立包为 3,831,356 字节，gzip 936,144 字节；并非重型引擎拆包，因此不承诺显著体积收益。

# 组件删减：第二批（100 个入口，裁员到 30 个原语）

本轮将公开入口从 130 个收缩到 30 个。分档为 core 30、extras 0、experimental 0。
判据：Grok 官方有独立组件实锤（docs/grok-component-reference.md）且是不可组合替代的行为原语。
可组合件（级联=菜单嵌套、通知=dialog 定制、评分=图标组合等）与官方无对应的扩展件全部移除；
组合用法改由文档站演示（gallery 场景页）展示。依赖同步裁剪：codemirror/tiptap/highlight.js/katex/qrcode 系全部移除。

## 保留 30 清单

button icon-button checkbox radio-group switch slider text-field textarea select combobox menu
dialog drawer popover tooltip progress spinner skeleton avatar badge divider icon link card
typography tabs table tree calendar collapsible

## 第三批：原语合并（30 → 29，icon-button 并入 button）

用户裁决升级原则：**有共同特征的原语应提取合并，组件靠组合表达**。
button 本身可以承载空内容/纯文字/纯图标/图文——独立图标按钮组件是冗余。

- `icon-button` 删除。KimaButton 吸收其能力：
  - 新变体 `standard`（透明底 + hover wash，原图标钮默认肤）
  - 新 prop `icon-only`（纯图标方形几何：aspect-ratio 1、min-width 收掉、图标居中）
  - 新 prop `label`（可访问名落 aria-label）
- 纯图标按钮的组合表达：`<kima-button icon-only label="设置"><KimaIcon :icon="..." /></kima-button>`
- 消费者迁移：App.vue（移动端目录钮）、base-examples（演示块改组合教学）、
  gallery.vue（查看文件钮）；dialog/drawer 的关闭钮本来就是 button+icon 组合，无需动。
- catalog.js 的死映射（旧 136 时代残留 21 个已删组件条目）顺手清理成 30 清单同步。

## 第四批回补：breadcrumb（M3E 全源码复刻，2026-11）

第二批把 breadcrumb 按"link 组合件"删除。重审 M3E 源码（BreadcrumbElement.ts 166 行 +
BreadcrumbItemElement.ts 259 行 + BreadcrumbItemButtonElement.ts 273 行）后确认它有
不可组合的行为面，按原语标准回补为**两个入口**（官方 index.ts 同样导出两个元素）：

- `breadcrumb`：末项 current 追踪（item 增删/移动后自动改写 aria-current）、
  自定义分隔符克隆分发、wrap 折行——容器级状态机，link 排一排表达不出。
- `breadcrumb-item`：role 三态（link/button/无）、current 项摘除全部交互反馈、
  伪链接全铺层（原生中键/右键行为）、icon-only 判定（单元素 ≤28×28）、
  space/Enter 合成 click、禁用移出 tab 序、单行省略截断。

官方无溢出折叠/overflow 菜单（M3E 文档与源码均无此能力；仅有 wrap 属性与
单项 text-overflow 省略），不需接 KIMA menu 做溢出。逐行翻译与实测对表记录
见 [src/components/navigation/breadcrumb.ce.vue](../src/components/navigation/breadcrumb.ce.vue:1)
文件头注释。
