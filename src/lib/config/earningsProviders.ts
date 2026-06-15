// Server-side only: environment variables for earnings data providers.
// Do NOT import this file into client-side components.

export type ExpectationsProvider = 'fmp' | 'alpha_vantage' | 'mock' | 'manual' | 'disabled';
export type GuidanceProvider = 'manual' | 'mock' | 'disabled';

function parseExpectationsProvider(value: string | undefined): ExpectationsProvider {
  if (value === 'fmp' || value === 'alpha_vantage' || value === 'mock' || value === 'manual' || value === 'disabled') {
    return value;
  }
  return 'mock'; // Fallback to mock if invalid
}

function parseGuidanceProvider(value: string | undefined): GuidanceProvider {
  if (value === 'manual' || value === 'mock' || value === 'disabled') {
    return value;
  }
  return 'manual'; // Fallback to manual if invalid
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

export const earningsProviderConfig = {
  expectations: {
    provider: parseExpectationsProvider(process.env.EXPECTATIONS_PROVIDER),
    fmpApiKey: process.env.FMP_API_KEY,
    alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY,
  },
  guidance: {
    provider: parseGuidanceProvider(process.env.GUIDANCE_PROVIDER),
  },
  enableMarketExpectationProxy: parseBoolean(process.env.ENABLE_MARKET_EXPECTATION_PROXY),

  // Helper getters
  isFmpEnabled(): boolean {
    return this.expectations.provider === 'fmp' && Boolean(this.expectations.fmpApiKey);
  },

  isExpectationsDisabled(): boolean {
    return this.expectations.provider === 'disabled';
  },

  isGuidanceDisabled(): boolean {
    return this.guidance.provider === 'disabled';
  },
} as const;
