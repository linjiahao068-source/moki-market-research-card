import { NextRequest, NextResponse } from 'next/server';
import { getGlobalEarningsSnapshotData } from '@/lib/earnings/globalEarningsProvider';
import { getConsensusEstimates, selectCurrentQuarterConsensus, selectNextQuarterRevenueConsensus } from '@/lib/expectations';
import { earningsProviderConfig } from '@/lib/config/earningsProviders';
import { resolveSecurityInput } from '@/lib/security/resolveSecurityInput';
import { SecurityRecord } from '@/types/security';
import { EarningsSnapshotData } from '@/types/earnings';
import { ConsensusEstimate } from '@/lib/expectations/types';

function summarizeSecurity(security: SecurityRecord) {
  return {
    id: security.id,
    market: security.market,
    symbol: security.symbol,
    numericCode: security.numericCode,
    companyName: security.companyName,
    chineseNameHK: security.chineseNameHK,
  };
}

function summarizeConsensusEstimate(estimate: ConsensusEstimate) {
  return {
    ticker: estimate.ticker,
    fiscalYear: estimate.fiscalYear,
    fiscalQuarter: estimate.fiscalQuarter,
    periodEndDate: estimate.periodEndDate,
    reportDate: estimate.reportDate,
    revenueEstimate: estimate.revenueEstimate,
    epsEstimate: estimate.epsEstimate,
    netIncomeEstimate: estimate.netIncomeEstimate,
    analystCountRevenue: estimate.analystCountRevenue,
    analystCountEps: estimate.analystCountEps,
    provider: estimate.provider,
    sourceNote: estimate.sourceNote,
  };
}

function summarizeEarningsSnapshot(snapshot: EarningsSnapshotData) {
  return {
    provider: snapshot.provider,
    companyName: snapshot.companyName,
    symbol: snapshot.symbol,
    fiscalYear: snapshot.fiscalYear,
    fiscalQuarter: snapshot.fiscalQuarter,
    reportDate: snapshot.reportDate,
    earningsDate: snapshot.earningsDate,
    metrics: snapshot.metrics.map((m) => ({
      metricKey: m.metricKey,
      actual: m.actual,
      estimate: m.estimate,
      surpriseAbs: m.surpriseAbs,
      surprisePct: m.surprisePct,
      actualSource: m.actualSource,
      estimateSource: m.estimateSource,
      quality: m.quality,
      warnings: m.warnings,
    })),
    guidance: snapshot.guidance.map((g) => ({
      metricKey: g.metricKey,
      guidanceLow: g.guidanceLow,
      guidanceMid: g.guidanceMid,
      guidanceHigh: g.guidanceHigh,
      consensus: g.consensus,
      gapAbs: g.gapAbs,
      gapPct: g.gapPct,
      periodLabel: g.periodLabel,
      quality: g.quality,
      warnings: g.warnings,
    })),
    guidanceEvidence: snapshot.guidanceEvidence,
    sourceNote: snapshot.sourceNote,
    warnings: snapshot.warnings,
  };
}

export async function GET(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production';
  const debugEnabled = process.env.DEBUG_EARNINGS_DATA === 'true';

  if (isProduction && !debugEnabled) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const query = request.nextUrl.searchParams.get('query')?.trim() ?? '';

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter.' }, { status: 400 });
  }

  const warnings: string[] = [];
  const resolution = resolveSecurityInput(query);

  if (resolution.status === 'ambiguous') {
    return NextResponse.json({
      resolution: {
        status: resolution.status,
        inputKind: resolution.inputKind,
        rawInput: resolution.rawInput,
        normalizedInput: resolution.normalizedInput,
        candidates: resolution.candidates.map(summarizeSecurity),
      },
      warnings: ['Ambiguous security resolution; no provider calls were made.'],
    });
  }

  const security = resolution.status === 'matched' ? resolution.security : resolution.fallbackSecurity;
  const ticker = security.symbol ?? security.numericCode ?? query;

  // Summary of config
  const configSummary = {
    expectationsProvider: earningsProviderConfig.expectations.provider,
    hasFmpApiKey: Boolean(earningsProviderConfig.expectations.fmpApiKey),
    hasAlphaVantageApiKey: Boolean(earningsProviderConfig.expectations.alphaVantageApiKey),
    guidanceProvider: earningsProviderConfig.guidance.provider,
    enableMarketExpectationProxy: earningsProviderConfig.enableMarketExpectationProxy,
  };

  // Fetch actuals snapshot first
  let finalSnapshot: EarningsSnapshotData | undefined;
  try {
    finalSnapshot = await getGlobalEarningsSnapshotData({ query, security });
  } catch (error) {
    warnings.push(`Snapshot fetch failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  }

  // Fetch consensus independently
  let consensusResult: Awaited<ReturnType<typeof getConsensusEstimates>> | undefined;
  let currentQuarterSelection: ReturnType<typeof selectCurrentQuarterConsensus> | undefined;
  let nextQuarterSelection: ReturnType<typeof selectNextQuarterRevenueConsensus> | undefined;

  try {
    const securityIsUs = security.market === 'US' || ticker.match(/^[A-Z]{1,5}$/);
    if (securityIsUs) {
      consensusResult = await getConsensusEstimates(ticker);

      if (consensusResult && consensusResult.estimates.length > 0) {
        const tempSnapshot = {
          fiscalYear: finalSnapshot?.fiscalYear || '2024',
          fiscalQuarter: finalSnapshot?.fiscalQuarter || 'Q1',
        };
        currentQuarterSelection = selectCurrentQuarterConsensus(
          consensusResult.estimates,
          tempSnapshot as unknown as EarningsSnapshotData
        );
        nextQuarterSelection = selectNextQuarterRevenueConsensus(
          consensusResult.estimates,
          tempSnapshot as unknown as EarningsSnapshotData
        );
      }
    }
  } catch (error) {
    warnings.push(`Consensus fetch failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  }

  return NextResponse.json({
    resolution: {
      status: resolution.status,
      inputKind: resolution.inputKind,
      rawInput: resolution.rawInput,
      normalizedInput: resolution.normalizedInput,
      security: summarizeSecurity(security),
    },
    config: configSummary,
    actualsProviderStatus: finalSnapshot ? {
      provider: finalSnapshot.provider,
      hasActuals: finalSnapshot.metrics.some((m) => m.actual !== undefined),
      metricsCount: finalSnapshot.metrics.length,
    } : { error: 'No snapshot data' },
    consensusProviderStatus: consensusResult ? {
      providerUsed: consensusResult.providerUsed,
      sourceNote: consensusResult.sourceNote,
      estimateCount: consensusResult.estimates.length,
      estimates: consensusResult.estimates.map(summarizeConsensusEstimate),
      warnings: consensusResult.warnings,
    } : { error: 'No consensus data (not US market or no API keys or no data returned)' },
    selectedCurrentQuarterConsensus: currentQuarterSelection ? {
      estimate: currentQuarterSelection.estimate ? summarizeConsensusEstimate(currentQuarterSelection.estimate) : undefined,
      sourceNoteSuffix: currentQuarterSelection.sourceNoteSuffix,
      reason: currentQuarterSelection.reason,
    } : { error: 'No current quarter selection' },
    selectedNextQuarterConsensus: nextQuarterSelection ? {
      estimate: nextQuarterSelection.estimate ? summarizeConsensusEstimate(nextQuarterSelection.estimate) : undefined,
      sourceNoteSuffix: nextQuarterSelection.sourceNoteSuffix,
      reason: nextQuarterSelection.reason,
    } : { error: 'No next quarter selection' },
    guidanceProviderStatus: finalSnapshot ? {
      guidanceCount: finalSnapshot.guidance.length,
      guidanceEvidenceCount: finalSnapshot.guidanceEvidence?.length ?? 0,
    } : { error: 'No guidance data' },
    finalEarningsSnapshot: finalSnapshot ? summarizeEarningsSnapshot(finalSnapshot) : undefined,
    warnings,
  });
}
