# Moki Market Research Card

面向中文美股用户的静态研究卡原型。项目将行情、新闻、财报线索、产业链变化和市场波动整理为可读、可追踪、可复盘的研究报告视图。

本项目只提供研究辅助和教育参考，不构成投资建议。

## 当前功能

- 首页产品入口
- 研究卡样例库
- 动态研究卡详情页
- ORCL、NVDA、TSLA 三张静态样例卡
- 统一 `Executive Investment View` 用户入口
- `ResearchCard` legacy 兼容类型和模板
- `ResearchReport` schema foundation、Evidence Reference Layer、Research Source Ingestion、Buy-Side Report Generator、Technical Dashboard Mock、兼容 adapter 和静态报告数据入口
- 桌面端和移动端响应式布局
- 黑白灰、哑光金与红棕风险色设计系统

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React

## 本地启动

```powershell
cd "C:\Users\老大哥柚子\Desktop\moki-research-card"
npm.cmd install
npm.cmd run dev
```

打开：

- 首页：<http://localhost:3000>
- 样例库：<http://localhost:3000/research-cards>
- ORCL 详情：<http://localhost:3000/research-card/orcl-ai-cloud>

如果 PowerShell 允许执行 `npm.ps1`，也可以使用 `npm install` 和 `npm run dev`。

## 验证

```powershell
npm.cmd run lint
npm.cmd run build
```

## 路由

| 路由 | 用途 |
| --- | --- |
| `/` | 首页 |
| `/generate` | Executive Investment View 生成入口 |
| `/research-cards` | 研究卡样例库 |
| `/research-card` | 兼容入口 |
| `/research-card/[slug]` | 动态研究卡详情 |

## 目录

```text
src/
  app/                  路由、页面、metadata 和全局样式
  components/           研究卡业务组件
  components/research-report/ ResearchReport 展示组件
  components/ui/        通用基础组件
  data/                 静态研究卡与 ResearchReport 数据入口
  lib/research-report/  ResearchCard -> ResearchReport adapter、source ingestion、evidence layer、buy-side generator 与 technical dashboard mock
  types/                ResearchCard、ResearchReport 与证据领域类型
docs/
  product.md
  research-card-spec.md
  style-guide.md
  v0.4.0-research-report-schema-foundation.md
  v0.4.1-evidence-reference-layer.md
  v0.4.2-research-source-ingestion.md
  v0.4.3-buy-side-report-generator.md
  v0.4.4-technical-dashboard-mock.md
  claude-code-handoff.md
  Moki-Market-Design-UI-Spec-v1.0.pdf
```

## 新增研究卡

1. 读取 `src/types/research-card.ts`。
2. 在 `src/data` 中创建符合 `ResearchCard` 类型的数据。
3. 将数据加入 `src/data/researchCards.ts` 的 `researchCards` 数组。
4. 不创建专属页面或专属组件。
5. 运行 lint 和 build。

新增数据后，样例库和 `research-card/[slug]` 静态路由会自动包含该研究卡。`src/data/researchReports.ts` 会通过兼容 adapter 生成对应的 `ResearchReport` 入口。

## 设计系统

完整规范：

- [`docs/Moki-Market-Design-UI-Spec-v1.0.pdf`](docs/Moki-Market-Design-UI-Spec-v1.0.pdf)
- [`docs/style-guide.md`](docs/style-guide.md)

设计变量位于 `src/app/globals.css`。品牌、状态和风险颜色应使用语义变量，不要在组件里新增近似色。

## Claude Code

项目级指令位于 [`CLAUDE.md`](CLAUDE.md)，Claude Code 接手步骤和首次提示词见：

- [`docs/claude-code-handoff.md`](docs/claude-code-handoff.md)

进入项目目录后运行：

```powershell
claude
```

Claude Code 会自动读取项目根目录的 `CLAUDE.md`。
