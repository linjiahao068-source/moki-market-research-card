import { NextRequest, NextResponse } from 'next/server';
import { getBasicCompanyData } from '@/lib/dataProviders/getBasicCompanyData';
import { fetchEastmoneyQuarterFinancials } from '@/lib/globalStockData/eastmoneyFinancials';
import { getYahooSymbol } from '@/lib/globalStockData/marketSymbol';
import { fetchYahooQuoteSummary } from '@/lib/globalStockData/yahooQuoteSummary';
import { getGlobalEarningsSnapshotData } from '@/lib/earnings/globalEarningsProvider';
import { resolveSecurityInput } from '@/lib/security/resolveSecurityInput';
import { SecurityRecord } from '@/types/security';

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

function summarizeEastmoneyResult(result: Awaited<ReturnType<typeof fetchEastmoneyQuarterFinancials>> | undefined) {
  return {
    count: result?.length ?? 0,
    first: result?.[0]
      ? {
          symbol: result[0].symbol,
          companyName: result[0].companyName,
          fiscalYear: result[0].fiscalYear,
          fiscalQuarter: result[0].fiscalQuarter,
          periodEnd: result[0].periodEnd,
          revenue: result[0].revenue,
          netIncome: result[0].netIncome,
          dilutedEps: result[0].dilutedEps,
          warnings: result[0].warnings,
        }
      : undefined,
  };
}

function summarizeYahooResult(result: Awaited<ReturnType<typeof fetchYahooQuoteSummary>> | undefined) {
  if (!result) {
    return undefined;
  }

  if (!result.ok) {
    return {
      ok: false,
      error: result.error,
    };
  }

  return {
    ok: true,
    quarterlyFinancialCount: result.quarterlyFinancials.length,
    analystEstimateCount: result.analystEstimates.length,
    earningsHistoryCount: result.earningsHistory.length,
    warnings: result.warnings,
  };
}

function summarizeBasicData(data: Awaited<ReturnType<typeof getBasicCompanyData>> | undefined) {
  return data
    ? {
        provider: data.provider,
        coverageStatus: data.coverageStatus,
        freshnessStatus: data.freshnessStatus,
        companyName: data.profile?.companyName ?? data.security.companyName,
        latestFiling: data.latestFiling,
        financialKeys: Object.keys(data.financials ?? {}),
        warnings: data.warnings,
      }
    : undefined;
}

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
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
  const yahooSymbol = getYahooSymbol(security) ?? security.symbol ?? security.numericCode ?? query;
  const [eastmoneyResult, yahooResult, secFallbackSummary, finalSnapshot] = await Promise.all([
    fetchEastmoneyQuarterFinancials(security).catch((error) => {
      warnings.push(error instanceof Error ? error.message : 'Eastmoney debug call failed.');
      return undefined;
    }),
    fetchYahooQuoteSummary(yahooSymbol, [
      'earnings',
      'earningsTrend',
      'earningsHistory',
      'incomeStatementHistoryQuarterly',
    ]).catch((error) => {
      warnings.push(error instanceof Error ? error.message : 'Yahoo quoteSummary debug call failed.');
      return undefined;
    }),
    getBasicCompanyData(security).catch((error) => {
      warnings.push(error instanceof Error ? error.message : 'Basic data debug call failed.');
      return undefined;
    }),
    getGlobalEarningsSnapshotData({ query, security }).catch((error) => {
      warnings.push(error instanceof Error ? error.message : 'Global earnings snapshot debug call failed.');
      return undefined;
    }),
  ]);

  return NextResponse.json({
    resolution: {
      status: resolution.status,
      inputKind: resolution.inputKind,
      rawInput: resolution.rawInput,
      normalizedInput: resolution.normalizedInput,
      security: summarizeSecurity(security),
    },
    eastmoney: summarizeEastmoneyResult(eastmoneyResult),
    yahooQuoteSummary: summarizeYahooResult(yahooResult),
    secFallback: summarizeBasicData(secFallbackSummary),
    finalEarningsSnapshot: finalSnapshot
      ? {
          provider: finalSnapshot.provider,
          companyName: finalSnapshot.companyName,
          symbol: finalSnapshot.symbol,
          fiscalYear: finalSnapshot.fiscalYear,
          fiscalQuarter: finalSnapshot.fiscalQuarter,
          reportDate: finalSnapshot.reportDate,
          earningsDate: finalSnapshot.earningsDate,
          metricCount: finalSnapshot.metrics.length,
          guidanceCount: finalSnapshot.guidance.length,
          guidanceEvidenceCount: finalSnapshot.guidanceEvidence?.length ?? 0,
          sourceLinkCount: finalSnapshot.sourceLinks.length,
          warnings: finalSnapshot.warnings,
        }
      : undefined,
    warnings,
  });
}
