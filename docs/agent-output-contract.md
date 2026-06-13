# Moki Market ResearchCard Agent Output Contract

未来用户输入 ticker 后，agent 必须输出符合 ResearchCard Schema 的 JSON，前端才能直接渲染。

本契约的目标是保证：无论用户输入的是 ORCL、NVDA、TSLA，还是未来其他股票，前端都不需要新增专属组件或专属页面，只要接收到同一结构的 ResearchCard JSON，就可以通过统一的 ResearchCard 组件渲染。

## 输出流程

```txt
用户输入 ticker
→ ticker normalization
→ company profile
→ market context
→ sentiment analysis
→ fundamentals extraction
→ evidence collection
→ compliance check
→ ResearchCard JSON
→ 前端 ResearchCard 组件渲染
```

## 明确要求

- agent 输出不能包含买入、卖出、目标价、仓位、止损、收益承诺。
- 所有证据必须有 sourceLabel、sourceType、timestamp、summary、confidence。
- 所有卡片必须标注 isMock 或数据状态。
- nextSteps 必须是研究任务，不是交易动作。
- 个股差异只能进入数据字段，不能要求前端新增专属组件。

## 简化版 JSON 示例

```json
{
  "slug": "orcl-ai-cloud",
  "ticker": "ORCL",
  "companyName": "Oracle Corporation",
  "title": "ORCL｜AI 云收入兑现研究卡",
  "subtitle": "当前更像：基本面验证 + 情绪分歧，而不是单纯情绪噪音",
  "cardType": "single-stock",
  "updatedAt": "2026-06-11",
  "isMock": true,
  "summary": {
    "oneLine": "Oracle 正处于 AI 云叙事验证期，OCI 增长、RPO 转收入、capex 投入和数据中心交付节奏是核心观察线索。",
    "currentState": "市场讨论从 AI 云叙事转向订单兑现和基础设施投入的基本面验证。",
    "keyQuestion": "RPO 能否按照可验证节奏转化为 OCI 收入？"
  },
  "sentiment": {
    "heatLevel": 7.5,
    "direction": "high-disagreement",
    "disagreement": 0.8,
    "keyDebates": [
      "乐观叙事：OCI AI 云增长正在加速",
      "谨慎叙事：capex 投入过大，短期利润率承压"
    ]
  },
  "fundamentals": {
    "businessModel": "混合云、数据库和企业应用套件共同构成收入基础。",
    "revenueDrivers": ["OCI AI 云服务", "数据库许可和支持", "企业应用套件"],
    "keyMetrics": [
      {
        "label": "OCI 收入同比增速",
        "description": "~40%（sample/mock）",
        "whyItMatters": "用于观察 AI 云需求是否转化为可见收入。"
      }
    ],
    "risks": ["高 capex 投入周期超预期", "AI 云竞争加剧"]
  },
  "events": {
    "items": [
      {
        "type": "earnings",
        "title": "下一次财报观察",
        "description": "关注 OCI 增速、RPO 转收入节奏、capex 与现金流表现。",
        "impactQuestion": "管理层是否给出更清晰的 AI 云订单兑现路径？"
      }
    ]
  },
  "technicalContext": {
    "priceAction": "价格波动作为背景信息观察。",
    "volume": "成交量变化作为市场关注度参考。",
    "optionsIv": "期权 IV 反映市场对财报的分歧预期。",
    "keyZones": [
      {
        "type": "观察区间",
        "level": "sample range",
        "note": "仅作为背景信息"
      }
    ],
    "note": "技术/交易面只作为背景信息，不构成操作建议。"
  },
  "evidence": [
    {
      "id": "ev-001",
      "sourceLabel": "Sample 财报电话会议",
      "sourceType": "mock-earnings-call",
      "timestamp": "2026-06-05",
      "summary": "[Mock] 管理层提到 OCI AI 相关订单增长。",
      "confidence": 0.9
    }
  ],
  "nextSteps": [
    {
      "task": "核查 RPO 转收入节奏",
      "whyItMatters": "验证订单是否转化为实际收入。",
      "followUpDate": "2026-09-15"
    }
  ],
  "disclaimer": "仅供信息整理、研究辅助和教育参考，不构成投资建议。"
}
```
