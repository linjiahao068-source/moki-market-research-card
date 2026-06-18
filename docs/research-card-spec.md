# 研究报告结构规范

v0.3.7 起，用户界面从多种实验卡片类型收敛为 `Executive Investment View`。v0.4.5 已在 `ResearchReport` schema 基础层上新增 Evidence Reference Layer、Research Source Ingestion、Buy-Side Report Generator、Technical Dashboard Mock 和 Technical Data Adapter，`ResearchCard` 继续作为 legacy 兼容输入与现有渲染层存在。

## 当前报告结构

### 1. Executive Summary

用 1-2 句话概括当前研究问题、核心观察和证据缺口。

### 2. Earnings & Guidance

整理单季收入、利润、EPS、consensus、management guidance 和缺失原因。

### 3. Scenario Map

保留 Bull / Base / Bear 的变量、概率、触发条件和后续可复盘事项。

### 4. Buy-Side Report Generator

基于已摄取来源、证据引用和缺失项生成本地买方报告视图，包含 investment view、business quality、Bull/Base/Bear、monitoring plan 和 source audit。当前版本不生成目标价、评级或交易指令。

### 5. Evidence References

保留来源、发布时间、抓取时间、摘录和诊断提示。底层仍保留质量/置信字段用于排序和生成，但 v0.3.7 起不在用户界面展示置信度百分比。

### 6. Technical Data Adapter

基于已有技术文案、关键区间、buy-side monitoring plan 和 scenario read-through 生成 `TechnicalDataSnapshot` 并驱动技术仪表盘。当前版本不接实时行情、不计算技术指标、不形成操作建议。

### 7. Follow-up Research

后续需要关注的指标、待验证假设、潜在风险点和补数任务。

### 8. Disclaimer

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

- `ResearchReport.evidenceLayer` 汇总 evidence count、fact refs、linked targets、missing references、fallback evidence 和 review warnings。
- `ResearchReport.evidenceLayer.links` 明确每条 evidence 连接到哪个 claim、metric、section item 或 follow-up task。
- `ResearchReport.evidenceLayer.missingReferences` 标记没有证据、引用 id 缺失或需要补来源的 report target。
- 静态详情页的证据区优先展示 Evidence Reference Panel；取不到 `ResearchReport` 时继续回退到 legacy `EvidenceItem`。
- v0.4.1 不展示 confidence 百分比，只展示 evidence weight、source quality 和诊断状态。

## v0.4.2 Research Source Ingestion

- `ResearchReport.schemaVersion` 当前固定为 `v0.4.2`。
- `ResearchReport.sourceIngestionState` 新增 `method`、`lastIngestedAt` 和 `records`。
- `ResearchSourceIngestionRecord` 记录每条来源的 source id、source type、method、status、sourceUrl、时间、snippet、evidenceIds、factIds 和 warnings。
- `src/lib/research-report/sourceIngestion.ts` 统一规范化 legacy evidence、research data layer evidence 和 fact references。
- 静态详情页证据区展示 Source Ingestion 摘要，用于检查 ingestion status、method、record count、freshness 和 source summary。
- v0.4.2 不联网抓取新来源，只建立本地 ingestion 契约和 adapter。

## v0.4.3 Buy-Side Report Generator

- `ResearchReport.schemaVersion` 当前固定为 `v0.4.3`。
- `ResearchReport.buySideReport` 新增本地买方报告产物，包含 generation state、investment view、business quality、Bull/Base/Bear、monitoring plan、source attribution 和 missing references。
- `src/lib/research-report/buySideReportGenerator.ts` 消费 `sourceIngestionState`、`evidenceReferences`、`factReferences` 和 `evidenceLayer`，不绕过证据引用层。
- 详情页新增 Buy-Side Report Generator 面板，用于检查生成状态、观点摘要、情景结构、监控指标和来源审计。
- v0.4.3 不生成 target price、buy/sell/hold rating 或交易指令；遇到 fallback/partial 来源时写入 review state。

## v0.4.4 Technical Dashboard Mock

- `ResearchReport.schemaVersion` 当前固定为 `v0.4.4`。
- `ResearchReport.technicalDashboard` 新增技术仪表盘 mock 产物，包含 summary、indicator matrix、key zones、scenario read-through、warnings 和 adapter readiness。
- `src/lib/research-report/technicalDashboardMock.ts` 消费 `technical_context` section、`buySideReport.monitoringPlan`、`buySideReport.scenarios`、`sourceIngestionState` 和 `evidenceLayer`。
- `technicalContext.keyZones` 映射为 `technical_context` section items，供 dashboard 展示关键区间。
- 详情页技术区新增 Technical Dashboard Mock 面板，同时保留 legacy technical context 文案作为过渡。
- v0.4.4 不接实时行情、不计算技术指标、不生成交易建议；所有技术项继续显示 review/source 状态。

## v0.4.5 Technical Data Adapter

- `ResearchReport.schemaVersion` 当前固定为 `v0.4.5`。
- `ResearchReport.technicalDashboard.dataSnapshot` 新增结构化技术数据快照，包含 provider、adapter status、data points、zones、source summary 和 warnings。
- `ResearchReport.technicalDashboard.summary` 新增 `adapterStatus`、`provider`、`liveDataAvailable` 和 `dataAsOf`。
- `src/lib/research-report/technicalDataAdapter.ts` 把 legacy `technicalContext` 和 `technical_context` section 适配为 dashboard 可消费的技术数据。
- `TechnicalDashboardPanel` 展示 adapter ready、provider、live data 状态和每个技术指标的 data status。
- v0.4.5 不联网抓取行情、不计算技术指标、不生成交易信号；`legacy_technical_context` 只代表适配层已建立，不代表实时数据已接入。

## 迁移说明

- `ResearchCard.cardType` 暂统一为 `executive-investment-view`，后续由 `ResearchReport.reportType` 接管用户可见语义。
- `confidence` 暂保留在 facts/evidence/LLM 输出中供内部排序和生成使用，但不作为用户界面展示项。
- 旧的情绪雷达、新闻解读、AI 云雷达等卡片类型不再作为用户可选入口。
- v0.4.0 不替换当前 UI 渲染数据源，只建立可验证、可导出的 schema 基础层。
