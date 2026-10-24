# 布局原语与内容组织 / 文本展示组（G29–G31）

> 历史交付记录；已移除入口与当前替代方式见[删减迁移](component-pruning.md)。

本组新增 **11 个公开入口**，目录入口总数由 123 增至 **134**。只补真实能力，不把原生 CSS 包装成同义组件：
`layout` 仍是页面宽度容器，`field` 仍负责单组控件的描述关联；本组补的是栅格/弹性/堆叠、字段与输入的组合、
页头与持久横幅、显式路由恢复、语义排版、行内标记和绝对日历时间。

## 入口与职责

| 入口 | 关键能力 | 明确不做什么 |
| --- | --- | --- |
| `grid` | 1–24 列、响应式 `columns/gap`、`areas` 命名单元插槽 | 不是 Masonry；命名单元按 areas 声明顺序投影，视觉与 Tab 顺序一致 |
| `flex` | `direction/wrap/gap/align/justify`，响应式 token 间距 | 不自动换序，不加背景或边框 |
| `stack` | 纵向默认、可切横向、`gap/align` | 不接管子项高度或滚动 |
| `field-group` | 原生 `fieldset/legend` 分组标题；hint/error 关联组内多个真实控件；`required` 与原生 validity 聚合 | 不画输入框标签；不是 schema/异步校验引擎 |
| `input-group` | `prefix/default/suffix` 复合，默认槽放真实文本控件 | 不制造可见 label，不给控件再叠一层表面 |
| `page-header` | `heading/description` 属性，`breadcrumbs/actions` 插槽，`level` 控制 h1–h6 | 不接管页面容器宽度或路由 |
| `banner` | 文档流内持久横幅，`v-model:open`、`dismiss`、`restore()`；警告/危险使用 alert 语义 | 不是会自动消失的 Toast |
| `error-state` | 路由错误恢复：`retryHandler` 异步重试、`resetKey` 重置、`fallback` 插槽、暴露 `retry()/reset()` | **不是 Error Boundary**，见下节 |
| `typography` | `type=heading/body/caption` 输出原生 h1–h6/p/small，`size/color` 白名单限定 token | 不生成输入标签，不做整页 Typeset |
| `mark` | 原生 `<mark>` 行内语义，slot 文本走 Vue 字面插值 | 不做关键词切分；关键词高亮仍用 `highlight` |
| `time-display` | `Intl.DateTimeFormat` 的 date/time/datetime、locale、timeZone、dateStyle/timeStyle | 不做相对时间（已有 `relative-time`），不创建计时器 |

## 关键边界

### 为什么没有 Error Boundary

Vue 自定义元素每个宿主都挂载在独立的内部 Vue app 中。`onErrorCaptured` 只覆盖**同一 app 内**的后代组件；
挂到宿主上的 light DOM 插槽内容属于宿主应用，路由/异步/事件处理器错误也不会可靠地经过组件捕获链。
因此不能把一个 `<kima-error-boundary>` 宣传成能捕获任意后代错误的边界。本组改为可验证的 `error-state`：

- `retryHandler(attempt)` 的 rejection 留在本页并显示消息，不伪造“已恢复”；
- `resetKey` 变化清空本地失败/尝试状态；重试使用代际令牌，旧请求在 reset 后 resolve/reject 不会污染新路由；
- 无 handler 时仍发出 `retry`，由宿主决定是否重新挂载路由；
- SSR 不调用 handler，不创建浏览器计时器。

### 字段不造输入标签

`field-group` 的 `legend` 是**分组标题**，不是某个输入框的可见标签。输入控件的可访问名仍由
`text-field` 等组件自己的 `label` 属性提供；原生 `<label>` 包住组件的组合方式继续有效。
`field-group` 只做三件事：把 hint/error 关联到组内真实控件、聚合原生 validity、暴露聚合结果。

### 日期/时间的时区语义

- 带时刻的输入（Date、时间戳、带 `T/Z/offset` 的字符串）：按 `timeZone` 格式化。
- 纯日期 `YYYY-MM-DD`、纯时间 `HH:mm[:ss]`：视为日历值/墙上时间，固定按 UTC 格式化，避免宿主时区跨日；
  纯日期的 `<time datetime>` 保持 `YYYY-MM-DD`。
- 非法 locale/timeZone 不抛异常：先去掉时区重试，再退回 `en-GB`，仍失败时输出稳定的 ISO 片段。
- 非法日期/时间返回 `fallback`，不输出伪造的 `datetime`。

### 命名插槽与自定义元素

Vue CE 在首次渲染时没有对应 `<slot>` 出口会消费命名子节点。因此 `input-group` 的前后缀、页头的
breadcrumbs/actions、横幅 action、错误页 fallback 在 CE 下**始终挂载插槽出口**，空内容由 CSS `:empty` 隐藏；
`field-group` 的 legend 和页头标题只接受属性，不提供半可用的同名命名插槽。

## 父级接入

本组未修改 `src/App.vue`、`src/site/catalog.js`、`src/site/examples.vue` 或 `src/main.js`，避免与父级整合冲突。
父级可按现有分组模式接入：

```js
import { foundationCatalog } from './foundation-catalog.js';
import FoundationExamples from './foundation-examples.vue';
```

- 元数据：`src/site/foundation-catalog.js`
- 独立示例：`src/site/foundation-examples.vue`（按 `component` 只挂载当前项）
- 浏览器专项：`playwright.foundation.config.js`，端口 5219，`workers: 2`，输出
  `test-results/foundation-expansion`
- 截图：`shots/foundation-expansion/`，桌面/移动 × 深浅主题，共 44 张
- 测试：`tests/foundation-expansion.spec.js`、`tests/foundation-expansion.ssr.test.js`

公开属性/事件由现有 `scripts/docs.js` 从 `defineProps/defineEmits` 提取；`input-group` 的 `defineProps`
已赋给变量以进入提取结果。所有布局容器在页面内保持透明，不添加不适用区域的背景；排版、标记和时间颜色只引用 token。

## 验证结果

| 命令 | 结果 |
| --- | --- |
| `pnpm build` | 通过 |
| `pnpm build:lib` | 通过（lib / elements / theme） |
| `pnpm verify:lib` | `Verified 134 components...` |
| `pnpm exec playwright test --config playwright.foundation.config.js` | **26/26**（桌面+移动，13 用例/项目） |
| `node --test tests/foundation-expansion.ssr.test.js` | **3/3** |

测试覆盖：字段关联与 required/valid 聚合、输入组前后缀与透明表面、栅格响应列/间距/区域焦点顺序、
Flex/Stack 枚举回退、页头键盘顺序、横幅键盘关闭/restore/减少动效、错误恢复异步失败/resetKey/
旧请求代际隔离、排版 token 与原生标签、Mark XSS 字面量与 slot 结构、Intl 时区/locale 回退、
docs 元数据提取、独立示例双主题截图。未运行父级 134 组件全量浏览器回归，不宣称人工读屏或其他浏览器等价通过。

Context7 按流程查询了 Vue 自定义元素的 `defineCustomElement` 生命周期、原生插槽与独立 app 配置；
CSS 按指示未查询。按用户要求本组**未提交、未推送**，5188/5193 运行中的服务未停止。
