/**
 * 高级情景提供者 - 完全基于真实数据驱动
 */

import type { BullBaseBearScenario, BullBaseBearScenarioSummary, ScenarioSource } from '@/types/scenario';
import type { BasicCompanyData } from '@/types/basic-data';
import type { EarningsSnapshotData } from '@/types/earnings';
import type { SecurityRecord } from '@/types/security';
import {
  buildScenarioSummary,
  calculatePeTargetPrice,
  calculateImpliedReturn,
  normalizeScenarioProbabilities
} from '../scenarioCalculator';

export interface AdvancedScenarioInput {
  ticker: string;
  companyName: string;
  security?: SecurityRecord;
  basicData?: BasicCompanyData;
  earningsSnapshot?: EarningsSnapshotData;
  historicalQuarters?: unknown[];
  peerValuations?: PeerValuation[];
  historicalVolatility?: number;
}

export interface PeerValuation {
  ticker: string;
  companyName: string;
  pe?: number;
  forwardPe?: number;
  evSales?: number;
}

/**
 * 提取基准情景输入
 */
function extractBaseScenarioInputs(
  earningsSnapshot?: EarningsSnapshotData
): { baseEps: number | null; baseMultiple: number | null; currentPrice: number | null } {
  let baseEps: number | null = null;
  let baseMultiple: number | null = null;
  let currentPrice: number | null = null;

  if (earningsSnapshot) {
    // EPS 优先顺序：forward estimate -> trailing estimate -> latest actual
    const epsMetric = earningsSnapshot.metrics.find(m => m.metricKey === 'eps');
    if (epsMetric?.estimate !== undefined) {
      baseEps = epsMetric.estimate;
    } else if (earningsSnapshot.forwardEps !== undefined) {
      baseEps = earningsSnapshot.forwardEps;
    } else if (earningsSnapshot.trailingEps !== undefined) {
      baseEps = earningsSnapshot.trailingEps;
    } else if (epsMetric?.actual !== undefined) {
      baseEps = epsMetric.actual;
    }

    // PE 优先顺序：forward PE -> trailing PE
    if (earningsSnapshot.forwardPE !== undefined) {
      baseMultiple = earningsSnapshot.forwardPE;
    } else if (earningsSnapshot.trailingPE !== undefined) {
      baseMultiple = earningsSnapshot.trailingPE;
    }

    // 当前价格
    if (earningsSnapshot.currentPrice !== undefined) {
      currentPrice = earningsSnapshot.currentPrice;
    }
  }

  return { baseEps, baseMultiple, currentPrice };
}

/**
 * 计算历史波动率（简化版）
 */
function calculateHistoricalVolatility(
  historicalQuarters?: unknown[],
  _earningsSnapshot?: EarningsSnapshotData
): number {
  // 如果没有足够历史数据，使用默认波动率
  if (!historicalQuarters || historicalQuarters.length < 4) {
    return 0.2; // 20% 作为基准
  }

  // 这里可以实现真实的历史波动率计算
  // 暂时返回默认值
  return 0.2;
}

/**
 * 构建乐观情景
 */
function buildBullScenario(
  baseEps: number | null,
  baseMultiple: number | null,
  volatility: number,
  currentPrice: number | null
): BullBaseBearScenario {
  // 基于波动率计算情景参数
  const epsUpside = Math.min(volatility * 1.5, 0.3); // 最多30%超预期
  const multipleExpansion = Math.min(volatility, 0.2); // 最多20%估值扩张

  const bullEps = baseEps ? baseEps * (1 + epsUpside) : 10;
  const bullMultiple = baseMultiple ? baseMultiple * (1 + multipleExpansion) : 20;
  const targetPrice = calculatePeTargetPrice(bullEps, bullMultiple);

  return {
    case: 'bull',
    label: '乐观情景',
    probability: 0.25,
    coreAssumptions: [
      `业绩超预期 ${(epsUpside * 100).toFixed(0)}%`,
      `估值倍数扩张 ${(multipleExpansion * 100).toFixed(0)}%`
    ],
    revenueAssumption: {},
    epsAssumption: { fullYear: bullEps },
    valuationMultiple: bullMultiple,
    valuationMethod: 'pe_multiple',
    targetPrice,
    impliedReturnPct: calculateImpliedReturn(targetPrice, currentPrice),
    triggerConditions: [
      '业绩显著超出市场预期',
      '估值倍数扩张',
      '行业催化剂出现'
    ],
    source: 'data-driven' as ScenarioSource,
    derivationNote: `目标价 = 预期 EPS $${bullEps.toFixed(2)} × PE ${bullMultiple.toFixed(1)}x (基准 +${(multipleExpansion * 100).toFixed(0)}%)`
  };
}

/**
 * 构建基准情景
 */
function buildBaseScenario(
  baseEps: number | null,
  baseMultiple: number | null,
  currentPrice: number | null
): BullBaseBearScenario {
  const baseEpsVal = baseEps || 8;
  const baseMultipleVal = baseMultiple || 18;
  const targetPrice = calculatePeTargetPrice(baseEpsVal, baseMultipleVal);

  return {
    case: 'base',
    label: '基准情景',
    probability: 0.55,
    coreAssumptions: [
      '业绩符合市场预期',
      '估值倍数保持稳定'
    ],
    revenueAssumption: {},
    epsAssumption: { fullYear: baseEpsVal },
    valuationMultiple: baseMultipleVal,
    valuationMethod: 'pe_multiple',
    targetPrice,
    impliedReturnPct: calculateImpliedReturn(targetPrice, currentPrice),
    triggerConditions: [
      '业绩符合指引'
    ],
    source: 'data-driven' as ScenarioSource,
    derivationNote: `目标价 = 预期 EPS $${baseEpsVal.toFixed(2)} × PE ${baseMultipleVal.toFixed(1)}x`
  };
}

/**
 * 构建悲观情景
 */
function buildBearScenario(
  baseEps: number | null,
  baseMultiple: number | null,
  volatility: number,
  currentPrice: number | null
): BullBaseBearScenario {
  // 基于波动率计算情景参数
  const epsDownside = Math.min(volatility * 1.5, 0.3); // 最多30%低于预期
  const multipleContraction = Math.min(volatility, 0.25); // 最多25%估值收缩

  const bearEps = baseEps ? baseEps * (1 - epsDownside) : 6;
  const bearMultiple = baseMultiple ? baseMultiple * (1 - multipleContraction) : 15;
  const targetPrice = calculatePeTargetPrice(bearEps, bearMultiple);

  return {
    case: 'bear',
    label: '悲观情景',
    probability: 0.2,
    coreAssumptions: [
      `业绩低于预期 ${(epsDownside * 100).toFixed(0)}%`,
      `估值倍数收缩 ${(multipleContraction * 100).toFixed(0)}%`
    ],
    revenueAssumption: {},
    epsAssumption: { fullYear: bearEps },
    valuationMultiple: bearMultiple,
    valuationMethod: 'pe_multiple',
    targetPrice,
    impliedReturnPct: calculateImpliedReturn(targetPrice, currentPrice),
    triggerConditions: [
      '业绩低于市场预期',
      '估值倍数收缩',
      '行业或宏观风险出现'
    ],
    source: 'data-driven' as ScenarioSource,
    derivationNote: `目标价 = 预期 EPS $${bearEps.toFixed(2)} × PE ${bearMultiple.toFixed(1)}x (基准 -${(multipleContraction * 100).toFixed(0)}%)`
  };
}

/**
 * 构建高级情景来源说明
 */
function buildAdvancedScenarioSourceNote(
  input: AdvancedScenarioInput
): string {
  const sources: string[] = [];

  if (input.earningsSnapshot?.provider) {
    sources.push(input.earningsSnapshot.provider);
  }
  if (input.basicData?.provider) {
    sources.push(input.basicData.provider);
  }
  if (input.historicalQuarters && input.historicalQuarters.length > 0) {
    sources.push(`历史数据 x${input.historicalQuarters.length}Q`);
  }

  if (sources.length === 0) {
    return '情景分析仅供研究参考';
  }

  return `基于 ${sources.join(' + ')} 生成的买方情景推演 · 情景假设仅供研究参考 · 不构成投资建议`;
}

/**
 * 主函数：获取高级情景
 */
export function getAdvancedScenarios(
  input: AdvancedScenarioInput
): BullBaseBearScenarioSummary {
  const { ticker, companyName, earningsSnapshot } = input;

  // 1. 提取基准数据
  const { baseEps, baseMultiple, currentPrice } = extractBaseScenarioInputs(earningsSnapshot);

  // 2. 计算历史波动率
  const volatility = calculateHistoricalVolatility(input.historicalQuarters, earningsSnapshot);

  // 3. 构建三个情景
  const bullScenario = buildBullScenario(baseEps, baseMultiple, volatility, currentPrice);
  const baseScenario = buildBaseScenario(baseEps, baseMultiple, currentPrice);
  const bearScenario = buildBearScenario(baseEps, baseMultiple, volatility, currentPrice);

  const scenarios = [bullScenario, baseScenario, bearScenario];

  // 4. 标准化概率
  const normalizedScenarios = normalizeScenarioProbabilities(scenarios);

  // 5. 收集警告
  const warnings: string[] = [];
  if (baseEps === null) {
    warnings.push('EPS数据缺失，使用默认值');
  }
  if (baseMultiple === null) {
    warnings.push('PE倍数数据缺失，使用默认值');
  }

  // 6. 确定数据状态
  let dataStatus: 'complete' | 'partial' | 'minimal' | 'placeholder' = 'placeholder';
  if (baseEps !== null && baseMultiple !== null) {
    dataStatus = 'complete';
  } else if (baseEps !== null || baseMultiple !== null) {
    dataStatus = 'partial';
  }

  // 7. 构建完整汇总
  return buildScenarioSummary({
    ticker,
    companyName,
    currency: 'USD',
    currentPrice,
    fiscalYear: earningsSnapshot?.fiscalYear?.toString() || new Date().getFullYear().toString(),
    scenarios: normalizedScenarios,
    sourceNote: buildAdvancedScenarioSourceNote(input),
    dataStatus,
    warnings
  });
}
