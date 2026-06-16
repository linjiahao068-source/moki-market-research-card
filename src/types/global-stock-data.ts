export type GlobalDataSource = 'eastmoney' | 'yahoo' | 'sec-edgar' | 'fmp' | 'sina' | 'tencent' | 'mock';

export interface GlobalStockSearchResult {
  symbol?: string;
  name?: string;
  market?: string;
  secid?: string;
  yahooSymbol?: string;
  eastmoneyCode?: string;
  exchange?: string;
  raw?: unknown;
}

export interface GlobalQuarterFinancial {
  symbol?: string;
  companyName?: string;
  market?: string;
  fiscalYear?: string;
  fiscalQuarter?: string;
  periodEnd?: string;
  reportDate?: string;
  revenue?: number;
  netIncome?: number;
  dilutedEps?: number;
  currency?: string;
  source?: GlobalDataSource;
  sourceLabel?: string;
  raw?: unknown;
  warnings?: string[];
}

export interface GlobalAnalystEstimate {
  symbol?: string;
  fiscalYear?: string;
  fiscalQuarter?: string;
  periodEnd?: string;
  revenueEstimate?: number;
  epsEstimate?: number;
  targetPrice?: number;
  rating?: string;
  source?: GlobalDataSource;
  raw?: unknown;
  warnings?: string[];
}

export interface GlobalGuidanceEvidence {
  symbol?: string;
  title?: string;
  source?: GlobalDataSource;
  url?: string;
  publishedAt?: string;
  snippet?: string;
  evidenceType?: 'news' | 'sec-filing' | 'transcript' | 'analyst-estimate' | 'unknown';
  extracted?: boolean;
  warnings?: string[];
}
