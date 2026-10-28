# KIMA 统一视觉规范

> 来源：以 ObsidianArc（`github.com/OnyxAxisOwO/ObsidianArc`）前端风格为参照，
> 与 KIMA 现有 Material 3 体系逐项对比后取长补短，落成 KIMA 自己的 token。
> 本文档说明**每一条规范从哪来、为什么这么定**；token 的值在
> [`src/styles/_tokens.scss`](../src/styles/_tokens.scss:1)，组件只引用 token，不写死值。

## 一、对比结论总表

| 维度 | ObsidianArc 的做法 | KIMA 原做法 | 结论 | 落地 |
|---|---|---|---|---|
| 配色生成 | 单色相 HSL ramp，饱和度随种子缩放 | material-color-utilities 生成 M3 色板 | **KIMA 更好，保留** | 不改 |
| 语义色 | 警告橙硬编码 rgba | 语义色独立 token，不随种子变 | **KIMA 更好，保留** | 不改 |
| 毛玻璃 | `blur(20px) saturate(1.6)`，饱和度补偿 | 只有 `blur(8px)` | **ObsidianArc 更好，采纳** | `--kima-backdrop-filter` |
| 主题切换过渡 | 根元素挂类 240ms 全局接管颜色过渡 | 无（一半界面先到） | **ObsidianArc 更好，采纳** | `.kima-theme-switching` + `markThemeSwitching()` |
| 表格行造型 | 行独立圆角带（行间留缝、首尾收角） | 通到边的色带 | **ObsidianArc 更好，采纳** | `border-spacing` + 首尾单元格圆角 |
| 控件尺寸 | 34px 按钮、36px 输入框（紧凑） | 48–64px（放大一号） | **KIMA 更好，拒绝紧凑** | 不改 |
| 圆角刻度 | 7/9/11/14/18px 一堆非刻度值 | M3 刻度 4/8/12/16/28 | **KIMA 更好，拒绝散值** | 不改 |
| 菜单开启动画 | `scale(0.12)` 从一角炸开 | `scale(0.96)` 安静淡入 | **KIMA 更好，拒绝夸张** | 不改 |
| 字体 | 系统无衬线 14px | Maple Mono NF CN 等宽 | **KIMA 更好，保留** | 不改 |
| 滚动条 | 悬停滚动区域才显形 | 常驻细圆棒 | **KIMA 更好，保留** | 不改 |

## 二、采纳的三条（ObsidianArc 的精华）

### 1. 毛玻璃饱和度补偿

模糊会把背后的颜色洗成灰——一层 `blur` 过后，玻璃透出的是"灰塑料"而不是
"后面的颜色"。ObsidianArc 在 filter 里加 `saturate(1.6)` 把饱和度补回来，
玻璃才透得出色彩。

KIMA 落地为 [`--kima-backdrop-filter`](../src/styles/_tokens.scss:135)：

```scss
--kima-backdrop-filter: blur(8px) saturate(1.6);
```

写成**完整的一层 filter** 而不只是一个长度，还有第二个原因：`blur(0px)`
仍会把元素提升成独立合成层，白白多一层；`none` 才是真正的"不开"。
所有弹层遮罩（[`dialog.ce.vue`](../src/components/core/dialog.ce.vue:170)、
[`drawer.ce.vue`](../src/components/core/drawer.ce.vue:537)、
[`command.ce.vue`](../src/components/interaction/command.ce.vue:69)、
[`loading-overlay.ce.vue`](../src/components/interaction/loading-overlay.ce.vue:45)）
统一引用这个 token，以后调模糊只改一处。

### 2. 主题切换的统一颜色过渡

换主题时，有的组件自己声明了颜色过渡、有的没有，直接换色会变成
"一半界面先到、一半后到"。ObsidianArc 的做法：换色前给根元素挂一个类，
让一条全局规则在 240ms 内接管**所有元素**的颜色过渡，然后摘掉。

KIMA 落地：

- 规则在 [`_tokens.scss`](../src/styles/_tokens.scss:378)：
  `.kima-theme-switching` 及其后代的所有 `background-color / border-color /
  color / fill / stroke` 过渡被统一接管，`!important` 是刻意的——它就是要
  压过每个元素自己的过渡，只活一瞬间。
- 触发在 [`theme.js`](../src/utils/theme.js:128)：`markThemeSwitching()`
  挂类 + 240ms 后摘类，清掉再重设（快速连点主题不会叠计时器）。
- [`applyPalette()`](../src/utils/theme.js:101) 运行时换色自动触发；
  构建期生成 `_palette.scss` 不走这里，首屏不该有过渡。
- `prefers-reduced-motion` 下整条规则退化为 `transition: none`。

### 3. 表格行的独立圆角带

ObsidianArc 的表格行是一块自己的造型：行与行之间留一道缝
（`border-spacing: 0 2px`），每行首尾的单元格把角收圆，斑马纹和悬停的
底色跟着行的形状走，而不是一条通到边的色带。行读起来是"一排卡片"，
不是"一整块颜色每两行换一次"。

KIMA 落地在 [`table.ce.vue`](../src/components/data/table.ce.vue:408)：

```scss
table {
  border-collapse: separate;
  border-spacing: 0 var(--kima-space-1); /* 行间缝 4px */
}
tbody td:first-child, tbody th:first-child {
  border-radius: var(--kima-radius-s) 0 0 var(--kima-radius-s);
}
tbody td:last-child, tbody th:last-child {
  border-radius: 0 var(--kima-radius-s) var(--kima-radius-s) 0;
}
```

`collapsed` 会忽略单元格圆角，行带画不出来，所以必须 `separate`。
圆角用 KIMA 自己的刻度（radius-s 8px），不抄 ObsidianArc 的 9px 散值。

## 三、拒绝的四条（ObsidianArc 的糟粕，KIMA 保留自己的）

### 1. 紧凑控件尺寸

ObsidianArc 按钮 34px、输入框 36px、图标按钮 34px——这是聊天工具栏的密度，
不是组件库的密度。KIMA 锁定"比 M3 官方再放大一号"：按钮 48–64px、
输入框 64px、列表行 64px。触摸和鼠标都好点，这是 KIMA 的立身之本，不让。

### 2. 非刻度圆角散值

ObsidianArc 的圆角是 7/9/11/14/16/18px 一堆散值，每个控件各定各的，
改一次风格要全局搜。KIMA 用 M3 刻度（XS 4 / S 8 / M 12 / L 16 / XL 28 +
full），组件只引用刻度，换风格改 token 一处生效。

### 3. 夸张的弹层开启动画

ObsidianArc 菜单从 `scale(0.12)` 一角炸开，视觉冲击强但晃眼，且
`will-change` 常驻。KIMA 弹层统一 `scale(0.96)` 安静淡入——动效的职责是
引导注意力，不是抢注意力。

### 4. 硬编码语义色

ObsidianArc 的警告橙是 `rgba(217, 119, 6, 0.15)` 写死在样式里，深浅主题
各写一份。KIMA 的语义色（成功/警告/危险）是独立 token，含义固定不随种子变，
深浅两套在 [`_tokens.scss`](../src/styles/_tokens.scss:196) 各有一档。

## 四、KIMA 视觉规范速查（组件作者照这个写）

### 配色

- 只引用 `--kima-color-*` token，**禁止硬编码颜色**（hex、rgb、rgba）。
- 页面内组件（卡片、输入框、表格）用 [`kima-layer()`](../src/styles/_mixins.scss:147)
  叠半透明层，不上实色底。
- 弹层（菜单、下拉、对话框、抽屉）用 [`kima-popup()`](../src/styles/_mixins.scss:155)
  实色底 + 阴影，必须挡住背后。
- 选中态：容器色底必须配 `on-*-container` 文字，悬停用
  `--kima-color-primary-container-hover`，不能落回通用 layer 色。
- 语义色（成功/警告/危险）不随种子变，品牌色跟着种子走。

### 形状

- 圆角只用刻度：`--kima-radius-xs/s/m/l/xl/full`。
- 按钮、芯片满圆（full）；卡片 M（12）；抽屉 XL（28）；表格行带 S（8）。
- 只有「明确提示下一步交互」的元素才用满圆胶囊。

### 间距与尺寸

- 间距用 `--kima-space-*`（4 的倍数），密度松，优先取 3 以上的档。
- 控件尺寸用 `--kima-button-height-*` / `--kima-field-height` /
  `--kima-list-item-height` 等 token，比 M3 官方大一号。
- 块级场地（列表、手风琴、表格、标签页）一律占满可用宽度
  （[`kima-block-host`](../src/styles/_mixins.scss:138)），不按内容收缩。

### 交互反馈

- 可点击控件三件套：状态层（[`kima-state-layer`](../src/styles/_mixins.scss:25)）
  + 焦点环（[`kima-focus-ring`](../src/styles/_mixins.scss:59)）+ 涟漪
  （[`kima-ripple-host`](../src/styles/_mixins.scss:75)）。
- 按钮类再加按下回弹（[`kima-press`](../src/styles/_mixins.scss:116)）；
  字段类不接回弹（点它是"展开面板"，弹回跟展开方向拧着）。
- 选项行悬停只变底色 + 文字色，走 `--kima-duration-effects`，不瞬切、不缩放。

### 弹层与遮罩

- 模板套 `<Transition name="kima-popup">`，进出场动画全库共用一套，
  加新弹层不用写动画。
- 遮罩模糊统一引用 `--kima-backdrop-filter`（含饱和度补偿），
  不要自己写 `blur(...)`。

### 动效

- 时长三档：`--kima-duration-fast/medium/slow`（100/200/300ms），
  曲线用 `--kima-curve-standard/emphasized`，弹簧用
  `--kima-spring-snappy/gentle`。
- 内容在原位增减必须有高度过渡，不能一帧跳到位。
- `prefers-reduced-motion` 下所有过渡退化为瞬时。

### 主题切换

- 运行时换色一律走 [`applyPalette()`](../src/utils/theme.js:101)，
  它会自动触发全库统一的颜色过渡；不要自己 `style.setProperty` 改
  `--kima-color-*`。
- 深浅切换写 `document.documentElement.dataset.kimaTheme` +
  `applyPalette(seed, { isDark })`，参考 [`App.vue`](../src/App.vue:37)。

## 五、验证

- `pnpm build` / `pnpm build:lib` / `pnpm verify:lib` 全部通过
  （136 组件、17 项检查）。
- 看效果：`pnpm dev` 打开预览页，重点看
  [表格](../src/components/data/table.ce.vue:1)（行带造型）、
  [对话框](../src/components/core/dialog.ce.vue:1)（毛玻璃）、
  换主题（整界面一起过渡）。
