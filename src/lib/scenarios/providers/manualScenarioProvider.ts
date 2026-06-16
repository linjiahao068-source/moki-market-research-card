import {
  BullBaseBearScenario,
  BullBaseBearScenarioSummary,
  ScenarioSource
} from '@/types/scenario';
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

const SOURCE_NOTE = '样例情景，需人工复核。Scenario assumptions are manual/rule-based and should be reviewed before investment use. ' +
  'This is not investment advice.';

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
  NVDA: {
    ticker: 'NVDA',
    companyName: 'NVIDIA Corporation',
    currency: 'USD',
    fiscalYear: '2026',
    dataStatus: 'mock',
    scenarios: {
      bull: {
        coreAssumptions: [
          'Placeholder: 乐观假设示例'
        ],
        epsFullYear: 10, // 样例 placeholder - 非真实预测
        valuationMultiple: 30, // 样例 placeholder
        triggerConditions: [
          'Placeholder: 触发条件示例'
        ]
      },
      base: {
        coreAssumptions: [
          'Placeholder: 基准假设示例'
        ],
        epsFullYear: 8, // 样例 placeholder - 非真实预测
        valuationMultiple: 25, // 样例 placeholder
        triggerConditions: [
          'Placeholder: 触发条件示例'
        ]
      },
      bear: {
        coreAssumptions: [
          'Placeholder: 悲观假设示例'
        ],
        epsFullYear: 6, // 样例 placeholder - 非真实预测
        valuationMultiple: 20, // 样例 placeholder
        triggerConditions: [
          'Placeholder: 触发条件示例'
        ]
      }
    }
  },
  ORCL: {
    ticker: 'ORCL',
    companyName: 'Oracle Corporation',
    currency: 'USD',
    fiscalYear: '2026',
    dataStatus: 'mock',
    scenarios: {
      bull: {
        coreAssumptions: [
          'Placeholder: 乐观假设示例'
        ],
        epsFullYear: 7, // 样例 placeholder - 非真实预测
        valuationMultiple: 20, // 样例 placeholder
        triggerConditions: [
          'Placeholder: 触发条件示例'
        ]
      },
      base: {
        coreAssumptions: [
          'Placeholder: 基准假设示例'
        ],
        epsFullYear: 6, // 样例 placeholder - 非真实预测
        valuationMultiple: 18, // 样例 placeholder
        triggerConditions: [
          'Placeholder: 触发条件示例'
        ]
      },
      bear: {
        coreAssumptions: [
          'Placeholder: 悲观假设示例'
        ],
        epsFullYear: 5, // 样例 placeholder - 非真实预测
        valuationMultiple: 15, // 样例 placeholder
        triggerConditions: [
          'Placeholder: 触发条件示例'
        ]
      }
    }
  },
  SNOW: {
    ticker: 'SNOW',
    companyName: 'Snowflake Inc.',
    currency: 'USD',
    fiscalYear: '2026',
    dataStatus: 'mock',
    scenarios: {
      bull: {
        coreAssumptions: [
          'Placeholder: 乐观假设示例'
        ],
        epsFullYear: 3, // 样例 placeholder - 非真实预测
        valuationMultiple: 40, // 样例 placeholder
        triggerConditions: [
          'Placeholder: 触发条件示例'
        ]
      },
      base: {
        coreAssumptions: [
          'Placeholder: 基准假设示例'
        ],
        epsFullYear: 2, // 样例 placeholder - 非真实预测
        valuationMultiple: 35, // 样例 placeholder
        triggerConditions: [
          'Placeholder: 触发条件示例'
        ]
      },
      bear: {
        coreAssumptions: [
          'Placeholder: 悲观假设示例'
        ],
        epsFullYear: 1, // 样例 placeholder - 非真实预测
        valuationMultiple: 28, // 样例 placeholder
        triggerConditions: [
          'Placeholder: 触发条件示例'
        ]
      }
    }
  },
  DELL: {
    ticker: 'DELL',
    companyName: 'Dell Technologies Inc.',
    currency: 'USD',
    fiscalYear: '2026',
    dataStatus: 'mock',
    scenarios: {
      bull: {
        coreAssumptions: [
          'Placeholder: 乐观假设示例'
        ],
        epsFullYear: 8, // 样例 placeholder - 非真实预测
        valuationMultiple: 14, // 样例 placeholder
        triggerConditions: [
          'Placeholder: 触发条件示例'
        ]
      },
      base: {
        coreAssumptions: [
          'Placeholder: 基准假设示例'
        ],
        epsFullYear: 6, // 样例 placeholder - 非真实预测
        valuationMultiple: 12, // 样例 placeholder
        triggerConditions: [
          'Placeholder: 触发条件示例'
        ]
      },
      bear: {
        coreAssumptions: [
          'Placeholder: 悲观假设示例'
        ],
        epsFullYear: 5, // 样例 placeholder - 非真实预测
        valuationMultiple: 10, // 样例 placeholder
        triggerConditions: [
          'Placeholder: 触发条件示例'
        ]
      }
    }
  },
  MU: {
    ticker: 'MU',
    companyName: 'Micron Technology Inc.',
    currency: 'USD',
    fiscalYear: '2026',
    dataStatus: 'mock',
    scenarios: {
      bull: {
        coreAssumptions: [
          'Placeholder: 乐观假设示例'
        ],
        epsFullYear: 7, // 样例 placeholder - 非真实预测
        valuationMultiple: 16, // 样例 placeholder
        triggerConditions: [
          'Placeholder: 触发条件示例'
        ]
      },
      base: {
        coreAssumptions: [
          'Placeholder: 基准假设示例'
        ],
        epsFullYear: 5, // 样例 placeholder - 非真实预测
        valuationMultiple: 14, // 样例 placeholder
        triggerConditions: [
          'Placeholder: 触发条件示例'
        ]
      },
      bear: {
        coreAssumptions: [
          'Placeholder: 悲观假设示例'
        ],
        epsFullYear: 3, // 样例 placeholder - 非真实预测
        valuationMultiple: 11, // 样例 placeholder
        triggerConditions: [
          'Placeholder: 触发条件示例'
        ]
      }
    }
  }
};

function buildScenarioFromConfig(
  caseType: 'bull' | 'base' | 'bear',
  label: string,
  config: ManualScenarioConfig['scenarios'][keyof ManualScenarioConfig['scenarios']],
  source: ScenarioSource
): BullBaseBearScenario {
  const targetPrice = calculatePeTargetPrice(config.epsFullYear, config.valuationMultiple);

  return {
    case: caseType,
    label,
    probability: DEFAULT_PROBABILITIES[caseType],
    coreAssumptions: config.coreAssumptions,
    revenueAssumption: {},
    epsAssumption: {
      fullYear: config.epsFullYear
    },
    valuationMultiple: config.valuationMultiple,
    valuationMethod: 'pe_multiple',
    targetPrice,
    impliedReturnPct: null, // Will be calculated by scenarioCalculator
    triggerConditions: config.triggerConditions,
    source
  };
}

/**
 * 获取手动维护的情景分析
 * 仅支持配置中定义的 ticker
 */
export async function getManualScenario(
  ticker: string,
  options: {
    currentPrice?: number;
  } = {}
): Promise<BullBaseBearScenarioSummary | null> {
  const tickerUpper = ticker.toUpperCase();
  const config = MANUAL_SCENARIO_CONFIGS[tickerUpper];

  if (!config) {
    return null;
  }

  const scenarios: BullBaseBearScenario[] = [
    buildScenarioFromConfig('bull', '乐观情景', config.scenarios.bull, 'manual_override'),
    buildScenarioFromConfig('base', '基准情景', config.scenarios.base, 'manual_override'),
    buildScenarioFromConfig('bear', '悲观情景', config.scenarios.bear, 'manual_override')
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
    warnings
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
