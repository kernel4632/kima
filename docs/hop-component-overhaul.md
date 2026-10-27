# KIMA 组件库 HOP 全面重构清单

> 状态只表示有证据的完成情况：写了代码不等于完成；只有目标浏览器的真实交互、中间帧、终态、可访问性与构建检查都过，才可打勾。每项应先审查旧实现，保留截图/几何证据，再按单个组件或紧密组件族提交。

## HOP 工作约束

- [ ] **一个来源**：每项设计决策（尺寸、间距、动效时间、颜色角色、方向语义）只定义一次；生成结果明确标成派生物。
- [ ] **按业务主体放置**：组件、主题、布局、动效规则放在接手者会寻找的位置；不为一两个调用者制造新层。
- [ ] **直线流程**：更新状态 → 明确进入/退出/移动 → 清理；避免多层 Transition 和 watcher 相互控制同一视觉状态。
- [ ] **边界检查**：只在用户输入、浏览器环境、公开 API 边界验证；内部组件遵守统一契约。
- [ ] **自然命名与注释**：名字表达用户看到的行为；注释讲“为什么/业务语义”，不复述语法。
- [ ] **修问题做减法**：先找结构原因，能删重复动画、重复尺寸或局部例外，就不继续加补丁。
- [ ] **尊重现有公开 API**：标签、属性、事件、插槽默认不破坏；确需变更时先单独列出影响。
- [ ] **每个小切片都可见、可测、可回退**：提交粒度小；不把海量改动攒成一次全库大爆炸。

## 全库统一验收门槛（每个组件都执行）

- [ ] 先描述基线缺陷与根因，保存修改前截图/尺寸/关键 DOM 状态。
- [ ] 明确组件默认宽度、最小宽度、最大宽度、内容极值和窄屏行为。
- [ ] 检查根容器与内部元素的 Flex/Grid 对齐、伸缩、换行、溢出；块级场地占满可用宽度。
- [ ] 检查默认态、悬停、键盘聚焦、按下、禁用、加载、空态、错误态、内容最长/最短态。
- [ ] 对有动效的交互记录 before、首帧、25%、50%、75%、95%、after；检查快速反向与连续触发。
- [ ] 新旧内容交叉期间，不因旧节点仍占流/脱流造成宽高突变；高度、宽度和子项位移分别验收。
- [ ] 动效语义符合操作方向与内容来源；不能把所有行为统一成渐隐渐显。
- [ ] `prefers-reduced-motion` / KIMA reduced motion 下无明显位移/循环，状态及可访问性不延迟。
- [ ] 验证键盘、焦点保持/返回、读屏角色、`aria-live`、`inert` 与退场期间可交互性。
- [ ] 深色/浅色、RTL/LTR、桌面/窄屏、嵌套/滚动容器实测；只由 `--kima-*` token 控色。
- [ ] 修完后重跑目标场景及相邻组件，运行适用的构建/SSR/浏览器测试，再截图复核。
- [ ] 证据过关后按中文 Conventional Commits 单独提交并推送；清单更新与代码同提交。

## 阶段 A：共享基础与方向动效

- [ ] 盘点共用布局 mixin、宿主 display 规则、控件尺寸与间距 token；找出定义重复/相互覆盖。
- [ ] 盘点 `kima-fade`、`kima-content`、`kima-list`、`kima-popup` 与组件局部 Transition 的职责重叠。
- [ ] 定义动效语义契约：presence、方向切换、原位内容变高/变短、列表增删/移动、浮层进出、反馈状态。
- [ ] 每种语义规定目标 CSS 属性、起止帧、默认时长/缓动、中断规则、减少动态效果行为与可访问性行为。
- [ ] 建立无 TransitionGroup/Grid/Table 混用陷阱的公共 helper；边界行为有直接测试与截图证据。
- [ ] 建立交互布局基线 mixin：块级宿主、Flex/Grid 场地、`min-width:0`、对齐与可换行动作区；不强迫所有组件都居中。
- [ ] 核查组件尺寸 token 与实际视觉；一组控件一个明确尺度来源，不保留假 size 选项和重复魔法数字。

## 阶段 B：导航与内容切换（当前第一轮）

- [x] Carousel：按钮方向决定左右滚入/滚出，不使用默认淡入淡出代替空间运动；已通过构建与浏览器坐标/transform 定向审查。
- [x] Carousel：LTR/RTL、键盘方向、首页/末页、外部 v-model 更新方向一致；正式截图用例「图标操作：轮播方向……」在真实 Playwright 运行中通过（transform 符号、旧页 absolute、宽度一致、RTL 键盘）。
- [x] Carousel：旧页冻结在原位退出，新页与旧页宽度一致；动态高度由共用高度工具协调。
- [x] Carousel：快速连续点击/反向操作只保留新旧两页，反向新页从左侧进入、旧页 absolute 脱离布局、动画结束后回到单页；正式 Playwright 用例「轮播快速反向切换取消旧方向动画」通过。
- [ ] Tabs：明确内容切换方向是否跟随标签顺序；若无空间语义则用原位交叉切换，不生套 Carousel 动画。
- [ ] Accordion/Collapsible/LongText：原位展开收起，宽度不变，高度与内层内容按语义分阶段呈现。
- [ ] Stepper：步骤内容方向遵循上一步/下一步，状态标记不造成尺寸重排。
- [ ] 骨架屏：加载占位退场与真实内容进入期间不重叠抢高度，布局不抖动。

## 阶段 C：通知、提示与弹层

- [x] Notification 单条：进场按屏幕边缘方向滑入，退场方向/时长明确；堆叠模式下滑向由队列显式给出（slide-right/left/up/down），独立使用按 position 推导。
- [x] Notification 单条：图标、正文、关闭按钮首行基线对齐；正式 Playwright 用例以 2px 容差验证图标/标题/关闭按钮中心线。
- [x] NotificationQueue：多条通知按容量堆叠，不互相覆盖；过渡期间旧条 absolute 脱离布局、存活项用 move 过渡补位；正式 Playwright 用例「图标操作：通知队列堆叠、补位与边缘进出场」通过（堆叠 x/y 对齐、等间距、退场中间帧 absolute + transform、进场中间帧滑入、终态计数）。
- [x] NotificationQueue：top/bottom × left/center/right 六种位置、窄屏安全边距、RTL 物理右侧进场与容量挤出；正式 Playwright 用例「通知队列位置、窄屏安全边距、RTL 与容量挤出」通过。去重更新的节点身份也已通过真实服务 consumer 用例确认。
- [x] NotificationQueue：单条计时暂停、关闭事件、队列独占进入/退出、退场原位冻结、存活项补位和减少动态效果；专项 Playwright 中间帧用例通过。长短内容更新的高度过渡仍未完成。
- [ ] Dialog/Drawer/Popover/Menu/Tooltip：明确浮层进入来源、退场策略、焦点与背景聚焦；共用底座但允许合理的专属空间语义。
- [ ] InfiniteScroll/Loading/Progress 状态互斥切换时不同时挤占布局，不横向跳动。

## 阶段 D：集合与动态列表

- [ ] List/Timeline：删除节点固定原位退出，存活项稳定移动，根高度同步改变。
- [x] TagGroup：窄屏跨行删除使用共享 `useLayoutFlip()` 保留存活 chip 的旧坐标，退场由 `freezeLeaveLayout()` 处理；280px 中间帧/终态 Playwright 用例通过。MultiSelect/TagsInput 仍未处理。
- [ ] Pagination：页码窗口前进/后退时按钮和页码区宽度稳定，窗口更新不叠字。
- [ ] AvatarGroup：数量上限变化与头像移除有平滑的水平布局，不错误撑宽。
- [ ] DynamicInput/Transfer/UploadManager/ProgressGroup/FileUpload：多行增删与排序时保留行身份、焦点、容器高度和子项布局。
- [ ] Cascader/Select/Combobox/Tree：列/结果增减期间弹层宽度与定位连续，选项行不套缩放/破坏排列的动效。

## 阶段 E：基础控件与表单

- [ ] Button/IconButton/ButtonGroup：loading、leading/trailing 图标、文案更新时按钮尺寸稳定，反馈按控件语义区分。
- [ ] TextField/Textarea/Field/FieldGroup/Form：提示、错误、计数、校验状态进入/退出有高度和语义同步，不重复实现。
- [ ] Editable：展示/编辑模式共享锚点与稳定尺寸，不双占布局，不因为字段长短拉伸旧节点。
- [ ] Checkbox/Radio/Switch/Slider/Rating：内部标记与值变化有反馈但不造成周围布局抖动。
- [ ] 核查全部输入组件的大/中/小尺寸、触控目标、label 外部组合方式和原生表单提交。

## 阶段 F：展示、内容、应用壳与剩余组件

- [ ] Alert/Banner/Result/EmptyState/Statistic/Descriptions：图标文字/actions 对齐，内容变化与容器大小符合块级规范。
- [ ] Image/Avatar/Skeleton/CodeBlock/Editor/Chart/Heatmap/Equation：加载、错误、数据更新时内容原位衔接，不白屏或突然撑高。
- [ ] AppShell/Sidebar/Layout/Grid/Flex/Splitter/Masonry/Marquee：断点、伸缩与对齐在极端尺寸下稳定。
- [ ] 全库组件清单逐项核对，不跳过 experimental/extras，也不因入口存在推断验收完成。

## 当前基线问题（从已完成首轮审查继承，仍须重验）

- Carousel 已改为按前进/后退方向的水平滚入/滚出，并有快速反向中间帧用例；仍需继续扩展全库方向动效审查。
- NotificationQueue 已拆分队列进出场与单条内容/计时职责，退场冻结、存活项补位、位置/RTL/窄屏/容量和计时专项均有证据；长短内容更新的高度过渡仍列为待办。
- 上一轮窄屏 TagGroup、MultiSelect、TagsInput 仍观察到存活 chip 的首帧位移/换行，不能写成通过。
- 上一轮的构建通过只代表打包成功，不代表全组件视觉、极端数据与动效验收完成。
