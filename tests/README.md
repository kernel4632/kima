# Tests

默认只有一条冒烟，`pnpm test` 总时长控制在 10 秒内。

## 冒烟（`pnpm test`）

[`smoke.spec.js`](smoke.spec.js:1) 验证四件事：入口注册、按钮只发一次真实点击、原生 dialog 能打开并 Escape 关闭、选择器写入一个原生表单值。只加载 `button`、`dialog`、`select` 三个组件，不编译全库。

```powershell
pnpm test
```

## 截图与视觉审查

测试不判断“好不好看”。视觉与交互中间帧用截图看：

```powershell
pnpm shots
node scripts/audit-visual.mjs http://127.0.0.1:5188
node scripts/audit-montage.mjs
```

方法和检查顺序见 [`docs/visual-audit.md`](../docs/visual-audit.md:1)。

## SSR（可选）

`pnpm test:ssr` 保留给发布前检查；它不属于默认冒烟，耗时约 30 秒。
