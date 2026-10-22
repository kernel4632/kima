# Tests

文档站测试在 `docs.spec.js`，从源码目录发现所有组件，覆盖预览、搜索、移动导航和刷新直达。
`code-block.spec.js` 验证代码安全展示、多行着色、原始文本复制、失败反馈和窄屏滚动。
四组专项分别为 `input-expansion.spec.js`、`display-expansion.spec.js`、`navigation-expansion.spec.js`、`interaction-expansion.spec.js`，覆盖全部新增组件的键盘、原生插槽、状态同步、表单和清理行为。
`pnpm shots` 拍正式文档站的桌面深浅主题与窄屏效果，输出目录独立于浏览器回归，避免互相清理追踪文件。
`pnpm release:check` 验证真实 tarball 的发布清单和独立消费者，覆盖 Vue、
原生模块与无需构建工具的 HTML，不从当前仓库源码导入组件。

Browser tests import the actual `/src/elements.js` entry through Vite, not a mock or `dist`.
The fixture can also mount a Vue SFC to check Vue consumers and component styles.

Parent agent owns dependencies and package scripts. Before running, add `@playwright/test`
as a dev dependency and install Chromium (`pnpm exec playwright install chromium`).
Then run `pnpm exec playwright test`. No package changes or installs are made by this task.
The timer tests use Playwright's clock API (Playwright 1.45 or newer).

`playwright.config.js` starts its own Vite server on port 5188 with strict port checking.
Use `KIMA_TEST_PORT` to choose a free port. Both desktop and mobile Chromium run the suite.
Failures preserve a trace in `test-results/`; do not commit generated artifacts.

`pnpm test:ssr` runs all `*.ssr.test.js` files, including display rendering, countdown timer isolation and notification cleanup. `pnpm verify:lib` additionally checks the actual packaged exports and code highlighting during SSR.

Table sorting deliberately remains external: the test verifies the sort event, then
applies the caller's sort and updates `sortKey`/`sortDirection`. `items` keeps priority
over `rows`, including `items: []`. Use a unique `rowKey` when data can be reordered.

Select's empty placeholder submits `""` and fails native `required`. Reset restores the
initial value and emits `update:modelValue`, but no user `change`. Numeric values stay
numeric in component events and submit as strings. Object values stay objects in events,
but native HTML submission uses `String(value)` (`[object Object]`); use primitive keys
for native forms. Arrays similarly submit their comma-separated string conversion.
