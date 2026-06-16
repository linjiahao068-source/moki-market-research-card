/**
 * 高级情景提供者 - 完全基于真实数据驱动
 */

import type { BullBaseBearScenario, BullBaseBearScenarioSummary } from '@/types/scenario';
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

interface HistoricalQuarterLike {
  revenue?: number;
  netIncome?: number;
  dilutedEps?: number;
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
  const quarters = (historicalQuarters ?? []).filter((quarter): quarter is HistoricalQuarterLike => (
    typeof quarter === 'object' && quarter !== null
  ));
  const series = quarters
    .map((quarter) => quarter.dilutedEps ?? quarter.revenue ?? quarter.netIncome)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value !== 0);

  if (series.length < 4) {
    const epsMetric = _earningsSnapshot?.metrics.find((metric) => metric.metricKey === 'eps');
    const revenueMetric = _earningsSnapshot?.metrics.find((metric) => metric.metricKey === 'revenue');
    const yoySignals = [epsMetric?.yoyPct, revenueMetric?.yoyPct]
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
      .map((value) => Math.abs(value) / 100);

    if (yoySignals.length > 0) {
      return Math.max(0.12, Math.min(0.35, yoySignals.reduce((sum, value) => sum + value, 0) / yoySignals.length));
    }

    return 0.2; // 20% 作为基准
  }

  const changes: number[] = [];
  for (let index = 1; index < series.length; index += 1) {
    const previous = Math.abs(series[index]);
    const current = series[index - 1];

    if (previous > 0) {
      changes.push((current - series[index]) / previous);
    }
  }

  if (changes.length < 2) {
    return 0.2;
  }

  const average = changes.reduce((sum, value) => sum + value, 0) / changes.length;
  const variance = changes.reduce((sum, value) => sum + ((value - average) ** 2), 0) / changes.length;

  return Math.max(0.12, Math.min(0.4, Math.sqrt(variance)));
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
    source: 'data_driven',
    derivationNote: `估值演算 = 预期 EPS $${bullEps.toFixed(2)} × PE ${bullMultiple.toFixed(1)}x (基准 +${(multipleExpansion * 100).toFixed(0)}%)`
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
    source: 'data_driven',
    derivationNote: `估值演算 = 预期 EPS $${baseEpsVal.toFixed(2)} × PE ${baseMultipleVal.toFixed(1)}x`
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
    source: 'data_driven',
    derivationNote: `估值演算 = 预期 EPS $${bearEps.toFixed(2)} × PE ${bearMultiple.toFixed(1)}x (基准 -${(multipleContraction * 100).toFixed(0)}%)`
  };
}

/**
 * 根据历史波动率调整三情景概率
 */
function adjustProbabilitiesByHistory(
  scenarios: BullBaseBearScenario[],
  volatility: number
): BullBaseBearScenario[] {
  const boundedVolatility = Math.max(0.12, Math.min(0.4, volatility));
  const stressWeight = (boundedVolatility - 0.12) / 0.28;

  return scenarios.map((scenario) => {
    if (scenario.case === 'bull') {
      return {
        ...scenario,
        probability: 0.22 + (stressWeight * 0.04),
      };
    }

    if (scenario.case === 'bear') {
      return {
        ...scenario,
        probability: 0.16 + (stressWeight * 0.12),
      };
    }

    return {
      ...scenario,
      probability: 0.62 - (stressWeight * 0.16),
    };
  });
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

  const scenarios = adjustProbabilitiesByHistory([bullScenario, baseScenario, bearScenario], volatility);

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
