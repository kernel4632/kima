# KIMA

**K**inetic · **I**nteraction · **M**otion · **A**live。

面向高专注 Web 应用的 UI 设计系统。Vue 3 + JavaScript + SCSS，提供 Vue 组件与无需框架的原生自定义元素。大控件、低密度、Material You 动态主题；文档站也使用 KIMA 自身控件。

## 发布状态

包名为 `@kernel4632/kima`。已有公共 registry 查询记录返回 404，npm 身份检查返回 401，**尚未完成公开发布**；本次文档核验没有重新查询 registry，也没有执行发布。本轮改动仍在工作区，**未提交、未推送**。下面的 registry 安装命令用于发布后；现在可先打包并安装 tarball。

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

Vue 3.5.42 及以上，Vue 运行时由宿主提供。包不包含宿主 reset 或预览页壁纸。

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
import '@kernel4632/kima/elements';
```

注册入口**自带 Vue 运行时、token 和组件样式**，无需再导入 style.css。采用 light DOM，样式仅注入一次；组件 class 使用 kima 前缀。

无构建工具：把 tarball 内的 `dist/kima-elements.js` 复制到网站即可：

```html
<script type="module" src="./kima-elements.js"></script>
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
| `@kernel4632/kima` | 具名 Vue 组件导出及 componentNames |
| `@kernel4632/kima/style.css` | Vue 消费者所需样式和 token |
| `@kernel4632/kima/elements` | 独立自定义元素注册与内置样式 |
| `@kernel4632/kima/theme` | 动态配色生成与应用工具 |

构建脚本生成三个 JS 产物：[Vue 组件入口](scripts/build-lib.js:1)、[独立自定义元素入口](src/elements.js:1)、[主题工具入口](src/utils/theme.js:1)，另输出 Vue 消费者使用的样式。组件从[源码目录](src/components/)自动发现，本次文档核对为 **145 个**；完整清单见[入口索引](docs/component-index.md)。两种使用方式（Vue / 原生网页）不等于只有两个 JS 构建入口。

## 开发与验收

```powershell
pnpm dev
pnpm build
pnpm build:lib
pnpm verify:lib
pnpm verify:install
# PowerShell：选择空闲端口，保留当前 5188/5193 服务
$env:KIMA_TEST_PORT = '5228'
pnpm test -- --workers=2
pnpm test:ssr
pnpm exec playwright test --config playwright.final-enhancement.config.js
pnpm shots
```

文档站采用顶栏、左侧组件导航、中央文档与实时预览、右侧页内目录。使用 `#/components/button` 等地址可直接进入组件页。属性表来自组件源码，实际演示使用库内组件。顶栏全文命令搜索会检索组件名称、中文描述、属性和事件；`Ctrl/Cmd+K` 打开，方向键、Enter、Escape 和焦点返回均可用。

代码示例统一使用 `KimaCodeBlock`，提供指定语言着色、文件名、行号、换行和复制反馈；未知语言安全回退为纯文本。常用语言随包提供，不依赖网络着色服务。

当前源码有 **145 个独立组件入口**，包含日期/表单、虚拟化、utility、布局排版、嵌套菜单/应用壳及内容扩展。图表/热力图、Tiptap 富文本、CodeMirror 代码编辑器和 KaTeX MathML 公式已有真实实现，相关依赖已进入核心 bundle；不再将它们写成尚未提供的附加包。

公开目录逐项来源和边界见 [145 项能力对照](docs/component-comparison.md)，G00–G50 的处置见[能力路线图](docs/component-roadmap.md)。表格没有固定列、分组表头/行分组或自动分页；颜色提供 HSV/alpha 与 HEX 编辑，RGB/HSL 是读数，不含取色器、多色彩空间；日期时间使用无时区本地模型，不处理 DST。图表不包含缩放平移/堆叠/饼图，编辑器不提供协作或代码执行。server auth、transport、CMS 和商业模板属于宿主/业务层范围，不列核心缺失。

最终整合验收已实际完成：生产站 145/145 路由均有唯一可见 demo 且无 page error；浏览器全量 716/716（桌面 358、移动 358），SSR 17/17，动效专项 170/170；真实 tarball 隔离消费者 22/22；正式站截图 5/5。完整命令、退出码和日志见[最终回归记录](docs/final-regression.md)、[真实产物验收](docs/final-package-verification.md)及 `artifacts/final-site-production-smoke.log`。`build:lib`/`verify:lib` 保留全量 elements 3.72 MB 的体积警告；Vue 具名导入仍支持 tree shaking。当前版本尚未公开发布，工作区改动未提交、未推送。

## 发布

1. 使用有 `@kernel4632` scope 权限的账户执行 `npm login --registry=https://registry.npmjs.org`。
2. 执行 `npm whoami --registry=https://registry.npmjs.org` 确认身份，不要把 token 写入源码或提交。
3. 执行 `pnpm release:check`、浏览器测试和 SSR 测试。
4. 检查版本未被使用、发布清单和许可证；执行 `npm publish --access public --registry=https://registry.npmjs.org`（可能要求 2FA）。
5. 执行 `npm view @kernel4632/kima version --registry=https://registry.npmjs.org` 并在新项目从 registry 安装复验，然后更新发布状态。

`prepack` 自动构建，`prepublishOnly` 会运行打包与隔离安装校验。`artifacts/` 中的 tarball 不入库。发布必须使用有效凭证，不能用 dry-run 代替“已发布”。

协作约束见 [AGENTS.md](./AGENTS.md)。历史研究笔记不作为当前设计依据。
