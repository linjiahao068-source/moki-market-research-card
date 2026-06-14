import { BasicCompanyData } from '@/types/basic-data';
import { EarningsMetricComparison, EarningsSnapshotData } from '@/types/earnings';

interface FinancialFactEvidence {
  periodType?: 'duration' | 'instant' | string;
  end?: string;
  filed?: string;
  form?: string;
  fiscalYear?: string;
  fiscalQuarter?: string;
}

type FinancialsWithDilutedEps = NonNullable<BasicCompanyData['financials']> & {
  dilutedEps?: string;
};

interface SecQuarterActualsInput {
  basicData?: BasicCompanyData;
  financials?: FinancialsWithDilutedEps;
  financialFactEvidence?: Partial<Record<'revenue' | 'netIncome' | 'eps' | 'dilutedEps', FinancialFactEvidence>>;
  latestFiling?: BasicCompanyData['latestFiling'];
  companyName?: string;
  symbol?: string;
  sourceLinks?: BasicCompanyData['sourceLinks'];
}

function normalizeInput(input: BasicCompanyData | SecQuarterActualsInput): Required<Pick<SecQuarterActualsInput, 'sourceLinks'>> & SecQuarterActualsInput {
  if ('provider' in input) {
    return {
      basicData: input,
      financials: input.financials,
      financialFactEvidence: undefined,
      latestFiling: input.latestFiling,
      companyName: input.profile?.companyName ?? input.security.companyName,
      symbol: input.security.symbol ?? input.security.numericCode,
      sourceLinks: input.sourceLinks,
    };
  }

  return {
    ...input,
    sourceLinks: input.sourceLinks ?? input.basicData?.sourceLinks ?? [],
  };
}

function parseNumericValue(value?: string) {
  if (!value) {
    return undefined;
  }

  const numericValue = Number(value.replace(/[^0-9.-]/g, ''));

  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function isCurrentQuarterEvidence(evidence: FinancialFactEvidence | undefined, reportDate: string | undefined) {
  return Boolean(evidence && evidence.periodType === 'duration' && evidence.end && reportDate && evidence.end === reportDate);
}

function buildActualMetric({
  metricKey,
  label,
  rawValue,
  evidence,
  reportDate,
  warnings,
}: {
  metricKey: 'revenue' | 'netIncome' | 'eps';
  label: string;
  rawValue?: string;
  evidence?: FinancialFactEvidence;
  reportDate?: string;
  warnings: string[];
}): EarningsMetricComparison {
  const metricWarnings: string[] = [];

  if (!rawValue) {
    metricWarnings.push(`${label} not found in SEC period-aligned financial facts.`);
  }

  if (!isCurrentQuarterEvidence(evidence, reportDate)) {
    metricWarnings.push(`${label} was not used because evidence is missing, not duration, or does not match latest filing reportDate.`);
  }

  const actual = metricWarnings.length === 0 ? parseNumericValue(rawValue) : undefined;

  if (rawValue && actual === undefined) {
    metricWarnings.push(`${label} could not be parsed as a numeric value.`);
  }

  warnings.push(...metricWarnings);

  return {
    metricKey,
    label,
    currency: metricKey === 'eps' ? 'USD/share' : 'USD',
    actual,
    estimate: undefined,
    surpriseAbs: undefined,
    surprisePct: undefined,
    yoyPct: findPriorYearSameQuarterFact(),
    fiscalYear: evidence?.fiscalYear,
    fiscalQuarter: evidence?.fiscalQuarter,
    periodEnd: evidence?.end,
    periodLabel: evidence?.end ? `Three months ended ${evidence.end}` : reportDate ? `Fiscal quarter ended ${reportDate}` : undefined,
    actualSource: actual === undefined ? undefined : 'sec-edgar',
    estimateSource: undefined,
    quality: actual === undefined ? 'missing' : 'verified',
    warnings: metricWarnings,
  };
}

export function findPriorYearSameQuarterFact(): undefined {
  return undefined;
}

export function buildSecQuarterActuals(input: BasicCompanyData | SecQuarterActualsInput): Partial<EarningsSnapshotData> {
  const normalizedInput = normalizeInput(input);
  const financials = normalizedInput.financials;
  const evidence = normalizedInput.financialFactEvidence;
  const latestFiling = normalizedInput.latestFiling ?? normalizedInput.basicData?.latestFiling;
  const reportDate = latestFiling?.fiscalPeriod;
  const warnings: string[] = [];

  const metrics: EarningsMetricComparison[] = [
    buildActualMetric({
      metricKey: 'revenue',
      label: 'Revenue',
      rawValue: financials?.revenue,
      evidence: evidence?.revenue,
      reportDate,
      warnings,
    }),
    buildActualMetric({
      metricKey: 'netIncome',
      label: 'Net income',
      rawValue: financials?.netIncome,
      evidence: evidence?.netIncome,
      reportDate,
      warnings,
    }),
    buildActualMetric({
      metricKey: 'eps',
      label: 'Diluted EPS',
      rawValue: financials?.dilutedEps ?? financials?.eps,
      evidence: evidence?.dilutedEps ?? evidence?.eps,
      reportDate,
      warnings,
    }),
  ];

  if (!financials?.dilutedEps && !financials?.eps) {
    warnings.push('Diluted EPS not found in SEC period-aligned financial facts.');
  }

  warnings.push('Prior-year same-quarter SEC fact selection is not implemented yet; YoY values are intentionally left blank.');

  return {
    provider: 'sec-edgar',
    fetchedAt: normalizedInput.basicData?.fetchedAt ?? new Date().toISOString(),
    companyName: normalizedInput.companyName ?? normalizedInput.basicData?.security.companyName ?? 'Unknown Company',
    symbol: normalizedInput.symbol ?? normalizedInput.basicData?.security.symbol ?? normalizedInput.basicData?.security.numericCode ?? '--',
    fiscalYear: metrics.find((metric) => metric.fiscalYear)?.fiscalYear,
    fiscalQuarter: metrics.find((metric) => metric.fiscalQuarter)?.fiscalQuarter,
    reportDate,
    metrics,
    guidance: [],
    sourceLinks: normalizedInput.sourceLinks,
    warnings,
  };
}
