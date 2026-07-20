---
kind: configuration_system
name: YAML 数据驱动静态站点配置系统
category: configuration_system
scope:
    - '**'
source_files:
    - data/projects.yml
    - index.html
    - vercel.json
    - package.json
---

本仓库采用**纯前端 YAML 数据驱动**的轻量配置方案，没有后端服务、环境变量或运行时配置加载器。所有站点展示与下载入口均由 `data/projects.yml` 声明式描述，浏览器在运行时通过 `js-yaml` 解析并渲染页面。

## 1. 配置来源与分层

- **站点元数据与产品清单**：`data/projects.yml`
  - `profile`：作者头像、中英文简介、GitHub 链接等个人主页信息
  - `engines`：基础引擎列表（如 QiongQi），包含安装命令、特性说明、图标颜色等
  - `products`：派生产品列表，每个产品通过 `parent` 字段挂到某引擎下，支持多版本 (`versions`) 和多渠道 (`channels`)
- **Release 资产清单**：`data/releases/*.json`（oclaw.json、kworks.json、kcoder.json、qiongqi.json）
  - 由外部脚本生成，存放 GitHub Release 的 assets 列表，供前端按 `file_glob` 匹配平台安装包
- **部署配置**：`vercel.json`
  - 设置 cleanUrls、trailingSlash，并为 `/data/releases/*` 添加缓存头，为其他资源添加安全头

## 2. 运行时加载流程

`index.html` 内嵌模块脚本执行顺序：
1. 从 `localStorage` 读取主题偏好（`krelease-theme`），写入 `<html data-theme>`
2. 使用 `fetch('./data/projects.yml')` + `jsyaml.load()` 拉取并解析 YAML
3. 扫描所有产品的 `channels[].releases_file`，去重后并发 `Promise.all` 拉取对应 JSON
4. 将 release 数据聚合为 `releasesMap`，再遍历 engines → products 树渲染 DOM

## 3. 设计约定与扩展规则

- 新增产品只需在 `products` 追加一段；新增版本在产品的 `versions` 数组追加
- 新增引擎在 `engines` 追加，所有前端渲染自动按 `parent` 归类
- `channels.type` 目前支持 `github_release`（按 `file_glob` 正则匹配 asset）和 `repo_preview`（直链预览）
- 平台名称格式约定为 `主名称 (架构/格式)`，便于统一排版拆分显示

## 4. 开发者应遵循的规则

- 修改站点内容只改 `data/projects.yml` 与 `data/releases/*.json`，不要硬编码到 HTML
- 新增产品必须指定 `parent` 指向已有 engine id
- 新增平台时保持 `name` 形如 `macOS (Apple Silicon)` / `Windows` / `Linux (deb)` 的命名约定
- Release JSON 缺失或网络异常时前端会降级为空 assets 列表，不会阻断页面渲染