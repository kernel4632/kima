# KIMA 组件能力对照矩阵

本参考面向维护者和接入者，按当前 [组件目录](../src/components/)逐项核对 **145 个入口**，每个入口只出现一行，包含源码、实际边界和公开目录来源。标签与 Vue 导出见[入口索引](component-index.md)，G00–G50 处置与实际验证状态见[路线图](component-roadmap.md)。

入口存在不表示与参考库 API 等价、最终回归通过或已发布。本次读取本地源码、各组用例与历史公开目录快照；外部来源仍是目录级证据，不声称本次重新访问官网。代码编辑器等没有直接目录证据的本地扩展如实注明，不伪造来源。HOP 约束见[协作规范](../AGENTS.md)；API 默认值由源码提取，不在这里抄写。

## 来源索引（唯一维护处）

矩阵中的 E/N/R/U/A/M/S 指以下来源；后接的是快照中实际出现的原名称。相近能力映射不表示 API 或完整程度相同。版本号、Alpha、New、Deprecated 等目录标记不是名称的一部分，仍应在复核详情时留意成熟度和弃用提示。

| 索引 | 公开入口 | 本地原始证据 | 使用范围 |
| --- | --- | --- | --- |
| E | [Element Plus](https://element-plus.org/en-US/component/overview.html) | [element-plus.json](../artifacts/research/element-plus.json) | 表单、展示、反馈、导航、虚拟化与布局目录 |
| N | [Naive UI](https://www.naiveui.com/en-US/os-theme/components/button) | [naive-ui.json](../artifacts/research/naive-ui.json) | 内容展示、数据输入、反馈和辅助能力目录 |
| R | [Reka UI](https://reka-ui.com/docs/components/accordion) | [reka-ui.json](../artifacts/research/reka-ui.json) | 无样式行为底座；目录中的 Alpha 不等于稳定承诺 |
| U | [Nuxt UI](https://ui.nuxt.com/docs/components) | [nuxt-ui.json](../artifacts/research/nuxt-ui.json) | 基础组件、内容导航、应用结构和业务组合 |
| A | [Ant Design](https://ant.design/components/overview/) | [ant-design.json](../artifacts/research/ant-design.json) | 基础组件、数据交互、应用结构目录；生态站点另分层 |
| M | [Mantine](https://mantine.dev/core/package/) | [mantine.json](../artifacts/research/mantine.json) | core 目录及页面实际链接到的独立能力包入口 |
| S | [shadcn-vue](https://www.shadcn-vue.com/docs/components/accordion.html) | [shadcn-vue.json](../artifacts/research/shadcn-vue.json) | 基础组件、组合模式及单独的业务/AI 目录 |

**未核对：PrimeVue。** [primevue.json](../artifacts/research/primevue.json)没有有效组件目录（只有主页跳转），不得列为第八家已完成来源，也不补写凭记忆推测的条目。

清洗原则：同一个组件的章节锚点和重复链接合并；去除总览、安装、变更日志、编辑链接、社交链接、页脚生态导航及内部工具页面。Button 页中的属性/插槽锚点不另算组件；E 的 Border/Color/Typography 等设计说明、A 的 Util/Changelog 不拿来充当缺失控件。S 的 AI Elements、U 的业务组合以及 A 的生态链接另外分类，不能静默混入核心数量。快照是采集时点证据，不声称以后官网目录不变。

## 145 个入口逐项实现与来源

| slug / 实现证据 | 中文能力 | 实际边界 | 对应来源与原名称 |
| --- | --- | --- | --- |
| [accordion](../src/components/navigation/accordion.ce.vue:1) | 多项折叠 | 单开/多开、禁用、键盘列表焦点；内容关闭后保留挂载 | R Accordion；U Accordion；E Collapse |
| [affix](../src/components/utility/affix.ce.vue:1) | 固钉定位 | 上下 sticky、偏移、状态通知；受父容器/滚动祖先约束，不逃逸为 fixed | E/N/A/M Affix |
| [alert](../src/components/display/alert.ce.vue:1) | 行内警示 | 五种语义、动作插槽与关闭，不自动消失；不是全局横幅调度器 | E Alert；U Alert / Banner；A Alert |
| [alert-dialog](../src/components/utility/alert-dialog.ce.vue:1) | 受保护模态确认 | 复用 dialog、默认取消焦点、异步确认失败保留/重试；业务权限由宿主负责 | R/S Alert Dialog；E Message Box |
| [anchor](../src/components/navigation/anchor.ce.vue:1) | 页内目录 | 窗口/容器滚动定位与章节跟踪；目标需已存在，不重写容器定位历史或主动移正文焦点 | E Anchor；N Anchor；M TableOfContents |
| [angle-slider](../src/components/form-completion/angle-slider.ce.vue:1) | 角度输入 | 角度环绕、指针/键盘及原生提交；不是图形编辑器 | M AngleSlider |
| [animated-number](../src/components/utility/animated-number.ce.vue:1) | 数字补间 | 真实中间值、快速反向更新、准确终值与减少动效；非趋势图 | N Number Animation；M RollingNumber |
| [app-shell](../src/components/shell/app-shell.ce.vue:1) | 响应式应用壳 | header/sidebar/main/footer 插槽、跳过链接、窄屏模态抽屉；不是商业 Dashboard 模板 | M AppShell；U Header / Footer / Main / Sidebar |
| [aspect-ratio](../src/components/display/aspect-ratio.ce.vue:1) | 固定宽高比 | 内容比例容器，非法比例回退；不负责图片裁剪编辑 | R Aspect Ratio；M AspectRatio；S Aspect Ratio |
| [avatar](../src/components/display/avatar.ce.vue:1) | 头像 | 图片失败回退到文字/图标，可访问姓名；不默认可点击 | E Avatar；R Avatar；U Avatar |
| [avatar-group](../src/components/display/avatar-group.ce.vue:1) | 头像组 | 数组/插槽组合、数量折叠；不是成员管理或溢出成员弹层 | U AvatarGroup |
| [back-top](../src/components/navigation/back-top.ce.vue:1) | 返回顶部 | 阈值显隐、窗口/容器滚动与减少动效；不是通用悬浮动作组 | E Backtop；N Back Top |
| [badge](../src/components/core/badge.ce.vue:1) | 徽章 | 文本、计数上限与圆点；不是可移除筛选芯片 | E Badge；N Badge；A Badge |
| [banner](../src/components/foundation/banner.ce.vue:1) | 持久横幅 | 文档流提示、动作、关闭/恢复；不做全局调度或自动消失 | U Banner；E/N/A Alert 相邻 |
| [blockquote](../src/components/display/blockquote.ce.vue:1) | 引用内容 | 引文、作者、来源与语义；不是富文本或 Markdown 解析器 | M Blockquote |
| [breadcrumb](../src/components/navigation/breadcrumb.ce.vue:1) | 面包屑 | 有序真链接、末项当前位置；没有测宽自动省略或路径路由推导 | E Breadcrumb；U Breadcrumb；M Breadcrumbs |
| [button](../src/components/core/button.ce.vue:1) | 操作按钮 | 原生按钮、变体、加载/禁用、表单动作；不接管业务请求 | E Button；U Button；S Button |
| [button-group](../src/components/core/button-group.ce.vue:1) | 分段单选/多选按钮组 | 方向键、横竖布局；不是新增一个 Segmented 才算覆盖 | E Segmented；R Toggle Group；M SegmentedControl |
| [calendar](../src/components/advanced-input/calendar.ce.vue:1) | 独立内联日历 | 本地单日、网格键盘、月/年翻页、上下限/禁用日与表单；非多日选择 | E/N/U/R/S Calendar |
| [card](../src/components/core/card.ce.vue:1) | 卡片 | 内容分区和可点击容器；不是完整页面模板 | E Card；U Card；S Card |
| [carousel](../src/components/navigation/carousel.ce.vue:1) | 手动轮播 | 前后按钮、方向键、可循环和计数；没有自动播放、触摸滑动或图片预览 | E Carousel；N Carousel；U Carousel |
| [cascader](../src/components/core/cascader.ce.vue:1) | 级联路径选择 | 层级列、路径值、禁用、清除；表单仅提交路径末值，无内置异步请求管理 | E Cascader；N Cascader；A Cascader |
| [chart](../src/components/content/chart.ce.vue:1) | 有限规模图表 | line/bar/area/scatter、负值/缺值、图例/键盘/数据表；无缩放平移、堆叠/饼图/聚合 | U Chart；S Chart / Charts；A Charts 为独立生态 |
| [checkbox](../src/components/core/checkbox.ce.vue:1) | 单个复选框 | 原生提交、必填、半选外观；组级规则另看复选组 | E Checkbox；R Checkbox；A Checkbox |
| [checkbox-group](../src/components/input/checkbox-group.ce.vue:1) | 复选组 | 同名多值、至少一项校验、禁用与方向；没有组级全选、最大选中数配置 | U CheckboxGroup；E Checkbox；N Checkbox |
| [chip](../src/components/interaction/chip.ce.vue:1) | 静态/筛选/移除芯片 | 独立选择与移除按钮、表单/重置；移除由宿主执行，不把所有徽章视作交互芯片 | E Tag；M Chip；R Tag Group（仅相邻集合能力） |
| [code-block](../src/components/core/code-block.ce.vue:1) | 只读代码展示 | 复制、行号、换行与有限语言着色；未知语言纯文本，不是编辑器/日志流 | N Code；S Code Block；M Code（相邻展示能力） |
| [code-editor](../src/components/content/code-editor.ce.vue:1) | 代码编辑 | CodeMirror 6、JS/JSON/HTML/CSS、查找/替换/历史/选区与表单；不执行代码，无远程补全/IDE | 本地扩展；七库快照没有直接代码编辑器证据，M Extensions 仅研究入口 |
| [collapsible](../src/components/navigation/collapsible.ce.vue:1) | 单块折叠 | 独立开关与正文；不承担多项联动 | R Collapsible；U Collapsible；M Collapse |
| [color-picker](../src/components/form-completion/color-picker.ce.vue:1) | HSV 颜色编辑 | 二维 HSV、色相/alpha、HEX 输入、RGB/HSL 只读读数；无 RGB/HSL 输入模式/调色板/取色器/多色彩空间，不宣称新增交互全量验收 | E Color Picker；N Color Picker；M ColorInput / ColorPicker |
| [combobox](../src/components/core/combobox.ce.vue:1) | 可输入单选/自动补全 | 本地过滤、自由文本、清除、表单；可选 loader 支持防抖、取消、乱序保护、重试和状态；仍不是多选 | E Autocomplete；R Combobox；S Combobox |
| [command](../src/components/interaction/command.ce.vue:1) | 命令面板 | 模态、本地搜索、多字段分组、键盘执行；不注册全局快捷键、不做远程命令请求 | U CommandPalette；S Command |
| [config-provider](../src/components/shell/config-provider.ce.vue:1) | 局部应用配置 | 主题种子、locale、方向、减少动效作用域；不是全库文案翻译或服务注册器 | E/N/A Config Provider；U App / Theme / LocaleSelect |
| [context-menu](../src/components/interaction/context-menu.ce.vue:1) | 上下文动作菜单 | 右键/长按/菜单键、嵌套子菜单与 checkbox/radio；动作由宿主执行 | R Context Menu；U ContextMenu；S Context Menu |
| [copy-button](../src/components/data/copy-button.ce.vue:1) | 通用复制 | Clipboard 成功/失败反馈；依赖浏览器权限和安全上下文 | M CopyButton |
| [countdown](../src/components/display/countdown.ce.vue:1) | 截止倒计时 | 截止时间、可选天数、到时事件；SSR 占位，非服务端校时或安全截止依据 | N Countdown |
| [date-field](../src/components/form-completion/date-field.ce.vue:1) | 分段日期输入 | 年月日分段、键盘/完整性校验与原生提交；本地公历，无时区转换 | R Date Field；U InputDate |
| [date-picker](../src/components/core/date-picker.ce.vue:1) | 单日选择 | 本地单日、月历弹层、上下限与表单；范围/独立日历/日期时间由其他入口提供，无时区模型 | E Date Picker；R Date Picker；S Date Picker |
| [date-range-picker](../src/components/advanced-input/date-range-picker.ce.vue:1) | 日期范围 | 双月内联、起止原生输入、未完成范围/禁用日校验；不是弹出式范围面板 | R Date Range Picker / Date Range Field / Range Calendar；S Range Calendar |
| [datetime-picker](../src/components/advanced-input/datetime-picker.ce.vue:1) | 本地日期时间 | 原生 datetime-local、本地分钟值、上下限/step/reset；不接受 offset/Z/epoch，不提供 DST 策略 | E DateTime Picker；N Date Picker 同族 |
| [datetime-range-picker](../src/components/form-completion/datetime-range-picker.ce.vue:1) | 本地日期时间范围 | 起止本地值、顺序校验、原生上下限，step 按秒；不转换时区 | E DateTime Picker 同族；范围作为本地扩展，不由目录名称证明等价 |
| [descriptions](../src/components/display/descriptions.ce.vue:1) | 键值详情列表 | 语义键值、列数与内容插槽；不是表单字段或可编辑详情页 | E Descriptions；N Descriptions；M DataList |
| [dialog](../src/components/core/dialog.ce.vue:1) | 模态对话框 | 原生模态平面、关闭策略和插槽；确认业务由宿主组合，不等于独立 Alert Dialog 契约 | E Dialog；R Dialog；A Modal |
| [divider](../src/components/core/divider.ce.vue:1) | 语义分隔线 | 横竖、内缩和文字；不是视觉隐藏辅助 | E Divider；R Separator；U Separator |
| [drawer](../src/components/core/drawer.ce.vue:1) | 底部/侧边抽屉 | 模态、遮罩、底部把手拖关和吸附点；侧抽屉不提供底部高度吸附 | E Drawer；U Drawer / Slideover；S Drawer / Sheet |
| [dynamic-input](../src/components/form-completion/dynamic-input.ce.vue:1) | 动态对象行 | 增删/移动、行身份、作用域插槽；非嵌套 schema/错误引擎，不宣称完整外部回写和原生 reset | N Dynamic Input |
| [editable](../src/components/advanced-input/editable.ce.vue:1) | 行内编辑 | 显示/草稿、保存/取消、异步失败保留和焦点返回；失焦不自动保存 | R Editable |
| [empty-state](../src/components/core/empty-state.ce.vue:1) | 空状态 | 图标、说明、行动插槽；不是错误路由系统 | E Empty；U Empty；M EmptyState |
| [equation](../src/components/content/equation.ce.vue:1) | 数学公式 | KaTeX 输出 MathML、安全错误与资源命令限制；无任意宏/HTML 输出，依赖浏览器数学字体 | N Equation |
| [error-state](../src/components/foundation/error-state.ce.vue:1) | 显式错误恢复 | 异步重试/resetKey、旧结果隔离；不是能跨 CE app 捕获错误的 Error Boundary | U Error；E/N/A Result 相邻 |
| [field](../src/components/input/field.ce.vue:1) | 字段说明/错误关联 | 关联插槽内真实控件描述与错误，不绘制可见标签；**不是表单状态机或校验引擎** | R Field；U FormField；S Field（仅辅助能力对照） |
| [field-group](../src/components/foundation/field-group.ce.vue:1) | 语义字段分组 | fieldset/legend、组描述/错误关联及原生 validity 聚合；不画输入标签或执行 schema | U FieldGroup；M Fieldset |
| [file-upload](../src/components/input/file-upload.ce.vue:1) | 文件选择与拖入 | 本地类型/体积/数量检查和原生 FileList；任务管理由 upload-manager 承担，传输/服务端校验由宿主负责 | E Upload；U FileUpload；M FileInput / FileButton |
| [flex](../src/components/foundation/flex.ce.vue:1) | 弹性布局 | 方向/换行/对齐及 token 间距；不自动换序或增加底色 | N/A/M Flex |
| [float-button](../src/components/utility/float-button.ce.vue:1) | 悬浮动作组 | 展开动作、禁用跳过、Escape/外点关闭与焦点恢复；无业务批量动作管理 | A FloatButton；N Float Button；M ActionBar 相邻 |
| [form](../src/components/form-completion/form.ce.vue:1) | 表单协调与规则 | 原生 validity、dirty/touched、同步/异步 rules、过期字段结果隔离；无 schema 适配/嵌套路径和同名多值模型引擎 | E/N/A/R/U Form；M Form 独立包；S 表单集成 |
| [gradient-text](../src/components/shell/gradient-text.ce.vue:1) | 渐变文字 | 主题 token 渐变与减少动效回退；装饰能力，不改变文字语义 | N Gradient Text |
| [grid](../src/components/foundation/grid.ce.vue:1) | 响应式栅格 | 列数/间距及 areas 命名区域、声明顺序投影；不是最短列瀑布流 | N/A/M Grid；E Layout |
| [heatmap](../src/components/content/heatmap.ce.vue:1) | 热力图 | 二维强度、缺失值、图例/键盘/数据表；无地理地图/统计聚合 | N Heatmap；U/S Chart 相邻 |
| [highlight](../src/components/display/highlight.ce.vue:1) | 关键词高亮 | 纯文本关键词、大小写选项；不是正则搜索、语法着色或 HTML 渲染 | N Highlight；M Highlight |
| [hover-card](../src/components/interaction/hover-card.ce.vue:1) | 悬浮资料预览 | 延时、面板停留、聚焦/触屏访问；仅补充资料，关键操作用交互面板 | R Hover Card；M HoverCard；S Hover Card |
| [icon](../src/components/core/icon.ce.vue:1) | 统一图标 | Hugeicons 数据、尺寸与线宽；不是额外图标库或远程图标下载服务 | E Icon；N Icon；U Icon |
| [icon-button](../src/components/core/icon-button.ce.vue:1) | 图标动作按钮 | 可访问名、变体、加载/禁用；不是悬浮动作组 | M ActionIcon；N Use icons as buttons（Button 页示例） |
| [image](../src/components/display/image.ce.vue:1) | 响应式图片 | 原生图片、替代文字、懒加载、加载/失败态与图注；**无预览灯箱/缩放/画廊** | E Image；N Image；M Image |
| [image-preview](../src/components/data/image-preview.ce.vue:1) | 图片预览 | 图组、键盘、缩放/旋转/reset、打开聚焦/关闭返回；仅声明 aria-modal，当前未见 Tab 圈定/背景 inert/showModal，模态隔离待完善；无手势编辑/裁剪 | E/N/A Image 同族，目录不证明全部预览细节 |
| [infinite-scroll](../src/components/data/infinite-scroll.ce.vue:1) | 无限加载协调 | 防重复加载、结束/错误/重试、按钮替代；数据请求由宿主提供，不等于虚拟化 | E/N Infinite Scroll |
| [input-group](../src/components/foundation/input-group.ce.vue:1) | 复合输入排版 | prefix/default/suffix、真实子控件；不生成可见标签或第二层输入表面 | S Input Group；U FieldGroup 相邻 |
| [json-input](../src/components/form-completion/json-input.ce.vue:1) | JSON 文本输入 | 解析错误、格式化与纯文本模型；不执行代码，无 schema/树编辑 | M JsonInput |
| [kbd](../src/components/display/kbd.ce.vue:1) | 快捷键提示 | 按键组合展示；不注册全局快捷键 | U Kbd；M Kbd；S Kbd |
| [layout](../src/components/core/layout.ce.vue:1) | 页面宽度容器 | 最大宽/间距/内边距；grid/flex/stack/app-shell 分别提供其他布局能力 | E Layout Container；N Layout；U Container |
| [link](../src/components/navigation/link.ce.vue:1) | 文本链接 | 真链接、新窗口安全关系、禁用与当前位置；不内置路由器 | E Link；U Link；M Anchor（文本链接，不是页内目录） |
| [list](../src/components/display/list.ce.vue:1) | 内容列表 | 有序/无序、标题/说明与行动插槽；没有分页、虚拟化或数据请求 | N List；M List；S Item（内容条目相邻） |
| [listbox](../src/components/utility/listbox.ce.vue:1) | 内联选择组 | 单/多选、roving 焦点、禁用跳过及原生提交/reset；不虚拟化 | R Listbox；U Listbox |
| [loading-bar](../src/components/utility/loading-bar.ce.vue:1) | 加载生命周期条 | 任务计数与完成/错误生命周期；路由/请求由宿主显式接入 | N Loading Bar |
| [loading-overlay](../src/components/interaction/loading-overlay.ce.vue:1) | 区域加载遮罩 | 保留内容节点、区域忙碌状态、可选区域隔离/焦点恢复；不是全页请求拦截器 | E Loading；M LoadingOverlay |
| [log-viewer](../src/components/utility/log-viewer.ce.vue:1) | 本地日志查看 | 追加/裁剪、暂停跟尾、过滤/导出；server auth/transport 由宿主负责 | N Log |
| [long-text](../src/components/data/long-text.ce.vue:1) | 长文本收展 | 行截断与显式展开/收起；不代替按项溢出列表 | N Ellipsis；M Spoiler |
| [mark](../src/components/foundation/mark.ce.vue:1) | 行内标记 | 原生 mark 语义、字面文本/插槽；不解析 HTML 或切分关键词 | M Mark |
| [marquee](../src/components/shell/marquee.ce.vue:1) | 可选跑马灯 | 默认静态、显式启用、悬停/焦点暂停、减少动效与副本隔离；非默认持续运动 | N/M/U Marquee |
| [masked-input](../src/components/form-completion/masked-input.ce.vue:1) | 固定掩码输入 | 数字/字母/字母数字占位与完整性检查；不宣称所有光标/IME/任意掩码行为完整 | M MaskInput |
| [masonry](../src/components/shell/masonry.ce.vue:1) | 列优先瀑布流 | 响应式列、尺寸变化、原生子节点；列优先阅读/焦点顺序，不做最短列平衡 | A Masonry；M 布局族相邻 |
| [mention](../src/components/advanced-input/mention.ce.vue:1) | 文本提及 | 光标片段替换、IME/键盘、本地候选；远程取消/乱序由宿主负责 | E/N Mention；A Mentions |
| [menu](../src/components/core/menu.ce.vue:1) | 嵌套动作/选择菜单 | 搜索、单值选择、子菜单、checkbox/radio、键盘；不是页面路由或任意 Mega Menu | E Dropdown；N Dropdown / Popselect；R Dropdown Menu |
| [menubar](../src/components/interaction/menubar.ce.vue:1) | 应用操作菜单栏 | 菜单间/内及子菜单键盘、checkbox/radio；页面导航另用 navigation-menu | R Menubar；M Menubar；S Menubar |
| [multi-select](../src/components/interaction/multi-select.ce.vue:1) | 自绘多选 | 本地过滤、移除/清空、键盘、同名多值表单；禁用已选项保留，没有虚拟化/远程加载 | M MultiSelect；U SelectMenu（同类选择入口，非等价断言） |
| [native-select](../src/components/input/native-select.ce.vue:1) | 系统选择器 | 原生单/多选、系统交互与表单；不承诺跨系统一致面板，不提供自绘搜索 | M NativeSelect；S Native Select |
| [navigation-menu](../src/components/navigation/navigation-menu.ce.vue:1) | 嵌套页面导航 | 嵌套真链接、展开/当前项、键盘与窄屏；不推导路由权限或任意 Mega Menu 版式 | R Navigation Menu；U NavigationMenu；S Navigation Menu |
| [notification](../src/components/core/notification.ce.vue:1) | 单条通知 | 自动/手动关闭、悬停/聚焦暂停；容量/队列/去重由独立 notification-queue 提供 | E Message / Notification；N Message / Notification；R Toast |
| [notification-queue](../src/components/utility/notification-queue.ce.vue:1) | 通知队列 | 容量/去重/堆叠与实例 push/update/dismiss；不默认全局单例或持久化 | E/N/A Message / Notification；R Toast；S Sonner / Toast |
| [number-field](../src/components/input/number-field.ce.vue:1) | 数值输入 | 原生数值框与增减、步长和边界校验；没有货币掩码或任意精度十进制引擎 | R Number Field；E Input Number；M NumberInput |
| [overflow-list](../src/components/navigation/overflow-list.ce.vue:1) | 按项收纳列表 | 超过配置项数后展开/收起；**不测量宽度，不是布局容器或文本省略** | M OverflowList |
| [page-header](../src/components/foundation/page-header.ce.vue:1) | 页头行动区 | 标题层级、面包屑/动作插槽；不控制路由或整页模板 | E/N Page Header；U PageHeader |
| [pagination](../src/components/core/pagination.ce.vue:1) | 分页导航 | 总数、页大小、页码省略和前后页；不拉取数据，不提供页大小编辑器 | E Pagination；R Pagination；A Pagination |
| [period-picker](../src/components/form-completion/period-picker.ce.vue:1) | 月年及范围输入 | 原生 month/number、单值/范围和顺序；非月年网格，边界依赖原生 validity | R Month Picker / Month Range Picker / Year Picker / Year Range Picker |
| [pin-input](../src/components/input/pin-input.ce.vue:1) | 验证码输入简版 | **单个原生输入框**，长度/字符过滤、粘贴、自动填充与完成事件；不是多格独立焦点模型，不负责验证码发送或验证 | R Pin Input；S Input OTP / Pin Input；M PinInput |
| [popconfirm](../src/components/interaction/popconfirm.ce.vue:1) | 操作旁确认 | 默认聚焦取消、显式确认/取消事件；异步业务、失败重试由宿主负责，不等于模态确认 | E Popconfirm；N Popconfirm；A Popconfirm |
| [popover](../src/components/interaction/popover.ce.vue:1) | 非模态锚定交互面板 | 定位翻转、焦点进出、外点/退出关闭；不传送到页面根，仍需复核祖先裁剪环境 | E Popover；R Popover；S Popover |
| [progress](../src/components/core/progress.ce.vue:1) | 线性进度 | 原生确定/不确定进度；不是环形/多段进度组 | E Progress；R Progress；U Progress |
| [progress-group](../src/components/utility/progress-group.ce.vue:1) | 任务进度组 | 任务权重汇总与进度显示；不管理请求或任务执行 | U ProgressGroup |
| [qr-code](../src/components/utility/qr-code.ce.vue:1) | 二维码编码 | 实际编码 SVG、更新和容量错误；不是扫码/身份校验服务 | A QRCode；N QR Code |
| [radio-group](../src/components/input/radio-group.ce.vue:1) | 原生单选组 | 方向键跳过禁用、必填、横竖与表单；不是分段按钮外观别名 | R Radio Group；U RadioGroup；E Radio |
| [range-slider](../src/components/advanced-input/range-slider.ce.vue:1) | 双手柄范围 | 双端值、步长、碰撞停止、原生键盘/表单；不交换手柄身份 | M RangeSlider；E/R Slider 同族 |
| [rating](../src/components/input/rating.ce.vue:1) | 整星评分 | 原生单选组、只读、清空与必填；没有半星/任意小数评分 | E Rate；N Rate；M Rating |
| [relative-time](../src/components/data/relative-time.ce.vue:1) | 相对时间 | Intl 相对时间、定时刷新/清理；无服务端校时 | N Time |
| [result](../src/components/display/result.ce.vue:1) | 操作结果 | 图标、标题、说明与行动；不处理路由异常或服务端错误恢复 | E Result；N Result；A Result |
| [rich-text-editor](../src/components/content/rich-text-editor.ce.vue:1) | 富文本编辑 | Tiptap/ProseMirror、清洗 HTML 模型、真实选区/历史/表单；getJSON 只读，无 Markdown/协作/资源上传 | U Editor 与工具子项；M Extensions 仅研究入口 |
| [ring-progress](../src/components/data/ring-progress.ce.vue:1) | 环形进度 | 单值环形显示与语义；非多段环/半圆全部变体 | M RingProgress / SemiCircleProgress（相邻变体） |
| [scroll-area](../src/components/navigation/scroll-area.ce.vue:1) | 独立滚动区 | 具名原生滚动、高宽限制、横竖/双向；**不虚拟化、不自动加载** | E Scrollbar；R Scroll Area；M ScrollArea |
| [select](../src/components/core/select.ce.vue:1) | 自绘单选选择器 | 可搜索、清空、键盘和表单；可选 loader 支持防抖、AbortSignal、乱序保护、重试和 loading/empty；多选由独立多选组件承担，未虚拟化 | E Select；R Select；U Select |
| [sidebar](../src/components/shell/sidebar.ce.vue:1) | 响应式侧栏 | 嵌套真链接、展开/折叠、可选持久化、移动抽屉；无路由/权限引擎 | U Sidebar / DashboardSidebar；S Sidebar |
| [skeleton](../src/components/display/skeleton.ce.vue:1) | 骨架屏 | 行/头像占位，加载后显示内容、减少动效；不是按真实 DOM 自动测量的骨架生成器 | E Skeleton；U Skeleton；S Skeleton |
| [slider](../src/components/core/slider.ce.vue:1) | 单值滑块 | 原生单手柄、步长、上下限与表单；没有双手柄范围值 | E Slider；R Slider；M Slider |
| [spinner](../src/components/display/spinner.ce.vue:1) | 加载指示器 | 具名状态或纯装饰；不请求数据，不阻止区域交互 | N Spin；M Loader；S Spinner |
| [splitter](../src/components/navigation/splitter.ce.vue:1) | 可调整双分栏 | 指针拖动、键盘、横竖和百分比边界；不是任意多面板停靠布局 | E Splitter；R Splitter；S Resizable |
| [stack](../src/components/foundation/stack.ce.vue:1) | 堆叠布局 | 纵横方向、对齐与 token 间距；不接管子项高度/滚动 | M Stack / Group；N/A Space 相邻 |
| [statistic](../src/components/display/statistic.ce.vue:1) | 统计数值 | 本地化数值、精度、货币/百分比格式、前后缀；不是趋势图或数字动画 | E Statistic；N Statistic；M NumberFormatter |
| [stepper](../src/components/navigation/stepper.ce.vue:1) | 步骤导航 | 当前/完成显示、横竖与线性限制；线性限制不代表业务校验已通过，无步骤表单引擎 | E Steps；R Stepper；M Stepper |
| [switch](../src/components/core/switch.ce.vue:1) | 即时状态开关 | 布尔状态、原生提交；不是工具栏按压按钮 | E Switch；R Switch；A Switch |
| [table](../src/components/data/table.ce.vue:1) | 数据表格 | 筛选/选择/展开/编辑、受控或本地排序、列隐藏、指针/键盘列宽、summary；无固定列/分组表头/行分组/自动分页/虚拟化，服务端管理由宿主负责 | E Table；N Data Table；S Table / Data Table |
| [tabs](../src/components/core/tabs.ce.vue:1) | 标签页与面板 | 横竖、禁用项、方向键和关联面板；不是路由导航系统 | E Tabs；R Tabs；S Tabs |
| [tag-group](../src/components/utility/tag-group.ce.vue:1) | 标签集合行为 | 选择/删除、集合焦点和原生表单/reset；不是富文本标签编辑器 | R Tag Group |
| [tags-input](../src/components/input/tags-input.ce.vue:1) | 标签输入 | 添加/移除、分隔粘贴、去重、上限、输入法；不是提及建议或远程词库 | R Tags Input；E Input Tag；M TagsInput |
| [text-field](../src/components/core/text-field.ce.vue:1) | 单行输入 | 清除、密码显隐、说明/错误、输入法和表单；不生成多行输入/校验规则 | E Input；N Input；M TextInput / PasswordInput |
| [textarea](../src/components/input/textarea.ce.vue:1) | 多行文本输入 | 原生多行、输入法、字数与手动缩放；没有自动高度实现，不再把单行输入误记为多行 | U Textarea；M Textarea；S Textarea |
| [time-display](../src/components/foundation/time-display.ce.vue:1) | 绝对时间格式化 | Intl 日历时间、locale/timeZone 回退；纯日/时不跨时区偏移，不创建计时器 | N Time |
| [time-field](../src/components/form-completion/time-field.ce.vue:1) | 分段时间输入 | 时分/可选秒、分段键盘与原生有效性；无时区/DST 策略 | R Time Field；U InputTime |
| [time-picker](../src/components/core/time-picker.ce.vue:1) | 单时间选择 | 小时/分钟、12/24 小时显示、分钟步长和上下限；没有秒、时间范围或日期时间统一模型 | E Time Picker / Time Select（相邻预设时刻能力）；N Time Picker |
| [time-range-picker](../src/components/advanced-input/time-range-picker.ce.vue:1) | 时间范围 | HH:mm、步长/上下限、可选跨午夜/相同时刻策略；非跨午夜可用窗口规则 | R Time Range Field；E/N Time Picker 同族 |
| [time-select](../src/components/form-completion/time-select.ce.vue:1) | 预设时刻选择 | 显式预设列表、禁用/键盘与表单；不是任意时间范围 | E Time Select |
| [timeline](../src/components/display/timeline.ce.vue:1) | 时间线 | 按输入顺序显示事件、时间与状态；不排序、不虚拟化、不代替可操作步骤导航 | E Timeline；N Timeline；U Timeline |
| [toggle](../src/components/input/toggle.ce.vue:1) | 按压切换按钮 | 布尔按压语义、表单和重置；不是状态开关轨道 | R Toggle；M Toggle；S Toggle |
| [toolbar](../src/components/navigation/toolbar.ce.vue:1) | 操作工具栏 | 真实子控件焦点管理、跳过禁用、横竖；不吞输入框方向键，不伪装成菜单 | R Toolbar；M Toolbar |
| [tooltip](../src/components/core/tooltip.ce.vue:1) | 非交互提示 | 延迟悬停/聚焦与关闭；不承载需操作的表单，不能代替气泡交互面板 | E Tooltip；R Tooltip；S Tooltip |
| [tour](../src/components/utility/tour.ce.vue:1) | 操作引导 | 目标定位/滚动、步骤、缺失目标、退出与焦点恢复；不强制业务流程 | E/A/M Tour |
| [transfer](../src/components/advanced-input/transfer.ce.vue:1) | 穿梭选择 | 双列表/筛选/批量移动/禁用及表单；字符串键，中等选项量，无虚拟化 | E/N/A Transfer |
| [tree](../src/components/core/tree.ce.vue:1) | 层级树浏览/选择 | 展开、单/多选、键盘；全量可见节点渲染，无虚拟化、拖拽、勾选级联或加载器 | E Tree；N Tree；R Tree |
| [tree-select](../src/components/interaction/tree-select.ce.vue:1) | 树选择器 | 复用树、单/多选、展开、表单；多选逐节点，**不隐式级联**，没有搜索/虚拟化/远程树加载 | E TreeSelect；N Tree Select；A TreeSelect |
| [typography](../src/components/foundation/typography.ce.vue:1) | 语义排版 | 标题/正文/说明原生语义，token 枚举；非整页 Typeset 解析器 | E/N/A/M/S Typography |
| [upload-manager](../src/components/form-completion/upload-manager.ce.vue:1) | 上传任务管理 | 宿主 upload 回调、并发/进度/取消/重试；无内置 HTTP/鉴权/存储/断点续传 | E/N/A Upload；U FileUpload |
| [virtual-scroll](../src/components/core/virtual-scroll.ce.vue:1) | 固定行高虚拟列表 | 视口裁剪、预渲染和键盘单项选择；不自动请求下一页，不等于虚拟表格/树 | N Virtual List；E Virtualized Select（仅虚拟化思路相邻，不等价选择器） |
| [virtual-select](../src/components/utility/virtual-select.ce.vue:1) | 虚拟选择 | 固定行高、搜索、单/多选、活动项入窗及表单；无树形/远程分页协议 | E Virtualized Select |
| [virtual-table](../src/components/data/virtual-table.ce.vue:1) | 虚拟表格 | 固定行高窗口、真实 table、行键/选择；无可变行高/列虚拟化，不继承普通表格全部增强 | E Virtualized Table |
| [virtual-tree](../src/components/data/virtual-tree.ce.vue:1) | 虚拟树 | 展开平面化、固定行高窗口、键盘/选择；无拖拽/异步加载/自动级联 | E Virtualized Tree |
| [visually-hidden](../src/components/navigation/visually-hidden.ce.vue:1) | 视觉隐藏辅助 | 内容保留读屏语义，可聚焦时显现；不是分隔线 | M VisuallyHidden |
| [watermark](../src/components/utility/watermark.ce.vue:1) | 文字水印 | 安全文字重复排布、尺寸响应与内容穿透；非防篡改安全边界 | E/N/A Watermark |

## 公开目录剩余项处置

以下是能力归并和范围边界，不是待新增文件数。G 编号的唯一状态见[路线图](component-roadmap.md)。

| 来源 | 处置 |
| --- | --- |
| E | Calendar/Date Picker Panel/DateTime/Time Select → G01–G06；Form/Upload → G10/G11；虚拟化/无限加载/预览 → G12–G16；高级表格 → G43。设计说明 Border/Color 不计组件。 |
| N | 日期/表单 → G01–G11；Dynamic Input/Log/Time/Loading Bar/Number Animation → G23–G28；Heatmap/Equation → G37/G39；Thing 是内容组合，非新增核心模板要求。 |
| R | 日期族 → G01–G06；Editable/Listbox/Tag Group/Alert Dialog 已有入口；颜色子原语不等于 KIMA 提供独立色彩管理器，见 G20。目录 Alpha 不作为稳定性承诺。 |
| U | FieldGroup/ProgressGroup/Chart/Editor → G29/G34/G37/G38；Editor 工具子部件不重复计数。Content 系列 → G41 的站点范围；Dashboard/Page/Pricing/Blog/Auth/Chat 是 G42 宿主/业务模板范围。 |
| A | Menu/Table/ConfigProvider/FloatButton/Masonry 等按已实现能力归并；Charts 和 ProForm/ProTable/ProLayout 是独立生态。Listy/BorderBeam 分别保留待查/可选效果边界。 |
| M | 布局/颜色/角度/掩码/复制等按矩阵归并；Form/Hooks/Extensions 是独立能力入口，不证明已核对 dates/charts/editor 完整目录。Scroller → G49 待查。 |
| S | Form 集成、Typeset、scroll-fade/shimmer 是集成/排版/工具参考，不新增同义入口。Sidebar 已实现壳能力；AI Elements/Blocks/业务模板非核心必补。Marker/Trace/Questionnaire → G50 待查语义。 |

server auth、transport、CMS、商业模板由宿主或业务层提供，不列为核心组件缺失。固定列/分组表格、多色彩空间/取色器、带时区日期/DST、协作编辑、任意图表类型等没有实现，不能因同名入口而宣传支持。独立/专项用例的存在不能替代最终构建、全量浏览器/SSR、真实 tarball 安装与人工读屏验收；本次未运行这些最终检查。
