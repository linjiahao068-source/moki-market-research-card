# Moki Market 真实数据集成开发方案

> 创建日期: 2026-06-16
> 目标: 将所有 Mock 数据替换为真实数据接入

## 一、现状分析

### 当前 Mock 数据分布

| 模块 | 文件 | 说明 |
|------|------|------|
| **Serenity Alpha** | `src/lib/serenity/serenityAlpha.ts` | 新闻转 Alpha 分析，全 Mock |
| **Bayesian Valuation** | `src/lib/serenity/bayesianValuation.ts` | 贝叶斯估值，全 Mock |
| **GF-DMA Health Index** | `src/lib/serenity/gfDmaHealthIndex.ts` | 健康评分，部分硬编码数值 |
| **TAM-Adj-PEG** | `src/lib/serenity/tamAdjPeg.ts` | PEG 估值，全 Mock |
| **Buy-Side Memo** | `src/lib/serenity/buySideMemo.ts` | 买方备忘录，全 Mock |
| **Scenarios** | `src/lib/scenarios/providers/manualScenarioProvider.ts` | 情景分析，硬编码配置 |

### 现有真实数据源能力

| 数据源 | 能力 | 接入状态 |
|--------|------|----------|
| **SEC EDGAR** | 公司基本面、财报数据 | ✅ 已接入 (`basicData`) |
| **东方财富** | 季度财务、估值指标 | ✅ 已接入 (`earningsSnapshot`) |
| **Yahoo Finance** | 估值倍数、分析师预期、价格数据 | ✅ 已接入 (`earningsSnapshot`) |
| **FMP** | 财务数据、预期（需 API Key） | ⚠️ 部分接入 |

---

## 二、总体架构设计

### 数据流程图

```
用户输入 (Ticker)
    ↓
[Security Resolver] 识别证券
    ↓
[Data Orchestrator] 统一调度
    ├─→ [Basic Company Data] (SEC/基础数据)
    ├─→ [Earnings Snapshot] (Yahoo/东方财富)
    └─→ [Global Stock Data] (多源补充)
    ↓
[Serenity Engine] 基于真实数据生成分析
    ├─→ Serenity Alpha (基于真实新闻/财报线索)
    ├─→ Bayesian Valuation (基于真实估值倍数)
    ├─→ GF-DMA Health Index (基于真实财务/价格数据)
    ├─→ TAM-Adj-PEG (基于真实增长数据)
    └─→ Buy-Side Memo (整合所有分析)
    ↓
[Scenarios Generator] 基于真实数据生成情景
    ↓
[Research Card] 输出完整研究卡
```

### 核心原则

1. **渐进式替换** - 保持 Mock 作为 fallback，逐步替换
2. **多源融合** - 优先用高质量数据源，缺失时 fallback
3. **透明可追溯** - 每个数据点标注来源和置信度
4. **类型安全** - 基于现有 TypeScript 类型扩展

---

## 三、分阶段实施路线图

### 📌 阶段 1: 财报快照增强（高优先级）

**目标**: 增强现有财报快照，添加历史数据、数据质量评分

**任务清单**:
- [ ] 创建 `src/lib/earnings/enhancedEarningsProvider.ts`
  - [ ] EnhancedEarningsSnapshot 类型定义
  - [ ] fetchHistoricalQuarters 函数
  - [ ] enhanceMetricsWithGrowthRates 函数
  - [ ] calculateDataQualityScore 函数
  - [ ] getEnhancedEarningsSnapshot 主函数
- [ ] 更新 `src/components/earnings/EarningsSnapshotPanel.tsx`
  - [ ] DataQualityHeader 组件
  - [ ] 增强的 CoreMetricsTable 组件
  - [ ] HistoricalTrendsPreview 组件
  - [ ] ValuationDataSection 组件
  - [ ] SourceAndDisclaimer 组件
- [ ] 更新 API 路由支持增强版财报

**验收标准**:
- ORCL 股票能展示多季度历史数据
- 显示数据质量评分（0-10）
- 每个指标标注来源
- 同比/环比增长显示

---

### 📌 阶段 2: 公司指引接入（高优先级）

**目标**: 从 SEC/FMP/Yahoo 提取公司指引

**任务清单**:
- [ ] 创建 `src/lib/earnings/guidanceDataProvider.ts`
  - [ ] GuidanceDataResult 类型
  - [ ] extractGuidanceFromSec 函数
  - [ ] fetchFmpGuidance 函数
  - [ ] extractGuidanceFromYahoo 函数
  - [ ] getGuidanceData 主函数（多源融合）
- [ ] 创建 `src/lib/earnings/fmpGuidanceProvider.ts`
- [ ] 创建 `src/lib/earnings/secGuidanceExtractor.ts`
- [ ] 创建 `src/lib/earnings/yahooGuidanceExtractor.ts`
- [ ] 完全重写 `src/components/earnings/GuidanceComparePanel.tsx`
  - [ ] GuidanceHeader 组件
  - [ ] GuidanceMetricsTable 组件
  - [ ] GuidanceEvidenceSection 组件
  - [ ] WarningsSection 组件

**验收标准**:
- 有指引的股票能展示指引数据
- 展示指引证据链（来源链接/文档）
- 标注每个指引的置信度
- 无指引时显示友好提示

---

### 📌 阶段 3: 买方情景推演完全真实数据化（高优先级）

**目标**: 基于真实历史波动和估值生成情景

**任务清单**:
- [ ] 创建 `src/lib/scenarios/providers/advancedScenarioProvider.ts`
  - [ ] AdvancedScenarioInput 类型
  - [ ] extractBaseScenarioInputs 函数
  - [ ] calculateHistoricalVolatility 函数
  - [ ] buildBullScenario / buildBaseScenario / buildBearScenario
  - [ ] adjustProbabilitiesByHistory 函数
  - [ ] getAdvancedScenarios 主函数
- [ ] 大幅增强 `src/components/scenarios/BullBaseBearScenariosPanel.tsx`
  - [ ] ScenarioDataHeader 组件
  - [ ] 增强的 ScenarioCard 组件（显示计算过程）
  - [ ] RiskRewardSummary 组件
  - [ ] ScenarioSourceFooter 组件
- [ ] 更新 `src/lib/scenarios/scenarioCalculator.ts`
  - [ ] 增强现有函数支持真实数据

**验收标准**:
- 情景参数基于真实历史波动率
- 目标价计算基于真实估值倍数
- 每个情景显示推导过程
- 概率基于历史表现调整

---

### 📌 阶段 4: Serenity 全模块真实数据化（中优先级）

**目标**: 所有 Serenity 模块都有真实数据版本

**任务清单**:
- [ ] 重构 `src/lib/serenity/index.ts`
  - [ ] SerenityDataInput 类型
  - [ ] calculateDataAvailability 函数
  - [ ] generateSerenityBundleFromRealData 主函数
- [ ] 创建 `src/lib/serenity/gfDmaHealthIndexRealData.ts`
- [ ] 创建 `src/lib/serenity/tamAdjPegRealData.ts`
- [ ] 创建 `src/lib/serenity/bayesianValuationRealData.ts`
- [ ] 创建 `src/lib/serenity/buySideMemoRealData.ts`
- [ ] 创建 `src/lib/serenity/serenityAlphaRealData.ts` (基础版，暂不需新闻)
- [ ] 更新类型定义 `src/types/serenity.ts` (按需)

**验收标准**:
- 每个模块都优先使用真实数据
- 数据不足时优雅 fallback 到 Mock
- 显示数据来源和覆盖度
- 各模块分析基于真实数据生成

---

### 📌 阶段 5: 最终整合，去 Mock 化（中优先级）

**目标**: 研究卡生成完全去 Mock，支持真实数据状态展示

**任务清单**:
- [ ] 大幅更新 `src/lib/generateResearchCard/mockGenerateResearchCard.ts`
  - [ ] 添加 useRealData 参数
  - [ ] generateRealDataResearchCard 函数
  - [ ] buildKeyMetricsFromData 函数
  - [ ] buildEventsFromData 函数
  - [ ] buildEvidenceChain 函数
  - [ ] buildRealDataSections 函数
- [ ] 扩展类型定义 `src/types/research-card.ts`
  - [ ] 添加 serenityAnalysis 字段
  - [ ] 添加 enhancedEarnings 字段
  - [ ] 添加 guidanceData 字段
  - [ ] 添加 advancedScenarios 字段
  - [ ] 添加 dataQuality 字段
- [ ] 增强 `src/components/generate/GeneratedCardPreview.tsx`
  - [ ] 真实数据徽章
  - [ ] 数据质量评分展示
  - [ ] EnhancedSerenityPanel 组件
- [ ] 更新 API 路由，集成增强版数据
- [ ] 完整端到端测试

**验收标准**:
- 研究卡标记 "真实数据" 徽章
- 显示数据质量评分和来源
- Serenity 面板展示真实数据驱动分析
- 所有模块整合工作
- 完全去 Mock，但保留 fallback

---

## 四、数据来源清单

| 数据模块 | 主要来源 | 次要来源 | 状态 |
|---------|---------|---------|------|
| 公司基础数据 | SEC EDGAR | FMP | ✅ 已接入 |
| 季度财务数据 | 东方财富 | Yahoo Finance | ✅ 已接入 |
| 估值倍数 | Yahoo Finance | FMP | ✅ 已接入 |
| 分析师预期 | Yahoo Finance | FMP | ⚠️ 部分接入 |
| 公司指引 | SEC filings | FMP | 🆕 新增接入 |
| 历史价格 | Yahoo Finance | - | 📋 计划中 |
| 行业对比 | 东方财富 | FMP | 📋 计划中 |
| 新闻事件 | (待定) | - | 📋 后期 |

---

## 五、配置与环境变量

### 环境变量 (`.env.example` 已创建)

```env
# Financial Modeling Prep (FMP) API Key
# Get a free API key from: https://financialmodelingprep.com/developer/docs/
FMP_API_KEY=

# Optional: Additional API keys can be added here as needed
```

### 数据来源配置 (计划中)

- 创建 `src/config/dataSources.ts`
- 数据源优先级
- Mock fallback 开关

---

## 六、验证与质量保证

### 自测清单

- [ ] ORCL 股票完整流程测试
- [ ] NVDA 股票完整流程测试
- [ ] TSLA 股票完整流程测试
- [ ] 无真实数据时的 fallback 测试
- [ ] 边界情况处理（数据缺失、异常值）
- [ ] `npm run lint` 通过
- [ ] `npm run build` 通过

### 视觉检查

- 移动端 (320px)
- 平板 (768px)
- 桌面 (1280px+)
- 深色/浅色模式

---

## 七、关键类型定义（索引）

### 新增类型文件

1. `EnhancedEarningsSnapshot` - 增强财报快照
2. `GuidanceDataResult` - 指引数据结果
3. `AdvancedScenarioInput` - 高级情景输入
4. `SerenityDataInput` - Serenity 数据输入
5. `ResearchCard` 扩展字段

### 涉及修改的类型文件

1. `src/types/research-card.ts`
2. `src/types/earnings.ts`
3. `src/types/serenity.ts`

---

## 八、相关文件索引

### 新增文件

| 文件路径 | 说明 |
|---------|------|
| `src/lib/earnings/enhancedEarningsProvider.ts` | 增强财报提供者 |
| `src/lib/earnings/guidanceDataProvider.ts` | 指引数据提供者 |
| `src/lib/earnings/fmpGuidanceProvider.ts` | FMP 指引提取 |
| `src/lib/earnings/secGuidanceExtractor.ts` | SEC 指引提取 |
| `src/lib/earnings/yahooGuidanceExtractor.ts` | Yahoo 指引提取 |
| `src/lib/scenarios/providers/advancedScenarioProvider.ts` | 高级情景提供者 |
| `src/lib/serenity/gfDmaHealthIndexRealData.ts` | GF-DMA 真实数据版 |
| `src/lib/serenity/tamAdjPegRealData.ts` | TAM-Adj-PEG 真实数据版 |
| `src/lib/serenity/bayesianValuationRealData.ts` | Bayesian 真实数据版 |
| `src/lib/serenity/buySideMemoRealData.ts` | Buy-Side Memo 真实数据版 |
| `src/lib/serenity/serenityAlphaRealData.ts` | Serenity Alpha 真实数据版 |
| `docs/REAL_DATA_INTEGRATION_PLAN.md` | 本文档 |

### 修改文件

| 文件路径 | 说明 |
|---------|------|
| `src/lib/serenity/index.ts` | 重构统一入口 |
| `src/lib/generateResearchCard/mockGenerateResearchCard.ts` | 增强支持真实数据 |
| `src/components/earnings/EarningsSnapshotPanel.tsx` | 增强展示 |
| `src/components/earnings/GuidanceComparePanel.tsx` | 完全重写 |
| `src/components/scenarios/BullBaseBearScenariosPanel.tsx` | 增强展示 |
| `src/components/generate/GeneratedCardPreview.tsx` | 增强真实数据展示 |
| `src/types/research-card.ts` | 类型扩展 |
| `src/app/api/earnings-snapshot/route.ts` | 增强 API |
| `.env.example` | 环境变量示例 |

---

## 九、进度跟踪

### 阶段完成标记

- [ ] 阶段 1: 财报快照增强
- [ ] 阶段 2: 公司指引接入
- [ ] 阶段 3: 买方情景推演完全真实数据化
- [ ] 阶段 4: Serenity 全模块真实数据化
- [ ] 阶段 5: 最终整合，去 Mock 化

### 开发原则

- 每完成一个阶段，等待确认后再继续下一阶段
- 每个阶段都要保证 lint 和 build 通过
- 保留完整 Git 历史
- 保持向后兼容

---

## 十、注意事项

### 向后兼容保证

- ✅ 始终保留 Mock 作为 fallback
- ✅ 类型系统保持向后兼容
- ✅ 组件 API 保持不变
- ✅ API 路由保持兼容

### 数据质量承诺

- ✅ 每个数据点标注来源
- ✅ 数据质量评分透明展示
- ✅ 缺失数据有友好提示
- ✅ 免责声明清晰明确

---

*文档版本: 1.0*
*最后更新: 2026-06-16*
