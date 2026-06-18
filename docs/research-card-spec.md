# 研究报告结构规范

v0.3.7 起，用户界面从多种实验卡片类型收敛为 `Executive Investment View`。v0.4.1 已在 `ResearchReport` schema 基础层上新增 Evidence Reference Layer，`ResearchCard` 继续作为 legacy 兼容输入与现有渲染层存在。

## 当前报告结构

### 1. Executive Summary

用 1-2 句话概括当前研究问题、核心观察和证据缺口。

### 2. Earnings & Guidance

整理单季收入、利润、EPS、consensus、management guidance 和缺失原因。

### 3. Scenario Map

保留 Bull / Base / Bear 的变量、概率、触发条件和后续可复盘事项。

### 4. Evidence References

保留来源、发布时间、抓取时间、摘录和诊断提示。底层仍保留质量/置信字段用于排序和生成，但 v0.3.7 起不在用户界面展示置信度百分比。

### 5. Technical Context

技术和交易相关信息仅作为背景，不形成操作建议。

### 6. Follow-up Research

后续需要关注的指标、待验证假设、潜在风险点和补数任务。

### 7. Disclaimer

标准免责声明文本，明确说明研究内容仅供信息整理、研究辅助和教育参考，不构成投资建议。

## v0.4.0 Schema Foundation

- `src/types/research-report.ts` 定义 `ResearchReport` 顶层 schema，包含版本、报告类型、主体信息、摘要、章节、证据引用、事实引用、后续研究任务和 legacy 兼容链接。
- `ResearchReport.reportType` 当前固定为 `executive-investment-view`。
- `ResearchReport.sections` 采用稳定 section id：`executive_summary`、`earnings_guidance`、`scenario_map`、`evidence_references`、`technical_context`、`follow_up_research`、`disclaimer`。
- `ResearchReport.sourceIngestionState` 先承接现有 `ResearchCard` 的数据质量状态，为 v0.4.2 source ingestion 做接口预留。
- `ResearchReport.evidenceReferences` 和 `ResearchReport.factReferences` 先从现有 evidence/facts 结构映射，为 v0.4.1 Evidence Reference Layer 做准备。
- `src/lib/research-report/fromResearchCard.ts` 提供 `ResearchCard -> ResearchReport` 兼容 adapter。
- `src/data/researchReports.ts` 提供当前静态样例报告入口，不改变现有页面路由和渲染行为。

## v0.4.1 Evidence Reference Layer

- `ResearchReport.schemaVersion` 当前固定为 `v0.4.1`。
- `ResearchReport.evidenceLayer` 汇总 evidence count、fact refs、linked targets、missing references、fallback evidence 和 review warnings。
- `ResearchReport.evidenceLayer.links` 明确每条 evidence 连接到哪个 claim、metric、section item 或 follow-up task。
- `ResearchReport.evidenceLayer.missingReferences` 标记没有证据、引用 id 缺失或需要补来源的 report target。
- 静态详情页的证据区优先展示 Evidence Reference Panel；取不到 `ResearchReport` 时继续回退到 legacy `EvidenceItem`。
- v0.4.1 不展示 confidence 百分比，只展示 evidence weight、source quality 和诊断状态。

## 迁移说明

- `ResearchCard.cardType` 暂统一为 `executive-investment-view`，后续由 `ResearchReport.reportType` 接管用户可见语义。
- `confidence` 暂保留在 facts/evidence/LLM 输出中供内部排序和生成使用，但不作为用户界面展示项。
- 旧的情绪雷达、新闻解读、AI 云雷达等卡片类型不再作为用户可选入口。
- v0.4.0 不替换当前 UI 渲染数据源，只建立可验证、可导出的 schema 基础层。
