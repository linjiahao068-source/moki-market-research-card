import { BasicCompanyData, DataCoverageStatus } from '@/types/basic-data';
import { SecurityRecord } from '@/types/security';
import { BasicDataProvider, BasicDataProviderInput, BasicDataProviderResult } from '../types';
import { findSecCompanyByTicker } from './secCompanyTickerMapper';
import { fetchSecCompanyFacts } from './secCompanyFactsClient';
import { fetchSecSubmissions } from './secSubmissionsClient';
import { parseSecCompanyFacts } from './parseSecCompanyFacts';

function buildSecurity(input: BasicDataProviderInput, companyName?: string, ticker?: string, exchange?: string): SecurityRecord {
  return {
    id: `sec-${input.cik ?? ticker ?? input.symbol ?? input.companyName ?? 'unknown'}`,
    market: 'US',
    symbol: ticker ?? input.symbol,
    companyName: companyName ?? input.companyName ?? ticker ?? input.symbol ?? 'Unknown Company',
    englishName: companyName ?? input.companyName,
    theme: exchange ? `SEC EDGAR filing data from ${exchange}` : 'SEC EDGAR filing data',
  };
}

function countFinancialFields(financials: NonNullable<BasicCompanyData['financials']>) {
  return Object.values(financials).filter(Boolean).length;
}

function getCoverageStatus(hasFiling: boolean, financialFieldCount: number): DataCoverageStatus {
  if (financialFieldCount === 0) {
    return 'empty';
  }

  if (hasFiling && financialFieldCount >= 5) {
    return 'full';
  }

  return 'partial';
}

export const secBasicDataProvider: BasicDataProvider = {
  name: 'sec-edgar',
  supports(input: BasicDataProviderInput) {
    if (input.cik) {
      return true;
    }

    return input.market === 'US' && Boolean(input.symbol);
  },
  async fetchBasicData(input: BasicDataProviderInput): Promise<BasicDataProviderResult> {
    try {
      if (!this.supports(input)) {
        return {
          ok: false,
          error: 'SEC EDGAR provider only supports US securities with symbol or CIK.',
        };
      }

      const tickerMatch = input.cik ? null : await findSecCompanyByTicker(input.symbol ?? '');
      const cik = input.cik ?? tickerMatch?.cik;

      if (!cik) {
        return {
          ok: false,
          error: 'SEC CIK not found for symbol.',
        };
      }

      const submissions = await fetchSecSubmissions(cik);
      const companyFacts = await fetchSecCompanyFacts(cik);
      const parsedFacts = parseSecCompanyFacts(companyFacts);
      const financials = parsedFacts.financials;
      const financialFieldCount = countFinancialFields(financials);
      const hasFiling = Boolean(submissions.latestFiling);
      const coverageStatus = getCoverageStatus(hasFiling, financialFieldCount);
      const warnings = [...parsedFacts.warnings];

      if (!hasFiling) {
        warnings.push('SEC submissions did not include a recent 10-K / 10-Q / 8-K filing.');
      }

      if (financialFieldCount === 0) {
        warnings.push('SEC companyfacts did not provide supported financial fields.');
      }

      const security = buildSecurity(
        input,
        submissions.companyName ?? tickerMatch?.title,
        submissions.ticker ?? tickerMatch?.ticker,
        submissions.exchange
      );
      const submissionsUrl = `https://data.sec.gov/submissions/CIK${cik}.json`;
      const companyFactsUrl = `https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`;
      const data: BasicCompanyData = {
        provider: 'sec-edgar',
        coverageStatus,
        freshnessStatus: 'unknown',
        fetchedAt: new Date().toISOString(),
        security,
        profile: {
          companyName: submissions.companyName ?? tickerMatch?.title ?? input.companyName,
          exchange: submissions.exchange,
        },
        latestFiling: submissions.latestFiling
          ? {
              formType: submissions.latestFiling.form,
              filingDate: submissions.latestFiling.filingDate,
              fiscalPeriod: submissions.latestFiling.reportDate,
              accessionNumber: submissions.latestFiling.accessionNumber,
              url: submissions.latestFiling.sourceUrl,
            }
          : undefined,
        financials,
        quote: {},
        sourceLinks: [
          {
            label: 'SEC company submissions',
            url: submissionsUrl,
          },
          {
            label: 'SEC companyfacts',
            url: companyFactsUrl,
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
        error: error instanceof Error ? error.message : 'SEC EDGAR provider failed.',
      };
    }
  },
};
