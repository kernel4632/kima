# 全库组件动效审查（123 项）
# 全库组件动效审查（145 个入口，分批验证）

当前仓库有 145 个组件入口，最新新增 63 项及表格增强的逐项源码、实际状态与帧证据见[动效审查 E](motion-audit-part-e.md)。A/B/C 的 82 项及 D 的 123 项是历史范围，下面保留其当时验证口径，不能解释为当前 145 项全部功能验收通过。抽屉按用户明确边界不修改，其原有 CSS 动画完成等待状态机与 2px 阈值测试保留。
## 共享 motion API（新组件可继承）

- [`src/utils/motion.js`](../src/utils/motion.js) 导出 `collapseTransition`、`presenceTransition`、`prefersReducedMotion()`、`retireMotionElement()` 和 `activateMotionElement()`。`collapseTransition` 用于 padding-free 的 `v-show` wrapper，基于实际可见高度使用 Web Animations；内容尺寸变化可重新定向，取消/快速反向时从当前帧续接，reduced-motion/零时长直接完成。模块导入在 SSR 下安全，不在模块顶层访问 DOM。
- [`src/styles/_tokens.scss`](../src/styles/_tokens.scss) 提供全局 `.kima-fade`、`.kima-content`、`.kima-list`、`.kima-popup` 过渡类。Vue `Transition` / `TransitionGroup` 保留退场节点直至动画结束；使用 `name="kima-list"`、`name="kima-content"`、`name="kima-fade"`，不要重复定义局部全局规则或使用 `transition: all`。
- [`src/styles/_mixins.scss`](../src/styles/_mixins.scss) 提供 `kima-motion-colors`，仅平滑颜色、背景、描边、阴影和透明度；禁用、焦点、表单值、输入、拖动和语义应即时变化。颜色只使用 `--kima-*` token，选中容器色需搭配对应 `on-*-container`。
- 退场节点/真实 popper 祖先在退场开始立即设 `inert` 与 `aria-hidden`，重入时恢复；不可让视觉动画延迟交互和读屏语义。交叉淡化时以网格叠层避免移除节点提前消失。
- reduced motion 全局停掉库内连续循环、转场时长和 smooth scroll；drawer 自己按实际 `Animation.finished` 完成，零时长/取消分支保留。
- 静态组件（键盘提示、visually-hidden、引用、布局、分隔线等）及需要跟手/即时更新的输入、滚动、拖动不强塞无意义运动；各自解释见逐项记录。

## 最新整合验证

- [动效审查 E](motion-audit-part-e.md) 逐项记录新增 63 个入口及表格增强。本批使用独立 5224、主配置、单 worker 运行新专项；普通运动和减少动态效果均实际执行，真实中间帧/退场/快速反向按适用分支单列，静态组件明确不适用。最终测试数与退出码以 E 的收尾记录为准。
- [`docs/motion-audit-part-d.md`](motion-audit-part-d.md) 记录历史 123 入口核对、HSV/alpha 颜色区、表格高级数据状态、远程选择器和文档命令搜索的运动边界。
- [`tests/final-enhancement.spec.js`](../tests/final-enhancement.spec.js:1) 在 5218、桌面/移动 Chromium 下 10/10 通过；覆盖快速请求替换、请求错误重试、表格重排/列宽键盘和文档命令搜索。该结果不是 123 入口全量回归。

## 关键行为验证

- [`tests/motion-audit.spec.js`](../tests/motion-audit.spec.js)：设置 `KIMA_TEST_PORT=5210`，桌面及移动项目共 14 项通过；检查折叠真实高度帧与快速反向、tabs marker transform 动画/面板交叉、tag/tree 退场及即时表单值、table loading 交叉、skeleton 轻 DOM 插槽保留、reduced-motion 与 SSR 安全导入。
- `pnpm test:ssr`：2 项通过；输出有 Vite HMR 24678 端口占用 warning，但测试通过。
- `pnpm build`：本轮通过；组件库产物和 123 入口校验在收尾命令中单独记录。
- 完整 `pnpm test`：桌面与移动 314 项通过、0 失败。首次回归暴露旧断言仍假设退场节点立即销毁、tabs marker 仍由 `::after` 提供，已更新为检测新独立 marker 与当前活动语义；drawer 完成等待专项另 14 项通过，原有 2px 阈值未改。

## 范围/保留状态

所有进入任务前已有未提交更改均保留；不提交、不推送、不停止/重启 5188 / 5193 服务。当前新增 63 项核验见 E，抽屉不改状态机、不放宽其 2px 阈值。下文完整回归数字属于历史记录，父级仍负责当前 145 入口全库功能回归与人工读屏；本批只报告实际运行的专项、构建与证据。

---

## 附录 A：逐项审查记录 1—28

# 动效审查 A：排序前 28 个组件

范围已用 PowerShell Get-ChildItem 实际按 Name 排序，选取前 28 个文件：从 accordion 到 dialog，包含 dialog；drawer、icon-button、image 均不在本组。先全文读取仓库协作约束，并逐个全文读取这 28 个组件的脚本、模板和样式，同时阅读其共享状态、涟漪和样式工具。修改 22 个组件，另外 6 个审查后保留。未修改共享文件、未新增业务组件、未提交推送、未停止 5188/5193 服务。

## 逐文件记录

| # | 文件 | 交互与状态审查 / 实修结果 |
| --- | --- | --- |
| 1 | [accordion.ce.vue](../src/components/navigation/accordion.ce.vue) | 审查单选/多选展开、禁用、方向键和面板插槽。即时隐藏改为共享实测高度过渡；过渡外壳无 padding，内层承接内容间距；保留挂载并即时禁止关闭区域的焦点和交互。加减字符改为箭头旋转，减少动态效果时不旋转。依赖父任务的 [collapseTransition](../src/utils/motion.js)。 |
| 2 | [alert.ce.vue](../src/components/display/alert.ce.vue) | 审查外部开关、本地关闭、语义变体、动作插槽和原生插槽。增加高度退场外壳，关闭期间立即不可交互；语义文字/图标颜色接入共享颜色过渡。初始隐藏不执行入场。新增外壳可能影响调用方直接对子级布局的假设，需联调检查。 |
| 3 | [anchor.ce.vue](../src/components/navigation/anchor.ce.vue) | 审查滚动跟踪、目标容器重连、偏移、点击导航、当前项和卸载清理。已有滚动行为通过共享工具尊重减少动态效果，当前项反馈由链接组件承接。本组无需新增动画，保留。 |
| 4 | [aspect-ratio.ce.vue](../src/components/display/aspect-ratio.ce.vue) | 纯比例布局容器，无自有交互/显隐状态。比例变化属于使用者布局数据，不添加尺寸补间，保留。 |
| 5 | [avatar-group.ce.vue](../src/components/display/avatar-group.ce.vue) | 审查成员增删、max 截断、剩余数量及默认插槽。数组回退内容接入共享列表过渡，增加局部定位容器；自定义插槽保持由调用方管理。成员未提供 id 时仍沿用索引身份，重排动效准确性取决于调用方提供稳定 id。 |
| 6 | [avatar.ce.vue](../src/components/display/avatar.ce.vue) | 审查图片载入、失败、换源、姓名/图标回退及可访问名称。增加加载完成状态；加载期间显示回退，成功淡入图片/淡出回退；失败继续显示回退；换源重置状态。固定网格轨道，避免长姓名或图片固有尺寸撑大头像；减少动态效果关闭图片淡入。 |
| 7 | [back-top.ce.vue](../src/components/navigation/back-top.ce.vue) | 审查阈值显隐、滚动目标、禁用、点击和卸载。即时隐藏改为共享内容过渡，保留按钮与插槽挂载，隐藏/退场立即不可交互。平滑返回顶部仍沿用已有减少动态效果处理。 |
| 8 | [badge.ce.vue](../src/components/core/badge.ce.vue) | 审查数值上限、dot、语义变体、文字插槽和状态播报。默认数值变化按 key 淡出再淡入，语义配色增加共享过渡；自定义插槽内容不被重新挂载。dot 几何切换保留即时显示，不制造不必要缩放。 |
| 9 | [blockquote.ce.vue](../src/components/display/blockquote.ce.vue) | 纯引用/出处排版，无自有交互状态。静态不适用，保留。 |
| 10 | [breadcrumb.ce.vue](../src/components/navigation/breadcrumb.ce.vue) | 审查末项当前位置、禁用链接、路径数组和插槽。链接反馈由链接组件负责；路径是页面导航结果，不强制对子项做进入/离开延迟，保留。 |
| 11 | [button-group.ce.vue](../src/components/core/button-group.ce.vue) | 审查单选/多选、方向键、tablist、禁用、焦点与对勾。补齐原先只有样式而无事件的涟漪绑定（落在整组宿主），多选对勾使用共享内容过渡，减少动态效果关闭段颜色过渡。未引入整行缩放。 |
| 12 | [button.ce.vue](../src/components/core/button.ce.vue) | 审查变体、形状、禁用、loading、前后插槽和按下反馈。加载/leading 内容交接增加淡出淡入；旋转内圈与淡入外壳分离，避免动画属性互抢；减少动态效果下停止旋转、取消按下位移。文字标签保持挂载和可访问名称。 |
| 13 | [card.ce.vue](../src/components/core/card.ce.vue) | 审查可点击/静态、禁用、键盘、嵌套交互元素、变体和分区插槽。修复按下 mixin 覆盖基础过渡后，描边、抬升、禁用瞬切的问题；保留回弹并补回颜色、边框、阴影和透明度的释放态过渡。减少动态效果取消位移。按下期间仍以共享 mixin 的短按节奏优先。 |
| 14 | [carousel.ce.vue](../src/components/navigation/carousel.ce.vue) | 审查前后按钮、循环、受控索引、方向键、空内容和命名插槽。即时隐藏改为每张独立的共享淡入淡出，网格同格叠放，保留所有幻灯片挂载；旧项立即不可交互/读屏隐藏。交叉淡化期间容器短暂取两页较大高度，结束后恢复当前页固有高度，未做自动高度补间。 |
| 15 | [cascader.ce.vue](../src/components/core/cascader.ce.vue) | 审查路径选择、层级增删、方向键、清除、外点关闭、表单重置和禁用。清除入口淡入淡出，补其悬停/焦点颜色过渡；列增删接共享列表过渡。弹层退场立即不可交互，重新入场清除此状态；列退场也不可交互。原有选项高亮/选中配色及箭头旋转保留。 |
| 16 | [checkbox-group.ce.vue](../src/components/input/checkbox-group.ce.vue) | 审查原生复选、必填至少一项、禁用、方向布局及整组涟漪。选项行选中底色/文字色接共享过渡，补行自身禁用语义与整组禁用视觉。原生方框勾选由浏览器绘制，不伪造自定义动画。 |
| 17 | [checkbox.ce.vue](../src/components/core/checkbox.ce.vue) | 审查 checked/indeterminate 互转、原生 change、reset、禁用、光环与勾/横杠。已有方框颜色和弹簧标记保留；补标签/禁用颜色过渡，减少动态效果禁用标记弹簧转换。 |
| 18 | [chip.ce.vue](../src/components/interaction/chip.ce.vue) | 审查静态/可选/可删除组合、表单和 reset。补选中/禁用配色过渡，移除入口显隐接共享内容过渡。删除事件仍由父层决定是否移除，不延迟事件、不自毁组件；整个芯片从父层列表被删除的退场应由父层共享列表过渡承接。 |
| 19 | [code-block.ce.vue](../src/components/core/code-block.ce.vue) | 审查高亮、换行、复制等待/成功/失败和读屏反馈。复制等待接按钮 loading，成功文案淡出淡入；读屏状态仍即时更新。换行/代码内容更新保持即时，避免代码阅读时整块移动。 |
| 20 | [collapsible.ce.vue](../src/components/navigation/collapsible.ce.vue) | 审查受控/本地开关、触发插槽、禁用和原生内容保活。即时隐藏改为共享实测高度过渡；无 padding 外壳包住内容，关闭立即不可交互，插槽不卸载。 |
| 21 | [color-picker.ce.vue](../src/components/form-completion/color-picker.ce.vue) | 审查原生系统面板、HEX 编辑合法/非法、提交、只读和禁用。非法输入文字颜色接共享过渡；原生系统颜色面板由浏览器/系统绘制，无可控面板动效。 |
| 22 | [combobox.ce.vue](../src/components/core/combobox.ce.vue) | 审查输入过滤、自由文本提交、选择、键盘、清除、开关/外点关闭、表单重置。补整块场地状态层与涟漪事件；清除入口和选中勾淡入淡出；清除/展开按钮颜色过渡。弹层退场不可交互，再入场恢复。过滤行保持即时更新，避免高速输入时焦点索引被延迟列表打乱。 |
| 23 | [command.ce.vue](../src/components/interaction/command.ce.vue) | 审查原生 dialog、搜索/分组、方向键、执行、关闭与焦点返回。保留已有遮罩淡入淡出，面板加轻微缩放入场/退场，减少动态效果取消缩放；搜索框颜色加共享过渡。搜索结果保持即时以匹配游标索引。 |
| 24 | [context-menu.ce.vue](../src/components/interaction/context-menu.ce.vue) | 审查右键/长按、键盘打开、禁用项、外点/ESC 与焦点恢复。既有 Reka 内容由共享 popup 过渡、选项由共享 row 过渡承接；补触发区域的主题颜色过渡。没有新增行缩放。 |
| 25 | [countdown.ce.vue](../src/components/display/countdown.ce.vue) | 审查每秒更新、到时一次事件、目标改变、SSR 占位和卸载计时器。等宽数字直接更新，连续计时不施加每秒位移/淡化以免持续抢注意力；保留。 |
| 26 | [date-picker.ce.vue](../src/components/core/date-picker.ce.vue) | 审查开关、选择、清除、翻月/跨月键盘焦点、边界、reset 和原生表单。清除入口淡化；清除/月份导航/日期的颜色与状态增加共享过渡；月份标题及整月网格切换淡化。旧月退场移除重复 id、设为不可交互，重新进入恢复 id，避免快速来回翻月留下失效焦点。弹层退场也禁止交互。需重点实测跨月、快速反向和聚焦。 |
| 27 | [descriptions.ce.vue](../src/components/display/descriptions.ce.vue) | 纯详情排版和响应式列数，无自有交互状态，保留。 |
| 28 | [dialog.ce.vue](../src/components/core/dialog.ce.vue) | 审查外部开关、ESC、背景点击、原生关闭、焦点循环和插槽。面板补完整关闭端缩放/淡出目标；关闭按钮复用现有基础按钮获得状态层/涟漪/按下回弹，保留原尺寸与可访问名称；减少动态效果取消面板缩放。原生 display/overlay 离散过渡保留。 |

## 实际验证

- 28 个组件全部执行 Vue 单文件解析、脚本编译、模板编译和局部 SCSS 编译，0 个语法错误。最后一次检查在收尾的小幅可访问性/减少动态效果补丁前后继续进行。因为父任务尚未提供颜色 mixin，检查时仅在内存中替换调用；没有写回组件或共享文件。这不能称为完整构建通过，也未解析共享高度模块。
- 对 5188 的现有 fixture 联调尝试被实际阻断：缺少父任务的共享高度模块和颜色 mixin，页面未 ready。未运行会写入父任务输出目录的生产构建、库构建、截图或整套测试。
- 浏览器通过路由仅在内存中提供隔离页面，加载真实组件与实际样式，对按钮/头像/轮播/原生对话框做定向探针：下一张切换时旧幻灯片不可交互且读屏隐藏、新项可交互；加载按钮忙碌状态成立；图片失败回退“林青”；关闭对话框成功；减少动态效果下 spinner 动画为 none；无页面运行时错误。
- 上述探针发生在共享 fade/content/list 样式尚未落地时，因此验证了状态/挂载/交互与局部动画降级，未证明全局过渡的视觉时长和流畅性。

## 父任务需要合并验证的风险

1. 先提供约定的 [motion.js](../src/utils/motion.js)、[颜色 mixin](../src/styles/_mixins.scss) 与 [全局过渡样式](../src/styles/_tokens.scss)，否则当前分工代码存在预期的缺失依赖编译错误。
2. 折叠：快速反向、内容异步增高、slot 内表单值保留、关闭区域焦点、减少动态效果。高度过渡依赖父实现的取消与清理能力，本组未伪报实测通过。
3. 日历：切换月时旧网格必须不抢焦点；快速上一月/下一月取消退场时 id 与不可交互状态恢复；旧网格绝对定位与弹层实际高度应截图复核。
4. 列表过渡：头像组及级联列新增局部容器，需检查 shared list 的退场定位/布局收拢；Vue 与自定义元素两种模式均需跑测试。调用方提供稳定 id 才能准确表现成员重排。
5. 芯片整个移除需要父层列表过渡；当前组件契约明确由父层决定删除，不能在内部延迟 remove 事件或擅自隐藏。图片组件由其他分工审查，本组未触碰。
6. 原生 dialog 的离散过渡需在目标浏览器复核，完整双主题、SSR、库打包、自定义元素及视觉截图均未在本子任务完成。减少动态效果的共享状态层/涟漪降级由父基础统一提供。


---

## 附录 B：逐项审查记录 29—56

# 动效审查 Part B：排序第 29 到第 56 项

## 范围

按 PowerShell 命令 `Get-ChildItem src/components/*.ce.vue | Sort-Object Name` 的结果，本批范围为第 29 到第 56 项，包含 28 个文件。第 30 项 [`drawer.ce.vue`](../src/components/core/drawer.ce.vue) 按父任务明确跳过，因此本次实际审查并修改 27 个组件。未修改共享文件、测试文件、业务组件，也未停止 5188/5193 服务。

本次判定依据是逐个全文阅读模板、脚本和样式，并结合真实交互用例、中间帧 DOM 检查、构建和 SSR 验证；不是依据是否出现 `transition` 关键词判定通过。

## 逐项记录

### 29. [`divider.ce.vue`](../src/components/core/divider.ce.vue)

- 交互：纯语义分割线，水平/垂直方向、插槽标签和原生 CE 插槽。
- 已有动效：无。
- 实修：无。保持静态语义组件，不引入进入动画。
- 静态不适用：分割线没有可操作状态，也没有增删生命周期。
- 验证风险：未做视觉截图；风险仅限宿主对动态尺寸变化时的布局过渡需求。

### 30. [`drawer.ce.vue`](../src/components/core/drawer.ce.vue)

- 交互：bottom/right/left 原生 modal dialog、拖拽、吸附点和焦点管理。
- 已有动效：父任务已经落地完整抽屉动效。
- 实修：跳过，未读取后修改本文件。
- 静态不适用：不适用。
- 验证风险：本批没有重复验证抽屉，沿用父任务现有验证结果。

### 31. [`empty-state.ce.vue`](../src/components/core/empty-state.ce.vue)

- 交互：静态空状态，支持标题、说明、图标和 action 插槽。
- 已有动效：无。
- 实修：无。action 内部交互由实际按钮组件负责。
- 静态不适用：空状态本身没有显示/隐藏状态机；强行给整块空状态加动画会影响页面状态切换布局。
- 验证风险：未做动态替换截图；保留静态呈现是有意设计。

### 32. [`field.ce.vue`](../src/components/input/field.ce.vue)

- 交互：把 hint/error 关联到真实表单控件，动态维护 `aria-describedby` 和 `aria-invalid`。
- 已有动效：原先提示节点直接 `v-if` 销毁，没有退场过渡。
- 实修：引入 [`collapseTransition()`](../src/utils/motion.js:85)，提示 wrapper 使用 `v-show`，退出期间立即设置 `inert`/`aria-hidden`；保留最后一条消息直到 collapse 完成；消息文本和错误/提示角色使用 `kima-content` 做替换过渡。
- 静态不适用：字段容器本身不做整体入场，避免表单布局跳动。
- 验证风险：浏览器对 `inert` 的无障碍树刷新时机存在差异；Playwright Chromium 已验证描述文本和错误状态。

### 33. [`file-upload.ce.vue`](../src/components/input/file-upload.ce.vue)

- 交互：文件选择、拖放、accept/大小/数量校验、列表删除、原生 FileList 同步。
- 已有动效：拖放 active 状态只有颜色切换；文件列表原先直接 `v-if`/索引 key。
- 实修：列表外层使用 [`collapseTransition()`](../src/utils/motion.js:85)，列表项使用 `TransitionGroup`/`kima-list`；退出内容立即 inert/aria-hidden；使用稳定的 File 对象标识和重复文件 occurrence，避免删除后复用错误 DOM；删除按钮改用当前索引；拖放表面补 `kima-motion-colors`。
- 静态不适用：原生文件选择器由浏览器负责，组件不能控制其内部动画。
- 验证风险：`DataTransfer` 构造和 FileList 赋值在不同浏览器的文件权限策略可能不同；Chromium 文件选择、拖放和删除已通过。

### 34. [`highlight.ce.vue`](../src/components/display/highlight.ce.vue)

- 交互：纯文本关键词高亮，支持大小写和正则字符安全处理。
- 已有动效：无。
- 实修：无。高亮文本变化不做逐字动画，避免阅读内容闪烁。
- 静态不适用：纯展示组件，没有交互状态或独立退场节点。
- 验证风险：超长文本的正则和重排性能仍取决于宿主输入规模。

### 35. [`hover-card.ce.vue`](../src/components/interaction/hover-card.ce.vue)

- 交互：延时打开/关闭、鼠标保持、键盘焦点、触屏点击、Escape 关闭。
- 已有动效：使用全库 `kima-popup`，原先没有 presence hook。
- 实修：在 `Transition` 绑定 [`presenceTransition`](../src/utils/motion.js:22)，确保 popup 出场前激活、退场前立即 inert/aria-hidden；保持 Reka 定位包装层在退场完成前存在。
- 静态不适用：触发器本身的按下反馈由内部按钮组件负责。
- 验证风险：Reka popper 包装层的实际 DOM 结构属于第三方底座；已用中间帧探针确认包装层隔离内部内容。

### 36. [`icon-button.ce.vue`](../src/components/core/icon-button.ce.vue)

- 交互：原生图标按钮、disabled/loading、焦点环、涟漪和按下回弹。
- 已有动效：loading 时图标直接替换为 spinner，spinner 持续旋转。
- 实修：图标和 spinner 放入稳定的 visual 栅格，用 `kima-fade` 交叉切换，避免按钮尺寸和布局跳变；保留原有状态层、焦点环、涟漪和 press；reduced-motion 由全局规则缩短受控动效。
- 静态不适用：图标本身不增加独立 hover 动画。
- 验证风险：持续 spinner 的减弱动效行为依赖全局 reduced-motion 规则；未在 Safari 实机验证。

### 37. [`icon.ce.vue`](../src/components/core/icon.ce.vue)

- 交互：Hugeicons 静态包装，统一线宽。
- 已有动效：无。
- 实修：无。图标包装层不自行添加动画，避免和父控件状态反馈叠加。
- 静态不适用：没有状态机和可操作节点。
- 验证风险：图标 SVG 的具体绘制由 Hugeicons 版本决定。

### 38. [`image.ce.vue`](../src/components/display/image.ce.vue)

- 交互：loading/loaded/error 三态，src/srcset/sizes 换源，load/error 事件和 caption 插槽。
- 已有动效：原先 loading/error 占位直接切换，图片通过 `v-show` 隐藏。
- 实修：图片、loading 占位、error 占位分别使用 `kima-fade`；保留图片节点用于加载事件，加载时图片透明但不影响请求；用当前图片节点和 src/srcset/sizes 交叉校验，防止旧请求覆盖新源状态；失败后重新换源可恢复。
- 静态不适用：caption 不做动画，避免图注跟随图片状态抖动。
- 验证风险：浏览器缓存可能让 load 事件同步或异步到达；当前请求匹配已防止旧事件污染，Chromium 慢请求交叉场景已通过。

### 39. [`kbd.ce.vue`](../src/components/display/kbd.ce.vue)

- 交互：键盘快捷键静态语义展示，支持数组和插槽。
- 已有动效：无。
- 实修：无。
- 静态不适用：不是按钮，不存在进入/退出或按下反馈。
- 验证风险：宿主字体和长快捷键组合可能影响换行，但不属于动效问题。

### 40. [`layout.ce.vue`](../src/components/core/layout.ce.vue)

- 交互：页面/面板布局、header/content/footer 插槽、尺寸和间距 token。
- 已有动效：无。
- 实修：无。布局容器不持有内容显示状态。
- 静态不适用：为布局根节点加过渡会把内部业务状态变化错误地整体动画化。
- 验证风险：动态改变 max-width/padding 时由 CSS 布局即时重排，未做布局动画需求验证。

### 41. [`link.ce.vue`](../src/components/navigation/link.ce.vue)

- 交互：真实 href、disabled 拦截、新窗口安全 rel、current 语义、涟漪。
- 已有动效：导航 mixin 的状态过渡和 ripple。
- 实修：无额外修改。该组件已有完整链接状态处理，且不应对导航目标做出场动画。
- 静态不适用：链接导航后的页面过渡属于宿主路由，不由此组件控制。
- 验证风险：已验证真实链接和 disabled；跨路由框架的页面过渡未覆盖。

### 42. [`list.ce.vue`](../src/components/display/list.ce.vue)

- 交互：有序/无序列表、items、item/action 插槽、空列表状态。
- 已有动效：原先静态 `v-for`，无稳定离场策略。
- 实修：使用稳定对象/primitive key 和重复项 occurrence；默认 items 使用 `TransitionGroup`/`kima-list`，支持新增、删除和移动；空状态也纳入 keyed group；修正 null item 读取，避免动态列表报错。
- 静态不适用：默认插槽完全由调用者提供真实 `li` 时，组件不接管其内部列表动画。
- 验证风险：用户自定义 slot 若自行复用不稳定 key，组件无法替代其 key 策略。

### 43. [`loading-overlay.ce.vue`](../src/components/interaction/loading-overlay.ce.vue)

- 交互：区域 loading、blocking/passive、内容 inert、状态焦点和结束后焦点恢复。
- 已有动效：原先使用 `kima-popup`，但 loading mask 的语义和 popup 过渡不完全匹配。
- 实修：mask 改用 `kima-fade` 并绑定 [`presenceTransition`](../src/utils/motion.js:22)；blocking 期间内容 wrapper 保持 inert；焦点异步恢复前再次确认仍处于 blocking/loading，避免快速反向时抢焦点；退出时保留 mask 到过渡完成。
- 静态不适用：passive overlay 不隔离内容，符合后台刷新语义。
- 验证风险：跨浏览器对 focus 在 inert 节点切换瞬间的处理可能不同；Chromium 已验证原节点和值和焦点恢复。

### 44. [`menu.ce.vue`](../src/components/core/menu.ce.vue)

- 交互：单选菜单、搜索、方向键/Home/End/Enter/Escape、外部点击和焦点恢复。
- 已有动效：popup 过渡、菜单项颜色过渡；原先列表项没有进入/移除动画，触发器缺少统一反馈。
- 实修：popup 绑定 `presenceTransition`；菜单项使用 `TransitionGroup`/`kima-list` 和稳定 value key；触发器补状态层、焦点环、ripple host 和颜色动效；选中项使用 `primary-container` 与 `on-primary-container` 配对，悬停使用 container-hover；为列表动效补本地样式优先级，避免颜色 transition 覆盖位移 transition。
- 静态不适用：浏览器原生 search 输入本身不做按下缩放。
- 验证风险：items 使用重复 value 时仍需要调用方保证唯一；搜索输入和菜单 roving focus 已通过。

### 45. [`menubar.ce.vue`](../src/components/interaction/menubar.ce.vue)

- 交互：多菜单左右导航、菜单内键盘行为、Escape、禁用菜单和 action select。
- 已有动效：Reka `MenubarContent` 外层 `kima-popup`。
- 实修：绑定 `presenceTransition`，使 Reka popper 退场节点保持到过渡结束并立即隔离；未改变菜单焦点模型。
- 静态不适用：菜单项属于操作行，不增加按下缩放，避免重排。
- 验证风险：左右键切换依赖 Reka 的焦点管理和其 DOM 包装层，Chromium 已通过；其他浏览器未逐一验证。

### 46. [`multi-select.ce.vue`](../src/components/interaction/multi-select.ce.vue)

- 交互：多选、搜索、chips 删除、清空、键盘游标、原生 hidden select、form reset。
- 已有动效：popup 过渡、交互行颜色过渡；chips 和清空按钮原先直接出现/消失。
- 实修：popup 绑定 `presenceTransition`；选中 chips 使用 `TransitionGroup`/`kima-list`，增加稳定包装节点；清空按钮使用 `kima-content`，避免控制区宽度瞬切；打开面板时清理旧搜索，异步 focus 前确认仍打开且未禁用；继续使用选中容器色与配对文字色。
- 静态不适用：原生 hidden select 本身不可见，不做视觉过渡。
- 验证风险：用户传入重复 value 会破坏 key 唯一性；当前契约已注明 value 唯一，Chromium 键盘/搜索/清空/reset 已通过。

### 47. [`native-select.ce.vue`](../src/components/input/native-select.ce.vue)

- 交互：原生 select、multiple、原生校验、reset、移动端系统选择界面。
- 已有动效：输入表面 focus-within 和颜色状态过渡；选项菜单由浏览器绘制。
- 实修：补 `kima-motion-colors`，保证表面颜色状态变化有统一过渡；保留原生 select 行为。
- 静态不适用：系统选择菜单和滚轮动画不能由组件控制。
- 验证风险：选项弹出动画、平台主题和滚轮效果依赖 OS/browser；已验证 Chromium 值同步、multiple、disabled option 和 reset。

### 48. [`navigation-menu.ce.vue`](../src/components/navigation/navigation-menu.ce.vue)

- 交互：真实导航链接、当前位置、水平/垂直布局和窄屏折行。
- 已有动效：导航 mixin 与 link 内部状态反馈。
- 实修：无额外修改。导航菜单不持有弹层或可折叠内容。
- 静态不适用：当前页切换由真实导航/宿主路由决定，不在组件内做内容动画。
- 验证风险：窄屏布局只做 CSS media query，未做跨浏览器截图比较。

### 49. [`notification.ce.vue`](../src/components/core/notification.ce.vue)

- 交互：自动关闭、剩余时间暂停、hover/focus 暂停、手动关闭、重开、语义 role/live。
- 已有动效：自带从边缘滑入/淡出；原先使用 `v-show`，退场时内部正文和关闭按钮会先消失。
- 实修：改为 `v-if` 配合 `presenceTransition`，完整通知内容保持到 leave 完成；退场节点立即由通用钩子隔离；修正 reduced-motion 下居中通知 transform；关闭按钮保留状态层、焦点环和颜色过渡；自动计时仍只在 mounted/client 启动。
- 静态不适用：通知正文不做逐字段动画，避免 live region 重复播报。
- 验证风险：通知固定定位和 transform 在不同 viewport/zoom 下仍需视觉回归；SSR、timer、hover/focus、重开和变体测试已通过。SSR 测试期间出现过 Vite HMR 端口 24678 已占用警告，但测试本身通过。

### 50. [`number-field.ce.vue`](../src/components/input/number-field.ce.vue)

- 交互：原生 spinbutton、步进按钮、min/max/step、空值、reset。
- 已有动效：输入表面 focus-within、按钮内部反馈。
- 实修：补 `kima-motion-colors`，使字段表面状态颜色变化连续；保留原生 stepUp/stepDown 计算和焦点恢复。
- 静态不适用：输入值本身不做数字滚动动画，避免输入和校验语义延迟。
- 验证风险：`step="any"` 的上下限边界由浏览器 number parsing 参与；Chromium 小数、边界和 reset 已通过。

### 51. [`overflow-list.ce.vue`](../src/components/navigation/overflow-list.ce.vue)

- 交互：折叠显示前 N 项、展开/收起、原生 item slot、键盘按钮。
- 已有动效：原先使用 `hidden`，项目直接从布局中消失。
- 实修：每项改用 `collapseTransition`、`v-show` 和包装内容；隐藏项在退出期间立即 inert/aria-hidden；样式从 `li[hidden]` 改为内部包装，保证 collapse 高度计算不被直接 display:none 破坏。
- 静态不适用：展开按钮本身沿用按钮组件的反馈，不重复叠加列表动画。
- 验证风险：各项高度包含复杂异步内容时 ResizeObserver 只覆盖共享 collapse wrapper 能观察到的首层；原生 slot、外部状态和键盘回归已通过。

### 52. [`pagination.ce.vue`](../src/components/core/pagination.ce.vue)

- 交互：页码生成、省略号、上一页/下一页、键盘移动、modelValue 同步、空状态。
- 已有动效：页码颜色/背景过渡；原先页码集合直接替换。
- 实修：页码 group 使用 `kima-list`，退场前立即 inert/aria-hidden 并移除 `aria-current`，避免退场期间出现两个当前页；进入时按 data-page 恢复语义；修正 transition 优先级，确保列表移动不被颜色 transition 覆盖；保留按钮状态层和 ripple host。
- 静态不适用：省略号不是交互节点，不做独立动画。
- 验证风险：快速连续跳页时旧页码可能同时处于离场帧，这是过渡设计预期；DOM 语义和快速切换已通过，未做低刷新率设备实测。

### 53. [`pin-input.ce.vue`](../src/components/input/pin-input.ce.vue)

- 交互：单输入承载粘贴、IME、自动填充、掩码、完成事件和表单校验。
- 已有动效：输入表面 focus-within，格子显示层。
- 实修：补统一 motion colors 到根表面和 cell，保持 focus/状态颜色连续；不改变单输入承载策略。
- 静态不适用：验证码字符不做逐格入场，避免自动填充和屏幕阅读器内容不同步。
- 验证风险：密码掩码和浏览器自动填充由浏览器控制；IME、粘贴、完成和 reset 已通过。

### 54. [`popconfirm.ce.vue`](../src/components/interaction/popconfirm.ce.vue)

- 交互：触发器、确认/取消、危险操作、Escape/外部关闭和焦点管理由内部 popover 负责。
- 已有动效：复用 [`popover.ce.vue`](../src/components/interaction/popover.ce.vue) 的 popup transition。
- 实修：本文件无独立动画代码；内部 popover 已绑定 `presenceTransition`，因此确认内容退场保持节点并立即隔离。
- 静态不适用：确认按钮本身不重复叠加面板动画。
- 验证风险：焦点恢复链路依赖内部 popover 和 Reka；确认/取消、安全焦点回归已通过。

### 55. [`popover.ce.vue`](../src/components/interaction/popover.ce.vue)

- 交互：非模态锚定弹层、碰撞翻转、焦点进入/返回、Escape、外部点击和 disabled。
- 已有动效：全库 `kima-popup`。
- 实修：绑定 `presenceTransition`；中间帧确认 Reka popper wrapper 保留且带 inert/aria-hidden，内部内容不会在 leave 期间继续可访问；快速关闭再打开恢复活动状态。
- 静态不适用：触发器交给 KIMA button，不在 popup 组件中重复 press。
- 验证风险：定位和焦点行为依赖 Reka/floating-ui；Chromium 已通过碰撞翻转、嵌套 dialog Escape 和中间帧探针。

### 56. [`progress.ce.vue`](../src/components/core/progress.ce.vue)

- 交互：确定/不确定进度、原生 progress 语义、aria-label。
- 已有动效：不确定状态连续滑动；确定状态原生 progress 宽度更新。
- 实修：不确定 motion 使用 `kima-fade` 进入/退出；webkit/mozilla 进度值补宽度过渡；reduced-motion 下关闭宽度过渡并停止连续动画。
- 静态不适用：进度条不是可操作控件，不增加按下或 ripple。
- 验证风险：原生 progress 的绘制和宽度过渡在 Safari/Firefox 可能与 Chromium 不同；当前构建和 Chromium 相关回归通过。

## 验证记录

- 精确范围核对：PowerShell 排序结果确认第 29 项为 `divider.ce.vue`，第 30 项为 `drawer.ce.vue`，第 56 项为 `progress.ce.vue`。
- 完整相关浏览器回归：60 passed，覆盖桌面和移动项目，包含 image、list、file-upload、field、menu/multi-select、popover/popconfirm/hover-card/menubar、loading-overlay、notification、pagination、overflow-list、native-select 等。
- 最终关键回归：16 passed，覆盖通知、分页、图片恢复、文件选择/删除、字段错误、multi-select、loading-overlay、overflow-list、菜单相关场景。
- 构建：`pnpm build` 通过。
- 组件库产物：`pnpm build:lib` 通过，`pnpm verify:lib` 通过，校验报告显示 82 个组件、Vue CSS、inline element CSS、SSR import 和 standalone browser module 均通过。
- SSR：`pnpm test:ssr` 两项通过。过程中有 Vite HMR 端口 24678 已被占用的 warning，但未造成测试失败。
- 中间帧探针：弹层和 loading mask 在 leave 中仍保留，祖先包装层立即带 `inert`/`aria-hidden`；重新打开后恢复活动；`prefers-reduced-motion: reduce` 下在短延迟后移除。

## 未验证风险

- 未在 Safari、Firefox、实际 iOS/Android WebView 上逐项验证原生 select、progress、FileList、inert 和 fixed popper 的差异。
- 未新增或修改测试文件，逐帧动画检查使用临时 Playwright 探针完成，未纳入仓库测试套件。
- 未生成截图；本次重点是行为和可访问性生命周期，视觉截图仍需后续人工确认。
- `drawer.ce.vue` 按父任务要求跳过，没有在本报告中重复验证。


---

## 附录 C：逐项审查记录 57—82

# 动效审查 C：第 57—82 组件

按组件文件名排序，从第 57 项到第 82 项共 26 项。已先读仓库协作约束，逐项阅读完整脚本、模板与样式，检查实际状态更新、DOM 生命周期、键盘/表单与运动的关系。19 项实修、7 项保留。仅修改本范围组件及本报告；未修改共享基础、测试或演示，未构建、未提交推送，未操作 5188、5193、5210 服务及父任务输出目录。

共用来源为已有的 [motion.js](../src/utils/motion.js)、[全局运动样式](../src/styles/_tokens.scss) 与 [交互 mixin](../src/styles/_mixins.scss)。关闭语义即时生效，视觉退场才保留节点；高度动画使用共享取消/反向处理，不在组件里创建延迟状态定时器。所有 DOM 测量在挂载后或浏览器交互内执行。

| 序号 / 文件 | 审查交互与实际修复 | 保留说明 | 父任务待验证 |
| --- | --- | --- | --- |
| 57 [radio-group.ce.vue](../src/components/input/radio-group.ce.vue) | 原生单选、键盘循环、禁用、表单重置。增加选项底色/文字和单选圆环描边宽度/颜色过渡。 | 原生勾选、焦点与事件即时更新，不延迟到动画完成。 | 深浅主题、禁用与减少动态效果、原生校验。 |
| 58 [rating.ce.vue](../src/components/input/rating.ce.vue) | 键盘评分、清空、只读与原生必填。补星格底色与颜色过渡，容器配色改用匹配的容器前景。 | 无需给评分值或输入事件加缓动。清除按钮常驻并按评分状态禁用。 | 深浅主题对比度、只读/禁用、清空评分。 |
| 59 [result.ce.vue](../src/components/display/result.ce.vue) | 结果类型切换改变图标与语义色；补语义图标颜色过渡。 | 标题/说明及调用方动作保留即时展示，不为静态整页加进场动画。 | 类型切换配色、具名原生插槽。 |
| 60 [scroll-area.ce.vue](../src/components/navigation/scroll-area.ce.vue) | 全文审查滚动事件、方向、尺寸与键盘焦点；无需实修。 | 原生滚动与滚动事件应跟手，不对滚动位置或容器尺寸做缓动；共享焦点样式保留。 | 横竖滚动、键盘、减少动态效果。 |
| 61 [select.ce.vue](../src/components/core/select.ce.vue) | 搜索、键盘选择、清除、关闭及焦点恢复。清除按钮淡入淡出，按钮颜色过渡，弹层退场立即禁交互/隐藏语义；关闭焦点回调增加重开状态判断。 | 搜索与选择值即时更新，选项颜色沿用现有过渡。 | 清除表单值、搜索 IME、快速开关与外部关闭焦点。 |
| 62 [skeleton.ce.vue](../src/components/display/skeleton.ce.vue) | 加载占位与真实内容改为网格同格交叉淡入淡出；两者保留节点，真实内容在加载时立即禁交互/隐藏语义。 | 脉冲与现有减少动态效果规则保留；原生插槽一直存在，内容节点不卸载。 | 实际库产物的轻 DOM 插槽分配、交互恢复、不同内容高度。 |
| 63 [slider.ce.vue](../src/components/core/slider.ce.vue) | 原生拖动、键盘、连续输入与提交、表单重置。补两个浏览器手柄伪元素的减少动态效果规则。 | 填充位置与值即时跟手，不给拖动位移增加延迟；只保留手柄悬停宽度反馈。 | Firefox 手柄、真实指针拖动、步长及禁用。 |
| 64 [spinner.ce.vue](../src/components/display/spinner.ce.vue) | 全文审查状态语义、装饰模式、尺寸及无限旋转；无需实修。 | 旋转已有减少动态效果停转规则；状态切换由宿主控制，不给静态指示器另加挂载动画。 | 装饰与具名状态、减少动态效果静止。 |
| 65 [splitter.ce.vue](../src/components/navigation/splitter.ce.vue) | 全文审查指针捕获、取消、方向/禁用变更、键盘及范围限制；无需实修。 | 面板尺寸和拖拽保持一对一，无尺寸补间；手柄沿用共享交互反馈。 | 指针取消、横竖及 RTL、禁用时结束捕获。 |
| 66 [statistic.ce.vue](../src/components/display/statistic.ce.vue) | 全文审查格式化、前后缀与输入异常回退；无需实修。 | 数值是数据展示，保留即时格式化，不引入计数动画、定时器或额外读屏播报。 | 货币、精度、无效输入及原生插槽。 |
| 67 [stepper.ce.vue](../src/components/navigation/stepper.ce.vue) | 当前/完成/待开始状态、线性约束与按钮禁用。补数字圆片与状态配色，数字/勾选和状态文案同格交叉淡出入，旧状态语义立即退出。 | 当前步骤语义和约束立即改变，按钮继续使用共享反馈。 | 快速前进后退、线性限制、禁用、减少动态效果。 |
| 68 [switch.ce.vue](../src/components/core/switch.ce.vue) | 原生开关、轨道/滑块尺寸与位移、表单重置。补明确的减少动态效果规则；修复选中勾与滑块原先同色的问题。 | 原生选中即时更新；现有位置/尺寸强调曲线可直接反向。 | 快速反复切换、按住时的滑块形变、禁用与对比度。 |
| 69 [table.ce.vue](../src/components/data/table.ce.vue) | 外部排序回写、稳定行键、加载/数据/空状态、选中及键盘。数据体使用列表重排，三个主体状态淡出入，旧主体立即禁交互；行颜色和底色一起过渡；补表格行专用进出/移动规则，避免原有行样式覆盖运动属性。 | 保留外部排序契约，不在组件内私自排序；需要稳定行键才能表达数据身份。 | 加载/空/数据快速反向、复杂多列退场宽度、行选择与排序状态、实际库产物。 |
| 70 [tabs.ce.vue](../src/components/core/tabs.ce.vue) | 单一独立指示条按当前按钮实测位置移动，支持横竖；观察栏/按钮尺寸并在卸载清理。面板同格交叉过渡，旧面板即时禁交互并隐藏语义，内容保留供快速反向。 | 原有方向键、禁用与选择事件不等待动画；不再依赖各按钮的独立伪元素下划线。 | 不同高度面板、响应式和字体加载、动态增删标签、原生 CE 插槽、全部禁用。 |
| 71 [tags-input.ce.vue](../src/components/input/tags-input.ce.vue) | 添加、删除、粘贴、退格、去重/上限及表单。标签使用稳定内容键列表进出/移动；退场测量固定位置尺寸，避免绝对定位跳位；重入清除旧几何。隐藏表单值移到动画之外，删除后立即停止提交旧值。 | 输入、IME 和校验即时处理；不动画输入框本身。 | 换行布局、删除中重新添加相同值、原生表单/必填、粘贴及 IME。 |
| 72 [text-field.ce.vue](../src/components/core/text-field.ce.vue) | 即时输入、IME、清除、密码显示、说明/错误。清除按钮淡入淡出与退场禁交互；提示区域真实高度开合，提示/错误文本交叉；独立错误文字配色避免退出的提示被错误状态染色。补场地状态层/涟漪与输入、动作颜色过渡。 | 不动画用户文本值、光标或原生输入事件。 | 密码与普通类型、IME、清除焦点、错误/提示快速替换、原生重置。 |
| 73 [textarea.ce.vue](../src/components/input/textarea.ce.vue) | 补错误/提示、错误语义和描述关联、清除按钮及焦点恢复；提示区域高度开合与文本交叉。增加可选自动高度，按输入和外部回写同步测量，清除/重置可收回，保持原生行数最低高度。 | 文本输入和高度即时，IME 期间仍实时测量；保留手动缩放模式与字数统计。 | IME、重置、外部回写、原生校验、容器宽度变化后的自动高度。 |
| 74 [time-picker.ce.vue](../src/components/core/time-picker.ce.vue) | 时/分/AM-PM、键盘、清除和关闭。清除按钮淡入淡出；弹层退场禁交互；选项改用效果时长颜色过渡；关闭焦点恢复检查快速重开，关闭状态清除也恢复触发器焦点。修复原先引用未定义标签 ID 的弹层可访问名。 | 时间值与高亮即时改变，保留容器色配对。 | 12/24 小时、禁用范围、分钟步长、快速开关和焦点、表单重置。 |
| 75 [timeline.ce.vue](../src/components/display/timeline.ce.vue) | 数据行添加、删除、重排与语义状态变化。默认数据行接列表过渡，退出立即禁交互/隐藏语义；标记颜色过渡。 | 自定义默认插槽由调用方管理；默认列表优先使用稳定 ID，无 ID 时沿用索引。 | 稳定 ID 重排、换状态、长内容与删除位置；无 ID 无法保证重排身份。 |
| 76 [toggle.ce.vue](../src/components/input/toggle.ce.vue) | 按压切换、表单值、禁用及重置。保留已有按下回弹/颜色/状态层/涟漪，并给选中悬停增加匹配容器色。 | 隐藏表单值及按压语义立即更新，不包裹退出动画。 | 快速切换、选中悬停的深浅主题、减少动态效果、表单重置。 |
| 77 [toolbar.ce.vue](../src/components/navigation/toolbar.ce.vue) | 全文审查 roving 焦点、增删控件观察、禁用与恢复原始索引；无需实修。 | 容器不拥有业务选中状态，焦点移动必须即时；内部按钮自行负责反馈。 | 控件进出期间的不可交互祖先、方向键及 RTL。 |
| 78 [tooltip.ce.vue](../src/components/core/tooltip.ce.vue) | 延迟打开、鼠标/焦点组合、Escape、受控开关与描述 ID。已有弹层运动补即时退场语义钩子。 | 现有定位变换和延迟取消保持，提示不接指针交互。 | 四方向位置、快速重入、Escape、描述 ID 恢复及减少动态效果。 |
| 79 [tree-select.ce.vue](../src/components/interaction/tree-select.ce.vue) | 复用树的高度变化；弹层接即时退场钩子并明确关闭状态语义，清除按钮淡入淡出且清除后恢复触发器焦点。 | 定位包装层才是共享退场钩子的真实 DOM 目标；不能只检查内层弹层自身的属性。原生表单模型即时更新。 | 定位包装层的禁交互祖先、快关快开、多选清空、原生表单与键盘焦点。 |
| 80 [tree.ce.vue](../src/components/core/tree.ce.vue) | 平面可见树保持键盘算法，新增无内边距运动包装行，列表进出使用真实高度与淡出入。退出包装层立即禁交互/隐藏语义，使用共享取消/反向处理；行颜色统一效果时长。 | 不给选项行加按下缩放，不延迟展开语义和可见节点计算；高度结束恢复自然尺寸。 | 深层树、动态子项高度、外部收起当前焦点后焦点归属、快收快开。 |
| 81 [virtual-scroll.ce.vue](../src/components/core/virtual-scroll.ce.vue) | 全文审查视口、上下占位、滚动同步、键盘确保可见与高亮；无需实修。 | 行颜色已有过渡；虚拟行是视口回收，保留即时挂载/卸载和固定行高，不对回收行增加入场/退场导致滚动追赶。 | 大数据快速滚动、数据缩短、选中颜色及减少动态效果。 |
| 82 [visually-hidden.ce.vue](../src/components/navigation/visually-hidden.ce.vue) | 全文审查视觉裁切与可聚焦显示模式；无需实修。 | 静态无障碍工具不加运动，聚焦显现必须即时。 | 读屏保留与键盘聚焦显示。 |

## 本地验证证据

- 全 26 项使用 Vue 单文件编译器检查脚本、模板与 SCSS，最终检查零错误；未运行生产构建或库构建。
- 全 26 项默认状态和非空内容状态完成 SSR 渲染。临时无配置 Vite 中间件的依赖扫描曾把预览示例内容误作脚本而告警，但各组件 SSR 实际全部成功；最终检查关闭自动依赖扫描后正常。统一非空探针给两个数字行数组件误传数组曾产生类型告警，随后以正确数字参数复核。未修改范围外示例或配置，临时中间件已关闭，原有服务保持运行。
- 使用现有 5188 服务与 Playwright 内存页面，没有创建测试文件或测试结果目录。普通运动探针中，标签页旧/新面板透明度分别为 0.593 / 0.407，旧面板立即不可交互；指示条、树高度、表格重排均存在实际运行中的动画。
- 树展开过程中高度实测 76.7px；收起时旧行还在 DOM 且包装层禁交互。快速反向后恢复两个有效树节点，无残余弹层。
- 标签删除时旧标签尚在退场，原生表单已只包含剩余值；退场位置尺寸已固定。表格加载时旧数据体立即禁交互，切回后恢复两行。
- 普通选择器和时间弹层退出时节点仍保留且立即禁交互。树选择的内层节点自身未标记，但真实退场定位包装祖先为不可交互并隐藏语义，快速重开可恢复；已检查祖先链。
- 骨架屏在 Shadow DOM 和项目使用的轻 DOM 模式分别探测：加载期间原生按钮与插槽保留，同一按钮身份不变，内容立即禁交互；加载结束恢复。
- 减少动态效果下，滑块手柄伪元素、开关滑块、标签指示条均为零时长；树不启动高度动画。
- 多行输入输入后高度从 139px 增至 456px，输入状态即时同步；清除后恢复 139px 且焦点回到输入。错误语义即时生效。补宽度观察且卸载断开，容器宽度变化时同步重算；实测宽容器高度 542px，缩窄后 2328px，恢复宽度后回到 542px。
- 纵向标签指示条存在实际运动，步骤状态存在同时进出的两层，时间线旧行立即退出无障碍交互。浏览器探针无页面运行异常。

## 交接边界

本报告的“已检查”不等于全量回归通过。父任务负责统一生产/库构建、产物校验、正式浏览器/SSR 用例及截图。重点覆盖表中待验证项，尤其复杂表格列宽、保留面板的布局高度、原生 CE 插槽以及键盘焦点在外部树收起后的归属。未新增业务组件或测试文件。
