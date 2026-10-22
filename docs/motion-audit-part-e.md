# 动效审查 E：新增 63 项（83—145）与表格增强真实核验

本轮先全文读取仓库协作约束，逐个读取七组目录元数据及组件脚本、模板、局部样式，核对共享运动工具。83—145 是在原 82 项基础上的新增清单编号，不是当前文件名排序号。七组数量为 9 + 9 + 10 + 13 + 11 + 5 + 6 = 63；数据组表格是额外增强，工具组通知队列已在数据组计数，表单闭环目录末尾表单/颜色编辑是已有增强，不重复计入新增项。

本轮不提交、不推送，不停止或重启 5188/5193。主 Playwright 配置、目录、示例、README、组件索引、comparison、roadmap 和协作约束均不由本轮修改。抽屉源码及其完成等待状态机、2px 阈值均保留。表格增强源码在进入任务时已存在，本轮以真实测试核验；不是把已有改动归为本轮修复。

## 证据口径

专项入口为 [`tests/final-motion.spec.js`](../tests/final-motion.spec.js:1)，由未修改的主配置自动发现。运行使用独立端口 5224、单 worker，桌面 Chromium 与 Pixel 7 移动模拟项目。每个逐项用例分别在普通运动和减少动态效果下实际挂载、执行表内动作，记录五个真实浏览器帧、当前文本、几何、透明度、不可交互状态及浏览器实际动画。每态保存一张截图。

“状态通过”只指表内明确动作及减少动态效果分支；不能理解为组件全部功能、所有浏览器或真实手机验收。五帧采样不保证每项都有中间帧：例如原生输入即时更新、静态排版没有独立运动，不能把空动画数组写成运动已验证。额外帧专项使用浏览器实际运行中的动画进度在 0 与 1 之间作为证据；不只检查声明的时长，不人为延长 token 或暂停动画制造帧。

证据位于已忽略的 artifacts/final-motion 目录：桌面/移动各有“组件名-no-preference”和“组件名-reduce”的 JSON 与 PNG；额外聚合帧记录对应下表中的帧专项名。运行日志和退出码也在该目录。本报告中的暂未完成字段会在最终退出结果确认后更新。

可直接检查的真实帧证据：

- [图片预览进出与重开](../artifacts/final-motion/desktop/image-preview-presence.json)：普通进入透明度在 0—1 之间，离开时仍可见且即时隔离，重开恢复活动。
- [五类列表退场](../artifacts/final-motion/desktop/list-exits.json)：动态字段、标签、进度任务、通知项外壳、上传任务分别采样，均保留退出节点并立即隔离。
- [局部内容更新](../artifacts/final-motion/desktop/content-update-frames.json)：日历、公式、字段组、JSON 消息和长文本的真实透明度帧。
- [虚拟行配色帧](../artifacts/final-motion/desktop/virtual-color-frames.json)、[加载条重入](../artifacts/final-motion/desktop/loading-reentry.json)、[日历快速返回与零时长](../artifacts/final-motion/desktop/calendar-reversal-zero.json)。
- [构建日志](../artifacts/final-motion/build.log)、[库构建日志](../artifacts/final-motion/build-lib.log)、[产物校验日志](../artifacts/final-motion/verify-lib.log)、[SSR 日志](../artifacts/final-motion/ssr.log)。

视觉证据曾暴露通用行为夹具的白底/深色文字 token 配对错误：原先日历白底浅字截图不可读，不能判为视觉通过。专项自身补配对主题背景，另加 calendar/image-preview 的 light/dark-readable 截图；不修改通用夹具或组件色板。最终视觉结果以重跑后的图为准，早先白底图只作问题追踪。

## 本轮修复

- [`calendar.ce.vue`](../src/components/calendar.ce.vue:7)：翻月后的真实新网格做局部淡化，旧月不保留第二套交互日期，不延迟键盘跨月焦点。
- [`image-preview.ce.vue`](../src/components/image-preview.ce.vue:2)、[`rich-text-editor.ce.vue`](../src/components/rich-text-editor.ce.vue:2)、[`chart.ce.vue`](../src/components/chart.ce.vue:2)：弹层退场开始立即隔离交互/读屏；预览的异步焦点恢复检查是否已经重开。
- [`copy-button.ce.vue`](../src/components/copy-button.ce.vue:3)：复制文案同格交叉淡化，状态播报即时；卸载清除恢复文案的计时器。
- [`infinite-scroll.ce.vue`](../src/components/infinite-scroll.ce.vue:4)：加载/错误/完成/按钮状态增加 keyed 淡化，旧状态即时隔离。
- [`virtual-table.ce.vue`](../src/components/virtual-table.ce.vue:1)、[`virtual-tree.ce.vue`](../src/components/virtual-tree.ce.vue:1)：选中配色同时过渡文字与背景；虚拟表格选中悬停保持容器色配对。
- [`chart.ce.vue`](../src/components/chart.ce.vue:43)、[`heatmap.ce.vue`](../src/components/heatmap.ce.vue:1)：数据表展开/收起复用真实高度过渡，关闭立即隔离。
- [`field-group.ce.vue`](../src/components/field-group.ce.vue:10)、[`json-input.ce.vue`](../src/components/json-input.ce.vue:7)、[`long-text.ce.vue`](../src/components/long-text.ce.vue:5)：当前消息/展开内容局部淡化，不保留过时校验语义；JSON 只淡化校验文案，不淡化编辑区，格式化按钮复用基础按钮反馈。
- [`progress-group.ce.vue`](../src/components/progress-group.ce.vue:4)：任务列表增删过渡，汇总值保持即时。
- [`dynamic-input.ce.vue`](../src/components/dynamic-input.ce.vue:27)、[`upload-manager.ce.vue`](../src/components/upload-manager.ce.vue:23)：修复局部表面过渡覆盖列表透明度/位移的问题，补定位容器与精确过渡优先级。
- [`notification-queue.ce.vue`](../src/components/notification-queue.ce.vue:67)：稳定队列项外壳承接父级退场，避免和通知内部过渡互相取消；退出外壳立即隔离完整通知。
- [`content-motion.js`](../src/utils/content-motion.js:5)：快速更新从当前透明度续接；尊重零时长和局部减少运动；防止卸载后异步开启动画。
- 浏览器核验同时发现并修复 [`form.ce.vue`](../src/components/form.ce.vue:20) 缺失状态通知函数、异步提交拦截过晚的问题；[`time-field.ce.vue`](../src/components/time-field.ce.vue:5) 默认不带秒时仍初始化三段导致完整时间不成立的问题。两者属于本轮实际执行暴露的语义问题。

## 逐项来源、实际动作与边界

各行的“状态”测试对应专项文件的“63 audit / 分组 / 组件名”；两种运动偏好均执行。中间帧、退场及快速反向列只对明确列出的分支成立；“不适用”有意不强加运动。“未独立测”表示本轮没有对应专项断言，不冒充覆盖。

| # | 源码 | 实际可见状态切换 / 测试动作 | 中间帧、退场、反向证据 / 边界 |
| --- | --- | --- | --- |
| 83 | [range-slider](../src/components/range-slider.ce.vue:1) | 键盘上限控件增加，输出与原生值即时 | 拖动/值无补间；无独立退场，反向不适用；减少运动状态场景 |
| 84 | [calendar](../src/components/calendar.ce.vue:1) | 六月→七月、跨月方向键焦点 | content-update-frames、calendar-reversal-zero；新网格淡化，无旧月退场；快速回月/零时长专项 |
| 85 | [date-range-picker](../src/components/date-range-picker.ce.vue:1) | 双月上一月，标题真实变化 | 子日历承担翻月；普通五帧采样，双月快速反向未独立测；系统日期面板不由库动画 |
| 86 | [time-range-picker](../src/components/time-range-picker.ce.vue:1) | 结束时间 10→11，间隔立即变 2h | 原生时间输入/文本输出即时；无独立退场，反向不适用 |
| 87 | [datetime-picker](../src/components/datetime-picker.ce.vue:1) | 原生本地日期时间修改 | 系统面板无库内动画；场地焦点反馈采样；不对输入值补间 |
| 88 | [mention](../src/components/mention.ce.vue:1) | 输入 @ 打开两项建议，Escape 关闭 | mention-presence：真实进/退场、退出隔离、快关快开、减少运动 |
| 89 | [form](../src/components/form.ce.vue:1) | 异步提交失败，显示错误内容 | 错误高度过渡五帧；提交立即拦截，校验/事件不等动画；错误收起反向未独立测 |
| 90 | [editable](../src/components/editable.ce.vue:1) | 展示→编辑，输入即时获得焦点 | editable-presence：编辑区进/退场和快速取消/重开；原生 hidden 值不包动画 |
| 91 | [transfer](../src/components/transfer.ce.vue:1) | 原生多选选择 Alpha 并移入，hidden 值即时为 a | option 列表属于原生选择行为，增删不保留过时选项；按钮承接反馈；独立退场不适用 |
| 92 | [infinite-scroll](../src/components/infinite-scroll.ce.vue:1) | 加载更多→loading→finished | copy-infinite-frames：旧 loading 可见退场、立即 inert；请求完成语义即时；错误重试旧专项另记 |
| 93 | [virtual-table](../src/components/virtual-table.ce.vue:1) | 外部选择 a，行容器色变化 | virtual-color-frames：真实配色中间帧；回收行/滚动无位移过渡；选择反向仅 reduced 更新 |
| 94 | [virtual-tree](../src/components/virtual-tree.ce.vue:1) | 展开根节点，子项即时出现；选择根 | virtual-color-frames：选择颜色帧；箭头已有旋转；虚拟回收无退场，高度展开不做动画 |
| 95 | [image-preview](../src/components/image-preview.ce.vue:1) | 缩略触发→预览→关闭/重开 | image-preview-presence：进/退场、快反、即时隔离；缩放/旋转仅源码及旧专项，不伪称本轮全测 |
| 96 | [notification-queue](../src/components/notification-queue.ce.vue:1) | 外部清空队列 | list-exits：队列项外壳真实退出/即时隔离；服务订阅/容量不属于动画延迟；同 ID 快重入未独立测 |
| 97 | [relative-time](../src/components/relative-time.ce.vue:1) | 固定时间/locale 渲染 | 时间文本直接更新，无自有可交互状态；不添加周期性抢眼运动；退场/反向不适用 |
| 98 | [ring-progress](../src/components/ring-progress.ce.vue:1) | 20→80，语义立即为 80 | numeric-continuous：真实 dashoffset 中间帧和反向到 10；reduced 无运动 |
| 99 | [copy-button](../src/components/copy-button.ce.vue:1) | 真实按钮触发模拟成功的剪贴板 API，文案/状态更新 | copy-infinite-frames：文案交叉帧；剪贴板权限/失败不由此测试覆盖；自动恢复快反未独立测 |
| 100 | [long-text](../src/components/long-text.ce.vue:1) | 一行折叠→展开全文，展开语义即时 | content-update-frames；局部内容淡化，不人为动画截断行数；收起反向未独立测 |
| 101 | [datetime-range-picker](../src/components/datetime-range-picker.ce.vue:1) | 结束早于开始，错误立即显示 | 原生输入/校验及时；无保留旧错误退场；系统面板动画不适用 |
| 102 | [period-picker](../src/components/period-picker.ce.vue:1) | 月份 06→07 | 原生 month/year 编辑即时；系统面板不可控制；独立退场/反向不适用 |
| 103 | [date-field](../src/components/date-field.ce.vue:1) | 年/月/日逐段填写，hidden 提交值成立 | 自动前移焦点即时；不对字符/光标运动；独立退场不适用 |
| 104 | [time-field](../src/components/time-field.ce.vue:1) | 时/分逐段填写，hidden 09:30 | 默认两段初始化已修；即时表单值；独立退场不适用 |
| 105 | [time-select](../src/components/time-select.ce.vue:1) | 打开预设选项 | 复用 select 的 popup；普通五帧和 reduced 状态；该包装的快反未独立测 |
| 106 | [dynamic-input](../src/components/dynamic-input.ce.vue:1) | 删除第一行，活动列表立即只剩一行 | list-exits：真实透明度/位移退场且 inert；本轮修复覆盖；重排反向未独立测 |
| 107 | [masked-input](../src/components/masked-input.ce.vue:1) | 输入 ab-12 保留即时文本 | 掩码/光标必须即时；不加字符动画；无独立退场 |
| 108 | [json-input](../src/components/json-input.ce.vue:1) | 有效 JSON→语法错误，格式化即时禁用 | content-update-frames：消息区域真实帧；旧校验不保留；编辑区不淡化；快速内容工具有续接处理 |
| 109 | [angle-slider](../src/components/angle-slider.ce.vue:1) | 方向键 0→1，语义即时更新 | 角标位置跟手，不对角度缓动；无独立退场/反向 |
| 110 | [upload-manager](../src/components/upload-manager.ce.vue:1) | 文件选择→任务显示→移除 | list-exits：真实任务退场且 inert；缺少宿主 upload 显示 error；未伪称服务端上传全测 |
| 111 | [tour](../src/components/tour.ce.vue:1) | 外部打开，目标聚光/原生模态可见 | tour-modal-frames：模态实际帧、关闭重开/reduced；聚光换目标几何仅源码检查 |
| 112 | [qr-code](../src/components/qr-code.ce.vue:1) | KIMA 二维码实际渲染 | 二维码需稳定可扫，无独立交互状态；不做像素淡化；退场/反向不适用 |
| 113 | [watermark](../src/components/watermark.ce.vue:1) | 文字水印及内层按钮渲染 | 静态装饰/尺寸重排，不能拦点击；不强加独立运动 |
| 114 | [affix](../src/components/affix.ce.vue:1) | sticky 内容渲染 | 粘附位置跟随原生滚动，无插值追赶；滚动边界旧专项另记；独立退场不适用 |
| 115 | [float-button](../src/components/float-button.ce.vue:1) | 展开动作组，第一操作即时聚焦 | float-button-presence：实际进/退、快反、语义/reduced |
| 116 | [log-viewer](../src/components/log-viewer.ce.vue:1) | 搜索 Beta 立即过滤成一行 | 日志追加/搜索/跟尾应即时，不让退场日志滞留 live log；无独立退场 |
| 117 | [loading-bar](../src/components/loading-bar.ce.vue:1) | start→finish，任务数/忙碌即时 | loading-reentry：真实退出、快反不被旧清理隐藏、reduced；保留 finishDelay 既有可见完成反馈 |
| 118 | [animated-number](../src/components/animated-number.ce.vue:1) | 0→100→-20；读屏目标值即时 | numeric-continuous：多个实际数字中间帧、反向最终精确、reduced 即时；无独立退场 |
| 119 | [listbox](../src/components/listbox.ce.vue:1) | 点击 Beta，选择语义/hidden 值即时 | 行配色已有过渡与普通采样；无列表保留退场，键盘焦点即时；快反未独立测 |
| 120 | [progress-group](../src/components/progress-group.ce.vue:1) | 删除一任务、汇总立即 80，再清空 | list-exits：任务真实退场；aggregate 不等动画；同 key 重入未独立测 |
| 121 | [alert-dialog](../src/components/alert-dialog.ce.vue:1) | 打开危险确认，默认取消焦点 | alert-dialog-modal-frames；内部按钮加载运动复用；异步确认失败分支由旧专项验证 |
| 122 | [virtual-select](../src/components/virtual-select.ce.vue:1) | 打开虚拟选项面板 | virtual-select-presence：进/退、快反/reduced；虚拟行回收不加进退 |
| 123 | [tag-group](../src/components/tag-group.ce.vue:1) | Delete Alpha，hidden 提交立即删除 | list-exits：实际芯片退场/inert；roving 不选退场按钮；同值快速恢复未独立测 |
| 124 | [grid](../src/components/grid.ce.vue:1) | 静态格子内容渲染 | 无独立交互/显隐状态，不对布局根施加强制运动；退场/反向不适用 |
| 125 | [flex](../src/components/flex.ce.vue:1) | 静态弹性内容渲染 | 同上；响应式重排即时，无独立运动状态 |
| 126 | [stack](../src/components/stack.ce.vue:1) | 静态堆叠渲染 | 同上；不动画焦点顺序或阅读顺序 |
| 127 | [field-group](../src/components/field-group.ce.vue:1) | hint→error，内部控件立即 invalid/关联 | content-update-frames：当前消息淡化；旧消息不保留可访问 ID；高度退场未单独实现 |
| 128 | [input-group](../src/components/input-group.ce.vue:1) | 内部原生输入渲染 | 组合布局无独立状态，控件反馈由内部组件负责；退场/反向不适用 |
| 129 | [page-header](../src/components/page-header.ce.vue:1) | 标题/说明渲染 | 静态页面结构，不把路由文本变化强行动画化 |
| 130 | [banner](../src/components/banner.ce.vue:1) | 关闭、恢复横幅 | banner-collapse：实测高度帧/退场隔离、快速反向/reduced |
| 131 | [error-state](../src/components/error-state.ce.vue:1) | retry→pending→失败文案 | pending 复用按钮加载交叉；消息即时不保留旧错误；重试内容反向未独立测 |
| 132 | [typography](../src/components/typography.ce.vue:1) | 原生文本语义渲染 | 静态排版，无独立运动/退场 |
| 133 | [mark](../src/components/mark.ce.vue:1) | 原生标记渲染 | 静态行内标记，不对阅读文字做出入场 |
| 134 | [time-display](../src/components/time-display.ce.vue:1) | 固定日期格式化渲染 | 无计时器/交互状态；文本准确性优先，无独立运动 |
| 135 | [chart](../src/components/chart.ce.vue:1) | 打开/收起数据表 | chart-collapse 真实高度、退出隔离、快反/reduced；数据刷新 useContentMotion，图例全路径未独立测 |
| 136 | [heatmap](../src/components/heatmap.ce.vue:1) | 打开/收起数据表 | heatmap-collapse 同上；值更新不保留过期网格；格子选择即时 |
| 137 | [rich-text-editor](../src/components/rich-text-editor.ce.vue:1) | 链接面板开/关/快重开 | rich-text-editor-presence 实际帧/语义/reduced；文本输入/选区不延迟；编辑核心仍由既有测试覆盖 |
| 138 | [code-editor](../src/components/code-editor.ce.vue:1) | 点击查找，实际 CodeMirror 搜索栏显示 | 第三方编辑器即时搜索/光标/折叠，不人为延迟；本轮不宣称自有退场动画 |
| 139 | [equation](../src/components/equation.ce.vue:1) | 公式 x²→y³，MathML 即时更新 | content-update-frames；不保留旧数学语义；独立退场不适用 |
| 140 | [sidebar](../src/components/sidebar.ce.vue:1) | 桌面宽度 288→180，语义即时 | sidebar-width-reverse 实际宽度帧/快反/reduced；移动复用 drawer，2px/完成状态机保留 |
| 141 | [app-shell](../src/components/app-shell.ce.vue:1) | 窄屏导航抽屉开/关/重开 | app-shell-modal-frames 复用原抽屉实际运动；布局断点切换保持即时，不增加布局补间 |
| 142 | [config-provider](../src/components/config-provider.ce.vue:1) | 配置容器/内容渲染 | 行为/主题作用域，无独立进退；局部零时长由 calendar 专项检查，不强制主题运动 |
| 143 | [masonry](../src/components/masonry.ce.vue:1) | 原生列布局内容渲染 | columns/图片重排不引入独立进退；已有 gap 过渡，动态 gap 未独立测 |
| 144 | [marquee](../src/components/marquee.ce.vue:1) | 显式 animated 后暂停；reduced 停用 | 轨道实测样式/五帧，副本 inert；无独立退场；恢复/hover 全路径未独立测 |
| 145 | [gradient-text](../src/components/gradient-text.ce.vue:1) | 显式 animated 文本可见 | numeric-continuous：真实连续动画进度；reduced 无动画；静态默认不运动 |

## 表格及既有增强

[`table.ce.vue`](../src/components/table.ce.vue:1) 的本地排序、展开行退出、loading/data 快速反向，由专项的 table enhancement 测试验证。排序语义即时；旧 tbody/展开行可见退出时已隔离；恢复后两个活动行。列宽和编辑不应加布局/输入延迟，本轮未改表格源码；旧 final-enhancement 专项保留本地/受控排序、列隐藏、summary、键盘列宽测试。测试标题中的 edit/keyboard 不能替代断言覆盖，以实际测试体为准。

颜色编辑 HSV/alpha、远程选择器、命令搜索等增强不计入 63 个新增入口；保留既有状态与运动逻辑，本轮不会仅凭源码存在宣布其全部路径通过。

## 实际运行与剩余边界

- 首轮桌面：76 项，67 通过、9 失败，退出 1；日志 desktop.log。失败包含月份本地化断言、重复宿主 ID 定位、表单异步默认提交、默认时间段数、列表过渡覆盖。已按证据修复或修正测试。
- 第二轮桌面：76 项，74 通过、2 失败，退出 1；63 个逐项用例全部通过，剩余为 JSON 动效目标收窄后旧选择器及通知队列整项退场缺失。日志 desktop-r2.log。
- 完整动效专项：168/168，通过，退出 0，独立 5224、主配置、单 worker，桌面/移动各 84 项；[运行日志](../artifacts/final-motion/verified.log)、[退出码](../artifacts/final-motion/verified.exit)。其中 126 项为 63 入口的两个设备项目，每项内部普通/减少运动各执行一次；其余 42 项为真实帧/退场/反向/零时长专项。
- 主题配对后的最终版本：动效专项 170/170（[运行日志](../artifacts/final-motion/visual-final.log)，退出 0），新增深浅两套可读截图用例（浅色日历、深色图片预览均已人工核对）。
- 独立 5224 旧交互回归：105/105（[运行日志](../artifacts/final-motion/regression.log)，退出 0），覆盖抽屉完成等待、表格/远程选择器、表单闭环、菜单/导航/折叠、异步生命周期、导览/日志等既有专项。
- 证据清单：[manifest](../artifacts/final-motion/manifest.json) 记录 63 入口源码 SHA-256 与 504 个逐项 JSON/PNG 证据文件；三组测试均使用同一测试文件版本。
- 生产构建、库构建、145 入口产物校验均退出 0；SSR 17/17，退出 0。SSR 有既存 HMR 24678 被占用警告及旧 form-completion SSR 探针传错属性类型警告，不能写成零告警。
- 忽略证据经 git check-ignore 确认；截图和 JSON 属于本地 artifacts，不纳入版本库。
- 未进行人工读屏、Firefox/WebKit、真实 iOS/Android WebView、低刷新率硬件逐项核验。静态组件仅做实际渲染及 reduced 重复状态，没有编造中间帧或不适用的退场/反向。
