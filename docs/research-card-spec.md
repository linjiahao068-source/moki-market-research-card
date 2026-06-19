# 研究报告结构规范

> v0.5.3 status: `/generate` now promotes Integrated Research Report as the primary output, combining source ingestion, evidence layer, Buy-Side Research Report, Yahoo chart K-line Technical Dashboard, readiness, source audit, and review queue.

v0.3.7 起，用户界面从多种实验卡片类型收敛为 `Executive Investment View`。v0.5.3 已把 `/generate` 的主输出推进为 Integrated Research Report：`ResearchCard` 继续作为 seed 和 fallback 输入存在，但用户优先看到的是带 source audit、review queue、buy-side thesis 和 Yahoo chart technical snapshot 的整合报告产品视图。

## 当前报告结构

### 1. Executive Summary

用 1-2 句话概括当前研究问题、核心观察和证据缺口。

### 2. Integrated Research Report

聚合 source ingestion、evidence layer、buy-side report、technical data 和 follow-up research，形成 readiness、pillar summaries、review queue 和 source audit。当前版本只做结构化整合，不生成投资评级或交易建议。

### 3. Earnings & Guidance

整理单季收入、利润、EPS、consensus、management guidance 和缺失原因。

### 4. Scenario Map

保留 Bull / Base / Bear 的变量、概率、触发条件和后续可复盘事项。

### 5. Buy-Side Report Generator

基于已摄取来源、证据引用和缺失项生成本地买方报告视图，包含 investment view、business quality、Bull/Base/Bear、monitoring plan 和 source audit。当前版本不生成目标价、评级或交易指令。

### 6. Evidence References

保留来源、发布时间、抓取时间、摘录和诊断提示。底层仍保留质量/置信字段用于排序和生成，但 v0.3.7 起不在用户界面展示置信度百分比。

### 7. Technical Data Adapter

优先基于 Yahoo chart 日线 K 线生成 `TechnicalDataSnapshot` 并驱动技术仪表盘，覆盖 candlestick chart、EMA5/10/20/50 overlays、volume bars、MA20/MA50、RSI14、20d realized volatility、20d volume pressure、benchmark relative strength 和 support/resistance zones。Yahoo chart 不可用时，回退到已有技术文案、关键区间、buy-side monitoring plan 和 scenario read-through。当前版本不形成操作建议、评级或交易指令。

### 8. Follow-up Research

后续需要关注的指标、待验证假设、潜在风险点和补数任务。

### 9. Disclaimer

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

## v0.4.6 Integrated Research Report

- `ResearchReport.schemaVersion` 在 v0.4.6 时固定为 `v0.4.6`。
- `ResearchReport.integratedReport` 新增整合研究报告产物，包含 readiness、pillar summaries、review queue、source audit 和 executive narrative。
- `src/lib/research-report/integratedReportBuilder.ts` 聚合 `sourceIngestionState`、`evidenceLayer`、`buySideReport`、`technicalDashboard` 和 follow-up research。
- `buildResearchReportFromCard` 构建顺序为 evidence layer -> buy-side report -> technical dashboard -> integrated report。
- 详情页新增 Integrated Research Report 面板，放在 Executive Summary 后作为总览入口。
- v0.4.6 不补写事实、不接新数据源、不生成评级、目标价或交易建议；readiness 和 review queue 由已有审计状态推导。

## v0.4.7 Pivot Repair

- `ResearchReport.schemaVersion` 在 v0.4.7 时固定为 `v0.4.7`。
- `/generate` 顶部和表单输出结构改为 `ResearchReport Schema`，不再出现版本调试型 `v0.3.7 Report Pivot` 文案。
- 生成预览不再展示用户可见的数据质量分；内部 confidence/data quality 字段仍可用于排序、fallback 和后续生成。
- 生成态同步携带 `ResearchReport` bridge，并展示 schema version、section count、reference count 和待补引用数量，明确当前主输出目标是 `ResearchReport`。
- `ResearchCard -> ResearchReport` adapter 仅作为 v0.4.7 过渡输入保留；原生 `/api/research-report` 已由 v0.4.8 承接。
- v0.4.7 不声称已完成 source discovery、真实 technical dashboard、Yahoo chart K 线或买方研报原生 LLM 生成。

## v0.4.8 ResearchReport Generation API

- `ResearchReport.schemaVersion` 在 v0.4.8 时固定为 `v0.4.8`。
- 新增 `/api/research-report`，接收完整 `ResearchCard` seed，返回受约束的 `ResearchReport`。
- 新增 `src/lib/llm/researchReport.ts`，统一处理 prompt、JSON 生成、校验、一次 repair、fallback 和下游 report layer 重建。
- 新增 ResearchReport prompt 和 validator，固定 section ids、evidence ids、fact ids 与 tone 范围，并禁止输出置信度、数据质量分、评级、目标价或交易指令。
- `/generate` 优先调用 `/api/research-report`；若原生 API 失败或 LLM 未配置，则保留兼容 adapter 产物并展示 generation warnings。
- `ResearchBrief` 和 `SerenityMemo` 仍可作为辅助对象返回，但不再允许覆盖已经生成的原生 `ResearchReport JSON`。
- v0.4.8 不声称已完成 source discovery、真实 Technical Structure Dashboard、Yahoo chart K 线、技术指标计算或 benchmark relative strength。

## v0.4.9 Research Source Ingestion Real Layer

- `ResearchReport.schemaVersion` 在 v0.4.9 时固定为 `v0.4.9`。
- `ResearchCard.sourceInputs` 新增用户/API 提供来源输入，支持 company filing、earnings transcript、news、data provider、manual note 和 other。
- `ResearchReport.sourceIngestionState.chunks` 新增来源切片数组，记录 chunk id、source id、evidence id、source label/type、文本摘要和 token estimate。
- `ResearchSourceIngestionRecord.chunkIds` 将 source record 与 chunks/evidence references 连接起来。
- `src/lib/research-report/sourceIngestion.ts` 支持 legacy evidence adapter 和 provided source ingestion 两条路径。
- 新增 `/api/research-sources`，用于直接校验来源输入、source records、chunks、evidence references 和 optional fact references。
- `/api/research-report` 支持在 card seed 之外传入 `sources` / `sourceInputs`，并把它们纳入 ResearchReport prompt payload。
- `/generate` 新增可选来源摘录输入，生成预览展示 source record count 和 chunk count。
- v0.4.9 不声称已完成自动 source discovery、远程文档抓取、PDF/HTML 解析、检索索引、Yahoo chart K 线或真实 Technical Structure Dashboard。

## v0.5.0 Buy-Side Report Product UI

- `ResearchReport.schemaVersion` 在 v0.5.0 时固定为 `v0.5.0`。
- `/generate` 页面标题和 hero 文案推进为 `Buy-Side Research Report`。
- 生成预览把 `BuySideReportPanel` 提升为主输出，优先展示 investment view、key debates、business quality、scenario lanes、monitoring plan 和 source audit。
- `ResearchReport` schema/readiness/source count 仍在买方报告前展示，作为报告阅读前的契约和来源状态。
- 旧的决策摘要、财报快照、公司指引、情景推演和 Serenity Skill 模块折叠到 `Supporting Research Modules`，作为诊断和回溯信息。
- v0.5.0 不声称已完成 Technical Structure Dashboard 产品界面、Yahoo chart K 线、技术指标计算或 benchmark relative strength。

## v0.5.1 Technical Structure Dashboard Mock

- `ResearchReport.schemaVersion` 当前固定为 `v0.5.1`。
- `/generate` 在 Buy-Side Research Report 之后新增 `Technical Structure Dashboard Mock` 主输出区。
- `TechnicalDashboardPanel` 展示 indicator matrix mock、key zones mock、scenario read-through 和 technical readiness。
- `technicalDashboard.mode` 使用 `mock_from_research_report`，状态在 mock / partial mock / blocked 之间表达，不再把该层误写成真实行情接入。
- 技术 dashboard 显示 live data off、gap count、provider、adapter readiness 和 review notes。
- v0.5.1 不声称已完成 Yahoo chart、global-stock-data K 线、移动均线、RSI、MACD、波动率带、成交量分布或 benchmark relative strength。

## v0.5.2 Technical Data Adapter Real

- `ResearchReport.schemaVersion` 当前固定为 `v0.5.2-hotfix`。
- 新增 `/api/technical-data`，支持 `GET ?query=` 和 `POST { card }`，返回统一 `TechnicalDataSnapshot`。
- 新增 Yahoo chart 日线 K 线 adapter，使用 `globalStockData/marketSymbol` 做 US/HK Yahoo symbol 映射。
- `TechnicalDataSnapshot` 真实接入 `market_data_provider`，包含 MA20/MA50 trend、RSI14、20d realized volatility、20d volume pressure、benchmark relative strength、20d support/resistance 和 6mo range。
- `/generate` 并行请求 technical data，并把 snapshot 合并回 `ResearchReport.technicalDataSnapshot`、`technicalDashboard` 和 `integratedReport`。
- `technicalDashboard.mode` 在真实数据可用时使用 `technical_data_adapter`，状态进入 `adapted` 或 `partial_adapter`；Yahoo chart 不可用时回退到 v0.5.1 `mock_from_research_report`。
- 当前版本仍不输出 target price、buy/sell/hold rating、交易指令或完整交易系统信号；技术数据只作为研究上下文和 readiness 输入。

### v0.5.2-hotfix K-Line Chart Surface

- `TechnicalDataSnapshot.chart` 新增 OHLCV bar 序列、EMA5/10/20/50 和图表 metadata。
- 新增 `TechnicalKLineChartPanel`，使用 `lightweight-charts` 渲染 candlestick K 线、EMA overlays 和成交量柱。
- `TechnicalDashboardPanel` 在 indicator matrix 之前显示真实 K 线图；没有 live Yahoo chart 时显示 fallback 空状态。
- 当前 hotfix 先真实支持 Yahoo chart 日 K。5D、周 K、月 K、30m 等周期切换仍待后续扩展。

## v0.5.3 Integrated Research Report Product UI

- `ResearchReport.schemaVersion` 当前固定为 `v0.5.3`。
- `/generate` 将 `IntegratedResearchReportPanel` 提升到 Buy-Side 和 Technical 之前，作为主输出入口。
- `IntegratedReportSourceAudit` 新增 technical chart audit：`technicalChartAvailable`、`technicalChartBarCount`、`technicalChartInterval` 和 `technicalDataAsOf`。
- `integratedReport.pillars.technical_data` 汇总 K-line bar count、indicator count、zone count 和 live data 状态。
- `integratedReport.reviewQueue` 会在 K-line chart payload 缺失时生成可见复核项。
- 当前版本仍不生成 target price、rating 或交易指令；Integrated Report 只做研究工作流总览、审计和下一步复核队列。

## 迁移说明

- `ResearchCard.cardType` 暂统一为 `executive-investment-view`，v0.4.7 起用户可见语义应以 `ResearchReport.reportType` 为准。
- `confidence` 暂保留在 facts/evidence/LLM 输出中供内部排序和生成使用，但不作为用户界面展示项。
- 旧的情绪雷达、新闻解读、AI 云雷达等卡片类型不再作为用户可选入口。
- v0.5.3 已把 source/evidence/buy-side/technical/K-line 汇总为 Integrated Research Report 主输出；后续版本仍需补自动 discovery、章节检索、更多 provider fallback 和更完整的技术指标族。
