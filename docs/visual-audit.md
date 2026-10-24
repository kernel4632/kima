# 文档站视觉审查

测试证明交互契约成立，不证明"看起来是对的"。这一层专门看真实渲染：演示区有没有被压扁、
控件有没有底色、字段有没有被固有宽度撑出屏幕、弹层打开后有没有跑出可视区。
审查只读运行中的文档站，不改组件。

## 命令

```powershell
# 先启动文档站（默认 5188）
pnpm dev --host 127.0.0.1 --port 5188 --strictPort

# 桌面：逐页截图 + 几何量测，输出 shots/audit
node scripts/audit-visual.mjs http://127.0.0.1:5188

# 手机：390×844，输出 shots/audit-mobile
$env:KIMA_AUDIT_WIDTH = '390'
$env:KIMA_AUDIT_HEIGHT = '844'
node scripts/audit-visual.mjs http://127.0.0.1:5188
Remove-Item Env:KIMA_AUDIT_WIDTH, Env:KIMA_AUDIT_HEIGHT

# 把逐页截图拼成 8 张审阅图集
node scripts/audit-montage.mjs
# 手机图集：$env:KIMA_AUDIT_DIR = 'shots/audit-mobile'

# 宽度审查：每页组件根宽度 vs 舞台宽度，`*` 表示按内容收缩
node scripts/audit-width.mjs http://127.0.0.1:5188

# 原生控件审查：列出演示区里仍是浏览器默认外观的 checkbox / select / 日期时间输入
node scripts/audit-native.mjs http://127.0.0.1:5188

# 只审 core 档（数量取分档表）；不设变量就跑当前全部页面
$env:KIMA_AUDIT_TIER = 'core'
node scripts/audit-visual.mjs http://127.0.0.1:5188
node scripts/audit-native.mjs http://127.0.0.1:5188
Remove-Item Env:KIMA_AUDIT_TIER
```

`KIMA_AUDIT_TIER` 直接读 [`src/component-tiers.js`](../src/component-tiers.js:1)，和构建用的是同一份分档。删减前审查数字是历史证据；当前分档见分档表，原生外观边界需按现有入口重查。

原生控件审查只看“外观是不是浏览器默认”：字段内部的 `input[type=text]` 由 KIMA 画表面，不算；
`appearance` 不是 `none` 又没有遮住的 `checkbox` / `radio` / `select` 才算。
`native-select` 薄包装已移除，宿主确需系统菜单时直接使用原生控件。**已知边界**：穿梭框的两个多选列表仍是原生
`select[multiple]`，`date-range-picker` / `period-picker` / `time-range-picker`
的输入仍是原生日期时间控件（表面是 KIMA 的，弹出的还是系统面板），这几处还没换。

`shots/` 已忽略，截图与报告不入库。每页报告在 `report.json`，包含演示区尺寸、横向滚动、
越界元素、零尺寸自定义元素和页面错误。脚本会临时隐藏文档站顶栏，避免粘性定位盖住截图。

## 语法着色

- **分词**用 `highlight.js`（MIT），**颜色**是我们的：hljs 只输出语义类（`hljs-keyword`…），
  映射写在 [`code-block.ce.vue`](src/components/core/code-block.ce.vue:160)，颜色全部走 `--kima-color-code-*`
  token，深色/浅色各一套。
- **语言**内置 highlight.js 的 common 集（35 种 + dockerfile，别名见
  [`utils/code-highlight.js`](../src/utils/code-highlight.js:1)）。其余语言由宿主
  `registerCodeLanguage(name, grammar)` 补登记，避免把 190 多种语法全量打进包里。
  没登记的语言按纯文本展示，不猜。
- **覆盖检查**：`node scripts/audit-hljs-theme.mjs` 拿官方主题的类名清单对比映射，
  缺一个类就报错（`params` / `subst` 等标识符类故意保持正文色，列在脚本的 intentional 里）。

## 弹层表面

- 弹层是浮在内容之上的独立平面，**必须实色**（`kima-popup` / `interaction-popup`），
  不能只靠 `kima-layer` 半透明叠层，否则背后的文字会透上来。
- 内容由 Reka 渲染并**传送到 body** 的弹层（菜单、子菜单、上下文菜单、悬浮卡、多选/树选择面板），
  元素上没有本组件的 `data-v` 标记，普通 scoped 规则匹配不到 → 表面写成
  `:global(.kima-x__popup)`。菜单和子菜单就是因为这条丢了整块底色。
- 检查命令（打开每个弹层后量实际背景）：

```powershell
node shots/audit/states.mjs                       # 逐个弹层截图（桌面）
$env:THEME='light'; node shots/audit/states.mjs   # 浅色主题
node shots/audit/popup-bg-probe.mjs               # 打印悬浮节点的标签/背景/阴影
```

## 不同宽度的检查

```powershell
# 四档宽度截同一页（1440 / 1024 / 768 / 390），看顶栏、侧栏、演示区怎么换行
node shots/audit/responsive.mjs overview
node shots/audit/responsive.mjs virtual-table
```

- 断点只有三档：**1200**（收掉右侧目录）、**900**（换单列、侧栏进抽屉、顶栏分两行）、
  **480**（窄手机：藏版本号、收窄主题选择）。
- 顶栏是弹性排布，不是定宽栅格：栅格列数固定，多一个控件就掉到第二行，第二行只剩品牌那一列宽。
- 900 以下不显示头部搜索框：它过滤的是被收进抽屉的目录，输入了也看不到结果，改用全文搜索面板。
- 横向分栏在窄屏改竖向（splitter 示例按 `matchMedia` 切换 `orientation`），否则一侧只剩一百来像素。

## 演示区契约（唯一来源）

布局只写在 [`src/site/gallery.scss`](../src/site/gallery.scss:1)：

- `.kima-gallery__demo` 是列向 flex 舞台，短组件居中，宽组件自己声明 `width: 100%`。
- 演示不再重复页面标题和说明：`header` 由页面标题承担。
- 表单限宽 520，控件跟着表单走；直接放在舞台里的控件限宽 520 并居中。
- 输入类控件需要 `min-width: 0`，否则 `input` 的固有宽度（默认 `size`）会把手机页面撑出横向滚动。
- 分组的示例文件只写“组件怎么用”，不再各自定义 padding、背景、标题和 gap。

## 尺寸与动效契约

- **块级场地占满宽度**：手风琴、折叠、列表、时间线、步骤、面板类展示、布局组件都用
  `kima-block-host`（`display: block; width: 100%; min-width: 0`）。
  宽度跟着内容走的组件，内容一收起来整块就会瞬间变窄——看起来像没有过渡，其实是布局重排。
- **自定义元素宿主同样占满宽度**：`_tokens.scss` 里按标签列出块级组件的宿主默认值。
  自定义元素默认是 `inline`，不加这条，`<kima-accordion>` 在任何普通页面里都会随内容伸缩。
- **内容原位变化走高度过渡**：`useContentMotion`（展开全文、JSON 校验提示、标签面板、轮播）
  先在 pre 阶段记旧高度，更新后再量新高度，从旧到新补一段高度动画；文字本身不等动画。
- **收起时内容会一起消失的**（字段组提示这类）：更新前调用 `rememberCollapseHeight(元素)`，
  否则收起那一刻量到的自然高度已经是 0，动画就成了 0→0。
- **交叉淡入淡出的两个面板不能同时占高度**：退场面板加 `position: absolute`（标签页、轮播），
  否则容器高度先按两块里高的那块算，等淡出结束才塌下去。

## 已修过的真实问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 各分组演示区疏密不一、按钮被拉满整行 | 布局类名只写在 base-examples 的 scoped 样式里，其他分组没有样式 | 抽出全局 gallery 契约，删除各组重复定义 |
| 日期/时间分段输入没有底色，像浮在画布上 | `advanced-field` 同时引 `input-surface` 和 `input-control`，后者把背景重置为透明 | 在 mixin 末尾补回 `layer-2` 和圆角 |
| 日期/时间分段初值不显示 | `watch(modelValue)` 没有 `immediate` | 立即同步初值 |
| 分段占位符被裁成 `YYY` / `MI` | 分段宽度扣掉 20px 内边距后不够 4 个字符 | 分段减小内边距并加宽 |
| 手机表单横向溢出 32px | 输入框固有宽度 + 栅格项 `min-width: auto` | 控件 `min-width: 0`，表单限宽 |
| 渐变文字整块消失 | 全局规则按标签隐藏 `h2`，误伤组件根节点 | 只隐藏演示自己的 `header` |
| 虚拟选择出现两行“请选择” | 占位文案和摘要同时显示 | 摘要只显示已选值，占位用独立提示 |
| 图片预览卸载时报 `reading 'open'` | 原生 `close` 事件晚于 ref 清空 | `handleNativeClose` 增加空值保护 |
| 列表、树、瀑布流、图表缩成一小块 | flex 居中后没有宽度，按内容收缩 | 这些场地型组件补 `width: 100%` |
| 角度滑块只剩一条横杆，表盘和读数错位 | `:style` 里的 CSS 变量写成了 `` `${size}px}` ``，表盘宽高失效 | 修正模板字符串 |
| 代码块的字符串和数字没有颜色 | 高亮引用了未定义的 `--kima-color-secondary/tertiary` | 新增 `--kima-color-code-string/number` 语法 token |
| 颜色编辑器的 HEX 看起来像普通文字 | 同时套了 `input-surface` 和 `input-control`，背景被重置为透明 | 补回 `layer-2` 底色与圆角 |
| 色相/透明度滑块没有手柄 | 嵌套选择器写成了 `&__area &__hue span` | 拆成独立的滑块手柄规则，并给透明度加棋盘底 |
| 上传按钮是浏览器原生英文控件 | 原生 file 控件直接可见 | 整块拖放区作为点击目标，原生输入只保留语义 |
| 输入组的前缀和后缀被甩到屏幕两端 | 舞台把内部文本框限宽到 520 并居中 | 组合容器内控件填满，容器本身收在 520 |
| 日历时跨月日期和本月一样亮 | 只改了颜色，没有降透明度 | 跨月日期 `opacity: .45` |
| 手风琴收起时整体瞬间变窄 | 组件根没有 `width`，在居中舞台里按 `max-content` 收缩 | 抽出 `kima-block-host`，块级组件统一占满宽度；宿主标签同样处理 |
| 标签页换页、轮播换张后高度突然塌下去 | 退场面板淡出的 200ms 里仍占着格子高度 | 退场面板绝对定位，容器高度立刻等于新面板，再由 `useContentMotion` 补过渡 |
| 字段组提示消失时整组瞬间变矮 | 提示文字和 `v-show` 同一次更新，收起时量到的自然高度是 0 | 更新前 `rememberCollapseHeight` 记下旧高度，动画从旧高度收到 0 |
| 展开全文时高度一帧跳到位 | 只做了透明度动画 | `useContentMotion` 同时补高度插值 |
| 桌面顶栏挤成两行、主题选择被压成“青…” | 顶栏是 3 列栅格但放了 4 个控件 | 改 flex 排布 + 900/480 两档断点 |
| 每次换页标题被顶出屏幕 | `pendingSection` 初值是 `preview`，任何路由变化都滚动到预览 | 初值留空，只有搜索结果才跳节 |
| Grid 的区域格子是空的，内容堆在下面 | 示例用 `slot="head"`，Vue 组件只认 `<template #head>` | 改成命名插槽模板 |
| 输入组的前后缀被塞进输入区，字段被挤溢出 2px | 同上，`slot="prefix"` 落进了默认插槽 | 改成 `<template #prefix>` |
| 菜单、子菜单弹层完全没有底色 | 内容被 Reka 传送到 body，没有 `data-v`，scoped 的 `.kima-menu__popup` 规则不命中 | 表面规则改成 `:global(.kima-x__popup)`；同类弹层一并改掉 |
| 代码块顶栏和第一行代码之间空出一条带 | 顶栏下内边距 8 + 正文上内边距 16，行高又是 1.7 | 顶栏压到 4px 并铺一层浅底，正文上内边距 8，代码行高单独用 `--kima-line-height-code`(1.6) |
| 代码几乎只有一种颜色 | hljs 只映射了 keyword/string/number/comment 四类 | 关键字、字符串、数字常量、函数类型、属性变量各一档，注释斜体、标点退次要色（`--kima-color-code-*`） |
| 虚拟表格的复选框是浏览器默认白方块 | 选择列直接用了原生 `input[type=checkbox]` | 换成 `KimaCheckbox`（和表格的 `role="checkbox"` 一致） |
| 复选组里是系统复选框 | 只给了 `accent-color`，画出来还是系统方框 | 方框和勾自己画，原生输入只留语义和点击面 |
| 图表形式、编辑器语言是系统下拉 | 示例用了 `kima-native-select` | 示例换成 `KimaSelect`；`native-select` 只在自己的页面演示 |
| 透明度手柄在 100% 时被裁掉一半 | 手柄中心按比例定位，两端没有留半宽 | `left: clamp(10px, 比例, calc(100% - 10px))` |
| 组件页导语里印着调用示例 HTML | 注释一行里既有描述也有“调用示例：<kima-…>” | 文档元数据只取“调用示例”之前的描述 |
| 提示框圆角 4px、字号偏大 | 硬编码 `border-radius: 4px` 和未定义的 `--kima-font-size-sm` | 回到 `radius-s` 与 `label-medium` |
| 演示读数被画成输入框 | 全局 `output` 样式命中了组件内部读数 | 只作用于演示自己的直接子级 `output` |
| 顶部种子选择显示成“青.” | 选择器宽度不够 | 桌面 150、手机 132 |

## 看效果时的检查顺序

1. **颜色**：深浅两套主题各看一遍；容器色是否配 `on-*-container` 文字；弹层是否实色；禁用态是否只是降透明度。
2. **间距与填充**：同一页里的字段、按钮、卡片是不是同一套节奏；组合控件的前后缀是否贴着输入；卡片/面板内部 padding 是否一致。
3. **排版**：标题、正文、说明、代码的层级是否一眼分得开；长文本是否换行而不是被裁掉。
4. **交互后**：悬停、选中、展开、关闭各截一帧，确认颜色/位移有过渡、内容不是硬切；再试一次快速反向，确认不会卡在半路。
5. **空与错**：空状态、错误状态、加载状态是否是完整的一屏，而不是一个空框。

## 边界

审查在 Chromium 下完成，覆盖桌面 1440×1000 与手机 390×844。不包含 Firefox/WebKit、
人工读屏、真实移动系统日期面板。截图只能证明这些尺寸和平台下的渲染，不能替代其他浏览器验收。
