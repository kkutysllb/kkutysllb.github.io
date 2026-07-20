---
kind: external_dependency
name: Vercel 部署配置
slug: vercel
category: external_dependency
category_hints:
    - client_constraint
scope:
    - '**'
---

### Vercel
- 角色：推荐的前端静态站点托管平台，支持 GitHub 仓库一键部署，提供自定义域名绑定。
- 集成点：根目录 `vercel.json` 声明了响应头策略——对 `/data/releases/*` 设置 `Cache-Control: public, max-age=3600, must-revalidate`，并对所有资源附加 `X-Content-Type-Options: nosniff` 和 `Referrer-Policy: strict-origin-when-cross-origin`。
- 稳定约束：框架选择 "Other"（纯静态站点），无需 Node.js 构建步骤；部署产物即本仓库内容。