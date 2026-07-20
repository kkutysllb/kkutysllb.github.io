---
kind: external_dependency
name: GitHub Actions 发布同步工作流
slug: github-actions
category: external_dependency
category_hints:
    - framework_behavior
    - auth_protocol
scope:
    - '**'
---

### GitHub Actions
- 角色：定时（每6小时）或手动触发，从 `repos.txt` 列出的仓库拉取最新 Release 信息并写入 `data/releases/*.json`，供前端静态页面消费。
- 集成点：`.github/workflows/sync-releases.yml` 通过 `gh api repos/${repo}/releases/latest` 调用 GitHub REST API；默认使用仓库内置的 `GITHUB_TOKEN`，仅能访问当前仓库。若后续将产品仓库设为 Private，需要创建带 `repo` 权限的 Personal Access Token 存为 Secret（如 `SYNC_TOKEN`），并将 workflow 中的 `GH_TOKEN` 改为引用它。
- 稳定用法要点：
  - `repos.txt` 中每行 `<releases_file> <owner/repo>` 定义一个待同步目标，文件名与 `projects.yml` 中 `channels[].releases_file` 一一对应。
  - 输出 JSON 只保留 tag_name、name、published_at、html_url、assets（含 browser_download_url、size）等字段，其余裁剪掉。
  - 当某仓库无 Release 时保留占位文件 `{"_placeholder":true,"assets":[]}`，不会中断流水线。
- 注意：Release JSON 中的 `html_url` 仍指向 GitHub Releases 页面，如果对应仓库私有化后该链接对外不可访问，需要在渲染层做条件判断隐藏“查看全部历史版本”入口。
- 验证方式：参考官方文档确认 `gh api` 调用及 Secret 注入的正确写法。