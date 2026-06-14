import { BasicCompanyData, DataCoverageStatus } from '@/types/basic-data';
import { SecurityRecord } from '@/types/security';
import { BasicDataProvider, BasicDataProviderInput, BasicDataProviderResult } from '../types';
import { fmpFetchJson, hasFmpApiKey } from './fmpClient';

interface FmpProfileItem {
  symbol?: string;
  companyName?: string;
  description?: string;
  sector?: string;
  industry?: string;
  website?: string;
  exchangeShortName?: string;
  currency?: string;
}

interface FmpQuoteItem {
  symbol?: string;
  price?: number;
  change?: number;
  changesPercentage?: number;
  currency?: string;
  timestamp?: number;
}

interface FmpIncomeStatementItem {
  date?: string;
  calendarYear?: string;
  period?: string;
  revenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  epsdiluted?: number;
}

function stringifyNumber(value: number | undefined, suffix = '') {
  return value === undefined ? undefined : `${value}${suffix}`;
}

function buildSecurity(input: BasicDataProviderInput, profile?: FmpProfileItem): SecurityRecord {
  const symbol = profile?.symbol ?? input.symbol;
  const companyName = profile?.companyName ?? input.companyName ?? symbol ?? 'Unknown Company';

  return {
    id: `fmp-${symbol ?? companyName}`.toLowerCase(),
    market: input.market === 'US' || input.market === 'HK' || input.market === 'CN_A' ? input.market : 'UNKNOWN',
    symbol,
    numericCode: input.numericCode,
    companyName,
    englishName: companyName,
    theme: 'FMP basic company and quote data',
  };
}

function getCoverageStatus(profile?: FmpProfileItem, quote?: FmpQuoteItem, incomeStatement?: FmpIncomeStatementItem): DataCoverageStatus {
  const availableGroups = [profile, quote, incomeStatement].filter(Boolean).length;

  if (availableGroups === 0) {
    return 'empty';
  }

  return availableGroups === 3 ? 'full' : 'partial';
}

export const fmpBasicDataProvider: BasicDataProvider = {
  name: 'fmp',
  supports(input: BasicDataProviderInput) {
    return hasFmpApiKey() && Boolean(input.symbol);
  },
  async fetchBasicData(input: BasicDataProviderInput): Promise<BasicDataProviderResult> {
    try {
      if (!this.supports(input)) {
        return {
          ok: false,
          error: 'FMP provider requires FMP_API_KEY and symbol.',
        };
      }

      const symbol = input.symbol as string;
      const [profileResult, quoteResult, incomeStatementResult] = await Promise.all([
        fmpFetchJson<FmpProfileItem[]>('/profile', { symbol }),
        fmpFetchJson<FmpQuoteItem[]>('/quote', { symbol }),
        fmpFetchJson<FmpIncomeStatementItem[]>('/income-statement', { symbol }),
      ]);
      const profile = profileResult[0];
      const quote = quoteResult[0];
      const incomeStatement = incomeStatementResult[0];
      const warnings: string[] = [];

      if (!profile) {
        warnings.push('FMP profile data missing.');
      }

      if (!quote) {
        warnings.push('FMP quote data missing.');
      }

      if (!incomeStatement) {
        warnings.push('FMP income statement data missing.');
      }

      const security = buildSecurity(input, profile);
      const data: BasicCompanyData = {
        provider: 'fmp',
        coverageStatus: getCoverageStatus(profile, quote, incomeStatement),
        freshnessStatus: 'unknown',
        fetchedAt: new Date().toISOString(),
        security,
        profile: profile
          ? {
              companyName: profile.companyName,
              description: profile.description,
              sector: profile.sector,
              industry: profile.industry,
              website: profile.website,
              exchange: profile.exchangeShortName,
              currency: profile.currency,
            }
          : undefined,
        latestFiling: undefined,
        financials: incomeStatement
          ? {
              revenue: stringifyNumber(incomeStatement.revenue, ' USD'),
              grossProfit: stringifyNumber(incomeStatement.grossProfit, ' USD'),
              operatingIncome: stringifyNumber(incomeStatement.operatingIncome, ' USD'),
              netIncome: stringifyNumber(incomeStatement.netIncome, ' USD'),
              eps: stringifyNumber(incomeStatement.epsdiluted),
              period: incomeStatement.period ?? incomeStatement.date,
              fiscalYear: incomeStatement.calendarYear,
            }
          : {},
        quote: quote
          ? {
              price: stringifyNumber(quote.price),
              change: stringifyNumber(quote.change),
              changePercent: stringifyNumber(quote.changesPercentage, '%'),
              currency: quote.currency ?? profile?.currency,
              marketTime: quote.timestamp ? new Date(quote.timestamp * 1000).toISOString() : undefined,
            }
          : {},
        sourceLinks: [
          {
            label: 'FMP profile',
            url: `https://financialmodelingprep.com/stable/profile?symbol=${encodeURIComponent(symbol)}`,
          },
          {
            label: 'FMP quote',
            url: `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(symbol)}`,
          },
          {
            label: 'FMP income statement',
            url: `https://financialmodelingprep.com/stable/income-statement?symbol=${encodeURIComponent(symbol)}`,
          },
        ],
        warnings,
      };

      return {
        ok: true,
        data,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'FMP provider failed.',
      };
    }
  },
};
