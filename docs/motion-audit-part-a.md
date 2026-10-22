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
