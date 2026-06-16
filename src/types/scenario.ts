export type ScenarioCase = 'bull' | 'base' | 'bear';

export type ScenarioSource = 'manual_override' | 'serenity_framework' | 'rule_based' | 'mock';

export type ValuationMethod = 'pe_multiple' | 'ps_multiple' | 'ev_ebitda' | 'dcf' | 'peer_comps' | 'not_specified';

export interface RevenueAssumption {
  nextQuarter?: number;
  fullYear?: number;
  nextQuarterYoyPercent?: number;
  fullYearYoyPercent?: number;
}

export interface EpsAssumption {
  nextQuarter?: number;
  fullYear?: number;
  nextQuarterYoyPercent?: number;
  fullYearYoyPercent?: number;
}

export interface BullBaseBearScenario {
  case: ScenarioCase;
  label: string;
  probability: number; // 0-1 之间的概率值
  coreAssumptions: string[];
  revenueAssumption: RevenueAssumption;
  epsAssumption: EpsAssumption;
  grossMarginAssumption?: number; // 百分比
  valuationMultiple?: number;
  valuationMethod: ValuationMethod;
  targetPrice?: number | null;
  impliedReturnPct?: number | null;
  triggerConditions?: string[];
  source: ScenarioSource;
}

export interface RiskRewardSummary {
  expectedReturnPct: number;
  upsideDownsideRatio: number;
  bullCaseUpsidePct?: number | null;
  bearCaseDownsidePct?: number | null;
  summaryText?: string;
}

export type ScenarioDataStatus = 'complete' | 'partial' | 'minimal' | 'placeholder';

export interface BullBaseBearScenarioSummary {
  ticker: string;
  companyName: string;
  currency: string;
  currentPrice?: number;
  fiscalYear?: string;
  scenarios: BullBaseBearScenario[];
  probabilityWeightedTargetPrice?: number | null;
  riskRewardSummary?: RiskRewardSummary;
  sourceNote: string;
  dataStatus: ScenarioDataStatus;
  warnings?: string[];
}
