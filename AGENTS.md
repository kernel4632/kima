# KIMA

KIMA 是一个面向高专注、高体验 Web 应用的 UI 设计系统与组件库。
全称：**K**inetic、**I**nteraction、**M**otion、**A**live。

一句话定位：**Material 3（Material You）风，把手机界面放大到电脑**——大控件、大卡片、
低密度、简洁展示；用动效引导注意力；弹层用抽屉聚光；**交互体验第一，好看第二**。

本文件是本仓库的最高协作约束。任何会话在改代码前先读本文件。

> 仓库已从旧的 FEYO 改名到 KIMA，源码、样式、脚本、测试、文档里的名字都统一成 `kima`。
> 基础层和组件已重做；当前目录有 145 个组件入口。能力边界见[逐项矩阵](docs/component-comparison.md)，最终验证状态见[路线图](docs/component-roadmap.md)，不能把文件存在写成全量验收通过。

## 技术栈（固定，不要替换）

- Vue 3（Composition API）
- JavaScript（不是 TypeScript）
- Vite
- SCSS
- pnpm
- Hugeicons 图标：`@hugeicons/vue` + `@hugeicons/core-free-icons`
- **Reka UI**：交互与无障碍行为底座（无样式，`reka-ui`）
- **@material/material-color-utilities**：从种子色生成 Material You 动态配色

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

- **全局**：Material 3（Material You）。尺寸比官方默认**再放大一号**，像桌面版的手机 UI。
- **密度**：松。大按钮、大卡片、信息不密、简洁展示。
- **颜色**：从**单一青蓝种子**（默认 `#61afef`）用 material-color-utilities 生成整套
  Material You 色板；种子可整体替换。**深浅两套都做**。
  - **品牌色跟着种子走**：primary / secondary / 各种容器色，换种子就整套变。
  - **语义色不跟**：成功（绿）、警告（橙）、危险（红）含义固定，像交通灯。
    换主题不该换掉"绿灯是绿的"这件事——纯灰度主题下如果语义色也变灰，
    "成功"和"中性"会长得一样，用户分不出状态来。
    危险色用色板里的 error 系列（M3 自己的 error 也不随种子变），成功/警告在 `_tokens.scss`。
- **字体**：全站等宽 **Maple Mono NF CN**，semi-bold。中文按需分片或系统回退，不要整包内联。
- **形状**：M3 圆角刻度（XS 4 / S 8 / M 12 / L 16 / XL 28）；按钮、芯片满圆；
  卡片 M（12）；抽屉大圆角。只有「明确提示下一步交互」的元素才用满圆胶囊。
- **弹层**：bottom sheet / 侧抽屉（Vaul 式）——背景 dim + 模糊 + 抽屉滑入，**只聚焦当前内容**，
  不展示背后内容。拖拽关闭、吸附点。
- **动效**：承担**引导注意力**的职责，不只是装饰。用 M3 的时长/缓动 + 弹簧。
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
    输入框不在此列：它跟卡片一样靠底色认出层次，聚焦时才叠一圈主色提示焦点。
  - **文本框不给标签**：可见标签由使用者用普通排版文字自己组合（原生 label 包住组件即可）。
    组件只留 `label` 属性作可访问名，落到内部输入框的 `aria-label` 上；
    组件画标签就要替使用者决定位置和对齐，还要多维护一套标签样式。
    换一句话说：**这个线没了，控件还能被认出来吗？** 不能，就说明它是造型，留着。
- **优先级**：交互与体验第一，好看第二。

## 禁止使用的依赖

不要引入带视觉意见的组件库（Material UI、Material Web、MUI、Ant Design、Vuetify 等）。
**Reka UI 允许**（它无样式）。图标只允许 Hugeicons。

## 主题与颜色

颜色只能由 KIMA 自己的 CSS variables 控制，全部以 `--kima-` 开头，方便整体换主题。
组件里**不允许**硬编码颜色值（hex、rgb 等），只能引用 token。
token 定义在 `src/styles/_tokens.scss`；动态色板由 `material-color-utilities` 生成。

## 目录结构（随开发扩展）

```
src/
  styles/
    _tokens.scss    设计 token（字体、间距、形状、层级、动效、控件尺寸）
    _palette.scss   由 scripts/palette.js 生成的颜色角色，不要手改
    _mixins.scss    共用交互 mixin（状态层、焦点环、表面、禁用）
    index.scss      开发预览页的基础样式
  components/       组件，一个组件一个 xxx.ce.vue 文件，按文档分组放在子目录，放进来就自动登记
    core/           基础控件（按钮、文本框、表格、弹层等）
    input/          输入控件
    display/        展示与反馈
    navigation/     导航与内容组织
    interaction/    弹层与交互
    advanced-input/ 日期与表单高级能力
    data/           数据、媒体与反馈
    form-completion/ 表单闭环
    utility/        工具与操作
    foundation/     布局、排版与页面基础
    content/        图表与内容引擎
    shell/          应用壳与装饰
  utils/            共用工具（主题、动效、输入/日期、导航、配置、内容等），按实际复用维护
  component-paths.js 由 scripts/components.js 生成，slug → 分组路径，测试与工具使用
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

- 修改前先看项目现有写法，保持风格一致，优先最小改动。
- 组件用 SCSS，`<style scoped lang="scss">`，颜色一律走 token。
- 默认主题来源为 `src/utils/theme.js`，`scripts/palette.js` 生成首屏色板；运行时用 `applyPalette()` 换色。不要手改 `_palette.scss`，不要在组件另建一套色板。
- 不凭空增加框架或抽象层。
- 完成一个可用改动后运行 `pnpm build`；组件库改动还要跑 `pnpm build:lib` 和 `pnpm verify:lib`。
- 改完一点且处于能用状态（构建和测试通过）就立刻提交并推送，不要攒着。
- 看完效果用 `pnpm shots` 出截图（`shots/` 已在 .gitignore 里，不入库）。
- commit 信息用中文描述，遵循 Conventional Commits 格式：
  `type(scope): 中文描述`，type 用英文（feat/fix/refactor/docs/test/build/chore），
  例如 `feat(按钮): 按 Material 3 重做按钮`。改动只涉及一个组件时 scope 写组件名。
- 推送目标为 `origin main`。

## 协作方式（重要）

- 用户要**逐个组件地指导**，不要一次把整套写完。
- 流程：一次只做一小步（一个组件或一小块基础）→ 做完停下来给用户看（截图 + 说明）
  → 用户给意见 → 改 → 用户点头 → 提交 → 再下一步。
- 用户较难用文字描述想要的感觉；**多用图/可见效果沟通**，少让用户凭空描述。

## 迁移状态

1. ✅ **改名**：FEYO → KIMA（包名、CSS 变量、标签、class、导出、样式注入 id、脚本、测试、
   README、docs、构建产物名）。
2. ✅ **重做基础层**：M3 token（色/字/形状/层级/状态层/动效）+ 放大尺寸 + mixins + 字体接入。
   色板由 `src/utils/theme.js` 定义（唯一来源），`scripts/palette.js` 用它生成
   `src/styles/_palette.scss` 作为首屏默认色；运行时换色用 `applyPalette()`，不用重新构建。
   图标统一走 `src/components/icon.ce.vue`（线宽 `iconStrokeWidth`，配 `absolute-stroke-width`）。
3. ✅ **逐组件重做**：全部组件已按新方向重写（清单见 `src/components/`，数量以目录为准）。交互反馈的分配规则：
   - **按钮类**（`button`、`icon-button`）：状态层 + 焦点环 + 涟漪 + 按下回弹（幅度 2%，几乎看不出）。
   - `button-group` / `card`：状态层 + 焦点环 + 涟漪；卡片回弹与按钮同档。
   - **字段类**（`text-field`、`select`、`combobox`、`cascader`、`date-picker`、`time-picker`）：
     控件是一整块"场地"，触发器 / 图标 / 清除按钮都是场地的排版项，flex 自动排位置，
     **不用绝对定位**（`kima-press` 的过冲会把并排的清除按钮挤出可点范围）。
     反馈只有状态层 + 焦点环 + 涟漪；不接按下回弹——点它是"展开面板"，弹回跟展开方向拧着。
   - **选项行**（下拉、菜单、时间列、树、虚拟滚动、表格行）：悬停/高亮只变底色 + 文字色，
     走 `--kima-duration-effects` 过渡，不瞬切；不做按下缩放（一行缩起来会把整列排布弄乱）。
   - **选中态配色**：容器色底必须配 `on-*-container` 文字（`primary-container` +
     `on-primary-container`），悬停时底色从容器色派生（`--kima-color-primary-container-hover`），
     不能落回通用 `layer-3`——那会把配对拆开，深色主题下成黑字压深底。
4. ✅ **弹层**：全部弹层（下拉 / 菜单 / 日期 / 时间 / 提示 / 通知 / 对话框 / 级联 / 抽屉）共用同一套
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
7. 每步 `pnpm build` / `build:lib` / `verify:lib` / `test` 通过即提交推送。
8. 每步之后：预览页加演示、测试补用例、`pnpm shots` 出图给人看，再提交推送。

### 复用旧资产时的注意

- 自动发现、Vue 导出、Web Components 注册、浏览器/SSR 测试的工程骨架已沿用；新增入口仍须核对文档/示例接入和真实构建产物，不能只凭自动发现宣布验收完成。
- `docs/reference.md` 是旧的 DMS 研究笔记，**已过时**，仅作历史参考，不再作为设计依据。

## 设计参考

- Material 3（Material You）—— 全局外观、交互与布局、动效：`https://m3.material.io`
- Vaul —— 抽屉式弹层行为与聚焦：`https://vaul.emilkowal.ski`
- Reka UI —— 交互与无障碍行为底座：`https://reka-ui.com`
- Apple HIG —— 优雅感与决策突出（主操作填色 / 危险红 / 次要弱化）
- Maple Mono —— 字体：`https://github.com/subframe7536/maple-font`（OFL 1.1）
