# Grok 官方组件样式参考（KIMA 复刻圣经）

> 来源：grok.com 生产环境编译产物逐规则提取。
> - CSS：`cdn.grok.com/_next/static/chunks/*.css`（5 个 chunk，1MB）——Turbopack CSS Modules（`.grok-*` 混淆类），**规则体是明文**，token 引用完整
> - JS：`cdn.grok.com/_next/static/chunks/*.js`（160 个，经 web.archive.org 镜像下载）——组件库为 Base UI（React）+ Tailwind v4 runtime JIT；Tailwind 类字符串是明文
> - token 总表：`grok-tokens.txt`（499 个官方 token）
>
> **提取方法**：CSS 侧按 `var(--grok-*)` 消费者聚类（1292 条含 token 的规则全量索引）；JS 侧按邻近 role/aria 语义抽取类汤字符串。类名混淆（`grok-3v7k71`），但**选择器结构、状态限定、声明体全部可读**。
>
> 本文是后续所有复刻轮次的唯一官方事实来源。标 ⚠️ 的是官方与 KIMA 现值的冲突点。

## 一、官方状态体系（全库通用，最高优先级）

所有可点元素的状态色全部走 token，无一处手写：

| 状态 | 官方 token | 值（深/浅） | KIMA token | 状态 |
|---|---|---|---|---|
| 悬停 | `--grok-bg-hover` | 白5% / 白6% | `--kima-color-wash-hover` | ✅ 已对齐 |
| 次级填充 | `--grok-bg-secondary` | 白8% | `--kima-color-wash-secondary` | ✅ 已对齐 |
| 按下(active) | `--grok-bg-active` | 白10% / 白7% | `--kima-color-wash-active` | ✅ 已对齐 |
| 选中(强) | `--grok-bg-secondary-active` | 白16% | `--kima-color-wash-selected` | ✅ 已对齐 |
| 主按钮 hover | `--grok-bg-primary-hover` | #F8F8F7 / #40403E | `--kima-color-primary-hover` | ✅ 已对齐 |
| 主按钮 active | `--grok-bg-primary-active` | #D4D3CF / #1B1B1B | `--kima-color-primary-active` | ✅ 已对齐 |
| 菜单高亮 | `--grok-bg-hover`（data-highlighted 同 hover） | 同上 | 菜单项 `wash-hover` | ✅ 已对齐 |
| accent 选中底 | `--grok-bg-accent-secondary` | accent 14% | `--kima-color-accent-secondary` | ✅ 已对齐 |
| accent hover/active | `--grok-bg-accent-secondary-hover/active` | 18% / 24% | `--kima-color-accent-secondary-hover/active` | ✅ 已对齐 |
| danger/warn/success 同构 | `--grok-bg-danger-secondary` 等 | danger mix 14/18/24% | `--kima-color-error-secondary` 等 | ✅ 已对齐 |
| focus 环 | `--grok-border-focus-primary` | accent 80%(浅)/90%(深) | `--kima-color-focus-ring` | ✅ 已对齐 |

**按压形变（官方 active scale 档）**：官方 CSS 实测 `active:scale-95`、`active:scale-[0.92]`、`active:scale-[0.98]`、`active:scale-[0.99]` 四档。主按钮 `:active` 走 `--grok-bg-primary-active`（背景变档，不缩放）；小控件走 scale。KIMA `kima-press` 分档（0.96/0.97/0.98）在官方区间内。

**焦点环几何**：`--grok-focus-ring-width: 2px`（另有 1px 变体上下文）、`--grok-focus-ring-offset: 2px`。输入类 focus 用 `box-shadow: inset 0 0 0 var(--grok-focus-ring-width) var(--grok-border-focus-primary)`（内描边不占位）。

## 二、官方几何体系

### 控件高度六档（官方触摸优先的实现方式）
`xs 20 / sm 24 / md 28 / lg 32 / xl 36 / 2xl 44`（`--grok-control-height-*`）。

**官方触摸模式（关键发现）**：官方不把行高抬到 44，而是 **`data-touch-target` 属性 + 伪元素外扩命中区**：
```css
.grok-y20jty { --grok-touch-target-outset-inline-start: min(0px, (100% - 40px) / 2) }
/* before 伪元素按 outset 变量外扩，视觉 40 行获得 ±2px 命中扩展 */
```
即：**视觉行 40（row-height）或更小，命中区用伪元素补到 ≥44**。这是"官方触摸优先但视觉紧凑"的机制。

### 行几何公式（官方的行内垂直居中法）
```css
padding-block: calc((var(--grok-row-height) - var(--grok-line-height-compact)) / 2)
/* 例：菜单/列表行 = (40 - 20) / 2 = 10px 上下 */
padding-block: calc((var(--grok-control-height-lg) - var(--grok-line-height-compact)) / 2)  /* 控件行 */
```
官方不用固定 padding，全部「高度 token − 行高 token」对半分。⚠️ KIMA 组件普遍写死 padding，复刻时逐个换公式。

### 图标六档
`--grok-icon-size-xs 14 / sm 16 / md 16 / lg 18 / xl 20 / 2xl 24`；icon-button 尺寸 `--grok-icon-button-xs 14 / sm 16 / md 20 / lg 20 / xl 22`（按钮内图标比独立图标大一档）。

### 圆角消费实况（哪些组件用哪档）
| 档 | 消费者（实测规则） |
|---|---|
| control 10 | 菜单面板内项 `[data-menu-panel] *`、按钮、输入框、行内控件 |
| md 8 / lg 12 | 弹层内小块、次级面板（大量 `calc(±space)` 微调变体） |
| panel 16 | 设置行、侧栏分组卡（`calc(panel - 1px)` 用于 focus 内描边） |
| card 18 / alert 14 / island 22 / overlay 20 / composer 28 | 同规格表 |
| full | 药丸（触发器等） |
| highlight 2 | 微型高亮标记 |

## 三、Switch（官方 web 版）

### 证据
1. **组件层**：Base UI Switch（JS chunk `304v8ig9c0k8p.js`：`useRenderElement` + `SwitchRootContext` + `role="switch"` + `aria-checked`），与 KIMA 的 Reka Switch 同为无头库
2. **Token（设置页）**：`--toggle-border: hsl(white/9%)` 深 / `hsl(black/10%)` 浅；`--toggle-selected: hsl(white/24%)` 深 / `hsl(black/8%)` 浅
3. **同站 web 实测 switch（cookie-consent，`1eqhhq8j5i595.js` 明文类）**：
   ```
   轨道: peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors
          focus-visible:ring-2 ring-offset-2 ring-primary/30；disabled:opacity-50
   选中: bg-primary hover:opacity-90（cookie 版是实色；设置页用 token——见下）
   拇指: pointer-events-none block size-5 rounded-full shadow-lg ring-0 transition-transform duration-150 ease-out
   位移: translate-x-5（=20px）/ translate-x-0
   ```
   → **web 官方几何：44×24 胶囊、2px 边框位、拇指 20、行程 20、150ms ease-out**
4. **iOS 版**：UISwitch 64×28（第三方提取，弱于 web 实测）
5. **设置页 switch 具体类**：在未下载到的设置页 chunk；其 token（toggle-border/selected）与 cookie 几何合成

### 官方 web 版结论（证据强度标注）
- 几何 **44×24 胶囊**（web 实测类，强证据）；thumb **20px**（size-5）；行程 **20px**（translate-x-5）
- 过渡 **150ms ease-out**（thumb 的 transition-transform duration-150 ease-out，强证据）
- 轨道色：cookie 版 bg-primary 实色，设置页 toggle token border+wash（token 强证据）→ 复刻取 **toggle-border 1px + 选中 toggle-selected wash**（设置页模式，用户指认的 Grok 视觉）
- focus：ring-2 ring-offset-2 ring-primary/30（web 实测）→ KIMA 用 focus-ring token 同义

### KIMA 复刻（本轮执行，取 web 实测几何 + 设置页 token）
| 维度 | 官方 | KIMA 复刻值 |
|---|---|---|
| 轨道尺寸 | 44×24（w-11/h-6） | `--kima-switch-width: 44px / height: 24px` |
| 轨道边框 | border-2（占位透明）；设置页 toggle-border | 1px `--kima-color-toggle-border` |
| 选中底 | 设置页 toggle-selected wash | `--kima-color-toggle-selected` |
| 拇指 | 20px（size-5） | 20px |
| 行程 | 20px（translate-x-5） | 20px |
| 过渡 | duration-150 ease-out | 150ms ease-out |
| focus | ring-2 offset-2 | focus-ring 2px + offset |

## 四、Menu / MenuItem（官方 web 版，实锤）

### 证据（全部来自编译 CSS 明文规则）
```
菜单面板：--grok-menu-min-width: 240px；min-width:var(--grok-menu-min-width)
面板圆角：data-menu-panel 场景 —— 项 radius-control(10)，面板 radius-lg(12)
带描述行：.grok-cgyb79:has([data-menu-item-description]) { grid-template-rows: minmax(control-height-lg,auto) auto }
项行高：min-height: var(--grok-control-height-lg) = 32px（含描述时主行 32）
列表行：.grok-6gajdt { min-height: var(--grok-row-height) } = 40px
行 padding 公式：padding-block: calc((row-height − line-height-compact)/2) = 10px
高亮：data-highlighted → --grok-bg-hover（wash 5-6%）
focus：grok-1ltdkro[data-highlighted] { box-shadow: var(--grok-elevation-menu) }
触摸：data-touch-target 伪元素外扩（见几何体系）
```

### KIMA 复刻（本轮执行）
| 维度 | 官方 | KIMA 现值 | 复刻值 |
|---|---|---|---|
| 项高 | 32（带描述 minmax 32+auto） | 44 | `--kima-control-height-lg` 32 |
| 项圆角 | radius-control 10 | radius-s 6 | radius-control |
| 行内边距 | 公式 (40−20)/2=10 / 控件公式 | space-2 8px | 官方公式 |
| 高亮 | wash-hover | wash-hover ✅ | 保持 |
| 触摸 | 伪元素外扩 | 行本体 44 | 视觉 32 + `::before` 外扩至 44 |

## 五、其余组件官方证据索引（下轮队列）

| 组件 | 官方证据位置 | 状态 |
|---|---|---|
| Button | `1f9fkh09ggx10.js` CVA 全量定义（下方专节） | **本轮复刻** |
| IconButton | 同 Button primitive（shape:square/circle 档） | **本轮复刻** |
| Modal/Dialog | `--grok-elevation-modal` + `radius-overlay` 20 + scrim #050505 50%/20% | token 齐（KIMA 已对齐，核对即可） |
| Popover | `--grok-elevation-menu`、radius-lg、`grok-1ltdkro[data-highlighted] box-shadow:elevation-menu` | token 齐 |
| Tooltip | 未挖到专属规则（推断用 radius-md 8 + popup 底 + elevation-raised） | 下轮 |
| Input | `--input/--input-border/--input-border-focus` token 组 + `.grok-15kpf4v:focus-visible { box-shadow: inset .5px border-secondary-translucent + 0 0 0 2px focus }`（双层：发丝内描+焦点外环） | 本轮对齐 |
| Checkbox | `.grok-3v7k71[data-checked] { border-color: bg-primary }` + `.grok-81daob [data-checked] { background: bg-primary }`——**实色 base 填充** | 本轮核对 |
| Radio | 官方 radio：`.grok-1mbvzu3[data-checked] { color: text-inverted }` 等 | 下轮 |
| Sidebar 行 | `grok-1bqitbp:hover` → bg-hover；40 行 + 公式 padding | 下轮 |
| Composer | `--grok-radius-composer: 28px`、`--grok-composer-max-input-height: 176px`、glass 三件套 | 下轮 |
| Chat 气泡 | `--grok-conversation-gutter/-inset`、message-actions-opacity 行 | 下轮 |
| Avatar | `.grok-*` rounded-full + `--grok-icon-size-2xl * 2` 容器 | 下轮 |
| Badge/Chip | JS 类汤：`shrink-0 gap-1.5 px-2 py-0.5 text-xs font-medium leading-4`（badge）；`gap-1 px-2.5 py-1 text-sm font-medium leading-5`（chip 行）；chip token `--chip: hsl(neutral-200/5-20%)` | 类汤已挖到 |
| Progress | `--grok-elevation-raised` 轨道 + bg-primary 填充 | 下轮 |
| Spinner | 未挖到专属 | 下轮 |
| CodeBlock | `--grok-terminal-bg` 深 #111、radius-lg、IBM Plex Mono 0.9em | 已对齐 |
| Toast | `data-sonner-toast`（官方用 sonner）`grok-x4j1wy:has([data-close-button]) padding-inline-end: calc(control-xs + space-2)`；radius-alert | 下轮 |
| Pagination | 未挖到专属 | 下轮 |
| Tabs | `--active-tab-*` clip-path inset 变量组（官方 tab 指示器用 clip-path 动画） | 下轮 |

### 已挖到的 JS 类汤（Button/Badge 族，待逐档映射）
```
badge:    shrink-0 gap-1.5 px-2 py-0.5 text-xs font-medium leading-4
chip 行:  gap-1 px-2.5 py-1 text-sm font-medium leading-5
avatar 行: h-5 shrink-0 gap-0.5 px-1 align-top text-sm leading-5
卡片内联按钮: bg-button-secondary-fill font-normal text-fg-secondary
描边输入:  border border-border-l3 bg-transparent text-fg-primary
侧栏行:   relative flex w-full min-w-0 flex-col cursor-default + before 外扩
文件输入:  file:border-0 file:bg-transparent file:text-sm file:font-medium
链接:    whitespace-nowrap align-baseline text-fg-accent transition-colors duration-150
```

## 七、Button / IconButton（官方 CVA 全量，实锤）

来源：`1f9fkh09ggx10.js`（class-variance-authority 明文）。

### 基础类（所有变体共享）
```
leading-[1.4] tracking-[-0.2px] cursor-pointer
outline-hidden focus:outline-hidden focus-visible:ring-1
disabled:opacity-50 disabled:pointer-events-none
transition-colors duration-100        ← 官方按钮过渡 100ms（颜色）
[&_svg]:shrink-0  select-none
```

### 变体
```
primary:           bg-button-filled text-fg-invert border border-border-invert-l1
                   hover:bg-button-filled-hover active:bg-button-filled-active
muted:             bg-button-secondary-fill text-fg-primary hover:bg-…-hover active:bg-…-active
brand-muted:       bg-fg-accent/10 text-fg-accent hover:bg-fg-accent/15 active:bg-fg-accent/20
ghost:             text-fg-secondary hover:bg-button-secondary-fill-hover active:bg-…-active
                   hover:text-fg-primary border border-transparent
outline:           border border-border-l2 text-fg-primary hover:bg-button-secondary-fill-hover active:…
destructive:       bg-button-danger-fill text-fg-danger hover/active 档
destructive-fill:  bg-fg-danger text-fg-invert border border-border-invert-l1 hover:bg-fg-danger/90 active:bg-fg-danger/80
```

### 尺寸档（height + radius + padding + 字号）
```
xs:  h-5  (20) rounded-md(6)  gap-1 px-1.5 text-xs(12)
sm:  h-6  (24) rounded-lg(8)  px-2.5       text-xs
md:  h-7  (28) rounded-lg(8)  gap-1 px-2.5 text-xs
lg:  h-8  (32) rounded-xl(12) gap-1 px-2.5
xl:  h-10 (40) rounded-xl(12) px-4 py-2
2xl: h-11 (44) rounded-xl(12) px-5
```

### 形状复合（icon button = square/circle）
```
square/circle + xs:  w-5 p-0.5     (20px 方/圆)
square/circle + sm:  w-6 p-1       (24)
square/circle + md:  w-7 p-1.5     (28)
square/circle + lg:  w-8 px-1.5 py-1.5 (32)
square/circle + xl:  h-10 w-10 p-2     (40)
square/circle + 2xl: h-11 w-11 p-2.5   (44)
pill: rounded-full（药丸）
```

### KIMA 映射
- 官方 `--grok-control-height-*` = KIMA 同名 token（已对齐）
- 官方 h-10(40)/h-11(44) 是按钮主力档——**KIMA 按钮 s 档 48 高于官方 2xl(44)**：按钮默认档取官方 xl-2xl（40/44）
- rounded-lg(8)=radius-md、rounded-xl(12)=radius-lg、rounded-md(6)=radius-sm——按钮圆角是 **md/lg 档**，不是 radius-control(10)！⚠️ 前两轮把按钮改到 radius-control 是**误对齐**（10px 是菜单项/输入框档），官方按钮 rounded-lg/xl = 8/12
- transition-colors duration-100——KIMA 按钮 hover 过渡对齐 100ms
- ghost hover = wash-secondary 档（官方 button-secondary-fill-hover）、文字 fg-secondary→fg-primary

## 八、官方挖不到、需要推导的组件

| 组件 | 推导依据 |
|---|---|
| Table/Tree/Cascader 等数据件 | 官方行高 40 + wash 悬停 + accent 选中（token 全量已对齐，逐组件核对即可） |
| Tooltip | 规格 12px 字；弹层底/阴影用 popup+raised 档（token 推导） |
| Spinner | 官方 loading 用 accent 点动画（chat 场景旁证） |

## 九、官方「伪元素外扩命中区」模式（KIMA 落地）

官方：`[data-touch-target]` 标记 + `--grok-touch-target-outset-*` + `::before` 扩展。
KIMA 落地：菜单项视觉 32px，`::before { inset: -6px }`（补到 44）——与 kima-state-layer 的 ::after 结构同栖（一个管命中一个管高亮）。
