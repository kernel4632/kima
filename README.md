# KIMA

**K**inetic · **I**nteraction · **M**otion · **A**live。

面向高专注 Web 应用的 UI 设计系统。Vue 3 + JavaScript + SCSS，提供 Vue 组件与无需框架的原生自定义元素。大控件、低密度、Material You 动态主题；文档站也使用 KIMA 自身控件。

## 发布状态

包名为 `@kernel4632/kima`，当前版本见 [`package.json`](https://github.com/kernel4632/kima/blob/main/package.json)。当前仍在首次公开发布准备阶段，**没有执行 npm 发布**。发布审查时公共 registry 查询返回 404、身份检查返回 401；发布前需要有效登录与 scope 权限，404 本身不证明拥有发布权限。下面的 registry 安装命令用于发布后；现在可先打包并安装 tarball。

## 安装

发布后：

```sh
pnpm add @kernel4632/kima vue
```

发布前、本地验证：

```sh
pnpm install
pnpm build:lib
pnpm verify:lib
pnpm verify:install
# 将 artifacts/kernel4632-kima-0.6.0.tgz 拷到其他项目
pnpm add ./kernel4632-kima-0.6.0.tgz vue
```

`verify:install` 真正创建隔离消费者，安装打包文件，构建并在浏览器中操作 Vue 与原生元素生产页面，不从仓库源码导入。

## Vue 使用

Vue 3.5.42 及以上的 3.x 版本，Vue 运行时由宿主提供。仅提供 ESM 与 JavaScript，不提供 CommonJS 或 TypeScript 类型声明。包不包含宿主 reset 或预览页壁纸；样式会声明根级 KIMA token，并作用于 KIMA 命名空间。

```vue
<script setup>
import { KimaButton, KimaTextField } from '@kernel4632/kima';
import '@kernel4632/kima/style.css';
import { ref } from 'vue';
const name = ref('');
</script>

<template>
  <KimaTextField v-model="name" label="名称" placeholder="输入名称" />
  <KimaButton>保存</KimaButton>
</template>
```

## 原生网页使用

构建工具项目：

```js
import '@kernel4632/kima/elements/core';
// 需要全部 136 个组件及内容引擎时改用 @kernel4632/kima/elements
```

注册入口**自带 Vue 运行时、token 和组件样式**，无需另导入 [`style.css`](https://github.com/kernel4632/kima#导出入口)。采用 light DOM，不提供 Shadow DOM 样式隔离；组件 class 使用 kima 前缀。核心和全量入口可以先后加载，已注册标签不会重复注册或重复追加样式。通常选择一个入口即可，不同入口各自内含运行时，混用仍会增加下载量。

无构建工具：把 tarball 内的 [`dist/kima-elements-core.js`](https://github.com/kernel4632/kima#导出入口) 以及同目录第三方许可证声明一起部署，通过 HTTP 服务访问，不要直接双击本地网页：

```html
<script type="module" src="./kima-elements-core.js"></script>
<kima-button variant="filled">保存</kima-button>
<kima-text-field id="name" label="名称"></kima-text-field>
<script type="module">
  document.getElementById('name').addEventListener('update:modelValue', (event) => {
    const [value] = event.detail;
    console.log(value);
  });
</script>
```

数组/对象属性使用元素属性赋值，例如 `element.items = [...]`；布尔值、字符串可用 HTML 属性。Vue 自定义事件参数在 `event.detail` 数组中，普通按钮 click 仍是原生事件。原生消费者无需使用 Vue API。

## 主题

```js
import { applyPalette } from '@kernel4632/kima/theme';
applyPalette('#61afef', { isDark: true });
```

所有颜色由 `--kima-*` 变量控制。成功/警告/危险语义色不随品牌种子改变。默认深浅主题通过 `data-kima-theme="dark|light"` 选择；运行时换色使用主题入口。Maple Mono NF CN 按需由宿主加载，未安装时使用系统等宽回退，包内不嵌入字体大文件。

## 导出入口

| 入口 | 用途 |
| --- | --- |
| `@kernel4632/kima` | 具名 Vue 组件导出、componentNames、代码块语言登记工具 |
| `@kernel4632/kima/style.css` | Vue 消费者所需样式和 token |
| `@kernel4632/kima/elements` | 独立自定义元素注册与内置样式（全量 136 个） |
| `@kernel4632/kima/elements/core` | 只注册 core 档（默认推荐）；轻量核心入口（体积以构建输出为准） |
| `@kernel4632/kima/theme` | 动态配色生成与应用工具 |

构建生成四个 JS 入口及 Vue 样式，Vue 组件模块保留按需打包边界，独立自定义元素入口则内含所选档位的全部组件。全量入口含编辑器等重型引擎，不能按标签使用量自动裁剪。完整清单见[入口索引](https://github.com/kernel4632/kima/blob/main/docs/component-index.md)。

## 维护分层

公开入口先证明必要性，再决定维护档位。第一批已移除 9 个薄包装，这是公开 API 的删除，替代方式见[删减迁移](https://github.com/kernel4632/kima/blob/main/docs/component-pruning.md)。剩余组件分三档，**唯一来源**是 [`src/component-tiers.js`](https://github.com/kernel4632/kima/blob/main/src/component-tiers.js)。下表是维护目标，不是所有组件已完成逐项验收的认证；当前证据与未覆盖项见[路线图](https://github.com/kernel4632/kima/blob/main/docs/component-roadmap.md)。

| 档位 | 数量 | 维护水位 | 注册方式 |
| --- | --- | --- | --- |
| core | 43 | 优先覆盖逐页视觉、跨浏览器、键盘与读屏、动画中间帧 | 推荐核心入口 |
| extras | 80 | 按使用场景维护渲染、键盘和交互反馈 | Vue 按需或全量自定义元素 |
| experimental | 13 | 实验性渲染与状态反馈，接口可能调整 | Vue 按需或全量自定义元素 |

判断规则：每个应用都会用 → core；只有一类应用会用 → extras；只是原生控件的皮肤或装饰 → 并进基础控件或 experimental。新增 `.ce.vue` 必须在分档表里选一档，否则构建直接失败。

代码块的语法分词由 highlight.js（BSD-3-Clause）完成，内置以 common 集为基础的 **35 种语法，已包含 Dockerfile**；Vue、TS、Shell、YAML 等常见别名已登记。别名不等于完整框架语义支持，不承诺全语言、全语义着色。内置集之外的语言由 Vue 宿主在渲染前补登记，不把全部语法塞进包里；该登记工具属于 Vue 主入口，不会跨独立自定义元素包共享高亮器：

```js
import dart from 'highlight.js/lib/languages/dart';
import { registerCodeLanguage } from '@kernel4632/kima';
registerCodeLanguage('dart', dart);
```

## 开发与验收

本仓库构建使用 Node 20.19+ 或 22.12+ 的受支持版本及 pnpm。隔离消费者发布验收需要 Chromium、Firefox、WebKit，首次执行前安装浏览器：

```sh
pnpm exec playwright install chromium firefox webkit
```

```powershell
pnpm dev
pnpm build
pnpm build:lib
pnpm verify:lib
pnpm verify:install
pnpm test        # 约 8 秒冒烟：入口、真实点击、弹层、表单值
pnpm test:ssr    # 发布前执行
pnpm shots
# 逐页视觉审查：桌面与手机各跑一遍，截图落在 shots/audit*
node scripts/audit-visual.mjs http://127.0.0.1:5188
node scripts/audit-montage.mjs
# 只审 core 档（43 页）：$env:KIMA_AUDIT_TIER = 'core'
```

文档站采用顶栏、左侧组件导航、中央文档与实时预览、右侧页内目录。使用 `#/components/button` 等地址可直接进入组件页。属性表来自组件源码，实际演示使用库内组件。顶栏全文命令搜索会检索组件名称、中文描述、属性和事件；`Ctrl/Cmd+K` 打开，方向键、Enter、Escape 和焦点返回均可用。

代码示例统一使用 `KimaCodeBlock`，提供指定语言着色、文件名、行号、换行和复制反馈；未知语言安全回退为纯文本。常用语言随包提供，不依赖网络着色服务。

当前源码有 **136 个独立组件入口**，包含日期/表单、虚拟化、utility、布局排版、嵌套菜单/应用壳及内容扩展。重型依赖集中在 extras 档（highlight.js 随代码块、CodeMirror、Tiptap、图表），所以日常控件用 `/elements/core` 不会带上它们。

公开目录逐项来源和边界见 [136 项能力对照](https://github.com/kernel4632/kima/blob/main/docs/component-comparison.md)，G00–G50 的处置见[能力路线图](https://github.com/kernel4632/kima/blob/main/docs/component-roadmap.md)。表格没有固定列、分组表头/行分组或自动分页；颜色提供 HSV/alpha 与 HEX 编辑及原生颜色选择入口，RGB/HSL 是读数，不提供独立屏幕取色 API 或多色彩空间编辑；日期时间使用无时区本地模型，不处理 DST。图表不包含缩放平移/堆叠/饼图，编辑器不提供协作或代码执行。server auth、transport、CMS 和商业模板属于宿主/业务层范围。

面向现代浏览器，依赖自定义元素、原生对话框、ResizeObserver、Web Animations 及现代 CSS。发布验收的跨浏览器检查仅覆盖核心入口安装、注册、基础输入和样式，不等于全部组件在全部浏览器、读屏器或动画中间帧上均已验收。SSR 测试也不代表所有组件都能在服务端进行完整交互。

## 许可证

KIMA 自身使用 MIT 许可证。独立浏览器包内含第三方代码，完整许可证随包放在 [`dist/THIRD_PARTY_NOTICES.txt`](https://github.com/kernel4632/kima#许可证)；复制或再分发独立包时须保留相应声明。构建根据实际模块图收集文本，依赖缺少授权文本时会阻断构建。

## 发布

本轮已验证范围、包体积与账号阻塞见[发布准备审查](https://github.com/kernel4632/kima/blob/main/docs/npm-release-readiness.md)。它记录本地验收，不代表包已经上架。

1. 使用有 `@kernel4632` scope 权限的账户执行 `npm login --registry=https://registry.npmjs.org`。
2. 执行 `npm whoami --registry=https://registry.npmjs.org` 确认身份，不要把 token 写入源码或提交。
3. 执行 `pnpm release:check`、浏览器测试和 SSR 测试。
4. 检查目标版本未被使用、发布清单和许可证；版本号不会随提交自动增长，文档站只显示构建时的版本。确定版本后执行 `npm publish --access public --registry=https://registry.npmjs.org`（可能要求 2FA）。不要重复发布已有版本。
5. 执行 `npm view @kernel4632/kima version --registry=https://registry.npmjs.org` 并在新项目从 registry 安装复验，然后更新发布状态。

`prepack` 自动构建，`prepublishOnly` 会运行打包与隔离安装校验。`artifacts/` 中的 tarball 不入库。发布必须使用有效凭证，不能用 dry-run 代替“已发布”。

协作约束见 [`AGENTS.md`](https://github.com/kernel4632/kima/blob/main/AGENTS.md)。历史研究笔记不作为当前设计依据。
