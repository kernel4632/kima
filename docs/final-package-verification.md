# 最终真实发布产物验收

本轮最终验收通过。库构建、库产物校验、真实 tarball 隔离安装校验最终退出码均为 0；消费者检查共 22 项，通过 22 项，失败 0 项。最新证据为 `artifacts/final-delivery-verify-install.log`。

本报告记录发布产物与隔离消费者边界；浏览器全量、SSR、生产站逐页和截图结果见 [最终回归记录](final-regression.md)。

## 修改范围与构建修复

本轮发布产物校验涉及 [verify-install.js](../scripts/verify-install.js)、[verify-package.js](../scripts/verify-package.js)、必要的 [build-lib.js](../scripts/build-lib.js) 及前述整合后的实际组件。保留工作区其他改动；没有提交或推送，没有停止 5188/5193/5225 服务。

强化后的真实消费者首次暴露：仅具名导入按钮也产生 1,182,217 字节 JS。外置引擎依赖后仍有 800,071 字节；消费者构建模块清单确认 KaTeX、Tiptap、QR 等副作用仍被保留。因此 [build-lib.js](../scripts/build-lib.js:10) 按发布清单外置 Vue 入口依赖，并保留组件模块边界。消费者可以丢弃整块未使用组件和对应引擎；elements 和主题入口继续独立打包。

这是 Vue 发布产物内部布局的变化：原有公开入口保持可用，包内新增分模块 JS 文件。分模块产物必须随整个发布目录一同安装。实际 tarball 隔离安装、SSR 和浏览器生产消费者均已验证，不依赖仓库源码。

## 最终执行证据

| 命令 | 最终退出码 | 验证内容 | 证据 |
| --- | ---: | --- | --- |
| pnpm build:lib | 0 | Vue 分模块、完整 elements、独立主题构建；输出级导入约束 | [构建日志](../artifacts/final-build-lib-latest.log)、[结构化结果](../artifacts/build-lib-result.json) |
| pnpm verify:lib | 0 | 145 个组件导出、Vue CSS、CE inline scoped CSS、SSR、独立模块 AST 检查 | [产物验收日志](../artifacts/final-verify-lib-latest.log)、[结构化结果](../artifacts/verify-package-result.json) |
| pnpm verify:install | 0 | 真实 tarball、隔离安装、生产构建、Chromium 真实交互；22/22 通过 | [消费者日志](../artifacts/final-delivery-verify-install.log)、[结构化结果](../artifacts/verify-install-result.json) |

三个日志均包含最终退出码；结构化结果保留大小、消费者测试名称及通过数量。构建模块明细见 [消费者构建模块证据](../artifacts/verify-install-build-modules.json)，消费者构建日志见 [生产构建日志](../artifacts/verify-install-consumer-build.log)。

真实可安装文件为 [kernel4632-kima-0.6.0.tgz](../artifacts/kernel4632-kima-0.6.0.tgz)。本轮压缩包 1,118,976 字节，解包 4,764,706 字节；完整性校验值为 sha512-ngJj2BkcvdYXrenfvj3zS4p78ajCEgKg9tY5qUH946KCslH5fgGG9ffQy9YFxNeO3DuJjKwxq9tSoXIkNi90zg==。后续整合重新打包后该值可能变化，应以新结果为准。

## 隔离消费者覆盖

脚本先打包实际发布目录，再在系统临时目录安装该 tarball、Vue 与 Vite。消费者生产构建不配置源码别名、不访问仓库组件源码。构建完成后，所有浏览器页面均由 Node 静态 HTTP 服务通过随机端口提供，使用 Chromium 验证。

三种入口使用同组 6 项交互验收，共 18 项：

| 场景 | Vue 生产消费者 | 原生 CE 生产消费者 | standalone 静态 HTTP |
| --- | --- | --- | --- |
| 按钮点击与实际圆角 | 通过 | 通过 | 通过 |
| 文本域输入、弹层展开和 Escape 关闭 | 通过；另检查单选更新 | 通过 | 通过 |
| CodeMirror 编辑回传、查找选区、撤销/重做 | 通过 | 通过 | 通过 |
| Tiptap 输入回传、粗体、链接应用 | 通过 | 通过 | 通过 |
| 二维码真实矩阵路径、主题填色和数据更新 | 通过 | 通过 | 通过 |
| 三级菜单键盘展开、选择、关闭和焦点归还 | 通过 | 通过 | 通过 |

另有 4 项检查：按钮摇树与五组正向对照、standalone 精确请求清单、按钮精简包浏览器挂载、全消费者无运行时/网络/控制台错误。最终错误和控制台消息列表均为空。

standalone 仅复制发布包内一个完整库文件，另写消费者自己的启动脚本；不加载额外 CSS、不请求依赖目录、不加载运行时分块、不使用 Vite 开发或预览服务器。实际请求只有 [standalone.html](../artifacts/verify-install-result.json:156)、[standalone.js](../artifacts/verify-install-result.json:157) 与 [kima-elements.js](../artifacts/verify-install-result.json:158)。

## 编辑器与菜单样式验收

静态校验逐个检查 145 个 CE 的内联样式、Vue 提取样式及作用域标记，额外要求编辑器和递归菜单的深层选择器保留。浏览器进一步检查真实计算样式：

- CodeMirror 搜索输入框零边框、至少 8px 圆角，搜索面板内边距及编辑器最大高度生效。
- Tiptap 文档 1.8 倍行高、最小高度、首段上边距为零，生成链接带下划线。
- 递归菜单行弹性布局及最小高度、子菜单圆角与非透明背景生效。
- 二维码 SVG 保持锐利模块边缘，纸面和模块使用不同主题填色，更新数据后矩阵路径改变。

这些断言在 Vue、原生生产构建、standalone 三页上均实际运行，覆盖 CE inline scoped 嵌套样式丢失风险。消费者原生编辑器用初始属性提供默认内容，确保撤销基线与 Vue 相同；CodeMirror 搜索使用真实逐键输入，以触发引擎的键盘提交查询逻辑。

截图见 [Vue 消费者](../artifacts/verify-install-vue.png)、[原生生产消费者](../artifacts/verify-install-native.png)、[standalone 消费者](../artifacts/verify-install-standalone.png)。宿主页面用库已有主题 token 设置底色和文字色，遵守库不重置宿主页面的约定。

## 大小与摇树证据

默认完整 elements 入口最新实测 **3,722,357 字节，即 3.72 MB；gzip 903,619 字节**。它一次注册全部组件并包含全部引擎，超过任务中的约 2.8 MB 预估；验收脚本输出诚实的全量体积警告。它不是按需加载入口。

| 库产物 | 原始字节数 | gzip 字节数 | 说明 |
| --- | ---: | ---: | --- |
| [kima-elements.js](../dist/kima-elements.js) | 3,722,357 | 903,619 | 完整独立 CE 文件，含全部引擎 |
| [kima.js](../dist/kima.js) | 12,524 | 2,882 | Vue 聚合入口，仅此入口大小不代表整库 |
| Vue 全部 JS 模块与入口 | 641,786 | 不合并统计 | 磁盘上 168 个 JS 文件；不含外置依赖 |
| [style.css](../dist/style.css) | 339,226 | 35,336 | Vue 全组件样式，本轮未按组件拆 CSS |
| [kima-theme.js](../dist/kima-theme.js) | 52,999 | 14,079 | 独立主题入口 |

以下是同一隔离消费者使用公开具名导入、默认生产压缩得到的 JS 总字节数，均包含 Vue 运行时，不包含整库样式：

| 消费者 | JS 字节数 | 相对仅按钮增量 |
| --- | ---: | ---: |
| 仅按钮 | 71,685 | 0 |
| 按钮 + CodeMirror 编辑器 | 604,840 | 533,155 |
| 按钮 + Tiptap 富文本编辑器 | 482,842 | 411,157 |
| 按钮 + KaTeX 公式 | 333,674 | 261,989 |
| 按钮 + 二维码 | 94,433 | 22,748 |
| 按钮 + 代码高亮 | 133,420 | 61,735 |

验收不是搜索压缩代码中的引擎名称：直接读取消费者构建输出的模块元数据，要求仅按钮产物确实包含发布包按钮模块，且没有 CodeMirror、Lezer、Tiptap、ProseMirror、KaTeX、QR 或 highlight.js 引擎模块。五组正向对照各自必须包含对应组件与引擎的已渲染模块，并增加真实包体。另要求仅按钮总量低于 200 KB，且低于三个大型引擎对照中最小体积的 35%。最后在浏览器中挂载精简后的按钮产物。

Vue + 原生两个验收页面合并生产输出为 4,783,972 字节 JS，3 个块；这是同时包含全量 CE 页面与 Vue 页面引擎的验收夹具总和，不应当作单个业务页面的推荐体积。

## standalone 不变量与验收边界

构建输出钩子检查 elements 与 theme 均只有一个 JS 块，没有外部静态导入或动态导入；产物校验递归遍历 AST，检查静态导入、带来源的重新导出以及任意层级动态导入表达式，并检查 Node 环境变量依赖。浏览器静态请求清单再次验证没有运行时模块加载。

本轮没有发现需要额外修复的发布产物缺陷。二维码验收检查真实编码输出与响应更新，没有在此消费者脚本内新增扫码解码器；跨浏览器、辅助技术和全部组件业务组合由最终回归记录覆盖。当前版本仍未公开发布，工作区改动未提交、未推送。
