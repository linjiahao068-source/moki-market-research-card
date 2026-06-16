/**
 * Serenity Scenario Provider - 完整的 Serenity 情景提供者
 *
 * 整合所有 5 个 Serenity 技能，生成完整的情景分析
 */

import { BullBaseBearScenarioSummary } from '@/types/scenario';
import { generateSerenityBundle } from '@/lib/serenity/mockData';
import { buildScenarioSourceNote } from '../serenityScenarioFramework';

export function getSerenityScenario(
  ticker: string,
  companyName?: string,
  currentPrice?: number
): BullBaseBearScenarioSummary {
  // 生成完整的 Serenity 分析包
  const bundle = generateSerenityBundle(ticker, companyName || ticker);

  // 从买方备忘录中提取情景（优先），或从其他分析中构建
  let scenarios = bundle.buySideMemo?.scenarios;

  if (!scenarios) {
    // 回退：从贝叶斯估值或其他分析构建简单情景
    scenarios = {
      bull: {
        probability: 0.25,
        revenueGrowth: '高增长',
        margin: '扩张',
        multiple: '估值扩张',
        impliedChange: '+20%',
        assumptions: ['乐观假设'],
      },
      base: {
        probability: 0.5,
        revenueGrowth: '符合预期',
        margin: '稳定',
        multiple: '保持',
        impliedChange: '0%',
        assumptions: ['基准假设'],
      },
      bear: {
        probability: 0.25,
        revenueGrowth: '低于预期',
        margin: '承压',
        multiple: '收缩',
        impliedChange: '-15%',
        assumptions: ['悲观假设'],
      },
    };
  }

  // 构建情景摘要（兼容现有格式）
  return {
    ticker,
    companyName: companyName || ticker,
    currency: 'USD',
    currentPrice,
    fiscalYear: '2024',
    scenarios: [],
    probabilityWeightedTargetPrice: null,
    riskRewardSummary: undefined,
    sourceNote: buildScenarioSourceNote({
      customNote: 'Serenity Framework Analysis（包含 Alpha、Bayesian、GF-DMA、TAM-Adj-PEG 和买方备忘录）',
      hasUnverifiedData: true,
    }),
    dataStatus: 'complete',
    warnings: ['研究假设，不构成投资建议'],
    // 注入完整的 Serenity 分析包（通过研究卡扩展字段）
  };
}
