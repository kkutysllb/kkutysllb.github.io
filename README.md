# kkutysllb Release Web

kkutysllb 的开源作品集与产品下载入口。

## 它展示什么

- **基础引擎**（独立仓库，仅作 SDK/运行时）
  - [QiongQi / 穷奇引擎](https://github.com/kkutysllb/QiongQi)
- **基于 QiongQi 构建的产品**
  - [kk_OClaw](https://github.com/kkutysllb/kk_OClaw) — 桌面端 + Web 端

> KCoder（`kkutysllb/KCoder`）属于内部/规划中项目，主页暂不展示。

## 数据驱动

所有展示内容由 `data/projects.yml` 驱动，新增产品仅需追加一段 YAML，无需改代码。

### 新增一个产品

```yaml
products:
  - id: my-new-app
    name: My New App
    parent: qiongqi              # 挂在哪个引擎下
    tagline: 一句话简介
    repo: kkutysllb/my-new-app
    homepage: https://github.com/kkutysllb/my-new-app
    icon: /assets/my-new-app.svg
    color: "#5B8FF9"
    versions:
      - id: desktop
        label: 桌面端
        channels:
          - type: github_release
            releases_file: my-new-app   # 对应 repos.txt 的 key
            platforms:
              - { name: macOS, file_glob: "*-mac*" }
```

### 新增一个引擎

```yaml
engines:
  - id: my-engine
    name: 新引擎
    ...
```

## Release 自动同步

`.github/workflows/sync-releases.yml` 每 6 小时（或手动）从 GitHub Releases 拉取最新版本与下载链接，写入 `data/releases/*.json`。

要在 `repos.txt` 中加新仓库：

```
qiongqi         kkutysllb/QiongQi
kk-oclaw        kkutysllb/kk_OClaw
my-new-app      kkutysllb/my-new-app
```

## 本地预览

```bash
# 任意静态服务都可以
python3 -m http.server 4173
# 然后访问 http://localhost:4173
```

或使用 Vercel CLI：

```bash
npm i -g vercel
vercel dev
```

## 部署

### 方案 A：Vercel（推荐）

1. 把仓库推到 GitHub（仓库名可以是 `kkutysllb.github.io` 或任意名）。
2. 在 https://vercel.com 用 GitHub 账号授权。
3. Add New Project → 选中此仓库 → Framework 选 "Other" → Deploy。
4. 一分钟内拿到 `xxx.vercel.app` 域名。
5. 在项目设置 → Domains 绑定自定义域名（可选）。

### 方案 B：GitHub Pages（备份）

1. 仓库 Settings → Pages → Source 选 `master` 分支根目录。
2. 访问 `https://kkutysllb.github.io`。

## 目录结构

```
KReleaseWeb/
├── index.html                       # 主页面
├── data/                          # ⚠️ 注意：不能用 _data（GitHub Pages/Jekyll 会隐藏 _ 开头目录）
│   ├── projects.yml                # 项目数据（唯一需要手工维护的文件）
│   └── releases/                   # 自动同步产物（不要手工编辑）
│       ├── qiongqi.json
│       └── kk-oclaw.json
├── assets/
│   ├── style.css                    # 样式
│   ├── qingqi.svg                   # 引擎 logo
│   ├── kk-oclaw.svg                 # 产品 logo
│   ├── avatar.svg                   # 个人头像
│   └── platforms/                   # 平台图标
│       ├── apple.svg
│       ├── windows.svg
│       └── linux.svg
├── projects/                        # 项目详情页（预留）
├── .github/workflows/
│   └── sync-releases.yml            # 同步 release 的工作流
├── repos.txt                        # 同步的仓库列表
├── vercel.json                      # Vercel 配置
├── package.json                     # 项目元数据
└── README.md
```

## 扩展点

- **博客**：在根目录加 `blog/` 子目录，写 Markdown 文章，首页用列表组件加载。
- **i18n**：所有页面和 `projects.yml` 都预留 `_zh` / `_en` 双语字段，加一个语言切换器即可。
- **下载统计**：在 `dl-row` 加一段 `<script>` 调用 Plausible 自定义事件即可。
- **多产品变体**：同一产品可挂多个 version（如 OClaw v1、v2），只需在 versions 数组追加。

## License

MIT