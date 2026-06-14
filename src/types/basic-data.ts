import { SecurityRecord } from './security';

export type DataProviderName = 'sec-edgar' | 'fmp' | 'mock';

export type DataFreshnessStatus = 'fresh' | 'stale' | 'unknown';

export type DataCoverageStatus = 'full' | 'partial' | 'empty' | 'failed';

export interface BasicCompanyData {
  provider: DataProviderName;
  coverageStatus: DataCoverageStatus;
  freshnessStatus: DataFreshnessStatus;
  fetchedAt: string;
  security: SecurityRecord;
  profile?: {
    companyName?: string;
    description?: string;
    sector?: string;
    industry?: string;
    website?: string;
    exchange?: string;
    currency?: string;
  };
  latestFiling?: {
    formType?: string;
    filingDate?: string;
    fiscalPeriod?: string;
    accessionNumber?: string;
    url?: string;
  };
  financials?: {
    revenue?: string;
    grossProfit?: string;
    operatingIncome?: string;
    netIncome?: string;
    eps?: string;
    assets?: string;
    liabilities?: string;
    cashAndEquivalents?: string;
    totalDebt?: string;
    operatingCashFlow?: string;
    capitalExpenditure?: string;
    freeCashFlow?: string;
    period?: string;
    fiscalYear?: string;
  };
  quote?: {
    price?: string;
    change?: string;
    changePercent?: string;
    currency?: string;
    marketTime?: string;
  };
  sourceLinks: Array<{
    label: string;
    url: string;
  }>;
  warnings: string[];
}
