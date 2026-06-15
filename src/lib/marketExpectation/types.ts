// V0.2.6.1 Placeholder - Market Expectation Proxy types
// Reserved for V0.2.7 / V0.3 implementation
// Future providers: Estimize, ORATS, Intrinio, options implied move
// Not currently connected to UI
/* eslint-disable @typescript-eslint/no-unused-vars */

export type MarketExpectationProvider = 'estimize' | 'orats' | 'intrinio' | 'optionmetrics' | 'manual' | 'mock' | 'disabled';

export interface MarketExpectationData {
  // Pre-earnings price moves
  preEarningsPriceMove7dPct?: number;
  preEarningsPriceMove30dPct?: number;

  // Implied move from options
  impliedMovePct?: number;

  // Crowd-sourced estimates
  crowdRevenueEstimate?: number;
  crowdEpsEstimate?: number;

  // Provider metadata
  provider: MarketExpectationProvider;
  fetchedAt?: string;
  sourceNote?: string;
  warnings: string[];
}

export interface MarketExpectationBundle {
  current?: MarketExpectationData;
  historical?: MarketExpectationData[];
}

// Placeholder for fetch function
export async function fetchMarketExpectation(_ticker: string): Promise<MarketExpectationBundle> {
  return {
    current: {
      provider: 'disabled',
      warnings: ['Market expectations not implemented in V0.2.6.1. Reserved for V0.2.7 / V0.3.'],
    },
  };
}
