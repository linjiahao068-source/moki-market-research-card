import { BullBaseBearScenarioSummary } from '@/types/scenario';
import { EarningsSnapshotData } from '@/types/earnings';
import { BasicCompanyData } from '@/types/basic-data';
import { buildScenarioSummary, calculateImpliedReturn } from '../scenarioCalculator';
import { buildScenarioSourceNote } from '../serenityScenarioFramework';
import { getManualScenario, supportsManualScenario } from './manualScenarioProvider';
import { getRuleBasedScenario, canGenerateRuleBasedScenario } from './ruleBasedScenarioProvider';

type GetScenariosParams = {
  ticker: string;
  companyName?: string;
  currentPrice?: number;
  currency?: string;
  earningsSnapshot?: EarningsSnapshotData | null;
  basicData?: BasicCompanyData | null;
};

/**
 * 获取 Bull/Base/Bear 情景分析
 * 优先级：manual -> rule-based -> unavailable
 */
export function getBullBaseBearScenarios(
  params: GetScenariosParams
): BullBaseBearScenarioSummary {
  const {
    ticker,
    companyName: inputCompanyName,
    currentPrice: inputCurrentPrice,
    currency: inputCurrency,
    earningsSnapshot,
    basicData,
  } = params;

  // 从 basicData 补充缺失的信息
  const currentPrice = inputCurrentPrice ?? (basicData?.quote?.price ? parseFloat(basicData.quote.price) : undefined);
  const currency = inputCurrency ?? basicData?.profile?.currency ?? 'USD';
  const companyName = inputCompanyName ?? basicData?.profile?.companyName ?? earningsSnapshot?.companyName ?? ticker.toUpperCase();

  // 1. 优先尝试 manual scenario
  if (supportsManualScenario(ticker)) {
    const manualScenario = getManualScenario(ticker, { currentPrice });
    if (manualScenario) {
      return manualScenario;
    }
  }

  // 2. 尝试 rule-based scenario
  if (canGenerateRuleBasedScenario(earningsSnapshot)) {
    const ruleBasedScenario = getRuleBasedScenario({
      ticker,
      companyName,
      currency,
      currentPrice,
      earningsSnapshot,
    });
    if (ruleBasedScenario) {
      return ruleBasedScenario;
    }
  }

  // 3. 返回 unavailable
  return buildUnavailableScenario({
    ticker,
    companyName,
    currency,
    currentPrice,
  });
}

function buildUnavailableScenario({
  ticker,
  companyName,
  currency,
  currentPrice,
}: {
  ticker: string;
  companyName: string;
  currency: string;
  currentPrice?: number;
}): BullBaseBearScenarioSummary {
  return {
    ticker: ticker.toUpperCase(),
    companyName,
    currency,
    currentPrice,
    fiscalYear: undefined,
    scenarios: [],
    probabilityWeightedTargetPrice: null,
    riskRewardSummary: undefined,
    sourceNote: buildScenarioSourceNote({
      customNote: '无足够数据生成情景分析。This is not investment advice.',
      hasUnverifiedData: false,
    }),
    dataStatus: 'minimal',
    warnings: [
      '无足够数据生成情景分析。',
      '需要补充 EPS/consensus 数据。',
    ],
  };
}

// 导出所有 provider
export * from './manualScenarioProvider';
export * from './ruleBasedScenarioProvider';
