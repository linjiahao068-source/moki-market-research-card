import { ConsensusEstimate } from '../types';
import { earningsProviderConfig } from '@/lib/config/earningsProviders';
import { fetchFmpConsensusEstimates } from './fmpExpectationsProvider';
import { fetchAlphaVantageConsensusEstimates } from './alphaVantageExpectationsProvider';

export interface ConsensusResult {
  estimates: ConsensusEstimate[];
  providerUsed: string | undefined;
  sourceNote: string | undefined;
  warnings: string[];
}

// Get the primary provider from config
function getPrimaryProvider(): 'fmp' | 'alpha_vantage' | undefined {
  const provider = earningsProviderConfig.expectations.provider;
  if (provider === 'fmp' || provider === 'alpha_vantage') {
    return provider;
  }
  return undefined;
}

// Get available providers based on configured keys
function getAvailableProviders(): Array<'fmp' | 'alpha_vantage'> {
  const available: Array<'fmp' | 'alpha_vantage'> = [];

  if (earningsProviderConfig.expectations.fmpApiKey) {
    available.push('fmp');
  }
  if (earningsProviderConfig.expectations.alphaVantageApiKey) {
    available.push('alpha_vantage');
  }

  return available;
}

// Main function to get consensus estimates with fallback logic
export async function getConsensusEstimates(
  ticker: string
): Promise<ConsensusResult> {
  const normalizedTicker = ticker.trim().toUpperCase();
  const warnings: string[] = [];

  if (!normalizedTicker) {
    return {
      estimates: [],
      providerUsed: undefined,
      sourceNote: undefined,
      warnings: ['No ticker provided'],
    };
  }

  const primaryProvider = getPrimaryProvider();
  const availableProviders = getAvailableProviders();

  if (availableProviders.length === 0) {
    warnings.push('No expectation providers configured');
    return {
      estimates: [],
      providerUsed: undefined,
      sourceNote: undefined,
      warnings,
    };
  }

  // Determine the order of providers to try
  let providerOrder: Array<'fmp' | 'alpha_vantage'>;

  if (primaryProvider && availableProviders.includes(primaryProvider)) {
    // Start with configured primary, then add the other if available
    providerOrder = [primaryProvider];
    const otherProvider = primaryProvider === 'fmp' ? 'alpha_vantage' : 'fmp';
    if (availableProviders.includes(otherProvider)) {
      providerOrder.push(otherProvider);
    }
  } else {
    // No configured primary or not available - use whatever is available
    providerOrder = availableProviders;
  }

  console.debug('[Expectations] Provider order:', providerOrder);

  // Try providers in order
  for (const provider of providerOrder) {
    try {
      let estimates: ConsensusEstimate[] = [];

      if (provider === 'fmp') {
        console.debug('[Expectations] Trying FMP provider');
        estimates = await fetchFmpConsensusEstimates(normalizedTicker);
      } else if (provider === 'alpha_vantage') {
        console.debug('[Expectations] Trying Alpha Vantage provider');
        estimates = await fetchAlphaVantageConsensusEstimates(normalizedTicker);
      }

      if (estimates.length > 0) {
        console.debug('[Expectations] Got', estimates.length, 'estimates from', provider);
        return {
          estimates,
          providerUsed: provider,
          sourceNote: estimates[0]?.sourceNote,
          warnings,
        };
      } else {
        warnings.push(`${provider} returned no estimates`);
      }
    } catch (error) {
      console.debug('[Expectations] Error with provider', provider, ':', error);
      warnings.push(
        `${provider} failed: ${error instanceof Error ? error.message : 'unknown error'}`
      );
    }
  }

  // All providers failed or returned nothing
  warnings.push('No estimates available from any provider');
  return {
    estimates: [],
    providerUsed: undefined,
    sourceNote: undefined,
    warnings,
  };
}

// Helper to get estimates bundled with metadata
export async function getConsensusEstimatesBundle(
  ticker: string
): Promise<{
  estimates: ConsensusEstimate[];
  metadata: {
    providerUsed: string | undefined;
    sourceNote: string | undefined;
    fetchedAt: string;
  };
  warnings: string[];
}> {
  const result = await getConsensusEstimates(ticker);
  return {
    estimates: result.estimates,
    metadata: {
      providerUsed: result.providerUsed,
      sourceNote: result.sourceNote,
      fetchedAt: new Date().toISOString(),
    },
    warnings: result.warnings,
  };
}
