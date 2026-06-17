
# 研究卡规格说明

v0.3.7 起，用户界面从多种实验卡片类型收敛为 `Executive Investment View`。当前 `ResearchCard` 类型仍作为兼容层存在，v0.4.0 将在此基础上建立 `ResearchReport` schema。

## 当前报告结构

### 1. Executive Summary
用 1-2 句话概括当前研究问题、核心观察和证据缺口。

### 2. Earnings & Guidance
整理单季度收入、利润、EPS、consensus、management guidance 和缺失原因。

### 3. Scenario Map
保留 Bull / Base / Bear 的变量、概率、触发条件和后续可复盘事项。

### 4. Evidence References
保留来源、发布时间、抓取时间、摘录和诊断提示。底层仍保留质量/置信字段用于排序和生成，但 v0.3.7 不在用户界面展示置信度百分比。

### 5. Technical Context
技术和交易相关信息仅作为背景，不形成操作建议。

### 6. Follow-up Research
后续需要关注的指标、待验证假设、潜在风险点和补数任务。

### 7. Disclaimer
标准免责声明文本，明确说明研究内容仅供信息整理、研究辅助和教育参考，不构成投资建议。

## 迁移说明

- `cardType` 暂统一为 `executive-investment-view`，后续由 `ResearchReport.reportType` 接管。
- `confidence` 暂保留在 facts/evidence/LLM 输出中供内部排序使用，但不作为用户界面展示项。
- 旧的情绪雷达、新闻解读、AI 云雷达等卡片类型不再作为用户可选入口。
