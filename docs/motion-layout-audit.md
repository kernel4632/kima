# 内容过渡布局审查

## 范围与结论

基于 v0.8.4 对过渡期间的内容坐标、换行宽度、承载容器高度和后续内容位置做审查。
本文件记录**问题与复现结果，不代表已修复**。本轮没有修改生产组件或共用动效工具。

- 全库检索进退场、列表与高度动画实现，再选择 31 个高风险操作场景。
- Chromium 中分别使用 640px 和 280px 的可用内容宽度，共 62 组记录；这不是全组件、全浏览器验收。
- 隔离场景将时长拉长到 1000ms，保留原有缓动和几何实现，冻结浏览器动画于 0%、50%、95%，并等待 Vue 清理后再测终态。
- 正式文档页额外使用原默认时长复现 Carousel，避免只凭拉长时长的夹具得出结论。
- Carousel、Tabs、LongText 另外检查动画尚未结束时反向切换。
- 62 组最终记录均无运行时异常；“没有报错”不代表动效正确。

## P0：定位参照与动画中断

### Carousel：旧页先跳位、变宽、重新换行，再消失

问题位置：[旧页退场定位](../src/components/navigation/carousel.ce.vue:65)。

旧页被改成绝对定位，但 [viewport](../src/components/navigation/carousel.ce.vue:59) 没有建立自己的定位参照，且退场偏移没有保留原先层层叠加的内边距。
因此退场时定位参照变成外层容器，不是原来的幻灯片视口。

正式文档页默认时长下实测：

| 旧幻灯片 | 切换前 | 切换开始后 |
|---|---:|---:|
| 横坐标 | 404px | 364px |
| 纵坐标 | 616.375px | 560.375px |
| 宽度 | 680px | 760px |
| 定位参照 | 正常排版 | 外层预览 Tabs 的面板 |

也就是说，**文字还没有消失就左移 40px、上移 56px、变宽 80px**。
隔离场景同样出现左移/上移 40px、变宽 80px，窄屏下会更显著地改变换行。

本地证据：[正式页面切换前](../shots/motion-layout-audit/official-carousel-before.png)、[正式页面切换开始](../shots/motion-layout-audit/official-carousel-transition-start.png)。

### 共用高度工具：快速反向切换测到了旧动画高度

问题位置：[旧高度记录与新高度测量](../src/utils/content-motion.js:16)、[动画取消和收尾](../src/utils/content-motion.js:32)。

新一轮更新后，仍在生效的旧动画会覆盖元素高度；此时测出的“新高度”其实还是旧动画的当前高度。
有的分支因此判断没有高度变化而提前返回，旧动画继续奔向已过时的终点。
另一个分支只创建透明度动画并取消高度动画，导致高度立即跳回布局值，且旧的裁切样式未恢复。

已在浏览器复现的调用方：

| 组件 | 行为与实测 |
|---|---|
| [Carousel](../src/components/navigation/carousel.ce.vue:21) | 短页切长页过程中切回短页，仍继续长高到约 388px，清理时骤降到 180px；窄屏约 802px → 180px。 |
| [Tabs](../src/components/core/tabs.ce.vue:77) | 单次切换正常；反向切回短面板后容器继续接近 514px，结束时才回到约 115px；窄屏约 1060px → 115px。 |
| [LongText](../src/components/data/long-text.ce.vue:21) | 展开中途收起，高度约 177px → 48px（窄屏 413px → 48px）立即跳变，只剩透明度动画；清理后仍残留裁切样式。 |

本地证据：[Tabs 已显示短内容但仍保留长面板高度](../shots/motion-layout-audit/tabs-640-interrupted-95.png)。

## P1：首帧先重排，后续内容瞬移或被裁切

| 组件/操作 | 浏览器确认的表现 | 实现位置 |
|---|---|---|
| Table 删除行 | 行本身有淡出/位移动画，但表格外框先缩短，后续区域瞬间上移；仍在移动的旧行被表格滚动区裁切。640px 场景先上移 336px。 | [行退场规则](../src/components/data/table.ce.vue:579)、[滚动区裁切](../src/components/data/table.ce.vue:393) |
| Table 数据 → 加载态 | 两个表体重叠淡入淡出，但承载区首帧先缩短，旧数据在加载文字后方被裁切；640px 场景先上移 312px。 | [表体切换](../src/components/data/table.ce.vue:318)、[表体绝对定位](../src/components/data/table.ce.vue:574) |
| Table 展开详情 | 详情出现即把后续内容推下去，没有承载详情的高度过渡；640px 场景首帧下移 264px。 | [展开行](../src/components/data/table.ce.vue:355) |
| Timeline 删除项 | 旧项脱离排版后整条时间线立即变矮；后续页面先上移，旧项仍在淡出。 | [退场脱离布局](../src/components/display/timeline.ce.vue:28) |
| Editable 进入编辑 | 显示按钮和编辑区域临时占据两个 grid 行，先扩高再淡出旧按钮，最后又塌掉一行；后续标记 140 → 260 → 212px。 | [两个独立过渡](../src/components/advanced-input/editable.ce.vue:44)、[根布局](../src/components/advanced-input/editable.ce.vue:60) |
| RichTextEditor 打开链接面板 | 面板虽然有弹出动效，却仍在文档流内；编辑正文与后续区域首帧下移 72px，未做高度补间。 | [链接面板](../src/components/content/rich-text-editor.ce.vue:77) |
| TagsInput 窄屏删除标签 | 退场标签自身位置已冻结，但根容器先少掉一行；存活标签移动时下方被裁切，输入框也立即改变位置/宽度。 | [位置冻结](../src/components/input/tags-input.ce.vue:32)、[flex 布局](../src/components/input/tags-input.ce.vue:96) |

## P1：淡出时占位不变，结束后突然塌陷

以下都不是缺少动画类，而是**淡出和布局收缩没有衔接**。

| 组件/操作 | 640px 场景后续内容位置 | 280px 场景后续内容位置 | 实现位置 |
|---|---|---|---|
| Skeleton 加载结束（高骨架 → 短正文） | 淡出前及 95% 都为 316，清理后 148px | 同左 | [两个层叠 grid 子项](../src/components/display/skeleton.ce.vue:21) |
| Field 长提示 → 短错误 | 260 → 清理后 180px | 388 → 清理后 180px | [消息交叉淡入](../src/components/input/field.ce.vue:60) |
| TextField 长提示 → 短错误 | 260.73 → 清理后 174.39px | 390.25 → 清理后 174.39px | [提示切换](../src/components/core/text-field.ce.vue:234) |
| Textarea 长提示 → 短错误 | 335.19 → 清理后 255.19px | 463.19 → 清理后 255.19px | [提示切换](../src/components/input/textarea.ce.vue:88) |
| List 删除长条目 | 612 → 清理后 312px | 924 → 清理后 312px | [列表过渡](../src/components/display/list.ce.vue:34) |
| DynamicInput 删除行 | 473 → 清理后 358px | 同左 | [字段行过渡](../src/components/form-completion/dynamic-input.ce.vue:26) |
| FileUpload 移除文件 | 296 → 清理后 240px | 同左 | [文件行过渡](../src/components/input/file-upload.ce.vue:78) |
| UploadManager 移除任务 | 482 → 清理后 329px | 同左 | [任务列表过渡](../src/components/form-completion/upload-manager.ce.vue:18) |
| ProgressGroup 移除任务 | 296 → 清理后 243px | 同左 | [任务列表过渡](../src/components/utility/progress-group.ce.vue:16) |
| TagGroup 跨行标签移除 | 宽布局高度不变 | 180 → 清理后 132px；存活标签此时才上移 48px | [标签列表过渡](../src/components/utility/tag-group.ce.vue:31) |
| MultiSelect 跨行已选项移除 | 宽布局高度不变 | 240 → 清理后 192px；触发器一起跳高 | [已选项过渡](../src/components/interaction/multi-select.ce.vue:47) |

Field/TextField/Textarea 外层折叠动画只处理消息区域出现/隐藏；**消息始终非空时的长短切换不会触发外层高度动画**。

本地证据：[骨架屏 95%](../shots/motion-layout-audit/skeleton-640-0.95.png)、[骨架屏终态](../shots/motion-layout-audit/skeleton-640-after.png)、[列表删除 95%](../shots/motion-layout-audit/list-remove-280-0.95.png)、[列表终态](../shots/motion-layout-audit/list-remove-280-after.png)。

## P2：横向空间被旧新内容挤开

| 组件 | 已确认的表现 | 位置 |
|---|---|---|
| InfiniteScroll | 加载按钮与 spinner 同时在居中 flex 行内占位，原按钮先横移 22px，再淡出。 | [状态切换](../src/components/data/infinite-scroll.ce.vue:69) |
| Pagination | 页码窗口从第 4 页跳到第 12 页时，旧新页码/省略号同时占据 flex 空间；宽场景列表临时变宽 188px，方向按钮各向外跳 94px。 | [页码组](../src/components/core/pagination.ce.vue:148) |
| AvatarGroup | 删除头像后，旧节点淡出期间横向空间不释放，清理时组宽 184 → 120px；同类换行情况仍需补更大样本。 | [头像组](../src/components/display/avatar-group.ce.vue:25) |
| Cascader | 增加一级时弹层宽度第一帧增加 185px，新列才开始淡入；只是内容淡入，不是面板尺寸过渡。 | [列过渡](../src/components/core/cascader.ce.vue:363) |
| Button 加载态 | spinner 插入 flex 行时，按钮/标签几何在首帧改变；夹具中内部按钮宽度增加 32px。应区分常规加载反馈与不必要的整组挤动。 | [加载指示器](../src/components/core/button.ce.vue:65) |

## 未复现与尚待验证

本次单次操作中，DatePicker 翻月、Accordion 收起、Collapsible 收起和 Stepper 状态切换没有出现上述明显跳位。
这不是它们完整验收通过：例如本次没有覆盖所有主题、浏览器、嵌套布局及快速连续切换组合。

此外，Calendar、Chart、Heatmap、Equation、JsonInput 也调用了共用高度工具，属于中断逻辑的**源码风险波及范围**，尚不能写成每个都已在浏览器复现。
通知队列需要单独区分单条通知自身退场与外层堆叠移动，本轮不将其定性为与 Carousel 完全相同的问题。

## 修复顺序与验收边界

1. 先修 Carousel 的定位参照和旧页尺寸冻结，确保淡出第一帧文字不重排；同时修共用高度工具的中断重测/裁切恢复。
2. 以 Tabs、LongText 和 Carousel 的反向操作验证共用逻辑，不凭单次切换宣布完成。
3. Table 单独处理表格布局规则，不直接把普通块元素的绝对定位方案套到行和表体上。
4. 将内容互斥切换与列表增删分开：前者保持同一内容坐标，后者同时协调退场、存活项移动和容器高度。
5. 处理字段消息、骨架屏、行内编辑，再处理任务/标签/文件列表和页码窗口。
6. 后续验收必须保留前态、中间帧、终态和中断帧；退出节点脱离排版前须保留位置、宽高和盒模型，不能只增加淡出动画。

## 复现入口和产物

- 审查脚本：[audit-motion-layout.mjs](../scripts/audit-motion-layout.mjs:1)。
- 先启动本地开发服务器，再运行脚本；可传开发站地址及场景名称正则，只重查部分案例。
- 默认输出：[几何记录](../shots/motion-layout-audit/report.json)，以及每个场景的切换前、0%、50%、95%、清理后截图。
- 定向输出：[定向记录](../shots/motion-layout-audit/report-targeted.json)。
- 截图及测量数据在忽略目录中，不随仓库发布；脚本和本审查记录保留供后续修复复现。
- 本轮不扩充日常冒烟测试、不改动生产代码，也不把审查完成写成问题已经解决。
