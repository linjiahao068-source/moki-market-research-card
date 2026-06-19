import type { EarningsSnapshotData, GuidanceMetricComparison } from './earnings';
import type { DataQualityReport, EvidenceRecord, FactRecord, LLMResearchInput } from './evidence';
import type { GlobalGuidanceEvidence } from './global-stock-data';
import type { ResearchBrief } from './research-brief';
import type { ResearchSourceInput, TechnicalDataSnapshot } from './research-report';
import type { BullBaseBearScenarioSummary } from './scenario';
import type { SerenityAnalysisBundle } from './serenity';
import type { SerenityMemo } from './serenity-memo';

export interface Evidence {
  id: string;
  sourceLabel: string;
  sourceType: string;
  timestamp: string;
  summary: string;
  confidence: number;
}

export interface NextStep {
  task: string;
  whyItMatters: string;
  followUpDate?: string;
}

export interface Summary {
  oneLine: string;
  currentState: string;
  keyQuestion: string;
  bullCase?: string;
  bearCase?: string;
}

export interface Sentiment {
  heatLevel: number;
  direction: string;
  disagreement: number;
  keyDebates: string[];
}

export interface Fundamentals {
  businessModel: string;
  revenueDrivers: string[];
  keyMetrics: Array<{
    label: string;
    description: string;
    whyItMatters: string;
  }>;
  risks: string[];
}

export interface ResearchEvent {
  type: string;
  title: string;
  description: string;
  impactQuestion: string;
}

export interface Events {
  items: ResearchEvent[];
}

export interface TechnicalContext {
  priceAction: string;
  volume: string;
  optionsIv: string;
  keyZones: Array<{
    type: string;
    level: string;
    note?: string;
  }>;
  note: string;
}

export interface ResearchCard {
  slug: string;
  ticker: string;
  companyName: string;
  title: string;
  subtitle: string;
  cardType: string;
  updatedAt: string;
  isMock: boolean;
  isSnapshot?: boolean;
  generatedAt?: string;
  summary: Summary;
  sentiment: Sentiment;
  fundamentals: Fundamentals;
  events: Events;
  technicalContext: TechnicalContext;
  evidence: Evidence[];
  sourceInputs?: ResearchSourceInput[];
  technicalDataSnapshot?: TechnicalDataSnapshot;
  researchEvidence?: EvidenceRecord[];
  facts?: FactRecord[];
  factQuality?: DataQualityReport;
  llmResearchInput?: LLMResearchInput;
  researchBrief?: ResearchBrief;
  serenityMemo?: SerenityMemo;
  nextSteps: NextStep[];
  disclaimer: string;
  sections?: Array<{
    title: string;
    body: string;
  }>;
  keySignals?: string[];
  risks?: string[];
  sourceNote?: string;
  queryInput?: string;
  market?: string;
  numericCode?: string;
  chineseName?: string;
  matchStatus?: 'matched' | 'unmatched';
  matchType?: 'symbol' | 'numericCode' | 'chineseName';
  // Optional: 估值情景（包含 Serenity 分析）
  valuationScenarios?: SerenityAnalysisBundle;
  serenityAnalysis?: SerenityAnalysisBundle;
  enhancedEarnings?: EarningsSnapshotData;
  guidanceData?: {
    guidance: GuidanceMetricComparison[];
    guidanceEvidence?: GlobalGuidanceEvidence[];
    source?: string;
    confidence?: number;
    warnings?: string[];
  };
  advancedScenarios?: BullBaseBearScenarioSummary;
  dataQuality?: {
    score?: number;
    sourceSummary?: string;
    realDataAvailable?: boolean;
    coverageStatus?: string;
    warnings?: string[];
  };
}
