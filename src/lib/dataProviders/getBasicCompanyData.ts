import { BasicCompanyData } from '@/types/basic-data';
import { SecurityRecord } from '@/types/security';
import { fmpBasicDataProvider } from './fmp/fmpBasicDataProvider';
import { mockBasicDataProvider } from './mockBasicDataProvider';
import { secBasicDataProvider } from './sec/secBasicDataProvider';
import { BasicDataProviderInput } from './types';

const UNSUPPORTED_MARKET_WARNING = 'V0.2.5 暂未接入该市场真实基础数据。';

function isSecurityRecord(input: SecurityRecord | BasicDataProviderInput): input is SecurityRecord {
  return 'id' in input && 'companyName' in input && 'market' in input;
}

function toProviderInput(input: SecurityRecord | BasicDataProviderInput): BasicDataProviderInput {
  if (!isSecurityRecord(input)) {
    return input;
  }

  return {
    symbol: input.symbol,
    market: input.market,
    companyName: input.companyName,
    numericCode: input.numericCode,
  };
}

async function getMockData(input: BasicDataProviderInput, warning?: string): Promise<BasicCompanyData> {
  const mockResult = await mockBasicDataProvider.fetchBasicData(input);

  if (mockResult.ok && mockResult.data) {
    return {
      ...mockResult.data,
      warnings: warning ? [...mockResult.data.warnings, warning] : mockResult.data.warnings,
    };
  }

  return {
    provider: 'mock',
    coverageStatus: 'failed',
    freshnessStatus: 'unknown',
    fetchedAt: new Date().toISOString(),
    security: {
      id: `mock-failed-${input.symbol ?? input.numericCode ?? input.companyName ?? 'unknown'}`,
      market: input.market === 'US' || input.market === 'HK' || input.market === 'CN_A' ? input.market : 'UNKNOWN',
      symbol: input.symbol,
      numericCode: input.numericCode,
      companyName: input.companyName ?? input.symbol ?? input.numericCode ?? 'Unknown Company',
      theme: 'Mock basic data fallback',
    },
    profile: {
      companyName: input.companyName,
    },
    financials: {},
    quote: {},
    sourceLinks: [],
    warnings: [
      'Mock basic data provider failed unexpectedly.',
      ...(warning ? [warning] : []),
    ],
  };
}

export async function getBasicCompanyData(input: SecurityRecord | BasicDataProviderInput): Promise<BasicCompanyData> {
  const providerInput = toProviderInput(input);

  try {
    if (providerInput.market !== 'US') {
      return getMockData(providerInput, UNSUPPORTED_MARKET_WARNING);
    }

    if (secBasicDataProvider.supports(providerInput)) {
      const secResult = await secBasicDataProvider.fetchBasicData(providerInput);

      if (secResult.ok && secResult.data) {
        return secResult.data;
      }
    }

    if (fmpBasicDataProvider.supports(providerInput)) {
      const fmpResult = await fmpBasicDataProvider.fetchBasicData(providerInput);

      if (fmpResult.ok && fmpResult.data) {
        return fmpResult.data;
      }
    }

    return getMockData(providerInput);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown basic data provider error.';
    const mockData = await getMockData(providerInput);

    return {
      ...mockData,
      warnings: [...mockData.warnings, `真实基础数据获取失败，已回退到 mock：${message}`],
    };
  }
}
