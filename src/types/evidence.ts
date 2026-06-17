export type EvidenceSourceType =
  | 'api'
  | 'company-filing'
  | 'company-profile'
  | 'earnings-snapshot'
  | 'guidance-source'
  | 'scenario-model'
  | 'derived'
  | 'fallback';

export type FactKind =
  | 'company_profile'
  | 'financial_metric'
  | 'guidance_metric'
  | 'valuation_metric'
  | 'scenario_input'
  | 'scenario_output'
  | 'qualitative_claim'
  | 'source_state';

export type FactUnit =
  | 'USD'
  | 'percent'
  | 'perShare'
  | 'ratio'
  | 'shares'
  | 'text'
  | 'count'
  | 'unknown';

export type FactQuality = 'verified' | 'estimated' | 'extracted' | 'derived' | 'missing' | 'fallback';

export type DataCoverageLevel = 'empty' | 'minimal' | 'partial' | 'strong';

export type DataFreshnessLevel = 'fresh' | 'stale' | 'unknown';

export interface EvidenceRecord {
  id: string;
  ticker?: string;
  source: string;
  sourceType: EvidenceSourceType;
  sourceLabel?: string;
  sourceUrl?: string;
  publishedAt?: string;
  fetchedAt?: string;
  snippet?: string;
  confidence: number;
  extracted?: boolean;
  filingAccession?: string;
  documentType?: string;
  textBlockId?: string;
  warnings: string[];
}

export interface FactRecord {
  id: string;
  ticker?: string;
  kind: FactKind;
  label: string;
  value?: string | number | boolean;
  numericValue?: number;
  unit: FactUnit;
  periodLabel?: string;
  fiscalYear?: string;
  fiscalQuarter?: string;
  source?: string;
  quality: FactQuality;
  confidence: number;
  evidenceIds: string[];
  missingReason?: string;
  warnings: string[];
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface DataQualityReport {
  score: number;
  coverage: DataCoverageLevel;
  freshness: DataFreshnessLevel;
  sourceDiversity: string[];
  factCount: number;
  evidenceCount: number;
  generatedAt: string;
  warnings: string[];
}

export interface LLMResearchInput {
  ticker?: string;
  generatedAt: string;
  facts: FactRecord[];
  evidence: Array<Pick<EvidenceRecord, 'id' | 'source' | 'sourceType' | 'sourceUrl' | 'publishedAt' | 'snippet' | 'confidence'>>;
  dataQuality: DataQualityReport;
  complianceRules: string[];
}

export interface ResearchDataLayer {
  evidence: EvidenceRecord[];
  facts: FactRecord[];
  dataQuality: DataQualityReport;
  llmInput: LLMResearchInput;
}
