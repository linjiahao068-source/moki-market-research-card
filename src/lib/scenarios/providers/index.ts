import { BullBaseBearScenarioSummary } from '@/types/scenario';
import { EarningsSnapshotData } from '@/types/earnings';
import { BasicCompanyData } from '@/types/basic-data';
import {
  buildScenarioSummary,
  buildScenariosFromRealData
} from '../scenarioCalculator';
import { buildScenarioSourceNote } from '../serenityScenarioFramework';
import { getAdvancedScenarios } from './advancedScenarioProvider';
import { getManualScenario, supportsManualScenario } from './manualScenarioProvider';
import { getRuleBasedScenario, canGenerateRuleBasedScenario } from './ruleBasedScenarioProvider';

type GetScenariosParams = {
  ticker: string;
  companyName?: string;
  currentPrice?: number | null;
  currency?: string;
  earningsSnapshot?: EarningsSnapshotData | null;
  basicData?: BasicCompanyData | null;
};

/**
 * 获取 Bull/Base/Bear 情景分析
 * 优先级：真实数据 → manual → rule-based → unavailable
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

  // 从 basicData/earningsSnapshot 补充缺失信息
  let currentPrice: number | null = null;
  if (inputCurrentPrice !== null && inputCurrentPrice !== undefined) {
    currentPrice = inputCurrentPrice;
  } else if (basicData?.quote?.price) {
    currentPrice = parseFloat(basicData.quote.price);
  } else if (earningsSnapshot?.currentPrice !== null && earningsSnapshot?.currentPrice !== undefined) {
    currentPrice = earningsSnapshot.currentPrice;
  }

  const currency = inputCurrency ?? basicData?.profile?.currency ?? 'USD';
  const companyName = inputCompanyName ?? basicData?.profile?.companyName ?? earningsSnapshot?.companyName ?? ticker.toUpperCase();

  // Phase 3: 优先用增强真实数据构建
  if (earningsSnapshot && earningsSnapshot.provider !== 'mock') {
    const enhancedSnapshot = earningsSnapshot as EarningsSnapshotData & { historicalQuarters?: unknown[] };
    const advancedScenario = getAdvancedScenarios({
      ticker,
      companyName,
      basicData: basicData ?? undefined,
      earningsSnapshot,
      historicalQuarters: enhancedSnapshot.historicalQuarters,
    });

    if (advancedScenario.dataStatus !== 'placeholder') {
      return advancedScenario;
    }
  }

  // 备选：用基础真实数据构建
  const realDataScenarios = buildScenariosFromRealData(ticker, companyName, earningsSnapshot);
  if (realDataScenarios.length > 0) {
    return buildScenarioSummary({
      ticker,
      companyName,
      currency,
      currentPrice,
      fiscalYear: earningsSnapshot?.fiscalYear,
      scenarios: realDataScenarios,
      sourceNote: buildScenarioSourceNote({
        customNote: '基于分析师共识预期和市场估值倍数的情景分析，仅供参考，不构成投资建议。',
        hasUnverifiedData: true
      }),
      dataStatus: 'partial',
      warnings: ['数据来源：Yahoo Finance', '仅供研究框架验证，不构成投资建议。'],
    });
  }

  // 备选：Manual scenario（仅针对特定 ticker）
  if (supportsManualScenario(ticker)) {
    const manualScenario = getManualScenario(ticker, { currentPrice: currentPrice ?? undefined });
    if (manualScenario) {
      return manualScenario;
    }
  }

  // 备选：Rule-based
  if (canGenerateRuleBasedScenario(earningsSnapshot)) {
    const ruleBasedScenario = getRuleBasedScenario({
      ticker,
      companyName,
      currency,
      currentPrice: currentPrice ?? undefined,
      earningsSnapshot,
    });
    if (ruleBasedScenario) {
      return ruleBasedScenario;
    }
  }

  // 兜底：Unavailable
  return buildUnavailableScenario({
    ticker,
    companyName,
    currency,
    currentPrice: currentPrice ?? undefined,
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
      customNote: '暂未生成该公司的买方情景推演，后续将接入更多估值和预期数据。',
      hasUnverifiedData: false
    }),
    dataStatus: 'minimal',
    warnings: [
      '暂未生成该公司的买方情景推演，后续将接入更多估值和预期数据。',
      '需要补充 EPS/consensus 数据。'
    ],
  };
}

// 导出所有 provider
export * from './manualScenarioProvider';
export * from './ruleBasedScenarioProvider';
