# Moki Market 项目指令

## 项目定位

Moki Market 是面向中文美股用户的研究信息整理工具。它把 X 舆情、英文新闻、财报线索、AI 产业链变化和市场波动整理为可读、可追踪、可复盘的研究卡。

这是研究辅助产品，不是券商、交易终端或投资顾问产品。

## 当前版本状态

当前版本已经具备：

- 首页：`/`
- 研究卡样例库：`/research-cards`
- 研究卡兼容入口：`/research-card`
- 动态研究卡详情：`/research-card/[slug]`
- ORCL、NVDA、TSLA 三张静态样例卡
- 统一的 `ResearchCard` 类型和渲染模板
- 黑白灰为主体、哑光金为品牌强调、红棕为风险语义的 UI 系统
- 响应式桌面和移动端布局

## 开始工作前

1. 阅读本文件和 `README.md`。
2. 涉及 UI 时阅读 `docs/Moki-Market-Design-UI-Spec-v1.0.pdf`。
3. 涉及数据结构时阅读 `src/types/research-card.ts` 和 `docs/research-card-spec.md`。
4. 本项目使用 Next.js 16。修改 Next.js API 前，先阅读 `node_modules/next/dist/docs/` 中对应文档。
5. 先运行 `git status --short`，不要覆盖或回滚现有未提交修改。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React
- 静态 TypeScript 数据

## 架构规则

### 统一模板

- 所有股票必须复用 `src/components/ResearchCard.tsx`。
- 不为不同股票创建专属组件或专属页面。
- 组件只依赖 `ResearchCard` 类型渲染，不写死任何个股叙事。
- 个股差异只能存在于 `src/data` 数据层。
- 新研究卡加入 `researchCards` 后，应自动出现在样例库和静态路由中。

### 目录职责

- `src/app`：路由、页面和 metadata
- `src/components`：业务组件
- `src/components/ui`：通用基础组件
- `src/data`：研究卡静态数据与查询函数
- `src/types`：领域类型
- `docs`：产品、数据、设计和交接文档

### 数据层

个股差异应放在：

- `keyMetrics`
- `revenueDrivers`
- `risks`
- `keyDebates`
- `events.items`
- `technicalContext`
- `evidence`
- `nextSteps`

组件中禁止写死 OCI、RPO、Blackwell、FSD、交付量、毛利率或任何具体 ticker 的专属叙事。

## 设计与 UI 规则

完整规范见 `docs/Moki-Market-Design-UI-Spec-v1.0.pdf`。

### 核心视觉

- 主体：暖白、白色、深墨色和中性灰
- 品牌强调：哑光金
- 风险语义：红棕色
- 主圆角：`8px`
- 小圆角：`6px`
- 胶囊圆角只用于短状态标签
- 不使用大面积金色、橙色渐变、发光效果或高饱和促销视觉

### 颜色实现

优先复用 `src/app/globals.css` 中的语义变量：

- `--brand`
- `--brand-hover`
- `--brand-soft`
- `--brand-soft-strong`
- `--brand-border`
- `--brand-ink`
- `--brand-dot`
- `--risk-soft`
- `--risk-border`
- `--risk-ink`

不要在组件中新增近似金色或近似风险色。需要扩展颜色时，先更新全局变量和设计规范。

### 移动端

- Base 断点优先单列布局。
- 按钮在窄屏可全宽。
- 元信息允许分行，不强制挤在一行。
- 标题、正文、链接和长英文 token 必须自然换行。
- 不得出现横向滚动。
- 不通过缩小字体、负字距、裁切或省略重要内容来解决溢出。
- `lg` 以下隐藏详情页右侧目录。

## 研究卡固定结构

1. 一句话摘要
2. X 舆情面
3. 基本面
4. 政策/事件
5. 技术/交易面
6. 证据链
7. 下一步研究
8. 免责声明

## 内容与合规

禁止出现：

- 买入
- 卖出
- 目标价
- 仓位
- 止损
- 保证收益
- 稳赚
- 跟单
- 喊单
- 交易信号
- 胜率
- 推荐买

推荐使用：

- 研究线索
- 风险提醒
- 观察指标
- 待核查信息
- 证据链
- 复盘任务
- 情绪状态
- 基本面验证

技术和价格信息只能作为市场背景，不能形成操作建议。

## 编码规则

- 使用 TypeScript，保持类型完整。
- 优先复用现有组件和样式模式。
- 图标优先使用 `lucide-react`。
- 使用语义化 HTML 和真实链接/按钮。
- 保持 UTF-8，不破坏中文内容。
- 不做与任务无关的重构。
- 不修改生成目录 `.next`。
- 不提交密钥、账号或本机隐私文件。

## 验证要求

每次有代码修改后运行：

```powershell
npm.cmd run lint
npm.cmd run build
```

如果 PowerShell 允许执行 `npm.ps1`，也可以使用 `npm run lint` 和 `npm run build`。

涉及 UI 时至少检查：

- `320 × 568`
- `375 × 812`
- `768 × 1024`
- `1280 × 720`
- `1440 × 900`

重点检查文字溢出、横向滚动、按钮尺寸、卡片嵌套、风险色语义和移动端密度。

## 回复要求

- 使用中文总结修改。
- 列出主要修改文件。
- 明确说明 lint、build 和视觉检查是否完成。
- 不声称完成未实际执行的检查。
