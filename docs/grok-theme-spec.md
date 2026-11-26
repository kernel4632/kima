# Grok 官方复刻规格（KIMA-Grok 主题）

> 来源：grok.com 生产环境编译 CSS（cdn.grok.com 五个 chunk，981KB）逐 token 提取。
> 本文件是唯一事实来源。子智能体不许发明数值，一切以本表为准。
> 目标：KIMA 全库组件的视觉与 Grok 官方逐像素对齐；行为层保持 KIMA 现有（Reka + Motion + Hugeicons）。

## 一、颜色（深色主题，默认）

| KIMA token | Grok 官方值 | 说明 |
|---|---|---|
| `--kima-color-surface` | `#1E1D1D` | chrome：页面背景、侧栏 |
| `--kima-color-surface-container-lowest` | `#191919` | elevated：菜单/弹层的抬升底 |
| `--kima-color-surface-container` | `#1E1D1D` | 同 surface |
| `--kima-color-surface-container-high` | `#282726` | pane：卡片、抽起面 |
| `--kima-color-popup` | `#191919` | 菜单/下拉用抬升底 |
| `--kima-color-popup-large` | `#282726` | 模态/抽屉用 pane |
| `--kima-color-on-surface` | `#E6E5E3` | base：主文字兼主按钮底 |
| `--kima-color-on-primary` | `#1E1D1D` | 主按钮上的字 |
| `--kima-color-primary` | `#E6E5E3` | 主按钮=文字色（Grok 不用蓝做主按钮）|
|| hover `#F8F8F7` / active `#D4D3CF` | 主按钮悬停/按下 |
| `--kima-color-on-surface-variant` | base 64.7% 透明 | 次要文字 |
| `--kima-color-outline` | `#5F5E59` | 强边线、输入框描边 |
| `--kima-color-outline-variant` | `#383836` | 卡片分隔边线 |
| 边线三级 | tertiary `rgba(255,255,255,0.06)` | 发丝线 |
| `--kima-color-accent`（新增） | `#1084FE` | 链接/选中/焦点环专用蓝；hover `#4B9CFF`、active `#0076E8` |
| 焦点环 | accent 80-90% alpha，2px | |
| `--kima-color-error` | `#FF263C` | 危险 |
| `--kima-color-success` | `#00C972` | 成功（深色档）|
| `--kima-color-warning` | `#FF9800` | 警告（深色档）|
| Scrim | `rgba(5,5,5,0.5)` | 模态遮罩 |

**洗色（wash）规则**：悬停/次级填充全部是 base 与 wash 色的 color-mix：
- 深色主题 wash = `#FFFFFF`；悬停 5-6%、次级填充 8%、按下 10-12%、激活 14-16%
- 悬停层写法：`color-mix(in srgb, var(--kima-color-on-surface) 5%, transparent)`

## 二、颜色（浅色主题）

| KIMA token | 值 |
|---|---|
| surface / chrome | `#F9F8F7` |
| popup / elevated | `#FFFFFF` |
| surface-container-high / pane | `#FEFEFC` |
| on-surface / base | `#2C2C2B` |
| primary hover / active | `#40403E` / `#1B1B1B` |
| outline | `#D4D3CF` |
| outline-variant | `#E6E5E3` |
| 边线三级 | `#F0EFED` |
| success / warning | `#05A95F` / `#D77F02` |
| accent / danger 不变 | |

浅色 wash = `#2B1C00`（暖棕），同样 5-16% 梯度。
**深浅切换继续用 light-dark()，不用 JS。**

## 三、字体

```css
--kima-font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
```
- Universal Sans 是 xAI 商业授权字体，官方免费替代 = **Inter 可变字体**（系统回退不变）
- 字号七档（官方）：display 28 / title-medium 20 / title-small 17 / body 15 / chrome 14 / section-headline 13 / hint 12
- 字重三档：**425 / 525 / 650**（Inter 可变字体取整到 400/500/600 渲染，写在 token 里用 425/525/650）
- 代码/数字：`"IBM Plex Mono", ui-monospace, monospace`，0.9em

## 四、圆角（官方刻度，全库换）

| KIMA 现名 | Grok 值 |
|---|---|
| radius-xs | 4px |
| radius-s (6px) | **6px**（sm 不变）|
| radius-m (12px) | **8px**（md）|
| 控件默认 | **10px**（radius-control，按钮/输入框用这个）|
| radius-l (16px) | **12px**（lg）|
| 面板 | **16px**（radius-panel）|
| 岛屿 | **22px**（radius-island，composer/大弹层）|
| 全圆 | 999px（芯片/药丸保持）|
| 卡片 | **18px**（radius-card）|
| 模态 | **20px**（radius-overlay）|
| 提示 | **14px**（radius-alert，notification/alert 用）|

## 五、间距（官方刻度）

2/3/4/6/8/10/12/14/16/20/24。现有 KIMA 的 4 倍数体系向这张表对齐（4→4、8→8、12→12、16→16、20→20、24→24；新增 6、10、14 中间档）。

## 六、控件高度（触摸档，保持 KIMA 触摸规矩）

Grok 官方档 xs 20 / sm 24 / md 28 / lg 32 / xl 36 / 2xl 44。
**KIMA 规则**：视觉可小于 44，但命中 ≥44。组件视觉档取 Grok 的 md-lg（28-32）为默认小档、xl 36 为中档、**2xl 44 为默认档**（触摸要求，见 AGENTS.md）。列表行高 40（官方 row-height）。

## 七、阴影（深色主题，逐字官方值）

| Token | 值 |
|---|---|
| raised | `0 2px 8px rgba(0,0,0,0.18)` |
| composer | `0 2px 6px rgba(0,0,0,0.12), 0 8px 12px rgba(0,0,0,0.10)` |
| menu | `0 2px 6px rgba(0,0,0,0.30), 0 8px 12px rgba(0,0,0,0.25)` |
| overlay | `0 4px 16px rgba(0,0,0,0.40), 0 1px 3px rgba(0,0,0,0.30)` |
| modal | `0 12px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)` |
| outline-diffuse | `0 0 0 1px rgba(255,255,255,0.09), 0 12px 32px rgba(0,0,0,0.25)` |

浅色主题阴影用暖色调（`#0F0D0A` 5-13%、`#462500` 3-8%），不用纯黑。

## 八、动效（官方 token，喂给 Motion 和 CSS 过渡）

| Token | 值 |
|---|---|
| duration-fast | 120ms |
| duration-base | 180ms |
| duration-morph / pane | 200ms |
| duration-plate | 260ms |
| duration-slow | 320ms |
| duration-spring | 400ms |
| ease-standard | `cubic-bezier(.2,0,0,1)` |
| ease-decelerate | `cubic-bezier(0,0,0,1)` |
| ease-accelerate | `cubic-bezier(.3,0,1,1)` |
| ease-spring | `cubic-bezier(.22,1,.36,1)` |

Motion 弹簧参数换算基准：`stiffness 500, damping 30`（现值）→ 改用官方 ease-spring 曲线的时长（200ms morph / 400ms spring）配 Motion `type: spring, stiffness 400, damping 32` 近似官方手感。

## 九、玻璃效果（官方 composer/侧栏毛玻璃）

- filter: `blur(36px) saturate(160%)`（深色）/ `blur(36px) saturate(180%)`（浅色）
- 玻璃底：pane 色 74-76% alpha
- 玻璃边：`inset 0 0 0 0.5px rgba(0,0,0,0.1), inset 0 0 0 0.5px rgba(255,255,255,0.36), inset 0 0.5px 0 rgba(255,255,255,0.44)`

## 十、组件对齐要点（逐个组件改样式时的核对单）

- **按钮**：默认 44 高（触摸档）、radius-control 10px、primary=base 色（非蓝）、次级=wash 8%、ghost 透明 hover wash 5%；过渡 120-180ms ease-standard
- **输入框**：36-44px 高、10px 圆角、1px outline 边、聚焦 accent 环；无标签（KIMA 现规不变）
- **菜单/下拉**：elevated 底（#191919 深）、12px 圆角、menu 阴影、项 32-36px 高 + 14px 字
- **模态**：pane 底、20px 圆角、modal 阴影、scrim rgba(5,5,5,0.5)
- **抽屉**：pane 底、16-22px 圆角
- **通知**：14px 圆角（radius-alert）
- **卡片**：18px 圆角（radius-card）、pane 底或透明、outline-variant 边
- **Switch**：已对齐（保持）
- **代码块**：12px 圆角、更深底、语言标签头 + 复制按钮、IBM Plex Mono 0.9em
- **图标**：Hugeicons 16-22px、细线 1.5px、text-secondary 色（不换图标库）
- **选中态**：accent 14% 底 + accent 文字（不用 primary-container 蓝调那套了）
- **hover 规则**：一律 wash 5-6% 叠底，禁止亮化

## 十一、禁止项

- 不引入 Tailwind
- 不换图标库（Hugeicons）/动效库（Motion）/行为库（Reka）
- 不用 JS 切深浅（light-dark() + color-scheme）
- 阴影不用纯黑以外的冷色（浅色主题要暖调）
- 焦点环永远 accent 蓝 2px，不用 base 色
