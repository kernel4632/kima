# KIMA

**K**inetic · **I**nteraction · **M**otion · **A**live。

KIMA 是面向 Web 应用的 UI 设计系统与组件库，提供 **Vue 组件**与可在原生网页中使用的 **Web Components**。

以 Material You 为设计参考，KIMA 采用大控件、宽松布局和圆角表面，用动效引导注意力，让交互反馈清晰、自然。

KIMA 适合希望采用统一、大尺寸控件和宽松留白的应用，不以融入高密度桌面工具栏为目标。默认不提供紧凑密度预设；若界面必须保持小字号、低行高和密集表单，应先评估设计方向是否匹配，而不是依靠覆盖内部样式接入。文本框的可见标签由应用排版，组件只负责可访问名与输入交互。

## 特性

- **两种接入方式**：Vue 中按需导入，或使用自定义元素接入其他 Web 项目。
- **动态主题**：由单一种子色生成品牌配色，支持深浅主题；成功、警告和危险色保留语义。
- **交互反馈**：状态层、焦点提示、涟漪与过渡动效，兼顾鼠标、触屏和键盘操作。
- **从基础到内容**：包含输入、导航、弹层、数据展示，以及代码和富文本编辑等组件。
- **统一视觉**：通过 CSS 变量控制颜色、字体、形状和间距，适配应用自身的主题。

## 安装

使用 npm、pnpm 或其他兼容 npm 的包管理器：

```sh
npm install @kernel4632/kima vue
```

```sh
pnpm add @kernel4632/kima vue
```

Vue 组件需要宿主提供兼容的 Vue 3 运行时，版本要求见 [peerDependencies](https://github.com/kernel4632/kima/blob/main/package.json#L91)。自定义元素入口已内置运行时，页面代码无需调用 Vue API。

## 在 Vue 中使用

按需导入组件及对应样式。每个组件样式入口已包含共享 token 和内部依赖组件的样式，无需手工补齐子组件：

```vue
<script setup>
import { ref } from 'vue';
import { KimaButton, KimaTextField } from '@kernel4632/kima';
import '@kernel4632/kima/styles/button.css';
import '@kernel4632/kima/styles/text-field.css';

const name = ref('');
const savedName = ref('');
</script>

<template>
  <form @submit.prevent="savedName = name">
    <p>名称</p>
    <KimaTextField
      v-model="name"
      label="名称"
      placeholder="输入名称"
    />
    <KimaButton type="submit">保存</KimaButton>
    <p v-if="savedName">已保存：{{ savedName }}</p>
  </form>
</template>
```

文本框的可访问名不会渲染为可见标签，标签文字由应用自行排版。具名导入支持构建工具移除未使用的组件与内容引擎。

样式入口使用组件的短横线名称，例如按钮、文本框和日期选择器分别对应以下路径。选择组件样式时，不要同时导入全量样式，否则仍会加载全部 CSS：

```js
import '@kernel4632/kima/styles/button.css';
import '@kernel4632/kima/styles/text-field.css';
import '@kernel4632/kima/styles/date-picker.css';
```

也可以选择核心组合或全量样式，适合使用较多组件的应用：

```js
// 核心档组件与它们的内部依赖。
import '@kernel4632/kima/styles/core.css';

// 全量样式，兼容已有接入；不会随 Vue 具名导入自动裁剪。
import '@kernel4632/kima/style.css';
```

按组件入口通过标准 CSS 导入引用共享文件，构建工具可合并、去重；无须额外安装样式插件。样式裁剪是显式选择入口，不是根据模板自动分析。

## 在原生网页中使用

### 使用构建工具

在页面的 JavaScript 入口注册核心组件：

```js
import '@kernel4632/kima/elements/core';
```

然后在 HTML 中使用：

```html
<kima-button variant="filled">保存</kima-button>
<kima-text-field label="名称" placeholder="输入名称"></kima-text-field>
```

需要编辑器等扩展组件时，改用全量入口：

```js
import '@kernel4632/kima/elements';
```

两种注册入口均自带运行时、设计 token 和组件样式，无需额外导入样式文件。通常选择一个入口即可；全量入口包含全部组件与内容引擎，不会根据页面使用的标签自动裁剪。

### 不使用构建工具

将安装包内的核心独立文件 [`dist/kima-elements-core.js`](https://www.npmjs.com/package/@kernel4632/kima?activeTab=code) 复制到网站，并通过 HTTP 服务加载：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>KIMA 示例</title>
    <script type="module" src="./kima-elements-core.js"></script>
  </head>
  <body>
    <kima-button variant="filled">保存</kima-button>
  </body>
</html>
```

需要全量组件时换用 [`dist/kima-elements.js`](https://www.npmjs.com/package/@kernel4632/kima?activeTab=code)。复制部署时应一并保留包内的第三方许可证声明。

### 属性与事件

字符串和布尔值可通过 HTML 属性传入；布尔属性存在即表示启用，关闭时移除属性或通过 JavaScript 赋值。数组与对象使用 JavaScript 属性赋值，并在元素完成注册后设置。

自定义组件事件的参数放在事件的参数数组中；按钮点击仍使用普通 DOM 点击事件。例如，读取文本框的值：

```html
<kima-text-field id="name" label="名称"></kima-text-field>
<output id="value"></output>

<script type="module">
  import '@kernel4632/kima/elements/core';

  const field = document.getElementById('name');
  const output = document.getElementById('value');

  field.addEventListener('update:modelValue', (event) => {
    const [value] = event.detail;
    output.textContent = value;
  });
</script>
```

## 主题与样式

默认使用深色主题。在页面根元素设置主题属性可切换默认深浅配色：

```html
<html lang="zh-CN" data-kima-theme="light">
```

也可以在浏览器中用种子色生成并应用配色：

```js
import { applyPalette, resetPalette } from '@kernel4632/kima/theme';

applyPalette('#61afef', { isDark: false });

// 清除运行时配色，恢复默认主题。
resetPalette();
```

运行时配色会写入内联变量。自定义种子色后切换深浅模式时，重新应用对应模式；若要回到默认主题属性控制的配色，先清除运行时配色。

KIMA 样式使用自身命名空间，不附带页面 reset 或背景。应用可自行组合页面样式，例如：

```css
body {
  background: var(--kima-color-surface);
  color: var(--kima-color-on-surface);
  font-family: var(--kima-font-family);
}
```

默认字体栈优先使用 Maple Mono NF CN，再回退到系统等宽字体。字体文件不包含在组件包中，可由应用自行加载。

自定义元素采用 light DOM，**不提供 Shadow DOM 样式隔离**，宿主页面的全局样式可能影响组件。

## 入口选择

| 入口 | 用途 |
| --- | --- |
| 主入口 | Vue 组件的具名导出，以及代码块语言登记工具 |
| [Vue 样式](https://www.npmjs.com/package/@kernel4632/kima?activeTab=code) | 按组件、核心组合或兼容全量样式，包含设计 token |
| [核心元素入口](https://github.com/kernel4632/kima/blob/main/src/elements-core.js) | 常用基础组件，自带运行时和样式 |
| [全量元素入口](https://github.com/kernel4632/kima/blob/main/src/elements.js) | 全部自定义元素，包含内容引擎 |
| [主题入口](https://github.com/kernel4632/kima/blob/main/src/utils/theme.js) | 配色生成、应用与重置 |

对应导入路径：

```js
import { KimaButton } from '@kernel4632/kima';
import '@kernel4632/kima/styles/button.css';
import '@kernel4632/kima/elements/core';
import '@kernel4632/kima/elements';
import { applyPalette } from '@kernel4632/kima/theme';
```

以上是各入口的路径对照，不需要同时导入。Vue 项目通常选择具名组件与样式；原生网页通常选择核心或全量元素入口。

## 文档

- [组件索引](https://github.com/kernel4632/kima/blob/main/docs/component-index.md)：查找组件与源码。
- [能力与边界](https://github.com/kernel4632/kima/blob/main/docs/component-comparison.md)：了解组件支持的功能。
- [问题反馈](https://github.com/kernel4632/kima/issues)：提交缺陷或功能建议。

KIMA 提供 ESM 格式的 JavaScript，不提供 CommonJS 或 TypeScript 类型声明。面向支持自定义元素、原生对话框、ResizeObserver、Web Animations 和现代 CSS 的浏览器。

## 本地开发

克隆仓库后，在项目根目录运行：

```sh
pnpm install
pnpm dev
```

本地文档站提供组件预览、用法示例和属性参考。

## 许可证

KIMA 使用 [MIT 许可证](https://github.com/kernel4632/kima/blob/main/LICENSE)。

独立浏览器包包含第三方代码，其授权文本随包提供于 [`dist/THIRD_PARTY_NOTICES.txt`](https://www.npmjs.com/package/@kernel4632/kima?activeTab=code)。复制或再分发时须保留相应许可证与版权声明。
