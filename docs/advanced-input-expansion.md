# 日期与表单高频能力组交付

> 历史交付记录；已移除入口与当前替代方式见[删减迁移](component-pruning.md)。

本组新增 9 个真实组件入口，总数由 82 增至 91。实现范围为路线 G00、G01、G02、G03、G04 的单个本地日期时间、G07、G08、G09、G10 的原生表单适配。G04 的日期时间范围、G05 月/年选择与 G06 分段输入未在本组实现，不能据此关闭整条能力缺口。

本组保持现有未提交改动，不提交、不推送，不操作 5188/5193 服务。公开导出由现有自动发现机制生成；未手改主站入口或其他组目录。父级仍需集成独立演示目录并决定路线/能力矩阵的验收状态。

## 组件合同

属性、事件名称及默认值由现有源码解析器生成，唯一来源是各组件的 defineProps/defineEmits。这里仅记录不能由类型和默认值表达的行为约束。

| 入口 / 源码 | 模型和行为合同 | 表单与限制 |
| --- | --- | --- |
| [range-slider](../src/components/advanced-input/range-slider.ce.vue) | 两个原生 range；双端数组。步长相对于 min 对齐，碰撞后停住，不交换手柄身份；外部反向值排序归一化。input 连续发更新，change 发一次交互完成。键盘交给原生 range。 | startName/endName 单独指定两个名称，或 name 派生为 name[start]、name[end]。始终有两个数值，required 不构成空值校验。reset 恢复挂载值。 |
| [calendar](../src/components/advanced-input/calendar.ce.vue) | YYYY-MM-DD 或 null，独立内联月网格。每个按钮都有完整日期可访问名、日期数据属性；当前日、选中日、外月分别标记。单一 Tab 入口；方向键按日/周，Home/End 按周，PageUp/PageDown 按月，Shift+Page 按年；键盘跳过禁用日，跨月跟随焦点。viewDate 控制可见月，update:viewDate 通知翻页。 | 真正可校验的原生 text 代理提交；required、禁用值及日期上下限参与验证，invalid 把焦点交回日历。disabledDates 是明确日期列表；不是任意规则引擎。 |
| [date-range-picker](../src/components/advanced-input/date-range-picker.ce.vue) | 两个本地日期字符串组成数组；未完成合同为 [start,null]，空为 [null,null]。第一次点选开始新范围，第二次按先后排序；完成后再点击重开。双月内联显示，窄屏纵向堆叠。复用 calendar 算法与键盘行为；共享范围高亮。清空后所有端点标记同时移除。 | 两个可编辑原生 date 字段，两个名称按 slider 同样的约定指定。未完成端点不进入 FormData，但原生字段仍存在，required 要求两端完整。结束早于开始、上下限越界、范围内包含 disabledDates 都不能有效提交。不是弹出式日期范围面板。 |
| [time-range-picker](../src/components/advanced-input/time-range-picker.ce.vue) | 两个 HH:mm 本地时间。step 以分钟计，传给原生 time 时转换为秒。默认允许 overnight：结束小于等于开始表示次日结束，起止相同表示 24 小时；不允许 overnight 时结束小于开始无效，相同表示 0 分钟。getInterval() 返回分钟数或 null。 | 两个原生 time 字段，两个名称和未完成端点提交规则与日期范围一致。min/max 分别限制每个端点，是普通当日边界，不是跨午夜可用时间窗口。原生 required、step、min/max 负责端点校验；范围顺序由 custom validity 补充。 |
| [datetime-picker（已移除）](component-pruning.md) | YYYY-MM-DDTHH:mm 或 null，分钟精度的本地民用时间。采用原生 datetime-local；不生成 offset、Z、epoch，不解析成 UTC。无效日期、滚动日期、带时区值归一为空。step 以分钟计。 | name、required、min/max、step、readonly/disabled 落到原生控件。外部时区转换、DST 非存在/重复时刻的政策由业务负责。不是日期时间范围。 |
| [mention](../src/components/advanced-input/mention.ce.vue) | 普通 textarea 字符串；items 为字符串或 {value,label,disabled}。只匹配空白/文本起始后的 trigger+query，且必须为折叠光标。同步本地过滤；替换范围仅覆盖光标前触发片段，保留文本后缀并恢复光标。select 事件参数为 item 与 {start,end,text}。 | 原生 name、required、maxlength；reset 恢复挂载文本。IME composition 期间不筛选提交候选。上下键跳禁用候选、Enter 选择、Escape 关闭；Tab 只移动焦点，不改文本。光标留在 textarea，aria-controls/activedescendant 指向候选。空列表有状态提示。无内建异步请求；宿主更新 items 并自行处理请求取消/乱序。 |
| [form](../src/components/form-completion/form.ce.vue) | 原生 form 协调器；handleSubmit 接收 {form,data,event,submitter}，可返回 Promise。submitHandler(event,context) 为事件风格适配，二者同时存在时以 handleSubmit 为准。等待中防重；成功/错误事件；拒绝显示错误，reset/卸载忽略旧 Promise 完成。无 handler 时保留原生提交默认动作。 | action/method/enctype 等 attrs 由单根原生 form 接收；不应套在另一个 form 内。data 在进入 pending 前读取，包含原生 submitter。捕获阶段聚合原生控件输入，记录自重置以来变化过的名称 dirty、失焦名称 touched、invalid 名称和 submitted 标记；dirty 不是与初始快照比较的“值是否回到原样”。默认插槽和 status 插槽公开状态；暴露 requestSubmit/reset/checkValidity/getState。 |
| [editable](../src/components/advanced-input/editable.ce.vue) | 显示→编辑→保存/取消，失焦保留编辑草稿。Enter 保存，multiline 用 Ctrl/Meta+Enter；Escape 取消。saveHandler(value) 是唯一异步保存回调，save 事件仅通知成功。拒绝保留草稿并聚焦编辑器；成功/取消聚焦显示按钮；等待中不重复保存。外部模型更新不覆盖活动草稿。 | name 提交已确认值，草稿不进入提交值；required 约束保存时的编辑器。reset 丢弃草稿并忽略旧保存结果。不是富文本引擎，不实现失焦自动提交。 |
| [transfer](../src/components/advanced-input/transfer.ce.vue) | modelValue 是右侧目标集合；options 使用唯一字符串 value（内部转字符串去重）。左右分别呈现 available/selected。移动临时选中与已确认目标集合分开；搜索只过滤可见项；全选仅选当前过滤下可移动项，disabled 项不能移入或移出。未知目标值保留为不可移动回退项。 | 两个原生 multiple select，浏览器负责上下键/Shift/Ctrl/Meta 多选。提交隐藏字段为每个目标值重复 name，与搜索/临时选择无关；required 要求目标集合非空。reset 恢复集合并清空两侧搜索和临时选中。不含虚拟化，适合中等数量选项。 |

## 日期基础和动效

[local-date 工具](../src/utils/local-date.js) 由日历、范围和日期时间共同使用。本地日期通过数字年月日生成和检查；不使用 Date(YYYY-MM-DD) 的 UTC 解析路径。年份 1–9999；无时区模型，日期算法跨月份/闰年处理在工具层测试。

颜色全部走已有 token。新共享 SCSS 只在[本组 mixin](../src/styles/_advanced-input.scss)输出调用方作用域样式。按钮复用现有基础按钮或公共按下/焦点/涟漪 mixin；字段不按下缩放。输入、拖动、过滤结果与表单值保持即时；候选弹层使用 presenceTransition，错误区使用 collapseTransition，行内编辑使用公共 fade/content。退出即时 inert/aria-hidden，reduced motion 继承全局规则。

## 父级接入

[独立元数据](../src/site/advanced-input-catalog.js) 导出 advancedInputCatalog；[独立演示](../src/site/advanced-input-examples.vue) 接收 component slug，只挂载当前组的一项。没有改动 App、主 catalog、主 examples 或其他组文件。构建会自动刷新生成的 src/index.js。

Vue 接入使用自动生成的 KimaRangeSlider、KimaCalendar、KimaDateRangePicker、KimaTimeRangePicker、KimaDatetimePicker、KimaMention、KimaForm、KimaEditable、KimaTransfer。复杂值在原生自定义元素中通过 DOM 属性赋值（modelValue、options、items、handleSubmit、saveHandler），不能将数组/函数当作 HTML 文本属性。Vue 用模型更新事件；自定义元素对应 CustomEvent 的 detail 为事件参数数组。

表单与已有 kima-field 按原生子控件组合：field 维护描述和宿主错误；form 捕获原生有效性，invalid 事件同时提供 control、message 和最近 field 节点。form 不覆盖 field 的错误、不推断 schema，不执行跨字段/远程业务校验；业务可在 handleSubmit 中拒绝 Promise，并由宿主更新 field.error。

## 验证

- `pnpm build`：通过。
- `pnpm build:lib`：通过。
- `pnpm verify:lib`：通过，91 组件，Vue 提取样式、自定义元素内联样式、SSR 导入与独立浏览器模块校验通过。
- `pnpm exec playwright test --config playwright.advanced-input.config.js --workers 4`：48/48 通过（24 项桌面/移动 Chromium），5211 独立服务，输出 test-results/advanced-input。覆盖模型与真实 FormData、必填/边界/禁用、重置、月网格键盘、IME/光标、异步成功/拒绝/防重、取消、过滤和原生多选键盘、快速状态、reduced motion、9 项文档属性/事件解析。
- `node --test tests/advanced-input.ssr.test.js`：2/2 通过，包含全部 9 项非空模型 SSR 和本地日期解析/闰年/时区值拒绝。
- 专项测试生成 shots/advanced-input 的 36 张默认演示截图（9 项 × 深浅 × 桌面/移动）。已检查移动双月和桌面穿梭框布局。截图使用当前仓库默认灰度风格；不改现有主题来源。

专项浏览器测试不是全库回归。未在本组运行其他 82 项的完整测试、公开发布、人工读屏、Firefox/WebKit/真实移动 OS 系统日期面板验收。原生日期/时间/多选的视觉和键盘细节受系统与浏览器影响。日期范围已覆盖，但日期时间范围、月/年/分段字段、schema/动态字段数组、异步 mention 请求管理和 transfer 虚拟化仍不在本组能力合同内。
