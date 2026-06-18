import type {
  ResearchReport,
  ResearchReportClaim,
  ResearchReportSection,
  TechnicalDashboard,
  TechnicalDashboardIndicator,
  TechnicalDashboardReviewStatus,
  TechnicalDashboardScenarioReadThrough,
  TechnicalDashboardSignal,
  TechnicalDashboardStatus,
  TechnicalDashboardZone,
} from '@/types/research-report';

type TechnicalDashboardInput = Omit<ResearchReport, 'technicalDashboard'>;

const TECHNICAL_MOCK_WARNING = 'Technical dashboard is a mock view; real market data adapter is not connected yet.';

function unique(items: Array<string | undefined>) {
  return Array.from(new Set(items.filter(Boolean))) as string[];
}

function sectionById(report: TechnicalDashboardInput, id: ResearchReportSection['id']) {
  return report.sections.find((section) => section.id === id);
}

function claimByTitle(section: ResearchReportSection | undefined, title: string) {
  return section?.claims.find((claim) => claim.title.toLowerCase() === title.toLowerCase());
}

function sourceIdsForEvidence(report: TechnicalDashboardInput, evidenceIds: string[]) {
  if (evidenceIds.length === 0) {
    return [];
  }

  return report.sourceIngestionState.records
    .filter((record) => record.evidenceIds.some((id) => evidenceIds.includes(id)))
    .map((record) => record.sourceId);
}

function reviewStatus(
  report: TechnicalDashboardInput,
  evidenceIds: string[],
  factIds: string[]
): TechnicalDashboardReviewStatus {
  if (evidenceIds.length > 0 || factIds.length > 0) {
    return 'linked';
  }

  if (report.sourceIngestionState.records.length > 0) {
    return 'requires_review';
  }

  return 'needs_source';
}

function textSignal(text: string, fallback: TechnicalDashboardSignal = 'neutral'): TechnicalDashboardSignal {
  const normalized = text.toLowerCase();

  if (
    normalized.includes('weak') ||
    normalized.includes('pressure') ||
    normalized.includes('below') ||
    normalized.includes('elevated') ||
    normalized.includes('risk') ||
    normalized.includes('下') ||
    normalized.includes('弱') ||
    normalized.includes('压力') ||
    normalized.includes('高')
  ) {
    return 'caution';
  }

  if (
    normalized.includes('support') ||
    normalized.includes('above') ||
    normalized.includes('strong') ||
    normalized.includes('breakout') ||
    normalized.includes('up') ||
    normalized.includes('支撑') ||
    normalized.includes('强') ||
    normalized.includes('上')
  ) {
    return 'constructive';
  }

  return fallback;
}

function indicatorFromClaim(
  report: TechnicalDashboardInput,
  claim: ResearchReportClaim | undefined,
  fallbackLabel: string,
  category: TechnicalDashboardIndicator['category'],
  fallbackState: string
): TechnicalDashboardIndicator {
  const evidenceIds = claim?.evidenceIds ?? [];
  const factIds = claim?.factIds ?? [];
  const body = claim?.body ?? fallbackState;

  return {
    id: `technical-${category}`,
    category,
    label: claim?.title ?? fallbackLabel,
    valueLabel: body,
    state: body,
    signal: claim ? textSignal(body) : 'missing',
    reviewStatus: reviewStatus(report, evidenceIds, factIds),
    evidenceIds,
    factIds,
    sourceIds: sourceIdsForEvidence(report, evidenceIds),
    note: claim
      ? 'Mapped from the ResearchReport technical_context section.'
      : 'Missing technical context; adapter should provide this field in v0.4.5.',
  };
}

function indicatorFromMonitor(
  report: TechnicalDashboardInput,
  item: TechnicalDashboardInput['buySideReport']['monitoringPlan'][number],
  index: number
): TechnicalDashboardIndicator {
  return {
    id: `technical-monitor-${index + 1}`,
    category: 'monitoring',
    label: item.label,
    valueLabel: item.currentState,
    state: item.whyItMatters,
    signal: item.reviewStatus === 'linked' ? 'neutral' : 'missing',
    reviewStatus: item.reviewStatus,
    evidenceIds: item.evidenceIds,
    factIds: item.factIds,
    sourceIds: sourceIdsForEvidence(report, item.evidenceIds),
    note: 'Imported from Buy-Side Report monitoring plan.',
  };
}

function zoneType(label: string): TechnicalDashboardZone['zoneType'] {
  const normalized = label.toLowerCase();

  if (normalized.includes('support') || normalized.includes('支撑')) {
    return 'support';
  }

  if (normalized.includes('resistance') || normalized.includes('压力')) {
    return 'resistance';
  }

  if (normalized.includes('range') || normalized.includes('区间')) {
    return 'range';
  }

  return 'watch';
}

function buildZones(report: TechnicalDashboardInput): TechnicalDashboardZone[] {
  const technical = sectionById(report, 'technical_context');

  return (technical?.items ?? []).map((item, index) => ({
    id: `technical-zone-${index + 1}`,
    label: item.title,
    level: item.body,
    zoneType: zoneType(`${item.title} ${item.body}`),
    signal: textSignal(`${item.title} ${item.body}`, 'neutral'),
    note: item.factIds.length > 0 || item.evidenceIds.length > 0
      ? 'Mapped with report references.'
      : 'Mock zone from legacy technical context; adapter evidence pending.',
  }));
}

function scenarioSignal(id: TechnicalDashboardScenarioReadThrough['scenarioId']): TechnicalDashboardSignal {
  if (id === 'bull') {
    return 'constructive';
  }

  if (id === 'bear') {
    return 'caution';
  }

  return 'neutral';
}

function buildScenarioReadThrough(report: TechnicalDashboardInput): TechnicalDashboardScenarioReadThrough[] {
  return report.buySideReport.scenarios.map((scenario) => ({
    id: `technical-scenario-${scenario.id}`,
    scenarioId: scenario.id,
    label: scenario.label,
    signal: scenarioSignal(scenario.id),
    watchItems: unique([
      scenario.narrative,
      ...scenario.keyAssumptions,
      ...scenario.reviewNotes,
    ]).slice(0, 4),
    evidenceIds: scenario.evidenceIds,
    factIds: scenario.factIds,
  }));
}

function dashboardStatus(report: TechnicalDashboardInput): TechnicalDashboardStatus {
  if (report.sourceIngestionState.status === 'fallback' || report.status === 'fallback') {
    return 'blocked';
  }

  if (
    report.evidenceLayer.missingReferences.length > 0 ||
    report.buySideReport.generationState.reviewRequired
  ) {
    return 'partial_mock';
  }

  return 'mock';
}

function buildWarnings(report: TechnicalDashboardInput) {
  return unique([
    TECHNICAL_MOCK_WARNING,
    report.sourceIngestionState.status === 'fallback'
      ? 'Source ingestion is fallback; technical dashboard should not be treated as review-ready.'
      : undefined,
    report.evidenceLayer.missingReferences.length > 0
      ? `${report.evidenceLayer.missingReferences.length} evidence references are still missing.`
      : undefined,
    ...report.sourceIngestionState.warnings,
  ]).slice(0, 8);
}

export function buildTechnicalDashboardMock(report: TechnicalDashboardInput): TechnicalDashboard {
  const technical = sectionById(report, 'technical_context');
  const indicators = [
    indicatorFromClaim(report, claimByTitle(technical, 'Price action'), 'Price Action', 'price_action', 'Price action pending adapter input.'),
    indicatorFromClaim(report, claimByTitle(technical, 'Volume'), 'Volume', 'volume', 'Volume pending adapter input.'),
    indicatorFromClaim(report, claimByTitle(technical, 'Options IV'), 'Options IV', 'volatility', 'Options IV pending adapter input.'),
    ...report.buySideReport.monitoringPlan.slice(0, 4).map((item, index) => indicatorFromMonitor(report, item, index)),
  ];
  const warnings = buildWarnings(report);
  const status = dashboardStatus(report);

  return {
    id: `technical-dashboard-${report.slug}`,
    title: `${report.entity.ticker} Technical Dashboard Mock`,
    status,
    mode: 'mock_from_research_report',
    generatedAt: report.updatedAt,
    headline: technical?.summary ?? 'Technical context is pending adapter input.',
    summary: {
      status,
      mode: 'mock_from_research_report',
      generatedAt: report.updatedAt,
      adapterReady: false,
      sourceRecordCount: report.sourceIngestionState.records.length,
      linkedEvidenceCount: report.evidenceLayer.summary.linkedTargetCount,
      missingReferenceCount: report.evidenceLayer.summary.missingReferenceCount,
      warningCount: warnings.length,
    },
    indicators,
    zones: buildZones(report),
    scenarioReadThrough: buildScenarioReadThrough(report),
    warnings,
    disclaimer: 'Technical dashboard mock is for workflow design only. It does not use live price, volume, options, or trading data and is not investment advice.',
  };
}
