---
kind: frontend_style
name: 深色极简主题与 CSS 变量设计系统
category: frontend_style
scope:
    - '**'
source_files:
    - assets/style.css
    - index.html
---

## 样式体系概览

该站点采用**单文件 CSS + CSS 自定义属性（CSS Variables）**的轻量级主题方案，整体视觉风格参考 Vercel 首页，以深色模式为主、浅色模式为可选切换。没有引入任何 CSS 框架或构建工具链，所有样式均内联于 `assets/style.css`。

### 1. 主题与配色系统
- 通过 `:root` 定义默认深色主题的所有语义化变量（`--bg`、`--fg`、`--border`、`--accent`、`--radius` 等），并在 `[data-theme="light"]` 下覆盖同一组变量实现浅色模式。
- 使用 `color-scheme: dark/light` 配合 `<meta name="color-scheme">` 让浏览器原生滚动条、表单控件跟随主题。
- 主题切换由 `index.html` 中的内联脚本在页面加载前写入 `documentElement.dataset.theme`，避免闪烁；用户选择持久化到 `localStorage('krelease-theme')`。
- 渐变标题、产品卡片侧边色条（`--accent-bar`）等强调色通过 CSS 变量注入，便于每个产品独立定制。

### 2. 布局与排版约定
- 全局容器 `.container` 固定最大宽度 1100px，左右留白 24px。
- 字体栈优先使用系统字体（PingFang SC / Microsoft YaHei / -apple-system），代码使用 SF Mono / JetBrains Mono。
- 字号层级：Hero 标题 56px → 引擎名 24px → 产品名 18px → 正文 15px → 辅助信息 13/12px，统一行高 1.6。
- 圆角统一使用 `--radius: 12px` 和 `--radius-sm: 6px` 两个等级。

### 3. 组件样式规范
- **导航 `.nav`**：flex 两端对齐，品牌区 + 链接 + 主题切换按钮。
- **引擎卡片 `.engine`**：大卡片承载描述、安装命令、特性网格及子产品列表。
- **产品卡片 `.product`**：带左侧彩色竖条（`--accent-bar`）、悬停边框加深、背景渐变过渡。
- **下载行 `.dl-row`**：Grid 双列（平台信息 + 下载按钮），悬停高亮行背景与边框。
- **按钮 `.btn`**：通用基础样式，`.primary` 变体反色填充。
- **版本标签 `.version-tabs`**：底部边框激活态，点击切换对应 `.version-body` 显示。
- **响应式**：仅一个 `@media (max-width: 640px)` 断点，将多列 Grid 折叠为单列，调整间距与字号。

### 4. 交互与可访问性
- 主题切换按钮提供 `aria-label`、`aria-pressed`、`title` 与 `:focus-visible` 轮廓。
- 复制安装命令使用 Clipboard API，失败时静默降级。
- 所有外部链接统一添加 `target="_blank" rel="noopener"`。

### 5. 开发约束与建议
- 新增颜色应优先复用已有 CSS 变量，不要硬编码十六进制值。
- 新增组件类名遵循 BEM 风格的简单命名（如 `.section-title`、`.install-cmd`），保持扁平结构。
- 不引入新的 CSS 框架或预处理器，保持单文件可维护性。
- 如需扩展更多主题，应在 `[data-theme="xxx"]` 下覆盖同一组变量，而非新增变量名。

**关键文件**
- `assets/style.css` — 全部样式与主题变量
- `index.html` — 主题初始化脚本、DOM 结构与事件绑定