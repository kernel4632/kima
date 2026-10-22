# 文档站视觉审查

测试证明交互契约成立，不证明"看起来是对的"。这一层专门看真实渲染：演示区有没有被压扁、
控件有没有底色、字段有没有被固有宽度撑出屏幕、弹层打开后有没有跑出可视区。
审查只读运行中的文档站，不改组件。

## 命令

```powershell
# 先启动文档站（默认 5188）
pnpm dev --host 127.0.0.1 --port 5188 --strictPort

# 桌面：逐页截图 + 几何量测，输出 shots/audit
node scripts/audit-visual.mjs http://127.0.0.1:5188

# 手机：390×844，输出 shots/audit-mobile
$env:KIMA_AUDIT_WIDTH = '390'
$env:KIMA_AUDIT_HEIGHT = '844'
node scripts/audit-visual.mjs http://127.0.0.1:5188
Remove-Item Env:KIMA_AUDIT_WIDTH, Env:KIMA_AUDIT_HEIGHT

# 把逐页截图拼成 8 张审阅图集
node scripts/audit-montage.mjs
# 手机图集：$env:KIMA_AUDIT_DIR = 'shots/audit-mobile'
```

`shots/` 已忽略，截图与报告不入库。每页报告在 `report.json`，包含演示区尺寸、横向滚动、
越界元素、零尺寸自定义元素和页面错误。脚本会临时隐藏文档站顶栏，避免粘性定位盖住截图。

## 演示区契约（唯一来源）

布局只写在 [`src/site/gallery.scss`](../src/site/gallery.scss:1)：

- `.kima-gallery__demo` 是列向 flex 舞台，短组件居中，宽组件自己声明 `width: 100%`。
- 演示不再重复页面标题和说明：`header` 由页面标题承担。
- 表单限宽 520，控件跟着表单走；直接放在舞台里的控件限宽 520 并居中。
- 输入类控件需要 `min-width: 0`，否则 `input` 的固有宽度（默认 `size`）会把手机页面撑出横向滚动。
- 分组的示例文件只写“组件怎么用”，不再各自定义 padding、背景、标题和 gap。

## 已修过的真实问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 各分组演示区疏密不一、按钮被拉满整行 | 布局类名只写在 base-examples 的 scoped 样式里，其他分组没有样式 | 抽出全局 gallery 契约，删除各组重复定义 |
| 日期/时间分段输入没有底色，像浮在画布上 | `advanced-field` 同时引 `input-surface` 和 `input-control`，后者把背景重置为透明 | 在 mixin 末尾补回 `layer-2` 和圆角 |
| 日期/时间分段初值不显示 | `watch(modelValue)` 没有 `immediate` | 立即同步初值 |
| 分段占位符被裁成 `YYY` / `MI` | 分段宽度扣掉 20px 内边距后不够 4 个字符 | 分段减小内边距并加宽 |
| 手机表单横向溢出 32px | 输入框固有宽度 + 栅格项 `min-width: auto` | 控件 `min-width: 0`，表单限宽 |
| 渐变文字整块消失 | 全局规则按标签隐藏 `h2`，误伤组件根节点 | 只隐藏演示自己的 `header` |
| 虚拟选择出现两行“请选择” | 占位文案和摘要同时显示 | 摘要只显示已选值，占位用独立提示 |
| 图片预览卸载时报 `reading 'open'` | 原生 `close` 事件晚于 ref 清空 | `handleNativeClose` 增加空值保护 |
| 列表、树、瀑布流、图表缩成一小块 | flex 居中后没有宽度，按内容收缩 | 这些场地型组件补 `width: 100%` |

## 边界

审查在 Chromium 下完成，覆盖桌面 1440×1000 与手机 390×844。不包含 Firefox/WebKit、
人工读屏、真实移动系统日期面板。截图只能证明这些尺寸和平台下的渲染，不能替代其他浏览器验收。
