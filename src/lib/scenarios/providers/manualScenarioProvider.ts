import {
  BullBaseBearScenario,
  BullBaseBearScenarioSummary,
  ScenarioSource
} from '@/types/scenario';
import {
  buildScenarioSummary,
  calculatePeTargetPrice,
  calculateImpliedReturn
} from '../scenarioCalculator';
import { buildScenarioSourceNote } from '../serenityScenarioFramework';

const DEFAULT_PROBABILITIES = {
  bull: 0.25,
  base: 0.55,
  bear: 0.2
} as const;

const SOURCE_NOTE = '样例情景，需人工复核。Scenario assumptions are manual/rule-based and should be reviewed before investment use. This is not investment advice.';

type ManualScenarioConfig = {
  ticker: string;
  companyName: string;
  currency: string;
  currentPrice?: number;
  fiscalYear?: string;
  scenarios: {
    bull: {
      coreAssumptions: string[];
      epsFullYear?: number;
      valuationMultiple?: number;
      triggerConditions: string[];
    };
    base: {
      coreAssumptions: string[];
      epsFullYear?: number;
      valuationMultiple?: number;
      triggerConditions: string[];
    };
    bear: {
      coreAssumptions: string[];
      epsFullYear?: number;
      valuationMultiple?: number;
      triggerConditions: string[];
    };
  };
  dataStatus: 'manual' | 'mock';
};

const MANUAL_SCENARIO_CONFIGS: Record<string, ManualScenarioConfig> = {
  MU: {
    ticker: 'MU',
    companyName: 'Micron Technology Inc.',
    currency: 'USD',
    fiscalYear: '2026',
    dataStatus: 'mock',
    scenarios: {
      bull: {
        coreAssumptions: ['Placeholder: 乐观假设示例'],
        epsFullYear: 7.0,
        valuationMultiple: 16.0,
        triggerConditions: ['Placeholder: 触发条件示例'],
      },
      base: {
        coreAssumptions: ['Placeholder: 基准假设示例'],
        epsFullYear: 5.0,
        valuationMultiple: 14.0,
        triggerConditions: ['Placeholder: 触发条件示例'],
      },
      bear: {
        coreAssumptions: ['Placeholder: 悲观假设示例'],
        epsFullYear: 3.0,
        valuationMultiple: 11.0,
        triggerConditions: ['Placeholder: 触发条件示例'],
      },
    },
  },
  NVDA: {
    ticker: 'NVDA',
    companyName: 'NVIDIA Corporation',
    currency: 'USD',
    fiscalYear: '2026',
    dataStatus: 'mock',
    scenarios: {
      bull: {
        coreAssumptions: ['Placeholder: 乐观假设示例'],
        epsFullYear: 10.0,
        valuationMultiple: 30.0,
        triggerConditions: ['Placeholder: 触发条件示例'],
      },
      base: {
        coreAssumptions: ['Placeholder: 基准假设示例'],
        epsFullYear: 8.0,
        valuationMultiple: 25.0,
        triggerConditions: ['Placeholder: 触发条件示例'],
      },
      bear: {
        coreAssumptions: ['Placeholder: 悲观假设示例'],
        epsFullYear: 6.0,
        valuationMultiple: 20.0,
        triggerConditions: ['Placeholder: 触发条件示例'],
      },
    },
  },
};

function buildScenarioFromConfig(
  caseType: 'bull' | 'base' | 'bear',
  label: string,
  config: ManualScenarioConfig['scenarios'][keyof ManualScenarioConfig['scenarios']],
  source: ScenarioSource,
  currentPrice?: number | null
): BullBaseBearScenario {
  const targetPrice = calculatePeTargetPrice(config.epsFullYear, config.valuationMultiple);
  const impliedReturn = targetPrice !== null ? calculateImpliedReturn(targetPrice, currentPrice) : null;

  let derivationNote = '';
  if (config.epsFullYear !== undefined && config.valuationMultiple !== undefined) {
    derivationNote = `目标价 = 预期 EPS $${config.epsFullYear.toFixed(2)} × PE ${config.valuationMultiple.toFixed(1)}x`;
  }

  return {
    case: caseType,
    label,
    probability: DEFAULT_PROBABILITIES[caseType],
    coreAssumptions: config.coreAssumptions,
    revenueAssumption: {},
    epsAssumption: { fullYear: config.epsFullYear },
    valuationMultiple: config.valuationMultiple,
    valuationMethod: 'pe_multiple',
    targetPrice,
    impliedReturnPct: impliedReturn,
    triggerConditions: config.triggerConditions,
    source,
    derivationNote,
  };
}

/**
 * 获取手动维护的情景分析
 * 仅支持配置中定义的 ticker
 */
export function getManualScenario(
  ticker: string,
  options: {
    currentPrice?: number;
  } = {}
): BullBaseBearScenarioSummary | null {
  const tickerUpper = ticker.toUpperCase();
  const config = MANUAL_SCENARIO_CONFIGS[tickerUpper];

  if (!config) {
    return null;
  }

  const scenarios: BullBaseBearScenario[] = [
    buildScenarioFromConfig('bull', '乐观', config.scenarios.bull, 'manual_override', options.currentPrice),
    buildScenarioFromConfig('base', '基准', config.scenarios.base, 'manual_override', options.currentPrice),
    buildScenarioFromConfig('bear', '悲观', config.scenarios.bear, 'manual_override', options.currentPrice),
  ];

  const warnings: string[] = [];
  if (config.dataStatus === 'mock') {
    warnings.push('样例情景，需人工复核。');
    warnings.push('EPS和估值倍数为样例 placeholder，非真实预测。');
    warnings.push('仅供研究框架验证，不构成投资建议。');
  }

  return buildScenarioSummary({
    ticker: config.ticker,
    companyName: config.companyName,
    currency: config.currency,
    currentPrice: options.currentPrice,
    fiscalYear: config.fiscalYear,
    scenarios,
    sourceNote: buildScenarioSourceNote({
      customNote: SOURCE_NOTE,
      hasUnverifiedData: config.dataStatus === 'mock'
    }),
    dataStatus: config.dataStatus === 'manual' ? 'partial' : 'minimal',
    warnings,
  });
}

/**
 * 获取支持的 ticker 列表
 */
export function getSupportedManualTickers(): string[] {
  return Object.keys(MANUAL_SCENARIO_CONFIGS);
}

/**
 * 检查 ticker 是否支持手动情景
 */
export function supportsManualScenario(ticker: string): boolean {
  return ticker.toUpperCase() in MANUAL_SCENARIO_CONFIGS;
}
