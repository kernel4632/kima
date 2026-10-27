# 内容过渡布局审查与修复记录

## 范围与结论

基于 v0.8.4 对过渡期间的内容坐标、换行宽度、承载容器高度和后续内容位置做了首轮审查，并根据结果实施了第一批修复。

- 原始审查覆盖 31 个高风险场景、640px/280px 两种内容宽度，共 62 组基础记录；另检查 Carousel、Tabs、LongText 快速反向切换。
- 后续对首批修复组件进行了 Chromium 定向复查，冻结 0%、50%、95% 帧并等待 Vue 清理后检查终态。
- 这是针对性中间帧验收，不等于全组件、全浏览器、全部主题的完成验收。
- 审查截图与 json 几何数据保存在忽略目录 `shots/motion-layout-audit/`，不进入发布包。

## 已修复并回归

### Carousel 定位与共用高度动画

- Carousel 视口建立了自己的定位参照，退场幻灯片以视口内边距为边界，不再漂移到外层 Tabs 面板。
- `useContentMotion()` 中断旧动画时保存当前视觉高度/透明度；DOM 更新后重测自然目标高度，再从中断帧继续到新目标。
- 动画完成、减少动态效果、无有效动画以及卸载时，恢复原先的内联 `height`、`overflow`、`box-sizing` 和透明度。
- 高度目标接受原生 DOM ref 与 Vue TransitionGroup 组件 ref。
- 快速反向测试：Carousel、Tabs、LongText 在 640px 与 280px 下不再沿旧终点继续运行；near-end 高度回到当前目标，动画清理后 `overflow` 恢复。
- Carousel 正常切页仍会触发预期的视口高度补间；退场旧页 offsetParent 已是 viewport，旧内容不再横向变宽或重新换行。

### 字段消息与行内编辑

- Field、TextField、Textarea 的消息承载区对消息长度/错误类型变化补高度过渡，不再只对消息显隐做外层折叠。
- 移除了消息内部互斥交叉淡入层，避免新旧消息在同一 grid 中同时占高度、动画结束再瞬间收缩。
- Editable 由根容器补高度，并让退场按钮从文档流脱离，限制为内容自身宽度，避免旧按钮被拉成整行后产生容器高度误测。
- 640px/280px 中间帧均无后续标记首帧跳移；Field/TextField/Textarea 由结束时塌陷变为连续收缩。Editable 在两种宽度下稳定由 140px 过渡至约 212px。

### Table

- 滚动承载区对数据行集、loading 和展开行变化补高度过渡。
- 移除了把 `<tbody>`/`<tr>` 设为绝对定位的列表通用样式，避免破坏原生表格列宽和行布局；loading/rows 使用互斥 tbody，不让两个表体交叉淡入时叠高。
- 删除行、loading、展开详情的承载区高度现在有连续补间；table 语义与列布局保留。

### 骨架、普通列表与任务列表

- 新增 `freezeLeaveLayout()`：在普通 grid/flex 列表中冻结退场元素的当前位置和宽高，脱离布局并保留 inert/`aria-hidden` 语义；表格行不使用该 helper。
- List、Timeline、DynamicInput、UploadManager、ProgressGroup、FileUpload 的退场节点使用上述布局冻结；相应的内容容器/组件根节点执行高度补间。
- Skeleton 的 placeholder/content 退场先冻结几何，由根容器高度动画协调旧骨架与真实内容的高度切换。
- 复查的 640px/280px 场景均无运行时异常。List 的后续标记中间帧从初始高度连续下降至终态；Timeline、DynamicInput、UploadManager、ProgressGroup、Skeleton 同样在 50%/95% 帧内完成对应高度变化。
- FileUpload 容器高度从 296px 连续到 240px；此前内部 list ref 不覆盖外层文件选择区高度的问题已改为动画整个组件根容器。

## 尚未完全通过 / 仍需后续修复

- TagGroup、MultiSelect、TagsInput 在窄屏多行标签删除时，Flex 子项及剩余 chip 会在首帧换行/横移；容器高度补间虽能降低突变，但并未完全消除所有子项坐标跳变。应继续设计固定原位退场与存活子项布局 FLIP 的协调策略，并检查插槽/RTL 情况。
- List、DynamicInput、ProgressGroup、UploadManager 仍有部分 transition 子节点在首帧脱离流时发生预期的行内坐标/尺寸重排；外层高度已补间，但视觉上仍应逐项检查滚动、嵌套和多列场景。
- Table 删除行没有把整行绝对定位；当前外层高度过渡有效，但仍需人工确认真实生产数据下表格滚动区域是否裁切淡出行，以及快速连续排序/删除组合。
- RichTextEditor 链接面板、InfiniteScroll、Pagination、AvatarGroup、Cascader、Button loading 等首轮审查项目未在本批处理，继续列为待办。
- Calendar、Chart、Heatmap、Equation、JsonInput 调用共享高度工具；本轮只验证了 Carousel/Tabs/LongText 的反向操作，其他调用方需要逐项回归。

## 验收证据与限制

- `node scripts/audit-motion-layout.mjs http://127.0.0.1:5188 '<场景正则>'` 可对指定场景生成中间帧、终态截图与几何数据。
- 本批已复查 Carousel/Tabs/LongText、Table、Editable、Field/TextField/Textarea、Skeleton、List、Timeline、DynamicInput、FileUpload、UploadManager、ProgressGroup、TagGroup、MultiSelect、TagsInput。
- Playwright 几何脚本用于发现位置和尺寸变化；`initialJumps` 同时会记录布局冻结后旧节点的 offsetParent 变化，因此计数不等于视觉失败，需结合每帧截图与容器/后续 marker 数值判断。
- 本记录不会把“构建成功”或“单次无异常”写成全库动效验收通过。
