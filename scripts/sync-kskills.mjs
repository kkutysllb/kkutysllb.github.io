#!/usr/bin/env node
// scripts/sync-kskills.mjs
// 同步 KSkills 仓库的技能元数据 → data/kskills.json
//
// 数据源：GitHub Trees API（递归列出仓库所有文件）
// 提取：每个技能目录顶层的 SKILL.md，解析 frontmatter 统计分类 + 标签
//
// 用法：
//   node scripts/sync-kskills.mjs                     # 默认 kkutysllb/KSkills@main
//   GITHUB_REPOSITORY=kkutysllb/KSkills node scripts/sync-kskills.mjs
//   GITHUB_REF=dev GITHUB_TOKEN=ghp_xxx node scripts/sync-kskills.mjs
//
// 输出：./data/kskills.json（覆盖式）

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// KSkills 仓库（硬编码，不跟随 GITHUB_REPOSITORY 环境变量，避免被 Actions 触发仓库名覆盖）
const REPO = process.env.KSKILLS_REPO || 'kkutysllb/KSkills';
const REF = process.env.KSKILLS_REF || process.env.GITHUB_SHA || 'main';
const TOKEN = process.env.KSKILLS_TOKEN || process.env.GITHUB_TOKEN || process.env.SYNC_TOKEN || '';

// 类别元数据（label / color / icon）
const CATEGORIES = {
  coding:    { label: '软件工程',  color: '#FFB300', icon: '🖥' },
  stock:     { label: '金融量化',  color: '#E53935', icon: '📈' },
  media:     { label: '内容创作',  color: '#7E57C2', icon: '🎨' },
  research:  { label: '深度研究',  color: '#26A69A', icon: '🔬' },
  common:    { label: '跨领域公共', color: '#5C6BC0', icon: '🧰' },
  office:    { label: '办公文档',  color: '#42A5F5', icon: '📄' },
};

/** 轻量 YAML frontmatter 解析（只支持 key: value / nested block using 2-space 缩进） */
function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return {};
  const end = raw.indexOf('\n---', 3);
  if (end < 0) return {};
  const fm = raw.slice(3, end).trim();
  const out = {};
  let stack = [out];
  let indent = -1;
  let cur = out;
  fm.split('\n').forEach(line => {
    if (!line.trim()) return;
    const m = line.match(/^(\s*)([^:]+):\s*(.*)$/);
    if (!m) return;
    const [, sp, key, valRaw] = m;
    const depth = sp.length;
    while (stack.length - 1 > Math.floor(depth / 2)) stack.pop();
    cur = stack[stack.length - 1];
    const val = valRaw.trim();
    if (val === '' || val === '|' || val === '>') {
      const child = {};
      cur[key] = child;
      stack.push(child);
      indent = depth;
    } else if (val.startsWith('[') && val.endsWith(']')) {
      cur[key] = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      cur[key] = val.replace(/^["']|["']$/g, '');
    }
  });
  return out;
}

/** 调 GitHub API（带可选 token） */
async function gh(path) {
  const url = `https://api.github.com${path}`;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'krelease-web-sync-kskills',
  };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${path}`);
  return res.json();
}

/** 主流程 */
async function main() {
  console.log(`→ Syncing ${REPO}@${REF}`);

  // 1. 拉取整个仓库的 trees（recursive=1）
  const tree = await gh(`/repos/${REPO}/git/trees/${REF}?recursive=1`);
  if (tree.truncated) {
    console.warn('  ! tree truncated (repo > 100k files); frontmatter 解析会受影响');
  }

  // 2. 收集所有 SKILL.md 路径
  const skillPaths = tree.tree
    .filter(n => n.type === 'blob' && /\/SKILL\.md$/.test(n.path))
    .map(n => n.path);
  console.log(`  ✓ found ${skillPaths.length} SKILL.md files`);

  // 3. 按顶层目录分类（coding/foo/SKILL.md → coding）
  const categories = {};
  const skills = [];
  for (const path of skillPaths) {
    const top = path.split('/')[0];
    const parts = path.split('/');
    const skillName = parts.length >= 3 ? parts[1] : parts[0];
    if (!CATEGORIES[top]) continue; // 忽略 scripts/ 等非技能目录
    categories[top] = (categories[top] || { count: 0, skill_md: 0, skills: new Set() });
    categories[top].count = (categories[top].count || 0) + 1;
    categories[top].skill_md = (categories[top].skill_md || 0) + 1;
    categories[top].skills.add(skillName);
  }

  // 4. 抽样解析少量 SKILL.md 的 frontmatter（限速保护：stock + common 必 rich profile）
  const samples = skillPaths
    .filter(p => /^(stock|common)\//.test(p))
    .slice(0, 20);
  for (const path of samples) {
    try {
      const blob = await gh(`/repos/${REPO}/contents/${path}?ref=${REF}`);
      const raw = Buffer.from(blob.content, 'base64').toString('utf8');
      const fm = parseFrontmatter(raw);
      if (fm.name) {
        skills.push({
          name: fm.name,
          category: path.split('/')[0],
          version: fm.version || null,
          author: fm.author || null,
          license: fm.license || null,
          tags: fm.tags || [],
        });
      }
    } catch (e) {
      console.warn(`  ! skip ${path}: ${e.message}`);
    }
  }

  // 5. 拼装输出
  const out = {
    synced_at: new Date().toISOString(),
    source: `https://github.com/${REPO}`,
    ref: REF,
    totals: {
      skill_md: skillPaths.length,
      skill_packs: Object.values(categories).reduce((s, c) => s + (c.skills?.size || 0), 0),
    },
    categories: Object.entries(categories).map(([id, c]) => ({
      id,
      ...CATEGORIES[id],
      pack_count: c.skills?.size || 0,
      skill_md_count: c.skill_md,
    })),
    skills,
  };

  // 6. 写文件
  const outPath = join(ROOT, 'data', 'kskills.json');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(`  ✓ wrote ${outPath}`);
  console.log(`     totals: ${out.totals.skill_packs} packs / ${out.totals.skill_md} SKILL.md`);
  console.log(`     categories: ${out.categories.map(c => `${c.id}(${c.pack_count})`).join(', ')}`);
}

main().catch(e => {
  console.error('✗ sync failed:', e.message);
  process.exit(1);
});
