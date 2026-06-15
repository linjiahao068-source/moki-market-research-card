export type EstimateProvider = 'fmp' | 'yahoo' | 'alpha_vantage' | 'sec_derived' | 'manual' | 'mock';

export interface ConsensusEstimate {
  // Identifier
  ticker: string;
  fiscalYear: string;
  fiscalQuarter?: string;

  // Dates
  periodEndDate?: string; // ISO date string
  reportDate?: string; // ISO date string
  snapshotTime: string; // ISO date string - when this estimate was fetched

  // Core estimates - standardized units
  revenueEstimate?: number; // In BILLION USD
  epsEstimate?: number; // In USD per share
  netIncomeEstimate?: number; // In BILLION USD

  // Analyst coverage
  analystCountRevenue?: number;
  analystCountEps?: number;

  // Metadata
  provider: EstimateProvider;
  sourceNote?: string;
}

export interface ConsensusEstimateBundle {
  // Current quarter consensus
  current?: ConsensusEstimate;

  // Next quarter consensus
  nextQuarter?: ConsensusEstimate;

  // Full year consensus
  fullYear?: ConsensusEstimate;

  // Historical estimates (for prior quarters)
  historical?: ConsensusEstimate[];

  // Metadata
  fetchedAt: string;
  warnings: string[];
}

// Helper type for currency conversion
export interface RawEstimateValues {
  revenueUsd?: number; // Raw dollars
  revenueMillion?: number; // Million dollars
  revenueBillion?: number; // Billion dollars (preferred)
  epsUsd?: number; // USD per share
  netIncomeUsd?: number; // Raw dollars
  netIncomeMillion?: number; // Million dollars
  netIncomeBillion?: number; // Billion dollars
}

// Convert raw values to standardized billion USD
export function standardizeRevenue(raw: RawEstimateValues): number | undefined {
  if (raw.revenueBillion !== undefined) {
    return raw.revenueBillion;
  }
  if (raw.revenueMillion !== undefined) {
    return raw.revenueMillion / 1000;
  }
  if (raw.revenueUsd !== undefined) {
    return raw.revenueUsd / 1000000000;
  }
  return undefined;
}

// Convert raw net income to standardized billion USD
export function standardizeNetIncome(raw: RawEstimateValues): number | undefined {
  if (raw.netIncomeBillion !== undefined) {
    return raw.netIncomeBillion;
  }
  if (raw.netIncomeMillion !== undefined) {
    return raw.netIncomeMillion / 1000;
  }
  if (raw.netIncomeUsd !== undefined) {
    return raw.netIncomeUsd / 1000000000;
  }
  return undefined;
}

// EPS is already in USD, just pass through
export function standardizeEps(epsUsd?: number): number | undefined {
  return epsUsd;
}
