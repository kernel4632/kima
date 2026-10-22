# 导航、布局与内容组织组

本批新增 14 个组件。公开目录可对照 Element Plus、Naive UI、Ant Design、Mantine、Reka、Nuxt UI、shadcn-vue 的导航/组织能力；视觉隐藏辅助可参考 Mantine VisuallyHidden。只使用现有 Vue、SCSS、Reka 行为底座，无新增依赖。

## 使用方式

Vue 从包入口导入对应的 Kima 组件，并引入库样式。原生 HTML 引入 elements 入口；标签名为下表的 `kima-` 前缀。数组、对象通过 DOM property 赋值，不通过 JSON 字符串 attribute。所有组件支持原生插槽；Vue 另支持下表中的 scoped slot 参数。

组件属性和事件由 scripts/docs.js 自动提取。CE 的 id 保留在宿主，不复制到内部根节点；其他属性转发到内部根节点。表中的“模型”在 Vue 中通过 v-model 控制；CE 交互同时同步公开 property，并派发 CustomEvent，detail 为参数数组，例如 `[true]`。

## API 一览

| 组件 | 属性（默认值） | 事件 | 插槽/内容 |
| --- | --- | --- | --- |
| accordion | modelValue: string/array (`""`), items (`[]`), multiple, disabled, collapsible (`true`), label | update:modelValue, change | panel-{value}，参数 item/index |
| collapsible | open, disabled, label (`展开内容`) | update:open, change | default 正文，trigger 触发文字；不要在 trigger 中再嵌交互控件 |
| breadcrumb | items (`[]`), label, separator (`/`) | — | default 追加内容 |
| link | href, target, rel, disabled, current: boolean/string, underline (`true`) | navigate（原始点击事件） | default 链接内容 |
| stepper | modelValue (`0`), items (`[]`), linear, disabled, orientation (`horizontal`), label | update:modelValue, change | default 追加内容 |
| navigation-menu | modelValue (`""`), items (`[]`), label, orientation (`horizontal`), disabled | update:modelValue, change, navigate（item/event） | default 追加内容 |
| anchor | modelValue (`""`), items (`[]`), target（空为窗口）, offset (`24`), smooth (`true`), disabled, label | update:modelValue, change, navigate（href） | default 追加内容 |
| back-top | target（空为窗口）, threshold (`240`), smooth (`true`), fixed (`true`), disabled, label | click, visibility-change | default 按钮文字 |
| splitter | modelValue (`40`), min (`15`), max (`85`), step (`5`), orientation (`horizontal`), disabled, label | update:modelValue, change, resize-start, resize-end | first/second 两个面板 |
| scroll-area | label, maxHeight (`360`), maxWidth (`100%`), orientation (`vertical`) | scroll（原始事件） | default 完整内容 |
| toolbar | label, orientation (`horizontal`), loop (`true`), disabled | — | default 原生控件或 KimaButton/KimaLink |
| visually-hidden | focusable | — | default 读屏文字；focusable 可放跳转链接 |
| overflow-list | items (`[]`), max (`3`), expanded, disabled, label | update:expanded, change | item-{index}，参数 item/index；default 追加内容 |
| carousel | modelValue (`0`), items (`[]`), loop, disabled, label | update:modelValue, change | slide-{index}，参数 item/index；default 追加内容 |

布尔值默认 false，表中标注 true 的除外。label 均有中文默认可访问名。orientation 支持 horizontal/vertical；scroll-area 另支持 both。尺寸支持数字像素、数字字符串及合法 CSS 长度。splitter 的 modelValue/min/max 为首面板占可分配空间的百分比，排除 48px 可触摸把手；Shift+方向键为双倍步长。

### 项目结构

- accordion：`{ value: string, label, content, disabled? }`，value 应唯一且稳定；无 value 时使用索引字符串。
- breadcrumb：`{ label, href?, disabled? }`，最后一项始终为当前位置，不输出链接。
- navigation-menu：`{ value?, label, href, target?, disabled? }`，模型值为字符串 value，无 value 时使用 href。
- stepper：`{ label, description?, disabled? }`，模型为零起始索引；linear 只允许当前/已完成及紧接的下一步，不代表业务校验已通过。
- anchor：`{ label, href: '#section-id', disabled? }`，target 为滚动元素、CSS 选择器或空；滚动目标应在组件挂载时存在。目标为 KimaScrollArea 宿主时自动解析内部滚动区域。
- overflow-list：字符串或 `{ value?, label }`。溢出定义为超过 max 项，不做宽度测量，也不是 CSS 布局容器。
- carousel：字符串或 `{ value?, title?, content?, label? }`，模型为零起始索引，不提供定时自动播放。

## 无障碍与边界

- Accordion 使用 Reka 列表焦点行为；Collapsible 使用 Reka 单块展开行为。正文保留挂载并通过 hidden 隐藏，避免轻 DOM 原生插槽关闭后丢失。
- Toolbar 为真实子控件管理 tabindex，不吞掉输入框方向键，不把工具栏项目伪装成菜单项。禁用时整个区域 inert。嵌套工具栏由各自管理。
- Anchor 在滚动、视口变化和正文尺寸变化时跟踪当前章节；是真实 href，但容器内定位不改写浏览器历史，不主动转移正文焦点。BackTop 支持窗口或容器滚动。两者在减少动效时即时滚动。
- Splitter 使用 pointer capture，支持鼠标、触控和触控笔；方向键调整、Home/End 到边界，垂直分栏与 RTL 方向一致。
- VisuallyHidden 不是 divider/separator，OverflowList 不是 layout/container；没有为了凑数新增重复别名。
- 内容型组件没有业务意义上的 disabled。隐藏内容不进入键盘顺序，轮播不自动推进。

## 演示和验证

独立演示：`/tests/navigation-fixture.html?component=accordion&theme=dark`。component 接受上述 14 个 slug，theme 支持 light/dark。现有 5188 开发预览可直接访问该入口；没有更改 App.vue 或总目录。

专项命令（PowerShell）：

```powershell
$env:KIMA_TEST_PORT='5203'
pnpm exec playwright test tests/navigation-expansion.spec.js --output test-results/navigation-expansion --workers 2
```

专项同时覆盖桌面与移动 Chromium。截图写入 shots/navigation-expansion，深浅主题各 14 张、桌面与移动共 56 张，不运行默认 shots 清理。构建执行 pnpm build、pnpm build:lib、pnpm verify:lib。

未覆盖：Firefox/WebKit、人工读屏器验收、拖动的真实触控硬件和全库默认回归套件。主站导航整合由宿主负责，本批只提供独立 catalog/examples。
