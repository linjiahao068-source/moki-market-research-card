import { BullBaseBearScenario, BullBaseBearScenarioSummary, RiskRewardSummary } from '@/types/scenario';

function isValidNumber(value: number | undefined | null): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * 计算隐含收益率
 * 公式：(targetPrice / currentPrice - 1) * 100
 * 如果 currentPrice 缺失或为 0，返回 undefined
 */
export function calculateImpliedReturn(targetPrice: number | undefined | null, currentPrice: number | undefined | null): number | undefined {
  if (!isValidNumber(targetPrice) || !isValidNumber(currentPrice) || currentPrice === 0) {
    return undefined;
  }
  return ((targetPrice / currentPrice) - 1) * 100;
}

/**
 * 基于 EPS 和估值倍数计算目标价
 * 公式：targetPrice = epsAssumption * valuationMultiple
 * 如果 EPS 或 multiple 缺失，返回 null
 */
export function calculatePeTargetPrice(epsAssumption: number | undefined | null, valuationMultiple: number | undefined | null): number | null {
  if (!isValidNumber(epsAssumption) || !isValidNumber(valuationMultiple)) {
    return null;
  }
  return epsAssumption * valuationMultiple;
}

/**
 * 归一化情景概率，使总和为 1（100%）
 * 如果没有有效概率，平均分配
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
    probability: equalProbability
  }));
}

/**
 * 计算概率加权目标价
 * 只计算 targetPrice 不为空的 scenario
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
export function calculateRiskRewardSummary(scenarios: BullBaseBearScenario[], currentPrice?: number): RiskRewardSummary | undefined {
  const normalizedScenarios = normalizeScenarioProbabilities(scenarios);

  const bullScenario = normalizedScenarios.find(s => s.case === 'bull');
  const bearScenario = normalizedScenarios.find(s => s.case === 'bear');

  const bullUpside = bullScenario && isValidNumber(currentPrice) && isValidNumber(bullScenario.targetPrice)
    ? calculateImpliedReturn(bullScenario.targetPrice, currentPrice)
    : undefined;

  const bearDownside = bearScenario && isValidNumber(currentPrice) && isValidNumber(bearScenario.targetPrice)
    ? calculateImpliedReturn(bearScenario.targetPrice, currentPrice)
    : undefined;

  const weightedTarget = calculateProbabilityWeightedTarget(normalizedScenarios);
  const expectedReturn = isValidNumber(currentPrice) && isValidNumber(weightedTarget)
    ? calculateImpliedReturn(weightedTarget, currentPrice)
    : undefined;

  const upsideDownsideRatio = (bullUpside !== undefined && bearDownside !== undefined && bearDownside < 0)
    ? Math.abs(bullUpside / bearDownside)
    : 0;

  return {
    expectedReturnPct: expectedReturn ?? 0,
    upsideDownsideRatio,
    bullCaseUpsidePct: bullUpside,
    bearCaseDownsidePct: bearDownside,
    summaryText: '基于情景假设的风险收益分析，不构成投资建议。'
  };
}

/**
 * 完整的情景汇总计算器
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
  currentPrice?: number;
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
    currentPrice,
    fiscalYear,
    scenarios: normalizedScenarios,
    probabilityWeightedTargetPrice,
    riskRewardSummary,
    sourceNote,
    dataStatus,
    warnings
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
      fullYear: 5.2,
      fullYearYoyPercent: 30
    },
    valuationMultiple: 28,
    valuationMethod: 'pe_multiple',
    targetPrice: 145.6,
    impliedReturnPct: 45.6,
    triggerConditions: ['产品超预期', '宏观政策利好'],
    source: 'mock'
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
      fullYear: 4.5,
      fullYearYoyPercent: 12
    },
    valuationMultiple: 24,
    valuationMethod: 'pe_multiple',
    targetPrice: 108.0,
    impliedReturnPct: 8.0,
    triggerConditions: ['业绩符合指引'],
    source: 'mock'
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
      fullYear: 3.8,
      fullYearYoyPercent: -5
    },
    valuationMultiple: 20,
    valuationMethod: 'pe_multiple',
    targetPrice: 76.0,
    impliedReturnPct: -24.0,
    triggerConditions: ['宏观经济下行', '行业竞争恶化'],
    source: 'mock'
  }
];

export function runSelfTests(): void {
  console.log('=== Scenario Calculator 自测 ===');
  console.log('这些测试仅用于验证逻辑，不构成投资建议。\n');

  // 测试 1: calculateImpliedReturn
  console.log('1. calculateImpliedReturn:');
  console.log('   100 -> 110:', calculateImpliedReturn(110, 100));
  console.log('   100 -> 90:', calculateImpliedReturn(90, 100));
  console.log('   缺失 currentPrice:', calculateImpliedReturn(100, null));
  console.log('   currentPrice=0:', calculateImpliedReturn(100, 0));

  // 测试 2: calculatePeTargetPrice
  console.log('\n2. calculatePeTargetPrice:');
  console.log('   EPS 5.0 * P/E 20:', calculatePeTargetPrice(5.0, 20));
  console.log('   缺失 EPS:', calculatePeTargetPrice(null, 20));

  // 测试 3: normalizeScenarioProbabilities
  console.log('\n3. normalizeScenarioProbabilities:');
  const testProbs = normalizeScenarioProbabilities(TEST_SCENARIOS);
  testProbs.forEach(s => console.log(`   ${s.case}: ${(s.probability * 100).toFixed(1)}%`));

  // 测试 4: calculateProbabilityWeightedTarget
  console.log('\n4. calculateProbabilityWeightedTarget:');
  const weightedTarget = calculateProbabilityWeightedTarget(TEST_SCENARIOS);
  console.log('   加权目标价:', weightedTarget);

  // 测试 5: buildScenarioSummary
  console.log('\n5. buildScenarioSummary:');
  const summary = buildScenarioSummary({
    ticker: 'TEST',
    companyName: 'Test Company',
    currency: 'USD',
    currentPrice: 100,
    fiscalYear: '2026',
    scenarios: TEST_SCENARIOS,
    sourceNote: '仅供测试，不构成投资建议。',
    dataStatus: 'minimal'
  });
  console.log('   汇总对象:', {
    ticker: summary.ticker,
    currentPrice: summary.currentPrice,
    weightedTarget: summary.probabilityWeightedTargetPrice,
    expectedReturn: summary.riskRewardSummary?.expectedReturnPct,
    upsideDownsideRatio: summary.riskRewardSummary?.upsideDownsideRatio
  });

  console.log('\n=== 自测完成 ===');
}
