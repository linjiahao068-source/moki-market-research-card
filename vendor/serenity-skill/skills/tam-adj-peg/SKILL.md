---
name: tam-adj-peg
description: Evaluate a stock's valuation using TAM-Adj-PEG, adjusting traditional PEG by growth runway and quality. Use when the user provides a ticker or asks whether a growth stock's valuation is cheap, expensive, TAM-supported, runway-supported, quality-adjusted, or suitable as core growth, high-beta growth, turnaround, option-like, or cyclical exposure.
---

# TAM-Adj-PEG

## Core Idea

Traditional PEG asks if current valuation is expensive relative to future EPS growth; TAM-Adj-PEG asks how long growth can last, if TAM is large enough, and if the company can convert TAM growth into durable profits.

## Required Inputs

- Valuation: current/TTM PE, forward PE, traditional PEG
- Growth: 2-3yr expected EPS CAGR, revenue CAGR, TAM CAGR, current revenue/TAM penetration
- Profit quality: gross/EBIT margin, FCF profile, capex intensity, dilution risk
- Business quality: competitive position, pricing power, customer concentration, tech risk, cyclicality, milestones
- Preferred sources: company IR, earnings calls, SEC filings, consensus estimates, industry TAM reports

## Core Formula

```
TAM-Adj-PEG = Forward PE / (EPS CAGR x TAM Runway Factor x Quality Factor)
Adjusted Growth = EPS CAGR x TAM Runway Factor x Quality Factor
```

## TAM Runway Factor

```
TAM Runway Factor = sqrt(Growth Duration / 5)
```

| High-growth duration | Factor |
| ---: | --- |
| 2 years | 0.6 |
| 3 years | 0.75 |
| 5 years | 1.0 |
| 8 years | 1.25 |
| 10 years | 1.4 |
| 15 years | 1.7 |
| 20+ years | 2.0 cap |

## Quality Factor

| Quality Factor | Company Type |
| ---: | --- |
| 0.3-0.5 | Early-stage, loss-making, unproven orders, high dilution |
| 0.5-0.7 | Cyclical, customer-concentrated, high execution risk |
| 0.7-0.9 | High growth but competitive, unstable margins |
| 0.9-1.1 | Normal high-quality growth |
| 1.1-1.3 | Strong moat, pricing power, stickiness |
| 1.3-1.5 | Monopoly-like, platform, ecosystem |
| 1.5+ | Rare super-platform/AI bottleneck; use cautiously |

## Result Interpretation

| TAM-Adj-PEG | Valuation View |
| ---: | --- |
| < 0.5 | Very cheap, verify forecasts |
| 0.5-0.8 | Clearly attractive |
| 0.8-1.2 | Reasonable to slightly cheap |
| 1.2-1.8 | Reasonable to slightly expensive; execution key |
| 1.8-2.5 | Expensive unless super-long runway |
| > 2.5 | Very expensive or inputs distorted |

## Output Format

```text
# TICKER: TAM-Adj-PEG 估值分析

公司：XXX
股票代码：XXX

## 1. 当前估值

- 当前 PE：
- Forward PE：
- 传统 PEG：

## 2. 增长拆解

- 未来 EPS CAGR：
- Revenue CAGR：
- TAM CAGR：
- 当前收入 / TAM：
- 高速增长 runway：

## 3. TAM Runway Factor

- 估计值：
- 原因：

## 4. Quality Factor

- 估计值：
- 加分项：
- 扣分项：

## 5. TAM-Adj-PEG

公式：
TAM-Adj-PEG = Forward PE / (EPS CAGR x TAM Runway Factor x Quality Factor)

计算：
- 修正后增长率：
- TAM-Adj-PEG：

## 6. 结论

- 估值档位：
- 主要上行驱动：
- 主要下行风险：
- 适合的仓位类型：
```
