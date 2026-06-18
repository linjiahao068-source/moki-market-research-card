import type {
  BuySideReportBias,
  BuySideReportBusinessQuality,
  BuySideReportGenerationState,
  BuySideReportGenerationStatus,
  BuySideReportInvestmentView,
  BuySideReportMonitorItem,
  BuySideReportScenario,
  BuySideReportSourceAttribution,
  BuySideResearchReport,
  ResearchReport,
  ResearchReportClaim,
  ResearchReportMetric,
  ResearchReportSection,
  ResearchSourceIngestionRecord,
} from '@/types/research-report';

type BuySideReportInput = Omit<ResearchReport, 'buySideReport' | 'technicalDashboard' | 'integratedReport'>;

const BASE_PROBABILITY_LABEL = 'Base case - model pending';
const REVIEW_LIMIT = 8;

function unique(items: Array<string | undefined>) {
  return Array.from(new Set(items.filter(Boolean))) as string[];
}

function sectionById(report: BuySideReportInput, id: ResearchReportSection['id']) {
  return report.sections.find((section) => section.id === id);
}

function compactClaims(section: ResearchReportSection | undefined) {
  return section?.claims.filter((claim) => claim.body.trim().length > 0) ?? [];
}

function compactMetrics(section: ResearchReportSection | undefined) {
  return section?.metrics.filter((metric) => metric.value.trim().length > 0) ?? [];
}

function firstEvidenceIds(report: BuySideReportInput, limit = 4) {
  return unique([
    ...report.evidenceLayer.links.map((link) => link.evidenceId),
    ...report.evidenceReferences.map((reference) => reference.id),
  ]).slice(0, limit);
}

function firstFactIds(report: BuySideReportInput, limit = 6) {
  return unique(report.factReferences.map((fact) => fact.id)).slice(0, limit);
}

function reviewWarnings(report: BuySideReportInput, preferredSources: ResearchSourceIngestionRecord[]) {
  return unique([
    ...report.sourceIngestionState.warnings,
    preferredSources.length === 0
      ? 'No fully ingested preferred source is available; generator output is marked for review.'
      : undefined,
    report.evidenceLayer.missingReferences.length > 0
      ? `${report.evidenceLayer.missingReferences.length} report targets still need evidence references.`
      : undefined,
    report.sourceIngestionState.status === 'fallback'
      ? 'Source ingestion is fallback; do not treat generated wording as final research.'
      : undefined,
  ]).slice(0, REVIEW_LIMIT);
}

function preferredSourceRecords(report: BuySideReportInput) {
  const records = report.sourceIngestionState.records;
  const preferred = records.filter((record) => (
    record.status === 'ingested' &&
    (record.method === 'research_data_layer' || record.method === 'legacy_card')
  ));

  if (preferred.length > 0) {
    return preferred;
  }

  return records.filter((record) => record.status !== 'rejected').slice(0, 6);
}

function generationStatus(report: BuySideReportInput, warnings: string[]): BuySideReportGenerationStatus {
  if (report.status === 'fallback' || report.sourceIngestionState.status === 'fallback') {
    return 'fallback';
  }

  if (
    warnings.length > 0 ||
    report.sourceIngestionState.status !== 'strong' ||
    report.evidenceLayer.missingReferences.length > 0
  ) {
    return 'partial';
  }

  return 'generated';
}

function inferBias(report: BuySideReportInput): BuySideReportBias {
  if (report.status === 'fallback' || report.sourceIngestionState.status === 'fallback') {
    return 'watch';
  }

  const claims = report.sections.flatMap((section) => section.claims);
  const positiveCount = claims.filter((claim) => claim.tone === 'positive').length;
  const cautiousCount = claims.filter((claim) => claim.tone === 'negative' || claim.tone === 'cautious').length;

  if (cautiousCount > positiveCount) {
    return 'cautious';
  }

  if (positiveCount > cautiousCount) {
    return 'constructive';
  }

  return 'balanced';
}

function claimBodies(claims: ResearchReportClaim[], limit: number) {
  return unique(claims.map((claim) => claim.body)).slice(0, limit);
}

function metricSummaries(metrics: ResearchReportMetric[], limit: number) {
  return metrics.map((metric) => `${metric.label}: ${metric.value}`).slice(0, limit);
}

function buildInvestmentView(
  report: BuySideReportInput,
  warnings: string[]
): BuySideReportInvestmentView {
  const executive = sectionById(report, 'executive_summary');
  const scenario = sectionById(report, 'scenario_map');
  const executiveClaims = compactClaims(executive);
  const scenarioClaims = compactClaims(scenario);

  return {
    bias: inferBias(report),
    headline: report.executiveSummary.oneLine,
    thesis: unique([
      report.executiveSummary.currentState,
      report.executiveSummary.keyQuestion,
      ...claimBodies(executiveClaims, 2),
    ]).slice(0, 4),
    keyDebates: unique([
      report.executiveSummary.keyQuestion,
      ...claimBodies(scenarioClaims, 3),
      ...(scenario?.items.map((item) => item.title) ?? []),
    ]).slice(0, 5),
    thesisBreakpoints: unique([
      ...report.followUpResearch.map((task) => task.task),
      ...report.evidenceLayer.missingReferences.map((item) => item.reason),
    ]).slice(0, 5),
    evidenceIds: unique([
      ...(executive?.evidenceIds ?? []),
      ...firstEvidenceIds(report, 4),
    ]).slice(0, 6),
    factIds: unique([
      ...(executive?.factIds ?? []),
      ...firstFactIds(report, 6),
    ]).slice(0, 8),
    reviewNotes: warnings,
  };
}

function buildBusinessQuality(report: BuySideReportInput): BuySideReportBusinessQuality {
  const earnings = sectionById(report, 'earnings_guidance');
  const scenario = sectionById(report, 'scenario_map');
  const metrics = compactMetrics(earnings);

  return {
    positioning: earnings?.summary ?? report.executiveSummary.currentState,
    revenueDrivers: unique([
      ...(scenario?.items.map((item) => item.title) ?? []),
      ...metrics.map((metric) => metric.label),
    ]).slice(0, 6),
    financialReadThrough: metricSummaries(metrics, 6),
    keyRisks: unique([
      report.executiveSummary.bearCase,
      ...report.evidenceLayer.missingReferences.map((item) => item.reason),
      ...report.sourceIngestionState.warnings,
    ]).slice(0, 5),
    evidenceIds: unique([
      ...(earnings?.evidenceIds ?? []),
      ...firstEvidenceIds(report, 4),
    ]).slice(0, 6),
    factIds: unique([
      ...(earnings?.factIds ?? []),
      ...firstFactIds(report, 6),
    ]).slice(0, 8),
  };
}

function scenarioEvidence(report: BuySideReportInput, scenarioId: BuySideReportScenario['id']) {
  const scenario = sectionById(report, 'scenario_map');
  const matchedClaim = scenario?.claims.find((claim) => claim.id.includes(scenarioId));

  return {
    evidenceIds: unique([...(matchedClaim?.evidenceIds ?? []), ...firstEvidenceIds(report, 3)]).slice(0, 4),
    factIds: unique([...(matchedClaim?.factIds ?? []), ...firstFactIds(report, 4)]).slice(0, 5),
  };
}

function buildScenarios(report: BuySideReportInput): BuySideReportScenario[] {
  const scenario = sectionById(report, 'scenario_map');
  const scenarioItems = scenario?.items.map((item) => item.title) ?? [];
  const reviewNotes = report.sourceIngestionState.status === 'strong'
    ? []
    : ['Scenario probabilities are placeholders until a dedicated scenario model is connected.'];

  return [
    {
      id: 'bull',
      label: 'Bull',
      probabilityLabel: BASE_PROBABILITY_LABEL,
      narrative: report.executiveSummary.bullCase ?? 'Bull case requires additional evidence before publication.',
      keyAssumptions: unique([
        report.executiveSummary.bullCase,
        ...scenarioItems.slice(0, 3),
      ]).slice(0, 4),
      ...scenarioEvidence(report, 'bull'),
      reviewNotes,
    },
    {
      id: 'base',
      label: 'Base',
      probabilityLabel: BASE_PROBABILITY_LABEL,
      narrative: report.executiveSummary.currentState,
      keyAssumptions: unique([
        report.executiveSummary.currentState,
        report.executiveSummary.keyQuestion,
        ...scenarioItems.slice(0, 2),
      ]).slice(0, 4),
      ...scenarioEvidence(report, 'base'),
      reviewNotes,
    },
    {
      id: 'bear',
      label: 'Bear',
      probabilityLabel: BASE_PROBABILITY_LABEL,
      narrative: report.executiveSummary.bearCase ?? 'Bear case requires additional evidence before publication.',
      keyAssumptions: unique([
        report.executiveSummary.bearCase,
        ...report.evidenceLayer.missingReferences.map((item) => item.reason),
      ]).slice(0, 4),
      ...scenarioEvidence(report, 'bear'),
      reviewNotes,
    },
  ];
}

function monitorStatus(item: { evidenceIds: string[]; factIds: string[] }): BuySideReportMonitorItem['reviewStatus'] {
  if (item.evidenceIds.length > 0 || item.factIds.length > 0) {
    return 'linked';
  }

  return 'needs_source';
}

function buildMonitoringPlan(report: BuySideReportInput): BuySideReportMonitorItem[] {
  const earnings = sectionById(report, 'earnings_guidance');
  const metricMonitors = compactMetrics(earnings).slice(0, 5).map((metric) => ({
    id: `monitor-${metric.id}`,
    label: metric.label,
    currentState: metric.value,
    whyItMatters: metric.whyItMatters ?? metric.description ?? 'Track as part of the evidence-backed research loop.',
    reviewStatus: monitorStatus(metric),
    evidenceIds: metric.evidenceIds,
    factIds: metric.factIds,
  }));

  const followUpMonitors = report.followUpResearch.slice(0, 4).map((task) => ({
    id: `monitor-${task.id}`,
    label: task.task,
    currentState: task.followUpDate ?? 'follow-up pending',
    whyItMatters: task.whyItMatters,
    reviewStatus: monitorStatus(task),
    evidenceIds: task.evidenceIds,
    factIds: task.factIds,
  }));

  return [...metricMonitors, ...followUpMonitors].slice(0, 8);
}

function sourceNote(record: ResearchSourceIngestionRecord) {
  if (record.status === 'ingested') {
    return 'Usable source record for generated report sections.';
  }

  if (record.status === 'fallback') {
    return 'Fallback source; replace before publication-quality research.';
  }

  return 'Partial source record; review source detail before reuse.';
}

function buildSourceAttribution(records: ResearchSourceIngestionRecord[]): BuySideReportSourceAttribution[] {
  return records.slice(0, 10).map((record) => ({
    sourceId: record.sourceId,
    sourceLabel: record.sourceLabel,
    sourceType: record.sourceType,
    method: record.method,
    status: record.status,
    evidenceIds: record.evidenceIds,
    factIds: record.factIds,
    note: sourceNote(record),
  }));
}

export function generateBuySideReport(report: BuySideReportInput): BuySideResearchReport {
  const preferredSources = preferredSourceRecords(report);
  const warnings = reviewWarnings(report, preferredSources);
  const status = generationStatus(report, warnings);
  const generationState: BuySideReportGenerationState = {
    status,
    method: status === 'fallback' ? 'fallback' : 'research_report_schema',
    generatedAt: report.updatedAt,
    sourceCoverage: report.sourceIngestionState.coverage,
    sourceFreshness: report.sourceIngestionState.freshness,
    sourceRecordCount: report.sourceIngestionState.records.length,
    linkedEvidenceCount: report.evidenceLayer.summary.linkedTargetCount,
    missingReferenceCount: report.evidenceLayer.summary.missingReferenceCount,
    reviewRequired: status !== 'generated' || warnings.length > 0,
    warnings,
  };

  return {
    id: `buy-side-report-${report.slug}`,
    title: `${report.entity.ticker} Buy-Side Research Report`,
    generatedAt: report.updatedAt,
    status,
    investmentView: buildInvestmentView(report, warnings),
    businessQuality: buildBusinessQuality(report),
    scenarios: buildScenarios(report),
    monitoringPlan: buildMonitoringPlan(report),
    sourceAttribution: buildSourceAttribution(preferredSources),
    missingReferences: report.evidenceLayer.missingReferences.slice(0, REVIEW_LIMIT),
    generationState,
    disclaimer: `${report.disclaimer} Generated from ResearchReport schema for research workflow use only; this is not investment advice, a rating, or a trading instruction.`,
  };
}
