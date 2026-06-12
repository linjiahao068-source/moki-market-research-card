# Moki Market 静态研究卡网页项目规则

## 项目定位
Moki Market 是中文美股用户的信息焦虑解读器，把 X 舆情、英文新闻、财报线索、AI 产业链变化和市场波动整理成可读、可追踪、可复盘的研究卡。

## 当前阶段目标
只做一个静态研究卡网页案例：
- /research-card 页面
- 一张 ORCL 研究卡
- 静态 mock data
- 响应式布局
- 可截图传播

## 当前阶段不做
- 登录
- 支付
- 数据库
- 表单
- Supabase
- 实时行情
- X API
- 自动爬虫
- AI 自动生成
- Watchlist
- 完整官网

## 研究卡结构
1. 一句话摘要
2. X 舆情面
3. 基本面
4. 政策/事件
5. 技术/交易面
6. 证据链
7. 下一步研究
8. 免责声明

## 合规禁词
禁止出现：
买入、卖出、目标价、仓位、止损、保证收益、稳赚、跟单、喊单、交易信号、胜率、推荐买。

## 推荐表达
使用：
研究线索、风险提醒、观察指标、待核查信息、证据链、复盘任务、情绪状态、基本面验证。

## 代码规则
- 使用 TypeScript
- 使用 Tailwind CSS
- 数据放在 src/data
- 类型放在 src/types
- 组件放在 src/components
- 每次修改后运行 npm run lint 和 npm run build
- 每次修改后用中文总结改了什么

## V0.2.2 核心原则
本阶段不是制作多张人工定制展示卡，而是验证统一 ResearchCard 模板能否承载不同股票。

## 模板复用规则
- 不允许为不同股票创建专属组件。
- 不允许为不同股票创建专属页面。
- 不允许在组件中写死 ticker、公司名、指标名或个股叙事。
- ORCL、NVDA、TSLA 的差异只能存在于数据层。
- 前端组件必须只依赖 ResearchCard 类型渲染。
- 未来 agent 只要输出同样结构的 JSON，就应该可以直接渲染成研究卡。

## 数据层规则
个股差异应放在：
- keyMetrics
- revenueDrivers
- risks
- keyDebates
- events.items
- evidence
- nextSteps

## 禁止写死在组件里的内容
- OCI
- RPO
- Blackwell
- FSD
- 交付量
- 毛利率
- 任何具体 ticker 的专属叙事

## V0.2.2 本阶段新增样例
- ORCL：已存在，作为基本面验证样例
- NVDA：新增，作为高热度舆情与基本面验证样例
- TSLA：新增，作为新闻与情绪波动样例
