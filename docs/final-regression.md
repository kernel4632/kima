# 最终浏览器与 SSR 回归

本记录对应本地最终整合后的重新验证。保留全部既有改动，不执行 commit/push；5188、5193 和 5225 原服务保持运行。最终浏览器全量使用独占 5222，未复用或关闭父进程。

## 最终结果

| 验证 | 通过 | 失败 | 跳过 | 退出码 | 日志 |
| --- | ---: | ---: | ---: | ---: | --- |
| 浏览器全量，5222，2 workers | 716 | 0 | 0 | 0 | artifacts/final-delivery-browser-rerun.log |
| SSR 全量 | 17 | 0 | 0 | 0 | artifacts/final-delivery-ssr.log |
| 生产构建 | 1 | 0 | 0 | 0 | artifacts/final-delivery-build-latest.log |
| 组件库构建，316 outputs | 1 | 0 | 0 | 0 | artifacts/final-delivery-buildlib.log |
| 组件库产物校验，145 components / 10 checks | 1 | 0 | 0 | 0 | artifacts/final-delivery-verifylib-latest.log |
| 真实 tarball 消费者 | 22 | 0 | 0 | 0 | artifacts/final-delivery-verify-install.log |
| 生产站 145 路由 smoke，5225 | 145 | 0 | 0 | 0 | artifacts/final-delivery-site-production.log |
| 正式站截图，5223 | 5 | 0 | 0 | 0 | artifacts/final-delivery-shots.log |

浏览器全量包含 desktop/mobile 两个项目，共 716 项，耗时约 11.8 分钟；最终 rerun 已包含图片预览快速重开、唯一 active dialog、退场 inert 和背景恢复断言。content 专项重复为 20/20，data 专项重复为 16/16，均为 desktop/mobile 双端、单 worker。未放宽断言、未使用 skip，也未使用配置重试绕过失败。生产构建、组件库构建、产物校验、真实 tarball、145 路由 smoke 和 5 组截图均退出码 0；构建保留 elements 全量包体积 warning，未将 warning 当作失败。

## 修复范围

- src/site/content-examples.vue：图表/代码语言改用 KimaNativeSelect，读写控制改用 KimaCheckbox，公式源码改用 KimaTextField；保留内部真实原生控件，现有 selectOption/check 测试契约仍然可用。
- src/site/form-completion-examples.vue：dynamic-input 插槽中的 key/value 原生 input 改为 KimaTextField，保留动态行的精确 name 和 FormData 提交。
- src/site/foundation-examples.vue：page-header 面包屑改用 KimaLink。
- src/site/shell-examples.vue：masonry/marquee 链接改用 KimaLink，并指向示例自身存在的锚点。
- src/components/rich-text-editor.ce.vue：外部模型更新保存 Tiptap `from/to`，在按钮点击造成失焦时恢复真实 DOM focus/selection，避免组件显示选区与浏览器选区不一致。
- tests/content-expansion.spec.js：恢复外部更新前后的严格 `选区 2–2`，并验证 Selection API 的真实 `#text` 节点 offset `1`，不再只检查 label 存在。
- src/components/image-preview.ce.vue：补全 Teleport 预览的背景 inert、dialog Tab 循环、退场 inactive 标记、快速重开保护和卸载清理，保留既有 kima-popup 动效。
- tests/data-expansion.spec.js：使用唯一 `[role="dialog"]:not([inert])` 定位 active overlay，验证退场 inert/aria-hidden、背景恢复、焦点恢复及 gallery 动态第二张，不使用 `.last` 掩盖重复 active dialog。
- src/components/table.ce.vue：删除父改动引入的本地排序提前返回，恢复列级 sortable 的内置非受控排序，不改写传入行数组。
- tests/components.spec.js、tests/final-enhancement.spec.js：确认本地排序无需宿主回写、源数组不变、受控点击只发意图，宿主提交受控状态才改变排序；保留键控 DOM、列宽及汇总验证。
- tests/final-motion.spec.js：本地排序必须产生真实 FLIP 中间帧，另验证受控排序真实帧，不再由宿主重排行数组代替本地能力。
- src/components/drawer.ce.vue：保留真实 CSS transition completion、取消令牌和现有状态机；在 finished 兑现后让终点得到实际绘制机会，再关闭原生 dialog，避免最后可见帧仍停留在视口内。未按 token 时长猜测关闭计时。补全 descriptionId。
- src/components/color-picker.ce.vue：修正绿色与蓝色最大通道的 HSL 色相公式；HEX 解析不再接受 7 位；不透明 alpha 归一为 6 位；disabled/readonly 阻止内部 HSV 与草稿被交互修改；滑块声明可访问状态、禁用时移出 Tab 顺序；二维区域方向键仅修改对应轴；有效同步清除旧自定义校验错误。
- tests/input-expansion.spec.js：新增 HSL、7 位拒绝、alpha 规范化、单轴键盘和 disabled/readonly 指针键盘不变性回归。
- tests/form-completion.spec.js：修复未等待的异步断言，防止测试提前结束导致会话关闭；加强重置后的有效性、FormData 和后续渲染验证，宿主选择器精确限定为自定义元素。
- tests/*.ssr.test.js：SSR server 同时禁用 HMR/WebSocket；表单补全 SSR 使用每个组件合法的模型类型与值。

## 构建与证据

本轮最终证据对应日志：`artifacts/final-delivery-browser-rerun.log`、`artifacts/final-delivery-ssr.log`、`artifacts/final-delivery-build-latest.log`、`artifacts/final-delivery-buildlib.log`、`artifacts/final-delivery-verifylib-latest.log`、`artifacts/final-delivery-verify-install.log`、`artifacts/final-delivery-site-production.log`、`artifacts/final-delivery-shots.log`；每个命令的显式退出码均为 `0`。首次全量日志也保留。现有大 chunk/全量 elements 包体积提示保留，不屏蔽。

最终浏览器结果位于 `test-results/final-145`，末尾为 `716 passed`，退出码 `0`。真实消费者结果为 22/22，生产站 smoke 为 145/145，截图为 5/5；所有改动仍未 commit/push。

历史专项失败日志仍保留在仓库现有 artifacts 中。本轮在最终全量前已分别完整重复 content/data 专项，并在严格选区与图片预览真实模态修复后重新执行 716/716，而不是只复跑失败项目作为最终验收。
