import type {
  DataCoverageLevel,
  DataFreshnessLevel,
  EvidenceRecord,
  FactQuality,
  FactRecord,
} from './evidence';

export const RESEARCH_REPORT_SCHEMA_VERSION = 'v0.4.2' as const;

export type ResearchReportSchemaVersion = typeof RESEARCH_REPORT_SCHEMA_VERSION;

export type ResearchReportType = 'executive-investment-view';

export type ResearchReportStatus = 'snapshot' | 'generated' | 'fallback';

export type ResearchReportSectionId =
  | 'executive_summary'
  | 'earnings_guidance'
  | 'scenario_map'
  | 'evidence_references'
  | 'technical_context'
  | 'follow_up_research'
  | 'disclaimer';

export type ResearchReportTone = 'positive' | 'neutral' | 'negative' | 'watch' | 'cautious';

export type SourceIngestionStatus = 'not_started' | 'partial' | 'strong' | 'fallback';

export type EvidenceWeight = 'primary' | 'supporting' | 'context' | 'fallback';

export type ResearchSourceIngestionMethod =
  | 'legacy_card'
  | 'research_data_layer'
  | 'manual_entry'
  | 'fallback';

export type ResearchSourceIngestionRecordStatus =
  | 'ingested'
  | 'partial'
  | 'fallback'
  | 'missing'
  | 'rejected';

export type ResearchReportReferenceKind =
  | 'claim'
  | 'metric'
  | 'section_item'
  | 'follow_up_task';

export type ResearchReportEvidenceRelation = 'supports' | 'source' | 'context' | 'requires_review';

export type ResearchReportEvidenceLinkStatus = 'linked' | 'missing_source' | 'fallback_source' | 'needs_review';

export type ResearchReportMissingReferenceSeverity = 'info' | 'warning' | 'blocking';

export interface ResearchReportEntity {
  ticker: string;
  companyName: string;
  market?: string;
  numericCode?: string;
  chineseName?: string;
}

export interface ResearchReportExecutiveSummary {
  oneLine: string;
  currentState: string;
  keyQuestion: string;
  bullCase?: string;
  bearCase?: string;
}

export interface ResearchReportSourceIngestionState {
  status: SourceIngestionStatus;
  method: ResearchSourceIngestionMethod;
  coverage: DataCoverageLevel | 'unknown';
  freshness: DataFreshnessLevel | 'unknown';
  lastIngestedAt?: string;
  sourceSummary: string[];
  warnings: string[];
  records: ResearchSourceIngestionRecord[];
}

export interface ResearchSourceIngestionRecord {
  id: string;
  sourceId: string;
  title: string;
  sourceLabel: string;
  sourceType: string;
  method: ResearchSourceIngestionMethod;
  status: ResearchSourceIngestionRecordStatus;
  sourceUrl?: string;
  publishedAt?: string;
  fetchedAt?: string;
  snippet?: string;
  evidenceIds: string[];
  factIds: string[];
  warnings: string[];
}

export interface ResearchReportEvidenceReference {
  id: string;
  title: string;
  sourceLabel: string;
  sourceType: string;
  sourceUrl?: string;
  publishedAt?: string;
  fetchedAt?: string;
  snippet?: string;
  sourceQuality: FactQuality | 'unknown';
  evidenceWeight: EvidenceWeight;
  warnings: string[];
}

export interface ResearchReportFactReference {
  id: string;
  kind: FactRecord['kind'];
  label: string;
  value?: FactRecord['value'];
  numericValue?: number;
  unit: FactRecord['unit'];
  periodLabel?: string;
  source?: string;
  quality: FactQuality;
  evidenceIds: string[];
  warnings: string[];
}

export interface ResearchReportMetric {
  id: string;
  label: string;
  value: string;
  description?: string;
  whyItMatters?: string;
  factIds: string[];
  evidenceIds: string[];
}

export interface ResearchReportClaim {
  id: string;
  title: string;
  body: string;
  tone: ResearchReportTone;
  factIds: string[];
  evidenceIds: string[];
}

export interface ResearchReportSectionItem {
  id: string;
  title: string;
  body: string;
  evidenceIds: string[];
  factIds: string[];
}

export interface ResearchReportSection {
  id: ResearchReportSectionId;
  title: string;
  summary: string;
  claims: ResearchReportClaim[];
  metrics: ResearchReportMetric[];
  items: ResearchReportSectionItem[];
  missingData: string[];
  evidenceIds: string[];
  factIds: string[];
}

export interface ResearchReportFollowUpTask {
  id: string;
  task: string;
  whyItMatters: string;
  followUpDate?: string;
  evidenceIds: string[];
  factIds: string[];
}

export interface ResearchReportReferenceTarget {
  kind: ResearchReportReferenceKind;
  sectionId?: ResearchReportSectionId;
  id: string;
  label: string;
}

export interface ResearchReportEvidenceLink {
  id: string;
  evidenceId: string;
  factIds: string[];
  target: ResearchReportReferenceTarget;
  relation: ResearchReportEvidenceRelation;
  status: ResearchReportEvidenceLinkStatus;
  note: string;
  warnings: string[];
}

export interface ResearchReportMissingReference {
  id: string;
  target: ResearchReportReferenceTarget;
  reason: string;
  severity: ResearchReportMissingReferenceSeverity;
  factIds: string[];
}

export interface ResearchReportEvidenceLayerSummary {
  evidenceReferenceCount: number;
  factReferenceCount: number;
  linkedTargetCount: number;
  missingReferenceCount: number;
  fallbackEvidenceCount: number;
  warningCount: number;
}

export interface ResearchReportEvidenceLayer {
  summary: ResearchReportEvidenceLayerSummary;
  links: ResearchReportEvidenceLink[];
  missingReferences: ResearchReportMissingReference[];
}

export interface ResearchReportLegacyLinks {
  researchCardSlug?: string;
  researchCardType?: string;
}

export interface ResearchReport {
  schemaVersion: ResearchReportSchemaVersion;
  id: string;
  slug: string;
  reportType: ResearchReportType;
  status: ResearchReportStatus;
  title: string;
  subtitle: string;
  entity: ResearchReportEntity;
  generatedAt: string;
  updatedAt: string;
  executiveSummary: ResearchReportExecutiveSummary;
  sourceIngestionState: ResearchReportSourceIngestionState;
  sections: ResearchReportSection[];
  evidenceReferences: ResearchReportEvidenceReference[];
  factReferences: ResearchReportFactReference[];
  evidenceLayer: ResearchReportEvidenceLayer;
  followUpResearch: ResearchReportFollowUpTask[];
  disclaimer: string;
  legacy?: ResearchReportLegacyLinks;
}

export type ResearchReportEvidenceInput = EvidenceRecord | {
  id: string;
  sourceLabel: string;
  sourceType: string;
  timestamp: string;
  summary: string;
  confidence: number;
};
