# 内容扩展 G37–G39

这组新增五个核心入口，Vue 导出和 light DOM 自定义元素由现有生成器自动发现。未修改 App、主 catalog 或其他组 examples；父入口合并 `contentCatalog`，在当前组件分支挂载 `<ContentExamples :component="slug" />`。示例根节点是唯一的 `article.kima-gallery__demo`。

## 图表与热力图

- `chart`：`series=[{name,data:[number|null]}]`，`labels` 提供类别名。散点数据也可用 `{x:number,y:number|null}`。`mode` 支持 line、bar、area、scatter。负值以零线为基准；null/非有限数字为缺失点，折线不跨越缺值。图例切换系列；方向键循环有效点，Home/End 首尾；`select` 返回 `{series,index,x,value}`。实色 tooltip，完整数据表含隐藏系列和缺值。SVG 随容器缩放，数据表可以独立滚动。
- 图表系列角色为 `--kima-chart-series-1/2/3/4`，默认从 primary、tertiary-container、secondary-container 与混色派生，宿主可在组件根节点覆盖。四种颜色循环用于更多系列，图例和数据表同时保留文字标识。
- `heatmap`：`values` 为二维 number/null，`columns`、`rows` 为轴名。行列键盘移动，Home/End 当前行首尾，Ctrl+Home/End 全局首尾。`select` 返回 `{x,y,value}`。图例显示有效范围，缺失显示破折号；数据表保留原始值。强度角色为 `--kima-heatmap-low/high`，默认 layer 与 primary-container。
- 当前图表用于有限规模可视化，不包含缩放平移、堆叠、饼图或统计聚合。模型更新立即生效，数据更新透明度提示不延迟选择和数据语义。

## 富文本

`rich-text-editor` 使用 Tiptap 3 / ProseMirror，不使用 execCommand。`modelValue` **始终为经过清洗的 HTML 字符串**，不是 Markdown 或 JSON。`getJSON()` 只用于读取当前 schema 文档，不是第二种输入模式。

支持段落、h1–h3、粗体、斜体、删除线、引用、列表、代码、分隔线和安全链接。工具栏提供粗体、斜体、h2、两类列表、链接、撤销与重做；标准引擎键盘命令和 IME 保留。工具栏鼠标操作保留原选区，链接编辑保存并恢复真实文档位置。`selection-change` 返回 `{from,to,empty,text}`，位置是 ProseMirror 文档位置，包含块边界，并非纯文本字符串下标。

输入、粘贴、SSR 回退和 HTML 输出共用 js-xss 解析白名单；schema 再次约束文档。不接受图片、SVG、MathML、内嵌内容、样式、任意属性、事件属性。链接只接受 http(s)、mailto、tel、单斜线站内路径、锚点；拒绝控制字符、反斜线、协议相对地址。HTML 不是通用渲染接口。

相同模型回写跳过文档替换；不同外部 HTML 尽量保留并限制选区到新文档长度。IME 期间延后外部文档替换；没有网络 source/协作接口。应用若自行异步覆盖文档，需要自行处理版本冲突。

## 代码编辑

`code-editor` 使用 CodeMirror 6；`modelValue` 是原样纯文本。`language` 支持 javascript/js、json、html、css，其他值按纯文本。带行号、折叠、括号匹配、查找/替换、历史、标准键盘命令、Tab 缩进。Ctrl/Cmd+F 打开查找，Ctrl/Cmd+Z 撤销，Ctrl/Cmd+Shift+Z 重做（Windows 同时保留 Ctrl+Y）。语法色来自 KIMA token。

`selection-change` 返回 `{from,to,line,column}`，from/to 是代码文本的 UTF-16 下标，line/column 从 1 起。切换语言通过 compartment 保留文档和选区；外部值采用最小差异事务映射选区。输入不会执行代码，HTML/CSS 语言只做编辑和高亮。没有异步补全服务依赖。

## 表单、只读与禁用

两个编辑器均支持 `name`、`form`、`required`、`disabled`、`readonly`、`label`、`placeholder`。真实编辑区由成熟引擎管理，视觉隐藏的原生 textarea 仅同步表单值与约束校验；不是编辑器替身。只读可聚焦、选择、复制；禁用不可编辑且不进入 FormData。原生 reset 恢复挂载初始值并重置引擎历史。取消 reset 保留当前文档。

## 公式

`equation` 接受 `formula` LaTeX 字符串，`display` 控制行间/行内，`label` 可作说明。KaTeX 固定 `trust:false`、`strict:'error'`、`throwOnError:false`、展开和尺寸上限。HTML、URL、外部资源命令预先拒绝；语法错误通过可访问 alert 和安全转义源码呈现。

固定输出原生 **MathML**，浏览器数学字体自行排版。无需 KaTeX visual CSS，不内联也不请求 KaTeX 字体，不新增 dist 资产；现有包白名单 `dist` 无需扩展。面向支持 MathML Core 的现代 Chromium、Firefox、Safari；不同系统数学字体排版可能不同。没有 HTML 公式输出或任意宏注入接口。公式源码变化立即替换语义内容，再以共享动效 token 做视觉提示；reduced motion 跳过提示。

## 构建与验证

依赖为 Tiptap 3、CodeMirror 6、KaTeX、js-xss（包名 xss）；全部进入现有核心单 bundle，不需宿主安装额外编辑引擎或加载 CDN。库构建对 Lezer 可选 Node 调试变量做静态替换，保持 standalone 无 process.env。

专项浏览器配置：`playwright.content-expansion.config.js`，独立端口 5220、workers 2、产物 `test-results/content-expansion`。桌面与移动 Chromium 覆盖实际编辑、键盘选区、格式、安全链接、粘贴、IME、查找、撤销重做、只读禁用、原生 form/reset、图表模式/图例/缺值负值、热力网格、公式安全、动画中间帧和 reduced motion、打包后 light DOM 元素。SSR 专项：`tests/content-expansion.ssr.test.js`。截图在 `shots/content-expansion`。

执行：`pnpm build`、`pnpm build:lib`、`pnpm verify:lib`、`node --test tests/content-expansion.ssr.test.js`、`pnpm exec playwright test --config playwright.content-expansion.config.js`。
