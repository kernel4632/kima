# 动效审查 Part B：排序第 29 到第 56 项

## 范围

按 PowerShell 命令 `Get-ChildItem src/components/*.ce.vue | Sort-Object Name` 的结果，本批范围为第 29 到第 56 项，包含 28 个文件。第 30 项 [`drawer.ce.vue`](../src/components/drawer.ce.vue) 按父任务明确跳过，因此本次实际审查并修改 27 个组件。未修改共享文件、测试文件、业务组件，也未停止 5188/5193 服务。

本次判定依据是逐个全文阅读模板、脚本和样式，并结合真实交互用例、中间帧 DOM 检查、构建和 SSR 验证；不是依据是否出现 `transition` 关键词判定通过。

## 逐项记录

### 29. [`divider.ce.vue`](../src/components/divider.ce.vue)

- 交互：纯语义分割线，水平/垂直方向、插槽标签和原生 CE 插槽。
- 已有动效：无。
- 实修：无。保持静态语义组件，不引入进入动画。
- 静态不适用：分割线没有可操作状态，也没有增删生命周期。
- 验证风险：未做视觉截图；风险仅限宿主对动态尺寸变化时的布局过渡需求。

### 30. [`drawer.ce.vue`](../src/components/drawer.ce.vue)

- 交互：bottom/right/left 原生 modal dialog、拖拽、吸附点和焦点管理。
- 已有动效：父任务已经落地完整抽屉动效。
- 实修：跳过，未读取后修改本文件。
- 静态不适用：不适用。
- 验证风险：本批没有重复验证抽屉，沿用父任务现有验证结果。

### 31. [`empty-state.ce.vue`](../src/components/empty-state.ce.vue)

- 交互：静态空状态，支持标题、说明、图标和 action 插槽。
- 已有动效：无。
- 实修：无。action 内部交互由实际按钮组件负责。
- 静态不适用：空状态本身没有显示/隐藏状态机；强行给整块空状态加动画会影响页面状态切换布局。
- 验证风险：未做动态替换截图；保留静态呈现是有意设计。

### 32. [`field.ce.vue`](../src/components/field.ce.vue)

- 交互：把 hint/error 关联到真实表单控件，动态维护 `aria-describedby` 和 `aria-invalid`。
- 已有动效：原先提示节点直接 `v-if` 销毁，没有退场过渡。
- 实修：引入 [`collapseTransition()`](../src/utils/motion.js:85)，提示 wrapper 使用 `v-show`，退出期间立即设置 `inert`/`aria-hidden`；保留最后一条消息直到 collapse 完成；消息文本和错误/提示角色使用 `kima-content` 做替换过渡。
- 静态不适用：字段容器本身不做整体入场，避免表单布局跳动。
- 验证风险：浏览器对 `inert` 的无障碍树刷新时机存在差异；Playwright Chromium 已验证描述文本和错误状态。

### 33. [`file-upload.ce.vue`](../src/components/file-upload.ce.vue)

- 交互：文件选择、拖放、accept/大小/数量校验、列表删除、原生 FileList 同步。
- 已有动效：拖放 active 状态只有颜色切换；文件列表原先直接 `v-if`/索引 key。
- 实修：列表外层使用 [`collapseTransition()`](../src/utils/motion.js:85)，列表项使用 `TransitionGroup`/`kima-list`；退出内容立即 inert/aria-hidden；使用稳定的 File 对象标识和重复文件 occurrence，避免删除后复用错误 DOM；删除按钮改用当前索引；拖放表面补 `kima-motion-colors`。
- 静态不适用：原生文件选择器由浏览器负责，组件不能控制其内部动画。
- 验证风险：`DataTransfer` 构造和 FileList 赋值在不同浏览器的文件权限策略可能不同；Chromium 文件选择、拖放和删除已通过。

### 34. [`highlight.ce.vue`](../src/components/highlight.ce.vue)

- 交互：纯文本关键词高亮，支持大小写和正则字符安全处理。
- 已有动效：无。
- 实修：无。高亮文本变化不做逐字动画，避免阅读内容闪烁。
- 静态不适用：纯展示组件，没有交互状态或独立退场节点。
- 验证风险：超长文本的正则和重排性能仍取决于宿主输入规模。

### 35. [`hover-card.ce.vue`](../src/components/hover-card.ce.vue)

- 交互：延时打开/关闭、鼠标保持、键盘焦点、触屏点击、Escape 关闭。
- 已有动效：使用全库 `kima-popup`，原先没有 presence hook。
- 实修：在 `Transition` 绑定 [`presenceTransition`](../src/utils/motion.js:22)，确保 popup 出场前激活、退场前立即 inert/aria-hidden；保持 Reka 定位包装层在退场完成前存在。
- 静态不适用：触发器本身的按下反馈由内部按钮组件负责。
- 验证风险：Reka popper 包装层的实际 DOM 结构属于第三方底座；已用中间帧探针确认包装层隔离内部内容。

### 36. [`icon-button.ce.vue`](../src/components/icon-button.ce.vue)

- 交互：原生图标按钮、disabled/loading、焦点环、涟漪和按下回弹。
- 已有动效：loading 时图标直接替换为 spinner，spinner 持续旋转。
- 实修：图标和 spinner 放入稳定的 visual 栅格，用 `kima-fade` 交叉切换，避免按钮尺寸和布局跳变；保留原有状态层、焦点环、涟漪和 press；reduced-motion 由全局规则缩短受控动效。
- 静态不适用：图标本身不增加独立 hover 动画。
- 验证风险：持续 spinner 的减弱动效行为依赖全局 reduced-motion 规则；未在 Safari 实机验证。

### 37. [`icon.ce.vue`](../src/components/icon.ce.vue)

- 交互：Hugeicons 静态包装，统一线宽。
- 已有动效：无。
- 实修：无。图标包装层不自行添加动画，避免和父控件状态反馈叠加。
- 静态不适用：没有状态机和可操作节点。
- 验证风险：图标 SVG 的具体绘制由 Hugeicons 版本决定。

### 38. [`image.ce.vue`](../src/components/image.ce.vue)

- 交互：loading/loaded/error 三态，src/srcset/sizes 换源，load/error 事件和 caption 插槽。
- 已有动效：原先 loading/error 占位直接切换，图片通过 `v-show` 隐藏。
- 实修：图片、loading 占位、error 占位分别使用 `kima-fade`；保留图片节点用于加载事件，加载时图片透明但不影响请求；用当前图片节点和 src/srcset/sizes 交叉校验，防止旧请求覆盖新源状态；失败后重新换源可恢复。
- 静态不适用：caption 不做动画，避免图注跟随图片状态抖动。
- 验证风险：浏览器缓存可能让 load 事件同步或异步到达；当前请求匹配已防止旧事件污染，Chromium 慢请求交叉场景已通过。

### 39. [`kbd.ce.vue`](../src/components/kbd.ce.vue)

- 交互：键盘快捷键静态语义展示，支持数组和插槽。
- 已有动效：无。
- 实修：无。
- 静态不适用：不是按钮，不存在进入/退出或按下反馈。
- 验证风险：宿主字体和长快捷键组合可能影响换行，但不属于动效问题。

### 40. [`layout.ce.vue`](../src/components/layout.ce.vue)

- 交互：页面/面板布局、header/content/footer 插槽、尺寸和间距 token。
- 已有动效：无。
- 实修：无。布局容器不持有内容显示状态。
- 静态不适用：为布局根节点加过渡会把内部业务状态变化错误地整体动画化。
- 验证风险：动态改变 max-width/padding 时由 CSS 布局即时重排，未做布局动画需求验证。

### 41. [`link.ce.vue`](../src/components/link.ce.vue)

- 交互：真实 href、disabled 拦截、新窗口安全 rel、current 语义、涟漪。
- 已有动效：导航 mixin 的状态过渡和 ripple。
- 实修：无额外修改。该组件已有完整链接状态处理，且不应对导航目标做出场动画。
- 静态不适用：链接导航后的页面过渡属于宿主路由，不由此组件控制。
- 验证风险：已验证真实链接和 disabled；跨路由框架的页面过渡未覆盖。

### 42. [`list.ce.vue`](../src/components/list.ce.vue)

- 交互：有序/无序列表、items、item/action 插槽、空列表状态。
- 已有动效：原先静态 `v-for`，无稳定离场策略。
- 实修：使用稳定对象/primitive key 和重复项 occurrence；默认 items 使用 `TransitionGroup`/`kima-list`，支持新增、删除和移动；空状态也纳入 keyed group；修正 null item 读取，避免动态列表报错。
- 静态不适用：默认插槽完全由调用者提供真实 `li` 时，组件不接管其内部列表动画。
- 验证风险：用户自定义 slot 若自行复用不稳定 key，组件无法替代其 key 策略。

### 43. [`loading-overlay.ce.vue`](../src/components/loading-overlay.ce.vue)

- 交互：区域 loading、blocking/passive、内容 inert、状态焦点和结束后焦点恢复。
- 已有动效：原先使用 `kima-popup`，但 loading mask 的语义和 popup 过渡不完全匹配。
- 实修：mask 改用 `kima-fade` 并绑定 [`presenceTransition`](../src/utils/motion.js:22)；blocking 期间内容 wrapper 保持 inert；焦点异步恢复前再次确认仍处于 blocking/loading，避免快速反向时抢焦点；退出时保留 mask 到过渡完成。
- 静态不适用：passive overlay 不隔离内容，符合后台刷新语义。
- 验证风险：跨浏览器对 focus 在 inert 节点切换瞬间的处理可能不同；Chromium 已验证原节点和值和焦点恢复。

### 44. [`menu.ce.vue`](../src/components/menu.ce.vue)

- 交互：单选菜单、搜索、方向键/Home/End/Enter/Escape、外部点击和焦点恢复。
- 已有动效：popup 过渡、菜单项颜色过渡；原先列表项没有进入/移除动画，触发器缺少统一反馈。
- 实修：popup 绑定 `presenceTransition`；菜单项使用 `TransitionGroup`/`kima-list` 和稳定 value key；触发器补状态层、焦点环、ripple host 和颜色动效；选中项使用 `primary-container` 与 `on-primary-container` 配对，悬停使用 container-hover；为列表动效补本地样式优先级，避免颜色 transition 覆盖位移 transition。
- 静态不适用：浏览器原生 search 输入本身不做按下缩放。
- 验证风险：items 使用重复 value 时仍需要调用方保证唯一；搜索输入和菜单 roving focus 已通过。

### 45. [`menubar.ce.vue`](../src/components/menubar.ce.vue)

- 交互：多菜单左右导航、菜单内键盘行为、Escape、禁用菜单和 action select。
- 已有动效：Reka `MenubarContent` 外层 `kima-popup`。
- 实修：绑定 `presenceTransition`，使 Reka popper 退场节点保持到过渡结束并立即隔离；未改变菜单焦点模型。
- 静态不适用：菜单项属于操作行，不增加按下缩放，避免重排。
- 验证风险：左右键切换依赖 Reka 的焦点管理和其 DOM 包装层，Chromium 已通过；其他浏览器未逐一验证。

### 46. [`multi-select.ce.vue`](../src/components/multi-select.ce.vue)

- 交互：多选、搜索、chips 删除、清空、键盘游标、原生 hidden select、form reset。
- 已有动效：popup 过渡、交互行颜色过渡；chips 和清空按钮原先直接出现/消失。
- 实修：popup 绑定 `presenceTransition`；选中 chips 使用 `TransitionGroup`/`kima-list`，增加稳定包装节点；清空按钮使用 `kima-content`，避免控制区宽度瞬切；打开面板时清理旧搜索，异步 focus 前确认仍打开且未禁用；继续使用选中容器色与配对文字色。
- 静态不适用：原生 hidden select 本身不可见，不做视觉过渡。
- 验证风险：用户传入重复 value 会破坏 key 唯一性；当前契约已注明 value 唯一，Chromium 键盘/搜索/清空/reset 已通过。

### 47. [`native-select.ce.vue`](../src/components/native-select.ce.vue)

- 交互：原生 select、multiple、原生校验、reset、移动端系统选择界面。
- 已有动效：输入表面 focus-within 和颜色状态过渡；选项菜单由浏览器绘制。
- 实修：补 `kima-motion-colors`，保证表面颜色状态变化有统一过渡；保留原生 select 行为。
- 静态不适用：系统选择菜单和滚轮动画不能由组件控制。
- 验证风险：选项弹出动画、平台主题和滚轮效果依赖 OS/browser；已验证 Chromium 值同步、multiple、disabled option 和 reset。

### 48. [`navigation-menu.ce.vue`](../src/components/navigation-menu.ce.vue)

- 交互：真实导航链接、当前位置、水平/垂直布局和窄屏折行。
- 已有动效：导航 mixin 与 link 内部状态反馈。
- 实修：无额外修改。导航菜单不持有弹层或可折叠内容。
- 静态不适用：当前页切换由真实导航/宿主路由决定，不在组件内做内容动画。
- 验证风险：窄屏布局只做 CSS media query，未做跨浏览器截图比较。

### 49. [`notification.ce.vue`](../src/components/notification.ce.vue)

- 交互：自动关闭、剩余时间暂停、hover/focus 暂停、手动关闭、重开、语义 role/live。
- 已有动效：自带从边缘滑入/淡出；原先使用 `v-show`，退场时内部正文和关闭按钮会先消失。
- 实修：改为 `v-if` 配合 `presenceTransition`，完整通知内容保持到 leave 完成；退场节点立即由通用钩子隔离；修正 reduced-motion 下居中通知 transform；关闭按钮保留状态层、焦点环和颜色过渡；自动计时仍只在 mounted/client 启动。
- 静态不适用：通知正文不做逐字段动画，避免 live region 重复播报。
- 验证风险：通知固定定位和 transform 在不同 viewport/zoom 下仍需视觉回归；SSR、timer、hover/focus、重开和变体测试已通过。SSR 测试期间出现过 Vite HMR 端口 24678 已占用警告，但测试本身通过。

### 50. [`number-field.ce.vue`](../src/components/number-field.ce.vue)

- 交互：原生 spinbutton、步进按钮、min/max/step、空值、reset。
- 已有动效：输入表面 focus-within、按钮内部反馈。
- 实修：补 `kima-motion-colors`，使字段表面状态颜色变化连续；保留原生 stepUp/stepDown 计算和焦点恢复。
- 静态不适用：输入值本身不做数字滚动动画，避免输入和校验语义延迟。
- 验证风险：`step="any"` 的上下限边界由浏览器 number parsing 参与；Chromium 小数、边界和 reset 已通过。

### 51. [`overflow-list.ce.vue`](../src/components/overflow-list.ce.vue)

- 交互：折叠显示前 N 项、展开/收起、原生 item slot、键盘按钮。
- 已有动效：原先使用 `hidden`，项目直接从布局中消失。
- 实修：每项改用 `collapseTransition`、`v-show` 和包装内容；隐藏项在退出期间立即 inert/aria-hidden；样式从 `li[hidden]` 改为内部包装，保证 collapse 高度计算不被直接 display:none 破坏。
- 静态不适用：展开按钮本身沿用按钮组件的反馈，不重复叠加列表动画。
- 验证风险：各项高度包含复杂异步内容时 ResizeObserver 只覆盖共享 collapse wrapper 能观察到的首层；原生 slot、外部状态和键盘回归已通过。

### 52. [`pagination.ce.vue`](../src/components/pagination.ce.vue)

- 交互：页码生成、省略号、上一页/下一页、键盘移动、modelValue 同步、空状态。
- 已有动效：页码颜色/背景过渡；原先页码集合直接替换。
- 实修：页码 group 使用 `kima-list`，退场前立即 inert/aria-hidden 并移除 `aria-current`，避免退场期间出现两个当前页；进入时按 data-page 恢复语义；修正 transition 优先级，确保列表移动不被颜色 transition 覆盖；保留按钮状态层和 ripple host。
- 静态不适用：省略号不是交互节点，不做独立动画。
- 验证风险：快速连续跳页时旧页码可能同时处于离场帧，这是过渡设计预期；DOM 语义和快速切换已通过，未做低刷新率设备实测。

### 53. [`pin-input.ce.vue`](../src/components/pin-input.ce.vue)

- 交互：单输入承载粘贴、IME、自动填充、掩码、完成事件和表单校验。
- 已有动效：输入表面 focus-within，格子显示层。
- 实修：补统一 motion colors 到根表面和 cell，保持 focus/状态颜色连续；不改变单输入承载策略。
- 静态不适用：验证码字符不做逐格入场，避免自动填充和屏幕阅读器内容不同步。
- 验证风险：密码掩码和浏览器自动填充由浏览器控制；IME、粘贴、完成和 reset 已通过。

### 54. [`popconfirm.ce.vue`](../src/components/popconfirm.ce.vue)

- 交互：触发器、确认/取消、危险操作、Escape/外部关闭和焦点管理由内部 popover 负责。
- 已有动效：复用 [`popover.ce.vue`](../src/components/popover.ce.vue) 的 popup transition。
- 实修：本文件无独立动画代码；内部 popover 已绑定 `presenceTransition`，因此确认内容退场保持节点并立即隔离。
- 静态不适用：确认按钮本身不重复叠加面板动画。
- 验证风险：焦点恢复链路依赖内部 popover 和 Reka；确认/取消、安全焦点回归已通过。

### 55. [`popover.ce.vue`](../src/components/popover.ce.vue)

- 交互：非模态锚定弹层、碰撞翻转、焦点进入/返回、Escape、外部点击和 disabled。
- 已有动效：全库 `kima-popup`。
- 实修：绑定 `presenceTransition`；中间帧确认 Reka popper wrapper 保留且带 inert/aria-hidden，内部内容不会在 leave 期间继续可访问；快速关闭再打开恢复活动状态。
- 静态不适用：触发器交给 KIMA button，不在 popup 组件中重复 press。
- 验证风险：定位和焦点行为依赖 Reka/floating-ui；Chromium 已通过碰撞翻转、嵌套 dialog Escape 和中间帧探针。

### 56. [`progress.ce.vue`](../src/components/progress.ce.vue)

- 交互：确定/不确定进度、原生 progress 语义、aria-label。
- 已有动效：不确定状态连续滑动；确定状态原生 progress 宽度更新。
- 实修：不确定 motion 使用 `kima-fade` 进入/退出；webkit/mozilla 进度值补宽度过渡；reduced-motion 下关闭宽度过渡并停止连续动画。
- 静态不适用：进度条不是可操作控件，不增加按下或 ripple。
- 验证风险：原生 progress 的绘制和宽度过渡在 Safari/Firefox 可能与 Chromium 不同；当前构建和 Chromium 相关回归通过。

## 验证记录

- 精确范围核对：PowerShell 排序结果确认第 29 项为 `divider.ce.vue`，第 30 项为 `drawer.ce.vue`，第 56 项为 `progress.ce.vue`。
- 完整相关浏览器回归：60 passed，覆盖桌面和移动项目，包含 image、list、file-upload、field、menu/multi-select、popover/popconfirm/hover-card/menubar、loading-overlay、notification、pagination、overflow-list、native-select 等。
- 最终关键回归：16 passed，覆盖通知、分页、图片恢复、文件选择/删除、字段错误、multi-select、loading-overlay、overflow-list、菜单相关场景。
- 构建：`pnpm build` 通过。
- 组件库产物：`pnpm build:lib` 通过，`pnpm verify:lib` 通过，校验报告显示 82 个组件、Vue CSS、inline element CSS、SSR import 和 standalone browser module 均通过。
- SSR：`pnpm test:ssr` 两项通过。过程中有 Vite HMR 端口 24678 已被占用的 warning，但未造成测试失败。
- 中间帧探针：弹层和 loading mask 在 leave 中仍保留，祖先包装层立即带 `inert`/`aria-hidden`；重新打开后恢复活动；`prefers-reduced-motion: reduce` 下在短延迟后移除。

## 未验证风险

- 未在 Safari、Firefox、实际 iOS/Android WebView 上逐项验证原生 select、progress、FileList、inert 和 fixed popper 的差异。
- 未新增或修改测试文件，逐帧动画检查使用临时 Playwright 探针完成，未纳入仓库测试套件。
- 未生成截图；本次重点是行为和可访问性生命周期，视觉截图仍需后续人工确认。
- `drawer.ce.vue` 按父任务要求跳过，没有在本报告中重复验证。
