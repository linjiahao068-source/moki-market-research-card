# Claude Code 交接说明

交接日期：2026-06-13

## 交接目标

让 Claude Code 在保留当前产品架构、研究内容和黑白金 UI 的基础上继续开发，不重新生成一套不兼容的页面。

## 当前已经完成

- 首页 `/`
- 研究卡样例库 `/research-cards`
- 研究卡兼容入口 `/research-card`
- 动态详情 `/research-card/[slug]`
- ORCL、NVDA、TSLA 三张样例卡
- 统一 `ResearchCard` 类型
- 统一详情模板
- 哑光金品牌色和红棕风险色
- 移动端单列优先和文字防溢出
- 设计与 UI 规范 PDF
- Next/Turbopack 项目 root 显式配置

## Claude 必须先阅读

1. `CLAUDE.md`
2. `README.md`
3. `docs/Moki-Market-Design-UI-Spec-v1.0.pdf`
4. `docs/research-card-spec.md`
5. `src/types/research-card.ts`
6. `src/data/researchCards.ts`

涉及 Next.js API 时，还要读取 `node_modules/next/dist/docs/` 中对应文档。

## 当前关键文件

| 文件 | 作用 |
| --- | --- |
| `src/app/globals.css` | 全局颜色、字体、圆角和换行规则 |
| `src/app/page.tsx` | 首页 |
| `src/app/research-cards/page.tsx` | 样例库 |
| `src/components/ResearchCard.tsx` | 统一详情模板 |
| `src/components/ResearchCardPreview.tsx` | 列表预览卡 |
| `src/components/ResearchCardSection.tsx` | 详情章节 |
| `src/components/EvidenceItem.tsx` | 证据链 |
| `src/components/DisclaimerBox.tsx` | 风险与免责声明 |
| `src/types/research-card.ts` | 领域类型 |
| `src/data/researchCards.ts` | 研究卡集合与查询 |

## 不允许破坏的约束

- 不为不同 ticker 创建专属组件。
- 不在组件中写死个股专属文案。
- 不把产品改造成实时行情或交易终端。
- 不使用买入、卖出、目标价、仓位、止损等投资建议语言。
- 不把绿色重新设为品牌主色。
- 不新增与现有变量近似的金色。
- 不使用大面积渐变、发光、大圆角或卡片嵌套。
- 不牺牲移动端文字完整性。
- 不覆盖用户或其他工具留下的未提交修改。

## 开始接手

在 PowerShell 中：

```powershell
cd "C:\Users\老大哥柚子\Desktop\moki-research-card"
git status --short
npm.cmd install
npm.cmd run lint
npm.cmd run build
claude
```

如果依赖已经安装，`npm.cmd install` 可以省略。

## 推荐的首次提示词

进入 Claude Code 后发送：

```text
请先接手并审计这个项目，不要立即重写页面。

1. 阅读 CLAUDE.md、README.md、docs/claude-code-handoff.md。
2. 阅读 docs/Moki-Market-Design-UI-Spec-v1.0.pdf。
3. 检查 git status，保留所有现有未提交修改。
4. 阅读 ResearchCard 类型、数据层和统一模板。
5. 运行 npm.cmd run lint 和 npm.cmd run build。
6. 用中文告诉我当前架构、设计约束、未提交文件和建议的下一步。

在我确认下一项需求前，不要大规模重构。
```

## 后续开发提示词模板

```text
请基于现有统一 ResearchCard 架构实现以下需求：

[在这里描述功能]

要求：
- 遵守 CLAUDE.md 和设计规范 PDF。
- 保留黑白金视觉和红棕风险语义。
- 移动端优先，文字不能溢出。
- 不为 ticker 创建专属组件。
- 完成后运行 lint 和 build。
- 用中文列出修改文件和验证结果。
```

## Git 交接建议

当前开发成果应先形成一个基线提交，再开始下一项功能。提交前先人工检查：

```powershell
git status --short
git diff --check
npm.cmd run lint
npm.cmd run build
```

确认无误后：

```powershell
git add CLAUDE.md README.md next.config.ts src docs
git commit -m "feat: refresh Moki research card UI and handoff docs"
```

不要使用 `git add .`，避免把本机临时文件或不需要的生成物误提交。

## 当前验证状态

在本次交接前：

- ESLint 已通过。
- Next.js 生产构建已通过。
- 设计规范 PDF 已生成并完成结构、字体和章节审计。
- 当前运行环境的本地浏览器访问受策略限制，未完成自动截图回归。

Claude Code 后续进行视觉修改时，应在可访问的浏览器环境中补做桌面与移动端截图检查。
