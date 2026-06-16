import { BullBaseBearScenario, BullBaseBearScenarioSummary, RiskRewardSummary } from '@/types/scenario';
import { EarningsSnapshotData } from '@/types/earnings';

function isValidNumber(value: number | undefined | null): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// Phase 1-2：从 EarningsSnapshot 提取真实数据
function extractRealisticInputs(earningsSnapshot?: EarningsSnapshotData | null): {
  baseEps: number | null;
  baseMultiple: number | null;
  currentPrice: number | null;
} {
  let baseEps: number | null = null;
  let baseMultiple: number | null = null;
  let currentPrice: number | null = null;

  if (earningsSnapshot) {
    // 优先用 forwardPE 和 forwardEps，如果没有就用 trailing
    if (isValidNumber(earningsSnapshot.forwardPE)) {
      baseMultiple = earningsSnapshot.forwardPE;
    } else if (isValidNumber(earningsSnapshot.trailingPE)) {
      baseMultiple = earningsSnapshot.trailingPE;
    }

    // 优先用共识预期 EPS（来自 metrics.estimate），如果没有就用 trailingEps
    const epsMetric = earningsSnapshot.metrics.find((m) => m.metricKey === 'eps');
    if (isValidNumber(epsMetric?.estimate)) {
      baseEps = epsMetric.estimate;
    } else if (isValidNumber(earningsSnapshot.forwardEps)) {
      baseEps = earningsSnapshot.forwardEps;
    } else if (isValidNumber(earningsSnapshot.trailingEps)) {
      baseEps = earningsSnapshot.trailingEps;
    } else if (isValidNumber(epsMetric?.actual)) {
      baseEps = epsMetric.actual;
    }

    if (isValidNumber(earningsSnapshot.currentPrice)) {
      currentPrice = earningsSnapshot.currentPrice;
    }
  }

  // 如果没有数据，返回 null
  return { baseEps, baseMultiple, currentPrice };
}

/**
 * 计算隐含收益率
 */
export function calculateImpliedReturn(
  targetPrice: number | undefined | null,
  currentPrice: number | undefined | null
): number | null {
  if (!isValidNumber(targetPrice) || !isValidNumber(currentPrice) || currentPrice === 0) {
    return null;
  }
  return ((targetPrice / currentPrice) - 1) * 100;
}

/**
 * 基于 EPS 和估值倍数计算目标价
 */
export function calculatePeTargetPrice(
  epsAssumption: number | undefined | null,
  valuationMultiple: number | undefined | null
): number | null {
  if (!isValidNumber(epsAssumption) || !isValidNumber(valuationMultiple)) {
    return null;
  }
  return epsAssumption * valuationMultiple;
}

/**
 * 归一化概率
 */
export function normalizeScenarioProbabilities(scenarios: BullBaseBearScenario[]): BullBaseBearScenario[] {
  const validScenarios = scenarios.map(s => ({
    ...s,
    probability: isValidNumber(s.probability) ? Math.max(0, Math.min(1, s.probability)) : 0
  }));

  const totalProbability = validScenarios.reduce((sum, s) => sum + s.probability, 0);

  if (totalProbability > 0) {
    return validScenarios.map(s => ({
      ...s,
      probability: s.probability / totalProbability
    }));
  }

  // 如果没有有效概率，平均分配
  const equalProbability = 1 / validScenarios.length;
  return validScenarios.map(s => ({
    ...s,
    probability: equalProbability,
  }));
}

/**
 * 计算概率加权目标价
 */
export function calculateProbabilityWeightedTarget(scenarios: BullBaseBearScenario[]): number | null {
  const normalizedScenarios = normalizeScenarioProbabilities(scenarios);

  let weightedSum = 0;
  let totalWeight = 0;

  for (const scenario of normalizedScenarios) {
    if (isValidNumber(scenario.targetPrice)) {
      weightedSum += scenario.targetPrice * scenario.probability;
      totalWeight += scenario.probability;
    }
  }

  if (totalWeight === 0) {
    return null;
  }

  return weightedSum;
}

/**
 * 计算风险收益汇总
 */
export function calculateRiskRewardSummary(
  scenarios: BullBaseBearScenario[],
  currentPrice?: number | null
): RiskRewardSummary | undefined {
  const normalizedScenarios = normalizeScenarioProbabilities(scenarios);

  const bullScenario = normalizedScenarios.find(s => s.case === 'bull');
  const bearScenario = normalizedScenarios.find(s => s.case === 'bear');

  const bullUpside = bullScenario && isValidNumber(currentPrice) && isValidNumber(bullScenario.targetPrice)
    ? calculateImpliedReturn(bullScenario.targetPrice, currentPrice)
    : null;

  const bearDownside = bearScenario && isValidNumber(currentPrice) && isValidNumber(bearScenario.targetPrice)
    ? calculateImpliedReturn(bearScenario.targetPrice, currentPrice)
    : null;

  const weightedTarget = calculateProbabilityWeightedTarget(normalizedScenarios);
  const expectedReturn = isValidNumber(currentPrice) && isValidNumber(weightedTarget)
    ? calculateImpliedReturn(weightedTarget, currentPrice)
    : null;

  const upsideDownsideRatio = (bullUpside !== null && bearDownside !== null && bearDownside < 0)
    ? Math.abs(bullUpside / bearDownside)
    : 0;

  return {
    expectedReturnPct: expectedReturn ?? 0,
    upsideDownsideRatio,
    bullCaseUpsidePct: bullUpside ?? undefined,
    bearCaseDownsidePct: bearDownside ?? undefined,
    summaryText: '基于情景假设的风险收益分析，不构成投资建议。'
  };
}

/**
 * Phase 3: 优先用真实数据构建完整场景
 */
export function buildScenariosFromRealData(
  ticker: string,
  companyName: string,
  earningsSnapshot?: EarningsSnapshotData | null
): BullBaseBearScenario[] {
  const { baseEps, baseMultiple, currentPrice } = extractRealisticInputs(earningsSnapshot);

  // 如果有真实数据，用真实数据构建
  if (baseEps !== null && baseMultiple !== null) {
    const bullEps = baseEps * 1.15;
    const bullMultiple = baseMultiple * 1.15;
    const bullTargetPrice = calculatePeTargetPrice(bullEps, bullMultiple);

    const baseEpsVal = baseEps;
    const baseMultipleVal = baseMultiple;
    const baseTargetPrice = calculatePeTargetPrice(baseEpsVal, baseMultipleVal);

    const bearEps = baseEps * 0.8;
    const bearMultiple = baseMultiple * 0.75;
    const bearTargetPrice = calculatePeTargetPrice(bearEps, bearMultiple);

    return [
      {
        case: 'bull',
        label: '乐观',
        probability: 0.25,
        coreAssumptions: ['业绩超预期 15%', '估值倍数修复 15%'],
        revenueAssumption: {},
        epsAssumption: { fullYear: bullEps },
        valuationMultiple: bullMultiple,
        valuationMethod: 'pe_multiple',
        targetPrice: bullTargetPrice,
        impliedReturnPct: isValidNumber(currentPrice) ? calculateImpliedReturn(bullTargetPrice, currentPrice) : null,
        triggerConditions: ['业绩超预期', '估值扩张'],
        source: 'rule_based',
        derivationNote: `目标价 = 预期 EPS $${bullEps.toFixed(2)} × PE ${bullMultiple.toFixed(1)}x`,
      },
      {
        case: 'base',
        label: '基准',
        probability: 0.55,
        coreAssumptions: ['业绩符合预期', '估值倍数保持稳定'],
        revenueAssumption: {},
        epsAssumption: { fullYear: baseEpsVal },
        valuationMultiple: baseMultipleVal,
        valuationMethod: 'pe_multiple',
        targetPrice: baseTargetPrice,
        impliedReturnPct: isValidNumber(currentPrice) ? calculateImpliedReturn(baseTargetPrice, currentPrice) : null,
        triggerConditions: ['业绩符合指引'],
        source: 'rule_based',
        derivationNote: `目标价 = 预期 EPS $${baseEpsVal.toFixed(2)} × PE ${baseMultipleVal.toFixed(1)}x`,
      },
      {
        case: 'bear',
        label: '悲观',
        probability: 0.2,
        coreAssumptions: ['业绩低于预期 20%', '估值倍数压缩 25%'],
        revenueAssumption: {},
        epsAssumption: { fullYear: bearEps },
        valuationMultiple: bearMultiple,
        valuationMethod: 'pe_multiple',
        targetPrice: bearTargetPrice,
        impliedReturnPct: isValidNumber(currentPrice) ? calculateImpliedReturn(bearTargetPrice, currentPrice) : null,
        triggerConditions: ['业绩低于预期', '估值收缩'],
        source: 'rule_based',
        derivationNote: `目标价 = 预期 EPS $${bearEps.toFixed(2)} × PE ${bearMultiple.toFixed(1)}x`,
      }
    ];
  }

  // 如果没有真实数据，用 manual data 或者返回空
  return [];
}

/**
 * 构建完整场景汇总（统一入口）
 */
export function buildScenarioSummary({
  ticker,
  companyName,
  currency = 'USD',
  currentPrice,
  fiscalYear,
  scenarios,
  sourceNote,
  dataStatus = 'minimal',
  warnings = []
}: {
  ticker: string;
  companyName: string;
  currency?: string;
  currentPrice?: number | null;
  fiscalYear?: string;
  scenarios: BullBaseBearScenario[];
  sourceNote: string;
  dataStatus?: 'complete' | 'partial' | 'minimal' | 'placeholder';
  warnings?: string[];
}): BullBaseBearScenarioSummary {
  const normalizedScenarios = normalizeScenarioProbabilities(scenarios);
  const probabilityWeightedTargetPrice = calculateProbabilityWeightedTarget(normalizedScenarios);
  const riskRewardSummary = calculateRiskRewardSummary(normalizedScenarios, currentPrice);

  return {
    ticker,
    companyName,
    currency,
    currentPrice: currentPrice ?? undefined,
    fiscalYear,
    scenarios: normalizedScenarios,
    probabilityWeightedTargetPrice,
    riskRewardSummary,
    sourceNote,
    dataStatus,
    warnings,
  };
}

// ========== 内部测试样例 ==========
// 这些样例仅用于验证计算器逻辑，不构成投资建议

export const TEST_SCENARIOS: BullBaseBearScenario[] = [
  {
    case: 'bull',
    label: '乐观情景',
    probability: 0.3,
    coreAssumptions: ['需求超预期', '市场份额提升'],
    revenueAssumption: {
      fullYear: 12000000000,
      fullYearYoyPercent: 25
    },
    epsAssumption: {
      fullYear: 7.0,
      fullYearYoyPercent: 30
    },
    valuationMultiple: 16.0,
    valuationMethod: 'pe_multiple',
    targetPrice: 112.0,
    impliedReturnPct: 45.6,
    triggerConditions: ['产品超预期', '宏观政策利好'],
    source: 'mock',
    derivationNote: '目标价 = 预期 EPS $7.0 × PE 16.0x',
  },
  {
    case: 'base',
    label: '基准情景',
    probability: 0.5,
    coreAssumptions: ['需求符合预期', '竞争格局稳定'],
    revenueAssumption: {
      fullYear: 10500000000,
      fullYearYoyPercent: 10
    },
    epsAssumption: {
      fullYear: 5.0,
      fullYearYoyPercent: 12
    },
    valuationMultiple: 14.0,
    valuationMethod: 'pe_multiple',
    targetPrice: 70.0,
    impliedReturnPct: 8.0,
    triggerConditions: ['业绩符合指引'],
    source: 'mock',
    derivationNote: '目标价 = 预期 EPS $5.0 × PE 14.0x',
  },
  {
    case: 'bear',
    label: '悲观情景',
    probability: 0.2,
    coreAssumptions: ['需求低于预期', '竞争加剧'],
    revenueAssumption: {
      fullYear: 9000000000,
      fullYearYoyPercent: -5
    },
    epsAssumption: {
      fullYear: 3.0,
      fullYearYoyPercent: -5
    },
    valuationMultiple: 11.0,
    valuationMethod: 'pe_multiple',
    targetPrice: 33.0,
    impliedReturnPct: -24.0,
    triggerConditions: ['宏观经济下行', '行业竞争恶化'],
    source: 'mock',
    derivationNote: '目标价 = 预期 EPS $3.0 × PE 11.0x',
  }
];

export function runSelfTests(): void {
  console.log('=== Scenario Calculator 自测 ===');
  console.log('这些样例仅用于验证逻辑，不构成投资建议。\n');

  console.log('1. calculateImpliedReturn (100 → 110):', calculateImpliedReturn(110, 100));
  console.log('2. calculatePeTargetPrice (5.0 × 20):', calculatePeTargetPrice(5.0, 20));

  console.log('\n3. 概率加权目标价:', calculateProbabilityWeightedTarget(TEST_SCENARIOS));
  console.log('\n4. 风险收益汇总:', calculateRiskRewardSummary(TEST_SCENARIOS, 100));

  console.log('\n=== 自测完成 ===');
}
