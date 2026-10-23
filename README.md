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
| `@kernel4632/kima` | 具名 Vue 组件导出、componentNames、代码块语言登记工具 |
| `@kernel4632/kima/style.css` | Vue 消费者所需样式和 token |
| `@kernel4632/kima/elements` | 独立自定义元素注册与内置样式（全量 145 个） |
| `@kernel4632/kima/elements/core` | 只注册 core 档（默认推荐）；3.86MB → 1.57MB |
| `@kernel4632/kima/theme` | 动态配色生成与应用工具 |

构建脚本生成四个 JS 产物：[Vue 组件入口](scripts/build-lib.js:1)、[全量自定义元素入口](src/elements.js:1)、[core 自定义元素入口](src/elements-core.js:1)、[主题工具入口](src/utils/theme.js:1)，另输出 Vue 消费者使用的样式。组件从[源码目录](src/components/)自动发现，本次文档核对为 **145 个**；完整清单见[入口索引](docs/component-index.md)。

## 维护分层

145 个入口不可能都按最高水位维护，所以组件分三档，**唯一来源**是 [`src/component-tiers.js`](src/component-tiers.js:1)：

| 档位 | 数量 | 维护水位 | 注册方式 |
| --- | --- | --- | --- |
| core | 44 | 逐页视觉审查、跨浏览器、键盘与读屏、动画中间帧 | `/elements/core` 默认注册 |
| extras | 84 | 保证渲染、键盘可达、有交互反馈 | 按需，`/elements` 全量或自己注册 |
| experimental | 17 | 只保证能渲染、有状态反馈，接口可能调整 | 按需，文档页标「实验」 |

判断规则：每个应用都会用 → core；只有一类应用会用 → extras；只是原生控件的皮肤或装饰 → 并进基础控件或 experimental。新增 `.ce.vue` 必须在分档表里选一档，否则构建直接失败。

代码块的语法分词由 `highlight.js` 完成，内置它的 common 语言集（35 种，另含 dockerfile；`vue`/`ts`/`sh`/`yml` 等常见别名已注册）。内置集之外的语言由宿主补登记，不把 190 多种语法全量塞进包里：

```js
import dart from 'highlight.js/lib/languages/dart';
import { registerCodeLanguage } from '@kernel4632/kima';
registerCodeLanguage('dart', dart);
```

## 开发与验收

```powershell
pnpm dev
pnpm build
pnpm build:lib
pnpm verify:lib
pnpm verify:install
pnpm test        # 约 8 秒冒烟：入口、真实点击、弹层、表单值
pnpm test:ssr    # 发布前可选
pnpm shots
# 逐页视觉审查：桌面与手机各跑一遍，截图落在 shots/audit*
node scripts/audit-visual.mjs http://127.0.0.1:5188
node scripts/audit-montage.mjs
```

文档站采用顶栏、左侧组件导航、中央文档与实时预览、右侧页内目录。使用 `#/components/button` 等地址可直接进入组件页。属性表来自组件源码，实际演示使用库内组件。顶栏全文命令搜索会检索组件名称、中文描述、属性和事件；`Ctrl/Cmd+K` 打开，方向键、Enter、Escape 和焦点返回均可用。

代码示例统一使用 `KimaCodeBlock`，提供指定语言着色、文件名、行号、换行和复制反馈；未知语言安全回退为纯文本。常用语言随包提供，不依赖网络着色服务。

当前源码有 **145 个独立组件入口**，包含日期/表单、虚拟化、utility、布局排版、嵌套菜单/应用壳及内容扩展。重型依赖集中在 extras 档（highlight.js 随代码块、CodeMirror、Tiptap、图表），所以日常控件用 `/elements/core` 不会带上它们。

公开目录逐项来源和边界见 [145 项能力对照](docs/component-comparison.md)，G00–G50 的处置见[能力路线图](docs/component-roadmap.md)。表格没有固定列、分组表头/行分组或自动分页；颜色提供 HSV/alpha 与 HEX 编辑，RGB/HSL 是读数，不含取色器、多色彩空间；日期时间使用无时区本地模型，不处理 DST。图表不包含缩放平移/堆叠/饼图，编辑器不提供协作或代码执行。server auth、transport、CMS 和商业模板属于宿主/业务层范围，不列核心缺失。

当前验收以命令实际输出为准：`pnpm test` 一条冒烟（入口注册、真实点击、弹层 Escape、表单值）；`pnpm test:ssr` 16 项；`node scripts/audit-visual.mjs` 桌面与手机各 145 页、`flagged=0`；`pnpm build` / `build:lib` / `verify:lib` 全过（145 组件、12 项产物检查，含 core 入口只注册 core 档的断言）。历史全量回归数字与日志见[最终回归记录](docs/final-regression.md)和[真实产物验收](docs/final-package-verification.md)。当前版本尚未公开发布。

## 发布

1. 使用有 `@kernel4632` scope 权限的账户执行 `npm login --registry=https://registry.npmjs.org`。
2. 执行 `npm whoami --registry=https://registry.npmjs.org` 确认身份，不要把 token 写入源码或提交。
3. 执行 `pnpm release:check`、浏览器测试和 SSR 测试。
4. 检查版本未被使用、发布清单和许可证；执行 `npm publish --access public --registry=https://registry.npmjs.org`（可能要求 2FA）。
5. 执行 `npm view @kernel4632/kima version --registry=https://registry.npmjs.org` 并在新项目从 registry 安装复验，然后更新发布状态。

`prepack` 自动构建，`prepublishOnly` 会运行打包与隔离安装校验。`artifacts/` 中的 tarball 不入库。发布必须使用有效凭证，不能用 dry-run 代替“已发布”。

协作约束见 [AGENTS.md](./AGENTS.md)。历史研究笔记不作为当前设计依据。
