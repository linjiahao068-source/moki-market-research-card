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
  TechnicalDataAdapterStatus,
  TechnicalDataPoint,
  TechnicalDataProvider,
  TechnicalDataSnapshot,
  TechnicalDataZone,
} from '@/types/research-report';

type TechnicalAdapterInput = Omit<ResearchReport, 'technicalDashboard' | 'integratedReport'>;

const LEGACY_PROVIDER: TechnicalDataProvider = 'legacy_technical_context';
const ADAPTER_WARNING = 'Technical Structure Dashboard fell back to ResearchReport context because no live technical snapshot is available.';
const LIVE_DATA_WARNING = 'Yahoo chart K-line adapter is available in v0.5.2, but this report is using the legacy technical-context fallback.';

function unique(items: Array<string | undefined>) {
  return Array.from(new Set(items.filter(Boolean))) as string[];
}

function sectionById(report: TechnicalAdapterInput, id: ResearchReportSection['id']) {
  return report.sections.find((section) => section.id === id);
}

function claimByTitle(section: ResearchReportSection | undefined, title: string) {
  return section?.claims.find((claim) => claim.title.toLowerCase() === title.toLowerCase());
}

function sourceIdsForEvidence(report: TechnicalAdapterInput, evidenceIds: string[]) {
  if (evidenceIds.length === 0) {
    return [];
  }

  return report.sourceIngestionState.records
    .filter((record) => record.evidenceIds.some((id) => evidenceIds.includes(id)))
    .map((record) => record.sourceId);
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

function adapterStatus(hasValue: boolean, hasWarnings: boolean): TechnicalDataAdapterStatus {
  if (!hasValue) {
    return 'unavailable';
  }

  return hasWarnings ? 'partial' : 'adapted';
}

function pointFromClaim(
  report: TechnicalAdapterInput,
  claim: ResearchReportClaim | undefined,
  category: TechnicalDashboardIndicator['category'],
  label: string
): TechnicalDataPoint {
  const evidenceIds = claim?.evidenceIds ?? [];
  const factIds = claim?.factIds ?? [];
  const valueLabel = claim?.body ?? `${label} unavailable until technical provider is connected.`;
  const warnings = claim
    ? ['Adapted from legacy technical context; verify with market data provider before publishing.']
    : [`${label} is missing from technical context.`];

  return {
    id: `technical-data-${category}`,
    category,
    label: claim?.title ?? label,
    valueLabel,
    signal: claim ? textSignal(valueLabel) : 'missing',
    status: adapterStatus(Boolean(claim), warnings.length > 0),
    provider: LEGACY_PROVIDER,
    asOf: report.updatedAt,
    evidenceIds,
    factIds,
    sourceIds: sourceIdsForEvidence(report, evidenceIds),
    warnings,
  };
}

function zoneFromSectionItem(
  report: TechnicalAdapterInput,
  item: ResearchReportSection['items'][number],
  index: number
): TechnicalDataZone {
  const sourceIds = sourceIdsForEvidence(report, item.evidenceIds);
  const combined = `${item.title} ${item.body}`;

  return {
    id: `technical-data-zone-${index + 1}`,
    label: item.title,
    level: item.body,
    zoneType: zoneType(combined),
    signal: textSignal(combined, 'neutral'),
    status: 'partial',
    provider: LEGACY_PROVIDER,
    asOf: report.updatedAt,
    evidenceIds: item.evidenceIds,
    factIds: item.factIds,
    sourceIds,
    warnings: ['Zone adapted from legacy technical context; calculated technical levels are not connected yet.'],
  };
}

function buildSnapshot(report: TechnicalAdapterInput): TechnicalDataSnapshot {
  const liveSnapshot = report.technicalDataSnapshot;

  if (liveSnapshot?.liveDataAvailable && liveSnapshot.status !== 'unavailable') {
    return liveSnapshot;
  }

  const technical = sectionById(report, 'technical_context');
  const points = [
    pointFromClaim(report, claimByTitle(technical, 'Price action'), 'price_action', 'Price Action'),
    pointFromClaim(report, claimByTitle(technical, 'Volume'), 'volume', 'Volume'),
    pointFromClaim(report, claimByTitle(technical, 'Options IV'), 'volatility', 'Options IV'),
  ];
  const zones = (technical?.items ?? []).map((item, index) => zoneFromSectionItem(report, item, index));
  const warnings = unique([
    ADAPTER_WARNING,
    LIVE_DATA_WARNING,
    ...(liveSnapshot?.warnings ?? []),
    ...points.flatMap((point) => point.warnings),
    ...zones.flatMap((zone) => zone.warnings),
  ]).slice(0, 10);

  return {
    id: `technical-data-${report.slug}`,
    ticker: report.entity.ticker,
    provider: LEGACY_PROVIDER,
    status: points.some((point) => point.status === 'adapted' || point.status === 'partial') ? 'partial' : 'unavailable',
    generatedAt: report.updatedAt,
    dataAsOf: report.updatedAt,
    liveDataAvailable: false,
    points,
    zones,
    sourceSummary: unique([
      'legacy technical context',
      ...report.sourceIngestionState.sourceSummary,
    ]).slice(0, 8),
    warnings,
  };
}

function reviewStatus(point: TechnicalDataPoint): TechnicalDashboardReviewStatus {
  if (point.evidenceIds.length > 0 || point.factIds.length > 0 || point.sourceIds.length > 0) {
    return 'linked';
  }

  return point.status === 'unavailable' ? 'needs_source' : 'requires_review';
}

function indicatorFromPoint(point: TechnicalDataPoint): TechnicalDashboardIndicator {
  const isMarketData = point.provider === 'market_data_provider';

  return {
    id: `technical-${point.category}`,
    category: point.category,
    label: point.label,
    valueLabel: point.valueLabel,
    state: point.valueLabel,
    signal: point.signal,
    reviewStatus: reviewStatus(point),
    evidenceIds: point.evidenceIds,
    factIds: point.factIds,
    sourceIds: point.sourceIds,
    note: point.status === 'unavailable'
      ? 'Technical data adapter could not map this field.'
      : isMarketData
        ? 'Calculated from Yahoo chart K-line data through the v0.5.2 technical adapter.'
        : 'Mapped through the legacy ResearchReport technical-context fallback.',
    provider: point.provider,
    dataStatus: point.status,
    asOf: point.asOf,
    warnings: point.warnings,
  };
}

function indicatorFromMonitor(
  report: TechnicalAdapterInput,
  item: TechnicalAdapterInput['buySideReport']['monitoringPlan'][number],
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
    note: 'Imported from Buy-Side Report monitoring plan after technical data adaptation.',
    provider: 'none',
    dataStatus: item.reviewStatus === 'linked' ? 'adapted' : 'partial',
    asOf: report.updatedAt,
    warnings: item.reviewStatus === 'linked' ? [] : ['Monitoring item still needs direct source linkage.'],
  };
}

function zoneFromDataZone(zone: TechnicalDataZone): TechnicalDashboardZone {
  const isMarketData = zone.provider === 'market_data_provider';

  return {
    id: zone.id.replace('technical-data-', 'technical-'),
    label: zone.label,
    level: zone.level,
    zoneType: zone.zoneType,
    signal: zone.signal,
    note: isMarketData
      ? 'Calculated from Yahoo chart K-line data through the v0.5.2 technical adapter.'
      : 'Mapped through the legacy ResearchReport technical-context fallback.',
    provider: zone.provider,
    dataStatus: zone.status,
    asOf: zone.asOf,
    warnings: zone.warnings,
  };
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

function buildScenarioReadThrough(report: TechnicalAdapterInput): TechnicalDashboardScenarioReadThrough[] {
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

function dashboardStatus(snapshot: TechnicalDataSnapshot, report: TechnicalAdapterInput): TechnicalDashboardStatus {
  if (report.sourceIngestionState.status === 'fallback' || report.status === 'fallback') {
    return 'blocked';
  }

  if (snapshot.status === 'unavailable') {
    return 'blocked';
  }

  if (snapshot.provider === 'market_data_provider' && snapshot.liveDataAvailable) {
    if (snapshot.status === 'adapted' && report.evidenceLayer.missingReferences.length === 0) {
      return 'adapted';
    }

    return 'partial_adapter';
  }

  if (snapshot.status === 'partial' || report.evidenceLayer.missingReferences.length > 0) {
    return 'partial_mock';
  }

  return 'mock';
}

function dashboardMode(snapshot: TechnicalDataSnapshot): TechnicalDashboard['mode'] {
  if (snapshot.provider === 'market_data_provider' && snapshot.liveDataAvailable) {
    return 'technical_data_adapter';
  }

  if (snapshot.provider === LEGACY_PROVIDER) {
    return 'mock_from_research_report';
  }

  return 'adapter_pending';
}

function dashboardHeadline(technical: ResearchReportSection | undefined, snapshot: TechnicalDataSnapshot) {
  if (snapshot.provider === 'market_data_provider' && snapshot.liveDataAvailable) {
    return `Yahoo chart K-line adapter is live as of ${snapshot.dataAsOf?.slice(0, 10) ?? 'latest available session'}; ${technical?.summary ?? 'technical context is linked to market data.'}`;
  }

  return technical?.summary ?? 'Technical context is pending market data adapter input.';
}

function dashboardDisclaimer(snapshot: TechnicalDataSnapshot) {
  if (snapshot.provider === 'market_data_provider' && snapshot.liveDataAvailable) {
    return 'Technical Structure Dashboard uses Yahoo chart K-line data and calculated indicators for research workflow context only. It is not investment advice, a rating, or a trading instruction.';
  }

  return 'Technical Structure Dashboard output is a fallback mock for research workflow design only. Live market data was not available for this report and the output is not investment advice.';
}

export function buildTechnicalDashboardFromAdapter(report: TechnicalAdapterInput): TechnicalDashboard {
  const technical = sectionById(report, 'technical_context');
  const snapshot = buildSnapshot(report);
  const status = dashboardStatus(snapshot, report);
  const mode = dashboardMode(snapshot);
  const indicators = [
    ...snapshot.points.map(indicatorFromPoint),
    ...report.buySideReport.monitoringPlan.slice(0, 4).map((item, index) => indicatorFromMonitor(report, item, index)),
  ];
  const warnings = unique([
    ...snapshot.warnings,
    report.evidenceLayer.missingReferences.length > 0
      ? `${report.evidenceLayer.missingReferences.length} evidence references are still missing.`
      : undefined,
    ...report.sourceIngestionState.warnings,
  ]).slice(0, 10);

  return {
    id: `technical-dashboard-${report.slug}`,
    title: `${report.entity.ticker} Technical Structure Dashboard`,
    status,
    mode,
    generatedAt: report.updatedAt,
    headline: dashboardHeadline(technical, snapshot),
    summary: {
      status,
      mode,
      generatedAt: report.updatedAt,
      adapterReady: snapshot.status !== 'unavailable',
      adapterStatus: snapshot.status,
      provider: snapshot.provider,
      liveDataAvailable: snapshot.liveDataAvailable,
      dataAsOf: snapshot.dataAsOf,
      sourceRecordCount: report.sourceIngestionState.records.length,
      linkedEvidenceCount: report.evidenceLayer.summary.linkedTargetCount,
      missingReferenceCount: report.evidenceLayer.summary.missingReferenceCount,
      warningCount: warnings.length,
    },
    dataSnapshot: snapshot,
    indicators,
    zones: snapshot.zones.map(zoneFromDataZone),
    scenarioReadThrough: buildScenarioReadThrough(report),
    warnings,
    disclaimer: dashboardDisclaimer(snapshot),
  };
}
