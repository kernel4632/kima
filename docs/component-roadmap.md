# KIMA 组件覆盖与能力边界

## 当前事实

当前 [组件目录](../src/components/)实际有 **136 个组件入口**，完整清单见[入口索引](component-index.md)，逐项实现边界与公开目录来源见[能力矩阵](component-comparison.md)。数量是源码事实，不是与任一参考库全部 API 等价或公开发布的证明。

第一批已移除 9 个低价值入口，详见[删减与迁移](component-pruning.md)。本轮站点及组件库构建通过、产物 136 个组件/13 项核验通过、冒烟冷启动复跑 6.6 秒、SSR 16/16、隔离消费者 22/22、生产路由 136/136 无运行错误。旧回归数据属于历史证据，不能作为剩余组件的完整验收承诺。

## 维护分层

先审查入口必要性，再决定维护投入；分档不为薄包装提供永久保留理由。档位唯一来源是 [`src/component-tiers.js`](../src/component-tiers.js:1)，判断标准写在文件头：

| 档位 | 数量 | 维护水位 | 注册方式 |
| --- | --- | --- | --- |
| core | 43 | 逐页视觉审查、跨浏览器、键盘与读屏、动画中间帧 | `/elements/core` 默认注册 |
| extras | 80 | 渲染、键盘可达、有交互反馈；不做逐页视觉打磨 | 按需 |
| experimental | 13 | 能渲染、有状态反馈；接口可能调整 | 按需 |

文档站组件页会显示当前组件所属档位。新增 `.ce.vue` 必须在分档表里选一档，`scripts/components.js` 会校验，漏了构建直接失败。

## 口径与来源

HOP：约束见[协作规范](../AGENTS.md)，组件逐项来源唯一维护在[矩阵来源索引](component-comparison.md#来源索引唯一维护处)，属性和事件以源码及文档站自动提取为准。E/N/R/U/A/M/S 是七家公开库的**历史目录快照**编号；本次只核验本地证据，不声称重新访问官网或逐页核对外部 API。PrimeVue 没有有效目录证据，不计已核对来源。

- **已实现**：原缺口所需的核心能力已有实现，按所列范围关闭；不表示支持参考库全部高级模式。
- **已实现，有限范围**：基础能力已交付，保留明确的增强边界，不继续写作“组件缺失”。
- **基础设施/宿主边界**：没有必要为每个外部原语、服务或模板新增组件；server auth、transport、CMS 和商业模板不列核心缺失。
- **待查**：只有外部目录名称证据，不猜语义，也不计作已完成等价对标。

## G00–G50 逐项处置

编号保留历史顺序供追溯，不是新增文件配额。测试列表示**已读到的测试来源**，不是本子任务运行结果；专项覆盖概览见下方证据表。

### 输入、日期与表单

| 编号 | 能力 / 状态 | 源码事实与支持边界 | 公开目录来源 | 测试来源 |
| --- | --- | --- | --- | --- |
| G00 | 范围滑块 / 已实现 | [range-slider](../src/components/advanced-input/range-slider.ce.vue:1)：双端值、步长、端点碰撞、原生键盘、双名称提交与 reset；固定两手柄 | M RangeSlider；E/R Slider 同族 | AI |
| G01 | 独立日历 / 已实现 | [calendar](../src/components/advanced-input/calendar.ce.vue:1)：内联月网格、跨月键盘、上下限/禁用日期、单 Tab 入口及原生校验 | E/N/U/R/S Calendar | AI |
| G02 | 日期范围 / 已实现，有限范围 | [date-range-picker](../src/components/advanced-input/date-range-picker.ce.vue:1)：双月内联、起止输入、未完成值、区间高亮及禁用日校验；不是弹出范围面板，没有独立范围字段入口 | R Date Range Field / Date Range Picker / Range Calendar；S Range Calendar | AI |
| G03 | 时间范围 / 已实现 | [time-range-picker](../src/components/advanced-input/time-range-picker.ce.vue:1)：起止 HH:mm、分钟步长、端点边界、跨午夜策略；默认相同时刻为 24 小时，关闭 overnight 后为零时长；不含秒范围与跨午夜可用窗口规则 | R Time Range Field；E/N Time Picker 同族 | AI |
| G04 | 日期时间及范围 / 薄包装已移除 | 原生日期时间输入不再包装为完整选择器；需要时组合 date-field/time-field，并由宿主处理本地模型、上下限、步长和顺序校验，见[迁移](component-pruning.md) | E DateTime Picker；N Date Picker 同族 | 不沿用旧包装验收 |
| G05 | 月/年及范围 / 已实现，有限范围 | [period-picker](../src/components/form-completion/period-picker.ce.vue:1)：month/year 单值与范围、顺序校验，依赖原生 month/number；不是独立月/年网格。上下限依赖原生 validity，不宣称所有组合边界已验收 | R Month Picker / Month Range Picker / Year Picker / Year Range Picker（快照 Alpha） | FC |
| G06 | 分段日期/时间与预设时刻 / 保留字段，合并预设选择 | [date-field](../src/components/form-completion/date-field.ce.vue:1)、[time-field](../src/components/form-completion/time-field.ce.vue:1) 保留；预设时刻直接使用 [select](../src/components/core/select.ce.vue:1) 的选项数据，不再有 time-select 入口 | R Date Field / Time Field；E Time Select | FC |
| G07 | 行内编辑 / 已实现 | [editable](../src/components/advanced-input/editable.ce.vue:1)：显示/草稿、保存/取消、异步失败保留、焦点返回；失焦不自动提交，不是富文本 | R Editable | AI |
| G08 | 穿梭框 / 已实现 | [transfer](../src/components/advanced-input/transfer.ce.vue:1)：双列表、筛选、批量移动、禁用和原生表单；不虚拟化 | E/N/A Transfer | AI |
| G09 | 提及 / 已实现，有限范围 | [mention](../src/components/advanced-input/mention.ce.vue:1)：光标片段替换、IME、键盘、本地候选；远程请求取消/乱序由宿主管理 | E Mention；N Mention；A Mentions | AI |
| G10 | 表单状态与规则 / 已实现，有限范围 | [form](../src/components/form-completion/form.ce.vue:1)：原生 validity、dirty/touched、提交协调、同步/异步 rules、错误与过期字段验证隔离；validator 可读取 model/context。没有 schema 适配器、完整嵌套路径或同名多值聚合引擎，不承诺自动跨字段依赖重验 | E/N/A/R/U Form；M Form 独立入口；S 表单集成 | AI / FC |
| G11 | 上传任务管理 / 已实现，宿主传输 | [upload-manager](../src/components/form-completion/upload-manager.ce.vue:1)：并发、进度、取消、失败重试、移除；接收宿主 upload 回调与 AbortSignal。HTTP/鉴权/存储/续传和服务端校验由宿主提供，不是核心缺失 | E/N/A Upload；U FileUpload | FC |
| G20 | 颜色编辑 / 已实现，有限范围 | [color-picker](../src/components/form-completion/color-picker.ce.vue:1)：HSV 二维区、色相/alpha、HEX 输入、RGB/HSL **只读读数**；没有 RGB/HSL 编辑模式、调色板、EyeDropper、多色彩空间/色彩管理；旧输入专项不能证明新增二维交互全部通过 | E/N Color Picker；R Color Area / Field / Slider / Swatch；M AlphaSlider / HueSlider | IN / FC（证据范围有限） |
| G23 | 动态字段数组 / 已实现，有限范围 | [dynamic-input](../src/components/form-completion/dynamic-input.ce.vue:1)：对象行、身份、增删移动、作用域插槽；没有完整嵌套错误/表单 schema 协议，外部模型回写与原生 reset 不应宣称完整支持 | N Dynamic Input | FC |
| G46 | 角度输入 / 已实现 | [angle-slider](../src/components/form-completion/angle-slider.ce.vue:1)：角度环绕、指针/键盘、表单；不是通用图形变换编辑器 | M AngleSlider | FC |
| G47 | 掩码与 JSON / 已实现，有限范围 | [masked-input](../src/components/form-completion/masked-input.ce.vue:1)：固定占位掩码与完整性检查，不承诺成熟掩码引擎的所有光标/IME 场景；[json-input](../src/components/form-completion/json-input.ce.vue:1)：解析错误、格式化、纯文本模型，无 schema/树编辑 | M MaskInput / JsonInput | FC |

### 数据、反馈与操作

| 编号 | 能力 / 状态 | 源码事实与支持边界 | 公开目录来源 | 测试来源 |
| --- | --- | --- | --- | --- |
| G12 | 无限加载 / 已实现 | [infinite-scroll](../src/components/data/infinite-scroll.ce.vue:1)：加载去重、结束/错误、重试与按钮替代；数据与分页请求由宿主提供 | E/N Infinite Scroll | DA |
| G13 | 虚拟表格 / 已实现，有限范围 | [virtual-table](../src/components/data/virtual-table.ce.vue:1)：固定行高窗口、真实 table 语义、键控选择；没有可变行高/列虚拟化，不等价普通 table 的全部增强 | E Virtualized Table | DA |
| G14 | 虚拟树 / 已实现，有限范围 | [virtual-tree](../src/components/data/virtual-tree.ce.vue:1)：展开平面化、固定行高窗口与键盘；没有拖拽/异步加载/自动勾选级联 | E Virtualized Tree | DA |
| G15 | 虚拟选择 / 已实现 | [virtual-select](../src/components/utility/virtual-select.ce.vue:1)：固定行高、搜索、单/多选、活动项入窗与表单；没有树形或远程分页协议 | E Virtualized Select | UT |
| G16 | 图片预览 / 已实现，隔离待完善 | [image-preview](../src/components/data/image-preview.ce.vue:1)：图组、键盘切换、缩放/旋转/reset，声明 aria-modal、打开聚焦/关闭返回；当前源码未见 Tab 焦点圈定、背景 inert 或原生 showModal，不能称完整模态隔离；无触摸手势编辑/裁剪 | E/N/A Image 同族 | DA（名称不替代实际断言） |
| G17 | 操作引导 / 已实现 | [tour](../src/components/utility/tour.ce.vue:1)：定位/滚动目标、步骤、缺失目标提示、退出/焦点恢复；不是业务流程强制器 | E/A/M Tour | UT |
| G18 | 二维码 / 已实现 | [qr-code](../src/components/utility/qr-code.ce.vue:1)：实际编码 SVG 与容量错误；不负责扫码/凭证验证 | A QRCode；N QR Code | UT |
| G19 | 水印 / 已实现 | [watermark](../src/components/utility/watermark.ce.vue:1)：安全文字重复排布与尺寸响应；不是防篡改安全机制 | E/N/A Watermark | UT |
| G21 | 固钉 / 已实现 | [affix](../src/components/utility/affix.ce.vue:1)：上下 sticky、偏移与变化通知，受滚动祖先/父容器约束；不以 fixed 逃逸边界 | E/N/A/M Affix | UT |
| G22 | 悬浮动作组 / 已实现，有限范围 | [float-button](../src/components/utility/float-button.ce.vue:1)：展开动作、禁用跳过、关闭与焦点；批量上下文动作可用 toolbar 组合，不提供业务动作管理 | A FloatButton；N Float Button；M ActionBar 相邻 | UT |
| G24 | 长文本 / 已实现 | [long-text](../src/components/data/long-text.ce.vue:1)：行截断与显式展开；不是按宽度收纳列表 | N Ellipsis；M Spoiler | DA |
| G25 | 日志查看 / 已实现 | [log-viewer](../src/components/utility/log-viewer.ce.vue:1)：追加、上限裁剪、暂停/恢复跟尾、过滤与导出；server auth/transport 由宿主提供 | N Log | UT |
| G26 | 时间展示 / 已实现 | [relative-time](../src/components/data/relative-time.ce.vue:1)与[time-display](../src/components/foundation/time-display.ce.vue:1)：相对时间和 Intl 绝对时间、locale/timeZone 回退；不提供服务端校时 | N Time | DA / FO |
| G27 | 页面加载条 / 已实现 | [loading-bar](../src/components/utility/loading-bar.ce.vue:1)：任务生命周期、结束/错误；路由/请求何时开始结束由宿主接入，不拦截全局网络 | N Loading Bar | UT |
| G28 | 数字动画 / 已实现 | [animated-number](../src/components/utility/animated-number.ce.vue:1)：补间、反向更新、准确终值及减少动效；不是图表或无限滚动数字引擎 | N Number Animation；M RollingNumber | UT |
| G32 | 内联选择/标签集合 / 已实现 | [listbox](../src/components/utility/listbox.ce.vue:1)与[tag-group](../src/components/utility/tag-group.ce.vue:1)：集合焦点、选择/删除及表单；不等价富文本标签编辑器 | R Listbox / Tag Group；U Listbox | UT |
| G34 | 环形/分组进度 / 已实现，有限范围 | [ring-progress](../src/components/data/ring-progress.ce.vue:1)与[progress-group](../src/components/utility/progress-group.ce.vue:1)：环形显示、任务权重汇总；没有多段环/半圆全部变体 | M RingProgress / SemiCircleProgress；U ProgressGroup | DA / UT |
| G35 | 受保护模态确认 / 已实现 | [alert-dialog](../src/components/utility/alert-dialog.ce.vue:1)：默认取消焦点、显式确认、异步失败保留/重试；业务权限和最终删除由宿主负责 | R/S Alert Dialog；E Message Box | UT |
| G43 | 高级表格 / 已实现核心子集 | [table](../src/components/data/table.ce.vue:1)：筛选、选择、展开、编辑、受控/本地排序、列隐藏、指针/键盘列宽、summary；**不支持固定列、分组表头/行分组、自动分页**，服务端查询/分页由宿主控制 | N Data Table；S Data Table；A Table；ProTable 为独立生态 | DA / FE / BASE |
| G44 | 嵌套菜单/导航 / 已实现，有限范围 | [menu](../src/components/core/menu.ce.vue:1)、[context-menu](../src/components/interaction/context-menu.ce.vue:1)、[menubar](../src/components/interaction/menubar.ce.vue:1)：子菜单、checkbox/radio 与键盘；[navigation-menu](../src/components/navigation/navigation-menu.ce.vue:1)：嵌套真链接、展开/当前项；不是任意 Mega Menu 版式或路由引擎 | A Menu；R Dropdown Menu / Navigation Menu；U NavigationMenu | SH |
| G45 | 通知队列 / 已实现 | [notification-queue](../src/components/utility/notification-queue.ce.vue:1)：容量、堆叠、去重、push/update/dismiss；服务按实例隔离，不承诺全局单例或跨页面持久化 | E/N/A Message / Notification；S Sonner / Toast；R Toast | DA / UT |
| G48 | 通用复制 / 已实现 | [copy-button](../src/components/data/copy-button.ce.vue:1)：Clipboard 成功/失败反馈；需浏览器权限/安全上下文，失败不伪报成功 | M CopyButton | DA |

### 布局、内容、基础设施与外部边界

| 编号 | 能力 / 状态 | 源码事实与支持边界 | 公开目录来源 | 测试来源 |
| --- | --- | --- | --- | --- |
| G29 | 布局与分组 / 已实现 | [grid](../src/components/foundation/grid.ce.vue:1)、[flex](../src/components/foundation/flex.ce.vue:1)（纵向堆叠并入 flex）、[field-group](../src/components/foundation/field-group.ce.vue:1)、[input-group](../src/components/foundation/input-group.ce.vue:1)、[masonry](../src/components/shell/masonry.ce.vue:1)：响应式布局/命名区域、语义字段组合、列优先瀑布流；不自动平衡最短列或改变焦点顺序 | E Layout / Space；N Flex / Grid；A Grid / Flex / Masonry；M Flex / Grid / Stack；U FieldGroup；S Input Group | FO / SH |
| G30 | 页头/横幅/错误恢复 / 已实现 | [page-header](../src/components/foundation/page-header.ce.vue:1)、[banner](../src/components/foundation/banner.ce.vue:1)、[error-state](../src/components/foundation/error-state.ce.vue:1)：行动区、持久提示、异步重试/resetKey；错误组件不是跨 CE app 的 Error Boundary，页面模板由宿主组合 | E/N Page Header；U Banner / Error / PageHeader；N Thing 相邻 | FO |
| G31 | 排版与标记 / 保留排版，移除标记包装 | [typography](../src/components/foundation/typography.ce.vue:1) 保留；mark 使用原生语义与局部样式，不单列入口 | E/N/A/M/S Typography；M Mark | FO |
| G33 | 应用配置 / 已实现，有限范围 | [config-provider](../src/components/shell/config-provider.ce.vue:1)：局部主题/种子、locale、方向与减少动效，Vue 注入和 CE 作用域；不宣称全库每个文案自动翻译，无完整语言选择 UI/通用服务注册器 | E/N/A Config Provider；U App / Theme / LocaleSelect | SH |
| G36 | 动效/焦点/传送 / 基础设施 | [共享动效](../src/utils/motion.js:1)、Reka 行为、原生 modal 与内部插槽/焦点工具已有；不为外部每个底层原语建立可视入口，也不宣称全量工具 API 等价 | M Overlay / FocusTrap / Portal / Transition / Hooks；N Collapse Transition；S 效果工具 | 共享动效及各组源码；本次不改动动效文档 |
| G37 | 图表/热力图 / 已实现，有限范围 | [chart](../src/components/content/chart.ce.vue:1)：line/bar/area/scatter、负值/缺值、图例/键盘与数据表；[heatmap](../src/components/content/heatmap.ce.vue:1)：二维强度与键盘；没有缩放平移、堆叠、饼图、统计聚合 | U Chart；S Chart / Charts；N Heatmap；A Charts 为独立生态 | CO |
| G38 | 富文本/代码编辑 / 已实现，有限范围 | [rich-text-editor](../src/components/content/rich-text-editor.ce.vue:1)：Tiptap/ProseMirror、清洗 HTML 模型与真实选区；[code-editor](../src/components/content/code-editor.ce.vue:1)：CodeMirror 6、JS/JSON/HTML/CSS、查找/历史。依赖已进入核心 bundle，不再写作“尚待附加包”；无协作、代码执行、远程补全或完整 IDE | U Editor；M Extensions 仅入口证据；代码编辑器无七库直接目录证据，属本地实现扩展 | CO |
| G39 | 数学公式 / 已实现 | [equation](../src/components/content/equation.ce.vue:1)：KaTeX 输出 MathML、安全错误、禁任意资源命令；非任意宏/HTML 输出，排版依赖浏览器数学字体 | N Equation | CO |
| G40 | 装饰/持续运动 / 收缩范围 | [marquee](../src/components/shell/marquee.ce.vue:1) 暂保留；gradient-text 纯装饰退出公开目录；其他装饰不为覆盖率新增 | N Marquee / Gradient Text；M/U Marquee | SH |
| G41 | 文档内容系统 / 已实现站点范围 | [文档站](../src/App.vue:1)已有组件元数据全文命令搜索、快捷键、路由与页内目录；CMS 索引、上下篇、远程全文服务是宿主内容系统范围 | U ContentNavigation / ContentSearch / ContentSurround / ContentToc / PageAnchors | FE / DOC |
| G42 | 应用壳与业务模板 / 已实现壳，模板非核心 | [app-shell](../src/components/shell/app-shell.ce.vue:1)与[sidebar](../src/components/shell/sidebar.ce.vue:1)：区域插槽、跳过链接、响应式抽屉、嵌套导航/折叠；不是完整 Dashboard/Pricing/Blog/Auth/Chat/AI 产品。server auth、transport 与商业模板不列核心缺失 | M AppShell；U Header/Footer/Main/Sidebar、Dashboard/Page/Auth/Chat；S Sidebar / AI Elements；A Pro 生态 | SH |
| G49 | 专用滚动 / 待查外部语义 | [scroll-area](../src/components/navigation/scroll-area.ce.vue:1)已有原生具名滚动；M Scroller 仅有目录证据，未查详情，不猜是否需要额外行为 | M Scroller | NAV（只证明 KIMA 滚动区） |
| G50 | 不明新目录项 / 待查外部语义 | S Marker、A Listy、S Trace/Questionnaire 等仅目录/业务候选；不猜成地图或新核心控件，不计已完成等价对标 | S Marker / Trace / Questionnaire；A Listy | 无对应能力断言 |

## 核验来源与验证状态

> 以下保留的是删减前的历史专项与集成证据，不表示本轮 136 项已完成所有验收。当前入口集合由自动生成的[索引](component-index.md)确定。

下表链接是源码、用例和最终验收证据。旧专项记录保留在各组文档；本页不把历史较小目录的结果重复计入 145 项最终验收。

站点整合已通过：统一[分组注册表](../src/site/groups.js:1)同时提供 catalog 元数据和静态可分析 lazy loader；[总目录](../src/site/catalog.js:1)与[总示例分发](../src/site/examples.vue:1)覆盖全部 145 个 slug。生产构建后 145 路由逐页检查 demo 数、标题、属性区和 pageerror，结果见 `artifacts/final-site-production-smoke.log`。

| 简称 | 本地测试来源 | 核验用途 |
| --- | --- | --- |
| BASE / IN | [基础组件](../tests/components.spec.js:1)、[输入专项](../tests/input-expansion.spec.js:1) | 原生交互、表单、基础日期/树/表格和输入边界 |
| AI | [高级输入](../tests/advanced-input.spec.js:1)、[SSR](../tests/advanced-input.ssr.test.js:1) | 范围、日历、提及、编辑、穿梭及原生表单 |
| FC | [表单闭环](../tests/form-completion.spec.js:1)、[SSR](../tests/form-completion.ssr.test.js:1) | 日期时间范围、期间、分段、规则、掩码/JSON、动态行、上传 |
| DA | [数据专项](../tests/data-expansion.spec.js:1)、[SSR](../tests/data-expansion.ssr.test.js:1) | 无限加载、虚拟表格/树、预览、相对时间与复制等 |
| UT | [utility 专项](../tests/utility-expansion.spec.js:1)、[SSR](../tests/utility-expansion.ssr.test.js:1) | 虚拟选择、队列、日志、引导、二维码、固钉等 |
| FO | [基础扩展](../tests/foundation-expansion.spec.js:1)、[SSR](../tests/foundation-expansion.ssr.test.js:1) | 布局、字段组合、页头、错误恢复、排版、绝对时间 |
| SH | [壳与菜单](../tests/shell-expansion.spec.js:1)、[SSR](../tests/shell-expansion.ssr.test.js:1) | 嵌套菜单/导航、应用壳、配置、瀑布流和可选运动 |
| CO | [内容扩展](../tests/content-expansion.spec.js:1)、[SSR](../tests/content-expansion.ssr.test.js:1) | 图表/热力图、成熟编辑引擎、清洗、公式、表单/选区 |
| FE / DOC / NAV | [高级增强](../tests/final-enhancement.spec.js:1)、[文档页](../tests/docs.spec.js:1)、[导航](../tests/navigation-expansion.spec.js:1) | 表格增强、远程单选、目录代表性、文档路由/预览、滚动 |

| 验收项 | 最终实际状态 |
| --- | --- |
| 目录、索引、矩阵、G 编号、链接一致性 | 目录与索引返回/覆盖 145；矩阵逐项含来源、源码链接和边界；G00–G50 逐项核验；component-index/comparison 文档保留源码事实口径 |
| 站点整合与生产路由 | `pnpm build` 通过；生产 preview 逐页检查 145/145，唯一可见 demo、标题、属性区和 pageerror 全部通过 |
| 三个 JS 入口、样式、打包校验 | `pnpm build:lib`、`pnpm verify:lib` 退出 0；完整 elements 3.72 MB / gzip 902,967 字节，体积警告未隐藏 |
| 全量 Chromium | `pnpm test -- --workers=2 --output test-results/final-145`：716/716，desktop 358 + mobile 358，退出 0 |
| SSR | `pnpm test:ssr`：17/17，退出 0，警告/错误 0 |
| 动效与截图 | 动效专项 170/170；`pnpm shots` 5223：5/5；关键截图含日期、上传、虚拟表格、富文本、图表、菜单和移动端深浅主题 |
| 逐页视觉审查 | 桌面 1440×1000 与手机 390×844 各 145 页，演示区几何/横向滚动/越界/零尺寸检查 0 待修；弹层打开态另拍 22 页；方法与边界见[视觉审查](visual-audit.md) |
| tarball 隔离安装 | `pnpm verify:install`：22/22，退出 0；Vue、native、standalone 静态 HTTP 及 tree-shaking 证据见 final-package-verification |
| npm / Git | npm 身份 401，未公开发布；本次改动未提交、未推送 |

最终验收覆盖 Vue、独立自定义元素与主题三类 JS 产物，以及对应样式和真实消费者；Vue/原生是两种使用方式，不再以“两入口”概括打包产物。测试使用严格端口：5188/5193 保持原服务，5222 用于全量回归，5223 用于截图，5225 用于生产 preview。server auth、transport、CMS、固定列/分组表头/自动分页、多色彩空间与日期 DST 等边界仍按上文诚实列出，不因通过计数改写为支持。
