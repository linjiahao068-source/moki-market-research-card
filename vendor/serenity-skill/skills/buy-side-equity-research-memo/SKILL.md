---
name: buy-side-equity-research-memo
description: Generates source-backed buy-side equity research memos from a ticker, with Serenity framework cross-checks. Use when the user asks for a full research memo, buy-side analysis, investment thesis with sourcing, or structured equity research.
---

# Buy-Side Equity Research Memo

## Core Principle

Generate structured, source-backed buy-side research memos with clear investment views, financial analysis, valuation scenarios, catalysts, risks, and cross-checks against other Serenity frameworks.

Treat outputs as research hypotheses, not investment advice. Always cite sources clearly and verify data before making claims.

## Required Inputs

- Company basics: ticker, company name, business description
- Financials: revenue, EPS, margins, cash flow, balance sheet (historical and guidance)
- Valuation: current price, market cap, multiples (P/E, EV/Sales, EV/EBITDA)
- Industry: TAM, market share, competition, cycle position
- Catalysts: upcoming events, product launches, earnings dates
- Risks: business, execution, valuation, macro risks
- Sources: SEC filings, earnings calls, IR presentations, industry reports

## Optional SEC Data Assist

For U.S.-listed companies, use `edgartools` to fetch filings and financials. See other Serenity skills for setup details.

## Memo Structure

Always use this structure:

```markdown
# [TICKER] 买方研究备忘录

## 投资观点先行

- **结论**：[看好 / 中性 / 谨慎]，核心逻辑一句话
- **情景目标**：[乐观/基准/悲观情景的目标区间，仅用于假设验证]
- **关键辩论**：市场最关注的 2-3 个分歧点
- ** thesis 断点**：什么条件会让假设成立或失效

## 公司业务定位

- **一句话描述**：公司到底做什么，靠什么赚钱
- **商业模式**：收入来源、成本结构、盈利驱动
- **竞争护城河**：定价权、客户粘性、技术壁垒、规模效应

## 行业与需求分析

- **TAM 与渗透率**：市场空间、当前渗透、增长潜力
- **需求驱动**：什么在推动行业需求
- **竞争格局**：主要玩家、市场份额、竞争动态

## 财务分析与验证

- **历史趋势**：过去 3-5 年收入、利润、利润率变化
- **指引分析**：公司指引 vs 市场预期
- **关键指标**：需要跟踪的核心财务和运营指标
- **验证链条**：未来 1-4 季度需要验证的数据点

## 估值分析

- **当前估值**：P/E、EV/Sales、EV/EBITDA 等倍数
- **历史分位**：当前估值在历史中的位置
- **同行对比**：与同行估值比较
- **Serenity 交叉验证**：
  - [ ] TAM-Adj-PEG 检查
  - [ ] 贝叶斯内在增长检查
  - [ ] GF-DMA 健康指数检查

## Bull / Base / Bear 情景

| 情景 | 概率 | 收入增长 | 利润率 | 估值倍数 | 隐含变动 |
| --- | --- | --- | --- | --- | --- |
| Bull | XX% | XX% | XX% | XXx | +XX% |
| Base | XX% | XX% | XX% | XXx | +XX% |
| Bear | XX% | XX% | XX% | XXx | -XX% |

### Bull Case 假设

详细列出乐观情景下的关键假设。

### Base Case 假设

详细列出基准情景下的关键假设。

### Bear Case 假设

详细列出悲观情景下的关键假设。

## 催化剂

列出可能驱动股价的近期催化剂：

1. [催化剂1] - [时间]
2. [催化剂2] - [时间]
3. ...

## 风险因素

### 上行风险

如果超预期可能发生什么。

### 下行风险

核心风险因素及其影响：

1. **业务风险**：[描述]
2. **执行风险**：[描述]
3. **估值风险**：[描述]
4. **宏观/周期风险**：[描述]
5. **流动性风险**：[描述]

## 差异化认知（Variant Perception）

- **市场共识**：市场现在怎么看这家公司
- **我们的差异**：我们与市场共识的不同之处
- **验证条件**：什么数据会证明我们是对的/错的

## 跟踪仪表盘

| 指标 | 当前值 | 警戒阈值（上） | 警戒阈值（下） | 验证频率 |
| --- | --- | --- | --- | --- |
| [指标1] | | | | 季度 |
| [指标2] | | | | 月度 |
| ... | | | | ... |

## 来源清单

- SEC filings: [Form 10-K, Form 10-Q, Form 8-K - dates]
- Earnings call: [date]
- IR presentation: [date]
- Industry report: [source]
- ...

## 免责声明

本研究备忘录仅用于研究分析，不构成任何投资建议。投资有风险，决策需谨慎。请结合权威来源独立验证数据和假设。
```

## Key Rules

1. **投资观点先行**：总是先给结论，再展开分析
2. **结构化情景**：必须有 Bull/Base/Bear 三种情景，带概率
3. **来源可追溯**：所有重要事实和数据都要有来源标注
4. **Serenity 交叉验证**：主动调用其他 Serenity 技能交叉检查
5. **可验证的假设**：所有假设都要有明确的验证条件和时间
6. **无投资建议**：避免"买入"、"卖出"、"目标价"等指令性语言，使用"研究假设"、"情景验证"等表述
7. **差异化认知**：明确说明与市场共识的差异
