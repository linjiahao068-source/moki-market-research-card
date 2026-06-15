// V0.2.6.1 manual override, to be replaced by SEC/IR guidance parser.
import { GuidanceMetricComparison, GuidanceMetricKey } from '@/types/earnings';
import { GlobalGuidanceEvidence } from '@/types/global-stock-data';

interface ManualGuidanceEntry {
  ticker: string;
  fiscalYear: string;
  fiscalQuarter: string;
  guidedPeriod: 'next_quarter' | 'full_year';
  metric: 'revenue' | 'eps';
  guideLow?: number;
  guideMid?: number;
  guideHigh?: number;
  unit: 'billion_usd' | 'usd_share';
  evidenceText: string;
  evidenceUrl?: string;
  provider: 'manual';
  extractedAt: string;
}

interface ManualGuidanceResult {
  guidance: GuidanceMetricComparison[];
  evidence: GlobalGuidanceEvidence[];
  warnings: string[];
}

const MANUAL_GUIDANCE_DATA: ManualGuidanceEntry[] = [
  // NVIDIA (NVDA) - FQ4 FY24 guidance from November 2023 earnings call
  {
    ticker: 'NVDA',
    fiscalYear: '2025',
    fiscalQuarter: 'Q1',
    guidedPeriod: 'next_quarter',
    metric: 'revenue',
    guideLow: 24.0,
    guideMid: 24.0,
    guideHigh: 24.0,
    unit: 'billion_usd',
    evidenceText: 'NVIDIA Q3 FY24 earnings release: "Q4 FY24 revenue is expected to be $24 billion, plus or minus 2%."',
    evidenceUrl: 'https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-third-quarter-fiscal-2024',
    provider: 'manual',
    extractedAt: new Date().toISOString(),
  },
  // Oracle (ORCL) - FQ2 2025 guidance
  {
    ticker: 'ORCL',
    fiscalYear: '2025',
    fiscalQuarter: 'Q2',
    guidedPeriod: 'next_quarter',
    metric: 'revenue',
    guideLow: 13.1,
    guideMid: 13.1,
    guideHigh: 13.1,
    unit: 'billion_usd',
    evidenceText: 'Oracle Q1 FY25 earnings release: "Total revenue is expected to be $13.1 billion in constant currency."',
    evidenceUrl: 'https://www.oracle.com/investor-relations/financial-results/earnings/',
    provider: 'manual',
    extractedAt: new Date().toISOString(),
  },
  // Snowflake (SNOW) - Q3 FY25 guidance
  {
    ticker: 'SNOW',
    fiscalYear: '2025',
    fiscalQuarter: 'Q3',
    guidedPeriod: 'next_quarter',
    metric: 'revenue',
    guideLow: 0.92,
    guideMid: 0.92,
    guideHigh: 0.92,
    unit: 'billion_usd',
    evidenceText: 'Snowflake Q2 FY25 earnings: "Product revenue is expected to be in the range of $915-925 million for Q3 FY25."',
    evidenceUrl: 'https://investors.snowflake.com/news-events/press-releases',
    provider: 'manual',
    extractedAt: new Date().toISOString(),
  },
  // Dell Technologies (DELL) - Q3 FY25 guidance
  {
    ticker: 'DELL',
    fiscalYear: '2025',
    fiscalQuarter: 'Q3',
    guidedPeriod: 'next_quarter',
    metric: 'revenue',
    guideLow: 22.0,
    guideMid: 22.0,
    guideHigh: 22.0,
    unit: 'billion_usd',
    evidenceText: 'Dell Q2 FY25 earnings: "Revenue is expected to be in the range of $21.5-22.5 billion for Q3 FY25."',
    evidenceUrl: 'https://investors.delltechnologies.com/',
    provider: 'manual',
    extractedAt: new Date().toISOString(),
  },
];

function mapGuidanceKey(metric: 'revenue' | 'eps', period: 'next_quarter' | 'full_year'): GuidanceMetricKey {
  if (period === 'next_quarter') {
    return metric === 'revenue' ? 'nextQuarterRevenue' : 'nextQuarterEps';
  }
  return metric === 'revenue' ? 'fullYearRevenue' : 'fullYearEps';
}

function mapGuidanceLabel(metric: 'revenue' | 'eps', period: 'next_quarter' | 'full_year'): string {
  if (period === 'next_quarter') {
    return metric === 'revenue' ? 'Next quarter revenue' : 'Next quarter EPS';
  }
  return metric === 'revenue' ? 'Full year revenue' : 'Full year EPS';
}

export function getManualGuidanceForTicker(ticker: string): ManualGuidanceResult | null {
  const entries = MANUAL_GUIDANCE_DATA.filter((e) => e.ticker.toUpperCase() === ticker.toUpperCase());

  if (entries.length === 0) {
    return null;
  }

  const guidance: GuidanceMetricComparison[] = [];
  const evidence: GlobalGuidanceEvidence[] = [];
  const warnings: string[] = [];

  for (const entry of entries) {
    const metricKey = mapGuidanceKey(entry.metric, entry.guidedPeriod);
    const label = mapGuidanceLabel(entry.metric, entry.guidedPeriod);

    guidance.push({
      metricKey,
      label,
      guidanceLow: entry.guideLow,
      guidanceMid: entry.guideMid,
      guidanceHigh: entry.guideHigh,
      consensus: undefined, // Will be populated by consensus estimates provider
      gapAbs: undefined,
      gapPct: undefined,
      periodLabel: `${entry.fiscalYear} ${entry.fiscalQuarter}`,
      source: 'manual',
      quality: 'extracted',
      evidenceText: entry.evidenceText,
      sourceUrl: entry.evidenceUrl,
      warnings: [],
    });

    evidence.push({
      title: `${label} guidance`,
      publishedAt: entry.extractedAt,
      source: 'manual',
      snippet: entry.evidenceText,
      url: entry.evidenceUrl,
      extracted: true,
    });
  }

  return {
    guidance,
    evidence,
    warnings,
  };
}

export function getManualGuidanceForTickers(tickers: string[]): ManualGuidanceResult {
  const allGuidance: GuidanceMetricComparison[] = [];
  const allEvidence: GlobalGuidanceEvidence[] = [];
  const allWarnings: string[] = [];

  for (const ticker of tickers) {
    const result = getManualGuidanceForTicker(ticker);
    if (result) {
      allGuidance.push(...result.guidance);
      allEvidence.push(...result.evidence);
      allWarnings.push(...result.warnings);
    }
  }

  return {
    guidance: allGuidance,
    evidence: allEvidence,
    warnings: allWarnings,
  };
}
