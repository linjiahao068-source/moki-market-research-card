export type EarningsMetricKey = 'revenue' | 'netIncome' | 'eps';

export type MetricSource = 'sec-edgar' | 'fmp' | 'eastmoney' | 'yahoo' | 'mock' | 'manual' | 'extracted';

export type MetricQuality = 'verified' | 'estimated' | 'extracted' | 'missing' | 'fallback';

export interface EarningsMetricComparison {
  metricKey: EarningsMetricKey;
  label: string;
  currency?: string;
  actual?: number;
  estimate?: number;
  surpriseAbs?: number;
  surprisePct?: number;
  yoyPct?: number;
  fiscalYear?: string;
  fiscalQuarter?: string;
  periodEnd?: string;
  periodLabel?: string;
  actualSource?: MetricSource;
  estimateSource?: MetricSource;
  quality?: MetricQuality;
  warnings: string[];
}

export type GuidanceMetricKey = 'nextQuarterRevenue' | 'nextQuarterEps' | 'fullYearRevenue' | 'fullYearEps';

export interface GuidanceMetricComparison {
  metricKey: GuidanceMetricKey;
  label: string;
  guidanceLow?: number;
  guidanceMid?: number;
  guidanceHigh?: number;
  consensus?: number;
  gapAbs?: number;
  gapPct?: number;
  periodLabel?: string;
  source?: MetricSource;
  quality?: MetricQuality;
  evidenceText?: string;
  sourceUrl?: string;
  warnings: string[];
}

import { GlobalGuidanceEvidence } from './global-stock-data';

export interface EarningsSnapshotData {
  provider: MetricSource;
  fetchedAt: string;
  companyName: string;
  symbol: string;
  fiscalYear?: string;
  fiscalQuarter?: string;
  reportDate?: string;
  earningsDate?: string;
  metrics: EarningsMetricComparison[];
  guidance: GuidanceMetricComparison[];
  guidanceEvidence?: GlobalGuidanceEvidence[];
  sourceLinks: Array<{
    label: string;
    url: string;
  }>;
  warnings: string[];
}
