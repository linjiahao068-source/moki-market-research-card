import { BasicCompanyData } from '@/types/basic-data';
import { SecurityRecord } from '@/types/security';
import { BasicDataProvider, BasicDataProviderInput, BasicDataProviderResult } from './types';

function buildMockSecurity(input: BasicDataProviderInput): SecurityRecord {
  const displayName = input.companyName ?? input.symbol ?? input.numericCode ?? 'Unknown Company';

  return {
    id: `mock-${(input.symbol ?? input.numericCode ?? displayName).toLowerCase()}`,
    market: input.market === 'US' || input.market === 'HK' || input.market === 'CN_A' ? input.market : 'UNKNOWN',
    symbol: input.symbol,
    numericCode: input.numericCode,
    companyName: displayName,
    englishName: input.companyName,
    theme: 'Mock basic data fallback',
  };
}

function buildMockBasicData(input: BasicDataProviderInput): BasicCompanyData {
  const security = buildMockSecurity(input);
  const fetchedAt = new Date().toISOString();

  return {
    provider: 'mock',
    coverageStatus: 'partial',
    freshnessStatus: 'unknown',
    fetchedAt,
    security,
    profile: {
      companyName: security.companyName,
      exchange: input.market,
    },
    latestFiling: undefined,
    financials: {},
    quote: {},
    sourceLinks: [],
    warnings: ['当前使用 mock basic data fallback，不代表真实财务数据。'],
  };
}

export const mockBasicDataProvider: BasicDataProvider = {
  name: 'mock',
  supports() {
    return true;
  },
  async fetchBasicData(input: BasicDataProviderInput): Promise<BasicDataProviderResult> {
    return {
      ok: true,
      data: buildMockBasicData(input),
    };
  },
};
