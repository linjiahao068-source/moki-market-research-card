import type {
  DataCoverageLevel,
  DataFreshnessLevel,
  EvidenceRecord,
  FactQuality,
  FactRecord,
} from './evidence';

export const RESEARCH_REPORT_SCHEMA_VERSION = 'v0.4.5' as const;

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

export type BuySideReportGenerationStatus = 'generated' | 'partial' | 'fallback';

export type BuySideReportGenerationMethod = 'research_report_schema' | 'fallback';

export type BuySideReportBias = 'constructive' | 'balanced' | 'cautious' | 'watch';

export type BuySideReportReviewStatus = 'linked' | 'needs_source' | 'requires_review';

export interface BuySideReportGenerationState {
  status: BuySideReportGenerationStatus;
  method: BuySideReportGenerationMethod;
  generatedAt: string;
  sourceCoverage: ResearchReportSourceIngestionState['coverage'];
  sourceFreshness: ResearchReportSourceIngestionState['freshness'];
  sourceRecordCount: number;
  linkedEvidenceCount: number;
  missingReferenceCount: number;
  reviewRequired: boolean;
  warnings: string[];
}

export interface BuySideReportInvestmentView {
  bias: BuySideReportBias;
  headline: string;
  thesis: string[];
  keyDebates: string[];
  thesisBreakpoints: string[];
  evidenceIds: string[];
  factIds: string[];
  reviewNotes: string[];
}

export interface BuySideReportBusinessQuality {
  positioning: string;
  revenueDrivers: string[];
  financialReadThrough: string[];
  keyRisks: string[];
  evidenceIds: string[];
  factIds: string[];
}

export interface BuySideReportScenario {
  id: 'bull' | 'base' | 'bear';
  label: string;
  probabilityLabel: string;
  narrative: string;
  keyAssumptions: string[];
  evidenceIds: string[];
  factIds: string[];
  reviewNotes: string[];
}

export interface BuySideReportMonitorItem {
  id: string;
  label: string;
  currentState: string;
  whyItMatters: string;
  reviewStatus: BuySideReportReviewStatus;
  evidenceIds: string[];
  factIds: string[];
}

export interface BuySideReportSourceAttribution {
  sourceId: string;
  sourceLabel: string;
  sourceType: string;
  method: ResearchSourceIngestionMethod;
  status: ResearchSourceIngestionRecordStatus;
  evidenceIds: string[];
  factIds: string[];
  note: string;
}

export interface BuySideResearchReport {
  id: string;
  title: string;
  generatedAt: string;
  status: BuySideReportGenerationStatus;
  investmentView: BuySideReportInvestmentView;
  businessQuality: BuySideReportBusinessQuality;
  scenarios: BuySideReportScenario[];
  monitoringPlan: BuySideReportMonitorItem[];
  sourceAttribution: BuySideReportSourceAttribution[];
  missingReferences: ResearchReportMissingReference[];
  generationState: BuySideReportGenerationState;
  disclaimer: string;
}

export type TechnicalDashboardStatus = 'adapted' | 'partial_adapter' | 'mock' | 'partial_mock' | 'blocked';

export type TechnicalDashboardMode =
  | 'technical_data_adapter'
  | 'legacy_context_adapter'
  | 'mock_from_research_report'
  | 'adapter_pending';

export type TechnicalDataProvider =
  | 'legacy_technical_context'
  | 'basic_data_quote'
  | 'market_data_provider'
  | 'none';

export type TechnicalDataAdapterStatus = 'adapted' | 'partial' | 'unavailable';

export type TechnicalDashboardSignal = 'constructive' | 'neutral' | 'caution' | 'missing';

export type TechnicalDashboardIndicatorCategory =
  | 'price_action'
  | 'volume'
  | 'volatility'
  | 'scenario'
  | 'monitoring'
  | 'source_quality';

export type TechnicalDashboardReviewStatus = 'linked' | 'needs_source' | 'requires_review';

export interface TechnicalDashboardSummary {
  status: TechnicalDashboardStatus;
  mode: TechnicalDashboardMode;
  generatedAt: string;
  adapterReady: boolean;
  adapterStatus: TechnicalDataAdapterStatus;
  provider: TechnicalDataProvider;
  liveDataAvailable: boolean;
  dataAsOf?: string;
  sourceRecordCount: number;
  linkedEvidenceCount: number;
  missingReferenceCount: number;
  warningCount: number;
}

export interface TechnicalDashboardIndicator {
  id: string;
  category: TechnicalDashboardIndicatorCategory;
  label: string;
  valueLabel: string;
  state: string;
  signal: TechnicalDashboardSignal;
  reviewStatus: TechnicalDashboardReviewStatus;
  evidenceIds: string[];
  factIds: string[];
  sourceIds: string[];
  note: string;
  provider?: TechnicalDataProvider;
  dataStatus?: TechnicalDataAdapterStatus;
  asOf?: string;
  warnings?: string[];
}

export interface TechnicalDashboardZone {
  id: string;
  label: string;
  level: string;
  zoneType: 'support' | 'resistance' | 'range' | 'watch';
  signal: TechnicalDashboardSignal;
  note?: string;
  provider?: TechnicalDataProvider;
  dataStatus?: TechnicalDataAdapterStatus;
  asOf?: string;
  warnings?: string[];
}

export interface TechnicalDashboardScenarioReadThrough {
  id: string;
  scenarioId: BuySideReportScenario['id'];
  label: string;
  signal: TechnicalDashboardSignal;
  watchItems: string[];
  evidenceIds: string[];
  factIds: string[];
}

export interface TechnicalDataPoint {
  id: string;
  category: TechnicalDashboardIndicatorCategory;
  label: string;
  valueLabel: string;
  rawValue?: string | number;
  unit?: string;
  signal: TechnicalDashboardSignal;
  status: TechnicalDataAdapterStatus;
  provider: TechnicalDataProvider;
  asOf?: string;
  evidenceIds: string[];
  factIds: string[];
  sourceIds: string[];
  warnings: string[];
}

export interface TechnicalDataZone {
  id: string;
  label: string;
  level: string;
  zoneType: TechnicalDashboardZone['zoneType'];
  signal: TechnicalDashboardSignal;
  status: TechnicalDataAdapterStatus;
  provider: TechnicalDataProvider;
  asOf?: string;
  evidenceIds: string[];
  factIds: string[];
  sourceIds: string[];
  warnings: string[];
}

export interface TechnicalDataSnapshot {
  id: string;
  ticker: string;
  provider: TechnicalDataProvider;
  status: TechnicalDataAdapterStatus;
  generatedAt: string;
  dataAsOf?: string;
  liveDataAvailable: boolean;
  points: TechnicalDataPoint[];
  zones: TechnicalDataZone[];
  sourceSummary: string[];
  warnings: string[];
}

export interface TechnicalDashboard {
  id: string;
  title: string;
  status: TechnicalDashboardStatus;
  mode: TechnicalDashboardMode;
  generatedAt: string;
  headline: string;
  summary: TechnicalDashboardSummary;
  dataSnapshot: TechnicalDataSnapshot;
  indicators: TechnicalDashboardIndicator[];
  zones: TechnicalDashboardZone[];
  scenarioReadThrough: TechnicalDashboardScenarioReadThrough[];
  warnings: string[];
  disclaimer: string;
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
  buySideReport: BuySideResearchReport;
  technicalDashboard: TechnicalDashboard;
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
