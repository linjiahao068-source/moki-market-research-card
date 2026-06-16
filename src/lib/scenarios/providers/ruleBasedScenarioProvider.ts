import {
  BullBaseBearScenario,
  BullBaseBearScenarioSummary
} from '@/types/scenario';
import { EarningsSnapshotData } from '@/types/earnings';
import {
  buildScenarioSummary,
  calculatePeTargetPrice
} from '../scenarioCalculator';
import { buildScenarioSourceNote } from '../serenityScenarioFramework';

const DEFAULT_PROBABILITIES = {
  bull: 0.25,
  base: 0.55,
  bear: 0.20
} as const;

const DEFAULT_BASE_MULTIPLE = 25;

const SOURCE_NOTE = '规则生成，仅用于样例展示，需人工复核。This is not investment advice.';

type RuleBasedScenarioInput = {
  ticker: string;
  companyName?: string;
  currency?: string;
  currentPrice?: number;
  earningsSnapshot?: EarningsSnapshotData | null;
};

function extractBaseEps(earningsSnapshot?: EarningsSnapshotData | null): number | null {
  if (!earningsSnapshot) {
    return null;
  }

  const epsMetric = earningsSnapshot.metrics.find(m => m.metricKey === 'eps');
  if (!epsMetric) {
    return null;
  }

  // Priority: consensus estimate -> actual reported
  if (epsMetric.estimate !== undefined && epsMetric.estimate !== null) {
    return epsMetric.estimate;
  }

  if (epsMetric.actual !== undefined && epsMetric.actual !== null) {
    return epsMetric.actual;
  }

  return null;
}

function buildRuleScenario(
  caseType: 'bull' | 'base' | 'bear',
  label: string,
  baseEps: number,
  baseMultiple: number
): BullBaseBearScenario {
  let eps: number;
  let multiple: number;

  switch (caseType) {
    case 'bull':
      eps = baseEps * 1.15;
      multiple = baseMultiple * 1.15;
      break;
    case 'bear':
      eps = baseEps * 0.80;
      multiple = baseMultiple * 0.75;
      break;
    case 'base':
    default:
      eps = baseEps;
      multiple = baseMultiple;
  }

  const targetPrice = calculatePeTargetPrice(eps, multiple);

  return {
    case: caseType,
    label,
    probability: DEFAULT_PROBABILITIES[caseType],
    coreAssumptions: [
      `Rule-based: ${caseType} case from base EPS`,
    ],
    revenueAssumption: {},
    epsAssumption: {
      fullYear: eps,
    },
    valuationMultiple: multiple,
    valuationMethod: 'pe_multiple',
    targetPrice,
    impliedReturnPct: null,
    triggerConditions: [
      'Rule-based placeholder - review before use',
    ],
    source: 'rule_based',
  };
}

/**
 * 使用 earningsSnapshot 生成规则情景
 * 仅在有可用 EPS 数据时返回情景
 */
export function getRuleBasedScenario(
  input: RuleBasedScenarioInput
): BullBaseBearScenarioSummary | null {
  const {
    ticker,
    companyName: inputCompanyName,
    currency = 'USD',
    currentPrice,
    earningsSnapshot,
  } = input;

  const baseEps = extractBaseEps(earningsSnapshot);

  // 如果没有可用的 EPS，返回 null
  if (baseEps === null) {
    return null;
  }

  // 对于非 USD 或其他不完整情况，温和降级（仍然返回但明确标注）
  const isNonUsdCurrency = currency !== 'USD';

  const companyName = inputCompanyName ?? earningsSnapshot?.companyName ?? ticker.toUpperCase();

  const scenarios: BullBaseBearScenario[] = [
    buildRuleScenario('bull', '乐观情景（规则生成）', baseEps, DEFAULT_BASE_MULTIPLE),
    buildRuleScenario('base', '基准情景（规则生成）', baseEps, DEFAULT_BASE_MULTIPLE),
    buildRuleScenario('bear', '悲观情景（规则生成）', baseEps, DEFAULT_BASE_MULTIPLE),
  ];

  const warnings: string[] = [
    '规则生成，仅用于样例展示，需人工复核。',
    'EPS 基于 consensus/actual，估值倍数为默认假设。',
    '不构成投资建议。',
  ];

  if (isNonUsdCurrency) {
    warnings.push('注意：非 USD 币种，规则可能不适用。');
  }

  if (!currentPrice) {
    warnings.push('注意：缺少当前价格，情景变化幅度未计算。');
  }

  return buildScenarioSummary({
    ticker: ticker.toUpperCase(),
    companyName,
    currency,
    currentPrice,
    fiscalYear: earningsSnapshot?.fiscalYear,
    scenarios,
    sourceNote: buildScenarioSourceNote({
      customNote: SOURCE_NOTE,
      hasUnverifiedData: true,
    }),
    dataStatus: 'minimal',
    warnings,
  });
}

/**
 * 检查是否有足够数据生成规则情景
 */
export function canGenerateRuleBasedScenario(
  earningsSnapshot?: EarningsSnapshotData | null
): boolean {
  return extractBaseEps(earningsSnapshot) !== null;
}
