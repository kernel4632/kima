# KIMA

KIMA 是一个面向高专注、高体验 Web 应用的 UI 设计系统与组件库。
全称：**K**inetic、**I**nteraction、**M**otion、**A**live。

一句话定位：**Grok 官方复刻**（KIMA-Grok）——原语组件 + 官方 token 一比一；
交互体验第一，好看第二。

本文件是本仓库的最高协作约束。任何会话在改代码前先读本文件。

> 仓库已从旧的 FEYO 改名到 KIMA，源码、样式、脚本、测试、文档里的名字都统一成 `kima`。
> 基础层和组件已重做；当前目录有 30 个组件入口（Grok 原语裁员后的最终形态）。能力边界见[逐项矩阵](docs/component-comparison.md)，最终验证状态见[路线图](docs/component-roadmap.md)，不能把文件存在写成全量验收通过。

## 技术栈（固定，不要替换）

- Vue 3（Composition API）
- JavaScript（不是 TypeScript）
- Vite
- SCSS
- pnpm
- Hugeicons 图标：`@hugeicons/vue` + `@hugeicons/core-free-icons`
- **Reka UI**：交互与无障碍行为底座（无样式，`reka-ui`）
- **Motion（motion-v）**：CSS 做不到的动效（FLIP/AnimatePresence）

## 交付目标

最终打包成 **Web Components**，能用在任何 Web 项目里，标签形如：

```html
<kima-button variant="filled">保存</kima-button>
```

组件既要在 Vue 项目里可用，也要能在原生 HTML 里直接使用。

## 命名规则

- npm 包名、源码目录、CSS 变量统一用 `kima`。
- 包名：`@kernel4632/kima`。
- CSS 变量前缀：`--kima-*`。
- 自定义元素标签前缀：`<kima-*>`。
- class 前缀：`kima-`。
- **禁止**把 `DMS`、`Dank`、`MUI`、`Material` 用作项目名、组件名或 class 前缀。
  （Material 3 只是**设计语言参考**，不是我们的品牌名。）

## 设计方向（已锁定，不要自行改回）

- **全局**：Grok 官方复刻（docs/grok-theme-spec.md + docs/grok-component-reference.md）。
  官方视觉行 32-40px、命中靠伪元素外扩到 44px，不抬行高。
- **触摸**：所有可点控件的**命中目标天生按触摸标准设计**——命中区 ≥ 44×44（Apple 触摸下限）；
  视觉件小（如 Switch 拇指、菜单行 32px）时由透明命中区/伪元素外扩/label 补足。
  缝合任何参考实现（shadcn 等）前先查官方证据，官方值优先于触摸放大。
- **密度**：跟随官方（紧凑行 32-40，控件 40-44）。
- **颜色**：Grok 官方 token（`_tokens.scss` 唯一来源）：warm 皮肤两套（深浅），
  `--grok-*` 语义系（bg-*/fg-*/border-*/alpha-*）+ 焦点/选中走 accent 蓝 `#1084FE`。
  深浅切换零 JS（`color-scheme: light dark` + `light-dark()`）。
  - **语义色不跟主题变**：成功（绿）、警告（橙）、危险（红）含义固定，像交通灯。
  - **臆想禁令**：注释里声称"官方 X"必须有证据链（官方 CSS/JS chunk 里该组件真实消费该值），
    体系 2（shadcn 系 token）不得安在体系 1 组件上；找不到证据的标注"推导"。
- **字体**：`"Inter", system-ui, …`（Universal Sans 的免费替代），字重 425/525/650；
  代码 `IBM Plex Mono` 0.9em。中文由系统回退接管。
- **形状**：官方圆角刻度（xs 4 / sm 6 / md 8 / control 10 / lg 12 / panel 16 / card 18 /
  alert 14 / island 22 / overlay 20 / full 999）。
- **弹层**：bottom sheet / 侧抽屉——背景 dim + 模糊 + 抽屉滑入，**只聚焦当前内容**。
  拖拽关闭、吸附点。
- **动效**：官方时长/曲线（120/180/200/260/320/400ms + 四条曲线），承担引导注意力职责。
  **内容在原位增减**（展开全文、提示出现/消失、换面板、换幻灯片）必须有高度过渡，
  不能一帧跳到位；交叉淡入淡出时退场那一块要脱离排版，否则高度会等淡出结束才塌。
- **宽度**：块级场地（列表、手风琴、折叠、标签页、时间线、步骤、面板类展示）一律占满可用宽度
  （`kima-block-host`），不按内容收缩。宽度跟着内容走的话，内容一变整块就瞬间变窄，
  看起来像没有过渡——那是布局重排，动画补不回来。
- **交互**：状态层（轻）+ 焦点环 + 键盘可达 + **涟漪**（`utils/ripple.js` 配
  `kima-ripple-host`）+ **按下回弹**（`kima-press`）。可点击的控件都要有这三样反馈。
- **分层**：**不用边框**分割层次，改用半透明叠加（`--kima-color-layer-1/2/3` 与 `_mixins.scss`
  的 `kima-layer`）。分两种情况：
  - **页面内的组件**（卡片、输入框、表格、标签页）：**不给自己上实色底**，用 `kima-layer`
    叠一层透明度。铺在任何背景（包括后续的模糊背景）上都透得出后面的内容；
    只有需要突出的元素（主操作按钮、选中项、勾选的复选框）才用实色。
  - **弹层**（菜单、下拉、对话框、抽屉、通知、提示）：它是浮在内容之上的独立平面，
    **必须用实色底**（`--kima-color-popup` / `popup-large`，用 `kima-popup` mixin），
    否则背后的文字会透上来，内容叠在一起看不清。
  - **例外：线本身是造型的时候要留**。「不用边框」针对的是**用线切割版面**这种分层次的做法；
    下面这些线是控件造型的一部分，删了就不是那个东西了：
    描边按钮 / 描边卡片的轮廓、复选框的方框、开关的轨道、滑块的轨道、
    spinner 的圆环、分隔线（divider）。
    输入框**也在此列**：Grok 官方输入框是 1px 发丝描边模式（--input-border，
    深色白 4% / 浅色深 38%，聚焦时描边换档）——官方复刻后输入框描边是造型的一部分，
    底色改为透明，与官方一致。
  - **文本框不给标签**：可见标签由使用者用普通排版文字自己组合（原生 label 包住组件即可）。
    组件只留 `label` 属性作可访问名，落到内部输入框的 `aria-label` 上；
    组件画标签就要替使用者决定位置和对齐，还要多维护一套标签样式。
    换一句话说：**这个线没了，控件还能被认出来吗？** 不能，就说明它是造型，留着。
- **优先级**：交互与体验第一，好看第二。
- **官方复刻**：Grok 官方组件效果是全库终极目标（用户明令）。官方实现挖自
  grok.com 生产资产（编译 CSS + JS chunk 的明文类），沉淀在
  [官方组件样式参考](docs/grok-component-reference.md)；任何"触摸修正"不要自作主张——
  官方视觉行 32-40px、命中靠伪元素外扩到 44px（data-touch-target 机制），照抄这套，
  不要抬行高。

## 禁止使用的依赖

不要引入带视觉意见的组件库（Material UI、Material Web、MUI、Ant Design、Vuetify 等）。
**Reka UI 允许**（它无样式）。图标只允许 Hugeicons。

## 主题与颜色

颜色只能由 KIMA 自己的 CSS variables 控制，全部以 `--kima-` 开头，方便整体换主题。
组件里**不允许**硬编码颜色值（hex、rgb 等），只能引用 token。
token 定义在 `src/styles/_tokens.scss`（Grok 官方编译值唯一来源，臆想禁令见"设计方向"）。

## 目录结构（随开发扩展）

```
src/
  styles/
    _tokens.scss    设计 token（官方颜色/字体/间距/形状/层级/动效/控件尺寸）
    _mixins.scss    共用交互 mixin（状态层、焦点环、字段皮肤、表面、禁用）
    index.scss      开发预览页的基础样式
  components/       组件，一个组件一个 xxx.ce.vue 文件，按文档分组放在子目录，放进来就自动登记
    core/           基础控件（按钮、文本框、选择器、弹层等）
    input/          输入控件
    display/        展示与反馈
    navigation/     导航与内容组织
    interaction/    弹层与交互
    advanced-input/ 日历
    data/           数据展示
    foundation/     排版
  site/             文档站（目录、示例、实验台、组合预览）
  utils/            共用工具（动效、输入状态、导航、内容等），按实际复用维护
  component-paths.js 由 scripts/components.js 生成，slug → 分组路径，测试与工具使用
  component-tiers.js 组件分档（core / extras / experimental），新增组件必须在这里选一档
  elements.js       自定义元素全量入口（30 个）
  elements-core.js  由 scripts/components.js 生成，只注册 core 档的自定义元素入口
  App.vue           开发预览页
  main.js           开发入口
```

## 常用命令

```bash
pnpm install     # 安装依赖
pnpm dev         # 本地开发
pnpm build       # 生产构建
pnpm build:lib   # 组件库构建（Vue / elements / theme 三个 JS 入口及 Vue 样式）
pnpm verify:lib  # 校验打包产物
pnpm verify:install # 真实 tarball 的隔离消费者校验
pnpm test        # 浏览器交互测试
pnpm test:ssr    # SSR 测试
```

## 开发约定

- **组件必要性**：不为目录覆盖率增加薄包装；只有排版或现有组件组合的用法优先写示例。删除入口必须同时清理分档、导出、演示、测试与文档，不留同名空壳。
- **组件分档**：新增 `.ce.vue` 必须在 [`src/component-tiers.js`](src/component-tiers.js:1) 里选一档
  （core / extras / experimental），漏了分档或写了不存在的组件，构建会直接失败。
  core 走最高水位（逐页审查、跨浏览器、读屏、中间帧），另两档只保证渲染与交互反馈。
  自定义元素入口：`/elements` 全量，`/elements/core` 只注册 core 档。
- 修改前先看项目现有写法，保持风格一致，优先最小改动。
- 组件用 SCSS，`<style scoped lang="scss">`，颜色一律走 token。
- 官方值证据链：改 token/组件皮肤前先查 `docs/grok-component-reference.md` 与官方原始资产
  （`grok-css/`、`grok-js/`），声称"官方 X"必须给消费证据，拿不准标"推导"。
- 不凭空增加框架或抽象层。
- 完成一个可用改动后运行 `pnpm build`；组件库改动还要跑 `pnpm build:lib` 和 `pnpm verify:lib`。
- 改完一点且处于能用状态（构建和测试通过）就立刻提交并推送，不要攒着。
- 看完效果用 `pnpm shots` 出截图（`shots/` 已在 .gitignore 里，不入库）。
- commit 信息用中文描述，遵循 Conventional Commits 格式：
  `type(scope): 中文描述`，type 用英文（feat/fix/refactor/docs/test/build/chore），
  例如 `feat(按钮): 按 Grok 官方复刻重做按钮`。改动只涉及一个组件时 scope 写组件名。
- 推送目标为 `origin main`。

## 协作方式（重要）

- 用户要**逐个组件地指导**，不要一次把整套写完。
- 流程：一次只做一小步（一个组件或一小块基础）→ 做完停下来给用户看（截图 + 说明）
  → 用户给意见 → 改 → 用户点头 → 提交 → 再下一步。
- 用户较难用文字描述想要的感觉；**多用图/可见效果沟通**，少让用户凭空描述。

## 迁移状态

1. ✅ **改名**：FEYO → KIMA（包名、CSS 变量、标签、class、导出、样式注入 id、脚本、测试、
   README、docs、构建产物名）。
2. ✅ **重做基础层**：Grok 官方 token（色/字/形状/层级/状态层/动效）+ mixins + 字体接入。
   token 唯一来源 `src/styles/_tokens.scss`（官方编译值 + 证据链注释 + 推导标注），
   深浅零 JS（color-scheme + light-dark()）。
   图标统一走 `src/components/icon.ce.vue`（线宽 `iconStrokeWidth` 2.25，配 `absolute-stroke-width`）。
3. ✅ **官方复刻**：30 个原语组件已按官方证据对齐（Button CVA / Switch / Menu / Input 描边 /
   Modal 阴影逐字节；见 docs/grok-component-reference.md）。交互反馈的分配规则：
   - **按钮类**（`button`、`icon-button`）：状态层 + 焦点环 + 涟漪 + 按下回弹（幅度按尺寸分档）。
   - `card`：状态层 + 焦点环 + 涟漪；卡片回弹与按钮同档。
   - **字段类**（`text-field`、`select`、`combobox`）：官方 1px 描边模式（kima-field-skin），
     触发器 / 图标 / 清除按钮是场地的排版项，flex 自动排位置，**不用绝对定位**。
     反馈只有状态层 + 焦点环 + 涟漪；不接按下回弹——点它是"展开面板"，弹回跟展开方向拧着。
   - **选项行**（下拉、菜单、树、表格行）：官方视觉行 32、悬停/高亮 wash-hover 洗色，
     命中靠 `::before` 伪元素外扩到 44（官方 data-touch-target 机制）；不做按下缩放。
   - **选中态配色**：accent-secondary 梯子（14/18/24%），配 on-accent-secondary 文字。
4. ✅ **弹层**：全部弹层（下拉 / 菜单 / 提示 / 对话框 / 抽屉）共用同一套
   进出场过渡 `.kima-popup-enter/leave-*`，定义在 `_tokens.scss`（唯一全库原样输出、
   不被 scoped 加 data-v 的文件）。模板套 `<Transition name="kima-popup">` 即生效；
   原生 dialog 用 `@starting-style` + `allow-discrete`。加新弹层不用写动画。
5. ✅ **滚动条**：`_tokens.scss` 里按 `[class^="kima-"]` 前缀的一次全局规则 + 两个派生 token
   （`--kima-color-scrollbar-thumb` / `-hover`）。任何 kima 容器自己会滚就是细圆棒样式，
   新组件零配置，宿主页面的滚动条不动。
6. ✅ **抽屉**：bottom sheet / 侧抽屉（`drawer.ce.vue`）。原生 modal dialog + `@starting-style`
   滑入 + 遮罩 dim/模糊；底部抽屉抓着把手往下拖过面板高 40% 关闭，没到就弹回。
   拖拽只挂把手上，正文照常滚动选字。三个方向：`placement="bottom|right|left"`。
   **吸附点**：给 `:snap-points="[0.4, 0.9]"`（视口高度比例）就是多档模式，
   拖到哪就近吸到哪，拖过最矮一档的 40% 才关闭；`v-model:active-snap-point` 读当前档。
7. ✅ **裁员**：130 → 30 个原语组件（Grok 官方实锤 + 行为原语判据，
   见 docs/component-pruning.md 第二批）。可组合用法由文档站 gallery 场景演示。
8. 每步 `pnpm build` / `build:lib` / `verify:lib` / `test` 通过即提交推送。
9. 每步之后：预览页加演示、测试补用例、`pnpm shots` 出图给人看，再提交推送。

### 复用旧资产时的注意

- 自动发现、Vue 导出、Web Components 注册、浏览器/SSR 测试的工程骨架已沿用；新增入口仍须核对文档/示例接入和真实构建产物，不能只凭自动发现宣布验收完成。
- `docs/reference.md` 是旧的 DMS 研究笔记，**已过时**，仅作历史参考，不再作为设计依据。

## 设计参考

- Grok 官方（复刻目标）—— 全局外观、交互与组件实现：`https://grok.com`
  官方证据提取：`docs/grok-theme-spec.md`、`docs/grok-component-reference.md`
- Reka UI —— 交互与无障碍行为底座：`https://reka-ui.com`
- Inter —— 字体（Universal Sans 的免费替代）：`https://rsms.me/inter`
