import { BasicCompanyData } from '@/types/basic-data';
import { EarningsMetricComparison, EarningsMetricKey, EarningsSnapshotData, GuidanceMetricComparison } from '@/types/earnings';
import { GlobalAnalystEstimate, GlobalQuarterFinancial, GlobalGuidanceEvidence } from '@/types/global-stock-data';
import { SecurityRecord } from '@/types/security';
import { getBasicCompanyData } from '@/lib/dataProviders/getBasicCompanyData';
import { fetchEastmoneyQuarterFinancials } from '@/lib/globalStockData/eastmoneyFinancials';
import { fetchEastmoneyKeyIndicators } from '@/lib/globalStockData/eastmoneyIndicators';
import { getYahooSymbol } from '@/lib/globalStockData/marketSymbol';
import { fetchYahooQuoteSummary } from '@/lib/globalStockData/yahooQuoteSummary';
import { resolveSecurityInput } from '@/lib/security/resolveSecurityInput';
import { calcSurprise, safePctChange } from './earningsMath';
import { fetchFmpEarningsEstimates } from './fmpEarningsEstimatesProvider';
import { buildSecQuarterActuals } from './secQuarterActualsProvider';
import { earningsProviderConfig } from '@/lib/config/earningsProviders';
import { getGuidanceData } from './guidanceProvider';
import { getConsensusEstimates, selectCurrentQuarterConsensus, selectNextQuarterRevenueConsensus } from '@/lib/expectations';

interface GlobalEarningsProviderInput {
  query: string;
  security?: SecurityRecord;
  basicData?: BasicCompanyData;
}

interface ActualMetricSource {
  value?: number;
  source?: 'eastmoney' | 'yahoo' | 'sec-edgar' | 'fmp';
  fiscalYear?: string;
  fiscalQuarter?: string;
  periodEnd?: string;
  periodLabel?: string;
}

function resolveSecurity(query: string, security?: SecurityRecord) {
  if (security) {
    return security;
  }

  const resolution = resolveSecurityInput(query);

  if (resolution.status === 'ambiguous') {
    return undefined;
  }

  return resolution.status === 'matched' ? resolution.security : resolution.fallbackSecurity;
}

async function settle<T>(promise: Promise<T>): Promise<T | undefined> {
  try {
    return await promise;
  } catch {
    return undefined;
  }
}

function firstFinancialWithValue(financials: GlobalQuarterFinancial[] | undefined, key: keyof Pick<GlobalQuarterFinancial, 'revenue' | 'netIncome' | 'dilutedEps'>) {
  return financials?.find((item) => typeof item[key] === 'number');
}

function actualFromFinancial(
  metricKey: EarningsMetricKey,
  financial: GlobalQuarterFinancial | undefined,
  source: ActualMetricSource['source']
): ActualMetricSource {
  const value = metricKey === 'revenue'
    ? financial?.revenue
    : metricKey === 'netIncome'
      ? financial?.netIncome
      : financial?.dilutedEps;

  return {
    value,
    source: value === undefined ? undefined : source,
    fiscalYear: financial?.fiscalYear,
    fiscalQuarter: financial?.fiscalQuarter,
    periodEnd: financial?.periodEnd,
    periodLabel: financial?.periodEnd ? `Fiscal quarter ended ${financial.periodEnd}` : undefined,
  };
}

function normalizeActualSource(source: EarningsMetricComparison['actualSource']): ActualMetricSource['source'] {
  return source === 'sec-edgar' || source === 'fmp' ? source : undefined;
}

function actualFromMetric(metric: EarningsMetricComparison | undefined): ActualMetricSource {
  return {
    value: metric?.actual,
    source: normalizeActualSource(metric?.actualSource),
    fiscalYear: metric?.fiscalYear,
    fiscalQuarter: metric?.fiscalQuarter,
    periodEnd: metric?.periodEnd,
    periodLabel: metric?.periodLabel,
  };
}

function getEstimate(
  metricKey: 'revenue' | 'eps',
  yahooEstimates: GlobalAnalystEstimate[] | undefined,
  fmpMetrics: EarningsMetricComparison[] | undefined
) {
  const yahooEstimate = yahooEstimates?.find((item) => metricKey === 'revenue' ? item.revenueEstimate !== undefined : item.epsEstimate !== undefined);
  const fmpMetric = fmpMetrics?.find((metric) => metric.metricKey === metricKey);

  return metricKey === 'revenue'
    ? yahooEstimate?.revenueEstimate ?? fmpMetric?.estimate
    : yahooEstimate?.epsEstimate ?? fmpMetric?.estimate;
}

function buildMetric({
  metricKey,
  label,
  actual,
  estimate,
  estimateSource,
  yoyPct,
  missingWarning,
}: {
  metricKey: EarningsMetricKey;
  label: string;
  actual: ActualMetricSource;
  estimate?: number;
  estimateSource?: string;
  yoyPct?: number;
  missingWarning: string;
}): EarningsMetricComparison {
  const surprise = calcSurprise(actual.value, estimate);
  const warnings: string[] = [];

  if (actual.value === undefined) {
    warnings.push(missingWarning);
  }

  if (estimate === undefined && metricKey !== 'netIncome') {
    warnings.push(`${label} estimate unavailable.`);
  }

  if (metricKey === 'netIncome' && estimate === undefined) {
    warnings.push('Net income estimate is not supported by the current provider set.');
  }

  if (yoyPct === undefined) {
    warnings.push(`${label} YoY unavailable; no prior-year same-quarter value was found.`);
  }

  return {
    metricKey,
    label,
    currency: metricKey === 'eps' ? 'USD/share' : 'USD',
    actual: actual.value,
    estimate,
    surpriseAbs: surprise.surpriseAbs,
    surprisePct: surprise.surprisePct,
    yoyPct,
    fiscalYear: actual.fiscalYear,
    fiscalQuarter: actual.fiscalQuarter,
    periodEnd: actual.periodEnd,
    periodLabel: actual.periodLabel,
    actualSource: actual.source,
    estimateSource: estimate === undefined ? undefined : (estimateSource as 'sec-edgar' | 'eastmoney' | 'yahoo' | 'fmp' | 'manual' | 'mock' | 'extracted' | undefined),
    quality: actual.value !== undefined || estimate !== undefined ? 'estimated' : 'missing',
    warnings,
  };
}

export async function getGlobalEarningsSnapshotData({
  query,
  security,
  basicData,
}: GlobalEarningsProviderInput): Promise<EarningsSnapshotData> {
  const resolvedSecurity = resolveSecurity(query, security);
  const symbol = resolvedSecurity?.symbol ?? resolvedSecurity?.numericCode ?? query;
  const yahooSymbol = resolvedSecurity ? getYahooSymbol(resolvedSecurity) ?? symbol : symbol;
  const warnings: string[] = [];

  // Check if this is US market (only US has estimates providers)
  const isUsMarket = resolvedSecurity?.market === 'US' || symbol?.match(/^[A-Z]{1,5}$/);

  const [eastmoneyFinancials, yahooSummary, eastmoneyIndicators, resolvedBasicData, guidanceData, consensusResult] = await Promise.all([
    settle(resolvedSecurity ? fetchEastmoneyQuarterFinancials(resolvedSecurity) : Promise.resolve([])),
    settle(fetchYahooQuoteSummary(yahooSymbol, [
      'earnings',
      'earningsTrend',
      'earningsHistory',
      'incomeStatementHistoryQuarterly',
    ])),
    settle(resolvedSecurity ? fetchEastmoneyKeyIndicators(resolvedSecurity) : Promise.resolve([])),
    settle(basicData ? Promise.resolve(basicData) : resolvedSecurity ? getBasicCompanyData(resolvedSecurity) : Promise.resolve(undefined)),
    settle(getGuidanceData(resolvedSecurity?.symbol)),
    // Only fetch consensus estimates for US market
    isUsMarket && resolvedSecurity?.symbol
      ? settle(getConsensusEstimates(resolvedSecurity.symbol))
      : settle(Promise.resolve(null)),
  ]);

  const secActuals = resolvedBasicData ? buildSecQuarterActuals(resolvedBasicData) : undefined;
  const secMetrics = secActuals?.metrics ?? [];

  // Only fetch FMP data if enabled in config
  const fmpResult = earningsProviderConfig.isFmpEnabled() && resolvedSecurity?.symbol
    ? await fetchFmpEarningsEstimates({ symbol: resolvedSecurity.symbol, companyName: resolvedSecurity.companyName })
    : undefined;
  const fmpSnapshot = fmpResult?.ok ? fmpResult.data : undefined;

  if (earningsProviderConfig.expectations.provider === 'fmp' && !earningsProviderConfig.expectations.fmpApiKey) {
    warnings.push('FMP expectations provider is configured but FMP_API_KEY is missing; falling back to other sources.');
  } else if (fmpResult && !fmpResult.ok) {
    warnings.push(`FMP earnings estimates unavailable: ${fmpResult.error}`);
  }

  if (!eastmoneyFinancials || eastmoneyFinancials.length === 0) {
    warnings.push('Eastmoney quarterly financials unavailable.');
  }

  if (!yahooSummary?.ok) {
    warnings.push('Yahoo quoteSummary earnings data unavailable.');
  }

  if (!eastmoneyIndicators || eastmoneyIndicators.length === 0) {
    warnings.push('Eastmoney GMAININDICATOR data unavailable.');
  }

  // First, get actuals data
  const eastmoneyRevenue = firstFinancialWithValue(eastmoneyFinancials, 'revenue');
  const eastmoneyNetIncome = firstFinancialWithValue(eastmoneyFinancials, 'netIncome');
  const eastmoneyEps = firstFinancialWithValue(eastmoneyFinancials, 'dilutedEps');
  const yahooRevenue = firstFinancialWithValue(yahooSummary?.ok ? yahooSummary.quarterlyFinancials : undefined, 'revenue');
  const yahooNetIncome = firstFinancialWithValue(yahooSummary?.ok ? yahooSummary.quarterlyFinancials : undefined, 'netIncome');
  const yahooEps = firstFinancialWithValue(yahooSummary?.ok ? yahooSummary.quarterlyFinancials : undefined, 'dilutedEps');
  const secRevenue = secMetrics.find((metric) => metric.metricKey === 'revenue');
  const secNetIncome = secMetrics.find((metric) => metric.metricKey === 'netIncome');
  const secEps = secMetrics.find((metric) => metric.metricKey === 'eps');
  const fmpMetrics = fmpSnapshot?.metrics;
  const revenueActual = actualFromFinancial('revenue', eastmoneyRevenue, 'eastmoney').value !== undefined
    ? actualFromFinancial('revenue', eastmoneyRevenue, 'eastmoney')
    : actualFromFinancial('revenue', yahooRevenue, 'yahoo').value !== undefined
      ? actualFromFinancial('revenue', yahooRevenue, 'yahoo')
      : actualFromMetric(secRevenue);
  const netIncomeActual = actualFromFinancial('netIncome', eastmoneyNetIncome, 'eastmoney').value !== undefined
    ? actualFromFinancial('netIncome', eastmoneyNetIncome, 'eastmoney')
    : actualFromFinancial('netIncome', yahooNetIncome, 'yahoo').value !== undefined
      ? actualFromFinancial('netIncome', yahooNetIncome, 'yahoo')
      : actualFromMetric(secNetIncome);
  const epsActual = actualFromFinancial('eps', eastmoneyEps, 'eastmoney').value !== undefined
    ? actualFromFinancial('eps', eastmoneyEps, 'eastmoney')
    : actualFromFinancial('eps', yahooEps, 'yahoo').value !== undefined
      ? actualFromFinancial('eps', yahooEps, 'yahoo')
      : actualFromMetric(fmpMetrics?.find((metric) => metric.metricKey === 'eps'))?.value !== undefined
        ? actualFromMetric(fmpMetrics?.find((metric) => metric.metricKey === 'eps'))
        : actualFromMetric(secEps);
  const yahooEstimates = yahooSummary?.ok ? yahooSummary.analystEstimates : undefined;

  // Then, process consensus estimates if available
  let consensusRevenueEstimate: number | undefined;
  let consensusEpsEstimate: number | undefined;
  let consensusNetIncomeEstimate: number | undefined;
  let consensusSource: string | undefined;
  let consensusSourceNote: string | undefined;
  let nextQuarterConsensus: number | undefined;

  if (consensusResult && consensusResult.estimates.length > 0) {
    // Create a temporary snapshot for matching using actuals fiscal period
    const tempSnapshot: Partial<EarningsSnapshotData> = {
      fiscalYear: revenueActual.fiscalYear || '2024',
      fiscalQuarter: revenueActual.fiscalQuarter || 'Q1',
    };

    const selection = selectCurrentQuarterConsensus(
      consensusResult.estimates,
      tempSnapshot as EarningsSnapshotData
    );

    if (selection.estimate) {
      console.debug('[GlobalEarnings] Selected consensus estimate:', selection);
      consensusRevenueEstimate = selection.estimate.revenueEstimate;
      consensusEpsEstimate = selection.estimate.epsEstimate;
      consensusNetIncomeEstimate = selection.estimate.netIncomeEstimate;
      consensusSource = consensusResult.providerUsed;
      consensusSourceNote = selection.sourceNoteSuffix
        ? `${selection.estimate.sourceNote} (${selection.sourceNoteSuffix})`
        : selection.estimate.sourceNote;
    }

    // Select next quarter revenue consensus for guidance compare
    const nextQuarterSelection = selectNextQuarterRevenueConsensus(
      consensusResult.estimates,
      tempSnapshot as EarningsSnapshotData
    );
    if (nextQuarterSelection.estimate?.revenueEstimate) {
      nextQuarterConsensus = nextQuarterSelection.estimate.revenueEstimate;
      console.debug('[GlobalEarnings] Selected next quarter consensus:', nextQuarterConsensus);
    }

    if (consensusResult.warnings.length > 0) {
      warnings.push(...consensusResult.warnings);
    }
  }

  // Use consensus estimates if available, otherwise fallback to original
  const revenueEstimate = consensusRevenueEstimate ?? getEstimate('revenue', yahooEstimates, fmpMetrics);
  const epsEstimate = consensusEpsEstimate ?? getEstimate('eps', yahooEstimates, fmpMetrics);

  // Process guidance data and combine with next quarter consensus
  let finalGuidance: GuidanceMetricComparison[] = guidanceData?.guidance ?? [];
  const finalGuidanceEvidence: GlobalGuidanceEvidence[] = guidanceData?.evidence ?? [];

  // If we have guidance and next quarter consensus, calculate gap
  if (finalGuidance.length > 0 && nextQuarterConsensus !== undefined) {
    finalGuidance = finalGuidance.map((guidanceItem) => {
      // Only update next quarter revenue guidance
      if (guidanceItem.metricKey === 'nextQuarterRevenue' && guidanceItem.guidanceMid !== undefined) {
        const gapAbs = guidanceItem.guidanceMid - nextQuarterConsensus;
        const gapPct = nextQuarterConsensus !== 0 ? (gapAbs / nextQuarterConsensus) * 100 : undefined;

        return {
          ...guidanceItem,
          consensus: nextQuarterConsensus,
          gapAbs,
          gapPct,
        };
      }
      return guidanceItem;
    });
  } else if (finalGuidance.length === 0 && nextQuarterConsensus !== undefined) {
    // Only show empty guidance if we don't have manual data
    // Don't create fake guidance
  }

  // Build source notes
  const sourceNotes: string[] = [];
  if (revenueActual.source || epsActual.source) {
    sourceNotes.push(`actual: ${revenueActual.source || epsActual.source || 'SEC'}`);
  }
  if (consensusSourceNote) {
    sourceNotes.push(`consensus: ${consensusSourceNote}`);
  } else if (revenueEstimate !== undefined || epsEstimate !== undefined) {
    sourceNotes.push(`consensus: ${consensusSource || 'Yahoo'}`);
  }

  return {
    provider: yahooSummary?.ok ? 'yahoo' : fmpSnapshot ? 'fmp' : secActuals?.provider ?? 'mock',
    fetchedAt: new Date().toISOString(),
    companyName: resolvedSecurity?.companyName ?? query,
    symbol,
    fiscalYear: revenueActual.fiscalYear ?? netIncomeActual.fiscalYear ?? epsActual.fiscalYear,
    fiscalQuarter: revenueActual.fiscalQuarter ?? netIncomeActual.fiscalQuarter ?? epsActual.fiscalQuarter,
    reportDate: revenueActual.periodEnd ?? netIncomeActual.periodEnd ?? epsActual.periodEnd,
    earningsDate: fmpSnapshot?.earningsDate,
    metrics: [
      buildMetric({
        metricKey: 'revenue',
        label: 'Revenue',
        actual: revenueActual,
        estimate: revenueEstimate,
        estimateSource: consensusSource || 'yahoo',
        yoyPct: findPriorYearSameQuarterYoy(eastmoneyRevenue, eastmoneyFinancials, 'revenue') ?? findPriorYearSameQuarterYoy(yahooRevenue, yahooSummary?.ok ? yahooSummary.quarterlyFinancials : undefined, 'revenue') ?? secRevenue?.yoyPct,
        missingWarning: 'Revenue actual unavailable from Eastmoney/Yahoo/SEC.',
      }),
      buildMetric({
        metricKey: 'netIncome',
        label: 'Net income',
        actual: netIncomeActual,
        estimate: consensusNetIncomeEstimate,
        estimateSource: consensusSource,
        yoyPct: findPriorYearSameQuarterYoy(eastmoneyNetIncome, eastmoneyFinancials, 'netIncome') ?? findPriorYearSameQuarterYoy(yahooNetIncome, yahooSummary?.ok ? yahooSummary.quarterlyFinancials : undefined, 'netIncome') ?? secNetIncome?.yoyPct,
        missingWarning: 'Net income actual unavailable from Eastmoney/Yahoo/SEC.',
      }),
      buildMetric({
        metricKey: 'eps',
        label: 'EPS',
        actual: epsActual,
        estimate: epsEstimate,
        estimateSource: consensusSource || 'yahoo',
        yoyPct: findPriorYearSameQuarterYoy(eastmoneyEps, eastmoneyFinancials, 'dilutedEps') ?? findPriorYearSameQuarterYoy(yahooEps, yahooSummary?.ok ? yahooSummary.quarterlyFinancials : undefined, 'dilutedEps') ?? secEps?.yoyPct,
        missingWarning: 'EPS actual unavailable from Eastmoney/Yahoo/FMP/SEC.',
      }),
    ],
    guidance: finalGuidance,
    guidanceEvidence: finalGuidanceEvidence,
    sourceLinks: [
      ...(resolvedBasicData?.sourceLinks ?? []),
      ...(yahooSummary?.ok ? [{ label: 'Yahoo quoteSummary', url: `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(yahooSymbol)}` }] : []),
      ...(fmpSnapshot?.sourceLinks ?? []),
      ...(secActuals?.sourceLinks ?? []),
    ],
    sourceNote: sourceNotes.length > 0 ? sourceNotes.join(' | ') : undefined,
    warnings: [
      ...warnings,
      ...(resolvedBasicData?.warnings ?? []),
      ...(secActuals?.warnings ?? []),
      ...(fmpSnapshot?.warnings ?? []),
      ...(eastmoneyFinancials ?? []).flatMap((item) => item.warnings ?? []),
      ...(eastmoneyIndicators ?? []).flatMap((item) => item.warnings ?? []),
      ...(guidanceData?.warnings ?? []),
    ],
  };
}

function findPriorYearSameQuarterYoy(
  current: GlobalQuarterFinancial | undefined,
  series: GlobalQuarterFinancial[] | undefined,
  key: keyof Pick<GlobalQuarterFinancial, 'revenue' | 'netIncome' | 'dilutedEps'>
) {
  if (!current) {
    return undefined;
  }

  return firstFinancialWithValue(series?.filter((item) => item.fiscalQuarter === current.fiscalQuarter && item.fiscalYear === String(Number(current.fiscalYear) - 1)), key)
    ? safePctChange(current[key] as number | undefined, firstFinancialWithValue(series?.filter((item) => item.fiscalQuarter === current.fiscalQuarter && item.fiscalYear === String(Number(current.fiscalYear) - 1)), key)?.[key] as number | undefined)
    : undefined;
}
